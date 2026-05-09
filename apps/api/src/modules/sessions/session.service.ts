import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { createOnlineMeeting } from '../graph';

// --- Zod Schemas ---

export const CreateSessionSchema = z.object({
  batchId: z.string().cuid(),
  moduleId: z.string().cuid().optional(),
  title: z.string().min(3).max(200),
  startDateTime: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
  endDateTime: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
});

export const UpdateSessionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
});

// --- Service ---

export const sessionService = {
  /**
   * Create a new live session.
   * Calls Microsoft Graph to create a Teams meeting, then stores the session
   * and creates a corresponding CalendarEvent.
   */
  async createSession(userId: string, data: z.infer<typeof CreateSessionSchema>) {
    const { batchId, moduleId, title, startDateTime, endDateTime } = data;

    // Verify the batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (!batch) throw new Error('Batch not found');

    if (moduleId) {
      // Verify the module belongs to this batch's course
      const module = await prisma.module.findFirst({
        where: { id: moduleId, courseId: batch.courseId },
      });
      if (!module) throw new Error('Module not found in this course');
    }

    // Prevent duplicate scheduling: check for overlapping sessions in the same batch
    const overlapping = await prisma.liveSession.findFirst({
      where: {
        batchId,
        scheduledAt: { lte: new Date(endDateTime) },
        endedAt: null, // only check non-ended sessions
        OR: [
          { scheduledAt: { gte: new Date(startDateTime) } },
        ],
      },
    });

    if (overlapping) {
      throw new Error('A session is already scheduled during this time for this batch');
    }

    // Create Teams meeting via Graph API
    const meeting = await createOnlineMeeting(userId, {
      subject: `${batch.name} — ${title}`,
      startDateTime,
      endDateTime,
    });

    // Store in LiveSession table
    const session = await prisma.liveSession.create({
      data: {
        batchId,
        moduleId,
        teamsMeetingId: meeting.id,
        joinUrl: meeting.joinWebUrl,
        scheduledAt: new Date(startDateTime),
        createdFrom: 'LMS',
        createdBy: userId,
      },
    });

    // Also create a CalendarEvent for this session
    await prisma.calendarEvent.create({
      data: {
        msEventId: `lms-session-${session.id}`, // Synthetic ID for LMS-created events
        title: `${batch.name} — ${title}`,
        startAt: new Date(startDateTime),
        endAt: new Date(endDateTime),
        joinUrl: meeting.joinWebUrl,
        sessionId: session.id,
      },
    });

    return session;
  },

  /**
   * List sessions with optional filters.
   */
  async listSessions(filters: {
    batchId?: string;
    courseId?: string;
    status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
    instructorId?: string;
  }) {
    const where: any = {};

    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.courseId) where.batch = { courseId: filters.courseId };
    if (filters.instructorId) {
      where.batch = { instructorId: filters.instructorId };
    }

    // Status filter
    const now = new Date();
    if (filters.status === 'scheduled') {
      where.scheduledAt = { gt: now };
      where.endedAt = null;
    } else if (filters.status === 'live') {
      where.scheduledAt = { lte: now };
      where.endedAt = null;
    } else if (filters.status === 'completed') {
      where.endedAt = { not: null };
    }

    return prisma.liveSession.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true, courseId: true } },
        module: { select: { id: true, title: true } },
        recording: { select: { id: true, syncedAt: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  /**
   * Get a single session by ID.
   */
  async getSession(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: { select: { id: true, name: true, instructorId: true } },
        module: { select: { id: true, title: true } },
        recording: true,
        calendarEvent: true,
      },
    });

    if (!session) throw new Error('Session not found');
    return session;
  },

  /**
   * Update a session (title/time).
   */
  async updateSession(sessionId: string, userId: string, data: z.infer<typeof UpdateSessionSchema>) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { batch: { select: { instructorId: true } } },
    });

    if (!session) throw new Error('Session not found');
    
    // In actual implementation, roleGuard middleware ensures only ADMIN or the specific INSTRUCTOR can access.
    // We double check instructor ownership here if they aren't admin.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'INSTRUCTOR' && session.batch.instructorId !== userId) {
      throw new Error('Only the assigned instructor or an admin can update this session');
    }

    const updateData: any = {};
    if (data.startDateTime) updateData.scheduledAt = new Date(data.startDateTime);

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Update the associated CalendarEvent if dates changed
    if (data.startDateTime || data.endDateTime) {
      const calendarUpdate: any = {};
      if (data.startDateTime) calendarUpdate.startAt = new Date(data.startDateTime);
      if (data.endDateTime) calendarUpdate.endAt = new Date(data.endDateTime);

      await prisma.calendarEvent.updateMany({
        where: { sessionId },
        data: calendarUpdate,
      });
    }

    return updated;
  },

  /**
   * Cancel (soft-delete) a session. Sets endedAt to now.
   */
  async cancelSession(sessionId: string, userId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: { batch: { select: { instructorId: true } } },
    });

    if (!session) throw new Error('Session not found');
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'INSTRUCTOR' && session.batch.instructorId !== userId) {
      throw new Error('Only the assigned instructor or an admin can cancel this session');
    }

    return prisma.liveSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  },

  /**
   * Create a session from a Teams-created event (via webhook).
   * Idempotent — skips if the teamsMeetingId already exists.
   */
  async createSessionFromTeams(data: {
    teamsMeetingId: string;
    joinUrl: string;
    batchId: string;
    moduleId?: string;
    scheduledAt: Date;
    title: string;
  }) {
    // Idempotency: check if already exists
    const existing = await prisma.liveSession.findUnique({
      where: { teamsMeetingId: data.teamsMeetingId },
    });

    if (existing) {
      return { session: existing, created: false };
    }

    const session = await prisma.liveSession.create({
      data: {
        batchId: data.batchId,
        moduleId: data.moduleId,
        teamsMeetingId: data.teamsMeetingId,
        joinUrl: data.joinUrl,
        scheduledAt: data.scheduledAt,
        createdFrom: 'TEAMS',
        createdBy: 'SYSTEM', // System webhook created this
      },
    });

    // Create a CalendarEvent for it
    await prisma.calendarEvent.create({
      data: {
        msEventId: `teams-${data.teamsMeetingId}`,
        title: data.title,
        startAt: data.scheduledAt,
        endAt: data.scheduledAt, // Exact end time unknown from webhook
        joinUrl: data.joinUrl,
        sessionId: session.id,
      },
    });

    return { session, created: true };
  },
};
