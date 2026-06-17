# LMS Portal Changelog

> Lightweight record of recent changes in the workspace.

---

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

