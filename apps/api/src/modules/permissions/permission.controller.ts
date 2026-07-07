import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import type { AuthRequest } from "../../middleware/auth.middleware";

export const permissionController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const overrides = await prisma.permissionOverride.findMany({
        orderBy: [{ role: "asc" }, { permission: "asc" }],
      });
      return res.json({ overrides });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { overrides } = req.body;

      if (!Array.isArray(overrides)) {
        return res.status(400).json({ error: "overrides must be an array" });
      }

      const results: Array<{ id: string; role: string; permission: string; allowed: boolean }> = [];

      for (const override of overrides) {
        const { role, permission, allowed } = override;

        if (!role || !permission) {
          return res
            .status(400)
            .json({ error: "Each override must have role and permission" });
        }

        const result = await prisma.permissionOverride.upsert({
          where: { role_permission: { role, permission } },
          update: { allowed: allowed ?? true },
          create: { role, permission, allowed: allowed ?? true },
        });

        results.push(result);
      }

      return res.json({ overrides: results });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
};
