import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  courseService,
  CreateCourseSchema,
  UpdateCourseSchema,
} from './course.service';
import { buildCourseThumbnailUrl } from './course.upload';

export const courseController = {
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
};
