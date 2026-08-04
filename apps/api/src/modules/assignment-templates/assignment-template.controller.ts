import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";

export const assignmentTemplateController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const templates = await prisma.assignmentTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.json({ templates });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const template = await prisma.assignmentTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({ error: "Assignment template not found" });
      }

      return res.json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { title, description, type, questionPdfUrl, maxPoints, category } =
        req.body;

      if (!title || !description) {
        return res
          .status(400)
          .json({ error: "Title and description are required" });
      }

      const template = await prisma.assignmentTemplate.create({
        data: {
          title,
          description,
          type: type ?? "QUIZ",
          questionPdfUrl,
          maxPoints: maxPoints ?? 100,
          category,
        },
      });

      return res.status(201).json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, type, questionPdfUrl, maxPoints, category } =
        req.body;

      const existing = await prisma.assignmentTemplate.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: "Assignment template not found" });
      }

      const template = await prisma.assignmentTemplate.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type }),
          ...(questionPdfUrl !== undefined && { questionPdfUrl }),
          ...(maxPoints !== undefined && { maxPoints }),
          ...(category !== undefined && { category }),
        },
      });

      return res.json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.assignmentTemplate.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: "Assignment template not found" });
      }

      await prisma.assignmentTemplate.delete({ where: { id } });
      return res.json({ message: "Assignment template deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
