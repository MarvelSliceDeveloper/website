# LMS Portal Changelog

> Lightweight record of recent changes in the workspace.

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

