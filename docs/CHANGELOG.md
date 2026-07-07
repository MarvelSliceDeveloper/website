# LMS Portal Changelog

> Lightweight record of recent changes in the workspace.

---

## 2026-07-07 — Super Admin Role, Role Separation & Security Hardening 🛡️

### Added: Super Admin Role (Full Stack)

- **`SUPER_ADMIN`** role in Prisma schema (`UserRole` enum), inherits `ADMIN` via auth middleware
- **12 new Prisma models**: `SystemSetting`, `ApiKey`, `LoginLog`, `PermissionOverride`, `Announcement`, `ConsentLog`, `QuizTemplate`/`QuizTemplateQuestion`/`QuizTemplateOption`, `AssignmentTemplate`, `CourseQuizTemplate`, `CourseAssignmentTemplate`
- **Soft-delete columns** on `User`, `Course`, `Batch`, `LiveSession`, `Assignment`
- **`getSuperAdminId()`** utility with 5-min cache for delegated Graph API calls; `requireSuperAdmin` middleware
- **Seed user**: `superadmin@lms.local` / `superadmin123` + 7 default system settings
- **OAuth/Microsoft account linking** restricted to `SUPER_ADMIN`

### Added: Super Admin API Modules

- **System settings** CRUD (`/api/admin/settings`)
- **API keys** CRUD with hashed storage (`/api/admin/api-keys`)
- **Permission overrides** toggle API (`/api/admin/permissions`)
- **Quiz/Assignment template** libraries (`/api/admin/quiz-templates`, `/api/admin/assignment-templates`)
- **Course ↔ template** attachment/detachment endpoints
- **Super admin user management**: pending instructors list, approve, suspend/unsuspend, soft-delete/restore, create-admin
- **Trash/restore** API for 5 entity types (user, course, batch, session, assignment)

### Added: Logging & Audit

- **Activity logs** (`/api/admin/logs`) with pagination/filters/10s polling + stats endpoint
- **Login history** (`/api/admin/login-history`) per-user browser
- **Consent logs** (`/api/admin/consent-logs`) for Microsoft account linking
- **Login logging**: Successful logins recorded to `LoginLog` in auth controller
- **Consent logging**: Microsoft account link events recorded to `ConsentLog`

### Added: UI Pages (13 new pages)

- `/admin/logs` — Activity log viewer with 10s auto-poll
- `/admin/logs/stats` — Error rate charts (SUPER_ADMIN)
- `/admin/settings/system` — Key-value system settings editor
- `/admin/settings/api-keys` — API key list/create/revoke
- `/admin/settings/permissions` — Permission toggle matrix with save button
- `/admin/users/login-history` — Login history browser
- `/admin/trash` — Tabbed entity browser with restore
- `/admin/announcements` — Create + history
- `/admin/consent-logs` — Consent history table
- `/admin/quiz-templates` — Library grid + editor
- `/admin/assignment-templates` — Library grid + editor

### Changed: Role Separation (Admin vs Super Admin)

- **Dashboard**: Admin sees platform KPIs (courses/batches/sessions/students); Super Admin sees system KPIs (health, API keys, logs, pending instructors, trash, user distribution)
- **Sidebar**: Admin nav focuses on platform ops (Inbox, Courses, Batches, Sessions, Reports, Enrollments, Calendar, Users, Mentorship, Microsoft, Settings → General); Super Admin nav focuses on system ops (Activity Logs, Trash, Announcements, Users + Login History, Settings → all, Microsoft)
- **Quiz/Assignment templates**: Removed from sidebar; to be integrated into course creation flow
- **Instructor sidebar**: Replaced "Assignments" nav with "My Courses"

### Changed: Instructor Workflow

- **Instructor creation**: Admin-created instructors now start as `isSuspended: true` (pending approval); SUPER_ADMIN gets SYSTEM notification
- **Login blocked**: Suspended accounts receive "Account is pending approval" on login attempt
- **Approve UI**: SUPER_ADMIN sees "Approve" button + "Pending" badge on instructors in admin users page
- **Session creation removed**: Instructors can no longer create live sessions (view only)
- **Assignment/Quiz creation removed**: Instructors can only view existing quizzes/assignments
- **My Courses page** (`/instructor/courses`): Shows instructor's assigned courses with batch info, quizzes list, and assignments list with due dates

### Changed: Service Updates for Graph API Delegation

- `session.service.ts` — Uses `superAdminId` for `createOnlineMeeting`
- `recording.service.ts` — Uses `superAdminId` for `syncRecordingsForSession` + `getPlaybackUrl`
- `calendar.service.ts` — Uses `superAdminId` for `syncCalendarForUser`
- All fall back to original `userId` if no linked super admin exists

### Changed: Inline Role Checks

- `session.service.ts` — `cancelSession` allows SUPER_ADMIN
- `ticket.controller.ts` — All ticket endpoints allow SUPER_ADMIN
- `batch.service.ts` — SUPER_ADMIN valid as batch instructor
- `session.controller.ts` — Cancel response shows "deleted" for SUPER_ADMIN

### Fixed: Security Hardening

