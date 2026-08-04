import { prisma } from "../utils/prisma";

let intervalId: NodeJS.Timeout | null = null;

export const reconcileAttendanceJob = {
  /**
   * Closes open attendance records for sessions that have already concluded.
   * Safety net for students who close the tab without hitting the leave endpoint.
   */
  async runReconcile() {
    const now = new Date();
    const bufferMs = 15 * 60 * 1000;

    const concludedSessions = (await prisma.liveSession.findMany({
      where: {
        OR: [
          { endedAt: { not: null } },
          { scheduledEndAt: { lte: new Date(now.getTime() - bufferMs) } },
        ],
      },
      select: {
        id: true,
        scheduledAt: true,
        scheduledEndAt: true,
        endedAt: true,
        attendance: {
          where: { leftAt: null },
          select: { id: true, joinedAt: true, lastSeenAt: true },
        },
      },
    })) as any[];

    let closed = 0;
    for (const session of concludedSessions) {
      const actualMs =
        (session.endedAt ?? session.scheduledEndAt).getTime() -
        session.scheduledAt.getTime();

      for (const record of session.attendance) {
        const leftAt = record.lastSeenAt ?? now;
        const durationSeconds = Math.max(
          0,
          Math.floor((leftAt.getTime() - record.joinedAt.getTime()) / 1000),
        );
        const qualified = actualMs > 0 && durationSeconds >= actualMs / 2000;

        await prisma.attendance.update({
          where: { id: record.id },
          data: { leftAt, durationSeconds, qualified, lastSeenAt: leftAt },
        });
        closed += 1;
      }
    }

    if (closed > 0) {
      console.log(
        `[ReconcileAttendanceJob] Closed ${closed} stale attendance record(s) across ${concludedSessions.length} concluded session(s).`,
      );
    }
  },

  /** Start the background interval poller (default: every 15 minutes). */
  start(intervalMs = 15 * 60 * 1000) {
    if (intervalId) return;
    this.runReconcile();
    intervalId = setInterval(() => this.runReconcile(), intervalMs);
  },

  /** Stop the background interval poller. */
  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
};
