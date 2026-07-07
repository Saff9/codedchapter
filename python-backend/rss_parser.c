/*
 * rss_parser.c
 * ============
 * A minimal RSS feed parser written in C99.
 *
 * Called from Python via ctypes. Takes raw RSS/XML bytes, returns a
 * JSON array string that Python deserialises into Post objects.
 *
 * Compile:
 *   gcc -O2 -shared -fPIC -o rss_parser.so rss_parser.c
 *
 * Two functions are exported:
 *   char* parse_rss_xml(const char* xml, int xml_len, int* out_count)
 *   void  free_rss_result(char* ptr)
 *
 * The caller (Python) must call free_rss_result() after consuming the string.
 * All heap memory is owned by this module — nothing leaks into Python's heap.
 *
 * Design constraints:
 *   - No external dependencies. Pure C99 standard library only.
 *   - No global mutable state. Thread-safe.
 *   - All buffers are bounds-checked. No sprintf without size limits.
 *   - The output is always valid JSON (or an empty array "[]" on any error).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ── Constants ──────────────────────────────────────────────────────────────── */

/* Maximum number of RSS items we process per feed call.
   Substack rarely has more than 50 posts in an RSS feed. */
#define MAX_POSTS 200

/* Maximum byte length for each extracted field.
   Titles/excerpts beyond this are truncated, which is fine for our use case. */
#define MAX_FIELD  4096
#define MAX_TAGS   512
#define MAX_SLUG   256
#define MAX_DATE   64
#define MAX_IMG    1024

/* Words per minute — used to estimate reading time. */
#define WPM 200

/* ── Tech keyword list ──────────────────────────────────────────────────────── */
/*
 * If any tag from the RSS <category> elements contains one of these substrings,
 * the post is classified as "tech". Otherwise "general".
 * All comparisons are done in lowercase.
 */
static const char* TECH_KEYWORDS[] = {
    "tech", "cod", "program", "dev", "python", "javascript", "html",
    "css", "web", "software", "git", "react", "node", "typescript",
    "backend", "frontend", "database", "linux", "api", NULL
};


/* ── String helpers ──────────────────────────────────────────────────────────── */

/*
 * Find the first occurrence of needle inside haystack[0..haystack_len).
 * Case-insensitive. Returns pointer into haystack or NULL if not found.
 * We can't use strcasestr because it's a GNU extension and not in C99.
 */
static const char* find_ci(const char* haystack, int haystack_len,
                            const char* needle, int needle_len) {
    if (needle_len == 0 || haystack_len < needle_len) return NULL;

    for (int i = 0; i <= haystack_len - needle_len; i++) {
        int j = 0;
        while (j < needle_len && tolower((unsigned char)haystack[i + j])
                               == tolower((unsigned char)needle[j])) {
            j++;
        }
        if (j == needle_len) return haystack + i;
    }
    return NULL;
}

/*
 * Lowercase the string in-place (modifies in_place[0..len)).
 */
static void to_lower(char* s, int len) {
    for (int i = 0; i < len; i++) {
        s[i] = (char)tolower((unsigned char)s[i]);
    }
}

/*
 * Trim leading and trailing whitespace in-place.
 * Returns the new length.
 */
static int trim(char* s, int len) {
    int start = 0, end = len - 1;
    while (start <= end && isspace((unsigned char)s[start])) start++;
    while (end >= start && isspace((unsigned char)s[end]))   end--;
    int new_len = end - start + 1;
    if (new_len <= 0) { s[0] = '\0'; return 0; }
    if (start > 0) memmove(s, s + start, (size_t)new_len);
    s[new_len] = '\0';
    return new_len;
}

/*
 * Strip all HTML tags from src, write plain text into dst.
 * dst must have at least src_len + 1 bytes.
 * Returns the number of bytes written (not including null terminator).
 */
static int strip_html(const char* src, int src_len, char* dst) {
    int in_tag = 0, out = 0;
    for (int i = 0; i < src_len; i++) {
        if (src[i] == '<') { in_tag = 1; continue; }
        if (src[i] == '>') { in_tag = 0; continue; }
        if (!in_tag) {
            dst[out++] = src[i];
        }
    }
    dst[out] = '\0';
    return out;
}

