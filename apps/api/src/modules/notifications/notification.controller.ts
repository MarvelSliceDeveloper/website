import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { notificationService } from "./notification.service";
import { handleControllerError } from "../../utils/errors";

export const notificationController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const notifications = await notificationService.listForUser(
        req.user.userId,
      );
      const unreadCount = await notificationService.unreadCount(
        req.user.userId,
      );
      return res.status(200).json({ notifications, unreadCount });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      await notificationService.markAsRead(req.params.id, req.user.userId);
      return res.status(200).json({ message: "Notification marked as read" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      await notificationService.markAllAsRead(req.user.userId);
      return res
        .status(200)
        .json({ message: "All notifications marked as read" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      await notificationService.delete(req.params.id, req.user.userId);
      return res.status(200).json({ message: "Notification deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async clearRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const count = await notificationService.deleteAllRead(req.user.userId);
      return res
        .status(200)
        .json({ message: `Cleared ${count} read notifications` });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async listSent(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const sent = await notificationService.listSent(req.user.userId);
      return res.status(200).json({ sent });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getPreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const prefs = await notificationService.getPreferences(req.user.userId);
      return res.status(200).json({ preferences: prefs });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updatePreference(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const { type, enabled, email } = req.body;
      if (!type) return res.status(400).json({ error: "type is required" });
      const pref = await notificationService.updatePreference(
        req.user.userId,
        type,
        { enabled, email },
      );
      return res.status(200).json({ preference: pref });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async sendNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const {
        targetType,
        targetIds: rawTargetIds,
        title,
        message,
        type,
        channel,
        emailTemplateId,
      } = req.body;

      // Multipart/form-data sends arrays as JSON strings — normalize.
      const targetIds = Array.isArray(rawTargetIds)
        ? rawTargetIds
        : typeof rawTargetIds === "string" && rawTargetIds.trim()
          ? (() => {
              try {
                const parsed = JSON.parse(rawTargetIds);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
          : [];

      if (
        !targetType ||
        ![
          "ALL_USERS",
          "BATCH",
          "COURSE",
          "INTERN",
          "INTERN_FIELD",
          "INSTRUCTORS",
          "STUDENTS",
        ].includes(targetType)
      ) {
        return res.status(400).json({
          error:
            "targetType must be ALL_USERS, BATCH, COURSE, INTERN, INTERN_FIELD, INSTRUCTORS, or STUDENTS",
        });
      }
      if (
        targetType !== "ALL_USERS" &&
        targetType !== "INTERN" &&
        targetType !== "INSTRUCTORS" &&
        targetType !== "STUDENTS" &&
        (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0)
      ) {
        return res.status(400).json({
          error:
            "targetIds must be a non-empty array for BATCH, COURSE, or INTERN_FIELD targets",
        });
      }
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "title is required" });
      }
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        return res.status(400).json({ error: "message is required" });
      }

      const deliveryChannel =
        channel === "IN_APP" || channel === "EMAIL" ? channel : "BOTH";

      const result = await notificationService.sendNotification(
        req.user.userId,
        req.user.role,
        {
          targetType,
          targetIds: targetIds ?? [],
          title: title.trim(),
          message: message.trim(),
          type,
          channel: deliveryChannel,
          emailTemplateId,
          attachmentUrl:
            typeof req.body._attachmentUrl === "string"
              ? req.body._attachmentUrl
              : undefined,
          attachmentName:
            typeof req.body._attachmentName === "string"
              ? req.body._attachmentName
              : undefined,
        },
      );

      return res.status(200).json({
        message: `Notification sent to ${result.count} users`,
        count: result.count,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
