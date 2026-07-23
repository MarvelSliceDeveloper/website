import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  practicalService,
  CreatePracticalSchema,
  UpdatePracticalSchema,
} from "./practical.service";

export const practicalController = {
  async addPractical(req: AuthRequest, res: Response) {
    try {
      const data = CreatePracticalSchema.parse(req.body);
      const practical = await practicalService.addPractical(
        req.params.moduleId,
        data,
      );
      return res.status(201).json(practical);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updatePractical(req: AuthRequest, res: Response) {
    try {
      const data = UpdatePracticalSchema.parse(req.body);
      const practical = await practicalService.updatePractical(
        req.params.id,
        data,
      );
      return res.json(practical);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async deletePractical(req: AuthRequest, res: Response) {
    try {
      await practicalService.deletePractical(req.params.id);
      return res.json({ message: "Practical deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async uploadPdf(req: AuthRequest, res: Response) {
    try {
      if (!req.file)
        return res.status(400).json({ error: "PDF file is required" });

      const courseId = req.params.courseId;
      const url = `/uploads/courses/${courseId}/practicals/pdfs/${req.file.filename}`;

      return res.status(201).json({ url, filename: req.file.filename });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async uploadResource(req: AuthRequest, res: Response) {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Resource file is required" });

      const practicalId = req.params.practicalId;
      const courseId = req.params.courseId;
      const url = `/uploads/courses/${courseId}/practicals/${practicalId}/${req.file.filename}`;

      const resource = await practicalService.addResource(
        practicalId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        url,
      );
      return res.status(201).json(resource);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      const { practicalId, resourceId } = req.params;
      await practicalService.deleteResource(practicalId, resourceId);
      return res.json({ message: "Resource deleted successfully" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
