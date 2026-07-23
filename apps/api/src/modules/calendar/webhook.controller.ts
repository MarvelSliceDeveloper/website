import { Request, Response } from "express";
import { syncCalendarForUser } from "./calendar.service";
import { prisma } from "../../utils/prisma";
import { handleControllerError } from "../../utils/errors";

function getWebhookClientState(): string {
  const value = process.env.MS_WEBHOOK_CLIENT_STATE;
  if (!value) {
    throw new Error(
      "Missing required environment variable: MS_WEBHOOK_CLIENT_STATE",
    );
  }
  return value;
}

export const webhookController = {
  /**
   * POST /api/webhooks/calendar
   * Handles Microsoft Graph webhook notifications for calendar changes.
   *
   * On first subscription creation, Microsoft sends a validation request
   * with a validationToken query parameter. We must echo it back.
   *
   * For actual change notifications, the body contains an array of
   * resource changes with the affected user's info.
   */
  async handleCalendarWebhook(req: Request, res: Response) {
    // Step 1: Handle validation request from Microsoft
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      // Must return the token as plain text with 200 status
      return res
        .status(200)
        .contentType("text/plain")
        .send(validationToken.replace(/[<>]/g, ""));
    }

    // Step 2: Process change notifications
    try {
      const notifications = req.body?.value;
      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(202).json({ message: "No notifications to process" });
      }

      // Respond immediately — MS requires response within 3 seconds
      res.status(202).json({ message: "Accepted" });

      // Process notifications asynchronously
      for (const notification of notifications) {
        try {
          // Validate clientState to ensure notification came from our subscription
          if (notification.clientState !== getWebhookClientState()) {
            console.warn(
              "[Webhook] Invalid clientState, skipping notification",
            );
            continue;
          }

          // Extract user info from the resource URL
          // Resource format: /users/{userId}/events
          const resourceParts = notification.resource?.split("/");
          if (!resourceParts || resourceParts.length < 3) {
            console.warn(
              "[Webhook] Unrecognized resource format:",
              notification.resource,
            );
            continue;
          }

          const msUserId = resourceParts[1]; // The MS user ID from the resource path

          // Find the user in our database by msUserId
          const user = await prisma.user.findFirst({
            where: { msUserId },
            select: { id: true },
          });

          if (!user) {
            console.warn(`[Webhook] No user found for MS userId: ${msUserId}`);
            continue;
          }

          // Re-sync the next 30 days of calendar events for this user
          const now = new Date();
          const thirtyDaysLater = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          await syncCalendarForUser(
            user.id,
            now.toISOString(),
            thirtyDaysLater.toISOString(),
          );

          console.log(`[Webhook] Calendar re-synced for user ${user.id}`);
        } catch (err: unknown) {
          handleControllerError(err, (req as any).log);
        }
      }
    } catch (err: unknown) {
      handleControllerError(err, (req as any).log);
    }
  },
};
