import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  moduleService,
  CreateModuleSchema,
  UpdateModuleSchema,
  ReorderModulesSchema,
  ReorderContentSchema,
} from "./module.service";

export const moduleController = {
  // Creates a new module in a course
  async addModule(req: AuthRequest, res: Response) {
    try {
      const data = CreateModuleSchema.parse(req.body);
      const module = await moduleService.addModule(req.params.id, data);
      return res.status(201).json(module);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === "Course not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Updates an existing module
  async updateModule(req: AuthRequest, res: Response) {
    try {
      const data = UpdateModuleSchema.parse(req.body);
      const module = await moduleService.updateModule(req.params.id, data);
      return res.json(module);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === "Module not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Deletes a module from a course
  async deleteModule(req: AuthRequest, res: Response) {
    try {
      await moduleService.deleteModule(req.params.id);
      return res.json({ message: "Module deleted" });
    } catch (error: any) {
      if (error.message === "Module not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  // Reorders modules within a course
  async reorderModules(req: AuthRequest, res: Response) {
    try {
      const { moduleIds } = ReorderModulesSchema.parse(req.body);
      await moduleService.reorderModules(req.params.id, moduleIds);
      return res.json({ message: "Modules reordered" });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === "Course not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Reorders content items (lessons/quizzes/assignments) within a module
  async reorderContent(req: AuthRequest, res: Response) {
    try {
      const { contentOrder } = ReorderContentSchema.parse(req.body);
      await moduleService.reorderContent(req.params.moduleId, contentOrder);
      return res.json({ message: "Content reordered" });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === "Module not found") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },
};
