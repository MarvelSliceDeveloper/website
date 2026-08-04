import { describe, it, expect, vi, beforeEach } from "vitest";
import { cacheMiddleware } from "../../middleware/cache.middleware";

function createMockReq(method = "GET", url = "/api/test", hasUser = false) {
  const req: any = {
    method,
    originalUrl: url,
    headers: {},
  };
  if (hasUser) {
    req.user = { userId: "u1" };
  }
  return req;
}

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  const res: any = {
    write: vi.fn().mockReturnThis(),
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    removeHeader: vi.fn((key: string) => {
      delete headers[key];
    }),
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    end: vi.fn().mockReturnThis(),
    getHeaders: () => headers,
    get statusCode() {
      return statusCode;
    },
    set statusCode(v: number) {
      statusCode = v;
    },
  };
  return res;
}

function createMockNext() {
  return vi.fn();
}

describe("cacheMiddleware", () => {
  it("sets Cache-Control and ETag headers for GET requests", () => {
    const req = createMockReq("GET", "/api/courses");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware()(req, res, next);
    res.end();

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=300",
    );
    expect(res.setHeader).toHaveBeenCalledWith("ETag", expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it("skips caching for POST requests", () => {
    const req = createMockReq("POST", "/api/courses");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware()(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("sets private cache for authenticated requests", () => {
    const req = createMockReq("GET", "/api/notes", true);
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware()(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-cache",
    );
    expect(next).toHaveBeenCalled();
  });

  it("returns 304 when If-None-Match matches ETag", () => {
    const req = createMockReq("GET", "/api/courses");
    const res = createMockRes();
    const next = createMockNext();

    // First call to get the ETag
    cacheMiddleware()(req, res, next);
    res.end();
    const etagCall = res.setHeader.mock.calls.find(
      (c: any[]) => c[0] === "ETag",
    );
    const etag = etagCall?.[1];

    // Second call with matching If-None-Match
    const req2 = createMockReq("GET", "/api/courses");
    req2.headers["if-none-match"] = etag;
    const res2 = createMockRes();
    const next2 = createMockNext();

    cacheMiddleware()(req2, res2, next2);
    res2.end();

    expect(res2.statusCode).toBe(304);
    expect(next2).toHaveBeenCalled();
  });

  it("respects custom maxAge option", () => {
    const req = createMockReq("GET", "/api/data");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware({ maxAge: 600 })(req, res, next);
    res.end();

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=600",
    );
  });

  it("includes stale-when-revalidate when enabled", () => {
    const req = createMockReq("GET", "/api/data");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware({ staleWhileRevalidate: true })(req, res, next);
    res.end();

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600",
    );
  });

  it("respects private scope option", () => {
    const req = createMockReq("GET", "/api/data");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware({ scope: "private" })(req, res, next);
    res.end();

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, max-age=300",
    );
  });

  it("caches HEAD requests", () => {
    const req = createMockReq("HEAD", "/api/courses");
    const res = createMockRes();
    const next = createMockNext();

    cacheMiddleware()(req, res, next);
    res.end();

    expect(res.setHeader).toHaveBeenCalledWith("ETag", expect.any(String));
    expect(next).toHaveBeenCalled();
  });
});