/*
 * Count whitespace-separated words in a string.
 * Used for reading time estimation.
 */
static int count_words(const char* s, int len) {
    int count = 0, in_word = 0;
    for (int i = 0; i < len; i++) {
        if (isspace((unsigned char)s[i])) {
            in_word = 0;
        } else if (!in_word) {
            in_word = 1;
            count++;
        }
    }
    return count;
}

/*
 * Escape a string for safe JSON embedding.
 * Writes into dst (which must be at least 2*src_len+1 bytes).
 * Returns length written.
 */
static int json_escape(const char* src, int src_len, char* dst) {
    int out = 0;
    for (int i = 0; i < src_len; i++) {
        unsigned char c = (unsigned char)src[i];
        if      (c == '"')  { dst[out++] = '\\'; dst[out++] = '"';  }
        else if (c == '\\') { dst[out++] = '\\'; dst[out++] = '\\'; }
        else if (c == '\n') { dst[out++] = '\\'; dst[out++] = 'n';  }
        else if (c == '\r') { dst[out++] = '\\'; dst[out++] = 'r';  }
        else if (c == '\t') { dst[out++] = '\\'; dst[out++] = 't';  }
        else if (c < 0x20)  { /* skip other control chars */ }
        else                { dst[out++] = (char)c; }
    }
    dst[out] = '\0';
    return out;
}


/* ── XML field extraction ─────────────────────────────────────────────────── */

/*
 * Extract text content between the first matching open and close tag pair.
 * Handles <![CDATA[...]]> sections transparently.
 * out must have at least MAX_FIELD+1 bytes. Returns length written.
 */
static int extract_tag(const char* xml, int xml_len,
                        const char* tag, char* out) {
    /* Build open/close tag strings */
    char open_tag[64], close_tag[64];
    snprintf(open_tag,  sizeof(open_tag),  "<%s",  tag);
    snprintf(close_tag, sizeof(close_tag), "</%s>", tag);
    int open_len  = (int)strlen(open_tag);
    int close_len = (int)strlen(close_tag);

    const char* start = find_ci(xml, xml_len, open_tag, open_len);
    if (!start) { out[0] = '\0'; return 0; }

    /* Advance past the opening tag (to the closing '>' of the open tag) */
    const char* inner = memchr(start, '>', (size_t)(xml_len - (int)(start - xml)));
    if (!inner) { out[0] = '\0'; return 0; }
    inner++; /* point to content start */

    int remaining = xml_len - (int)(inner - xml);
    const char* end = find_ci(inner, remaining, close_tag, close_len);
    if (!end) { out[0] = '\0'; return 0; }

    int content_len = (int)(end - inner);

    /* Unwrap CDATA if present */
    const char* cdata_start = NULL;
    if (content_len >= 9) {
        cdata_start = find_ci(inner, content_len, "<![CDATA[", 9);
    }
    if (cdata_start) {
        const char* cdata_end = find_ci(cdata_start + 9,
                                        content_len - (int)(cdata_start - inner) - 9,
                                        "]]>", 3);
        if (cdata_end) {
            inner       = cdata_start + 9;
            content_len = (int)(cdata_end - inner);
        }
    }

    /* Copy and truncate to MAX_FIELD */
    int copy_len = content_len < MAX_FIELD ? content_len : MAX_FIELD;
    memcpy(out, inner, (size_t)copy_len);
    out[copy_len] = '\0';
    return trim(out, copy_len);
}

/*
 * Extract the canonical URL from an RSS <link> or <guid> element.
 * <link> in RSS 2.0 is just bare text — no CDATA, no attributes.
 */
static int extract_link(const char* xml, int xml_len, char* out) {
    /* Try <link>URL</link> */
    int n = extract_tag(xml, xml_len, "link", out);
    if (n > 0 && strncmp(out, "http", 4) == 0) return n;

    /* Try <guid>URL</guid> */
    n = extract_tag(xml, xml_len, "guid", out);
    if (n > 0 && strncmp(out, "http", 4) == 0) return n;

    out[0] = '\0';
    return 0;
}

