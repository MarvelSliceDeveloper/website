import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import * as Sentry from "@sentry/node";

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { doubleCsrf } from "csrf-csrf";
import { authRouter } from "./modules/auth/auth.routes";
import { twoFactorRouter } from "./modules/auth/2fa.routes";
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
import { adminHealthRouter } from "./modules/admin/health.routes";
import { prisma } from "./utils/prisma";
import { courseTemplateRouter } from "./modules/courses/course-template.routes";
import { logRouter } from "./modules/logs/log.routes";
import { loginHistoryRouter } from "./modules/logs/login-history.routes";
import { consentLogRouter } from "./modules/logs/consent-log.routes";
import { trashRouter } from "./modules/super-admin/trash.routes";
import { youtubeRouter } from "./modules/youtube/youtube.routes";
import { aiRouter } from "./modules/ai/ai.routes";
import { couponRouter } from "./modules/coupons/coupon.routes";
import { referralRouter } from "./modules/referrals/referral.routes";
import {
  paymentRouter,
  adminPaymentRouter,
} from "./modules/payments/payment.routes";
import {
  packageRouter,
  packageEnrollmentRouter,
  publicPackageRouter,
} from "./modules/packages/package.routes";
import categoriesRouter from "./modules/admin/categories/categories.routes";
import tagsRouter from "./modules/admin/tags/tags.routes";
import contentRouter from "./modules/admin/content/content.routes";
import adminCertificatesRouter from "./modules/admin/certificates/certificates.routes";
import certificateTemplateRouter from "./modules/admin/certificates/template.routes";
import staticPagesRouter, {
  publicStaticPagesRouter,
} from "./modules/admin/static-pages/static-pages.routes";
import emailTemplatesRouter from "./modules/admin/email-templates/email-templates.routes";
import auditLogsRouter from "./modules/admin/audit-logs/audit-logs.routes";
import announcementsRouter from "./modules/admin/announcements/announcements.routes";
import { bulkUsersRouter } from "./modules/admin/users/bulk.routes";
import {
  brandingRouter,
  publicBrandingRouter,
} from "./modules/admin/branding/branding.routes";
import { i18nRouter } from "./modules/admin/i18n/i18n.routes";
import { cacheRouter } from "./modules/admin/cache/cache.routes";
import { onboardingRouter } from "./modules/onboarding/onboarding.routes";
import { instructorRouter } from "./modules/instructor/instructor.routes";
import { profileRouter } from "./modules/instructor/profile.routes";
import { auditMiddleware } from "./utils/audit";
import { maintenanceMiddleware } from "./middleware/maintenance.middleware";
import { maintenanceRouter } from "./modules/admin/maintenance/maintenance.routes";
import backupRouter from "./modules/admin/backup/backup.routes";
import alertingWebhooksRouter from "./modules/admin/webhooks/alerting-webhooks.routes";
import { refundsRouter } from "./modules/admin/refunds/refunds.routes";
import { assignmentReviewRouter } from "./modules/admin/assignments/review.routes";
import { instructorsRouter } from "./modules/admin/instructors/instructors.routes";
import { sessionsRouter } from "./modules/admin/sessions/sessions.routes";
import {
  internRouter,
  adminInternRouter,
} from "./modules/interns/intern.routes";
import { versionRouter } from "./modules/version/version.routes";
import { uploadsRoot, ensureUploadsDir } from "./utils/uploads";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

// ── Sentry error tracking ──
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    integrations: [Sentry.httpIntegration()],
  });
}

const app = express();

// ── Security headers — XSS / clickjack / referrer / feature-policy ──
app.use((_req: Request, res: Response, next: NextFunction) => {
  // CSP: lock down; API is JSON-only so `default-src 'none'` is safe
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data:; connect-src 'self' https:; script-src 'self'; style-src 'self' 'unsafe-inline'",
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  next();
});

// Sentry v10+ auto-instruments Express — no manual request/tracing handlers needed

ensureUploadsDir(".");

app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/health",
    },
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
    customLogLevel: (res, err) => {
      const statusCode = (res as any).statusCode ?? 200;
      if (statusCode >= 500) return "error";
      if (statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${(res as any).statusCode ?? 200} ${(res as any).responseTime ?? 0}ms`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${(res as any).statusCode ?? 500} - ${err.message} ${(res as any).responseTime ?? 0}ms`,
  } as any),
);

// ── CSRF protection — applied BEFORE body parser so invalid requests
//     are rejected without parsing the request body ──
const csrfExemptPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me/set-password",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/azure-ad/callback",
  "/api/auth/2fa/challenge",
  "/api/webhooks/",
  "/api/csrf-token",
  "/api/maintenance-status",
  "/api/version",
  "/health",
  "/api/payments/create-order",
  "/api/payments/verify",
  "/api/payments/batches",
  "/api/coupons/validate",
  "/api/interns/apply",
];

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => {
    const secret = process.env.CSRF_SECRET;
    if (!secret) {
      throw new Error("Missing required environment variable: CSRF_SECRET");
    }
    return secret;
  },
  getSessionIdentifier: (req) => {
    // doubleCsrfProtection runs BEFORE the route-level auth middleware, so
    // req.user is not populated here. Derive a stable identifier from the
    // httpOnly access-token cookie instead — this yields the same value for
    // every request belonging to a given authenticated session, which is
    // required for the issued CSRF token to validate on the next request.
    const token = (req as any).cookies?.accessToken as string | undefined;
    if (token) {
      try {
        const decoded = jwt.decode(token) as { userId?: string } | null;
        if (decoded?.userId) return decoded.userId;
      } catch {
        /* fall through to per-request fallback */
      }
    }
    // Unauthenticated fallback (state-changing unauthenticated requests are
    // rejected by auth anyway). Cached per-request so a token issued and
    // validated within the same logical flow stays consistent.
    if (!(req as any)._csrfSessionId) {
      (req as any)._csrfSessionId = crypto.randomBytes(16).toString("hex");
    }
    return (req as any)._csrfSessionId;
  },
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

