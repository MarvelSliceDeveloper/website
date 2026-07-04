# Code Quality Issues — Audit Report

**Date:** 2026-07-04
**Scope:** `apps/api/src`

---

## P0 — Critical

### 1. Error silently swallowed — events-webhook controller

- **File:** `apps/api/src/modules/sessions/events-webhook.controller.ts:263-269`
- **Issue:** `calendarEvent.delete()` failure is swallowed with `.catch(() => {})` — no logging on DB errors.

### 2. IDOR in session attendance — no authorization check

- **File:** `apps/api/src/modules/attendance/attendance.controller.ts:34-49`
- **Issue:** `getSessionAttendance` (GET `/api/attendance/:sessionId`) does not verify instructor owns the batch/session.

### 3. IDOR in course content — missing batch enrollment filter

- **File:** `apps/api/src/modules/courses/student-course.routes.ts:193-369`
- **Issue:** Student enrolled in batch A of a course can see sessions from batch B via `GET /api/courses/:courseId/content`.

### 4. Missing `$transaction` — Session creation

- **File:** `apps/api/src/modules/sessions/session.service.ts:122-149`, `393-416`
- **Issue:** `createSession()` / `createSessionFromTeams()` creates LiveSession then CalendarEvent in separate writes. Calendar failure orphans the session.

### 5. Missing `$transaction` — Lesson/Module delete + reorder

- **File:** `apps/api/src/modules/courses/lesson.service.ts:94-109` / `module.service.ts:62-83`
- **Issue:** Deletes lesson/module then reorders remaining items in separate writes. Failure mid-reorder leaves stale order values.

### 6. Missing `$transaction` — Lesson/Module reorder

- **File:** `apps/api/src/modules/courses/lesson.service.ts:112-129` / `module.service.ts:87-112`
- **Issue:** Parallel `Promise.all` updates with no transaction. Partial failure corrupts ordering.

---

## P1 — High

### 7. `console.*` used instead of pino logger throughout codebase

- **Files:** All controllers + services use `console.log/error/warn`. Pino logger initialized in `app.ts` and `index.ts` but never passed to modules.

### 8. Missing Zod validation — admin user creation

- **File:** `apps/api/src/modules/users/user.routes.ts:37-81`
- **Issue:** `role as UserRole` cast without schema validation.

### 9. Missing Zod validation — multiple endpoints

- **Files:** `auth.controller.ts`, `notes.controller.ts`, `message.controller.ts`, `notification.controller.ts`
- **Issue:** Manual field checks instead of Zod schemas.

### 10. IDOR in assignment submission — stale instructor check

- **File:** `apps/api/src/modules/assignments/assignment.service.ts:404-460`
- **Issue:** Instructor ownership checked against current batch instructorId, not instructor at time of creation.

### 11. Auth routes exempt from CSRF

- **File:** `apps/api/src/app.ts:88-101`
- **Issue:** `/api/auth/*` fully exempt from CSRF. Registration endpoint (if enabled) is unprotected.

### 12. Unvalidated redirect URI in OAuth callback

- **File:** `apps/api/src/modules/auth/auth.controller.ts:278`
- **Issue:** Redirect uses `WEB_URL` fallback to localhost; open redirect if `WEB_URL` is user-controllable.

### 13. Graph subscription hardcoded fallback clientState

- **File:** `apps/api/src/modules/graph/graph.subscriptions.ts:28`
- **Issue:** `clientState || "secretClientValue"` — weak webhook security.

### 14. Missing `$transaction` — batch addStudents

- **File:** `apps/api/src/modules/batches/batch.service.ts:183-225`
- **Issue:** Iterates over userIds with `Promise.allSettled` — no transaction. Race conditions on capacity.

### 15. Missing `$transaction` — enrollment approve/reject + notification

- **File:** `apps/api/src/modules/enrollments/enrollment.routes.ts:112-134`
- **Issue:** Approval writes DB, creates notification, dispatches email — no transaction. Notification failure leaves student uninformed.

