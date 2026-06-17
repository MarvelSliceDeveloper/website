import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { notificationController } from './notification.controller';

const router = Router();

router.use(requireAuth);

router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.delete);
router.post('/clear-read', notificationController.clearRead);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreference);

export const notificationRouter = router;
