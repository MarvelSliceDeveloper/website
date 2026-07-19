import { prisma } from "../../utils/prisma";
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
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: "courseId is required" });
      }

      let { batchId } = req.body;
      if (!batchId) {
        const firstBatch = await prisma.batch.findFirst({
          where: { courseId },
          select: { id: true },
          orderBy: { startDate: "asc" },
        });
        batchId = firstBatch?.id || "";
        if (!batchId) {
          return res.status(400).json({
            error:
              "No batches found for this course. Please create a batch first, or provide a batchId.",
          });
        }
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

  async reorderAssignments(req: AuthRequest, res: Response) {
    try {
      const { assignmentIds } = req.body;
      if (!Array.isArray(assignmentIds))
        return res
          .status(400)
          .json({ error: "assignmentIds must be an array" });
      const result = await assignmentService.reorderAssignments(
        req.params.moduleId,
        assignmentIds,
      );
      return res.json(result);
    } catch (error: any) {
      if (error.message === "Module not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },
};
