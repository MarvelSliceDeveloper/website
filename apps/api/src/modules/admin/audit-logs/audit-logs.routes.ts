import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// POST / — Create audit log entry (internal use)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityType, entityId, details, ipAddress, userAgent } =
      req.body;

    if (!action || typeof action !== "string") {
      return res.status(400).json({ error: "Action is required" });
    }
    if (!entityType || typeof entityType !== "string") {
      return res.status(400).json({ error: "EntityType is required" });
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action,
        entityType,
        entityId: entityId ?? null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return res.status(201).json({ data: log });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create audit log",
    });
  }
});

// GET /user/:userId — Get all audit logs for a specific user
router.get("/user/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 50),
    );
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    return res.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: user.name,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
    });
  }
});

// GET / — List audit logs with filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      action,
      entityType,
      page: pageParam,
      limit: limitParam,
      startDate,
      endDate,
    } = req.query;

    const page = Math.max(1, parseInt(pageParam as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(limitParam as string) || 50),
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (userId && typeof userId === "string") {
      where.userId = userId;
    }
    if (action && typeof action === "string") {
      where.action = action;
    }
    if (entityType && typeof entityType === "string") {
      where.entityType = entityType;
    }
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate && typeof startDate === "string") {
        createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        createdAt.lte = new Date(endDate);
      }
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user?.name ?? null,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
    });
  }
});

export default router;
