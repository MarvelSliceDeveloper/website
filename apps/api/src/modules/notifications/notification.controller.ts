import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { notificationService } from './notification.service';

export const notificationController = {
  /**
   * GET /api/notifications
   * List notifications for the authenticated user.
   */
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const notifications = await notificationService.listForUser(req.user.userId);
      const unreadCount = await notificationService.unreadCount(req.user.userId);

      return res.status(200).json({ notifications, unreadCount });
    } catch (error: any) {
      console.error('Error listing notifications:', error.message);
      return res.status(500).json({ error: 'Failed to list notifications' });
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      await notificationService.markAsRead(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  /**
   * POST /api/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      await notificationService.markAllAsRead(req.user.userId);
      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error.message);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },
};
