import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  assignmentService,
  CreateQuizSchema,
  CreateFileAssignmentSchema,
  SubmitMcqAnswersSchema,
  GradeSubmissionSchema,
} from './assignment.service';
import { buildAssignmentFileUrl } from './assignment.upload';

export const assignmentController = {
  // POST /api/assignments — creates a new quiz or assignment
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      if (req.body.type === 'ASSIGNMENT') {
        const data = CreateFileAssignmentSchema.parse(req.body);
        const assignment = await assignmentService.createFileAssignment(
          req.user.userId,
          data,
          data.questionPdfUrl
        );
        return res.status(201).json({ assignment });
      } else {
        const data = CreateQuizSchema.parse(req.body);
        const assignment = await assignmentService.createQuiz(req.user.userId, data);
        return res.status(201).json({ assignment });
      }
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message.includes('not the instructor') || error.message.includes('not found')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error creating assignment:', error.message);
      return res.status(500).json({ error: 'Failed to create assignment' });
    }
  },

  // GET /api/assignments — lists assignments scoped by role
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { batchId, courseId } = req.query;

      const assignments = await assignmentService.listAssignments({
        batchId: batchId as string | undefined,
        courseId: courseId as string | undefined,
        instructorId: req.user.role === 'INSTRUCTOR' ? req.user.userId : undefined,
        studentId: req.user.role === 'STUDENT' ? req.user.userId : undefined,
      });

      return res.status(200).json({ assignments });
    } catch (error: any) {
      console.error('Error listing assignments:', error.message);
      return res.status(500).json({ error: 'Failed to list assignments' });
    }
  },

  // GET /api/assignments/:id/questions — gets questions for an assignment
  async getQuestions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const isInstructor = req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN';
      const data = await assignmentService.getAssignmentQuestions(
        req.params.id,
        req.user.userId,
        isInstructor
      );

      return res.status(200).json(data);
    } catch (error: any) {
      if (error.message.includes('not enrolled') || error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error getting assignment questions:', error.message);
      return res.status(500).json({ error: 'Failed to get questions' });
    }
  },

  // POST /api/assignments/:id/submit/mcq — submits MCQ answers for grading
  async submitMcq(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Only students can submit assignments' });
      }

      const { answers } = SubmitMcqAnswersSchema.parse(req.body);
      const submission = await assignmentService.submitMcqAnswers(
        req.user.userId,
        req.params.id,
        answers
      );

      return res.status(200).json({ submission });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (
        error.message.includes('due date has passed') ||
        error.message.includes('already submitted') ||
        error.message.includes('not enrolled')
      ) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error submitting answers:', error.message);
      return res.status(500).json({ error: 'Failed to submit answers' });
    }
  },

  // GET /api/assignments/submissions/:submissionId/result — gets score breakdown
  async getSubmissionResult(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const result = await assignmentService.getSubmissionResult(
        req.params.submissionId,
        req.user.userId,
        req.user.role
      );

      return res.status(200).json({ result });
    } catch (error: any) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error getting submission result:', error.message);
      return res.status(500).json({ error: 'Failed to get submission result' });
    }
  },

  // GET /api/assignments/:id/submissions — lists all student submissions
  async listSubmissions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const submissions = await assignmentService.listSubmissionsForAssignment(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({ submissions });
    } catch (error: any) {
      if (error.message.includes('not the instructor') || error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error listing submissions:', error.message);
      return res.status(500).json({ error: 'Failed to list submissions' });
    }
  },

  // POST /api/assignments/submissions/:submissionId/grade — manually grades a submission
  async grade(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { grade, feedback } = GradeSubmissionSchema.parse(req.body);
      const submission = await assignmentService.gradeSubmission(
        req.user.userId,
        req.params.submissionId,
        grade,
        feedback
      );

      return res.status(200).json({ submission });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message.includes('not the instructor') || error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error grading submission:', error.message);
      return res.status(500).json({ error: 'Failed to grade submission' });
    }
  },

  // POST /api/assignments/upload-pdf — uploads a question PDF
  async uploadPdf(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }
      const fileUrl = buildAssignmentFileUrl(req, req.file.filename);
      return res.status(200).json({ fileUrl });
    } catch (error: any) {
      console.error('Error uploading question PDF:', error.message);
      return res.status(500).json({ error: 'Failed to upload question PDF' });
    }
  },

  // POST /api/assignments/:id/submit/file — submits a file answer for an assignment
  async submitFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Only students can submit assignments' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No answer file uploaded' });
      }

      const fileUrl = buildAssignmentFileUrl(req, req.file.filename);
      const submission = await assignmentService.submitFileAnswer(
        req.user.userId,
        req.params.id,
        fileUrl
      );

      return res.status(200).json({ submission });
    } catch (error: any) {
      if (
        error.message.includes('due date has passed') ||
        error.message.includes('not enrolled') ||
        error.message.includes('not a file-upload assignment')
      ) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error submitting file answer:', error.message);
      return res.status(500).json({ error: 'Failed to submit file answer' });
    }
  },
};
