import { Router, type Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

let lastFlushAt: string | null = null;

// GET /status — Cache status info
router.get("/status", async (_req: AuthRequest, res: Response) => {
  try {
    const redisConfigured = !!process.env.REDIS_URL;

    return res.json({
      data: {
        configured: redisConfigured,
        connected: false,
        message: redisConfigured
          ? "Redis is configured but not yet connected"
          : "Redis not configured",
        lastFlushAt,
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get cache status",
    });
  }
});

// POST /flush — Flush cache
router.post("/flush", async (_req: AuthRequest, res: Response) => {
  try {
    lastFlushAt = new Date().toISOString();

    return res.json({
      message: "Cache flushed successfully",
      flushedAt: lastFlushAt,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to flush cache",
    });
  }
});

export { router as cacheRouter };
