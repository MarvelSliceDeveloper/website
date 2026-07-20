import { Router } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";

export const onboardingRouter = Router();

onboardingRouter.patch(
  "/complete",
  requireAuth,
  async (req: AuthRequest, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
      select: { id: true, onboardingComplete: true },
    });

    res.json({ onboardingComplete: user.onboardingComplete });
  },
);
