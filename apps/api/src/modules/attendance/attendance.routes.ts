import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { attendanceController } from './attendance.controller';
import { UserRole } from '@lms/types';

const router = Router();

// All attendance routes require authentication
router.use(requireAuth);

// POST /api/attendance/:sessionId/join - Join session and record attendance
router.post('/:sessionId/join', attendanceController.joinSession);

// GET /api/attendance/:sessionId - Get list of students who attended (Admins & Instructors only)
router.get('/:sessionId', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), attendanceController.getSessionAttendance);

export const attendanceRouter = router;
