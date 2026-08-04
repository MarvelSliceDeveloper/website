import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import { apiKeyService } from "./api-key.service";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";

export const apiKeyController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const keys = await apiKeyService.list();
      return res.json({ keys });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await apiKeyService.create(
        name.trim(),
        description,
        req.user!.userId,
      );

      return res.status(201).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async revoke(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "API key not found" });
      }

      await apiKeyService.revoke(id);
      return res.json({ message: "API key revoked" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
