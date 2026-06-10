import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  req.log?.error({ err }, "Unhandled request error");
  logger.error({ err, url: req.url, method: req.method }, "Unhandled request error");

  if (res.headersSent) return;

  res.status(500).json({ error: "Internal server error" });
}
