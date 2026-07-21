import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import type { AuthRequest } from "../../middleware/auth.middleware";

export const logController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const skip = (page - 1) * limit;
      const { userId, action, status, from, to } = req.query;

      const where: Record<string, unknown> = {};

      if (userId) where.userId = userId as string;
      if (action) where.action = action as string;
      if (status) where.statusCode = parseInt(status as string);
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from as string);
        if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to as string);
      }

      const [logs, total] = await Promise.all([
        prisma.graphApiLog.findMany({
          where: where as any,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.graphApiLog.count({ where: where as any }),
      ]);

      return res.json({
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  async stats(req: AuthRequest, res: Response) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [totalLogs, failedLogs, topErrors] = await Promise.all([
        prisma.graphApiLog.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.graphApiLog.count({
          where: { createdAt: { gte: thirtyDaysAgo }, success: false },
        }),
        prisma.graphApiLog.groupBy({
          by: ["errorMsg"],
          where: {
            createdAt: { gte: thirtyDaysAgo },
            success: false,
            errorMsg: { not: null },
          },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
      ]);

      return res.json({
        stats: {
          totalLogs,
          failedLogs,
          errorRate: totalLogs > 0 ? ((failedLogs / totalLogs) * 100).toFixed(2) : "0",
          topErrors: topErrors
            .filter((e) => e.errorMsg)
            .map((e) => ({ error: e.errorMsg, count: e._count.id })),
        },
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
};
