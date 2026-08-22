import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    const maskedAuth = url.username ? `${url.username}:*****@` : "";
    console.debug(
      "[config] Using DATABASE_URL:",
      `${url.protocol}//${maskedAuth}${url.host}${url.pathname}`,
    );
  } catch (e) {
    console.debug(
      "[config] DATABASE_URL (raw):",
      process.env.DATABASE_URL?.slice(0, 80),
    );
  }
} else {
  console.debug("[config] DATABASE_URL not set");
}

import { logger } from "./utils/logger";
import { app } from "./app";
import { recordingSyncJob } from "./jobs/recording-sync.job";
import { reconcileAttendanceJob } from "./jobs/reconcile-attendance.job";
import { databaseBackupJob } from "./jobs/database-backup.job";
import { prisma } from "./utils/prisma";

import { socketService } from "./services/socket.service";

const PORT = process.env.PORT || 4000;

// Background jobs are tied to the API process lifecycle. In clustered/multi-
// instance deployments (PM2, Kubernetes) each instance would run the same
// setInterval → duplicate recording syncs and attendance reconciles. Default
// ON for single-instance, but worker-only instances can opt out.
const enableBackgroundJobs =
  (process.env.ENABLE_BACKGROUND_JOBS ?? "true").toLowerCase() === "true";

const server = app.listen(PORT, () => {
  logger.info(`API Server running on port ${PORT}`);
  socketService.init(server);
  if (enableBackgroundJobs) {
    recordingSyncJob.start();
    reconcileAttendanceJob.start();
    databaseBackupJob.start();
  } else {
    logger.info("Background jobs disabled (ENABLE_BACKGROUND_JOBS=false)");
  }
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  recordingSyncJob.stop();
  reconcileAttendanceJob.stop();
  databaseBackupJob.stop();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Prisma disconnected, server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Safety net: prevent unhandled promise rejections or unexpected errors from
// crashing the API process. Background jobs (recording sync, attendance
// reconciliation) should fail gracefully and retry on the next interval
// rather than taking down the entire server.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection — ignored");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — logging (process NOT exiting)");
});
