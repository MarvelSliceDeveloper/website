# Changelog

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