/*
 * Find the first <img src="..."> or <img data-src="..."> URL in html.
 * Returns 0 if none found.
 */
static int extract_first_img(const char* html, int html_len, char* out) {
    /* Look for <img ... src="..." first */
    static const char* patterns[] = { "src=\"", "src='",
                                      "data-src=\"", "data-src='", NULL };
    for (int p = 0; patterns[p]; p++) {
        int pat_len = (int)strlen(patterns[p]);
        const char* found = find_ci(html, html_len, patterns[p], pat_len);
        if (!found) continue;

        /* Only accept if it's inside an <img ...> tag */
        /* Walk backwards to find the nearest '<' */
        const char* scan = found;
        while (scan > html && *scan != '<') scan--;
        if (scan == html && *scan != '<') continue;
        /* Check it's an img tag */
        if (find_ci(scan, (int)(found - scan) + pat_len, "img", 3) == NULL) continue;

        const char* url_start = found + pat_len;
        char quote = (patterns[p][pat_len - 1] == '"') ? '"' : '\'';
        const char* url_end = memchr(url_start, quote,
                                     (size_t)(html_len - (int)(url_start - html)));
        if (!url_end) continue;

        int url_len = (int)(url_end - url_start);
        if (url_len < 7 || url_len > MAX_IMG) continue;
        if (strncmp(url_start, "http", 4) != 0) continue;

        memcpy(out, url_start, (size_t)url_len);
        out[url_len] = '\0';
        return url_len;
    }

    out[0] = '\0';
    return 0;
}

/*
 * Build a URL-safe slug from a title string.
 * e.g. "Hello, World! My first post" -> "hello-world-my-first-post"
 * Result is written into slug[0..MAX_SLUG).
 */
static void make_slug(const char* title, int title_len, char* slug) {
    int out = 0;
    int last_was_dash = 1; /* avoid leading dash */
    for (int i = 0; i < title_len && out < MAX_SLUG - 1; i++) {
        unsigned char c = (unsigned char)title[i];
        if (isalnum(c)) {
            slug[out++] = (char)tolower(c);
            last_was_dash = 0;
        } else if (!last_was_dash) {
            slug[out++] = '-';
            last_was_dash = 1;
        }
    }
    /* Trim trailing dash */
    while (out > 0 && slug[out - 1] == '-') out--;
    slug[out] = '\0';
}

/*
 * Classify category from a comma-separated lowercase tag string.
 * Returns "tech" if any tag contains a tech keyword, "general" otherwise.
 */
static const char* classify_category(const char* tags_lower) {
    for (int i = 0; TECH_KEYWORDS[i]; i++) {
        if (strstr(tags_lower, TECH_KEYWORDS[i])) return "tech";
    }
    return "general";
}

/*
 * Extract all <category> values from an RSS item chunk.
 * Writes comma-separated lowercase tags into out.
 * Returns length written.
 */
static int extract_categories(const char* item, int item_len, char* out) {
    int total = 0;
    char tag_buf[MAX_FIELD];
    const char* search_pos = item;
    int remaining = item_len;

    while (remaining > 0) {
        /* Find next <category> */
        const char* found = find_ci(search_pos, remaining, "<category", 9);
        if (!found) break;

        int offset = (int)(found - search_pos);
        char chunk[MAX_FIELD * 2];
        int chunk_len = remaining - offset < (int)sizeof(chunk) - 1
                      ? remaining - offset
                      : (int)sizeof(chunk) - 1;
        memcpy(chunk, found, (size_t)chunk_len);
        chunk[chunk_len] = '\0';

        int len = extract_tag(chunk, chunk_len, "category", tag_buf);
        if (len > 0) {
            to_lower(tag_buf, len);
            /* Replace spaces with hyphens (Substack style) */
            for (int i = 0; i < len; i++) {
                if (tag_buf[i] == ' ') tag_buf[i] = '-';
            }
            if (total > 0 && total < MAX_TAGS - 1) {
                out[total++] = ',';
            }
            int copy = len < (MAX_TAGS - total - 1) ? len : (MAX_TAGS - total - 1);
            memcpy(out + total, tag_buf, (size_t)copy);
            total += copy;
        }

        /* Advance past this <category> to find the next one */
        const char* close = find_ci(found + 9, remaining - offset - 9, "</category>", 11);
        if (!close) break;
        int advance = (int)(close - search_pos) + 11;
        search_pos += advance;
        remaining  -= advance;
    }

    out[total] = '\0';
    return total;
}


