import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';
import { assignmentController } from './assignments.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/assignments - Create assignment (instructor)
router.post('/', requireRole([UserRole.INSTRUCTOR]), assignmentController.create);

// GET /api/assignments - List instructor's assignments
router.get('/', requireRole([UserRole.INSTRUCTOR]), assignmentController.list);

// GET /api/assignments/:id - Get assignment details (any authenticated user)
router.get('/:id', assignmentController.getById);

// PUT /api/assignments/:id - Update assignment (instructor only)
router.put('/:id', requireRole([UserRole.INSTRUCTOR]), assignmentController.update);

// DELETE /api/assignments/:id - Delete assignment (instructor only)
router.delete('/:id', requireRole([UserRole.INSTRUCTOR]), assignmentController.delete);

// POST /api/assignments/:id/submit - Submit assignment (student)
router.post('/:id/submit', requireRole([UserRole.STUDENT]), assignmentController.submit);

// GET /api/assignments/:id/submissions - List submissions (instructor)
router.get('/:id/submissions', requireRole([UserRole.INSTRUCTOR]), assignmentController.listSubmissions);

// PUT /api/assignments/:id/grade/:studentId - Grade submission (instructor)
router.put('/:id/grade/:studentId', requireRole([UserRole.INSTRUCTOR]), assignmentController.grade);

export default router;
