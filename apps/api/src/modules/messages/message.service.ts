import { prisma } from '../../utils/prisma';

export const messageService = {
  /**
   * Send a direct message from one user to another.
   */
  async send(data: {
    senderId: string;
    receiverId: string;
    subject?: string;
    body: string;
    entityType?: string;
    entityId?: string;
  }) {
    if (!prisma || !('message' in prisma)) {
      console.warn('Prisma message model not available');
      return null;
    }
    try {
      return await prisma.message.create({ data });
    } catch (err: unknown) {
      console.error('Error sending message:', (err as Error)?.message ?? err);
      return null;
    }
  },

  /**
   * List conversations for a user — returns the most recent message per other user.
   */
  async listConversations(userId: string) {
    if (!prisma || !('message' in prisma)) return [];
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true } },
          receiver: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Deduplicate to get the latest message per conversation partner
      const seen = new Set<string>();
      const conversations: typeof messages = [];
      for (const msg of messages) {
        const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (seen.has(otherId)) continue;
        seen.add(otherId);
        conversations.push(msg);
      }
      return conversations;
    } catch (err: unknown) {
      console.error('Error listing conversations:', (err as Error)?.message ?? err);
      return [];
    }
  },

  /**
   * Get the full message thread between two users.
   */
  async getThread(userId: string, otherUserId: string) {
    if (!prisma || !('message' in prisma)) return [];
    try {
      return await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true } },
        },
      });
    } catch (err: unknown) {
      console.error('Error getting message thread:', (err as Error)?.message ?? err);
      return [];
    }
  },

  /**
   * Mark a single message as read.
   */
  async markAsRead(messageId: string, userId: string) {
    if (!prisma || !('message' in prisma)) return 0;
    try {
      const res = await prisma.message.updateMany({
        where: { id: messageId, receiverId: userId, read: false },
        data: { read: true },
      });
      return res.count;
    } catch (err: unknown) {
      console.error('Error marking message as read:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Count unread messages for a user.
   */
  async unreadCount(userId: string) {
    if (!prisma || !('message' in prisma)) return 0;
    try {
      return await prisma.message.count({ where: { receiverId: userId, read: false } });
    } catch {
      return 0;
    }
  },
};
