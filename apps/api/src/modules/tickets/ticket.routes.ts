import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { ticketController } from './ticket.controller';

const router: Router = Router();

router.use(requireAuth);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.listTickets);
router.get('/mentors', ticketController.getMentors);
router.get('/stats', ticketController.getStats);
router.get('/:id', ticketController.getTicket);
router.patch('/:id/assign', ticketController.assignMentor);
router.patch('/:id/schedule', ticketController.scheduleSession);
router.patch('/:id/complete', ticketController.completeTicket);
router.patch('/:id/cancel', ticketController.cancelTicket);
router.post('/:id/messages', ticketController.addMessage);
router.patch('/:id/status', ticketController.updateStatus);

export default router;