- **Login page**: Removed hardcoded demo passwords from client-side code (`demoAccounts` object); demo section shows emails only
- **Graph subscriptions**: Removed hardcoded `"secretClientValue"` fallback for `clientState`; now uses `process.env.MS_WEBHOOK_CLIENT_STATE`
- **`.env.example`**: All secrets use `CHANGE_ME_*` prefix to fail validation if used in production
- **`docker-compose.yml`**: Postgres/pgAdmin credentials use `${VAR:-default}` env var interpolation
- **Admin user creation**: Only SUPER_ADMIN can create ADMIN/SUPER_ADMIN users (role dropdown conditional)

### Added: Planning Docs

- `docs/plan-to-work/super-admin-tracking.md` — 6-phase implementation tracker
- `docs/plan-to-work/super-admin-architecture.md` — Architecture decisions

---

## 2026-07-05 — Student Dashboard Bugfixes + UI Consolidation ✅

### Fixed: Critical Bugs in Student Dashboard

- **`loadingBatch` dead state** (`apps/web/src/app/student/page.tsx:528-540`): `loadingBatch` is now set to `true` before fetching batches. Previously the state was declared but never used, making the loading indicator always depend on the cache miss check.
- **`handleMentorshipSubmit` full-page loading** (`apps/web/src/app/student/page.tsx:557`): Removed `setIsLoading(true)` which triggered the entire portal loading spinner. Submission loading state is now scoped to the mentorship view.
- **`fetchBatch` silent failure** (`apps/web/src/app/student/page.tsx:532-536`): Added error handling — batch fetch failures now surface an error message instead of leaving the user on a perpetual LoadingView.
- **`supportTimeAgo` impure render** (`apps/web/src/app/student/_views/HomeView.tsx:207-216`): Replaced inline `supportTimeAgo` (which called `Date.now()` during render) with the shared `timeAgo` utility from `@/lib/time-ago`.

### Fixed: Component Consolidation

- **Duplicate EmptyState**: Merged `components/admin/EmptyState.tsx` (ComponentType icon, glass-card style) into `components/shared/EmptyState.tsx` (ReactNode icon, default style) using a discriminated union with `variant: "glass" | "default"`. Deleted `admin/EmptyState.tsx`. All 5 admin page imports updated to `@/components/shared/EmptyState` with `variant="glass"`.

### Fixed: Modal Accessibility

- **FormModal** (`components/admin/FormModal.tsx`): Added Escape key handler, focus trapping (Tab/Shift+Tab cycle), `role="dialog"`, `aria-modal="true"`, `aria-label`, and `aria-label="Close dialog"` on close button.
- **ConfirmModal** (`components/admin/ConfirmModal.tsx`): Same a11y improvements — Escape key, focus trap, dialog ARIA attributes.

### Changed: Navigation & Shared Components

- **`window.location.href` → `useRouter`** (`apps/web/src/app/instructor/dashboard/page.tsx:355`): Replaced `window.location.href = "/instructor/assignments"` with `router.push("/instructor/assignments")` for client-side navigation.
- **Shared Spinner** (`components/shared/Spinner.tsx`): Created reusable `Spinner` component with configurable `size`, `label`, and `className`.
- **Student portal loading states**: Refactored Suspense fallback, main loading view, and `LoadingView` to use the shared `Spinner` component instead of inline spinner markup.

---

## 2026-07-04 — Security Hardening & Critical Bugfixes 🔒

### Fixed: Security Hardening (P0)

- **JWT_SECRET**: No longer falls back to a hardcoded value — throws if `JWT_SECRET` env var is missing. (`auth.middleware.ts`, `auth.service.ts`)
- **CSRF_SECRET**: App now throws at startup if `CSRF_SECRET` is not set. (`app.ts`)
- **Webhook client state**: `MS_WEBHOOK_CLIENT_STATE` required; throws if missing. (`events-webhook.controller.ts`, `webhook.controller.ts`)
- **Encryption salt**: Changed from static `"salt"` to `crypto.randomBytes(64)` per operation. Output format: `salt:iv:authTag:encrypted` (breaking change for previously encrypted data). (`encryption.ts`)
- **CSRF middleware**: Moved to correct position — between exempt routes (auth, webhooks, health, csrf-token) and protected routes. Previously was a no-op. (`app.ts`)

### Fixed: Business Logic Bugs (P1)

- **`getOverdueAssignments`**: Now correctly filters by `dueDate < now` instead of returning all assignments. (`student.service.ts:44`)
- **Batch capacity check**: `addStudents` now counts only `APPROVED` enrollments toward capacity, not all enrollment requests. (`batch.service.ts:183`)
- **Calendar events range query**: `getEventsForUser` and `getTodayEvents` now use `startAt <= endDate AND endAt >= startDate` for proper multi-day event overlap. (`calendar.service.ts:111-113, 149-150`)
- **Session overlap check**: Overlap check now excludes sessions whose `scheduledEndAt` has already passed. (`session.service.ts:68-82`)

### Fixed: Code Quality (P2)

- **`parseVideoUrl`**: Extracted from `lesson.service.ts` and `module.service.ts` into shared `src/utils/video.ts`; removed dead duplicate in `module.service.ts`.
- **Dead code removal**: Removed `CreateAssignmentSchema` alias and `createAssignment()` wrapper from `assignment.service.ts` (unused backward-compat aliases).

### Fixed: Access Control (P4)

- **Batch removeStudent IDOR**: Instructors can no longer remove students from batches they don't own. (`batch.service.ts`)
- **Admin demotion safeguard**: Prevents admins from demoting themselves and from demoting the last admin in the system. (`user.routes.ts`)

### Chore

