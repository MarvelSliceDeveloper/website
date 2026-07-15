import { prisma } from "../utils/prisma";
import { recordingService } from "../modules/recordings/recording.service";

let intervalId: NodeJS.Timeout | null = null;

export const recordingSyncJob = {
  /**
   * Run the sync operation.
   * Finds all live sessions that should have concluded but don't have recordings yet,
   * then attempts to sync recordings from Microsoft Teams Graph API.
   */
  async runSync() {
    console.log("[RecordingSyncJob] Starting automated recordings sync...");
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

      console.log(
        `[RecordingSyncJob] Found ${pastSessionsWithoutRecordings.length} completed sessions pending recording sync.`,
      );

      for (const session of pastSessionsWithoutRecordings) {
        console.log(
          `[RecordingSyncJob] Auto-fetching recording for session ${session.id} (${session.batch.course?.title || "Package Course"} — ${session.batch.name})`,
        );
        try {
          const recording = await recordingService.syncRecordingsForSession(
            session.id,
          );
          if (recording) {
            console.log(
              `[RecordingSyncJob] Sync successful for session ${session.id}.`,
            );
          } else {
            console.log(
              `[RecordingSyncJob] Recording not ready/available yet for session ${session.id}. Will retry in the next poll.`,
            );
          }
        } catch (syncError: any) {
          console.error(
            `[RecordingSyncJob] Sync failed for session ${session.id}:`,
            syncError.message,
          );
        }
      }
    } catch (error: any) {
      console.error(
        "[RecordingSyncJob] Fatal error during automated sync execution:",
        error.message,
      );
    }
  },

  /**
   * Start the background interval poller.
   * Runs every 5 minutes by default.
   */
  start(intervalMs = 5 * 60 * 1000) {
    if (intervalId) {
      console.log("[RecordingSyncJob] Poller is already running.");
      return;
    }

    console.log(
      `[RecordingSyncJob] Starting background polling sync every ${intervalMs / 1000 / 60} minutes.`,
    );

    // Run once immediately on start
    this.runSync();

    intervalId = setInterval(() => {
      this.runSync();
    }, intervalMs);
  },

  /**
   * Stop the background interval poller.
   */
  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log("[RecordingSyncJob] Background polling sync stopped.");
    }
  },
};
