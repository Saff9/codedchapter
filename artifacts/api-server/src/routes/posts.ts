import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { postsTable, commentsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { ListPostsQueryParams, CreatePostBody } from "@workspace/api-zod";

const router = Router();

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function slugify(title: string, id: number): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) +
    `-${id}`
  );
}

router.get("/", async (req, res) => {
  try {
    const parsed = ListPostsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : { limit: 10, offset: 0 };
    const { tag, limit = 10, offset = 0 } = params;

    const postsWithCounts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .groupBy(postsTable.id)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    let result = postsWithCounts;
    if (tag) {
      result = result.filter((p) => p.tags.includes(tag));
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .groupBy(postsTable.id)
      .orderBy(desc(postsTable.createdAt))
      .limit(4);

    res.json(posts);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tags", async (req, res) => {
  try {
    const posts = await db.select({ tags: postsTable.tags }).from(postsTable);
    const tagSet = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    res.json(Array.from(tagSet).sort());
  } catch (err) {
    req.log.error({ err }, "Failed to get tags");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        tags: postsTable.tags,
        authorId: postsTable.authorId,
        authorName: postsTable.authorName,
        coverImage: postsTable.coverImage,
        readingTimeMinutes: postsTable.readingTimeMinutes,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
      })
      .from(postsTable)
      .leftJoin(commentsTable, eq(commentsTable.postId, postsTable.id))
      .where(eq(postsTable.id, id))
      .groupBy(postsTable.id);

    if (!posts[0]) return res.status(404).json({ error: "Post not found" });
    res.json(posts[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const { title, excerpt, content, tags, coverImage } = parsed.data;
    const readingTimeMinutes = estimateReadingTime(content);

    const [updated] = await db.update(postsTable).set({
      title,
      slug: slugify(title, id),
      excerpt,
      content,
      tags: tags ?? [],
      coverImage: coverImage ?? null,
      readingTimeMinutes,
      updatedAt: new Date(),
    }).where(eq(postsTable.id, id)).returning();

    res.json({ ...updated, commentCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    await db.delete(postsTable).where(eq(postsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const { title, excerpt, content, tags, coverImage } = parsed.data;
    const readingTimeMinutes = estimateReadingTime(content);

    const [created] = await db
      .insert(postsTable)
      .values({
        title,
        slug: "temp",
        excerpt,
        content,
        tags: tags ?? [],
        authorId: userId,
        authorName: auth.sessionClaims?.fullName as string || "Author",
        coverImage: coverImage ?? null,
        readingTimeMinutes,
      })
      .returning();

    await db
      .update(postsTable)
      .set({ slug: slugify(title, created.id) })
      .where(eq(postsTable.id, created.id));

    res.status(201).json({ ...created, commentCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create post");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