- **Error handler**: Now returns `err.statusCode || err.status || 500` instead of hardcoded `500`. (`app.ts`)
- **Test infrastructure**: Created `app.ts` (Express app), `__tests__/setup.ts`, `helpers.ts` (with `loginAs(role)`), and 24 tests (health, auth, notes, CSRF). Added `vitest/globals` types, bumped timeout to 15s for bcrypt.
- **`.env` & `.env.example`**: Added `CSRF_SECRET` and `MS_WEBHOOK_CLIENT_STATE`.

## 2026-07-04 — Brevo Email Integration & Bugfixes ✅

### Added: Brevo Email Provider with React Email Templates

- **New package** `packages/email-templates/` with 13 React Email templates + `BaseLayout`
- **Email service** (`apps/api/src/services/email.service.ts`): `sendEmail`, `sendWelcomeEmail`, `sendNotificationEmail` via Brevo v6 API
- **Template mapping**: All notification types mapped to React Email components with subject/text generators
- **Welcome email** on user self-registration (auth service) and admin-created users (user routes)
- **Company logo** in all emails via BaseLayout, served from `public/images/` via Express static
- **Documentation**: `docs/EMAIL_INTEGRATION.md` — setup guide, testing, troubleshooting, API reference

### Fixed: Enrollment Email Not Dispatching

- Exported `dispatchEmailsForNotification` from `notification.service.ts` (was module-private)
- Added `dispatchEmailsForNotification()` call in enrollment approval and rejection handlers with course/batch data

### Fixed: Seed Email Preferences Blocking All Emails

- Seed set `email: false` for all users (only 6 of 15 types) — no notification emails ever sent
- Changed to `email: true` for all users across all 15 notification types
- Fixed `ts-node` → `tsx` in Prisma seed command (package.json)

### Fixed: Missing Preference = No Email

- `dispatchEmailsForNotification` filtered out users with no `NotificationPreference` record
- Changed logic: no preference record → default email-enabled (matches schema `enabled: true` default)

### Fixed: Lucide Icon Type Mismatches (Web Build)

- `StatCard.tsx`, `AdminSidebar.tsx`, `InstructorSidebar.tsx`, `Sidebar.tsx`, `EmptyState.tsx`, `ConfirmModal.tsx`, `admin/enrollments/page.tsx`
- Widened `ComponentType<{ size?: number; ... }>` to accept `size?: number | string` matching Lucide's `IconProps`

### Fixed: User Delete Foreign Key Violation

- Added `notificationPreference.deleteMany` to user deletion cleanup in `user.routes.ts`

### Changed: Brevo → Resend (Deferred)

- User chose to keep Brevo for now. Docs and changelog updated.

---

### Changed: Module-Lesson Hierarchy with Student Dropdown Navigation

- **Prisma schema**: Added `Lesson` model (`id`, `moduleId`, `title`, `order`, `videoType`, `videoUrl`, `videoEmbedId`, `durationSeconds`, `isFreePreview`, `resources`); removed video/resources fields from `Module`
- **Seed script**: `upsertLessons` creates lessons per module with YouTube video data
- **Lesson service/controller/routes**: Full CRUD + reorder + resource add/delete under `/api/admin/courses/modules/:moduleId/lessons`
- **Course service**: `getCourseById` includes ordered lessons; `publishCourse` checks lessons instead of modules
- **Module service/controller**: Stripped video/resource fields; Module is now a pure container
- **Admin ContentTab**: Collapsible module containers with draggable LessonCard list + AddLessonForm
- **Student types/sidebar/player**: `CourseLesson` interface; sidebar shows expandable modules with lesson dropdown; `VideoPlayer` accepts lesson instead of module
- **Student `CourseContentView`**: Lesson-level selection state, flat prev/next across all lessons
- **Study Materials tab**: Resources upload to first lesson of selected module via lesson resource endpoints

---

## 2026-07-03 — White-Label YouTube Player ✅

### Changed: YouTube Embed → Custom Player with Zero Branding

- **Rewrote** `apps/web/src/app/student/_views/_comps/VideoPlayer.tsx` to use **YouTube IFrame Player API** with `controls=0`, `modestbranding=1`, `rel=0`, `iv_load_policy=3`, `fs=0` — no visible YouTube controls or logo
- **Added** transparent click overlay that intercepts all interactions on the video area — prevents right-click "Copy video URL" and clicking through to YouTube
- **Added** custom play button overlay with gradient background (matches app theme) — shown on idle/paused, hidden during playback
- Click anywhere on the video toggles play/pause via the API

---

## 2026-07-03 — k6 Load Testing Harness ✅

### Added: k6 Test Suite

- **Installed** k6 v2.1.0 locally (standalone binary in repo root)
- **Created** `apps/api/k6/` with 4 files:
  - `helpers.js` — shared base URL, seed user credentials, login function with cookie jar, threshold builder
  - `smoke.js` — 1 VU × 10s sanity test (health check, login, /me endpoint)
  - `load.js` — ramp from 0→20→50 VUs over 3.5 min testing health, auth, courses, sessions, mentorship. Fails if p95 > 1s or error rate > 5%
  - `scenarios.js` — realistic role-weighted mix: 3 admin VU, 5 instructor VU, 30 student VU with role-specific request patterns
- **Added** `pnpm` scripts: `test:load`, `test:load:smoke`, `test:load:scenarios` in root `package.json`

### Added: Heavy Load Profile (100 VUs)

