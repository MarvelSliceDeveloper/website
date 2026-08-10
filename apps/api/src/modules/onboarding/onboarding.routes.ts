import { Router } from "express";
import {
  requireAuth,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

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

    const required: Record<string, string> = { phone, timezone, address, state, country };
    const missing = Object.entries(required)
      .filter(([, value]) => typeof value !== "string" || !value.trim())
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new AppError(
        400,
        `Missing required fields: ${missing.join(", ")}`,
      );
    }

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
