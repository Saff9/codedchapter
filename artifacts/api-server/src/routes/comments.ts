import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt));

    res.json(comments);
  } catch (err) {
    req.log.error({ err }, "Failed to list comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid postId" });

    const parsed = CreateCommentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const authorName =
      (auth.sessionClaims?.fullName as string) ||
      (auth.sessionClaims?.firstName as string) ||
      "Anonymous";

    const [comment] = await db
      .insert(commentsTable)
      .values({
        postId,
        authorId: userId,
        authorName,
        content: parsed.data.content,
      })
      .returning();

    res.status(201).json(comment);
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId);
    const commentId = parseInt(req.params.commentId);
    if (isNaN(postId) || isNaN(commentId))
      return res.status(400).json({ error: "Invalid params" });

    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.postId, postId)));

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
