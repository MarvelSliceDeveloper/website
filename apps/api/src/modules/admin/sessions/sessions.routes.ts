import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.adminSession.findMany({
      where: { userId: req.user!.userId },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        tokenPrefix: true,
        ip: true,
        userAgent: true,
        deviceInfo: true,
        lastActiveAt: true,
        createdAt: true,
        expiresAt: true,
        active: true,
      },
    });
    return res.json({ sessions });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    });
  }
});

router.get("/all", async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.adminSession.findMany({
      where: {
        user: {
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        },
      },
      orderBy: { lastActiveAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return res.json({ sessions });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    });
  }
});

router.post("/:id/kill", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await prisma.adminSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    await prisma.adminSession.update({
      where: { id },
      data: { active: false },
    });
    return res.json({ message: "Session terminated" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to kill session",
    });
  }
});

router.post("/kill-all", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.adminSession.updateMany({
      where: {
        userId: req.user!.userId,
        active: true,
      },
      data: { active: false },
    });
    return res.json({ message: "All other sessions terminated" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to kill sessions",
    });
  }
});

export const sessionsRouter = router;
