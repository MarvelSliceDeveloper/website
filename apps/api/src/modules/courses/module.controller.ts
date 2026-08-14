import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  moduleService,
  CreateModuleSchema,
  UpdateModuleSchema,
  ReorderModulesSchema,
  ReorderContentSchema,
} from "./module.service";
import { courseService } from "./course.service";

export const moduleController = {
  // Creates a new module in a course
  async addModule(req: AuthRequest, res: Response) {
    try {
      const data = CreateModuleSchema.parse(req.body);
      const courseId = await courseService.resolveCourseId(req.params.id);
      const module = await moduleService.addModule(courseId, data);
      return res.status(201).json(module);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Updates an existing module
  async updateModule(req: AuthRequest, res: Response) {
    try {
      const data = UpdateModuleSchema.parse(req.body);
      const module = await moduleService.updateModule(req.params.id, data);
      return res.json(module);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Deletes a module from a course
  async deleteModule(req: AuthRequest, res: Response) {
    try {
      await moduleService.deleteModule(req.params.id);
      return res.json({ message: "Module deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Reorders modules within a course
  async reorderModules(req: AuthRequest, res: Response) {
    try {
      const { moduleIds } = ReorderModulesSchema.parse(req.body);
      const courseId = await courseService.resolveCourseId(req.params.id);
      await moduleService.reorderModules(courseId, moduleIds);
      return res.json({ message: "Modules reordered" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Reorders content items (lessons/quizzes/assignments) within a module
  async reorderContent(req: AuthRequest, res: Response) {
    try {
      const { contentOrder } = ReorderContentSchema.parse(req.body);
      await moduleService.reorderContent(req.params.moduleId, contentOrder);
      return res.json({ message: "Content reordered" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
