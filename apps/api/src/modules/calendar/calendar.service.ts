import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { getCalendarView, CalendarEvent as MsCalendarEvent } from "../graph";
import { getSuperAdminId } from "../../utils/super-admin";

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
  const superAdminId = await getSuperAdminId();
  const graphUserId = superAdminId || userId;
  const msEvents: MsCalendarEvent[] = await getCalendarView(
    graphUserId,
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
 * When `userId` is provided, only events tied to the user's enrolled batches
 * and their own mentorship sessions are returned (prevents leaking events from
 * other batches/users and cuts down the payload).
 */
export async function getEventsForUser(
  startDate: string,
  endDate: string,
  userId?: string,
) {
  const where: Prisma.CalendarEventWhereInput = {
    startAt: { lte: new Date(endDate) },
    endAt: { gte: new Date(startDate) },
  };

  if (userId) {
    // Gather the batches the student is approved into (individual + package)
    const [enrollments, packageCourseEnrollments] = await Promise.all([
      prisma.enrollmentRequest.findMany({
        where: { userId, status: "APPROVED" },
        select: { batchId: true },
      }),
      prisma.packageEnrollmentCourse.findMany({
        where: { enrollment: { userId, status: "APPROVED" } },
        select: { batchId: true },
      }),
    ]);

    const batchIds = Array.from(
      new Set(
        [
          ...enrollments.map((e) => e.batchId),
          ...packageCourseEnrollments.map((p) => p.batchId),
        ].filter(Boolean),
      ),
    ) as string[];

    // Own mentorship sessions are matched via the linked ticket
    const mentorshipTicketIds = (
      await prisma.mentorshipTicket.findMany({
        where: { studentId: userId },
        select: { id: true },
      })
    ).map((t) => t.id);

    const or: Prisma.CalendarEventWhereInput[] = [];
    if (batchIds.length > 0) {
      or.push({ session: { batchId: { in: batchIds } } });
    }
    if (mentorshipTicketIds.length > 0) {
      or.push({ session: { mentorshipTicketId: { in: mentorshipTicketIds } } });
    }
    // No visible batches/tickets → nothing to show
    if (or.length === 0) return [];

    where.OR = or;
  }

  return prisma.calendarEvent.findMany({
    where,
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
        startAt: { lte: endOfDay },
        endAt: { gte: startOfDay },
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