- **Created** `apps/api/k6/heavy.js` — ramp 0→50→100 VUs over 2 min, hold 100 for 2 min, ramp down. Thresholds: p95 < 2s, error rate < 10%
- **Added** `pnpm test:load:heavy` script

---

## 2026-07-03 — Permanent Course Deletion for Archived Courses ✅

### Added: Permanent Delete Endpoint + UI

- **API**: Added `DELETE /api/admin/courses/:id/permanent` (admin-only) that hard-deletes a course and all related data in a transaction
- **Service**: Added `permanentDeleteCourse()` in `course.service.ts` — cascading cleanup of modules, batches, sessions, recordings, assignments, enrollments, payments, notes, certificates, and mentorship tickets before deleting the course record
- **Controller**: Added `permanentDelete` handler in `course.controller.ts`
- **UI**: Added "Delete Permanently" button in admin courses page for ARCHIVED courses only, with a destructive confirmation dialog

---

## 2026-07-03 — Playwright E2E Test Suite ✅

### Added: Playwright E2E Tests (Chromium-only)

- Installed `@playwright/test` — Chromium-only via `playwright install chromium`
- Created `apps/web/playwright.config.ts` — single Chromium project, HTML + list reporters
- Created `apps/web/e2e/auth.setup.ts` — shared API login helper for admin/instructor/student
- Updated root `package.json`, `apps/web/package.json`, `turbo.json` with `test:e2e` scripts

### Upgraded: Smoke → Deep Workflow Tests

- **auth.spec.ts** — 10 tests: UI login for all 3 roles with redirect verification, API auth cookie, invalid credentials, empty email validation, user registration via API + UI verify, password visibility toggle, logout, unauthenticated redirect
- **student.spec.ts** — 12 tests: 9 page smoke (Dashboard through Settings) + 3 deep workflows (sidebar nav items, support ticket creation, settings notification toggles)
- **instructor.spec.ts** — 12 tests: 9 page smoke (Dashboard through Settings) + 3 deep workflows (dashboard stat cards, batches list with cards/empty state, assignments list)
- **admin.spec.ts** — 20 tests: 16 page smoke (Dashboard through Settings) + 4 API-driven deep workflows (create course → verify in list, publish course → verify status badge, create batch → verify in list, batch detail page with full info)
- Total: **54 tests** across **4 test files**
- All deep tests use API-driven data setup + UI verification for robust, repeatable E2E coverage

### Plan

- `.omo/plans/playwright-e2e.md` → `docs/plan-completed/playwright-e2e.md`

---

## 2026-06-30 — Calendar ↔ Sessions Sync Fixes + Role Workflows ✅

### Fix A — Admin Calendar Duration (Bug)

- **File:** `apps/web/src/app/admin/calendar/page.tsx:67`
- **Change:** `s.endDateTime` → `s.endedAt`
- **Why:** Code was reading a non-existent field. Every event fell back to `start + 1hr` regardless of actual duration.

### Fix B — Session Edits Not Synced to Calendar (Bug)

- **File:** `apps/api/src/modules/sessions/session.service.ts:242-261`
- **Change:** `updateSession()` now syncs title, start, and end changes to both `LiveSession` and `CalendarEvent` records.
- **Why:** Editing a session's title or time was invisible to the student calendar view. The `CalendarEvent` was never updated.

### Fix C — Canceled Sessions Lingering in Student Calendar (Bug)

- **File:** `apps/api/src/modules/sessions/session.service.ts:295-304`
- **Change:** Instructor soft-cancel now deletes the linked `CalendarEvent` inside a transaction, matching the admin hard-delete behavior.
- **Why:** Canceled sessions kept appearing in student calendars because only the `LiveSession.endedAt` was set — the `CalendarEvent` was untouched.

### Fix D — `endedAt` Dual Meaning (Cleanup)

- **Files:** `apps/api/prisma/schema.prisma:158` + `session.service.ts`
- **Change:** Added `scheduledEndAt DateTime` field to `LiveSession` model. On create, both `scheduledEndAt` and `endedAt` are set to `endDateTime`. On update, both update. On cancel, only `endedAt` is overwritten — `scheduledEndAt` preserves the original scheduled end.
- **Why:** `endedAt` was used for both "scheduled end time" and "cancel timestamp", causing data loss on early cancellation.

### Fix E — `/student/calendar` Sidebar Link 404 (Bug)

- **Files:** `apps/web/src/components/Sidebar.tsx:34` + `apps/web/src/app/student/page.tsx:301-304`
- **Change:** Sidebar link changed from `"/student/calendar"` to `"/student?view=calendar"`. Student page now reads `?view=calendar` query param on mount and auto-navigates to the Calendar view.
- **Why:** The student calendar is rendered via SPA view stack on `/student`, but the sidebar pointed to a non-existent route. All other SPA-only views (Dashboard, Sessions) had the same issue.

### Documentation

- **Created:** `docs/plan-to-work/calendar-session-sync.md` — Plan document tracking all fixes (marked completed).
- **Created:** `docs/plan-to-work/calendar-session-workflows.md` — Comprehensive role-based workflow documentation for Admin, Instructor, and Student covering all Calendar and Sessions operations with data flow diagrams and state machine.

---

## 2026-06-27 — Student Portal UI Overhaul: Support, Inbox, and CSS Fix

### Support Page Redesign (`/student/support`)

