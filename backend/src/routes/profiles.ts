import { Router } from "express";
import { getAuth } from "../middlewares/authMiddleware";
import { cachePublic, noCache } from "../middlewares/cache";
import { repo } from "../db/repository";
import { upsertProfileSchema } from "../db/schema/profiles";
import { paramString } from "../lib/params";

const router = Router();

router.get("/me", noCache(), async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await repo.getProfileByUserId(auth.userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get own profile");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/check-username/:username", async (req, res): Promise<any> => {
  try {
    const { username } = req.params;
    const available = await repo.checkUsernameAvailable(username);
    return res.json({ available });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:username", cachePublic(60), async (req, res): Promise<any> => {
  try {
    const username = paramString(req.params.username);
    const profile = await repo.getProfileByUsername(username);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const auth = getAuth(req);
    const isOwner = auth?.userId === profile.userId;
    if (profile.isPublic === false && !isOwner) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const parsed = upsertProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const data = parsed.data;
    const username = data.username.toLowerCase();

    const existing = await repo.getProfileByUsername(username);
    if (existing && existing.userId !== auth.userId) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const profile = await repo.upsertProfile(auth.userId, data);
    return res.json(profile);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Username already taken" });
    }
    req.log.error({ err }, "Failed to upsert profile");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
