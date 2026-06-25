import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';
import { ticketController } from '../tickets/ticket.controller';
import type { AuthRequest } from '../../middleware/auth.middleware';
import type { Response, NextFunction } from 'express';

const router = Router();

// All mentorship routes require authentication
router.use(requireAuth);

// Set type=MENTORSHIP so the unified controller routes to mentorship logic
function setMentorshipType(req: AuthRequest, _res: Response, next: NextFunction) {
  req.query.type = 'MENTORSHIP' as any;
  next();
}

// Set type=MENTORSHIP on body for create ticket
function setMentorshipBody(req: AuthRequest, _res: Response, next: NextFunction) {
  req.body.type = 'MENTORSHIP';
  next();
}

// Student routes
router.post('/tickets', setMentorshipBody, requireRole([UserRole.STUDENT]), ticketController.createTicket);
router.get('/tickets/my', setMentorshipType, requireRole([UserRole.STUDENT]), ticketController.listTickets);

// Admin routes (also accessible by instructors for their assigned tickets)
router.get('/tickets', setMentorshipType, requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), ticketController.listTickets);
router.get('/mentors', requireRole([UserRole.ADMIN]), ticketController.getMentors);
router.get('/stats', setMentorshipType, requireRole([UserRole.ADMIN]), ticketController.getStats);

// Ticket management routes (admin or assigned instructor)
router.get('/tickets/:id', ticketController.getTicket);
router.patch('/tickets/:id/assign', requireRole([UserRole.ADMIN]), ticketController.assignMentor);
router.patch('/tickets/:id/schedule', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), ticketController.scheduleSession);
router.patch('/tickets/:id/complete', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), ticketController.completeTicket);
router.patch('/tickets/:id/cancel', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), ticketController.cancelTicket);

export const mentorshipRouter = router;