- **Wrapped** page in `StudentPortalShell` for consistent header, notifications, and theme toggle.
- **Implemented** two-column split layout for desktop: scrollable ticket list on the left (`lg:col-span-5`), ticket detail/chat panel on the right (`lg:col-span-7`), inside a `glass-card`.
- **Enhanced** chat conversation UI with rounded bubbles, differentiated sender styling, and a polished empty-state placeholder.
- **Responsive fallback**: single-column view on mobile with a back-to-list button.

### Inbox Page Redesign (`/student/inbox`)

- **Wrapped** page in `StudentPortalShell` for consistent navigation.
- **Added** left sidebar (`lg:col-span-3`) with notification stats (total, unread, read counts) and vertical filter tabs.
- **Improved** notification cards with type badges, animated unread dots, and toast feedback on mark-read / delete actions.
- **Enhanced** empty states with contextual messaging per filter mode.

### Tailwind CSS v4 Theme Fix (`globals.css`)

- **Changed** `@theme inline {` to `@theme {` to align with the standard Tailwind CSS v4 specification.

---

## 2026-06-27 — Critical Fixes: Rate Limiting, Support Ticket Resolution, and Student Enrollment Toasts ✅

### Express Rate Limiter

- **Relocated** rate limiting middleware in `apps/api/src/index.ts` to register before modular route mountings, ensuring all modular endpoints are correctly rate-limited.

### Unified Ticket Resolution

- **Updated** `ticketService.getTicket` to perform a parallel search of both `SupportTicket` and `MentorshipTicket` tables if the `type` query parameter is omitted, resolving `404 Not Found` bugs when opening or replying to support tickets via the client portal.

### Student Course Enrollment UX

- **Refactored** `handleEnroll` in `apps/web/src/app/student/page.tsx` to handle async requests safely with `try-catch`, show user feedback via `sonner` toasts (`toast.success` and `toast.error`), and trigger a portal-wide data reload upon success.

## 2026-06-25 — Code Cleanup: Removed Duplicate Ticket Modules, Dead Code, Typed VideoPlayer ✅

### Consolidated Ticket System

- **Removed** old `mentorship.service.ts`, `mentorship.controller.ts`, `support.service.ts`, `support.controller.ts`
- **Rewired** `mentorship.routes.ts` and `support.routes.ts` to delegate to the unified `ticketController`/`ticketService` — same URL paths (`/api/mentorship/*`, `/api/support/*`), consolidated logic underneath
- Frontend pages untouched — all existing API calls continue to work

### Removed Dead/Unused Code

- `notification.service.ts`: Deleted unused `shouldNotify()` function
- `certificate.routes.ts`: Wired up `GET /` and `POST /claim` routes (service/controller were already implemented)
- `auth.controller.ts` / `auth.service.ts`: Removed debug `console.log` statements
- `index.ts`: Removed leftover template comment
- **Frontend**: Removed 9 unused icon imports across `StudentPortalShell`, `Sidebar`, `AdminSidebar`, `InstructorSidebar`, `MentorshipTickets`

### Fixed Duplicate Logic Bugs

- `Header.tsx`: Replaced local `timeAgo` with import from `@/lib/time-ago` — fixed `"just now"` → `"Just now"` casing inconsistency
- `StudentPortalShell.tsx`: Fixed localStorage key `lms-student-theme` → `lms-theme` (was inconsistent with `Header.tsx`)

### VideoPlayer.tsx — Fully Typed

- Removed `// @ts-nocheck`, added proper TypeScript types to all components and functions
- Fixed `CtrlBtn` icon prop type to accept `string | string[]` (some SVG paths are arrays)
- Added `IconKey` type for the demo sidebar navigation

### Added Function Documentation

- Added `// what this does` line comments across 25 frontend component files

## 2026-06-17 — Support Ticket System + Student Pages Polish ✅

### New Feature: Support Ticket System

- **Database Schema**: Added `SupportTicket` and `SupportMessage` models to Prisma with `SupportTicketStatus` enum (OPEN, IN_PROGRESS, RESOLVED, CLOSED).
- **Backend Module**: Created `support.service.ts`, `support.controller.ts`, `support.routes.ts` at `/api/support` with full CRUD, status transitions, and messaging.
- **Notification triggers**: Added `notifySupportTicketCreated`, `notifySupportTicketNewMessage`, `notifySupportTicketStatusChanged` helpers.
- **Support notification icons**: Added `SUPPORT_TICKET_*` entries to all frontend notification icon maps (4 files).
- **Student Support Page**: Created standalone `/student/support` page with ticket list, create form, and inline chat view.
- **Instructor Support Page**: Created standalone `/instructor/support` page with same functionality.
- **Admin Inbox Support Tab**: Added new "Support" tab with split-panel list + chat + status controls; renamed old tab to "Mentorship Tickets".
- **Student Sidebar**: Added "Support" link (Growth section).
- **Instructor Sidebar**: Added "Support" link (Overview group).

### Student SPA Portal Updates

- `HomeView.tsx`: Set `sectionApiAvailability.support = true`, added inline support content below tabs (list, create form, "View All Tickets" link), removed standalone Support card from section grid.

### UI Polish

