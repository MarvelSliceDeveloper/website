import { Router, Request, Response } from "express";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/logs — list audit-style logs (LoginLog + ConsentLog merged)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [loginLogs, consentLogs] = await Promise.all([
      prisma.loginLog.findMany({ orderBy: { loginAt: "desc" }, take: 100 }),
      prisma.consentLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);

    const logs = [
      ...loginLogs.map((l) => ({ ...l, source: "login" })),
      ...consentLogs.map((c) => ({ ...c, source: "consent" })),
    ].sort((a, b) => {
      const dateA = "loginAt" in a ? (a.loginAt as Date) : (a.createdAt as Date);
      const dateB = "loginAt" in b ? (b.loginAt as Date) : (b.createdAt as Date);
      return dateB.getTime() - dateA.getTime();
    });

    return res.json({ logs: logs.slice(0, 100) });
  } catch (error: any) {
    console.error("[Logs] Error fetching logs:", error);
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export const logRouter = router;
