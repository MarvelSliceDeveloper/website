import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { messageController } from './message.controller';

const router = Router();

router.use(requireAuth);

router.get('/conversations', messageController.listConversations);
router.get('/:userId', messageController.getThread);
router.post('/', messageController.send);
router.patch('/:id/read', messageController.markAsRead);

export const messageRouter = router;
