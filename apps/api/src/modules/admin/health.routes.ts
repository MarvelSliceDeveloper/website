import { Router, type Response } from "express";
import { prisma } from "../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const startTime = Date.now();

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// GET /api/admin/users/health — system health check (admin and super admin)
router.get("/health", async (_req: AuthRequest, res: Response) => {
  let dbStatus: string;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  return res.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
    memory: process.memoryUsage(),
  });
});

export { router as adminHealthRouter };
