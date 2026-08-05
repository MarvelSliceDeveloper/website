import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { recordingService } from "../modules/recordings/recording.service";

let intervalId: NodeJS.Timeout | null = null;
let consecutiveFailures = 0;
const BASE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_INTERVAL = 30 * 60 * 1000; // 30 minutes cap
const MAX_FAILURES_BEFORE_BACKOFF = 3;

function getBackoffInterval(): number {
  if (consecutiveFailures <= MAX_FAILURES_BEFORE_BACKOFF) return BASE_INTERVAL;
  // Exponential backoff: base * 2^(failures - threshold), capped at MAX_INTERVAL
  const factor = Math.pow(2, consecutiveFailures - MAX_FAILURES_BEFORE_BACKOFF);
  return Math.min(BASE_INTERVAL * factor, MAX_INTERVAL);
}

export const recordingSyncJob = {
  /**
   * Run the sync operation.
   * Finds all live sessions that should have concluded but don't have recordings yet,
   * then attempts to sync recordings from Microsoft Teams Graph API.
   */
  async runSync() {
    logger.info("[RecordingSyncJob] Starting automated recordings sync...");
    let dbError = false;
    try {
      const now = new Date();
      // A session is eligible for recording sync if it was explicitly ended
      // OR its scheduled end time was at least 90 minutes ago (recording needs time to appear)
      const cutoffTime = new Date(now.getTime() - 90 * 60 * 1000);

      const pastSessionsWithoutRecordings = (await prisma.liveSession.findMany({
        where: {
          recording: {
            is: null,
          },
          OR: [
            { endedAt: { not: null } },
            { scheduledEndAt: { lte: cutoffTime } },
          ],
        },
        select: {
          id: true,
          createdBy: true,
          scheduledAt: true,
          endedAt: true,
          batch: {
            select: {
              name: true,
              course: { select: { title: true } },
            },
          },
        },
      })) as any[];

      logger.info(
        "[RecordingSyncJob] Found %d completed sessions pending recording sync.",
        pastSessionsWithoutRecordings.length,
      );

      for (const session of pastSessionsWithoutRecordings) {
        logger.info(
          "[RecordingSyncJob] Auto-fetching recording for session %s (%s — %s)",
          session.id,
          session.batch.course?.title || "Package Course",
          session.batch.name,
        );
        try {
          const recording = await recordingService.syncRecordingsForSession(
            session.id,
          );
          if (recording) {
            logger.info(
              "[RecordingSyncJob] Sync successful for session %s.",
              session.id,
            );
          } else {
            logger.info(
              "[RecordingSyncJob] Recording not ready for session %s. Will retry in next poll.",
              session.id,
            );
          }
        } catch (syncError: any) {
          logger.warn(
            "[RecordingSyncJob] Sync failed for session %s: %s",
            session.id,
            syncError.message,
          );
        }
      }

      // Success — reset failure counter
      if (consecutiveFailures > 0) {
        logger.info(
          "[RecordingSyncJob] Recovery successful. Resetting poll interval to %d min.",
          BASE_INTERVAL / 60000,
        );
      }
      consecutiveFailures = 0;
    } catch (error: any) {
      dbError = true;
      consecutiveFailures++;
      const nextInterval = getBackoffInterval();
      logger.error(
        "[RecordingSyncJob] Error during sync (failure #%d): %s — next poll in %d min",
        consecutiveFailures,
        error.message,
        nextInterval / 60000,
      );
    } finally {
      if (dbError && intervalId) {
        // Clear the current interval and restart with backoff
        clearInterval(intervalId);
        intervalId = setInterval(
          () => void recordingSyncJob.runSync(),
          getBackoffInterval(),
        );
      }
    }
  },

  /**
   * Start the background interval poller.
   * Runs every 5 minutes by default, with exponential backoff on DB failures.
   */
  start(intervalMs?: number) {
    if (intervalId) {
      logger.info("[RecordingSyncJob] Poller is already running.");
      return;
    }

    const actualInterval = intervalMs ?? BASE_INTERVAL;
    logger.info(
      "[RecordingSyncJob] Starting background polling sync every %d min.",
      actualInterval / 60000,
    );

    // Run once immediately on start (void prevents unhandled rejection crash)
    void this.runSync();

    intervalId = setInterval(() => {
      void this.runSync();
    }, actualInterval);
  },

  /**
   * Stop the background interval poller.
   */
  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      logger.info("[RecordingSyncJob] Background polling sync stopped.");
    }
  },
};
