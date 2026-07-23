import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  lessonService,
  CreateLessonSchema,
  UpdateLessonSchema,
  ReorderLessonsSchema,
} from "./lesson.service";
import { buildLessonResourceUrl } from "./modules.upload";

export const lessonController = {
  async addLesson(req: AuthRequest, res: Response) {
    try {
      const data = CreateLessonSchema.parse(req.body);
      const lesson = await lessonService.addLesson(req.params.moduleId, data);
      return res.status(201).json(lesson);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updateLesson(req: AuthRequest, res: Response) {
    try {
      const data = UpdateLessonSchema.parse(req.body);
      const lesson = await lessonService.updateLesson(req.params.id, data);
      return res.json(lesson);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async deleteLesson(req: AuthRequest, res: Response) {
    try {
      await lessonService.deleteLesson(req.params.id);
      return res.json({ message: "Lesson deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async reorderLessons(req: AuthRequest, res: Response) {
    try {
      const { lessonIds } = ReorderLessonsSchema.parse(req.body);
      await lessonService.reorderLessons(req.params.moduleId, lessonIds);
      return res.json({ message: "Lessons reordered" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async uploadResource(req: AuthRequest, res: Response) {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Resource file is required" });

      const lessonId = req.params.lessonId;
      const courseId = req.params.courseId;
      const url = buildLessonResourceUrl(
        req,
        courseId,
        lessonId,
        req.file.filename,
      );

      const resource = await lessonService.addResource(
        lessonId,
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
      const { lessonId, resourceId } = req.params;
      await lessonService.deleteResource(lessonId, resourceId);
      return res.json({ message: "Resource deleted successfully" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async reorderResources(req: AuthRequest, res: Response) {
    try {
      const { resourceIds } = req.body;
      if (!Array.isArray(resourceIds))
        return res.status(400).json({ error: "resourceIds must be an array" });
      await lessonService.reorderResources(req.params.lessonId, resourceIds);
      return res.json({ message: "Resources reordered" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
