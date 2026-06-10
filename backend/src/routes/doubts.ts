import { Router } from "express";
import { getAuth } from "../middlewares/authMiddleware";
import { cachePublic } from "../middlewares/cache";
import { repo } from "../db/repository";
import { createDoubtSchema, createDoubtAnswerSchema } from "../db/schema/doubts";
import { paramInt } from "../lib/params";

const router = Router();

router.get("/", cachePublic(30), async (req, res) => {
  try {
    const tag = req.query.tag as string | undefined;
    const authorId = req.query.authorId as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10) || 0);
    const doubts = await repo.listDoubts(tag, limit, offset, authorId);
    return res.json(doubts);
  } catch (err) {
    req.log.error({ err }, "Failed to list doubts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", cachePublic(30), async (req, res): Promise<any> => {
  try {
    const id = paramInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const doubt = await repo.getDoubt(id);
    if (!doubt) return res.status(404).json({ error: "Doubt not found" });

    return res.json(doubt);
  } catch (err) {
    req.log.error({ err }, "Failed to get doubt");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = createDoubtSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const authorProfile = await repo.getProfileByUserId(auth.userId);
    const authorUsername = authorProfile?.username ?? null;
    const authorName = authorProfile?.displayName || (auth.sessionClaims?.fullName as string) || "Anonymous";

    const created = await repo.createDoubt(
      auth.userId,
      authorName,
      authorUsername,
      parsed.data
    );

    return res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create doubt");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const success = await repo.deleteDoubt(id, auth.userId);
    if (!success) return res.status(404).json({ error: "Not found or forbidden" });

    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to delete doubt");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/answers", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const doubtId = parseInt(req.params.id, 10);
    if (isNaN(doubtId)) return res.status(400).json({ error: "Invalid id" });

    const parsed = createDoubtAnswerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const authorProfile = await repo.getProfileByUserId(auth.userId);
    const authorUsername = authorProfile?.username ?? null;
    const authorName = authorProfile?.displayName || (auth.sessionClaims?.fullName as string) || "Anonymous";

    const answer = await repo.createAnswer(
      doubtId,
      auth.userId,
      authorName,
      authorUsername,
      parsed.data.content
    );

    return res.status(201).json(answer);
  } catch (err: any) {
    if (err.message === "Doubt not found") return res.status(404).json({ error: err.message });
    req.log.error({ err }, "Failed to create answer");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/answers/:answerId/accept", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const doubtId = parseInt(req.params.id, 10);
    const answerId = parseInt(req.params.answerId, 10);
    if (isNaN(doubtId) || isNaN(answerId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const answer = await repo.acceptAnswer(doubtId, answerId, auth.userId);
    return res.json(answer);
  } catch (err: any) {
    if (err.message === "Doubt not found" || err.message === "Answer not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to accept answer");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/answers/:answerId", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const doubtId = parseInt(req.params.id, 10);
    const answerId = parseInt(req.params.answerId, 10);
    if (isNaN(doubtId) || isNaN(answerId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const success = await repo.deleteAnswer(doubtId, answerId, auth.userId);
    if (!success) return res.status(404).json({ error: "Not found or forbidden" });

    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === "Forbidden") return res.status(403).json({ error: err.message });
    req.log.error({ err }, "Failed to delete answer");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
