import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { messageService } from './message.service';

export const messageController = {
  async listConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const conversations = await messageService.listConversations(req.user.userId);
      const unreadCount = await messageService.unreadCount(req.user.userId);
      return res.status(200).json({ conversations, unreadCount });
    } catch (error: any) {
      console.error('Error listing conversations:', error.message);
      return res.status(500).json({ error: 'Failed to list conversations' });
    }
  },

  async getThread(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { userId: otherUserId } = req.params;
      const messages = await messageService.getThread(req.user.userId, otherUserId);
      return res.status(200).json({ messages });
    } catch (error: any) {
      console.error('Error getting thread:', error.message);
      return res.status(500).json({ error: 'Failed to get thread' });
    }
  },

  async send(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { receiverId, subject, body, entityType, entityId } = req.body;
      if (!receiverId || !body) {
        return res.status(400).json({ error: 'receiverId and body are required' });
      }
      const message = await messageService.send({
        senderId: req.user.userId,
        receiverId,
        subject,
        body,
        entityType,
        entityId,
      });
      return res.status(201).json({ message });
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      await messageService.markAsRead(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Message marked as read' });
    } catch (error: any) {
      console.error('Error marking message as read:', error.message);
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }
  },
};
