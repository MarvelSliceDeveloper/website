import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  assignmentService,
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  SubmitAssignmentSchema,
  GradeSchema,
} from './assignments.service';

export const assignmentController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateAssignmentSchema.parse(req.body);
      const assignment = await assignmentService.createAssignment(req.user!.userId, data);
      return res.status(201).json(assignment);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const { batchId, courseId } = req.query;
      const assignments = await assignmentService.listAssignments(req.user!.userId, {
        batchId: batchId as string,
        courseId: courseId as string,
      });
      return res.json(assignments);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const assignment = await assignmentService.getAssignmentById(req.params.id);
      return res.json(assignment);
    } catch (error: any) {
      if (error.message === 'Assignment not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdateAssignmentSchema.parse(req.body);
      const assignment = await assignmentService.updateAssignment(
        req.params.id,
        req.user!.userId,
        data
      );
      return res.json(assignment);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Assignment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the creator')) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await assignmentService.deleteAssignment(req.params.id, req.user!.userId);
      return res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Assignment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the creator')) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async submit(req: AuthRequest, res: Response) {
    try {
      const data = SubmitAssignmentSchema.parse(req.body);
      const submission = await assignmentService.submitAssignment(
        req.params.id,
        req.user!.userId,
        data
      );
      return res.status(201).json(submission);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Assignment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('not enrolled')) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async listSubmissions(req: AuthRequest, res: Response) {
    try {
      const { status, page, limit } = req.query;
      const result = await assignmentService.listSubmissions(
        req.params.id,
        req.user!.userId,
        {
          status: status as string,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        }
      );
      return res.json(result);
    } catch (error: any) {
      if (error.message === 'Assignment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the creator')) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async grade(req: AuthRequest, res: Response) {
    try {
      const data = GradeSchema.parse(req.body);
      const submission = await assignmentService.gradeSubmission(
        req.params.id,
        req.params.studentId,
        req.user!.userId,
        data
      );
      return res.json(submission);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'Assignment not found' || error.message === 'Submission not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the creator')) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  },
};
