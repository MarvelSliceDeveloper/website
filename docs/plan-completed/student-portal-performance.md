# Student Portal Performance Optimization

## Goal

The student portal single-page dashboard (`/student`) loads too slowly. The root cause is
that **everything is fetched eagerly, all at once, with no caching**:

1. `GET /api/student/summary` fanned out into **9 heavy queries** on every portal load.
2. The summary was served with **no caching/single-flight**, so every visit re-ran all 9 queries.
3. The heavy **catalogue** (all published courses + modules + sessions + batches) and the heavy
   **certificate completion map** (all recordings + progress for all batches) were loaded
   eagerly on the dashboard even though they're only needed for isolated views.
4. The frontend loaded heavy views statically and blocked the whole page on one monolithic summary call.

## Result

The dashboard now loads a **lightweight core** first (enrolled, sessions, calendar, tickets, cheap
counts) and builds the rest **progressively** from per-section endpoints. Heavy, view-specific data
(catalogue / course detail, certificates) is fetched **on demand** only when the user opens that view.

## Changes

### Backend (`apps/api`)

| File | Change |
| --- | --- |
| `modules/calendar/calendar.service.ts` + `controller` | `getEventsForUser(start, end, userId?)` — scopes events to the student's approved batches + own mentorship tickets (fixes a data leak + cuts payload). |
| `modules/student/student.service.ts` | `getDashboardSummary` wrapped in `getCachedSingleFlight` (15s TTL, per-user key `student-summary:${userId}`). `buildDashboardSummary` reduced to **core only**: enrolled, sessions, calendar, tickets, cheap `certificatesCount`, and a new lightweight `getRecommendedCourses()`. Heavy sections no longer added. |
| `modules/student/student.service.ts` | `getOverdueAssignments`: added `take: 50` on batch-assignments, course-assignments, and quizzes. |
| `modules/student/student.service.ts` | `getContinueLearning`: only fetches lessons/sessions the user has actually started (`progress: some` filters), cutting the huge nested payload while preserving the top-10 logic. |
| `modules/courses/student-course.service.ts` | Slimmed `getCatalogue` (dropped `sessions: true`, uses `_count.sessions`). **New `getCourseDetail(userId, courseId)`** — single published course for on-demand COURSE_DETAIL. |
| `modules/courses/student-course.routes.ts` | **New `GET /api/courses/:courseId`** on-demand course detail route (wraps `getCourseDetail`). |
| `prisma/schema.prisma` | Added composite indexes for the hot queries: `QuizAttempt(userId,status)`, `Quiz(moduleId,dueDate)`, `Assignment(batchId,dueDate)`, `AssignmentSubmission(studentId,status)`, `EnrollmentRequest(userId,status)`, `PackageEnrollment(userId,status)`. |
| `modules/student/student.service.ts` | `getResults`/`getEnrolledSummary` already had limits/light selects; verified no new N+1s. |

### Frontend (`apps/web`)

1. `app/student/page.tsx`
   - Lazy-loads heavy views via `next/dynamic` (already done previously).
   - `fetchPortalData` now: fetches **light core summary** (`/api/student/summary`), then fetches the
     heavy sections in parallel from their own endpoints (`/api/student/assignments/overdue`,
     `/api/student/continue-learning`, `/api/student/results`) so the dashboard renders progressively.
   - Removed the pre-fetch of `catalogue` and `certificates` from the summary path.
   - **COURSE_DETAIL now fetches on demand** via `GET /api/courses/:courseId` into a
     `courseDetailCache` (breadcrumb + view read from it) instead of the old in-summary catalogue.
2. `app/student/_views/CertificatesView.tsx`
   - Now **self-fetches** `GET /api/certificates` on mount (loading skeleton while fetching),
     mapping issued + claimable courses into earned/in-progress. No longer receives `certificates`
     from the dashboard, so the heavy completion map is off the dashboard load path.
   - Reloads itself after a package claim.

## Verification

- `apps/api`: `npx tsc --noEmit` ✅, `eslint` on changed files ✅
- `apps/web`: `npx tsc --noEmit` (only pre-existing errors in `admin/courses/new` + `LiveSessionBanner`) ✅
- Full API test suite has pre-existing infra failures unrelated to these changes (pool-size
  connection exhaustion on parallel runs + a pre-existing quiz-message mismatch).

## Notes

- Prisma schema now has new composite indexes; they take effect next time `pnpm prisma:reset` /
  `pnpm prisma:migrate` runs (repo uses `db push`).
- Cleanup pass (2026-08-07): removed the unused `recommended` widget (backend
  `getRecommendedCourses` + summary field + frontend type), the unused `certificate?: any`
  response field in `CertificatesView`, and the ~100-line legacy fallback block in
  `fetchPortalData` (summary failure now just yields an empty core + `failedSections` banner).