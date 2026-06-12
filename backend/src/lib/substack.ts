import path from "path";

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

function extractTagContent(xml: string, tag: string): string {
  // Matches <tag>content</tag> or <tag><![CDATA[content]]></tag>
  const match = xml.match(new RegExp(`<${tag}(?:\\s+[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`, "i"));
  return match ? (match[1] || match[2] || "").trim() : "";
}

function extractAllTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}(?:\\s+[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`, "gi");
  const result: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result.push((match[1] || match[2] || "").trim());
  }
  return result;
}

export async function fetchSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  const res = await fetch(feedUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch Substack RSS: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  // Parse items
  const itemSplit = xml.split(/<item>/i);
  if (itemSplit.length <= 1) return [];

  const items = itemSplit.slice(1);
  return items.map((item, index) => {
    const title = extractTagContent(item, "title");
    const link = extractTagContent(item, "link");
    const pubDate = extractTagContent(item, "pubDate");
    const description = extractTagContent(item, "description");
    
    // Look for content:encoded first, then fall back to description
    const contentEncoded = extractTagContent(item, "content:encoded") || extractTagContent(item, "content") || description;
    
    const categories = extractAllTags(item, "category");
    
    // Find cover image from content or description
    const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i) || description.match(/<img[^>]+src=["']([^"']+)["']/i);
    const coverImage = imgMatch ? imgMatch[1] : undefined;

    // Remove html from description for excerpt
    const plainExcerpt = description.replace(/<[^>]*>/g, "").slice(0, 180).trim() + "...";

    // Standard word count reading time (words / 200)
    const wordCount = contentEncoded.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    // Map categories to category and tags
    const tags = categories.map(c => c.toLowerCase());
    const isTech = tags.includes("tech") || tags.includes("coding") || tags.includes("programming") || tags.includes("development");
    const category = isTech ? "tech" : "general";

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const dateStr = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();

    return {
      id: index + 1, // numeric ID based on list index for frontend compatibility
      title,
      slug,
      excerpt: plainExcerpt,
      content: contentEncoded,
      tags: tags.length > 0 ? tags : [category],
      authorId: "1",
      authorName: "Saff9",
      category: category as "tech" | "general",
      coverImage,
      readingTimeMinutes,
      createdAt: dateStr,
      updatedAt: dateStr,
      authorUsername: "saff9",
      commentCount: 0,
      isHtml: true,
      substackUrl: link || undefined,
    };
  });
}

// In-memory caching logic
let cachedPosts: SubstackPost[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSubstackPosts(feedUrl: string): Promise<SubstackPost[]> {
  const now = Date.now();
  if (cachedPosts && (now - lastFetchedTime < CACHE_TTL)) {
    return cachedPosts;
  }

  try {
    const posts = await fetchSubstackPosts(feedUrl);
    cachedPosts = posts;
    lastFetchedTime = now;
    return posts;
  } catch (err) {
    if (cachedPosts) {
      console.warn("⚠️ Failed to fetch Substack posts, returning stale cache:", err);
      return cachedPosts;
    }
    throw err;
  }
}
