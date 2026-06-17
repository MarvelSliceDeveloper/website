import { Router } from 'express';
import { supportController } from './support.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

export const supportRouter = Router();

supportRouter.use(requireAuth);

supportRouter.post('/tickets', supportController.createTicket);
supportRouter.get('/tickets', supportController.listTickets);
supportRouter.get('/tickets/stats', requireRole([UserRole.ADMIN]), supportController.getStats);
supportRouter.get('/tickets/:id', supportController.getTicket);
supportRouter.post('/tickets/:id/messages', supportController.addMessage);
supportRouter.patch('/tickets/:id/status', supportController.updateStatus);
