# Changelog

## 2026-08-07 - Student Portal Performance Optimization

### Backend API
- `GET /api/student/summary` slimmed to a **lightweight core** (enrolled, sessions, calendar, tickets, cheap certificate count). Heavy sections (overdue, results, continue-learning) are no longer added; they have their own endpoints and load progressively on the client.
- `getDashboardSummary` is single-flight cached per-user (`student-summary:${userId}`, 15s TTL).
- `GET /api/courses/:courseId` (new `getCourseDetail`) — on-demand single-course detail for COURSE_DETAIL; replaces pre-loading the full catalogue.
- `getOverdueAssignments` capped at 50 items per batch; `getContinueLearning` now filters to lessons/sessions the user has started (`progress: some`), cutting the nested payload.
- New composite indexes: `QuizAttempt(userId,status)`, `Quiz(moduleId,dueDate)`, `Assignment(batchId,dueDate)`, `AssignmentSubmission(studentId,status)`, `EnrollmentRequest(userId,status)`, `PackageEnrollment(userId,status)`.

### Frontend
- `student/page.tsx` — core summary loads first, heavy sections fetched in parallel from their own endpoints (progressive rendering).
- Removed eager `catalogue` + `certificates` pre-fetch from the summary path.
- COURSE_DETAIL fetches `GET /api/courses/:courseId` on demand into a `courseDetailCache`.
- `CertificatesView` self-fetches `GET /api/certificates` on mount with a loading skeleton — the heavy completion map is off the initial load path.

### Cleanup
- Removed the unused `recommended` widget (backend `getRecommendedCourses` + summary field + frontend type).
- Removed the unused `certificate?: any` response field in `CertificatesView` (also clears a lint error).
- Removed the ~100-line legacy fallback block in `fetchPortalData` — summary failure now yields an empty core + the existing `failedSections` warning banner.

## 2026-08-02 — Vitest Security Patch (CVE-2026-47429)

