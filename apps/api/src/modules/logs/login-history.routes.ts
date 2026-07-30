import { Router, Request, Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  AuthRequest,
} from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/login-history — list all login history records
router.get("/", async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.loginLog.findMany({
      orderBy: { loginAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return res.json({ logs });
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
