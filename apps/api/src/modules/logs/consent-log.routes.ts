import { Router, Request, Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/consent-logs — list all consent logs
router.get("/", async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.consentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return res.json({ logs });
  } catch (error: any) {
    console.error("[ConsentLogs] Error fetching consent logs:", error);
    return res.status(500).json({ error: "Failed to fetch consent logs" });
  }
});

// GET /api/admin/consent-logs/:userId — consent logs for a specific user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const logs = await prisma.consentLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ logs });
  } catch (error: any) {
    console.error("[ConsentLogs] Error fetching user consent logs:", error);
    return res.status(500).json({ error: "Failed to fetch consent logs" });
  }
});

export const consentLogRouter = router;
