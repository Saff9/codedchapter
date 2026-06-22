import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  req.log?.error({ err }, "Unhandled request error");
  logger.error({ err, url: req.url, method: req.method }, "Unhandled request error");

  if (res.headersSent) return;

  const isProd = process.env.NODE_ENV === "production";

  res.status(500).json({
    error: "Internal server error",
    ...(isProd ? {} : {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}
