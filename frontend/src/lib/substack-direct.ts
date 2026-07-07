/*
 * substack-direct.ts
 * ==================
 * Fetches posts directly from Substack's public JSON API.
 * Used when VITE_API_URL is not set (no backend deployed yet).
 *
 * Substack exposes a public API at:
 *   https://[pub].substack.com/api/v1/posts?limit=N
 *
 * This returns JSON with CORS headers set, so the browser can fetch it
 * directly without a backend or CORS proxy.
 *
 * The response is normalised into the same shape the backend returns,
 * so the rest of the app never needs to know which source was used.
 */

const SUBSTACK_PUB = "codedchapter";
const SUBSTACK_BASE = `https://${SUBSTACK_PUB}.substack.com`;
const SUBSTACK_FEED_URL = `${SUBSTACK_BASE}/feed`;

// Tech-related keywords used to classify posts as "tech" or "general".
const TECH_KEYWORDS = new Set([
  "tech", "cod", "program", "dev", "python", "javascript", "html",
  "css", "web", "software", "git", "react", "node", "typescript",
  "backend", "frontend", "database", "linux", "api", "cs50",
]);

function isTech(tags: string[]): boolean {
  return tags.some(tag =>
    [...TECH_KEYWORDS].some(kw => tag.toLowerCase().includes(kw))
  );
}

/*
 * Turn an RSS XML string into a stable numeric ID.
 * Same URL always produces the same number so navigation never breaks.
 * We use a simple djb2-style hash then mod to 1-999999.
 */
function stableId(url: string, fallback: number): number {
  if (!url) return fallback + 1;
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h) ^ url.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return (h % 999_999) + 1;
}

/*
 * Extract the first image URL from an HTML string.
 * Substack puts post images in the content HTML.
 */
function extractFirstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  return m ? m[1] : null;
}

/*
 * Strip HTML tags and collapse whitespace into a plain-text excerpt.
 */
function makeExcerpt(html: string, maxLen = 200): string {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

/*
 * Count words in an HTML string (after stripping tags).
 */
function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

/*
 * Normalise a Substack API v1 post object into the shape the frontend expects.
 * The backend returns this same shape, so nothing else changes.
 */
function normaliseSubstackPost(raw: any, index: number): any {
  const url: string = raw.canonical_url || "";
  const id = stableId(url, index);

  // Tags come from the post's audience/section labels.
  // Fall back to ["dev"] so every post has at least one tag.
  const tags: string[] = (raw.postTags ?? [])
    .map((t: any) => (t.name ?? t).toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
  if (tags.length === 0) tags.push("dev");

  const category = isTech(tags) ? "tech" : "general";
  const content: string = raw.body_html ?? raw.description ?? "";
  const coverImage: string | null = raw.cover_image ?? extractFirstImage(content) ?? null;
  const slug = (raw.slug ?? "")
    || url.split("/").pop()
    || raw.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    || String(id);

  return {
    id,
    title: raw.title ?? "Untitled",
    slug,
    excerpt: raw.subtitle ? makeExcerpt(raw.subtitle, 200) : makeExcerpt(content, 200),
    content,
    tags,
    authorId: "1",
    authorName: "CodedChapter",
    authorUsername: "codedchapter",
    category,
    coverImage,
    readingTimeMinutes: Math.max(1, Math.round(wordCount(content) / 200)),
    commentCount: 0,
    createdAt: raw.post_date ?? new Date().toISOString(),
    updatedAt: raw.post_date ?? new Date().toISOString(),
    isHtml: true,
    substackUrl: url || null,
  };
}

// In-memory cache so repeated calls within the same session are instant.
let _cache: any[] | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

/*
 * Fetch all posts from Substack's public API directly from the browser.
 * Results are cached for 5 minutes. No backend or server needed.
 */
export async function fetchSubstackDirect(options?: {
  category?: string;
  tag?: string;
  limit?: number;
}): Promise<any[]> {
  const now = Date.now();

  // Serve from cache if still fresh
  if (_cache && now - _cacheTime < CACHE_TTL_MS) {
    return filterPosts(_cache, options);
  }

  // Substack API v1 — publicly accessible, CORS headers set
  const url = `${SUBSTACK_BASE}/api/v1/posts?limit=50`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    // If the API call fails, fall back to the RSS feed via a CORS proxy.
    // rss2json is a free public service that adds CORS headers to any RSS feed.
    return fetchViaRssProxy(options);
  }

  const data = await res.json();
  // Substack v1 returns an array directly or { posts: [...] }
  const rawPosts: any[] = Array.isArray(data) ? data : (data.posts ?? []);

  _cache = rawPosts.map(normaliseSubstackPost);
  _cacheTime = now;

  return filterPosts(_cache, options);
}

/*
 * Fallback: convert RSS XML feed to JSON via rss2json public proxy.
 * Used only when the Substack JSON API is unreachable.
 */
async function fetchViaRssProxy(options?: {
  category?: string;
  tag?: string;
  limit?: number;
}): Promise<any[]> {
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(SUBSTACK_FEED_URL)}&count=50`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Failed to fetch posts from Substack");

  const data = await res.json();
  if (data.status !== "ok") throw new Error("RSS proxy returned an error");

  const rawPosts: any[] = data.items ?? [];

  // Normalise RSS-via-proxy shape to match Substack API v1 shape
  const posts = rawPosts.map((item: any, i: number) => {
    const url = item.link ?? item.guid ?? "";
    const id = stableId(url, i);
    const content = item.content ?? item.description ?? "";
    const tags = (item.categories ?? [])
      .map((c: string) => c.toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    if (tags.length === 0) tags.push("dev");

    const category = isTech(tags) ? "tech" : "general";
    const coverImage = item.thumbnail
      ? item.thumbnail
      : extractFirstImage(content);

    const slug = url.split("/").filter(Boolean).pop() ?? String(id);

    return {
      id,
      title: item.title ?? "Untitled",
      slug,
      excerpt: makeExcerpt(item.description ?? content, 200),
      content,
      tags,
      authorId: "1",
      authorName: "CodedChapter",
      authorUsername: "codedchapter",
      category,
      coverImage: coverImage ?? null,
      readingTimeMinutes: Math.max(1, Math.round(wordCount(content) / 200)),
      commentCount: 0,
      createdAt: item.pubDate ?? new Date().toISOString(),
      updatedAt: item.pubDate ?? new Date().toISOString(),
      isHtml: true,
      substackUrl: url || null,
    };
  });

  _cache = posts;
  _cacheTime = Date.now();

  return filterPosts(_cache, options);
}

function filterPosts(
  posts: any[],
  options?: { category?: string; tag?: string; limit?: number }
): any[] {
  let result = posts;
  if (options?.category) {
    result = result.filter(p => p.category === options.category);
  }
  if (options?.tag) {
    result = result.filter(p => p.tags?.includes(options.tag));
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }
  return result;
}

/*
 * Fetch a single post by its stable ID.
 * Pulls the full list and finds the matching one.
 */
export async function fetchSubstackPostById(id: number): Promise<any | null> {
  const posts = await fetchSubstackDirect();
  return posts.find(p => p.id === id) ?? null;
}

/*
 * Get all unique tags across all posts.
 */
export async function fetchSubstackTags(): Promise<string[]> {
  const posts = await fetchSubstackDirect();
  const tagSet = new Set<string>();
  posts.forEach(p => p.tags?.forEach((t: string) => tagSet.add(t)));
  return [...tagSet].sort();
}
