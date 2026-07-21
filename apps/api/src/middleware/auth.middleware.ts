/**
 * Authentication and authorization middleware for Express.
 *
 * Provides four middleware layers:
 * - requireAuth: Verifies JWT from Authorization header or cookie, attaches user to request
 * - optionalAuth: Same as requireAuth but silently continues for unauthenticated requests
 * - requireRole: Checks user role against allowed roles (SUPER_ADMIN inherits ADMIN access)
 * - requireSuperAdmin: Restricts endpoint to SUPER_ADMIN role only
 *
 * Tokens are verified with HS256 algorithm only (prevents algorithm confusion attacks).
 * Per-user session timeout is enforced via sessionTimeoutMin claim.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@lms/types";

/** Resolves required env var or throws at middleware init time */
function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getJwtSecret(): string {
  return assertEnv("JWT_SECRET");
}

/** Extended Request type with authenticated user payload */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
    sessionTimeoutMin?: number;
  };
}

// Verify JWT from Authorization header or cookie, attach user to request
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Pin the allowed algorithm(s) to prevent algorithm-confusion attacks
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & AuthRequest["user"];

    // Validate the payload actually has the shape we expect at runtime,
    // not just at compile time via the cast above
    if (
      !payload ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      !payload.role
    ) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      sessionTimeoutMin: payload.sessionTimeoutMin,
    };

    // Enforce per-user session timeout
    const iat = payload.iat;
    if (payload.sessionTimeoutMin && iat) {
      const timeoutMin = payload.sessionTimeoutMin;
      const tokenAge = (Date.now() - iat * 1000) / 60000;
      if (tokenAge > timeoutMin) {
        return res.status(401).json({ error: "Session expired" });
      }
    }

    next();
  } catch (err) {
    console.error("[requireAuth] token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Optional auth — populates req.user if token present, but does NOT reject unauthenticated requests
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & AuthRequest["user"];

    if (
      payload &&
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      payload.role
    ) {
      req.user = {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        sessionTimeoutMin: payload.sessionTimeoutMin,
      };
    }
  } catch {
    // Silently ignore invalid tokens — treated as unauthenticated
  }
  next();
};

// Check that the authenticated user has one of the allowed roles
// SUPER_ADMIN automatically inherits ADMIN-level access
export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (
      req.user.role === UserRole.SUPER_ADMIN &&
      roles.includes(UserRole.ADMIN)
    ) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Restrict endpoint to SUPER_ADMIN only
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ error: "Super Admin only" });
  }
  next();
};
