import { Router } from 'express';
import { sessionController } from './session.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All session routes require authentication
router.use(requireAuth);

// POST /api/sessions — create a new session (admins only)
router.post('/', requireRole([UserRole.ADMIN]), sessionController.create);

// GET /api/sessions — list sessions
router.get('/', sessionController.list);

// GET /api/sessions/:id — get session details
router.get('/:id', sessionController.getById);

// PATCH /api/sessions/:id — update a session (admins or assigned instructor)
router.patch('/:id', requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]), sessionController.update);

// DELETE /api/sessions/:id — cancel a session (admins or assigned instructor)
router.delete('/:id', requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]), sessionController.cancel);

export const sessionRouter = router;