- **Student Support Page**: Aligned layout to `mx-auto max-w-3xl` pattern, wider `max-w-lg` chat bubbles, skeleton loading, proper empty states, removed mobile-style back button (replaced with X close), `btn-secondary` back-to-dashboard button.
- **Student Settings Page**: Added 3 support notification toggles, replaced emoji icons with Tabler icons, unified toggle rows into single card with `divide-y`, added toast.promise loading states.
- **Toast Standardization**: All async actions on support and settings pages now use `toast.promise()` with loading/success/error states.
- **Toast Position**: Added `<Toaster position="top-right" richColors />` to student layout — all student pages now render toasts at top-right.

## 2026-06-17 — Toast Migration, Inbox Overhaul, Mentorship Rewire ✅

### Toast & Monorepo

- **Sonner Toast Integration**: Installed `sonner ^2.0.7` in `apps/web`. Created `apps/web/src/app/providers.tsx` with `<Toaster position="bottom-right" richColors closeButton />` wired into root layout.
- **alert() → Toast Migration**: Replaced all 52+ `alert()` calls with `toast.success()` / `toast.error()` across admin, instructor, and student pages.
- **Inline Error/Success → Toast Migration**: Removed all `{error && <div...}` / `{success && <div...}` inline state-rendering blocks across 13 files, replacing with sonner pop-up notifications. Cleaned up unused error/success/thumbnailError state variables and related `setTimeout` auto-dismiss logic.
- **Monorepo Package Rename**: `apps/web/package.json` name changed from `"web"` → `"@lms/web"`.
- **Lockfile Cleanup**: Deleted orphaned `apps/web/pnpm-lock.yaml` and `apps/web/package-lock.json` from git/disk; added `pnpm-lock.yaml` to `.gitignore` in `apps/web/`.
- **Dependency Relocation**: Moved `react-icons` from root `package.json` → `apps/web/package.json`. Removed unused `nodemon` from `apps/api/devDependencies`.
- **Root tsconfig.json**: Created shared base `tsconfig.json` at root; `apps/api` and `apps/web` tsconfigs now `extends` it.

### Notification & Inbox Overhaul

- **Database Schema**: Added `Message` model (sender, receiver, subject, body, read, entityType, entityId) and `NotificationPreference` model (userId, type, enabled, email, unique compound key) to Prisma.
- **Backend Messages Module**: Created `message.service.ts`, `message.controller.ts`, `message.routes.ts` mounted at `/api/messages`. Supports send, listConversations, getThread, markAsRead, unreadCount.
- **Enhanced Notification Service**: Added `delete()`, `deleteAllRead()`, `getPreferences()`, `updatePreference()` methods and `shouldNotify()` preference gate.
- **New Notification Triggers**: Added `notifySessionCancelled()` (sessions), `notifyMentorshipStatusChange()` (mentorship), `notifyAssignmentGraded()` (assignments), `notifyMentorshipCreated()` (new ticket alerts student + all admins). Wired into respective services/controllers.
- **StudentPortalShell Notification Bell**: Rewritten with 30s polling, API-fetched hybrid dropdown (5 latest), per-item mark-as-read, unread badge (9+ overflow), "View all" link.
- **Header.tsx Notification Bell**: Same hybrid dropdown + polling added to shared Header for admin/instructor shells.
- **Student Inbox Page**: Created `/student/inbox` with full notification list, All/Unread filter tabs, per-item mark-as-read/delete, mark-all-read / clear-read bulk actions, loading skeleton, empty states.
- **Admin Inbox Page**: Created `/admin/inbox` with 3 tabs — Notifications (full list with CRUD), Support Tickets (fetches mentorship API), Messages (conversation list + chat bubble thread with send UI, toast on send).
- **Instructor Inbox Page**: Created `/instructor/inbox` with 2 tabs — Notifications and Messages (no support tickets).
- **Student Settings Page**: Created `/student/settings` with notification preference toggle switches for all 6 types, persists via `PATCH /api/notifications/preferences`.
- **AdminSidebar**: Added "Inbox" nav item (`IconMail`) pointing to `/admin/inbox`.
- **InstructorSidebar**: Added "Inbox" nav item (`IconMail`) pointing to `/instructor/inbox`.
- **Seed Defaults**: Added default notification preferences (all types enabled, email=false) for all seeded users. Fixed duplicate `main()` call bug in seed.ts.

### Email & UI Polish

- **Emoji Cleanup**: Removed emoticons from `MentorshipTickets.tsx`, `student-mock-data.ts`, `instructor/mentorship/page.tsx` empty states, and `MentorshipView.tsx` status labels.
- **Header inboxHref Prop**: Made "View all" link role-aware via `inboxHref` prop — AdminShell passes `/admin/inbox`, InstructorShell `/instructor/inbox`, StudentShell `/student/inbox`.

### Mentorship Feature Rewire

