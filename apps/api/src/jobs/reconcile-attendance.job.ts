import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

let intervalId: NodeJS.Timeout | null = null;
let consecutiveFailures = 0;
const BASE_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_INTERVAL = 60 * 60 * 1000; // 60 minutes cap
const MAX_FAILURES_BEFORE_BACKOFF = 3;

function getBackoffInterval(): number {
  if (consecutiveFailures <= MAX_FAILURES_BEFORE_BACKOFF) return BASE_INTERVAL;
  const factor = Math.pow(2, consecutiveFailures - MAX_FAILURES_BEFORE_BACKOFF);
  return Math.min(BASE_INTERVAL * factor, MAX_INTERVAL);
}

export const reconcileAttendanceJob = {
  /**
   * Closes open attendance records for sessions that have already concluded.
   * Safety net for students who close the tab without hitting the leave endpoint.
   */
  async runReconcile() {
    let dbError = false;
    try {
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
            data: {
              leftAt,
              durationSeconds,
              qualified,
              lastSeenAt: leftAt,
            },
          });
          closed += 1;
        }
      }

      if (closed > 0) {
        logger.info(
          "[ReconcileAttendanceJob] Closed %d stale attendance record(s) across %d concluded session(s).",
          closed,
          concludedSessions.length,
        );
      }

      // Success — reset failure counter
      if (consecutiveFailures > 0) {
        logger.info(
          "[ReconcileAttendanceJob] Recovery successful. Resetting poll interval to %d min.",
          BASE_INTERVAL / 60000,
        );
      }
      consecutiveFailures = 0;
    } catch (err: any) {
      dbError = true;
      consecutiveFailures++;
      const nextInterval = getBackoffInterval();
      logger.error(
        "[ReconcileAttendanceJob] Error during attendance reconciliation (failure #%d): %s — next poll in %d min",
        consecutiveFailures,
        err.message,
        nextInterval / 60000,
      );
    } finally {
      if (dbError && intervalId) {
        // Clear the current interval and restart with backoff
        clearInterval(intervalId);
        intervalId = setInterval(
          () => void reconcileAttendanceJob.runReconcile(),
          getBackoffInterval(),
        );
      }
    }
  },

  /** Start the background interval poller (default: every 15 minutes). */
  start(intervalMs?: number) {
    if (intervalId) return;
    const actualInterval = intervalMs ?? BASE_INTERVAL;
    void this.runReconcile();
    intervalId = setInterval(() => void this.runReconcile(), actualInterval);
  },

  /** Stop the background interval poller. */
  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
};
