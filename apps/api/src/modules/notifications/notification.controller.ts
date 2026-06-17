import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { notificationService } from './notification.service';

export const notificationController = {
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

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      await notificationService.delete(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Notification deleted' });
    } catch (error: any) {
      console.error('Error deleting notification:', error.message);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  async clearRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const count = await notificationService.deleteAllRead(req.user.userId);
      return res.status(200).json({ message: `Cleared ${count} read notifications` });
    } catch (error: any) {
      console.error('Error clearing read notifications:', error.message);
      return res.status(500).json({ error: 'Failed to clear read notifications' });
    }
  },

  async getPreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const prefs = await notificationService.getPreferences(req.user.userId);
      return res.status(200).json({ preferences: prefs });
    } catch (error: any) {
      console.error('Error getting preferences:', error.message);
      return res.status(500).json({ error: 'Failed to get preferences' });
    }
  },

  async updatePreference(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { type, enabled, email } = req.body;
      if (!type) return res.status(400).json({ error: 'type is required' });
      const pref = await notificationService.updatePreference(req.user.userId, type, { enabled, email });
      return res.status(200).json({ preference: pref });
    } catch (error: any) {
      console.error('Error updating preference:', error.message);
      return res.status(500).json({ error: 'Failed to update preference' });
    }
  },
};
