import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { sessionService } from "../sessions/session.service";
import { GraphClient } from "../graph";

const WEBHOOK_CLIENT_STATE =
  process.env.MS_WEBHOOK_CLIENT_STATE || "secretClientValue";

/**
 * Webhook controller for handling Teams event change notifications.
 * When an instructor creates a meeting directly in Teams, this webhook
 * detects it and creates a corresponding LiveSession in the LMS.
 */
export const eventsWebhookController = {
  /**
   * POST /api/webhooks/events
   * Handles Microsoft Graph webhook notifications for calendar event changes.
   */
  async handleEventsWebhook(req: Request, res: Response) {
    // Step 1: Handle validation request from Microsoft
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      return res
        .status(200)
        .contentType("text/plain")
        .send(validationToken.replace(/[<>]/g, ""));
    }

    // Step 2: Respond immediately — MS requires response within 3 seconds
    res.status(202).json({ message: "Accepted" });

    // Step 3: Process notifications asynchronously
    try {
      const notifications = req.body?.value;
      if (!Array.isArray(notifications) || notifications.length === 0) {
        return;
      }

      for (const notification of notifications) {
        try {
          // Validate clientState
          if (notification.clientState !== WEBHOOK_CLIENT_STATE) {
            console.warn("[EventsWebhook] Invalid clientState, skipping");
            continue;
          }

          const changeType = notification.changeType; // created, updated, deleted
          const resource = notification.resource; // e.g. users/{userId}/events/{eventId}

          // Extract MS user ID and event ID from resource path
          const resourceParts = resource?.split("/");
          if (!resourceParts || resourceParts.length < 4) {
            console.warn(
              "[EventsWebhook] Unrecognized resource format:",
              resource,
            );
            continue;
          }

          const msUserId = resourceParts[1];
          const msEventId = resourceParts[3];

          // Find the user in our database
          const user = await prisma.user.findFirst({
            where: { msUserId },
            select: { id: true },
          });

          if (!user) {
            console.warn(
              `[EventsWebhook] No user found for MS userId: ${msUserId}`,
            );
            continue;
          }

          if (changeType === "created" || changeType === "updated") {
            await handleEventCreatedOrUpdated(user.id, msEventId);
          } else if (changeType === "deleted") {
            await handleEventDeleted(msEventId);
          }
        } catch (notifError: any) {
          console.error(
            "[EventsWebhook] Error processing notification:",
            notifError.message,
          );
        }
      }
    } catch (error: any) {
      console.error("[EventsWebhook] Error handling webhook:", error.message);
    }
  },
};

/**
 * Handle a created or updated calendar event.
 * Fetches the full event details from Graph API, checks if it's an online meeting,
 * and creates a LiveSession if so.
 */
async function handleEventCreatedOrUpdated(userId: string, msEventId: string) {
  // Fetch full event details from Graph API
  const client = new GraphClient({ userId });
  const event = (await client.get(`/me/events/${msEventId}`)) as any;

  if (!event) {
    console.warn(`[EventsWebhook] Event ${msEventId} not found in Graph`);
    return;
  }

  // Only process online meetings (Teams meetings)
  if (!event.isOnlineMeeting || !event.onlineMeeting?.joinUrl) {
    return; // Not a Teams meeting — skip
  }

  // Extract a meeting ID from the join URL or use the event ID
  const teamsMeetingId = event.onlineMeeting?.conferenceId || msEventId;
  const joinUrl = event.onlineMeeting.joinUrl;
  const scheduledAt = new Date(event.start.dateTime + "Z");
  const scheduledEndAt = event.end?.dateTime
    ? new Date(event.end.dateTime + "Z")
    : undefined;
  const title = event.subject || "Teams Meeting";

  // Check if this meeting is already tracked
  const existingSession = await prisma.liveSession.findFirst({
    where: {
      OR: [{ teamsMeetingId }, { joinUrl }],
    },
  });

  if (existingSession) {
    // Update the existing session if the schedule changed
    // Do NOT set endedAt — that represents actual end, not scheduled end
    const updateData: any = {
      scheduledAt,
      scheduledEndAt: event.end?.dateTime
        ? new Date(event.end.dateTime + "Z")
        : undefined,
      joinUrl,
    };
    // Only include scheduledEndAt if we have a valid date
    if (!updateData.scheduledEndAt) delete updateData.scheduledEndAt;

    await prisma.liveSession.update({
      where: { id: existingSession.id },
      data: updateData,
    });

    // Update associated CalendarEvent
    await prisma.calendarEvent.updateMany({
      where: { sessionId: existingSession.id },
      data: {
        title,
        startAt: scheduledAt,
        endAt: new Date(event.end.dateTime + "Z"),
        joinUrl,
      },
    });

    console.log(
      `[EventsWebhook] Updated existing session: ${existingSession.id}`,
    );
    return;
  }

  // Find a course this instructor teaches to link the session
  // (If no course exists, we still create a CalendarEvent but skip the LiveSession)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  const instructorBatch = await prisma.batch.findFirst({
    where: { instructorId: userId },
    select: { id: true, courseId: true },
  });

  if (!instructorBatch) {
    // No batch found — just upsert the calendar event without a LiveSession
    await prisma.calendarEvent.upsert({
      where: { msEventId },
      create: {
        msEventId,
        title,
        startAt: scheduledAt,
        endAt: new Date(event.end.dateTime + "Z"),
        joinUrl,
      },
      update: {
        title,
        startAt: scheduledAt,
        endAt: new Date(event.end.dateTime + "Z"),
        joinUrl,
      },
    });
    console.log(
      `[EventsWebhook] Calendar event upserted (no course link): ${msEventId}`,
    );
    return;
  }

  // Find the first module in the course to link to
  const firstModule = await prisma.module.findFirst({
    where: { courseId: instructorBatch.courseId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (!firstModule) {
    console.warn(
      `[EventsWebhook] Course ${instructorBatch.courseId} has no modules, skipping LiveSession creation`,
    );
    return;
  }

  // Create a LiveSession from the Teams-created meeting
  const result = await sessionService.createSessionFromTeams({
    teamsMeetingId,
    joinUrl,
    batchId: instructorBatch.id,
    moduleId: firstModule.id,
    scheduledAt,
    scheduledEndAt,
    title,
  });

  if (result.created) {
    console.log(
      `[EventsWebhook] Created LiveSession from Teams: ${result.session.id}`,
    );
  } else {
    console.log(`[EventsWebhook] Session already exists: ${result.session.id}`);
  }
}

/**
 * Handle a deleted calendar event.
 * If linked to a LiveSession, mark it as ended.
 */
async function handleEventDeleted(msEventId: string) {
  const calendarEvent = await prisma.calendarEvent.findUnique({
    where: { msEventId },
    select: { sessionId: true },
  });

  if (calendarEvent?.sessionId) {
    await prisma.liveSession.update({
      where: { id: calendarEvent.sessionId },
      data: { endedAt: new Date() },
    });
    console.log(
      `[EventsWebhook] Marked session ${calendarEvent.sessionId} as ended (event deleted)`,
    );
  }

  // Remove the CalendarEvent
  await prisma.calendarEvent
    .delete({
      where: { msEventId },
    })
    .catch(() => {
      // Ignore if already deleted
    });
}
