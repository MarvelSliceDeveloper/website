import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
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
    } catch (error: unknown) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg === "Module not found")
        return res.status(404).json({ error: msg });
      return res.status(400).json({ error: msg });
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
    } catch (error: unknown) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg === "Practical not found")
        return res.status(404).json({ error: msg });
      return res.status(400).json({ error: msg });
    }
  },

  async deletePractical(req: AuthRequest, res: Response) {
    try {
      await practicalService.deletePractical(req.params.id);
      return res.json({ message: "Practical deleted" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg === "Practical not found")
        return res.status(404).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  },

  async uploadPdf(req: AuthRequest, res: Response) {
    try {
      if (!req.file)
        return res.status(400).json({ error: "PDF file is required" });

      const courseId = req.params.courseId;
      const url = `/uploads/courses/${courseId}/practicals/pdfs/${req.file.filename}`;

      return res.status(201).json({ url, filename: req.file.filename });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({ error: msg });
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg === "Practical not found")
        return res.status(404).json({ error: msg });
      return res.status(400).json({ error: msg });
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      const { practicalId, resourceId } = req.params;
      await practicalService.deleteResource(practicalId, resourceId);
      return res.json({ message: "Resource deleted successfully" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (
        msg === "Practical not found" ||
        msg === "Resource not found"
      )
        return res.status(404).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  },
};