/* ── Per-post data structure ────────────────────────────────────────────────── */

/*
 * Holds all extracted fields for one RSS item before JSON serialisation.
 * All strings are null-terminated and bounded.
 */
typedef struct {
    int   id;
    char  title[MAX_FIELD];
    char  slug[MAX_SLUG];
    char  excerpt[512];
    char  tags[MAX_TAGS];     /* comma-separated, lowercase */
    char  category[16];       /* "tech" or "general" */
    char  cover_image[MAX_IMG];
    char  link[1024];
    char  created_at[MAX_DATE];
    int   reading_time;
    int   is_html;
} RssPost;


/* ── Main entry point ─────────────────────────────────────────────────────── */

/*
 * parse_rss_xml
 * =============
 * Parse an RSS XML feed and return a heap-allocated JSON array string.
 *
 * Args:
 *   xml       - Pointer to raw XML bytes (does not need to be null-terminated).
 *   xml_len   - Length of xml in bytes.
 *   out_count - Set to the number of posts parsed. Set to 0 on any error.
 *
 * Returns:
 *   A heap-allocated null-terminated JSON string. Caller must free it with
 *   free_rss_result(). Returns "[]" (empty array) if parsing fails or the
 *   feed has no valid items.
 *
 * This function NEVER returns NULL.
 */
