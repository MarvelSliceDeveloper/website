/**
 * Audit logging utilities.
 *
 * Two approaches provided:
 * 1. `logAudit()` — explicit helper for manual use inside route handlers.
 * 2. `auditMiddleware` — auto-captures POST/PUT/PATCH/DELETE on /api/admin/* routes.
 */
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./prisma";

/** HTTP method → audit action label */
const METHOD_ACTION: Record<string, string> = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

/** URL segment → human-readable entity type */
const SEGMENT_ENTITY: Record<string, string> = {
  courses: "Course",
  modules: "Module",
  lessons: "Lesson",
  quizzes: "Quiz",
  assignments: "Assignment",
  batches: "Batch",
  sessions: "Session",
  users: "User",
  enrollments: "Enrollment",
  packages: "Package",
  "package-enrollments": "PackageEnrollment",
  settings: "Setting",
  categories: "Category",
  tags: "Tag",
  announcements: "Announcement",
  certificates: "Certificate",
  "certificate-templates": "CertificateTemplate",
  "quiz-templates": "QuizTemplate",
  "assignment-templates": "AssignmentTemplate",
  "static-pages": "StaticPage",
  "email-templates": "EmailTemplate",
  branding: "Branding",
  i18n: "I18n",
  cache: "Cache",
  logs: "Log",
  trash: "Trash",
  payments: "Payment",
  permissions: "Permission",
  "api-keys": "ApiKey",
  coupons: "Coupon",
  recordings: "Recording",
  messages: "Message",
  notifications: "Notification",
  tickets: "Ticket",
  mentorship: "Mentorship",
};

/**
 * Resolve an entity type string from a URL path.
 * e.g. "/api/admin/courses/abc123/modules" → "Module"
 */
function resolveEntityType(urlPath: string): string {
  const segments = urlPath.split("/").filter(Boolean);
  const adminIdx = segments.indexOf("admin");
  // Walk backwards from the last segment to find a known entity
  for (let i = segments.length - 1; i > (adminIdx >= 0 ? adminIdx : 0); i--) {
    const mapped = SEGMENT_ENTITY[segments[i]];
    if (mapped) return mapped;
  }
  return "Unknown";
}

/**
 * Extract the entity ID from request params or body.
 * Prefers `req.params.id` (detail routes) over `req.body.id`.
 */
function resolveEntityId(req: Request): string | null {
  const paramId = (req.params as Record<string, string | undefined>).id;
  if (paramId) return paramId;
  if (req.body && typeof req.body === "object" && typeof req.body.id === "string") {
    return req.body.id;
  }
  return null;
}

/**
 * Manual audit log helper — call explicitly in route handlers when you need
 * fine-grained control over the logged details.
 */
export async function logAudit(opts: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        details: opts.details ?? undefined,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch {
    // Silent fail — audit logging must never break the app
  }
}

/**
 * Express middleware that auto-logs all mutations (POST/PUT/PATCH/DELETE)
 * on /api/admin/* routes to the AuditLog table.
 *
 * Runs AFTER the route handler by hooking into `res.on('finish')`, so
 * it only logs successful (2xx) responses.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const action = METHOD_ACTION[req.method];
  if (!action) return next(); // GET/HEAD/OPTIONS — skip

  // Only intercept admin routes
  if (!req.path.startsWith("/api/admin/")) return next();
  // Don't log audit-log reads/creates themselves
  if (req.path.startsWith("/api/admin/audit-logs")) return next();

  // Fire after the response is fully written
  res.on("finish", async () => {
    // Only log successful mutations
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    try {
      // req.user is set by requireAuth which runs inside each router
      const user = (req as unknown as Record<string, unknown>).user as
        | { userId?: string; role?: string }
        | undefined;
      if (!user?.userId) return;

      const entityType = resolveEntityType(req.path);
      const entityId = resolveEntityId(req);

      let details: Record<string, unknown> | undefined;
      if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
        details = {
          fields: Object.keys(req.body),
          method: req.method,
          path: req.path,
        };
      }

      const forwarded = req.headers["x-forwarded-for"];
      const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : null) || req.ip || null;

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action,
          entityType,
          entityId,
          details,
          ipAddress: ip,
          userAgent: (req.headers["user-agent"] as string) || null,
        },
      });
    } catch {
      // Silent fail
    }
  });

  next();
}
