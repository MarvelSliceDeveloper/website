import type { Request, Response, NextFunction } from "express";

type CacheOptions = {
  /** Max age in seconds (default 300 = 5 min) */
  maxAge?: number;
  /** Public or private cache (default "public") */
  scope?: "public" | "private";
  /** Whether to allow stale responses (default false) */
  staleWhileRevalidate?: boolean;
};

const defaults = {
  maxAge: 300,
  scope: "public" as const,
  staleWhileRevalidate: false,
};

/**
 * Express middleware that sets Cache-Control and ETag headers.
 *
 * Usage:
 *   app.get("/api/foo", cacheMiddleware({ maxAge: 600 }), handler);
 */
export function cacheMiddleware(opts: CacheOptions = {}) {
  const { maxAge, scope, staleWhileRevalidate } = { ...defaults, ...opts };

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET / HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    // Skip caching for authenticated / user-specific data
    if ((req as any).user?.userId) {
      res.setHeader("Cache-Control", "private, no-cache");
      return next();
    }

    const directives = [`${scope}`, `max-age=${maxAge}`];
    if (staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${maxAge * 2}`);
    }
    res.setHeader("Cache-Control", directives.join(", "));

    // Simple ETag based on the request path
    const etag = `W/"${Buffer.from(req.originalUrl).toString("base64")}"`;
    res.setHeader("ETag", etag);

    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    next();
  };
}
