import { Router, Request, Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  AuthRequest,
} from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";
import { paginate } from "../../utils/paginate";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/login-history — list all login history records
router.get("/", async (req: Request, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        orderBy: { loginAt: "desc" },
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.loginLog.count(),
    ]);
    return res.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[LoginHistory] Error fetching login history:", error);
    return res.status(500).json({ error: "Failed to fetch login history" });
  }
});

// GET /api/admin/login-history/:userId — login history for a specific user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const logs = await prisma.loginLog.findMany({
      where: { userId },
      orderBy: { loginAt: "desc" },
    });
    return res.json({ logs });
  } catch (error: any) {
    console.error("[LoginHistory] Error fetching user login history:", error);
    return res.status(500).json({ error: "Failed to fetch login history" });
  }
});

export const loginHistoryRouter = router;