### Dependencies
- Upgraded `vitest` `^2.1.0` → `^3.2.6` (resolved `3.2.7`) in `apps/api` to fix **CVE-2026-47429** (GHSA-5xrq-8626-4rwp, CVSS 9.8). On Windows, the Vitest UI/API server misused `isFileServingAllowed` for `/__vitest_attachment__`, allowing `\\?\..\` path traversal to read files outside the project; the exposed write/rerun API features (`saveTestFile`, `rerun`) could execute arbitrary scripts. Fixed in vitest `>= 3.2.6` (and `>= 4.1.0`). `@vitest/ui` was not installed, so the UI server surface was absent, but the dependency was still flagged.
- Full API suite re-run after the major-version bump: 291/292 passing (only the pre-existing quiz-submission message mismatch failure remains).

## 2026-08-02 — Scaling Hardening & Architectural Cleanup

### Backend API
- `apps/api/src/utils/prisma.ts` — Prisma pool size is now env-driven (`DATABASE_CONNECTION_LIMIT`, default 10). Default kept below the Supabase session-mode pooler cap (15). `.env.example` updated.
- `apps/api/src/utils/single-flight-cache.ts` (new) — zero-dep single-flight (promise memoization) on top of `memory-cache`. `GET /api/courses/:courseId/content` now collapses concurrent cache-miss requests into a single DB fetch (30s TTL).
- `apps/api/src/app.ts` — `app.set("trust proxy", 1)` in production so the global rate limiter sees real client IPs behind nginx (no false 429s); `/health` now probes Postgres with `SELECT 1` (returns 503 when the DB is down).
- `apps/api/src/middleware/rate-limits.ts` (new) — per-endpoint `authLimiter` (50/15min/IP, disabled under `NODE_ENV=test`), wired into `/login`, `/register`, `/forgot-password`, `/reset-password`.
- `apps/api/src/index.ts` — background jobs (`recordingSyncJob`, `reconcileAttendanceJob`) gated behind `ENABLE_BACKGROUND_JOBS` (default true) so worker-only instances can opt out of duplicate execution.
- `apps/api/src/modules/courses/student-course.service.ts` (new) — extracted `getEnrolledCourses`, `getCatalogue`, `loadCourseContent`, `requestEnrollment` from the route layer. `student-course.routes.ts` went from 979 → 331 lines of thin handlers using `handleControllerError`.

### Frontend
- `apps/web/src/lib/api.ts` — CSRF refresh deduped with `csrfRefreshing` flag so a burst of 403s triggers a single `/api/csrf-token` fetch.
- `apps/web/src/app/student/page.tsx` — `fetchPortalData` now tracks per-endpoint failures (`failedSections`); partial failures show a dismissible warning banner instead of being silently masked.

### Shared Package (`packages/config`, new)
- `@lms/config` — shared Zod schemas + inferred types for auth: `RegisterSchema`, `LoginSchema`, `ChangePasswordSchema`, `SetPasswordSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`, `passwordSchema`, `emailSchema` (+ `LoginInput`/`RegisterInput`/etc. types).
- API validates all auth request bodies from these schemas (`auth.controller.ts`, `auth.service.ts`).
- Web consumes the same types (`LoginInput` on `/login`, `SetPasswordInput` on `/set-password`) so frontend/backend types can't drift.

### Tests
- All auth suites pass with shared schemas: `auth.test.ts`, `auth-extended.test.ts`, `schemas/auth.schema.test.ts`, `notes.test.ts` (48 tests).

## 2026-07-31 — Live Session Analytics

### Database (Schema)
- **Attendance**: Added `rejoinCount` (Int @default(0)), `lastSeenAt` (DateTime?), `qualified` (Boolean @default(false))

### Backend API
- `apps/api/src/services/presence.service.ts` (new) — in-memory presence store (`markPresent`, `liveCount`); Redis presence store deferred (no new deps)
- `apps/api/src/modules/attendance/attendance.service.ts` — join reopens left records + increments `rejoinCount`; leave computes full-window `durationSeconds` + `qualified` (≥50% of session duration); new `heartbeat`, `getSessionStats` (uniqueAttendees, liveNow, peakConcurrent, avgDurationSeconds, qualifiedCount, lateJoins, earlyLeaves, attendanceRate, totalWatchMinutes), `listForSession`
- `apps/api/src/modules/attendance/attendance.routes.ts` — `POST /:sessionId/heartbeat`, `GET /:sessionId/stats`, `GET /:sessionId` (ADMIN/INSTRUCTOR)
- `apps/api/src/jobs/reconcile-attendance.job.ts` (new) — auto-closes open attendance for ended sessions (grace 30 min); started in `index.ts`
- `apps/api/src/modules/sessions/session.service.ts` — `listSessions` returns per-session `_count.attendance` + `attendance._avg.durationSeconds` (via `groupBy` aggregate — Prisma v5 lacks relation-level `_avg` in `include`)
- `apps/api/src/modules/admin/assignments/review.routes.ts` — **bug fix**: `fileUrl` mapped from `answerFileUrl` (was `item.fileUrl`, which doesn't exist on the Prisma result — review page always got `undefined`)

### Frontend
- `apps/web/src/hooks/use-live-session-presence.ts` (new) — 45s heartbeat while in a live session, auto-stops on unmount, fire-and-forget; wired into `LiveSessionsView`, `HomeView`, `CourseContentView`, `BatchDetailView`
- `apps/web/src/app/admin/sessions/page.tsx` — Attendees + Avg Duration columns
- `apps/web/src/app/admin/sessions/[sessionId]/page.tsx` — stats tiles (unique attendees, live now, peak concurrent, avg duration, attendance rate, qualified count) + attendance table with qualified badge / rejoin count

### Tests
- `apps/api/src/__tests__/services/attendance.service.test.ts` (new) — 15 tests: join (404/403/idempotent/reopen + rejoinCount), leave (400/qualified thresholds/endedAt), heartbeat, stats aggregation, list ordering. All passing.

### Docs
- `docs/plan-to-work/live-session-analytics.md` → `docs/plan-completed/live-session-analytics.md`

## 2026-07-31 — Super Admin Dashboard: Flat Square Cards & Stat Card Consistency

### Frontend
- `apps/web/src/app/admin/dashboard/page.tsx` — User Distribution cards converted from `rounded-2xl` gradient boxes to flat square cards (role-colored icon + value retained)
- System Stats cards (System Status, API Keys, Activity Logs, Failed Logs, Pending Instructors, Trash) replaced `StatCard` with the inline flat square pattern used by the Admin dashboard
- "Activity Logs (30d)" no longer renders teal (`purple` variant mapped to accent colors in `StatCard`) — all superadmin stat cards are now uniform
- Removed unused `StatCard` import

### Docs
- `docs/plan-completed/superadmin-dashboard-squares.md`

## 2026-07-31 — Login History: User Name Display & Logout Timestamp

### Backend API
- `apps/api/src/modules/logs/login-history.routes.ts` — `GET /api/admin/login-history` now includes the `user` relation (id, name, email) so names are returned instead of bare user IDs
- `apps/api/src/modules/auth/auth.routes.ts` — `POST /api/auth/logout` now requires `requireAuth` middleware so the user identity is available
- `apps/api/src/modules/auth/auth.controller.ts` — logout handler stamps `logoutAt` on the user's open `LoginLog` records before clearing the cookie

### Frontend
- `apps/web/src/app/admin/users/login-history/page.tsx` — "User ID" column replaced with "User" showing name + email; `LoginEntry` type extended with `user` object

### Docs
- `docs/plan-completed/login-history-user-name-logout.md`

## 2026-07-29 — Admin Security, Maintenance, GDPR, Backup & Alerting Features

### Database (Schema)
- **User**: Added `twoFactorEnabled` (Boolean @default(false))
- **AdminSession** (new): Tracks admin login sessions — id, userId, tokenPrefix, ip, userAgent, deviceInfo, lastActiveAt, expiresAt, active
- **NotificationWebhook** (new): Webhook endpoints for system alerts — name, url, events (JSON), active, lastFiredAt

### Session Security
- `apps/api/src/modules/auth/auth.service.ts` — `generateTokens()` now async; creates `AdminSession` for ADMIN/SUPER_ADMIN users and includes `sessionId` in JWT payload
- `apps/api/src/modules/auth/auth.controller.ts` — login, password change, set password handlers pass `req.ip` + `user-agent` to `generateTokens()`
- `apps/api/src/middleware/auth.middleware.ts` — `requireAuth` now async (line 123); checks `AdminSession.active` for admin users on every request; periodic `lastActiveAt` update
- `apps/api/src/modules/payments/payment.service.ts` — both `generateTokens()` calls now `await`ed
- `apps/api/src/modules/admin/sessions/sessions.routes.ts` — `GET /`, `GET /all`, `POST /:id/kill`, `POST /kill-all` for session management

### Maintenance Mode
- `apps/api/src/middleware/maintenance.middleware.ts` — 15-second cache; blocks non-admin routes when `maintenance_mode` setting is enabled; skips admin routes, auth, webhooks, health
- `apps/api/src/modules/admin/maintenance/maintenance.routes.ts` — `GET /` (status), `PUT /` (toggle)
- Registered in `app.ts` before all other routes

### GDPR Compliance
- `apps/api/src/modules/admin/gdpr/gdpr.routes.ts` — `GET /export/:userId` (exports user data: profile, enrollments, certificates, quiz attempts, submissions, notifications); `POST /anonymize/:userId` (destructive — blanks name/email, clears auth, suspends)
- `apps/web/src/app/admin/gdpr/page.tsx` — search users, export as JSON preview, anonymize with warning

### Backup & Restore
- `apps/api/src/modules/admin/backup/backup.routes.ts` — `POST /` (pg_dump), `GET /list`, `GET /download/:filename`, `POST /restore` (pg_restore via file upload), `DELETE /:filename`
- `apps/web/src/app/admin/settings/backup/page.tsx` — create/restore/delete backups, file picker for restore

### Alerting Webhooks
- `apps/api/src/modules/admin/webhooks/alerting-webhooks.routes.ts` — Full CRUD + `POST /:id/test` for NotificationWebhook
- `apps/api/src/services/alerting.service.ts` — `fire(event, payload)` dispatches to all matching active webhooks
- `apps/web/src/app/admin/settings/webhooks/page.tsx` — create/edit/test/delete webhooks with event checkboxes

### UI/Sidebar Updates
- `apps/web/src/components/AdminSidebar.tsx` — Added "Backup & Restore" and "Alerting Webhooks" under Settings → System; added "Compliance" section with GDPR; imported `IconShield`

### Tests (20 new tests, all passing)
- `apps/api/src/__tests__/features/session-security.test.ts` — 4 tests: AdminSession creation for ADMIN/SUPER_ADMIN, skipped for STUDENT, sessionTimeoutMin in JWT
- `apps/api/src/__tests__/features/maintenance.test.ts` — 4 tests: blocks non-admin, allows through when off, allows admin routes, blocks health
- `apps/api/src/__tests__/features/admin-features.test.ts` — 12 tests: route registration for GDPR (2), Backup (5), Alerting Webhooks (5)

### Other
- `apps/api/src/app.ts` — mounted `/api/admin/gdpr`, `/api/admin/backup`, `/api/admin/alerting-webhooks` routes
- All route mounts use `requireAuth` + `requireRole([ADMIN, SUPER_ADMIN])` (backup uses `requireSuperAdmin`)
- Docs: `docs/plan-to-work/admin-gdpr-backup-alerting.md` → `docs/plan-completed/`

Implemented a complete system for customizable due dates, late submission penalties, batch-level extensions, and course mentor assignment per batch.

### Database (Schema)
- **Batch**: Added `defaultDaysToComplete` (Int?), `lateSubmissionPenaltyPercent` (Int @default(25))
- **Assignment**: Added `daysFromEnrollment` (Int?), `allowLateSubmission` (Boolean), `lateSubmissionPenaltyPercent` (Int?), `lateSubmissionGracePeriodHrs` (Int?)
- **Quiz**: Added same fields as Assignment
- **AssignmentSubmission**: Added `isLate` (Boolean), `latePenaltyPercent` (Int?), `latePenaltyAmount` (Int?), `originalScore` (Int?)
- **QuizAttempt**: Added `submittedAt` (DateTime?), `isLate` (Boolean), `latePenaltyPercent` (Int?), `latePenaltyAmount` (Int?), `originalPercentage` (Float?)
- **BatchAssignmentExtension** (new): Batch-level extension for an assignment/quiz — applies to ALL students
- **BatchCourseMentor** (new): Assigns an instructor as course mentor within a batch

### Backend API
- `apps/api/src/services/due-date.service.ts` — Due date calculator (relative/absolute), late penalty calculator, enrollment date lookup
- Batch create/update schemas accept `defaultDaysToComplete`, `lateSubmissionPenaltyPercent`
- Assignment/Quiz create/update schemas accept `daysFromEnrollment`, `allowLateSubmission`, `lateSubmissionPenaltyPercent`, `lateSubmissionGracePeriodHrs`
- `POST/GET/DELETE /api/admin/batches/:batchId/extensions` — Batch-level extension CRUD
- `POST/GET/DELETE /api/admin/batches/:batchId/mentors` — Course mentor assignment CRUD

### Frontend
- Batch create form: "Default Days to Complete" + "Late Submission Penalty %" fields
- Course builder: "Absolute Date" / "Days from Enrollment" toggle on AddAssignmentForm, AddQuizForm, AssignmentCard, QuizCard
- Late submission toggle with penalty % and grace period hours on all assignment/quiz forms
- Batch detail page: "Extensions" tab (grant/revoke batch-level deadline extensions) + "Mentors" tab (assign course mentors)
- Updated Quiz type in types.ts to include `dueDate`, `daysFromEnrollment`, late submission fields

### Seed Data
- Default batch (`batch-datascience`) has `defaultDaysToComplete: 30`, `lateSubmissionPenaltyPercent: 25`
- First python assignment uses `daysFromEnrollment: 14`, `allowLateSubmission: true`
- First python quiz uses `daysFromEnrollment: 14`, `allowLateSubmission: true`

## 2026-07-24 — UI/UX Design System Components

Implemented 15 missing UI components to achieve 92% design system compliance.

### Bug Fix
- **DataTable**: Fixed `rounded-none` → `rounded-xl` on all table containers to match design spec.

### New Components (`apps/web/src/components/ui/`)
- **Modal** — Generic dialog with overlay, close, escape handling, body scroll lock, zoom animation
- **Tabs** — Tab navigation with animated underline indicator and count badges
- **SearchInput** — Search field with icon, debounced onChange, and clear button
- **FilterDropdown** — Multi-select filter with checkboxes, active count, clear all
- **Breadcrumb** — Navigation breadcrumb with chevron separators
- **Tooltip** — Hover tooltip with configurable position
- **Avatar** — Image support with fallback to color-coded initials
- **Switch** — Toggle switch with label and accessibility
- **Checkbox** — Checkbox with label and hidden native input
- **RadioGroup** — Radio group with horizontal/vertical layout
- **DatePicker** — Calendar date picker with month navigation
- **FileUpload** — Drag-and-drop file upload with preview and remove

### New Component (`apps/web/src/components/shared/`)
- **ErrorState** — Error display with icon, title, message, and retry action

### Verification
- TypeScript: Zero new errors
- Lint: Zero new errors
- All components use existing design tokens and patterns

## 2026-07-23 — Performance Optimization (All Tiers)

### Tier 1: Database & API (High Impact)

**Missing FK indexes added** — Added `@@index(...)` annotations to 15+ model fields:

- `Module.courseId`, `Lesson.moduleId`, `Practical.moduleId`
- `Quiz.moduleId`, `Question.quizId`, `QuizAttempt.quizId`, `QuizAttempt.userId`
- `Assignment.courseId`, `Assignment.batchId`, `Assignment.moduleId`
- `EnrollmentRequest.courseId`, `EnrollmentRequest.batchId`
- `LiveSession.batchId`, `LiveSession.courseId`, `LiveSession.moduleId`
- `Batch.courseId`, `PackageEnrollmentCourse.*`
- `Progress.userId`, `Progress.recordingId`

**Over-fetching reduced in `GET /api/courses/:courseId/content`**:

- Replaced bare `include` with explicit `select` on Course, Module, Lesson, Quiz, Assignment, Practical
- Quiz questions no longer loaded just for counting — uses `_count: { select: { questions: true } }` instead
- Eliminated transfer of unused fields (`slug`, `coverImageUrl`, `tags`, `deletedAt`, etc.)

**N+1 fixed in `certificate-completion.service.ts`**: Replaced per-module loop (5N queries) with batch queries (5 total). 10-module course: 51→5 queries.

**N+1 fixed in `student.service.ts` `getContinueLearning()`**: Replaced per-batch `findUnique` loop with single `batch.findMany`.

### Tier 2: Frontend Bundles & Rendering

**Code splitting via `next/dynamic`** in `CourseContentView.tsx`:

- `QuizContent`, `AssignmentContent`, `StudyMaterialContent`, `StickyNoteWidget` now lazy-loaded with `ssr: false`
- Reduces initial JS bundle by ~150KB (Tiptap/RichEditor + Plyr CSS + quiz logic)

**In-memory response caching** for `GET /api/courses/:courseId/content`:

- Created `apps/api/src/utils/memory-cache.ts` — Map-based cache with 30s TTL, auto-eviction at 500 entries
- Cached per `courseId:userId`, serves from memory on repeat requests within TTL window

### Tier 3: Background Optimizations

**Notification polling pauses on tab hidden** (`StudentPortalShell.tsx`):

- Listens to `visibilitychange`, clears interval when tab hidden, restarts on return
- Reduces background network requests

**Files modified:** `schema.prisma`, `student-course.routes.ts`, `certificate-completion.service.ts`, `student.service.ts`, `CourseContentView.tsx`, `StudentPortalShell.tsx`, `memory-cache.ts` (new)

## 2026-07-23 — Error Handling Refactor, Pagination, SEO, & Certification System

### Phase 1: Error Handling (Critical)

- Created `apps/api/src/utils/errors.ts` — `AppError` class, `getErrorMessage`, `handleControllerError`
- Unified error handler in `app.ts` — uses pino per-request logger
- Refactored 30+ controllers from `catch(error: any)` → `catch(err: unknown)` + `handleControllerError`
- Zod errors now return `{ error: "field: message" }` instead of raw array

### Phase 2: Pagination

- Created `apps/api/src/utils/paginate.ts` — page=1, limit=20, max=100
- Added pagination to 15+ endpoints: users, batches, packages, payments, enrollments, tickets, assignments, notes, messages

### Phase 2b: Error/Loading Pages

- Created shared `ErrorPage.tsx` and `LoadingPage.tsx` components
- Added error.tsx + loading.tsx to 61 route segments across admin/student/instructor

### Phase 2c: SEO Page Titles

- Created `usePageTitle` hook in `@/lib/use-page-title`
- Added titles to 53 admin + 21 student/instructor/root pages

### Phase 3: Certification System

- Added `pdfTemplateType`, `pdfTemplateUrl`, `pdfTemplateFields` to `CertificateTemplate` model
- Added `autoIssued`, `uploadedTemplateId` to `Certificate` model
- Created `certificate-completion.service.ts` — checks quizzes + assignments + recordings for auto-issue
- Auto-issue triggers on quiz submit and assignment grade (configurable via `AUTO_CERTIFICATE` env var)
- Two PDF generation options: jsPDF generated vs uploaded PDF with placeholder overlay (studentName, courseName, date, certificateNumber)
- Upload endpoint: `POST /api/admin/certificate-templates/:id/upload-pdf`
- Updated student certificates page — auto-displayed, removed manual claim flow
- Updated admin template editor — PDF upload with placeholder field editor

### Files created:

- `apps/api/src/utils/errors.ts`, `apps/api/src/utils/paginate.ts`
- `apps/api/src/modules/certificates/certificate-completion.service.ts`
- `apps/web/src/components/ErrorPage.tsx`, `LoadingPage.tsx`
- `apps/web/src/lib/use-page-title.ts`
- 65+ error.tsx/loading.tsx files across route segments

### Files modified:

- `apps/api/src/modules/admin/certificates/template.routes.ts` — added PDF upload endpoints
- `apps/api/src/modules/certificates/certificate.service.ts` — two PDF rendering methods
- `apps/api/src/modules/courses/student-course.routes.ts` — auto-issue on quiz submit
- `apps/api/src/modules/assignments/assignment.controller.ts` — auto-issue on grade
- `apps/web/src/app/student/certificates/page.tsx` — auto-display, no claim
- `apps/web/src/app/admin/certificates/page.tsx` — PDF upload + placeholder editor
- `apps/web/src/lib/api-types.ts` — updated Certificate types
- `apps/api/prisma/schema.prisma` — new model fields

---

## 2026-07-21 — Shell Layout Fix, Unit Tests, and Code Documentation

### UI Fix

- **StudentPortalShell header reorder**: Moved logo before the "Previous" back button. Layout is now: Logo → Back Button → Breadcrumbs → Right controls.

### Unit Tests (145 new tests across 13 test files)

**Phase 1 — Pure function unit tests (105 tests):**

- `utils/video.test.ts` — `parseVideoUrl()` YouTube/Vimeo/Loom URL parsing (10 tests)
- `utils/encryption.test.ts` — `encryptToken()`/`decryptToken()` roundtrip, tamper detection, error handling (8 tests)
- `services/youtube.service.test.ts` — `extractVideoId()` + `parseISO8601Duration()` (16 tests)
- `services/email.service.test.ts` — `getSubjectForType()` + `getTextForType()` for 15+ notification types (16 tests)
- `modules/course.service.test.ts` — `generateSlug()` edge cases (9 tests)
- `modules/auth.controller.test.ts` — `parseExpiryToMs()` days/hours/minutes parsing (7 tests)
- `modules/payment.service.test.ts` — `verifySignature()` HMAC + `generateDummyPassword()` constraints (6 tests)
- `modules/notification.service.test.ts` — `chunkArray()` batch splitting (7 tests)

**Phase 2 — Middleware tests (26 tests):**

- `middleware/auth.middleware.test.ts` — `requireAuth`, `optionalAuth`, `requireRole`, `requireSuperAdmin` (18 tests)
- `middleware/cache.middleware.test.ts` — `cacheMiddleware()` headers, ETag, 304, auth bypass (8 tests)

**Phase 3 — Zod schema validation tests (40 tests):**

- `schemas/auth.schema.test.ts` — `RegisterSchema`, `LoginSchema` (11 tests)
- `schemas/course.schema.test.ts` — `CreateCourseSchema`, `UpdateCourseSchema`, `CreateQuizSchema`, `UpdateQuizSchema` (16 tests)
- `schemas/batch.schema.test.ts` — `CreateBatchSchema`, `UpdateBatchSchema` (13 tests)

**Exported functions for testability:**

- `generateSlug` from `course.service.ts`
- `chunkArray` from `notification.service.ts`
- `parseExpiryToMs` from `auth.controller.ts`
- `extractVideoId`, `parseISO8601Duration` from `youtube.service.ts`
- `verifySignature`, `generateDummyPassword` from `payment.service.ts`

### Code Documentation

Added JSDoc and inline comments to 12 key backend files:

- `utils/video.ts`, `utils/encryption.ts`
- `services/youtube.service.ts`, `services/email.service.ts`
- `modules/auth/auth.controller.ts`, `modules/auth/auth.service.ts`
- `modules/courses/course.service.ts`
- `modules/payments/payment.service.ts`
- `modules/batches/batch.service.ts`
- `modules/notifications/notification.service.ts`
- `middleware/auth.middleware.ts`
- Frontend: `StudentPortalShell.tsx`, `student-portal.ts`

**Files modified:** 12 source files (exports + JSDoc), 1 frontend component (layout reorder)
**Files created:** 13 test files across `__tests__/utils/`, `__tests__/services/`, `__tests__/modules/`, `__tests__/middleware/`, `__tests__/schemas/`

---

## 2026-07-19 — 11 Platform Features Implementation

Implemented 11 features across backend API, database schema, and frontend admin UI:

**Phase 0: Database Schema Changes**

- Added `AuditLog` model with user, action, entityType, entityId, details, IP tracking
- Added `Category` model with name, slug, description, order, isActive
- Added `Tag` model with name, slug
- Added `CourseTag` join table for many-to-many Course-Tag relationship
- Enhanced `Certificate` model with certificateNumber, pdfUrl, status (ISSUED/CLAIMED/REVOKED), claimedAt
- Added `StaticPage` model for CMS pages
- Added `EmailTemplate` model for managing email templates
- Added `CertificateStatus` enum

**Feature #1: Health Page Enhancement**

- Enhanced `/admin/health` with YouTube API, Microsoft Azure AD, Razorpay, Email service checks
- Overall status indicator (Healthy/Degraded/Unhealthy)
- Server details: uptime, memory usage, last checked

**Feature #3: Bulk User Operations**

- `POST /api/admin/users/import` — CSV upload with multer, parses name/email/role, skips duplicates
- `POST /api/admin/users/bulk-role` — Bulk role change
- `POST /api/admin/users/bulk-email` — Bulk email placeholder
- Frontend: `/admin/users/import` — drag-drop CSV upload, preview, import results

**Feature #4: Email Template Management**

- `GET/PUT /api/admin/email-templates` — List/update email templates
- `POST /api/admin/email-templates/:id/preview` — Preview with variable substitution
- Frontend: `/admin/email-templates` — Template list with inline editor and HTML preview

**Feature #5: Payment/Revenue Dashboard**

- `GET /api/admin/payments` — List payments with user/package info
- `GET /api/admin/payments/revenue` — Revenue statistics
- Frontend: `/admin/payments` — Revenue stats cards, recent payments table

**Feature #6: Per-User Audit Trail**

- `GET /api/admin/audit-logs` — List with user/action/entity/date filters
- `GET /api/admin/audit-logs/user/:userId` — User-specific audit trail
- `POST /api/admin/audit-logs` — Create audit log entry
- Frontend: `/admin/audit-logs` — Filterable log viewer with expandable details

**Feature #8: Tag/Category Management**

- `GET/POST/PUT/DELETE /api/admin/categories` — CRUD with course counts
- `GET/POST/PUT/DELETE /api/admin/tags` — CRUD with course counts
- Frontend: `/admin/categories` and `/admin/tags` — CRUD tables with inline forms

**Feature #9: Certificate Management UI**

- `GET /api/admin/admin-certificates` — List with user/course info
- `GET /api/admin/admin-certificates/stats` — Certificate statistics
- `POST /api/admin/admin-certificates/:id/revoke` — Revoke certificate
- Frontend: `/admin/certificates` — Stats cards, paginated table, revoke action

**Feature #11: Cache Management**

- `GET /api/admin/cache/status` — Redis connection status
- `POST /api/admin/cache/flush` — Flush cache
- Frontend: `/admin/cache` — Status card, flush button

**Feature #14: Branding/Theme Customization**

- `GET/PUT /api/admin/branding` — Read/write branding config
- `POST /api/admin/branding/logo` and `/favicon` — File uploads
- Frontend: `/admin/branding` — Color pickers, logo/favicon upload, custom CSS

**Feature #17: i18n Management**

- `GET /api/admin/i18n/locales` — List locale files
- `GET/PUT /api/admin/i18n/:locale` — Read/write translations
- `POST /api/admin/i18n/create` — Create new locale
- Frontend: `/admin/i18n` — Locale list with progress bars, key-value editor

**Feature #25: CMS/Static Pages**

- `GET/POST/PUT/DELETE /api/admin/static-pages` — CRUD
- Frontend: `/admin/static-pages` — CRUD table with content editor

**Admin Sidebar Updates:**

- Super Admin: Added Content (Categories, Tags, Static Pages, Certificates), Audit Logs, System (Cache, Email Templates, Branding, i18n)
- Admin: Added Users sub-items (Import Users), Certificates, Payments

**Files created:**

- 6 backend API modules (categories, tags, certificates, static-pages, email-templates, audit-logs)
- 4 more backend modules (bulk users, branding, i18n, cache)
- 12 frontend admin pages
- Updated AdminSidebar.tsx with new navigation
- Updated Prisma schema with 7 new models

**Prisma schema pushed to database successfully.**

---

## 2026-07-19 — 4 New Admin Features (Bulk Users, Branding, i18n, Cache)

Added 4 new admin feature modules with backend routes and frontend pages:

**Bulk User Operations (Feature #3):**

- `POST /api/admin/users/import` — CSV file upload with multer, parses name/email/role, skips duplicates
- `POST /api/admin/users/bulk-role` — Bulk role change for selected users
- `POST /api/admin/users/bulk-email` — Bulk email placeholder (logs recipients)
- Frontend: `/admin/users/import` — drag-drop CSV upload, preview table, import results

**Branding/Theme Customization (Feature #14):**

- `GET/PUT /api/admin/branding` — Read/write branding config (stored as JSON in SystemSetting)
- `POST /api/admin/branding/logo` and `/favicon` — File uploads to `uploads/branding/`
- Frontend: `/admin/branding` — Color pickers, logo/favicon upload with preview, custom CSS editor

**i18n Management (Feature #17):**

- `GET /api/admin/i18n/locales` — List locale files with key counts and completion %
- `GET/PUT /api/admin/i18n/:locale` — Read/write translation JSON files
- `POST /api/admin/i18n/create` — Create new locale from en.json template
- Frontend: `/admin/i18n` — Locale list with progress bars, key-value translation editor with search

**Cache Management (Feature #11):**

- `GET /api/admin/cache/status` — Redis connection status (stub until Redis integrated)
- `POST /api/admin/cache/flush` — Flush cache endpoint (logs last flush time)
- Frontend: `/admin/cache` — Status card, flush button with confirmation dialog

**Files created:**

- `apps/api/src/modules/admin/users/bulk.routes.ts`
- `apps/api/src/modules/admin/branding/branding.routes.ts`
- `apps/api/src/modules/admin/i18n/i18n.routes.ts`
- `apps/api/src/modules/admin/cache/cache.routes.ts`
- `apps/web/src/app/admin/users/import/page.tsx`
- `apps/web/src/app/admin/branding/page.tsx`
- `apps/web/src/app/admin/i18n/page.tsx`
- `apps/web/src/app/admin/cache/page.tsx`

**Files modified:** `apps/api/src/app.ts` (added 4 imports + 4 route registrations)

---

## 2026-07-19 — Course Content & Course View UI Fixes

Fixed search icon text overlap in all student search inputs (`CoursesView`, `HomeView`, `BrowseCatalogueView`, `notes/page.tsx`) by increasing left padding from `pl-9` to `pl-10`. Improved course content sidebar hover color from `hover:bg-muted/30` to `hover:bg-primary/8` (subtle indigo tint). Replaced `IconPlayerPlay` with `IconVideo` for lesson sidebar items. Removed duplicate study material header from `StudyMaterialContent.tsx` (parent `CourseContentView` already shows it). Added Udemy-style download button (`IconDownload`) in the study material header card.

**Files modified:** `CourseContentView.tsx`, `StudyMaterialContent.tsx`, `CoursesView.tsx`, `HomeView.tsx`, `BrowseCatalogueView.tsx`, `notes/page.tsx`

## 2026-07-19 — Replace Orange Brand Color with Indigo Blue

Replaced the orange (`#f97316`) primary brand color with indigo (`#4F46E5`) across the entire UI. Updated CSS variables, btn-primary gradient, logo text, stat tile gradients, and action card colors. All loading spinners automatically updated via CSS variable cascade. All icons confirmed MIT open-source (Tabler Icons). Backgrounds already white — no changes needed.

