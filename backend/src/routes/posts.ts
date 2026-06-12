import { Router } from "express";
import { getAuth } from "../middlewares/authMiddleware";
import { isAdmin } from "../lib/admin";
import { cachePublic } from "../middlewares/cache";
import { repo } from "../db/repository";
import { ListPostsQueryParams, CreatePostBody } from "../db/schema/zod";
import { paramInt } from "../lib/params";
import { getSubstackPosts } from "../lib/substack";

const router = Router();

router.get("/", cachePublic(60), async (req, res) => {
  try {
    const parsed = ListPostsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }
    const params = parsed.data;
    const { category, tag, limit = 10, offset = 0, authorId } = params;

    const feedUrl = process.env.SUBSTACK_FEED_URL || "https://codedchapter.substack.com/feed";
    if (feedUrl) {
      try {
        let posts = await getSubstackPosts(feedUrl);
        if (category) {
          posts = posts.filter(p => p.category === category);
        }
        if (tag) {
          const lowerTag = tag.toLowerCase();
          posts = posts.filter(p => p.tags.includes(lowerTag));
        }
        return res.json(posts.slice(offset, offset + limit));
      } catch (substackErr) {
        req.log.warn({ err: substackErr }, "Substack feed integration failed, falling back to database");
      }
    }

    const posts = await repo.listPosts(category, tag, limit, offset, authorId);
    return res.json(posts);
  } catch (err: any) {
    req.log.error({ err }, "Failed to list posts");
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

router.get("/featured", cachePublic(120), async (req, res) => {
  try {
    const feedUrl = process.env.SUBSTACK_FEED_URL || "https://codedchapter.substack.com/feed";
    if (feedUrl) {
      try {
        const posts = await getSubstackPosts(feedUrl);
        return res.json(posts.slice(0, 3));
      } catch (substackErr) {
        req.log.warn({ err: substackErr }, "Substack featured feed integration failed, falling back to database");
      }
    }
    const posts = await repo.getFeaturedPosts();
    res.json(posts);
  } catch (err: any) {
    req.log.error({ err }, "Failed to get featured posts");
    res.status(500).json({
      error: "Internal server error",
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

router.get("/tags", cachePublic(300), async (req, res) => {
  try {
    const feedUrl = process.env.SUBSTACK_FEED_URL || "https://codedchapter.substack.com/feed";
    if (feedUrl) {
      try {
        const posts = await getSubstackPosts(feedUrl);
        const tagsSet = new Set<string>();
        posts.forEach(p => p.tags.forEach(t => tagsSet.add(t)));
        return res.json(Array.from(tagsSet));
      } catch (substackErr) {
        req.log.warn({ err: substackErr }, "Substack tags feed integration failed, falling back to database");
      }
    }
    const tags = await repo.getAllTags();
    res.json(tags);
  } catch (err: any) {
    req.log.error({ err }, "Failed to get tags");
    res.status(500).json({
      error: "Internal server error",
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

router.get("/:id", cachePublic(60), async (req, res): Promise<any> => {
  try {
    const id = paramInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const feedUrl = process.env.SUBSTACK_FEED_URL || "https://codedchapter.substack.com/feed";
    if (feedUrl) {
      try {
        const posts = await getSubstackPosts(feedUrl);
        const post = posts.find(p => p.id === id);
        if (post) return res.json(post);
      } catch (substackErr) {
        req.log.warn({ err: substackErr }, "Substack post detail lookup failed, falling back to database");
      }
    }

    const post = await repo.getPost(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json(post);
  } catch (err) {
    req.log.error({ err }, "Failed to get post");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!isAdmin(auth)) {
      return res.status(403).json({ error: "Forbidden: Only the admin can edit chapters." });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const updated = await repo.updatePost(id, userId, parsed.data);
    return res.json(updated);
  } catch (err: any) {
    if (err.message === "Post not found") return res.status(404).json({ error: err.message });
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to update post");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!isAdmin(auth)) {
      return res.status(403).json({ error: "Forbidden: Only the admin can delete chapters." });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const success = await repo.deletePost(id, userId);
    if (!success) return res.status(404).json({ error: "Post not found" });

    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to delete post");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!isAdmin(auth)) {
      return res.status(403).json({ error: "Forbidden: Only the admin can write chapters." });
    }

    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const authorProfile = await repo.getProfileByUserId(userId);
    const authorName = authorProfile?.displayName || (auth.sessionClaims?.fullName as string) || "Author";
    const created = await repo.createPost(userId, authorName, parsed.data);
    return res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create post");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
