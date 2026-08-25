# Plan: TanStack Query Migration

## Goal

Replace hand-rolled `useEffect` + `useState` data loading in `apps/web` with TanStack Query (`useApiQuery` for reads, `useMutation` for writes). Cached reads, uniform loading/error states, automatic background refetch, and `invalidateQueries` instead of manual `loadData()` after mutations.

## Established Pattern

- `apps/web/src/lib/query.ts` — `useApiQuery<T>(queryKey, endpoint, params?, options?)` wrapper routing through `@/lib/api`. Defaults on QueryClient (`providers.tsx`): `staleTime 60s`, `retry 1`, `refetchOnWindowFocus false`.
- Reads: `useApiQuery(["key"], "/endpoint")` → `{ data, isPending, isError, error, refetch }`.
- Writes: `useMutation({ mutationFn, onSuccess })` → `queryClient.invalidateQueries({ queryKey })`.
- Derive display values from query data during render (no `setState` in effect). Keep state only when a handler overrides the query value (e.g. onboarding wizard).

## Scope by Phase

### Phase 1 — Student + Instructor dashboards, all student views

- [x] Instructor dashboard — `apps/web/src/app/instructor/dashboard/page.tsx`
- [x] Student standalone pages:
  - `apps/web/src/app/student/certificates/page.tsx`
  - `apps/web/src/app/student/settings/page.tsx`
  - `apps/web/src/app/student/inbox/page.tsx`
  - `apps/web/src/app/student/notes/page.tsx`
  - `apps/web/src/app/student/support/page.tsx`
- [x] Student `_views` components that fetch on mount: `CertificatesView`, `AssignmentOverdueView`, `QuizOverdueView`, `CourseContentView`, `_comps/AssignmentContent`, `_comps/QuizContent`, `_comps/CertificationExamView`
- [x] Phase 1 sweep: `npx tsc` clean (only 5 pre-existing), eslint 0 errors on `src/app/student/**`, smoke-tested all student/instructor routes (307 = auth guard)

**Phase 1 notes / deliberate decisions:**

