import type { Request, Response, NextFunction } from "express";

export function cachePublic(maxAgeSeconds: number) {
  const swr = maxAgeSeconds * 2;
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${swr}`);
    next();
  };
}

export function cachePrivate(maxAgeSeconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `private, max-age=${maxAgeSeconds}`);
    next();
  };
}

export function noCache() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  };
}
