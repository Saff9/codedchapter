import { Router } from "express";
import { getAuth } from "../middlewares/authMiddleware";
import { cachePublic } from "../middlewares/cache";
import { repo } from "../db/repository";
import { CreateCommentBody } from "../db/schema/zod";

const router = Router({ mergeParams: true });

router.get("/", cachePublic(30), async (req, res): Promise<any> => {
  try {
    const postId = parseInt((req.params as any).postId, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const comments = await repo.listComments(postId);
    return res.json(comments);
  } catch (err) {
    req.log.error({ err }, "Failed to list comments");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt((req.params as any).postId, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const parsed = CreateCommentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const authorProfile = await repo.getProfileByUserId(userId);
    const authorName =
      authorProfile?.displayName ||
      (auth.sessionClaims?.fullName as string) ||
      (auth.sessionClaims?.firstName as string) ||
      "Anonymous";

    const comment = await repo.createComment(
      postId,
      userId,
      authorName,
      parsed.data.content
    );

    return res.status(201).json(comment);
  } catch (err: any) {
    if (err.message === "Post not found") return res.status(404).json({ error: err.message });
    req.log.error({ err }, "Failed to create comment");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:commentId", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const commentId = parseInt(req.params.commentId, 10);
    if (isNaN(commentId)) return res.status(400).json({ error: "Invalid commentId" });

    const success = await repo.deleteComment(commentId, userId);
    if (!success) return res.status(404).json({ error: "Comment not found" });

    return res.status(204).send();
  } catch (err: any) {
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to delete comment");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
