import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';
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
router.post('/send', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), notificationController.sendNotification);

export const notificationRouter = router;