// Behind 1-2 reverse proxies (host Apache -> Docker nginx -> api) trust
// both hops so req.protocol / req.ip reflect the original client, not
// the loopback nginx. `2` covers Apache + nginx; `true` would also work.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 2);
}

app.use("/uploads", express.static(uploadsRoot));

const publicRoot = path.resolve(__dirname, "..", "..", "..", "public");
app.use("/images", express.static(path.join(publicRoot, "images")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
if (process.env.DISABLE_RATE_LIMIT !== "true") {
  app.use(limiter);
}

// ── Routes ──
app.use(maintenanceMiddleware);

// Auto-audit: log all mutations on admin routes (placed before route handlers
// so the on('finish') listener is attached before the response is written)
app.use(auditMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/auth/2fa", twoFactorRouter);
app.use("/api/webhooks", webhookRouter);
app.post("/api/webhooks/events", eventsWebhookController.handleEventsWebhook);
app.get("/api/csrf-token", (req: Request, res: Response) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
});
app.get("/health", async (req: Request, res: Response) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(
    () => true,
    () => false,
  );
  if (!dbOk) {
    res
      .status(503)
      .json({ status: "degraded", timestamp: new Date().toISOString() });
    return;
  }
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Public maintenance status (no auth) ──
// Returns maintenance status without auth — used by the web middleware to
// decide whether to show a maintenance page to unauthenticated visitors.
const MAINTENANCE_KEY = "maintenance_mode";
app.get("/api/maintenance-status", async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: MAINTENANCE_KEY },
    });
    if (setting) {
      const parsed = JSON.parse(setting.value);
      return res.json({
        enabled: !!parsed.enabled,
        message: parsed.message || "",
      });
    }
    return res.json({ enabled: false, message: "" });
  } catch {
    return res.json({ enabled: false, message: "" });
  }
});

// ── Public routes (no auth) ──
app.use("/api/public/branding", publicBrandingRouter);
app.use("/api/pages", publicStaticPagesRouter);
app.use("/api/interns", internRouter);

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
app.use("/api/admin/packages", packageRouter);
app.use("/api/admin/package-enrollments", packageEnrollmentRouter);
app.use("/api/packages", publicPackageRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/admin/dashboard", dashboardRouter);
app.use("/api/messages", messageRouter);
app.use("/api/support", supportRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/notes", noteRouter);
app.use("/api/onboarding", onboardingRouter);

// ── Instructor routes ──
app.use("/api/instructor", instructorRouter);
app.use("/api/instructor", profileRouter);

// ── Super Admin routes ──
app.use("/api/admin/users", adminHealthRouter);
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

// ── Admin feature routes ──
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/tags", tagsRouter);
app.use("/api/admin/content", contentRouter);
app.use("/api/admin/certificates", adminCertificatesRouter);
app.use("/api/admin/certificate-templates", certificateTemplateRouter);
app.use("/api/admin/static-pages", staticPagesRouter);
app.use("/api/admin/email-templates", emailTemplatesRouter);
app.use("/api/admin/audit-logs", auditLogsRouter);
app.use("/api/admin/announcements", announcementsRouter);

// ── Bulk operations, branding, i18n, cache ──
app.use("/api/admin/users", bulkUsersRouter);
app.use("/api/admin/branding", brandingRouter);
app.use("/api/admin/i18n", i18nRouter);
app.use("/api/admin/cache", cacheRouter);

// ── YouTube API (authenticated) ──
app.use("/api/youtube", youtubeRouter);
app.use("/api/admin/ai", aiRouter);

// ── Payments & Coupons ──
app.use("/api/coupons", couponRouter);
app.use("/api/referrals", referralRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin/payments", adminPaymentRouter);

// ── Internship ──
app.use("/api/admin/interns", adminInternRouter);

// ── Maintenance (kill switch) ──
app.use("/api/admin/maintenance", maintenanceRouter);

// ── Refunds ──
app.use("/api/admin/refunds", refundsRouter);

// ── Assignment Review Queue ──
app.use("/api/admin/assignments/review", assignmentReviewRouter);

// ── Instructor Management ──
app.use("/api/admin/instructors", instructorsRouter);

// ── Database Backup / Restore ──
app.use("/api/admin/backup", backupRouter);

// ── Admin Session Management (kill / terminate) ──
app.use("/api/admin/sessions", sessionsRouter);

// ── Version (public + super admin details) ──
app.use("/api/version", versionRouter);

// ── Alerting Webhooks ──
app.use("/api/admin/alerting-webhooks", alertingWebhooksRouter);

import { AppError } from "./utils/errors";

// Sentry error handler (must come before generic error handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const statusCode =
    err instanceof AppError
      ? err.statusCode
      : (err as any)?.statusCode || (err as any)?.status || 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";
  if (statusCode >= 500) {
    req.log?.error?.(err, message);
  }
  res.status(statusCode).json({ error: message });
});

export { app };
