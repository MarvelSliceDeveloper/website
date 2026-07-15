# Changelog

## 2026-07-15 - Enrollment & Content Access Fixes

### Fixed

- **CRITICAL: Course content 403 for package-enrolled students**. The `GET /api/courses/:courseId/content` endpoint only checked the `EnrollmentRequest` table for approved status. If a student was enrolled via a package (`PackageEnrollmentCourse`), they got a 403 even though the admin correctly saw "APPROVED". Now checks both `EnrollmentRequest` and `PackageEnrollmentCourse` before returning content. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **CRITICAL: No admin UI for individual enrollment approvals**. The `/admin/enrollments` page was just a redirect to `/admin/packages/enrollments`, making it impossible for admins to approve individual `EnrollmentRequest` records through the UI. Replaced with a full approval management page (status filters, approve/reject with batch assignment modal). (`apps/web/src/app/admin/enrollments/page.tsx`)
- **MODERATE: Deduplication order inverted**. The `/enrolled` endpoint comment said "prefer individual enrollment" but the spread order `[...packageCourses, ...individualCourses]` made package courses win. Fixed to `[...individualCourses, ...packageCourses]`. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **MODERATE: No notifications for package enrollment approval/rejection**. Unlike individual enrollments, package enrollment approval/rejection sent no in-app notification or email to the student. Added `notificationService.create()` and `dispatchEmailsForNotification()` calls in both `approveEnrollment` and `rejectEnrollment`. (`apps/api/src/modules/packages/package.service.ts`)
- **LOW: Hardcoded "PENDING" status for enrollments without batch**. The `/enrolled` endpoint hardcoded `status: "PENDING"` for enrollments where `!e.batch`, even if the actual DB status was `APPROVED` or `REJECTED`. Now uses the actual status from the database. (`apps/api/src/modules/courses/student-course.routes.ts`)

## 2026-07-15 - Package-Only Batch Refactor

### Changed

- **`Batch.courseId` is now nullable.** One batch can represent an entire package cohort
  (`courseId: null`, `packageId` set) instead of one batch per course. The admin "Add New Batch"
  form creates **one batch** for the whole package (not N batches). Course membership is
  derived from `PackageCourse` records.
- **`LiveSession.courseId` added.** Admins can directly pick which course within a package
  a live session belongs to, enabling per-course session filtering in the student dashboard.
- **`POST /api/admin/batches` can now create either a single batch** (when `courseId`
  is provided — direct API usage) **or one batch for the whole package** (when only `packageId`
  is provided — used by the admin form). The old `POST /api/admin/batches/bulk` endpoint
  was removed; its logic was folded into the single create endpoint.
- **Relaxed ID validation.** `courseId`, `packageId`, and `instructorId` in the batch
  create schemas are now validated as non-empty strings (`z.string().min(1)`) instead of
  `z.string().cuid()`. The DB uses `@default(cuid())` but does not enforce the format,
  and seed data uses fixed IDs (e.g. `"pkg-fullstack"`), so strict cuid checks rejected
  valid IDs (the `Invalid cuid` error on `packageId`).
- **Improved frontend error display.** `lib/api.ts` now attaches the structured error
  body to thrown errors and `lib/toast.ts` `getErrorMessage` renders Zod error arrays as
  readable, field-level messages (e.g. `packageId: Invalid cuid`) instead of
  `[object Object],[object Object]`.

### Added

- The batch create form now has client-side validation (required package/instructor/name/dates)
  with inline errors and a disabled submit until valid.

## 2026-07-13 - UI/UX Improvements

### Added

- Pagination support in DataTable component (already existed)
- Hash-based color generation for course thumbnails without images
- Lines to differentiate sidebar sub-menu items

### Changed

- Student dashboard stat tiles: Updated gradients to orange, green, and blue (medium intensity)
- "Back" button renamed to "Previous" in student portal header
- "Create Course" renamed to "Add Course" in admin dashboard and course creation page
- User avatar dropdown: Shows only icon (removed name display)
- Quick Access section: Improved color intensity from light to medium
- Student dashboard header: Changed from transparent/blur to solid white background
- All flat square corners changed to round-2xl edges
- Color palette updated from light to medium intensity throughout

### Removed

- Price display removed from:
  - BrowseCatalogueView (student portal)
  - CourseDetailView (student portal)
  - Course Catalogue page (public)
  - Admin courses management table
  - Admin new course creation form

### Files Modified

- `apps/web/src/components/student/StudentStatTiles.tsx`
- `apps/web/src/components/StudentPortalShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/admin/DataTable.tsx`
- `apps/web/src/components/admin/StatCard.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/courses/page.tsx`
- `apps/web/src/app/admin/courses/new/page.tsx`
- `apps/web/src/app/student/_views/HomeView.tsx`
- `apps/web/src/app/student/_views/BrowseCatalogueView.tsx`
- `apps/web/src/app/student/_views/CourseDetailView.tsx`
- `apps/web/src/app/catalogue/page.tsx`

## 2026-07-14 - Batch & User Creation Fixes

### Fixed

- **Packages not visible in users page**: `GET /api/admin/packages` returns `{ packages: [...] }` but the frontend was treating the response as a direct array. Fixed to parse `res.packages`.
- **courseBatchAssignments format mismatch**: Frontend sent `Record<string, string>` but backend expected `Array<{courseId, batchId}>`. Batch assignments were silently dropped on student creation. Now converts to proper array format.
- **Prisma client regeneration**: Regenerated after schema changes to ensure `packageId` on Batch model is recognized.

### Changed

- **Batch creation form reworked to Package-first flow**: Instead of selecting a course directly, admins now select a Package first, then the Course dropdown shows only courses from that package. The batch is linked to the package via `packageId`.
- **Batch list cards now show package name**: If a batch belongs to a package, the package name is displayed below the course title.
- **Removed "Pending" indicator from users table**: The instructor approval pending badge was removed from the Role column.
- **Simplified student assignment to single batch**: Instead of per-course batch selection, admin picks ONE batch from the package. The batch is assigned to its matching course; other package courses are enrolled without a batch.
- **Seed data now includes packages**: Two packages seeded — "Full Stack Developer Bootcamp" (Python + React + JS) and "Cloud & DevOps Engineer" (AWS + Python). All batches linked to packages. Students enrolled via PackageEnrollment with batch assignments.

### Files Modified

- `apps/web/src/app/admin/users/page.tsx` — Fixed packages API parsing, removed Pending indicator, simplified to single batchId
- `apps/web/src/app/admin/batches/new/page.tsx` — Reworked to Package-first flow
- `apps/web/src/app/admin/batches/page.tsx` — Added package field to Batch type and card display
- `apps/api/src/modules/users/user.routes.ts` — Simplified POST /api/users to accept single batchId
- `apps/api/prisma/seed.ts` — Added packages, package-linked batches, and package enrollments
