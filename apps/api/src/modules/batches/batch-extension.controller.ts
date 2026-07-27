import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { batchExtensionService, CreateExtensionSchema } from "./batch-extension.service";

export const batchExtensionController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateExtensionSchema.parse(req.body);
      const ext = await batchExtensionService.create(req.params.batchId, data, req.user!.userId);
      return res.status(201).json(ext);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const extensions = await batchExtensionService.list(req.params.batchId);
      return res.json(extensions);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      await batchExtensionService.remove(req.params.batchId, req.params.extensionId);
      return res.json({ message: "Extension revoked" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
