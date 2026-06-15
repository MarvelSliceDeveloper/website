import { Router } from 'express';
import { mentorshipController } from './mentorship.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All mentorship routes require authentication
router.use(requireAuth);

// Student routes
router.post('/tickets', requireRole([UserRole.STUDENT]), mentorshipController.createTicket);
router.get('/tickets/my', requireRole([UserRole.STUDENT]), mentorshipController.listMyTickets);

// Admin routes (also accessible by instructors for their assigned tickets)
router.get('/tickets', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), mentorshipController.listAllTickets);
router.get('/mentors', requireRole([UserRole.ADMIN]), mentorshipController.getMentors);
router.get('/stats', requireRole([UserRole.ADMIN]), mentorshipController.getStats);

// Ticket management routes (admin or assigned instructor)
router.get('/tickets/:id', mentorshipController.getTicket);
router.patch('/tickets/:id/assign', requireRole([UserRole.ADMIN]), mentorshipController.assignMentor);
router.patch('/tickets/:id/schedule', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), mentorshipController.scheduleSession);
router.patch('/tickets/:id/complete', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), mentorshipController.completeTicket);
router.patch('/tickets/:id/cancel', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), mentorshipController.cancelTicket);

export const mentorshipRouter = router;
