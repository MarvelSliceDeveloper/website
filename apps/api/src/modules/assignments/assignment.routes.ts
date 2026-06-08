import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All assignment routes require authentication
router.use(requireAuth);

// POST /api/assignments — create a new assignment (admins + instructors)
router.post('/', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), assignmentController.create);

// GET /api/assignments — list assignments
router.get('/', assignmentController.list);

// GET /api/assignments/:id/questions — get assignment questions
router.get('/:id/questions', assignmentController.getQuestions);

// POST /api/assignments/:id/submit/mcq — submit MCQ responses (student only)
router.post('/:id/submit/mcq', requireRole([UserRole.STUDENT]), assignmentController.submitMcq);

// GET /api/assignments/submissions/:submissionId/result — get graded submission results
router.get('/submissions/:submissionId/result', assignmentController.getSubmissionResult);

// GET /api/assignments/:id/submissions — list submissions (admins + instructors)
router.get('/:id/submissions', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), assignmentController.listSubmissions);

// POST /api/assignments/submissions/:submissionId/grade — manually grade/feedback a submission (admins + instructors)
router.post('/submissions/:submissionId/grade', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), assignmentController.grade);

export const assignmentRouter = router;
