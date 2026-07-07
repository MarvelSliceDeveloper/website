import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import type { AuthRequest } from "../../middleware/auth.middleware";

export const settingController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: { key: "asc" },
      });
      return res.json({ settings });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined || value === null) {
        return res.status(400).json({ error: "value is required" });
      }

      const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });

      return res.json({ setting });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
};
