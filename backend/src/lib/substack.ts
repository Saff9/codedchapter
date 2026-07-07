// The shape of a post as we expose it to the frontend.
// This is built from parsed Substack RSS items — not a database row.
import { logger } from "./logger";

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

// How long to wait for the Substack RSS feed before giving up (ms).
// Substack is usually fast, but this prevents a slow upstream from hanging our server.
const FETCH_TIMEOUT_MS = 10_000;

// Only feed URLs from Substack domains are permitted.
// This prevents SSRF attacks where someone configures SUBSTACK_FEED_URL to point
// at an internal network address or an arbitrary external server.
const ALLOWED_FEED_HOSTS = ["substack.com", ".substack.com"];

function isAllowedFeedUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return ALLOWED_FEED_HOSTS.some(
      (allowed) => url.hostname === allowed || url.hostname.endsWith(allowed)
    );
  } catch {
    return false;
  }
}

// ─── RSS XML helpers ─────────────────────────────────────────────────────────

// Pull the text content out of a single XML tag, handling CDATA sections.
// Examples handled:
//   <title>My Post</title>
//   <title><![CDATA[My Post]]></title>
function extractTagContent(xml: string, tag: string): string {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(":", "\\:");
  const regex = new RegExp(
    `<${escapedTag}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<][\\s\\S]*?))\\s*<\\/${escapedTag}>`,
    "i"
  );
  const match = xml.match(regex);
  return match ? (match[1] ?? match[2] ?? "").trim() : "";
}

// Pull every occurrence of a tag — used for <category> which can repeat.
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

// RSS <link> elements don't use CDATA — the URL is just plain text.
// Substack also uses <guid> as the canonical URL, so we fall back to that.
function extractLink(xml: string): string {
  const plain = xml.match(/<link>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i);
  if (plain) return plain[1].trim();

  const attr = xml.match(/<(?:atom:)?link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  if (attr) return attr[1].trim();

  const guid = xml.match(/<guid[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/guid>/i);
  if (guid) return guid[1].trim();

  return "";
}

// Find the first usable image URL inside an HTML or RSS blob.
// Tries several patterns in order of reliability:
//   1. <img src="...">
//   2. <img data-src="..."> (lazy-loaded Substack images)
//   3. <enclosure url="..." type="image/..."> (RSS media enclosures)
//   4. <media:content url="..."> (media RSS extension)
function extractFirstImage(html: string, fallbackHtml?: string): string | undefined {
  const sources = fallbackHtml ? [html, fallbackHtml] : [html];

  for (const src of sources) {
    // Standard src attribute
    const bySrc = src.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (bySrc && bySrc.startsWith("http")) return bySrc;

    // data-src (lazy-loaded images)
    const byDataSrc = src.match(/<img[^>]+data-src=["']([^"']+)["']/i)?.[1];
    if (byDataSrc && byDataSrc.startsWith("http")) return byDataSrc;
  }

  // RSS enclosure (audio/video/image attached to the item)
  const enclosure = html.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i)?.[1];
  if (enclosure && enclosure.startsWith("http")) return enclosure;

  // media:content element from Media RSS spec
  const media = html.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1];
  if (media && media.startsWith("http")) return media;

  return undefined;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

// Keywords that signal the post is tech / dev related.
// If at least one tag matches, category becomes "tech"; otherwise "general".
const TECH_KEYWORDS = [
  "tech", "coding", "code", "programming", "development", "javascript",
  "python", "css", "html", "web", "software", "dev", "git", "react", "node",
  "typescript", "api", "database", "backend", "frontend",
];

export async function fetchSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  // Reject any feed URL that isn't on a Substack domain.
  // This is the SSRF guard — never hit arbitrary user-supplied URLs.
  if (!isAllowedFeedUrl(feedUrl)) {
    throw new Error(`Feed URL rejected: not a Substack domain — ${feedUrl}`);
  }

  // Use AbortController to enforce the request timeout.
  // If Substack takes longer than FETCH_TIMEOUT_MS, we abort and either
  // serve stale cached data or propagate the error.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let xml: string;
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "CodedChapter/1.0 RSS Reader" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Substack RSS responded with ${res.status} ${res.statusText}`);
    }
    xml = await res.text();
  } finally {
    clearTimeout(timer);
  }

  // Each RSS item lives between <item ...> and </item>.
  // We split on the opening tag and discard the channel header (index 0).
  const rawItems = xml.split(/<item[\s>]/i);
  if (rawItems.length <= 1) return [];

  const items = rawItems.slice(1).map((chunk) => {
    const end = chunk.indexOf("</item>");
    return end !== -1 ? chunk.slice(0, end) : chunk;
  });

  return items
    .map((item, index) => {
      const title = extractTagContent(item, "title");
      if (!title) return null;

      const link        = extractLink(item);
      const pubDate     = extractTagContent(item, "pubDate");
      const description = extractTagContent(item, "description");

      // content:encoded carries the full post HTML on Substack feeds.
      // Fall back to description if absent.
      const contentEncoded =
        extractTagContent(item, "content:encoded") ||
        extractTagContent(item, "encoded") ||
        description;

      const categories = extractAllTagContents(item, "category");

      // Try the full content first, then the description snippet
      const coverImage = extractFirstImage(contentEncoded, description);

      // Strip all HTML tags to produce a plain-text excerpt
      const plainText = description
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const excerpt = plainText.slice(0, 200) + (plainText.length > 200 ? "…" : "");

      // Estimate reading time at 200 words per minute
      const wordCount = contentEncoded
        .replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(Boolean).length;
      const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

      // Normalise Substack categories to lowercase kebab-case tags
      const tags = categories.map((c) =>
        c.toLowerCase().replace(/\s+/g, "-")
      );

      // Pick the category based on whether any tag looks dev-related
      const isTech = tags.some((t) =>
        TECH_KEYWORDS.some((kw) => t.includes(kw))
      );
      const category: "tech" | "general" = isTech ? "tech" : "general";

      // URL-friendly slug derived from the post title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const dateStr = pubDate
        ? new Date(pubDate).toISOString()
        : new Date().toISOString();

      return {
        id: index + 1,
        title,
        slug,
        excerpt,
        content: contentEncoded,
        tags: tags.length > 0 ? tags : ["dev"],
        authorId: "1",
        authorName: "CodedChapter",
        category,
        coverImage,
        readingTimeMinutes,
        createdAt: dateStr,
        updatedAt: dateStr,
        authorUsername: "codedchapter",
        commentCount: 0,
        isHtml: true,
        substackUrl: link || undefined,
      } as SubstackPost;
    })
    .filter((p): p is SubstackPost => p !== null);
}

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Keeps the last-fetched posts in memory so repeated requests within
// the TTL window never hit the Substack RSS endpoint at all.
let cachedPosts: SubstackPost[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  const now = Date.now();

  // Return cached data if it's still fresh
  if (cachedPosts && now - lastFetchedTime < CACHE_TTL) {
    return cachedPosts;
  }

  try {
    const posts = await fetchSubstackPosts(feedUrl);
    cachedPosts = posts;
    lastFetchedTime = now;
    return posts;
  } catch (err) {
    // If the live fetch fails but we have stale data, serve it rather than erroring.
    // A slightly-old post list is better than a 502 for the visitor.
    if (cachedPosts) {
      logger.warn({ err }, "Substack RSS fetch failed — serving stale cache");
      return cachedPosts;
    }
    throw err;
  }
}