- Transient read-on-click flows (QuizOverdueView's question fetch, CourseContentView's `selectQuiz`, CertificationExamView's phase-machine init, AssignmentOverdueView file download) stay as handler-fetched state — they populate ephemeral in-memory sub-views, so `useQuery` adds no caching value and risks behavior changes. Their _writes_ were converted to `useMutation` + `invalidateQueries`.
- Progress saves in CourseContentView (`handleWatchProgress`) are fire-and-forget API posts (telemetry-style, no UI state); the local progress overlay is written via `queryClient.setQueryData` on `["student","course-content",courseId]`.
- `OnboardingWizardView` (wizard form, one-shot profile setup) deferred to Phase 2 sweep — form state, low value.

### Phase 2 — Instructor pages (SLIM — high-value only)

User decision 2026-08-14: skip form-heavy pages (settings/onboarding/notifications/support comps/courses). Convert only list/CRUD/messaging/chart pages.

- [x] `instructor/batches/page.tsx` — `["instructor","batches"]` (shares dashboard key)
- [x] `instructor/sessions/page.tsx` — `["instructor","sessions"]` + 3 mutations; attendance modal stays handler-fetch (transient)
- [x] `instructor/assignments/page.tsx` — `["instructor","assignments"]` + dependent submissions query + grade mutation
- [x] `instructor/analytics/page.tsx` — `["instructor","analytics"]`
- [x] `instructor/inbox/page.tsx` — `["notifications"]` + `["messages","conversations"]`/`["messages","thread",userId]` (shares keys with student inbox)
- [x] `instructor/mentorship/page.tsx` — `["instructor","mentorship-tickets"]` + 3 mutations
- [x] Phase 2 sweep: web tsc only 5 pre-existing, eslint 0 errors on `src/app/instructor/**`, smoke-tested all routes (307 = auth guard)

### Phase 3 — Admin list pages (SLIM — most important only)

User decision 2026-08-14: convert only the most important admin list/CRUD pages. Skip settings/health/audit-logs/static-pages/branding/i18n/cache/trash/etc.

- [x] `admin/certificates/page.tsx` — `["admin","certificates",page]` + `["admin","certificates","stats"]` + `["admin","certificate-templates"]`; revoke/save/default/delete/uploadPdf/removePdf mutations
- [x] `admin/mentorship/page.tsx` — `["admin","mentorship",...]` (tickets/mentors/stats) + 4 modal mutations
- [x] `admin/categories/page.tsx` — `["admin","categories"]` + save/delete mutations
- [x] `admin/tags/page.tsx` — `["admin","tags"]` + save/delete mutations
- [x] `admin/users/page.tsx` — `["admin","users",packageFilter||"all"]` + `["admin","packages"]` + dependent `["admin","batches","by-package",id]`; create/edit/delete mutations; profile viewer stays handler-fetch (transient)
- [x] `admin/courses/page.tsx` — `["admin","courses",status,search,page]` + publish/unpublish/archive mutations (publish keeps `withLoadingToast`)
- [x] `admin/batches/page.tsx` — `["admin","batches",status,search,page]` + delete mutation
- [x] `admin/enrollments/page.tsx` — `["admin","enrollments",status]` + dependent `["admin","batches","all"]` (enabled on modal) + approve/reject mutations
- [x] `admin/inbox/page.tsx` — shares `["notifications"]`; optimistic read/delete/mark-all via `setQueryData`
- [x] `admin/inbox/support/page.tsx` — `["admin","support","tickets"]` + dependent `["admin","support","ticket",id]`; reply/status mutations
- [x] `admin/instructors/page.tsx` — `["admin","instructors",status,search,page]` + verify mutation; added missing `totalStudents` to `ApiRawItem` (API returns it — fixes pre-existing tsc error)
- [x] `admin/approvals/page.tsx` — `["admin","approvals","pending"]` + approve/reject mutations (cache remove); review modal stays handler-fetch (transient)
- [x] `admin/announcements/page.tsx` — `["admin","announcements"]` + packages/batches form queries + send mutation
- [x] Phase 3 sweep: web tsc only 4 pre-existing, eslint 0 on all 13 admin files, smoke-tested all routes (307)

### Phase 4 — Remaining admin pages (ALL — user decision 2026-08-14 "everything left")

All remaining admin pages converted (56 pages + `useReportData` hook). Full per-file list in `working.md`.

- [x] Finance/CRM: `payments`, `refunds`, `refunds/approvals`, `coupons`, `packages`, `packages/enrollments`, `packages/new`, `packages/[id]`
- [x] Templates/review: `assignment-templates`, `assignment-templates/[id]`, `quiz-templates`, `quiz-templates/[id]`, `email-templates`, `assignments/review`
- [x] Users: `users/login-history`, `users/import`
- [x] Sessions: `sessions`, `sessions/new`, `sessions/[sessionId]`, `session-management`
- [x] Analytics/logs: `analytics`, `audit-logs`, `logs`, `logs/stats`, `consent-logs`, `trash`
- [x] Settings/system: `settings`, `settings/api-keys`, `settings/backup`, `settings/permissions`, `settings/system`, `settings/webhooks`, `health`, `maintenance`, `cache`
- [x] Misc: `microsoft`, `branding`, `i18n`, `static-pages`, `notifications/send`, `content`
- [x] Complex: `dashboard`, `courses/new`, `courses/[id]` (course builder + `_components/*`), `batches/new`, `batches/[id]`
- [x] People: `interns`, `interns/assignments`, `interns/schedule`, `instructors/new`, `instructors/[id]`, `instructors/[id]/edit`
- [x] Missed-in-first-scan: `calendar`, `inbox/tickets`, `super-admin` (had API calls despite 0-count scan)
- [x] Shared hook: `lib/report-utils.ts` `useReportData` → current + previous-period `useApiQuery`s (powers `admin/reports*`)
- [x] Phase 4 sweep: web tsc only 3 pre-existing errors (`courses/new` slug fixed during conversion), eslint 0 across all `src/app/admin/**`, all 64 static admin routes smoke-test 307

### Out of scope (skip)

- Pure form pages: `login`, `register`, `set-password`, `forgot-password`, `reset-password`, `catalogue/checkout` flows that are single-shot.

## Rules

- Read-only server data → `useApiQuery`. Every mutation → `useMutation` + `invalidateQueries` (no manual `loadData()`).
- Keep UI state (filters, modals, drafts) in `useState`.
- No `: any`. Follow existing error handling (`getErrorMessage` from `@/lib/toast`).
- After each file: `npx tsc --noEmit` (web) + eslint on the file; expect only the 5 pre-existing errors.
- Update `working.md` before starting each file (recoverable if session is cut off).

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (unchanged suites), smoke test against running dev servers (`pnpm dev`).
