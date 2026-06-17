import { prisma } from '../../utils/prisma';
import type { Prisma } from '@prisma/client';

interface NotificationCreateData {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Prisma.InputJsonValue;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

async function shouldNotify(userId: string, type: string): Promise<boolean> {
  if (!prisma || !('notificationPreference' in prisma)) return true;
  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    return pref ? pref.enabled : true;
  } catch {
    return true;
  }
}

export const notificationService = {
  /**
   * Create a notification for a specific user.
   */
  async create(data: NotificationCreateData) {
    if (!prisma || !('notification' in prisma)) {
      console.warn('Prisma notification model not available — skipping create');
      return null;
    }

    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          metadata: data.metadata ?? undefined,
        },
      });
    } catch (err: unknown) {
      console.error('Error creating notification:', (err as Error)?.message ?? err);
      return null;
    }
  },

  /**
   * Bulk-create notifications for multiple users (e.g., all students in a batch).
   */
  async createMany(notifications: NotificationCreateData[]): Promise<number> {
    if (!prisma || !('notification' in prisma)) {
      console.warn('Prisma notification model not available — skipping createMany');
      return 0;
    }

    if (!notifications || notifications.length === 0) return 0;

    try {
      // Chunk to avoid exceeding DB parameter limits when inserting large batches
      const chunks = chunkArray(notifications, 500);
      let totalInserted = 0;
      for (const chunk of chunks) {
        const payload = chunk.map((n) => ({
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          metadata: n.metadata ?? undefined,
        }));
        const result = await prisma.notification.createMany({ data: payload, skipDuplicates: true });
        totalInserted += result.count ?? 0;
      }
      return totalInserted;
    } catch (err: unknown) {
      console.error('Error creating many notifications:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * List notifications for a user, newest first.
   */
  async listForUser(userId: string, limit = 50) {
    if (!prisma || !('notification' in prisma)) {
      console.warn('Prisma notification model not available — returning empty notifications');
      return [];
    }

    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (err: unknown) {
      console.error('Error fetching notifications from DB:', (err as Error)?.message ?? err);
      return [];
    }
  },

  /**
   * Count unread notifications for a user.
   */
  async unreadCount(userId: string): Promise<number> {
    if (!prisma || !('notification' in prisma)) return 0;

    try {
      return await prisma.notification.count({ where: { userId, read: false } });
    } catch (err: unknown) {
      console.error('Error counting unread notifications:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<number> {
    if (!prisma || !('notification' in prisma)) {
      console.warn('Prisma notification model not available — cannot mark as read');
      return 0;
    }

    try {
      const res = await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true },
      });
      return res.count ?? 0;
    } catch (err: unknown) {
      console.error('Error marking notification as read:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<number> {
    if (!prisma || !('notification' in prisma)) {
      console.warn('Prisma notification model not available — cannot markAllAsRead');
      return 0;
    }

    try {
      const res = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return res.count ?? 0;
    } catch (err: unknown) {
      console.error('Error marking all notifications as read:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Delete a single notification (scoped to user).
   */
  async delete(notificationId: string, userId: string): Promise<number> {
    if (!prisma || !('notification' in prisma)) return 0;
    try {
      const res = await prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });
      return res.count;
    } catch (err: unknown) {
      console.error('Error deleting notification:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Delete all read notifications for a user.
   */
  async deleteAllRead(userId: string): Promise<number> {
    if (!prisma || !('notification' in prisma)) return 0;
    try {
      const res = await prisma.notification.deleteMany({
        where: { userId, read: true },
      });
      return res.count;
    } catch (err: unknown) {
      console.error('Error deleting read notifications:', (err as Error)?.message ?? err);
      return 0;
    }
  },

  /**
   * Get notification preferences for a user.
   */
  async getPreferences(userId: string) {
    if (!prisma || !('notificationPreference' in prisma)) return [];
    try {
      return await prisma.notificationPreference.findMany({
        where: { userId },
      });
    } catch {
      return [];
    }
  },

  /**
   * Upsert a notification preference.
   */
  async updatePreference(userId: string, type: string, data: { enabled?: boolean; email?: boolean }) {
    if (!prisma || !('notificationPreference' in prisma)) return null;
    try {
      return await prisma.notificationPreference.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type, enabled: data.enabled ?? true, email: data.email ?? false },
        update: { ...data },
      });
    } catch (err: unknown) {
      console.error('Error updating notification preference:', (err as Error)?.message ?? err);
      return null;
    }
  },

  /**
   * Notify all enrolled students + the instructor when a session is scheduled.
   */
  async notifySessionScheduled(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            course: { select: { title: true } },
            enrollments: {
              where: { status: 'APPROVED' },
              select: { userId: true },
            },
          },
        },
        calendarEvent: { select: { title: true, startAt: true } },
      },
    });

    if (!session) return;

    const title = session.calendarEvent?.title ?? `Live Session Scheduled`;
    const startStr = session.scheduledAt
      ? new Date(session.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
      : 'unspecified time';

    const message = `${session.batch.course.title} — ${session.batch.name}: A live session is scheduled for ${startStr}`;

    const userIds = new Set<string>();
    if (session.batch?.instructorId) userIds.add(session.batch.instructorId);
    if (session.instructorId) userIds.add(session.instructorId);
    for (const enrollment of session.batch.enrollments ?? []) {
      if (enrollment?.userId) userIds.add(enrollment.userId);
    }

    const notifications = Array.from(userIds).map((userId) => ({
      userId,
      title,
      message,
      type: 'SESSION_SCHEDULED',
      metadata: {
        sessionId: session.id,
        batchId: session.batchId,
        joinUrl: session.joinUrl,
      },
    }));

    if (notifications.length > 0) {
      await this.createMany(notifications);
    }
  },

  /**
   * Notify students when a recording becomes available.
   */
  async notifyRecordingAvailable(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            course: { select: { title: true } },
            enrollments: {
              where: { status: 'APPROVED' },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!session) return;

    const message = `Recording is now available for ${session.batch.course.title} — ${session.batch.name}`;

    const userIds = new Set<string>();
    if (session.batch?.instructorId) userIds.add(session.batch.instructorId);
    if (session.instructorId) userIds.add(session.instructorId);
    for (const enrollment of session.batch.enrollments ?? []) {
      if (enrollment?.userId) userIds.add(enrollment.userId);
    }

    const notifications = Array.from(userIds).map((userId) => ({
      userId,
      title: 'Recording Available',
      message,
      type: 'RECORDING_AVAILABLE',
      metadata: {
        sessionId: session.id,
        batchId: session.batchId,
      },
    }));

    if (notifications.length > 0) {
      await this.createMany(notifications);
    }
  },

  /**
   * Notify enrolled students + instructor when a session is cancelled.
   */
  async notifySessionCancelled(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            course: { select: { title: true } },
            enrollments: {
              where: { status: 'APPROVED' },
              select: { userId: true },
            },
          },
        },
      },
    });
    if (!session) return;

    const message = `Session cancelled for ${session.batch.course.title} — ${session.batch.name}`;
    const userIds = new Set<string>();
    if (session.batch?.instructorId) userIds.add(session.batch.instructorId);
    if (session.instructorId) userIds.add(session.instructorId);
    for (const enrollment of session.batch.enrollments ?? []) {
      if (enrollment?.userId) userIds.add(enrollment.userId);
    }

    const notifications = Array.from(userIds).map((userId) => ({
      userId,
      title: 'Session Cancelled',
      message,
      type: 'SESSION_CANCELLED',
      metadata: { sessionId: session.id, batchId: session.batchId },
    }));
    if (notifications.length > 0) await this.createMany(notifications);
  },

  /**
   * Notify student + admins when a mentorship ticket is created.
   */
  async notifyMentorshipCreated(ticketId: string) {
    const ticket = await prisma.mentorshipTicket.findUnique({
      where: { id: ticketId },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { title: true } },
      },
    });
    if (!ticket) return;

    // Notify student
    await this.create({
      userId: ticket.studentId,
      title: 'Mentorship Request Submitted',
      message: `Your mentorship request "${ticket.title}" has been submitted. Admin will review and assign a mentor.`,
      type: 'MENTORSHIP_CREATED',
      metadata: { ticketId: ticket.id },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length > 0) {
      const courseLabel = ticket.course?.title ? ` for ${ticket.course.title}` : '';
      await this.createMany(
        admins.map((admin) => ({
          userId: admin.id,
          title: 'New Mentorship Request',
          message: `${ticket.student.name} requested mentorship${courseLabel}: "${ticket.title}"`,
          type: 'MENTORSHIP_CREATED',
          metadata: { ticketId: ticket.id, studentId: ticket.studentId },
        }))
      );
    }
  },

  /**
   * Notify student + mentor when a mentorship ticket status changes.
   */
  async notifyMentorshipStatusChange(ticketId: string, status: string) {
    const ticket = await prisma.mentorshipTicket.findUnique({
      where: { id: ticketId },
      include: { student: { select: { id: true, name: true } }, mentor: { select: { id: true, name: true } } },
    });
    if (!ticket) return;

    const labels: Record<string, string> = {
      ASSIGNED: 'Mentor Assigned',
      SCHEDULED: 'Session Scheduled',
      COMPLETED: 'Mentorship Completed',
      CANCELLED: 'Mentorship Cancelled',
    };
    const label = labels[status] ?? status;
    const message = `Your mentorship request "${ticket.title}" — ${label}`;

    const userIds: string[] = [ticket.studentId];
    if (ticket.mentorId) userIds.push(ticket.mentorId);

    const notifications = userIds.map((userId) => ({
      userId,
      title: label,
      message,
      type: `MENTORSHIP_${status}`,
      metadata: { ticketId: ticket.id },
    }));
    if (notifications.length > 0) await this.createMany(notifications);
  },

  /**
   * Notify ticket creator + all admins when a support ticket is created.
   */
  async notifySupportTicketCreated(ticketId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
    if (!ticket) return;

    // Notify the creator (student/instructor)
    await this.create({
      userId: ticket.userId,
      title: 'Support Ticket Submitted',
      message: `Your support ticket "${ticket.title}" has been submitted. Admin will review it shortly.`,
      type: 'SUPPORT_TICKET_CREATED',
      metadata: { ticketId: ticket.id },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await this.createMany(
        admins.map((admin) => ({
          userId: admin.id,
          title: 'New Support Ticket',
          message: `${ticket.user.name} opened a support ticket: "${ticket.title}"`,
          type: 'SUPPORT_TICKET_CREATED',
          metadata: { ticketId: ticket.id, userId: ticket.userId },
        }))
      );
    }
  },

  /**
   * Notify the other party when a new message is added to a support ticket.
   */
  async notifySupportTicketNewMessage(ticketId: string, senderId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!ticket) return;

    // Notify all admins (if user sent) OR notify the user (if admin sent)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
    });
    const adminIds = admins.map((a) => a.id);
    const isAdminSender = adminIds.includes(senderId);

    if (isAdminSender) {
      // Admin replied — notify the ticket creator
      await this.create({
        userId: ticket.userId,
        title: 'New Reply on Support Ticket',
        message: `Admin replied to your support ticket "${ticket.title}".`,
        type: 'SUPPORT_TICKET_RESPONDED',
        metadata: { ticketId: ticket.id },
      });
    } else {
      // User replied — notify all admins
      if (adminIds.length > 0) {
        await this.createMany(
          admins.map((admin) => ({
            userId: admin.id,
            title: 'New Reply on Support Ticket',
            message: `${ticket.user.name} replied to support ticket "${ticket.title}".`,
            type: 'SUPPORT_TICKET_RESPONDED',
            metadata: { ticketId: ticket.id, userId: ticket.userId },
          }))
        );
      }
    }
  },

  /**
   * Notify ticket creator when support ticket status changes.
   */
  async notifySupportTicketStatusChanged(ticketId: string, status: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!ticket) return;

    const labels: Record<string, string> = {
      OPEN: 'Reopened',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
    };
    const label = labels[status] ?? status;

    await this.create({
      userId: ticket.userId,
      title: 'Support Ticket Status Updated',
      message: `Your support ticket "${ticket.title}" is now marked as "${label}".`,
      type: 'SUPPORT_TICKET_STATUS_CHANGED',
      metadata: { ticketId: ticket.id, status },
    });
  },

  /**
   * Notify a student when their assignment is graded.
   */
  async notifyAssignmentGraded(submissionId: string) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { select: { title: true } },
        student: { select: { id: true } },
      },
    });
    if (!submission) return;

    const message = `Your assignment "${submission.assignment.title}" has been graded.`;
    await this.create({
      userId: submission.studentId,
      title: 'Assignment Graded',
      message,
      type: 'ASSIGNMENT_GRADED',
      metadata: { submissionId: submission.id, assignmentId: submission.assignmentId },
    });
  },
};
