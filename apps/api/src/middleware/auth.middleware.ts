/**
 * Authentication and authorization middleware for Express.
 *
 * Provides four middleware layers:
 * - requireAuth: Verifies JWT from Authorization header or cookie, attaches user to request
 * - optionalAuth: Same as requireAuth but silently continues for unauthenticated requests
 * - requireRole: Checks user role against allowed roles, respecting role hierarchy
 * - requireSuperAdmin: Restricts endpoint to SUPER_ADMIN role only
 *
 * Tokens are verified with HS256 algorithm only (prevents algorithm confusion attacks).
 * Per-user session timeout is enforced via sessionTimeoutMin claim.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@lms/types";
import { prisma } from "../utils/prisma";

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

/**
 * Role hierarchy, highest privilege first. A role at a given position
 * automatically satisfies any requireRole() check for roles at or below it.
 *
 * NOTE: adjust this list to match the actual UserRole enum in @lms/types —
 * this ordering is inferred from usage in this file (SUPER_ADMIN > ADMIN)
 * plus common LMS roles. Add/remove/reorder as needed.
 */
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.INSTRUCTOR,
  UserRole.STUDENT,
];

const ROLE_LEVEL = new Map<UserRole, number>(
  ROLE_HIERARCHY.map((role, idx) => [role, idx])
);

const VALID_ROLES = new Set<string>(Object.values(UserRole));

/** True if `role` is at least as privileged as the most permissive role in `allowed` */
function satisfiesRole(role: UserRole, allowed: UserRole[]): boolean {
  if (allowed.includes(role)) return true;

  const roleLevel = ROLE_LEVEL.get(role);
  if (roleLevel === undefined) return false; // unknown role: no implicit access

  const minAllowedLevel = Math.min(
    ...allowed.map((r) => ROLE_LEVEL.get(r) ?? Infinity)
  );

  return roleLevel < minAllowedLevel;
}

function extractToken(req: Request): string | undefined {
  const headerToken = req.headers.authorization?.split(" ")[1];
  if (headerToken) return headerToken;

  const cookieToken = (req as any).cookies?.accessToken;
  if (cookieToken) return cookieToken;

  return undefined;
}

function verifyAndBuildUser(
  token: string
): AuthRequest["user"] | undefined {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  }) as jwt.JwtPayload & AuthRequest["user"];

  if (
    !payload ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    !payload.role ||
    !VALID_ROLES.has(payload.role)
  ) {
    return undefined;
  }

  return {
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    sessionTimeoutMin: payload.sessionTimeoutMin,
  };
}

function sessionExpired(
  payload: jwt.JwtPayload & AuthRequest["user"]
): boolean {
  const iat = payload.iat;
  if (payload.sessionTimeoutMin && iat) {
    const tokenAge = (Date.now() - iat * 1000) / 60000;
    return tokenAge > payload.sessionTimeoutMin;
  }
  return false;
}

// Verify JWT from Authorization header or cookie, attach user to request
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req);

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
      !payload.role ||
      !VALID_ROLES.has(payload.role)
    ) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Enforce per-user session timeout
    if (sessionExpired(payload)) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      sessionTimeoutMin: payload.sessionTimeoutMin,
    };

    // Verify admin session is still active (non-blocking for backward compat)
    if (req.user && (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN)) {
      const tokenPayload = jwt.decode(token) as jwt.JwtPayload & { sessionId?: string } | null;
      if (tokenPayload?.sessionId) {
        try {
          const session = await prisma.adminSession.findUnique({
            where: { id: tokenPayload.sessionId },
            select: { active: true },
          });
          if (!session || !session.active) {
            return res.status(401).json({ error: "Session has been terminated" });
          }
          // Update lastActiveAt periodically (once per minute)
          const now = Math.floor(Date.now() / 60000);
          const lastUpdate = Math.floor((payload.iat || 0) / 60);
          if (now > lastUpdate) {
            prisma.adminSession.update({
              where: { id: tokenPayload.sessionId },
              data: { lastActiveAt: new Date() },
            }).catch(() => {});
          }
        } catch {
          // If session check fails, allow request through (degraded mode)
        }
      }
    }

    next();
  } catch (err) {
    console.error("[requireAuth] token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Optional auth — populates req.user if a valid token is present (header or
// cookie), but does NOT reject unauthenticated requests
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & AuthRequest["user"];

    if (
      payload &&
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      payload.role &&
      VALID_ROLES.has(payload.role) &&
      !sessionExpired(payload)
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

// Check that the authenticated user has one of the allowed roles.
// Higher-privilege roles (per ROLE_HIERARCHY) automatically inherit access
// granted to lower-privilege roles, e.g. SUPER_ADMIN passes requireRole([ADMIN]),
// and also requireRole([INSTRUCTOR]) or any role below it in the hierarchy.
export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!satisfiesRole(req.user.role, roles)) {
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