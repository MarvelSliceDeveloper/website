import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  courseService,
  CreateCourseSchema,
  UpdateCourseSchema,
} from "./course.service";
import { buildCourseThumbnailUrl } from "./course.upload";
import { prisma } from "../../utils/prisma";

export const courseController = {
  // Creates a new course
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateCourseSchema.parse(req.body);
      const course = await courseService.createCourse(req.user!.userId, data);
      return res.status(201).json(course);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Lists courses with filters
  async list(req: AuthRequest, res: Response) {
    try {
      const { status, category, search, page, limit } = req.query;
      const result = await courseService.listCourses({
        status: status as string,
        category: category as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Gets a single course by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const course = await courseService.getCourseById(req.params.id);
      return res.json(course);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Updates a course
  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdateCourseSchema.parse(req.body);
      const course = await courseService.updateCourse(req.params.id, data);
      return res.json(course);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Uploads a course thumbnail image
  async uploadThumbnail(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Thumbnail file is required" });
      }

      const thumbnailUrl = buildCourseThumbnailUrl(req, req.file.filename);
      const data = UpdateCourseSchema.parse({ thumbnailUrl });
      const course = await courseService.updateCourse(req.params.id, data);
      return res.json({ thumbnailUrl: course.thumbnailUrl });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Archives (soft-deletes) a course
  async delete(req: AuthRequest, res: Response) {
    try {
      await courseService.deleteCourse(req.params.id, req.user?.userId);
      return res.status(200).json({ message: "Course archived successfully" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Permanently deletes a course and all related data (irreversible)
  async permanentDelete(req: AuthRequest, res: Response) {
    try {
      await courseService.permanentDeleteCourse(req.params.id);
      return res.status(200).json({ message: "Course permanently deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Publishes a course after validation
  async publish(req: AuthRequest, res: Response) {
    try {
      const result = await courseService.publishCourse(req.params.id);
      if (!result.published) {
        return res.status(422).json({
          error: "Course does not meet publish requirements",
          checklist: result.checklist,
        });
      }
      return res.json({
        message: "Course published",
        published: true,
        checklist: result.checklist,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Recovers an archived course back to DRAFT
  async recover(req: AuthRequest, res: Response) {
    try {
      const course = await courseService.recoverCourse(
        req.params.id,
        req.user?.userId,
      );
      return res.json({ message: "Course recovered", course });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Unpublishes a course back to DRAFT
  async unpublish(req: AuthRequest, res: Response) {
    try {
      const course = await courseService.unpublishCourse(req.params.id);
      return res.json({ message: "Course unpublished", course });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Lists sessions for a course
  async listSessions(req: AuthRequest, res: Response) {
    try {
      const courseId = await courseService.resolveCourseId(req.params.courseId);
      const sessions = await prisma.liveSession.findMany({
        where: {
          batch: { courseId },
        },
        include: {
          batch: { select: { id: true, name: true } },
          module: { select: { id: true, title: true } },
          recording: { select: { id: true, syncedAt: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
      return res.json({ sessions });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Lists recordings for a course
  async listRecordings(req: AuthRequest, res: Response) {
    try {
      const courseId = await courseService.resolveCourseId(req.params.courseId);
      const recordings = await prisma.recording.findMany({
        where: {
          session: { batch: { courseId } },
        },
        include: {
          session: {
            select: {
              id: true,
              scheduledAt: true,
              joinUrl: true,
              module: { select: { id: true, title: true } },
              batch: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { syncedAt: "desc" },
      });
      return res.json({ recordings });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
