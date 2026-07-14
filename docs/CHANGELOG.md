# Changelog

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
