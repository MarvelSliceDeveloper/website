import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { getCalendarView, CalendarEvent as MsCalendarEvent } from "../graph";

type CalendarEventWithSession = Prisma.CalendarEventGetPayload<{
  include: {
    session: {
      select: {
        id: true;
        batchId: true;
        joinUrl: true;
        scheduledAt: true;
        endedAt: true;
      };
    };
  };
}>;

/**
 * Checks if a session is currently live.
 * Adds a 15-min buffer after endAt (sessions often run over).
 * If sessionEndedAt is set (non-null), the session was explicitly ended and is not live.
 */
export function isSessionLive(
  startAt: Date,
  endAt: Date,
  sessionEndedAt?: Date | null,
): boolean {
  if (sessionEndedAt) return false;
  const now = new Date();
  const bufferMs = 15 * 60 * 1000;
  return now >= startAt && now <= new Date(endAt.getTime() + bufferMs);
}

/**
 * Sync Microsoft Calendar events into the CalendarEvent table for a given user.
 * Upserts by msEventId — creates new events or updates existing ones.
 */
export async function syncCalendarForUser(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const msEvents: MsCalendarEvent[] = await getCalendarView(
    userId,
    startDate,
    endDate,
  );

  const results = {
    created: 0,
    updated: 0,
    total: msEvents.length,
  };

  for (const event of msEvents) {
    const startAt = new Date(event.start.dateTime + "Z");
    const endAt = new Date(event.end.dateTime + "Z");
    const joinUrl = event.onlineMeeting?.joinUrl || null;

    let sessionId: string | null = null;
    if (joinUrl) {
      const matchedSession = await prisma.liveSession.findFirst({
        where: { joinUrl },
        select: { id: true },
      });
      if (matchedSession) {
        sessionId = matchedSession.id;
      }
    }

    const existing = await prisma.calendarEvent.findUnique({
      where: { msEventId: event.id },
    });

    if (existing) {
      await prisma.calendarEvent.update({
        where: { msEventId: event.id },
        data: {
          title: event.subject,
          startAt,
          endAt,
          joinUrl,
          sessionId,
        },
      });
      results.updated++;
    } else {
      await prisma.calendarEvent.create({
        data: {
          msEventId: event.id,
          title: event.subject,
          startAt,
          endAt,
          joinUrl,
          sessionId,
        },
      });
      results.created++;
    }
  }

  return results;
}

/**
 * Get calendar events for a user within a date range.
 */
export async function getEventsForUser(startDate: string, endDate: string) {
  return prisma.calendarEvent.findMany({
    where: {
      startAt: { gte: new Date(startDate) },
      endAt: { lte: new Date(endDate) },
    },
    include: {
      session: {
        select: {
          id: true,
          batchId: true,
          joinUrl: true,
          scheduledAt: true,
          endedAt: true,
        },
      },
    },
    orderBy: { startAt: "asc" },
  });
}

/**
 * Get today's events with live status computed.
 * Respects session cancellation via endedAt.
 */
export async function getTodayEvents() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  const events: CalendarEventWithSession[] =
    await prisma.calendarEvent.findMany({
      where: {
        startAt: { gte: startOfDay },
        endAt: { lte: endOfDay },
      },
      include: {
        session: {
          select: {
            id: true,
            batchId: true,
            joinUrl: true,
            scheduledAt: true,
            endedAt: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });

  return events.map((event) => ({
    ...event,
    isLive: isSessionLive(event.startAt, event.endAt, event.session?.endedAt),
  }));
}

/**
 * Get currently live sessions only.
 * Queries LiveSession directly (not CalendarEvent) for accuracy.
 */
export async function getLiveSessions() {
  const now = new Date();
  const bufferMs = 15 * 60 * 1000;
  const bufferedNow = new Date(now.getTime() - bufferMs);

  const sessions = await prisma.liveSession.findMany({
    where: {
      scheduledAt: { lte: now },
      endedAt: null,
      scheduledEndAt: { gte: bufferedNow },
    },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          course: { select: { id: true, title: true } },
          instructor: { select: { id: true, name: true } },
        },
      },
      module: { select: { id: true, title: true } },
      calendarEvent: {
        select: {
          id: true,
          msEventId: true,
          startAt: true,
          endAt: true,
          title: true,
          joinUrl: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return sessions;
}
