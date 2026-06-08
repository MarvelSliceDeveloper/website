import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  moduleService,
  CreateModuleSchema,
  UpdateModuleSchema,
  ReorderModulesSchema,
} from './module.service';
import { buildModuleResourceUrl } from './modules.upload';

export const moduleController = {
  async addModule(req: AuthRequest, res: Response) {
    try {
      const data = CreateModuleSchema.parse(req.body);
      const module = await moduleService.addModule(req.params.id, data);
      return res.status(201).json(module);
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

  async updateModule(req: AuthRequest, res: Response) {
    try {
      const data = UpdateModuleSchema.parse(req.body);
      const module = await moduleService.updateModule(req.params.id, data);
      return res.json(module);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Module not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteModule(req: AuthRequest, res: Response) {
    try {
      await moduleService.deleteModule(req.params.id);
      return res.json({ message: 'Module deleted' });
    } catch (error: any) {
      if (error.message === 'Module not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async reorderModules(req: AuthRequest, res: Response) {
    try {
      const { moduleIds } = ReorderModulesSchema.parse(req.body);
      await moduleService.reorderModules(req.params.id, moduleIds);
      return res.json({ message: 'Modules reordered' });
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

  async uploadResource(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resource file is required' });
      }

      const moduleId = req.params.id;
      const courseId = req.params.courseId;
      const url = buildModuleResourceUrl(req, courseId, moduleId, req.file.filename);

      const resource = await moduleService.addResource(
        moduleId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        url
      );

      return res.status(201).json(resource);
    } catch (error: any) {
      if (error.message === 'Module not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteResource(req: AuthRequest, res: Response) {
    try {
      const moduleId = req.params.id;
      const resourceId = req.params.resourceId;

      await moduleService.deleteResource(moduleId, resourceId);
      return res.json({ message: 'Resource deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Module not found' || error.message === 'Resource not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },
};
