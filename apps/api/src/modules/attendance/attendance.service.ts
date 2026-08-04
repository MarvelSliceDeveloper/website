import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { presenceService } from "../../services/presence.service";

// A student counts as "late" if they joined 10+ minutes after the scheduled start
const LATE_JOIN_MS = 10 * 60 * 1000;
// A student "left early" if they left 15+ minutes before the scheduled end
const EARLY_LEAVE_MS = 15 * 60 * 1000;

export const attendanceService = {
  // Records a student joining a live session (creates or reopens attendance)
  async recordAttendance(userId: string, sessionId: string) {
    // 1. Verify the session exists
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          select: {
            id: true,
            enrollments: {
              where: { userId, status: "APPROVED" },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, "Session not found");
    }

    // 2. Verify student enrollment in the batch of this session
    if (!session.batch || session.batch.enrollments.length === 0) {
      throw new AppError(
        403,
        "You are not enrolled in the batch for this session",
      );
    }

    // 3. Create, reopen, or keep the attendance record
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
    });

    let attendance;
    if (!existing) {
      attendance = await prisma.attendance.create({
        data: { userId, sessionId },
      });
    } else if (existing.leftAt) {
      // Rejoin — reopen the record and count the extra visit. joinedAt resets
      // to now so the final duration only covers the latest stint.
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          leftAt: null,
          joinedAt: new Date(),
          rejoinCount: { increment: 1 },
        },
      });
    } else {
      // Already open — idempotent join, nothing to change
      attendance = existing;
    }

    // 4. Mark the student as present for live counts
    presenceService.markPresent(sessionId, userId);

    return attendance;
  },

  // Records a student leaving a live session
  async leaveSession(userId: string, sessionId: string) {
    const record = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });

    if (!record || record.leftAt) {
      throw new AppError(400, "No open attendance record found");
    }

    const leftAt = new Date();
    const durationSeconds = Math.floor(
      (leftAt.getTime() - record.joinedAt.getTime()) / 1000,
    );

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { scheduledAt: true, scheduledEndAt: true, endedAt: true },
    });

    // Qualified = attended at least half of the session's actual duration
    // (actual end is endedAt when explicitly ended, otherwise scheduled end)
    const actualMs = session
      ? (session.endedAt ?? session.scheduledEndAt).getTime() -
        session.scheduledAt.getTime()
      : 0;
    const qualified =
      actualMs > 0 && durationSeconds >= actualMs / 2000;

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { leftAt, durationSeconds, qualified, lastSeenAt: leftAt },
    });

    presenceService.markAbsent(sessionId, userId);

    return updated;
  },

  // Heartbeat from a student currently in the session.
  // Always updates live presence; only touches the DB record when one is open.
  async heartbeat(userId: string, sessionId: string) {
    presenceService.markPresent(sessionId, userId);

    const record = await prisma.attendance.findFirst({
      where: { userId, sessionId, leftAt: null },
      select: { id: true },
    });
    if (!record) return null;

    return prisma.attendance.update({
      where: { id: record.id },
      data: { lastSeenAt: new Date() },
      select: { id: true, lastSeenAt: true },
    });
  },

  // Aggregated analytics for a session
  async getSessionStats(sessionId: string) {
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { scheduledAt: true, scheduledEndAt: true, endedAt: true },
    });
    if (!session) throw new AppError(404, "Session not found");

    const [records, liveNow, peakConcurrent] = await Promise.all([
      prisma.attendance.findMany({
        where: { sessionId },
        select: {
          durationSeconds: true,
          qualified: true,
          joinedAt: true,
          leftAt: true,
        },
      }),
      presenceService.liveCount(sessionId),
      presenceService.getPeak(sessionId),
    ]);

    const uniqueAttendees = records.length;

    const withDuration = records.filter(
      (r) => r.durationSeconds != null && r.durationSeconds > 0,
    );
    const avgDurationSeconds =
      withDuration.length > 0
        ? Math.round(
            withDuration.reduce(
              (sum, r) => sum + (r.durationSeconds ?? 0),
              0,
            ) / withDuration.length,
          )
        : 0;

    const qualifiedCount = records.filter((r) => r.qualified).length;

    const lateJoins = records.filter(
      (r) =>
        r.joinedAt.getTime() - session.scheduledAt.getTime() >= LATE_JOIN_MS,
    ).length;

    const earlyLeaves = records.filter(
      (r) =>
        r.leftAt !== null &&
        session.scheduledEndAt.getTime() - r.leftAt.getTime() >=
          EARLY_LEAVE_MS,
    ).length;

    const attendanceRate =
      uniqueAttendees > 0
        ? Math.round((qualifiedCount / uniqueAttendees) * 100)
        : 0;

    const totalWatchMinutes = Math.round(
      withDuration.reduce((sum, r) => sum + (r.durationSeconds ?? 0), 0) / 60,
    );

    return {
      stats: {
        uniqueAttendees,
        liveNow,
        peakConcurrent,
        avgDurationSeconds,
        qualifiedCount,
        lateJoins,
        earlyLeaves,
        attendanceRate,
        totalWatchMinutes,
      },
    };
  },

  // Gets attendance record for a user in a session
  async getAttendance(userId: string, sessionId: string) {
    return prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
    });
  },

  // Lists all attendance records for a session
  async listForSession(sessionId: string) {
    return prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  },
};
