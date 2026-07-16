import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  assignmentService,
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
} from "./assignment.service";

export const assignmentController = {
  async addAssignment(req: AuthRequest, res: Response) {
    try {
      const data = CreateAssignmentSchema.parse(req.body);
      const { courseId, batchId } = req.body;
      if (!courseId || !batchId) {
        return res
          .status(400)
          .json({ error: "courseId and batchId are required" });
      }
      const assignment = await assignmentService.addAssignment(
        req.params.moduleId,
        courseId,
        batchId,
        data,
      );
      return res.status(201).json(assignment);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Module not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  async updateAssignment(req: AuthRequest, res: Response) {
    try {
      const data = UpdateAssignmentSchema.parse(req.body);
      const assignment = await assignmentService.updateAssignment(
        req.params.id,
        data,
      );
      return res.json(assignment);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Assignment not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteAssignment(req: AuthRequest, res: Response) {
    try {
      await assignmentService.deleteAssignment(req.params.id);
      return res.json({ message: "Assignment deleted" });
    } catch (error: any) {
      if (error.message === "Assignment not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },
};
