import type { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getClientIp } from "../lib/clientIp";
import { logger } from "../lib/logger";

const WINDOW_MS = 60_000;
const MAX_READS = 300;
const MAX_WRITES = 30;

const ipReads = new Map<string, { count: number; resetTime: number }>();
const ipWrites = new Map<string, { count: number; resetTime: number }>();

function createUpstashLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
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
    "UPSTASH_REDIS_REST_URL/TOKEN not set — rate limits are per-instance only. Add Upstash for heavy traffic.",
  );
}

function memoryLimit(
  map: Map<string, { count: number; resetTime: number }>,
  ip: string,
  max: number,
  now: number,
): boolean {
  const record = map.get(ip);
  if (!record || now > record.resetTime) {
    map.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  record.count++;
  return record.count <= max;
}

export function rateLimiter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const isWrite = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);

    if (upstash) {
      try {
        const limiter = isWrite ? upstash.write : upstash.read;
        const { success, reset } = await limiter.limit(ip);
        if (!success) {
          const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
          res.setHeader("Retry-After", String(retryAfter));
          return res.status(429).json({ error: "Too many requests. Please try again shortly." });
        }
        return next();
      } catch (err) {
        req.log?.warn({ err }, "Upstash rate limit failed, falling back to memory");
      }
    }

    const now = Date.now();
    const map = isWrite ? ipWrites : ipReads;
    const max = isWrite ? MAX_WRITES : MAX_READS;
    if (!memoryLimit(map, ip, max, now)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }
    next();
  };
}
