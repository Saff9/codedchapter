import type { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getClientIp } from "../lib/clientIp";
import { logger } from "../lib/logger";

// Per-minute request limits by method type
const WINDOW_MS  = 60_000;  // 1 minute window
const MAX_READS  = 300;     // GET requests — generous for public content
const MAX_WRITES = 30;      // POST/PUT/DELETE — stricter to prevent abuse

// In-memory fallback maps when Upstash Redis is not configured.
// These reset on server restart and don't share state across instances.
const ipReads:  Map<string, { count: number; resetTime: number }> = new Map();
const ipWrites: Map<string, { count: number; resetTime: number }> = new Map();

// Attempt to create Upstash Redis sliding-window limiters.
// Returns null if the environment variables are missing, which triggers
// the in-memory fallback. Upstash is preferred in production because it
// shares state across all server instances (important on Render/Railway).
function createUpstashLimiters() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return {
    read: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_READS, "1 m"),
      prefix: "cc:read",
    }),
    write: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_WRITES, "1 m"),
      prefix: "cc:write",
    }),
  };
}

const upstash = createUpstashLimiters();

if (process.env.NODE_ENV === "production" && !upstash) {
  logger.warn(
    "UPSTASH_REDIS_REST_URL/TOKEN not set — rate limits are per-instance only. Add Upstash for multi-instance deployments."
  );
}

// Simple in-memory counter for a single IP within the current window.
// Returns true if the request is allowed, false if the limit is exceeded.
function memoryLimit(
  map: Map<string, { count: number; resetTime: number }>,
  ip: string,
  max: number,
  now: number,
): boolean {
  const record = map.get(ip);

  // First request in this window, or window has expired — reset the counter
  if (!record || now > record.resetTime) {
    map.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  record.count++;
  return record.count <= max;
}

// Rate limiter middleware.
// Checks the request against either Upstash Redis (preferred) or the
// in-memory fallback. Write operations (POST/PUT/DELETE/PATCH) get a
// stricter limit than reads.
export function rateLimiter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip      = getClientIp(req);
    const isWrite = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);

    if (upstash) {
      try {
        const limiter         = isWrite ? upstash.write : upstash.read;
        const { success, reset } = await limiter.limit(ip);

        if (!success) {
          const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
          res.setHeader("Retry-After", String(retryAfter));
          return res
            .status(429)
            .json({ error: "Too many requests. Please try again shortly." });
        }

        return next();
      } catch (err) {
        // If Upstash is down, fall through to the in-memory limiter rather than
        // blocking all traffic.
        req.log?.warn({ err }, "Upstash rate limit check failed, falling back to memory");
      }
    }

    // In-memory fallback path
    const now = Date.now();
    const map = isWrite ? ipWrites : ipReads;
    const max = isWrite ? MAX_WRITES : MAX_READS;

    if (!memoryLimit(map, ip, max, now)) {
      res.setHeader("Retry-After", "60");
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again shortly." });
    }

    next();
  };
}
