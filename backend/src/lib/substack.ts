export interface SubstackPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  category: "tech" | "general";
  coverImage?: string;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  authorUsername?: string;
  commentCount: number;
  isHtml: boolean;
  substackUrl?: string;
}

/**
 * Extract content from an XML tag, handling CDATA sections.
 * Supports both <tag>plain text</tag> and <tag><![CDATA[text]]></tag>
 */
function extractTagContent(xml: string, tag: string): string {
  // Escape special regex chars in the tag name (e.g. the colon in content:encoded)
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(":", "\\:");
  const regex = new RegExp(
    `<${escapedTag}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<][\\s\\S]*?))\\s*<\\/${escapedTag}>`,
    "i"
  );
  const match = xml.match(regex);
  return match ? (match[1] ?? match[2] ?? "").trim() : "";
}

/**
 * Extract all occurrences of a tag's text content.
 */
function extractAllTagContents(xml: string, tag: string): string[] {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(":", "\\:");
  const regex = new RegExp(
    `<${escapedTag}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<][\\s\\S]*?))\\s*<\\/${escapedTag}>`,
    "gi"
  );
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    const val = (m[1] ?? m[2] ?? "").trim();
    if (val) results.push(val);
  }
  return results;
}

/**
 * Extract a plain-text link from an RSS <link> element.
 * Substack encodes links as raw URLs without CDATA:
 *   <link>https://codedchapter.substack.com/p/slug</link>
 */
function extractLink(xml: string): string {
  // Match <link>URL</link> — URL is plain text, no CDATA
  const plain = xml.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i);
  if (plain) return plain[1].trim();
  // Fallback: atom:link or link with href attribute
  const attr = xml.match(/<(?:atom:)?link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  if (attr) return attr[1].trim();
  // Fallback: guid element which usually holds the canonical URL
  const guid = xml.match(/<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i);
  if (guid) return guid[1].trim();
  return "";
}

export async function fetchSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "CodedChapter/1.0 RSS Reader" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Substack RSS: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  // Split into individual items
  const rawItems = xml.split(/<item[\s>]/i);
  if (rawItems.length <= 1) return [];

  const items = rawItems.slice(1).map((chunk) => {
    // Keep only up to </item> to avoid bleeding into next item
    const end = chunk.indexOf("</item>");
    return end !== -1 ? chunk.slice(0, end) : chunk;
  });

  return items
    .map((item, index) => {
      const title = extractTagContent(item, "title");
      if (!title) return null; // skip empty items

      const link = extractLink(item);
      const pubDate = extractTagContent(item, "pubDate");
      const description = extractTagContent(item, "description");

      // content:encoded holds the full post HTML
      const contentEncoded =
        extractTagContent(item, "content:encoded") ||
        extractTagContent(item, "encoded") ||
        description;

      const categories = extractAllTagContents(item, "category");

      // Cover image: first <img> in full content, then description
      const imgSrc =
        contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
        description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      const coverImage = imgSrc ?? undefined;

      // Strip HTML to get plain text excerpt
      const plainText = description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const excerpt = plainText.slice(0, 200) + (plainText.length > 200 ? "…" : "");

      // Reading time based on word count in full content
      const wordCount = contentEncoded.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
      const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

      // Tags from Substack categories
      const tags = categories.map((c) => c.toLowerCase().replace(/\s+/g, "-"));

      // Category: if any tag looks tech/dev related → "tech", else "general"
      const techKeywords = ["tech", "coding", "code", "programming", "development", "javascript", "python", "css", "html", "web", "software", "dev", "git", "react", "node"];
      const isTech = tags.some((t) => techKeywords.some((kw) => t.includes(kw)));
      // Fallback: all posts treated as tech since this is a dev blog
      const category: "tech" | "general" = isTech ? "tech" : "tech";

      // URL-friendly slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const dateStr = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();

      return {
        id: index + 1,
        title,
        slug,
        excerpt,
        content: contentEncoded,
        tags: tags.length > 0 ? tags : ["dev"],
        authorId: "1",
        authorName: "Saff9",
        category,
        coverImage,
        readingTimeMinutes,
        createdAt: dateStr,
        updatedAt: dateStr,
        authorUsername: "saff9",
        commentCount: 0,
        isHtml: true,
        substackUrl: link || undefined,
      } satisfies SubstackPost;
    })
    .filter((p): p is SubstackPost => p !== null);
}

// ── In-memory cache ────────────────────────────────────────────────────────────
let cachedPosts: SubstackPost[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  const now = Date.now();
  if (cachedPosts && now - lastFetchedTime < CACHE_TTL) {
    return cachedPosts;
  }

  try {
    const posts = await fetchSubstackPosts(feedUrl);
    cachedPosts = posts;
    lastFetchedTime = now;
    return posts;
  } catch (err) {
    if (cachedPosts) {
      console.warn("⚠️  Substack RSS fetch failed – serving stale cache:", err);
      return cachedPosts;
    }
    throw err;
  }
}
