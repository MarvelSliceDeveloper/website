import { logger } from "../utils/logger";
import {
  createBackup,
  pruneBackups,
  BACKUP_KEEP_COUNT,
} from "../modules/admin/backup/backup.service";

const DEFAULT_HOUR = 2; // 2 AM server time
const HOURS_BETWEEN_RUNS = 24;

let timer: NodeJS.Timeout | null = null;
let running = false;
let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_BACKOFF = 3;

function msUntilNextScheduledTime(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  next.setSeconds(0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function scheduleNext() {
  if (timer) clearTimeout(timer);
  const hour = Number(process.env.BACKUP_HOUR) || DEFAULT_HOUR;
  const delay = msUntilNextScheduledTime(hour);
  timer = setTimeout(() => {
    void runBackupJob();
  }, delay);
  logger.info(
    "[DatabaseBackupJob] Next scheduled backup in %.1f hours (server time %02d:00).",
    delay / 3_600_000,
    hour,
  );
}

async function runBackupJob() {
  if (running) return;
  running = true;
  try {
    logger.info("[DatabaseBackupJob] Starting scheduled database backup...");
    const backup = await createBackup();
    const pruned = pruneBackups(BACKUP_KEEP_COUNT);
    logger.info(
      "[DatabaseBackupJob] Backup created: %s (%d bytes). Pruned %d old backup(s).",
      backup.filename,
      backup.size,
      pruned.length,
    );
    if (consecutiveFailures > 0) {
      logger.info("[DatabaseBackupJob] Recovery successful. Resetting failure counter.");
    }
    consecutiveFailures = 0;
  } catch (error: unknown) {
    consecutiveFailures++;
    const msg = error instanceof Error ? error.message : "unknown error";
    logger.error(
      "[DatabaseBackupJob] Backup failed (failure #%d): %s",
      consecutiveFailures,
      msg,
    );
  } finally {
    running = false;
    const backoff =
      consecutiveFailures > MAX_FAILURES_BEFORE_BACKOFF ? 2 : 1;
    const delayMs = msUntilNextScheduledTime(Number(process.env.BACKUP_HOUR) || DEFAULT_HOUR);
    if (consecutiveFailures > MAX_FAILURES_BEFORE_BACKOFF) {
      // Back off to next hour boundary to avoid hammering a down DB.
      const hourDelay = HOURS_BETWEEN_RUNS * 3_600_000 * 0.5;
      timer = setTimeout(() => {
        void runBackupJob();
      }, Math.min(delayMs, hourDelay));
      logger.warn(
        "[DatabaseBackupJob] Backing off — next retry in %d min.",
        Math.min(delayMs, hourDelay) / 60000,
      );
    } else {
      scheduleNext();
    }
  }
}

export const databaseBackupJob = {
  start() {
    if (timer) {
      logger.info("[DatabaseBackupJob] Scheduler is already running.");
      return;
    }
    scheduleNext();
  },

  stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      logger.info("[DatabaseBackupJob] Scheduler stopped.");
    }
  },

  runNow() {
    return runBackupJob();
  },
};