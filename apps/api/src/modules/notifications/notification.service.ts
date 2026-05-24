import { prisma } from '../../utils/prisma';

export const notificationService = {
  /**
   * Create a notification for a specific user.
   */
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata ?? undefined,
      },
    });
  },

  /**
   * Bulk-create notifications for multiple users (e.g., all students in a batch).
   */
  async createMany(notifications: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }[]) {
    return prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        metadata: n.metadata ?? undefined,
      })),
    });
  },

  /**
   * List notifications for a user, newest first.
   */
  async listForUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Count unread notifications for a user.
   */
  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
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
    const startStr = session.scheduledAt.toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
    const message = `${session.batch.course.title} — ${session.batch.name}: A live session is scheduled for ${startStr}`;

    // Collect all user IDs: enrolled students + batch instructor + overridden instructor
    const userIds = new Set<string>();
    userIds.add(session.batch.instructorId);
    if (session.instructorId) {
      userIds.add(session.instructorId);
    }
    for (const enrollment of session.batch.enrollments) {
      userIds.add(enrollment.userId);
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

    const notifications = session.batch.enrollments.map((e) => ({
      userId: e.userId,
      title: '📹 Recording Available',
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
};
