import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@lms/types";

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

    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & AuthRequest["user"];
    req.user = payload;

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
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
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
