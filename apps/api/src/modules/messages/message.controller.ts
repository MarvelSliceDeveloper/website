import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { messageService } from "./message.service";
import { handleControllerError } from "../../utils/errors";

export const messageController = {
  async listConversations(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = await messageService.listConversations(
        req.user.userId,
        page,
        limit,
      );
      const unreadCount = await messageService.unreadCount(req.user.userId);
      return res.status(200).json({ ...result, unreadCount });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getThread(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const { userId: otherUserId } = req.params;
      const messages = await messageService.getThread(
        req.user.userId,
        otherUserId,
      );
      return res.status(200).json({ messages });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async send(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const { receiverId, subject, body, entityType, entityId } = req.body;
      if (!receiverId || !body) {
        return res
          .status(400)
          .json({ error: "receiverId and body are required" });
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
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      await messageService.markAsRead(req.params.id, req.user.userId);
      return res.status(200).json({ message: "Message marked as read" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
