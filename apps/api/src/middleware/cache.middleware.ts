import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";

type CacheOptions = {
  /** Max age in seconds (default 300 = 5 min) */
  maxAge?: number;
  /** Public or private cache (default "public") */
  scope?: "public" | "private";
  /** Whether to allow stale responses (default false) */
  staleWhileRevalidate?: boolean;
  /** Stale-while-revalidate window in seconds (default maxAge * 2) */
  staleWhileRevalidateSeconds?: number;
  /** Headers the response varies on, e.g. ["Accept-Encoding"] */
  vary?: string[];
};

const defaults = {
  maxAge: 300,
  scope: "public" as const,
  staleWhileRevalidate: false,
};

/**
 * Express middleware that sets Cache-Control and ETag headers.
 *
 * ETag is computed from the actual response body (not the URL), so it
 * correctly changes whenever the content changes. Cache headers are only
 * applied to successful (2xx) responses so failed requests aren't cached.
 *
 * Usage:
 *   app.get("/api/foo", cacheMiddleware({ maxAge: 600 }), handler);
 */
export function cacheMiddleware(opts: CacheOptions = {}) {
  const {
    maxAge,
    scope,
    staleWhileRevalidate,
    staleWhileRevalidateSeconds,
    vary,
  } = {
    ...defaults,
    ...opts,
  };

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

    if (vary && vary.length > 0) {
      res.setHeader("Vary", vary.join(", "));
    }

    // Buffer the response body so we can hash it for the ETag and only
    // send cache headers when the response actually succeeded.
    const chunks: Buffer[] = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = ((chunk: any, ...args: any[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return originalWrite(chunk, ...args);
    }) as typeof res.write;

    res.end = ((chunk: any, ...args: any[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      // Only attach cache headers for successful responses.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const body = Buffer.concat(chunks);
        const etag = `W/"${createHash("sha1").update(body).digest("base64")}"`;

        // If the client already has this exact content, short-circuit to 304.
        // Note: since we've already buffered the body, we still need to send
        // headers before ending — we swap in a 304 instead of the buffered body.
        if (req.headers["if-none-match"] === etag) {
          res.removeHeader("Content-Length");
          res.statusCode = 304;
          res.setHeader("ETag", etag);
          return originalEnd();
        }

        const directives = [scope, `max-age=${maxAge}`];
        if (staleWhileRevalidate) {
          directives.push(
            `stale-while-revalidate=${staleWhileRevalidateSeconds ?? maxAge * 2}`,
          );
        }
        res.setHeader("Cache-Control", directives.join(", "));
        res.setHeader("ETag", etag);
      }

      return originalEnd(chunk, ...args);
    }) as typeof res.end;

    next();
  };
}
