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

import pino from "pino";
import { app } from "./app";
import { recordingSyncJob } from "./jobs/recording-sync.job";
import { prisma } from "./utils/prisma";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`API Server running on port ${PORT}`);
  recordingSyncJob.start();
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  recordingSyncJob.stop();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Prisma disconnected, server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