**Files modified:** `globals.css`, `StudentPortalShell.tsx`, `StudentStatTiles.tsx`, `HomeView.tsx`, `calendar/page.tsx`

---

## 2026-07-24 — Invoice PDF in Post-Purchase Welcome Email

Added automatic invoice PDF generation and attachment to the welcome email sent after a course purchase.

**Changes:**

- Created `apps/api/src/services/invoice.service.ts` — Generates a professional A4 invoice PDF using jsPDF with company header, invoice number, date, bill-to section, package name, amount, discount, total, and login credentials
- Updated `apps/api/src/services/email.service.ts` — Added `attachment` support to `SendEmailOptions` and Brevo API call. Updated `sendWelcomeEmail()` to accept optional `invoice` data, generate PDF, and attach as base64
- Updated `apps/api/src/modules/payments/payment.service.ts` — Removed pre-payment welcome email from `createGuestUser()` (sent before payment). Now sends welcome email with invoice PDF only after successful enrollment/consent in `enrollInBatch()` and `createConsentEnrollment()`
- Updated `packages/email-templates/src/emails/WelcomeEmail.tsx` — Updated body text to reference purchase and attached invoice
- Email subject changed to "Welcome to LMS Portal — Purchase Confirmation" with additional "purchase" tag

**Files created:** `apps/api/src/services/invoice.service.ts`
**Files modified:** `email.service.ts`, `payment.service.ts`, `WelcomeEmail.tsx`
