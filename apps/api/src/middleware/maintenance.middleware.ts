import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

const MAINTENANCE_KEY = "maintenance_mode";
const cache: { enabled: boolean; message: string; expiresAt: number } = {
  enabled: false,
  message: "",
  expiresAt: 0,
};

export async function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (now() < cache.expiresAt && !cache.enabled) return next();

  const isAdminRoute =
    req.path.startsWith("/api/admin/") || req.path.startsWith("/admin/");
  if (isAdminRoute) return next();

  const isAuthRoute =
    req.path.startsWith("/api/auth/login") ||
    req.path.startsWith("/api/auth/logout") ||
    req.path.startsWith("/api/auth/register") ||
    req.path.startsWith("/api/auth/me") ||
    req.path.startsWith("/api/auth/forgot-password") ||
    req.path.startsWith("/api/auth/reset-password") ||
    req.path.startsWith("/api/auth/azure-ad/callback") ||
    req.path.startsWith("/api/csrf-token");
  if (isAuthRoute) return next();

  if (req.path.startsWith("/api/maintenance-status")) return next();

  try {
    if (now() >= cache.expiresAt) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: MAINTENANCE_KEY },
      });
      if (setting) {
        const parsed = JSON.parse(setting.value);
        cache.enabled = parsed.enabled;
        cache.message = parsed.message || "";
        cache.expiresAt = now() + 15000;
      } else {
        cache.enabled = false;
        cache.message = "";
        cache.expiresAt = now() + 15000;
      }
    }

    if (cache.enabled) {
      return res.status(503).json({
        error: "maintenance",
        message: cache.message || "Platform is under maintenance. Please try again later.",
      });
    }

    next();
  } catch {
    next();
  }
}

function now() {
  return Date.now();
}

export function resetMaintenanceCache() {
  cache.enabled = false;
  cache.message = "";
  cache.expiresAt = 0;
}
