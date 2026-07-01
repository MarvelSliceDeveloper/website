import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { createOnlineMeeting } from '../graph';
import { notificationService } from '../notifications/notification.service';

// --- Zod Schemas ---

export const CreateSessionSchema = z.object({
  batchId: z.string().cuid(),
  moduleId: z.string().cuid().optional(),
  title: z.string().min(3).max(200),
  startDateTime: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
  endDateTime: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
  customJoinUrl: z.string().optional().nullable(),
  instructorOverride: z.string().optional().nullable(),
}).refine(data => new Date(data.startDateTime) < new Date(data.endDateTime), {
  message: 'startDateTime must be before endDateTime',
  path: ['endDateTime'],
});

export const UpdateSessionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
});

// --- Service ---

export const sessionService = {
  // Creates a new live session with optional Teams meeting
  async createSession(userId: string, data: z.infer<typeof CreateSessionSchema>) {
    const { batchId, moduleId, title, startDateTime, endDateTime, customJoinUrl, instructorOverride } = data;

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
        endedAt: null, // only check non-ended/cancelled sessions
        scheduledAt: { lt: new Date(endDateTime) },
        scheduledEndAt: { gt: new Date(startDateTime) },
      },
    });

    if (overlapping) {
      throw new Error('A session is already scheduled during this time for this batch');
    }

    let teamsMeetingId = '';
    let joinUrl = '';

    if (customJoinUrl && customJoinUrl.trim()) {
      // If admin pasted a custom meeting URL, use it directly
      joinUrl = customJoinUrl.trim();
      teamsMeetingId = `custom-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    } else {
      // Otherwise, auto-create Teams meeting via Graph API
      try {
        const meeting = await createOnlineMeeting(userId, {
          subject: `${batch.name} — ${title}`,
          startDateTime,
          endDateTime,
        });
        teamsMeetingId = meeting.id;
        joinUrl = meeting.joinWebUrl;
      } catch (err: any) {
        console.warn('[Teams] Failed to create Teams meeting via Graph API:', err.message);
        // Session is still created but without a Teams meeting link.
        // Admin can add a custom join URL by editing the session later.
        teamsMeetingId = `teams-error`;
        joinUrl = '';
      }
    }

    // Determine instructor (use override or default to batch instructor)
    const finalInstructorId = instructorOverride && instructorOverride.trim()
      ? instructorOverride.trim()
      : batch.instructorId;

    // Store in LiveSession table
    const session = await prisma.liveSession.create({
      data: {
        batchId,
        moduleId,
        title,
        teamsMeetingId,
        joinUrl,
        scheduledAt: new Date(startDateTime),
        scheduledEndAt: new Date(endDateTime),
        endedAt: null, // session hasn't ended yet — set when explicitly ended/cancelled
        createdFrom: customJoinUrl && customJoinUrl.trim() ? 'LMS_CUSTOM' : 'LMS',
        createdBy: userId,
        instructorId: finalInstructorId,
      },
    });

    // Also create a CalendarEvent for this session
    await prisma.calendarEvent.create({
      data: {
        msEventId: `lms-session-${session.id}`, // Synthetic ID for LMS-created events
        title: `${batch.name} — ${title}`,
        startAt: new Date(startDateTime),
        endAt: new Date(endDateTime),
        joinUrl,
        sessionId: session.id,
      },
    });

    // Trigger notification to students and instructor
    await notificationService.notifySessionScheduled(session.id).catch(err => {
      console.error('Failed to send session notifications:', err.message);
    });

    return session;
  },

  // Lists sessions with role-based filters
  async listSessions(filters: {
    batchId?: string;
    courseId?: string;
    status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
    instructorId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.studentId) {
      // Find batches where student is enrolled
      const enrollments = await prisma.enrollmentRequest.findMany({
        where: { userId: filters.studentId, status: 'APPROVED' },
        select: { batchId: true }
      });
      const batchIds = enrollments.map((e: typeof enrollments[number]) => e.batchId).filter(Boolean) as string[];

      // If student is not in any approved batch, they shouldn't see anything
      if (batchIds.length === 0) {
        return [];
      }

      if (filters.batchId) {
        // If they requested a specific batch, ensure they are enrolled in it
        if (!batchIds.includes(filters.batchId)) {
          return [];
        }
        where.batchId = filters.batchId;
      } else {
        where.batchId = { in: batchIds };
      }
    } else if (filters.batchId) {
      where.batchId = filters.batchId;
    }

    // Merge courseId + instructorId into a single batch filter
    const batchFilter: any = {};
    if (filters.courseId) batchFilter.courseId = filters.courseId;

    if (filters.instructorId) {
      // Find sessions where the batch's instructor matches
      where.batch = {
        instructorId: filters.instructorId,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
      };
    } else if (filters.courseId) {
      where.batch = batchFilter;
    }

    // Status filter
    const now = new Date();
    const bufferMs = 15 * 60 * 1000;
    if (filters.status === 'scheduled') {
      where.scheduledAt = { gt: now };
    } else if (filters.status === 'live') {
      where.scheduledAt = { lte: now };
      where.endedAt = null;
      where.scheduledEndAt = { gte: new Date(now.getTime() - bufferMs) };
    } else if (filters.status === 'completed') {
      where.OR = [
        { endedAt: { not: null } },
        { scheduledEndAt: { lt: new Date(now.getTime() - bufferMs) } },
      ];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    return prisma.liveSession.findMany({
      where,
      skip,
      take: limit,
      include: {
        batch: {
          select: {
            id: true, name: true, courseId: true,
            course: { select: { id: true, title: true } },
            instructor: { select: { id: true, name: true } },
          },
        },
        module: { select: { id: true, title: true } },
        recording: { select: { id: true, syncedAt: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  // Gets a single session by ID
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

  // Updates a session's title and/or time
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
    if (data.title) updateData.title = data.title;
    if (data.startDateTime) updateData.scheduledAt = new Date(data.startDateTime);
    if (data.endDateTime) {
      updateData.scheduledEndAt = new Date(data.endDateTime);
      // Do NOT set endedAt — that represents actual end, not scheduled end
    }

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Sync changes to the associated CalendarEvent
    const calendarUpdate: any = {};
    if (data.title) calendarUpdate.title = data.title;
    if (data.startDateTime) calendarUpdate.startAt = new Date(data.startDateTime);
    if (data.endDateTime) calendarUpdate.endAt = new Date(data.endDateTime);

    if (Object.keys(calendarUpdate).length > 0) {
      await prisma.calendarEvent.updateMany({
        where: { sessionId },
        data: calendarUpdate,
      });
    }

    return updated;
  },

  // Cancels or hard-deletes a session based on role
  async cancelSession(sessionId: string, userId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: { select: { instructorId: true } },
        recording: true,
      },
    });

    if (!session) throw new Error('Session not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Non-admin must be the assigned instructor
    if (user.role !== 'ADMIN' && session.batch.instructorId !== userId) {
      throw new Error('Only the assigned instructor or an admin can cancel this session');
    }

    // Fire notification after authorization check
    await notificationService.notifySessionCancelled(sessionId).catch(err => {
      console.error('Failed to send cancellation notification:', err.message);
    });

    if (user.role === 'ADMIN') {
      return prisma.$transaction(async (tx) => {
        await tx.calendarEvent.deleteMany({ where: { sessionId } });
        await tx.attendance.deleteMany({ where: { sessionId } });
        if (session.recording) {
          await tx.progress.deleteMany({ where: { recordingId: session.recording.id } });
          await tx.recording.delete({ where: { sessionId } });
        }
        return tx.liveSession.delete({ where: { id: sessionId } });
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.calendarEvent.deleteMany({ where: { sessionId } });
      return tx.liveSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });
    });
  },

  // Creates a session from Teams webhook event (idempotent)
  async createSessionFromTeams(data: {
    teamsMeetingId: string;
    joinUrl: string;
    batchId: string;
    moduleId?: string;
    scheduledAt: Date;
    scheduledEndAt?: Date;
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
        title: data.title,
        teamsMeetingId: data.teamsMeetingId,
        joinUrl: data.joinUrl,
        scheduledAt: data.scheduledAt,
        scheduledEndAt: data.scheduledEndAt ?? data.scheduledAt,
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
        endAt: data.scheduledEndAt ?? data.scheduledAt,
        joinUrl: data.joinUrl,
        sessionId: session.id,
      },
    });

    return { session, created: true };
  },
};
