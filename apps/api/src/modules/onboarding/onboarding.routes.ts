import { Router } from "express";
import {
  requireAuth,
  type AuthRequest,
} from "../../middleware/auth.middleware";
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

    const { phone, timezone, address, state, country } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        ...(phone !== undefined && { phone }),
        ...(timezone !== undefined && { timezone }),
        ...(address !== undefined && { address }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
      },
      select: {
        id: true,
        onboardingComplete: true,
        phone: true,
        timezone: true,
        address: true,
        state: true,
        country: true,
      },
    });

    res.json({ onboardingComplete: user.onboardingComplete, profile: user });
  },
);
