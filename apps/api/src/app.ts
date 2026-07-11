import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import pino from "pino";
import rateLimit from "express-rate-limit";
import fs from "fs";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import { authRouter } from "./modules/auth/auth.routes";
import { calendarRouter } from "./modules/calendar/calendar.routes";
import { webhookRouter } from "./modules/calendar/webhook.routes";
import { sessionRouter } from "./modules/sessions/session.routes";
import { recordingRouter } from "./modules/recordings/recording.routes";
import { courseRouter } from "./modules/courses/course.routes";
import { batchRouter } from "./modules/batches/batch.routes";
import { studentBatchRouter } from "./modules/batches/student-batch.routes";
import { userRouter } from "./modules/users/user.routes";
import { certificateRouter } from "./modules/certificates/certificate.routes";
import { studentRouter } from "./modules/student/student.routes";
import { studentCourseRouter } from "./modules/courses/student-course.routes";
import { eventsWebhookController } from "./modules/sessions/events-webhook.controller";
import { notificationRouter } from "./modules/notifications/notification.routes";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { enrollmentRouter } from "./modules/enrollments/enrollment.routes";
import { assignmentRouter } from "./modules/assignments/assignment.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { messageRouter } from "./modules/messages/message.routes";
import { mentorshipRouter } from "./modules/mentorship/mentorship.routes";
import { supportRouter } from "./modules/support/support.routes";
import ticketRouter from "./modules/tickets/ticket.routes";
import { noteRouter } from "./modules/notes/notes.routes";
import { settingRouter } from "./modules/settings/setting.routes";
import { apiKeyRouter } from "./modules/api-keys/api-key.routes";
import { permissionRouter } from "./modules/permissions/permission.routes";
import { quizTemplateRouter } from "./modules/quiz-templates/quiz-template.routes";
import { assignmentTemplateRouter } from "./modules/assignment-templates/assignment-template.routes";
import { superAdminRouter } from "./modules/super-admin/super-admin.routes";
import { courseTemplateRouter } from "./modules/courses/course-template.routes";
import { logRouter } from "./modules/logs/log.routes";
import { loginHistoryRouter } from "./modules/logs/login-history.routes";
import { consentLogRouter } from "./modules/logs/consent-log.routes";
import { trashRouter } from "./modules/super-admin/trash.routes";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const app = express();

const uploadsRoot = path.resolve(__dirname, "..", "uploads");
fs.mkdirSync(uploadsRoot, { recursive: true });

app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

// ── CSRF protection — applied BEFORE body parser so invalid requests
//     are rejected without parsing the request body ──
const csrfExemptPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/azure-ad/callback",
  "/api/webhooks/",
  "/api/csrf-token",
  "/health",
];

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => {
    const secret = process.env.CSRF_SECRET;
    if (!secret) {
      throw new Error("Missing required environment variable: CSRFSECRET");
    }
    return secret;
  },
  getSessionIdentifier: (req) =>
    (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  skipCsrfProtection: (req) =>
    csrfExemptPaths.some((p) => req.path.startsWith(p)) ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/images/"),
});

app.use(doubleCsrfProtection);
app.use(express.json());

app.use("/uploads", express.static(uploadsRoot));

const publicRoot = path.resolve(__dirname, "..", "..", "..", "public");
app.use("/images", express.static(path.join(publicRoot, "images")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
});
app.use(limiter);

// ── Routes ──
app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhookRouter);
app.post("/api/webhooks/events", eventsWebhookController.handleEventsWebhook);
app.get("/api/csrf-token", (req: Request, res: Response) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
});
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Protected routes ──
app.use("/api/calendar", calendarRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/recordings", recordingRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/admin/courses", courseRouter);
app.use("/api/admin/batches", batchRouter);
app.use("/api/batches", studentBatchRouter);
app.use("/api/users", userRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/student", studentRouter);
app.use("/api/courses", studentCourseRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/admin/enrollments", enrollmentRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/messages", messageRouter);
app.use("/api/support", supportRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/notes", noteRouter);

// ── Super Admin routes ──
app.use("/api/admin/users", superAdminRouter);
app.use("/api/admin/settings", settingRouter);
app.use("/api/admin/api-keys", apiKeyRouter);
app.use("/api/admin/permissions", permissionRouter);
app.use("/api/admin/quiz-templates", quizTemplateRouter);
app.use("/api/admin/assignment-templates", assignmentTemplateRouter);
app.use("/api/admin/courses", courseTemplateRouter);
app.use("/api/admin/logs", logRouter);
app.use("/api/admin/login-history", loginHistoryRouter);
app.use("/api/admin/consent-logs", consentLogRouter);
app.use("/api/admin/trash", trashRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) {
    logger.error(err);
  }
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

export { app };
