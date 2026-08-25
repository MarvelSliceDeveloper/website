import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { resetMaintenanceCache } from "../../../middleware/maintenance.middleware";

const router = Router();
const MAINTENANCE_KEY = "maintenance_mode";

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: MAINTENANCE_KEY },
    });
    const parsed = setting
      ? JSON.parse(setting.value)
      : { enabled: false, message: "" };
    return res.json(parsed);
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to get maintenance status",
    });
  }
});

router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, message } = req.body;
    const value = JSON.stringify({
      enabled: !!enabled,
      message: typeof message === "string" ? message : "",
    });
    await prisma.systemSetting.upsert({
      where: { key: MAINTENANCE_KEY },
      update: { value },
      create: {
        key: MAINTENANCE_KEY,
        value,
        type: "json",
        description: "Maintenance mode toggle",
      },
    });
    resetMaintenanceCache();
    return res.json({
      enabled: !!enabled,
      message: typeof message === "string" ? message : "",
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to update maintenance status",
    });
  }
});

export const maintenanceRouter = router;
