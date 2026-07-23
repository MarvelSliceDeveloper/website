import { describe, it, expect, beforeAll, vi } from "vitest";
import jwt from "jsonwebtoken";
import {
  requireAuth,
  optionalAuth,
  requireRole,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const JWT_SECRET = "test-secret-key-for-unit-tests-32chars!!";

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

function createMockReq(token?: string, cookieToken?: string) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cookies: cookieToken ? { accessToken: cookieToken } : {},
    user: undefined as unknown,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

function createMockNext() {
  return vi.fn();
}

function signToken(
  payload: Record<string, unknown>,
  options?: jwt.SignOptions,
) {
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", ...options });
}

describe("requireAuth", () => {
  it("calls next() with valid token from Authorization header", () => {
    const token = signToken({
      userId: "u1",
      role: UserRole.STUDENT,
      email: "test@test.com",
    });
    const req = createMockReq(token);
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: "u1",
      role: UserRole.STUDENT,
      email: "test@test.com",
      sessionTimeoutMin: undefined,
    });
  });

  it("calls next() with valid token from cookie", () => {
    const token = signToken({
      userId: "u2",
      role: UserRole.ADMIN,
      email: "admin@test.com",
    });
    const req = createMockReq(undefined, token);
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe("u2");
  });

  it("returns 401 when no token provided", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for expired token", () => {
    const token = signToken(
      { userId: "u1", role: UserRole.STUDENT, email: "t@t.com" },
      { expiresIn: "-1s" },
    );
    const req = createMockReq(token);
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid token", () => {
    const req = createMockReq("invalid.token.here");
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when payload missing required fields", () => {
    const token = signToken({ userId: "u1" }); // missing role and email
    const req = createMockReq(token);
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token payload" });
  });

  it("enforces session timeout", () => {
    const token = signToken({
      userId: "u1",
      role: UserRole.STUDENT,
      email: "t@t.com",
      sessionTimeoutMin: 30,
      iat: Math.floor(Date.now() / 1000) - 60 * 60, // issued 1 hour ago
    });
    const req = createMockReq(token);
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Session expired" });
  });
});

describe("optionalAuth", () => {
  it("calls next() and populates user with valid token", () => {
    const token = signToken({
      userId: "u1",
      role: UserRole.STUDENT,
      email: "t@t.com",
    });
    const req = createMockReq(undefined, token);
    const res = createMockRes();
    const next = createMockNext();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe("u1");
  });

  it("calls next() without user when no token", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("calls next() without user for invalid token", () => {
    const req = createMockReq(undefined, "bad-token");
    const res = createMockRes();
    const next = createMockNext();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});

describe("requireRole", () => {
  it("allows user with matching role", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.ADMIN, email: "a@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireRole([UserRole.ADMIN])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("rejects user without matching role", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.STUDENT, email: "s@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireRole([UserRole.ADMIN])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when no user on request", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    requireRole([UserRole.ADMIN])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("SUPER_ADMIN inherits ADMIN access", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.SUPER_ADMIN, email: "sa@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireRole([UserRole.ADMIN])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("requireSuperAdmin", () => {
  it("allows SUPER_ADMIN", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.SUPER_ADMIN, email: "sa@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireSuperAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("rejects ADMIN", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.ADMIN, email: "a@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects STUDENT", () => {
    const req = createMockReq();
    req.user = { userId: "u1", role: UserRole.STUDENT, email: "s@t.com" };
    const res = createMockRes();
    const next = createMockNext();

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 403 when no user", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
