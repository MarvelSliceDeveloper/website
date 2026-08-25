import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import { notesService } from "./notes.service";
import { handleControllerError } from "../../utils/errors";

const createNoteSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  moduleId: z.string().min(1).optional(),
  title: z
    .string()
    .max(200, "Title must be 200 characters or fewer")
    .optional(),
  body: z
    .string()
    .max(50000, "Body must be 50,000 characters or fewer")
    .optional(),
  isSticky: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  title: z
    .string()
    .max(200, "Title must be 200 characters or fewer")
    .optional(),
  body: z
    .string()
    .max(50000, "Body must be 50,000 characters or fewer")
    .optional(),
  isSticky: z.boolean().optional(),
});

export const notesController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const courseId = req.query.courseId as string | undefined;
      const moduleId = req.query.moduleId as string | undefined;
      const isSticky = req.query.isSticky === "true" ? true : undefined;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = await notesService.list(
        req.user.userId,
        courseId,
        moduleId,
        isSticky,
        page,
        limit,
      );
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async get(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const note = await notesService.get(req.params.id, req.user.userId);
      if (!note) return res.status(404).json({ error: "Note not found" });
      return res.status(200).json({ note });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const parsed = createNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        return res.status(400).json({ error: errors });
      }
      const { courseId, moduleId, title, body, isSticky } = parsed.data;
      const note = await notesService.create({
        userId: req.user.userId,
        courseId,
        moduleId: moduleId || undefined,
        title: title || "",
        body: body || "",
        isSticky: isSticky || false,
      });
      return res.status(201).json({ note });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const parsed = updateNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        return res.status(400).json({ error: errors });
      }
      const { title, body, isSticky } = parsed.data;
      const result = await notesService.update(req.params.id, req.user.userId, {
        title,
        body,
        isSticky,
      });
      if (result.count === 0)
        return res.status(404).json({ error: "Note not found" });
      return res.status(200).json({ message: "Note updated" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const result = await notesService.delete(req.params.id, req.user.userId);
      if (result.count === 0)
        return res.status(404).json({ error: "Note not found" });
      return res.status(200).json({ message: "Note deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
