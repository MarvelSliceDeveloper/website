import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  courseService,
  CreateCourseSchema,
  UpdateCourseSchema,
} from './course.service';
import { buildCourseThumbnailUrl } from './course.upload';
import { prisma } from '../../utils/prisma';

export const courseController = {
  // Creates a new course
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateCourseSchema.parse(req.body);
      const course = await courseService.createCourse(req.user!.userId, data);
      return res.status(201).json(course);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Gets a single course by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const course = await courseService.getCourseById(req.params.id);
      return res.json(course);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  // Updates a course
  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdateCourseSchema.parse(req.body);
      const course = await courseService.updateCourse(req.params.id, data);
      return res.json(course);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Uploads a course thumbnail image
  async uploadThumbnail(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Thumbnail file is required' });
      }

      const thumbnailUrl = buildCourseThumbnailUrl(req, req.file.filename);
      const data = UpdateCourseSchema.parse({ thumbnailUrl });
      const course = await courseService.updateCourse(req.params.id, data);
      return res.json({ thumbnailUrl: course.thumbnailUrl });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Archives (soft-deletes) a course
  async delete(req: AuthRequest, res: Response) {
    try {
      await courseService.deleteCourse(req.params.id);
      return res.status(200).json({ message: 'Course archived successfully' });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  // Publishes a course after validation
  async publish(req: AuthRequest, res: Response) {
    try {
      const result = await courseService.publishCourse(req.params.id);
      if (!result.published) {
        return res.status(422).json({
          error: 'Course does not meet publish requirements',
          checklist: result.checklist,
        });
      }
      return res.json({
        message: 'Course published',
        published: true,
        checklist: result.checklist,
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  // Unpublishes a course back to DRAFT
  async unpublish(req: AuthRequest, res: Response) {
    try {
      const course = await courseService.unpublishCourse(req.params.id);
      return res.json({ message: 'Course unpublished', course });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Lists sessions for a course
  async listSessions(req: AuthRequest, res: Response) {
    try {
      const sessions = await prisma.liveSession.findMany({
        where: {
          batch: { courseId: req.params.courseId },
        },
        include: {
          batch: { select: { id: true, name: true } },
          module: { select: { id: true, title: true } },
          recording: { select: { id: true, syncedAt: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      });
      return res.json({ sessions });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Lists recordings for a course
  async listRecordings(req: AuthRequest, res: Response) {
    try {
      const recordings = await prisma.recording.findMany({
        where: {
          session: { batch: { courseId: req.params.courseId } },
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
        orderBy: { syncedAt: 'desc' },
      });
      return res.json({ recordings });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