### 16. Catch handlers swallow errors with return null/0

- **File:** `apps/api/src/modules/messages/message.service.ts:111-113`
- **Issue:** `catch { return 0; }` — no logging.

---

## P2 — Medium

### 17-18. Dead code / Unused exports

- **Files:** `modules/courses/modules.upload.ts:72` (`uploadModuleResource`), `modules/graph/graph.recordings.ts:3-53` (`CallRecord`, `RecordingSession`, `getCallRecords`, `getCallRecordSessions`)

### 19. `as any` type casts throughout codebase

- **Files:** `auth.service.ts`, `ticket.controller.ts`, `events-webhook.controller.ts`, `lesson.service.ts`, `session.service.ts`, `graph.client.ts`, `support.routes.ts`, `mentorship.routes.ts`

### 20. Path traversal risk in resource deletion

- **File:** `apps/api/src/modules/courses/lesson.service.ts:172-177`
- **Issue:** Resource URL parsed with regex and joined to uploads path — `../` sequences could delete files outside uploads.

### 21. CSRF sameSite + proxy issue

- **File:** `apps/api/src/app.ts:65,72`
- **Issue:** CSRF secret derived from `req.ip`; behind proxy without `trust proxy`, all users share same IP `::1`.

### 22. Rate limiter without proxy trust

- **File:** `apps/api/src/app.ts:82-86`
- **Issue:** `express-rate-limit` uses `req.ip` by default; all requests behind proxy share same IP.

### 23. Unhandled promise rejections — notification async calls

- **Files:** `ticket.controller.ts:37,131,151,167,181,216,239`, `assignment.service.ts:367,471`
- **Issue:** Fire-and-forget `notificationService.*` calls without `.catch()` handlers.

### 24. Path traversal in multer storage

- **File:** `apps/api/src/modules/courses/modules.upload.ts:48-54,90-96`
- **Issue:** `req.params.courseId` / `moduleId` used in `path.join()` without sanitization.

### 25. `handleError` in ticket controller uses console.error

- **File:** `apps/api/src/modules/tickets/ticket.controller.ts:15-26`

### 26. Index.ts startup logging uses console.debug

- **File:** `apps/api/src/index.ts:9,14,20`

---

## P3 — Low

### 27. Graceful shutdown timeout too short + wrong exit code

- **File:** `apps/api/src/index.ts:47` — 10s timeout, exit code `1` even on clean shutdown.

### 28. Unused `next` parameter in error handler

- **File:** `apps/api/src/app.ts:125`

### 29. JWT expiry cast as `any`

- **File:** `apps/api/src/modules/auth/auth.service.ts:92,95`

### 30. Calendar events not filtered by user

- **File:** `apps/api/src/modules/calendar/calendar.service.ts:109-170`
- **Issue:** `getEventsForUser()` returns ALL events in date range, not user-specific.

### 31. Misleading argument name in getMsUserProfile

- **File:** `apps/api/src/modules/auth/auth.controller.ts:264`

### 32. Excessive comment banners

- **Files:** `app.ts`, `assignment.upload.ts`, `batch.service.ts`

### 33. Magic number 90 in completion threshold

- **File:** `apps/api/src/modules/recordings/recording.service.ts:217`

### 34. Inconsistent URL param naming

- **File:** `apps/api/src/modules/courses/course.routes.ts:141-163` — mixed `:id` and `:moduleId`.

---

## P4 — Info

### 35. No correlation ID / request tracing

- **Observation:** Pino logger instantiated at module level; no request-scoped logger with correlation IDs.

### 36. Test helper hardcodes seed credentials

- **File:** `apps/api/src/__tests__/helpers.ts:5-7`

### 37. Controller catch blocks leak internal error messages

- **Observation:** Many controllers return `(error as Error).message` directly to client.