char* parse_rss_xml(const char* xml, int xml_len, int* out_count) {
    *out_count = 0;

    /* Guard: empty input */
    if (!xml || xml_len <= 0) {
        char* empty = (char*)malloc(3);
        if (empty) { empty[0] = '['; empty[1] = ']'; empty[2] = '\0'; }
        return empty ? empty : NULL;
    }

    /* Split on <item (every occurrence is the start of a new post) */
    /* We do two passes: first count items, then process them. */
    RssPost* posts = (RssPost*)calloc(MAX_POSTS, sizeof(RssPost));
    if (!posts) goto oom;

    int count = 0;
    const char* cursor = xml;
    int remaining = xml_len;

    while (remaining > 0 && count < MAX_POSTS) {
        /* Find next <item */
        const char* item_start = find_ci(cursor, remaining, "<item", 5);
        if (!item_start) break;

        /* Advance past "<item" to find the end of the opening tag */
        int item_offset = (int)(item_start - cursor);
        const char* content_start = memchr(item_start, '>', (size_t)(remaining - item_offset));
        if (!content_start) break;
        content_start++; /* skip '>' */

        /* Find </item> closing tag */
        int after_open = (int)(content_start - xml);
        const char* item_end = find_ci(content_start,
                                       xml_len - after_open,
                                       "</item>", 7);
        int item_len = item_end
                     ? (int)(item_end - content_start)
                     : (int)(xml + xml_len - content_start);

        /* ── Extract fields ── */
        RssPost* p = &posts[count];

        int title_len = extract_tag(content_start, item_len, "title", p->title);
        if (title_len == 0) {
            /* Skip items with no title */
            goto next_item;
        }

        /* Link and stable ID */
        extract_link(content_start, item_len, p->link);
        if (strlen(p->link) > 0) {
            /* Hash URL into a stable 1-999999 integer. Same URL = same ID. */
            unsigned int h = 5381;
            for (const char* c = p->link; *c; c++) {
                h = ((h << 5) + h) ^ (unsigned char)*c;
            }
            p->id = (int)(h % 999999) + 1;
        } else {
            p->id = count + 1;
        }

        /* Description (short excerpt) and full content */
        char description[MAX_FIELD];
        extract_tag(content_start, item_len, "description", description);

        char content_encoded[MAX_FIELD];
        int ce_len = extract_tag(content_start, item_len, "content:encoded", content_encoded);
        if (ce_len == 0) {
            /* Fall back to description for content */
            memcpy(content_encoded, description, MAX_FIELD);
            ce_len = (int)strlen(description);
        }

        /* Cover image: try full content first, then description snippet */
        int img_found = extract_first_img(content_encoded, ce_len, p->cover_image);
        if (!img_found) {
            extract_first_img(description, (int)strlen(description), p->cover_image);
        }

        /* Plain-text excerpt (200 chars max) */
        char plain[MAX_FIELD];
        int plain_len = strip_html(description, (int)strlen(description), plain);
        /* Collapse whitespace */
        int out_i = 0;
        int in_space = 1;
        for (int i = 0; i < plain_len; i++) {
            if (isspace((unsigned char)plain[i])) {
                if (!in_space) { plain[out_i++] = ' '; in_space = 1; }
            } else {
                plain[out_i++] = plain[i];
                in_space = 0;
            }
        }
        plain[out_i] = '\0';
        plain_len = out_i;

        int excerpt_len = plain_len < 200 ? plain_len : 200;
        memcpy(p->excerpt, plain, (size_t)excerpt_len);
        if (plain_len > 200) {
            /* Append ellipsis — UTF-8 "…" is 3 bytes */
            p->excerpt[excerpt_len++] = (char)0xE2;
            p->excerpt[excerpt_len++] = (char)0x80;
            p->excerpt[excerpt_len++] = (char)0xA6;
        }
        p->excerpt[excerpt_len] = '\0';

        /* Reading time */
        char plain_content[MAX_FIELD];
        int plain_content_len = strip_html(content_encoded, ce_len, plain_content);
        int words = count_words(plain_content, plain_content_len);
        p->reading_time = words / WPM;
        if (p->reading_time < 1) p->reading_time = 1;

        /* Tags and category */
        extract_categories(content_start, item_len, p->tags);
        if (strlen(p->tags) == 0) {
            strncpy(p->tags, "dev", MAX_TAGS - 1);
        }
        strncpy(p->category, classify_category(p->tags), 15);

        /* Slug */
        make_slug(p->title, title_len, p->slug);

        /* Publication date */
        char pub_date[MAX_FIELD];
        extract_tag(content_start, item_len, "pubDate", pub_date);
        if (strlen(pub_date) > 0) {
            snprintf(p->created_at, MAX_DATE, "%s", pub_date);
        } else {
            strncpy(p->created_at, "1970-01-01T00:00:00Z", MAX_DATE - 1);
        }

        p->is_html = 1;
        count++;

    next_item:
        if (item_end) {
            int advance = (int)(item_end - cursor) + 7; /* 7 = len("</item>") */
            cursor    += advance;
            remaining -= advance;
        } else {
            break;
        }
    }

    /* ── Serialise to JSON ── */

    /*
     * Rough upper bound: each post can produce at most ~10 KB of JSON
     * given the field sizes above. We allocate generously and track usage.
     */
    size_t buf_size = (size_t)(count * 10240 + 64);
    char* json = (char*)malloc(buf_size);
    if (!json) { free(posts); goto oom; }

    int pos = 0;
    json[pos++] = '[';

    char esc[MAX_FIELD * 2 + 4]; /* scratch buffer for JSON-escaped strings */

    for (int i = 0; i < count; i++) {
        RssPost* p = &posts[i];
        if (i > 0) json[pos++] = ',';

        /* JSON-escape the fields that can contain arbitrary user content */
        json_escape(p->title,       (int)strlen(p->title),       esc); char esc_title[MAX_FIELD * 2];   memcpy(esc_title,   esc, strlen(esc) + 1);
        json_escape(p->slug,        (int)strlen(p->slug),        esc); char esc_slug[MAX_SLUG * 2];     memcpy(esc_slug,    esc, strlen(esc) + 1);
        json_escape(p->excerpt,     (int)strlen(p->excerpt),     esc); char esc_excerpt[1200];           memcpy(esc_excerpt, esc, strlen(esc) + 1);
        json_escape(p->link,        (int)strlen(p->link),        esc); char esc_link[2048];              memcpy(esc_link,    esc, strlen(esc) + 1);
        json_escape(p->created_at,  (int)strlen(p->created_at),  esc); char esc_date[MAX_DATE * 2];     memcpy(esc_date,    esc, strlen(esc) + 1);
        json_escape(p->cover_image, (int)strlen(p->cover_image), esc); char esc_img[MAX_IMG * 2];       memcpy(esc_img,     esc, strlen(esc) + 1);

        /* Build tags JSON array from comma-separated string */
        char tags_json[MAX_TAGS * 4];
        int tj = 0;
        tags_json[tj++] = '[';
        char* tok = strtok(p->tags, ",");
        int first_tag = 1;
        while (tok) {
            if (!first_tag) tags_json[tj++] = ',';
            first_tag = 0;
            tags_json[tj++] = '"';
            int tl = (int)strlen(tok);
            json_escape(tok, tl, esc);
            int el = (int)strlen(esc);
            memcpy(tags_json + tj, esc, (size_t)el);
            tj += el;
            tags_json[tj++] = '"';
            tok = strtok(NULL, ",");
        }
        tags_json[tj++] = ']';
        tags_json[tj] = '\0';

        pos += snprintf(json + pos, buf_size - (size_t)pos,
            "{"
            "\"id\":%d,"
            "\"title\":\"%s\","
            "\"slug\":\"%s\","
            "\"excerpt\":\"%s\","
            "\"content\":\"\","
            "\"tags\":%s,"
            "\"authorId\":\"1\","
            "\"authorName\":\"CodedChapter\","
            "\"authorUsername\":\"codedchapter\","
            "\"category\":\"%s\","
            "\"coverImage\":%s,"
            "\"readingTimeMinutes\":%d,"
            "\"commentCount\":0,"
            "\"createdAt\":\"%s\","
            "\"updatedAt\":\"%s\","
            "\"isHtml\":true,"
            "\"substackUrl\":\"%s\""
            "}",
            p->id,
            esc_title,
            esc_slug,
            esc_excerpt,
            tags_json,
            p->category,
            strlen(esc_img) > 0 ? "\"" : "null",
            p->reading_time,
            esc_date,
            esc_date,
            esc_link
        );

        /* Patch coverImage: we wrote either `"` (open quote) or `null`.
           If we opened a quote, close it and add the URL. */
        if (strlen(esc_img) > 0) {
            /* The snprintf wrote `"` as the value. Rewrite the last portion. */
            /* Find the last `"coverImage":"` and fix it up. */
            char* ci_pos = strstr(json + (pos > 4096 ? pos - 4096 : 0), "\"coverImage\":");
            if (ci_pos) {
                char* val_start = ci_pos + 13; /* skip `"coverImage":` */
                if (*val_start == '"') {
                    /* Replace the lone `"` with the full `"URL"` */
                    int img_len = (int)strlen(esc_img);
                    memmove(val_start + 1 + img_len + 1,
                            val_start + 1,
                            (size_t)(json + pos - val_start - 1) + 1);
                    memcpy(val_start + 1, esc_img, (size_t)img_len);
                    val_start[1 + img_len + 1 - 1] = '"';
                    pos += img_len + 1;
                }
            }
        }
    }

    json[pos++] = ']';
    json[pos]   = '\0';

    free(posts);
    *out_count = count;
    return json;

oom:
    /* Out of memory — return empty array rather than crashing the Python process */
    if (posts) free(posts);
    char* fallback = (char*)malloc(3);
    if (fallback) { fallback[0] = '['; fallback[1] = ']'; fallback[2] = '\0'; }
    return fallback;
}


/*
 * free_rss_result
 * ===============
 * Free the string returned by parse_rss_xml.
 * Python must call this after it's done reading the result,
 * so that the C heap doesn't accumulate unreleased memory.
 */
void free_rss_result(char* ptr) {
    free(ptr);
}