- **Database Schema**: Added optional `courseId` (FK to Course) and `notes` (resolution notes) fields to `MentorshipTicket` model.
- **Backend Updates**: `CreateTicketSchema` now accepts `courseId`; added `CompleteTicketSchema` with optional `notes`; `completeTicket()` persists notes; all queries include `course` relation.
- **Student Type Fix**: `fetchPortalData()` now maps API response (`title`, `mentor.name`, `course.title`) to mock-type shape (`topic`, `instructor`, `courseTitle`) so `MentorshipView` renders correctly.
- **Submit Payload Fix**: Changed student form submission from `{ courseId, topic, preferredDate }` to `{ title, description, courseId, preferredDate }` matching backend Zod schema.
- **Student Mentorship Route**: Created `/student/mentorship/page.tsx` as a standalone route (sidebar link previously 404'd).
- **Error Handling**: Added `toast.success`/`toast.error` on student submit, `loadData` refresh after create, loading skeleton.
- **Instructor Page**: Removed bad `t.status !== "OPEN" && t.mentor` frontend filter (backend already scopes by mentorId). `handleComplete` now prompts for and sends notes.
- **Admin Modal**: Replaced all raw `fetch()` calls with `api.patch()` helper. Added collapsible notes textarea sent with complete action.
- **Mentorship Creation Notifications**: `notifyMentorshipCreated()` sends notification to the student ("request submitted") and all admins ("new request from student").

---

## 2026-06-06 — MCQ Assignment System (Instructor + Student) ✅

- **Database Schema**: Added 5 new Prisma models: `Assignment`, `AssignmentQuestion`, `AssignmentMcqOption`, `AssignmentSubmission`, `StudentQuestionResponse`, plus `SubmissionStatus` enum. Linked to existing `User`, `Course`, and `Batch` models.
- **Backend Module**: Created `apps/api/src/modules/assignments/` with full service, controller, and route files.
  - `POST /api/assignments` — Create MCQ assignment with nested questions and options (Instructor)
  - `GET /api/assignments` — List assignments scoped by role
  - `GET /api/assignments/:id/questions` — Fetch questions (strips `isCorrect` for students)
  - `POST /api/assignments/:id/submit/mcq` — Submit answers & auto-grade (Student)
  - `GET /api/assignments/submissions/:id/result` — Get detailed score breakdown
  - `GET /api/assignments/:id/submissions` — List student scores (Instructor)
  - `POST /api/assignments/submissions/:id/grade` — Manual grade/feedback override (Instructor)
- **Auto-Grading Engine**: MCQ submissions are automatically graded in a database transaction, calculating correctness per question and total score.
- **Safety Checks**: Unique constraint prevents duplicate submissions, due date validation rejects late submissions, `isCorrect` stripped from student-facing question endpoints.
- **Student Service Refactor**: `studentService.getOverdueAssignments()` now queries real `Assignment` table instead of deriving assignments from past live sessions.
- **Instructor Frontend**: Rewrote `apps/web/src/app/instructor/assignments/page.tsx` with dynamic batch selection, MCQ question builder, submissions leaderboard, and per-student answer review with manual feedback form.
- **Student Frontend**: Rewrote `apps/web/src/app/student/_views/AssignmentOverdueView.tsx` with interactive MCQ quiz-taking UI (radio button selection, progress bar), auto-graded score display, and detailed question breakdown with correct/incorrect markers.

---

## 2026-05-29 — Batch & Course Route Permissions for Instructors ✅

- **API Permissions Update**: Removed top-level `requireRole([UserRole.ADMIN])` restriction from both `batchRouter` and `courseRouter` to allow read-only access for instructors.
- **Instructors Access Control**:
  - Restricted `ADMIN` role only to mutating operations (create, update, delete, add/remove students) for batches and courses.
  - Allowed `ADMIN` and `INSTRUCTOR` roles to access read-only operations (list and get details).
  - Enforced security scope checks in `batch.controller.ts` so that instructors can only fetch batches they are assigned to, and only get details/students of their assigned batches.

## 2026-05-24 — Student Portal Refinement, Live Session Scheduling & System Documentation ✅

- **Documentation**: Created `docs/SYSTEM_GUIDE.md` detailing the entire enrollment approval pipeline, dynamic admin user creation, live session overrides, thumbnail rendering systems, and default seeded credentials.
- **Student UI Thumbnail Fix**: Updated thumbnail container in all 4 student portal views (`CoursesView`, `HomeView`, `CourseDetailView`, and `BrowseCatalogueView`) to automatically render image tags if the path starts with a slash or HTTP, resolving text overlaps.
- **Mock Data Leakage Cleanup**: Replaced mock data catch-block fallbacks with clean empty arrays (`[]`) in the student page parallel API fetches, ensuring clean and authentic local database testing.
- **Instructor Dashboard**: Verified default instructor seeded credential login: `instructor@lms.local` / `instructor123` with access to the `/sessions` route.
- **Schedule Dropdowns & Scheduling**: Validated response schema shapes for courses and batches dropdown APIs, ensuring full compatibility between the Express API server and Next.js frontend pages.

## 2026-05-23 — Course Thumbnail Upload (Local Storage) ✅

- **Admin UI**: Added thumbnail file upload during course creation and in the course editor.
- **API**: Added `POST /api/admin/courses/:id/thumbnail` for local uploads and exposed `/uploads` for serving images.
- **API**: Publish response now includes `published: true` to align admin UI refresh behavior.
- **API**: Replaced `Express.Multer.File` with a local upload type to fix TS2694 in the API server.
- **Storage**: Thumbnails are stored locally under `apps/api/uploads/courses` (S3 planned later).

## 2026-05-22 — Documentation Consolidation & Graph Client Audit ✅

- **API Guide Consolidation**: Merged Postman environment configurations and endpoint execution steps from `docs/TestAPI.md` directly into a single comprehensive source of truth: `docs/API.md`.
- **Microsoft Graph Client Verification**: Verified and documented backend Graph module resilience, including auto-refreshing delegated/app tokens, 429 rate-limit back-offs, and automatic retries for transient service failures.
- **Documentation Repository Cleanup**: Cleaned up obsolete timeline, planning, setup, and phase-based documents to keep the `/docs` directory pristine, retaining only `API.md` and `CHANGELOG.md`.

## 2026-05-19 — Student Portal API Linkage + UI Cleanup ✅

**Backend linkage:** Connected the student recordings experience to API-backed batch and recording payloads, and cleaned up the reusable UI primitives so diagnostics are resolved.

### Updated

- `apps/web/src/app/student/page.tsx` — Batch loading now merges `/api/batches/:id` with `/api/recordings?batchId=...` so recordings and modules are hydrated from backend data.
- `apps/api/src/modules/recordings/recording.service.ts` — Batch recordings now return `sessionId`, `moduleId`, and `moduleTitle` for exact module grouping.
- `apps/web/src/app/student/_views/BatchDetailView.tsx` — Recordings list uses `StudentTable` + `PaginationBar` with backend-linked data.
- `apps/web/src/app/student/_views/RecordingPlayerView.tsx` — Module accordion groups recordings by explicit `moduleId`.
- `apps/web/src/components/student/StudentTable.tsx` — Added compatibility support for `emptyMessage`/`emptyText` prop usage.

### Diagnostics Fixed

- Updated Tailwind utility names to accepted `bg-linear-*` / `max-w-*` / `min-w-*` forms where flagged.
- Suppressed the `@theme` CSS warning in `globals.css` while keeping Tailwind token mapping intact.

## 2026-05-18 — Student Portal Single-Page Migration ✅

**Architecture change:** Replaced the sidebar + multi-route student portal with a **single-page view-stack** at `/student`.

### New Components & Files

- `apps/web/src/app/student/page.tsx` — View-stack state machine; renders all 10 views in-place
- `apps/web/src/app/student/layout.tsx` — Stripped to a pass-through (shell is now in page.tsx)
- `apps/web/src/app/student/_types/student-portal.ts` — `ViewName` + `ViewState` shared types
- `apps/web/src/app/student/_views/HomeView.tsx` — Dashboard: count-up stats, 6-section grid, Today's Schedule, Continue Learning strip
- `apps/web/src/app/student/_views/CoursesView.tsx` — My Courses with filter (All/Active/Completed/Pending), search, progress bars
- `apps/web/src/app/student/_views/BatchDetailView.tsx` — Sessions / Recordings / Progress tabs per batch
- `apps/web/src/app/student/_views/RecordingPlayerView.tsx` — Video player with next-up list
- `apps/web/src/app/student/_views/LiveSessionsView.tsx` — Live/Upcoming/Past sessions with Teams join button
- `apps/web/src/app/student/_views/CalendarView.tsx` — FullCalendar wrapper (month/week/list), legend, this-week list
- `apps/web/src/app/student/_views/CalendarWidget.tsx` — FullCalendar inner component (dynamic import, no SSR)
- `apps/web/src/app/student/_views/MentorshipView.tsx` — 1-on-1 tickets + inline request form
- `apps/web/src/app/student/_views/CertificatesView.tsx` — Earned + in-progress certificates
- `apps/web/src/app/student/_views/BrowseCatalogueView.tsx` — Course catalogue with search + tag filters
- `apps/web/src/app/student/_views/CourseDetailView.tsx` — Course detail + enroll CTA with confirmation step
- `apps/web/src/components/StudentPortalShell.tsx` — New no-sidebar header shell (back button, breadcrumbs, notification bell, avatar dropdown)
- `apps/web/src/lib/student-mock-data.ts` — Full mock data for all 10 views (types + seed values)
- `apps/web/.env.local` — `NEXT_PUBLIC_USE_MOCK_DATA=true` toggle (set to `false` for real API)

### Deleted (old sidebar multi-route pages)

- `student/dashboard/page.tsx` → replaced by `student/page.tsx`
- `student/courses/page.tsx` → replaced by `CoursesView`
- `student/sessions/page.tsx` → replaced by `LiveSessionsView`
- `student/calendar/page.tsx` → replaced by `CalendarView`
- `student/mentorship/page.tsx` → replaced by `MentorshipView`
- `student/certificates/page.tsx` → replaced by `CertificatesView`
- `student/learn/[sessionId]/page.tsx` → replaced by `RecordingPlayerView`

### Modified

- `apps/web/src/app/globals.css` — Added `.sp-eyebrow`, `.sp-view-enter` (slide-in), `.sp-fade-up`, `.scrollbar-none`
- `apps/web/src/components/StudentPortalShell.tsx` — Fixed `IconGraduateCap` → `IconSchool` (invalid Tabler icon)
- `apps/web/src/app/login/page.tsx` — Fixed student redirect from `/student/dashboard` → `/student/` to match new single-page URL

### Packages Added

```
@fullcalendar/react @fullcalendar/core @fullcalendar/daygrid
@fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
```

### Docs Updated

- `docs/phases/phase-03-student-ui.md` — Marked ✅ IMPLEMENTED, added architecture change section
- `docs/architecture.md` — Updated §06 Frontend Structure to reflect single-page layout
- `docs/README.md` — Updated demo login landing page + build summary

---

## 2026-05-15

- Added a sign out button to the student sidebar.
- Removed the mentorship "How It Works" card.
- Added a real student certificates page backed by API data.
- Added collapsible sidebar controls for student and admin layouts.
- Installed `@tabler/icons-react` and switched the student/admin shells to React icons.
- Fixed the admin sessions page to read the `{ sessions }` API response shape correctly.
