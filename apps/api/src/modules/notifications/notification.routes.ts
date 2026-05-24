import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { notificationController } from './notification.controller';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

// GET /api/notifications — list notifications for the current user
router.get('/', notificationController.list);

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// POST /api/notifications/read-all — mark all notifications as read
router.post('/read-all', notificationController.markAllAsRead);

export const notificationRouter = router;
