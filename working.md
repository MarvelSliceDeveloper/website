# Working Log — TanStack Query Migration

Live tracker. Update BEFORE starting each file, mark status when done. If a session is cut off, resume from the first `IN PROGRESS`/`PENDING` entry.

## Status legend
- `DONE` — converted + tsc/lint verified
- `IN PROGRESS` — started, not verified
- `PENDING` — not started

## Phase 1 — Student + Instructor dashboards, all student views

| File | Status |
| ---- | ------ |
| `apps/web/src/app/student/page.tsx` (portal dashboard) | DONE (PoC) |
| `apps/web/src/lib/query.ts`, `apps/web/src/app/providers.tsx` | DONE (scaffold) |
| `apps/web/src/app/instructor/dashboard/page.tsx` | DONE |
| `apps/web/src/app/student/certificates/page.tsx` | DONE |
| `apps/web/src/app/student/settings/page.tsx` | DONE |
| `apps/web/src/app/student/inbox/page.tsx` | DONE |
| `apps/web/src/app/student/notes/page.tsx` | DONE |
| `apps/web/src/app/student/support/page.tsx` | DONE |
| `apps/web/src/app/student/_views/CertificatesView.tsx` | DONE |
| `apps/web/src/app/student/_views/AssignmentOverdueView.tsx` | DONE |
| `apps/web/src/app/student/_views/QuizOverdueView.tsx` | DONE |
| `apps/web/src/app/student/_views/CourseContentView.tsx` | DONE |
| `apps/web/src/app/student/_views/_comps/AssignmentContent.tsx` | DONE (no API fetch — download/portal only) |
| `apps/web/src/app/student/_views/_comps/QuizContent.tsx` | DONE |
| `apps/web/src/app/student/_views/_comps/CertificationExamView.tsx` | DONE |
| `apps/web/src/app/student/_views/HomeView.tsx` | DONE (prop-driven; fixed pre-existing Date.now purity errors) |
| `apps/web/src/app/student/_views/OnboardingWizardView.tsx` | PENDING (wizard form; low value — revisit in Phase 2 sweep) |

## Phase 2 — Instructor pages (SLIM — high-value only)
User decision 2026-08-14: skip form-heavy pages (settings/onboarding/notifications/support comps/courses). Convert only list/CRUD/messaging/chart pages.

| File | Status |
| ---- | ------ |
| `instructor/batches/page.tsx` | DONE (shares `["instructor","batches"]` with dashboard) |
| `instructor/sessions/page.tsx` | DONE (3 mutations; attendance modal stays handler-fetch) |
| `instructor/assignments/page.tsx` | DONE (dependent submissions query + grade mutation) |
| `instructor/analytics/page.tsx` | DONE |
| `instructor/inbox/page.tsx` | DONE (shares `["notifications"]` + `["messages",...]` keys with student inbox) |
| `instructor/mentorship/page.tsx` | DONE (3 mutations; `processing` derived from isPending) |

Skipped (form-heavy / low value): `instructor/settings`, `instructor/onboarding`, `instructor/notifications/send`, `instructor/support` (+`_comps/*`), `instructor/courses`.

## Phase 3 — Admin pages (SLIM — most important only)
User decision 2026-08-14: convert only the most important admin list/CRUD pages. Skip settings/health/audit-logs/static-pages/branding/i18n/gdpr/cache/trash/etc.

| File | Status |
| ---- | ------ |
| `admin/certificates/page.tsx` | DONE (2 tabs; stats + templates queries; revoke/save/default/delete/uploadPdf/removePdf mutations) |
| `admin/mentorship/page.tsx` | DONE (3 queries + 4 modal mutations; `isSubmitting` derived) |
| `admin/categories/page.tsx` | DONE (query + save/delete mutations) |
| `admin/tags/page.tsx` | DONE (query + save/delete mutations) |
| `admin/users/page.tsx` | DONE (query keyed on packageFilter + active packages + dependent by-package batch queries + create/edit/delete mutations) |
| `admin/courses/page.tsx` | DONE (query keyed on status/search/page + publish/unpublish/archive mutations) |
| `admin/batches/page.tsx` | DONE (query keyed on status/search/page + delete mutation) |
| `admin/enrollments/page.tsx` | DONE (query keyed on status + dependent batches query gated on modal + approve/reject mutations) |
| `admin/inbox/page.tsx` | DONE (shares `["notifications"]` key; optimistic read/delete/mark-all) |
| `admin/inbox/support/page.tsx` | DONE (dependent ticket query + reply/status mutations) |
| `admin/instructors/page.tsx` | DONE (query + verify mutation; fixed stale `totalStudents` type — API returns it) |
| `admin/approvals/page.tsx` | DONE (query + approve/reject mutations with cache remove; review modal stays handler-fetch) |
| `admin/announcements/page.tsx` | DONE (list/packages/batches queries + send mutation) |

## Phase 4 — Remaining admin pages (ALL — user decision 2026-08-14 "everything left")
Converted every remaining admin page (list/CRUD, complex builders, settings, system, forms) + shared `useReportData` hook. 56 pages + reports hook.

| File | Status |
| ---- | ------ |
| `admin/payments/page.tsx` | DONE (`["admin","payments"]` + revenue stats query) |
| `admin/refunds/page.tsx` | DONE (list + lookup/create mutations; `["auth","me"]` super-admin gate) |
| `admin/refunds/approvals/page.tsx` | DONE (query keyed on tab + approve/reject mutations) |
| `admin/coupons/page.tsx` | DONE (list + create/toggle/delete mutations) |
| `admin/packages/page.tsx` | DONE (query keyed on status + delete mutation) |
| `admin/packages/enrollments/page.tsx` | DONE (list + shared `CourseBatchSelect` child + approve/reject mutations) |
| `admin/packages/new/page.tsx` | DONE (package-names + courses option queries + create mutation) |
| `admin/packages/[id]/page.tsx` | DONE (detail + dependent students/enroll + status/enroll/approve/reject mutations) |
| `admin/assignment-templates/page.tsx` | DONE (list query) |
| `admin/assignment-templates/[id]/page.tsx` | DONE (dependent detail query + save/delete mutations, `isLoading` guard) |
| `admin/quiz-templates/page.tsx` | DONE (list query) |
| `admin/quiz-templates/[id]/page.tsx` | DONE (dependent detail query + save/delete mutations) |
| `admin/email-templates/page.tsx` | DONE (list + save/preview mutations) |
| `admin/assignments/review/page.tsx` | DONE (submissions + stats queries + grade mutation) |
| `admin/users/login-history/page.tsx` | DONE (query keyed on page) |
| `admin/users/import/page.tsx` | DONE (import mutation; CSV parse stays client-side) |
| `admin/sessions/page.tsx` | DONE (list + edit/delete/sync mutations, per-row pending) |
| `admin/sessions/new/page.tsx` | DONE (batches/instructors/modules queries + schedule/upload mutations; fixed TDZ) |
| `admin/sessions/[sessionId]/page.tsx` | DONE (detail + dependent playback/stats/attendance queries, poll via `refetchInterval` + sync mutation) |
| `admin/session-management/page.tsx` | DONE (list + kill/kill-all mutations) |
| `admin/analytics/page.tsx` | DONE (`["admin","analytics"]` query) |
| `admin/audit-logs/page.tsx` | DONE (query keyed on filters/page; `appliedFilters` state) |
| `admin/logs/page.tsx` | DONE (query + `refetchInterval` polling replaces setInterval) |
| `admin/logs/stats/page.tsx` | DONE (query) |
| `admin/consent-logs/page.tsx` | DONE (query keyed on page) |
| `admin/trash/page.tsx` | DONE (list + restore/permanent-delete mutations) |
| `admin/settings/page.tsx` | DONE (preferences/me queries + toggle/update-profile mutations) |
| `admin/settings/api-keys/page.tsx` | DONE (keys + youtube-status queries + create/revoke/reactivate/update mutations) |
| `admin/settings/backup/page.tsx` | DONE (list query + create/restore/delete mutations) |
| `admin/settings/permissions/page.tsx` | DONE (query + save mutation) |
| `admin/settings/system/page.tsx` | DONE (query + per-key save mutation) |
| `admin/settings/webhooks/page.tsx` | DONE (list + save/delete/test/toggle mutations) |
| `admin/health/page.tsx` | DONE (4 composed queries + derived services/status) |
| `admin/maintenance/page.tsx` | DONE (query + toggle mutation) |
| `admin/cache/page.tsx` | DONE (status query + flush mutation with optimistic setQueryData) |
| `admin/microsoft/page.tsx` | DONE (status query; redirect action kept) |
| `admin/branding/page.tsx` | DONE (query + save/logo/favicon mutations) |
| `admin/gdpr/page.tsx` | DONE (enabled search query + anonymize mutation; export stays handler-fetch) |
| `admin/i18n/page.tsx` | DONE (locales + dependent translations queries + save/create mutations) |
| `admin/static-pages/page.tsx` | DONE (list + save/delete mutations; `<a>`→`<Link>`) |
| `admin/notifications/send/page.tsx` | DONE (4 option queries + send mutation, typed payload) |
| `admin/content/page.tsx` | DONE (4 tab queries + save/delete mutations) |
| `admin/dashboard/page.tsx` | DONE (all reads → queries, super-admin/admin/me; root dispatcher from `meQuery`) |
| `admin/courses/new/page.tsx` | DONE (create mutation typed to return `slug` — fixes pre-existing tsc error) |
| `admin/courses/[id]/page.tsx` | DONE (course-builder orchestrator) |
| `admin/courses/[id]/_components/*` | DONE (ContentTab, ModuleCard, LessonCard, AddModuleForm, AddLessonForm, QuizCard, AddQuizForm, AssignmentCard, AddAssignmentForm, ModuleStudyMaterialsSection, SessionsTab, RecordingsTab — reads→queries, writes→mutations; YouTube video-info transient fetch kept) |
| `admin/batches/new/page.tsx` | DONE (option queries + create mutation; fixed TDZ) |
| `admin/batches/[id]/page.tsx` | DONE (detail + tab-gated queries + toggles via optimistic setQueryData) |
| `admin/interns/page.tsx` | DONE (list + fields queries + save/delete field mutations) |
| `admin/interns/assignments/page.tsx` | DONE (sheets + dependent sheet/tabs queries + add/delete mutations; fixed pre-existing lint) |
| `admin/interns/schedule/page.tsx` | DONE (fields + sessions queries + create/delete mutations) |
| `admin/instructors/new/page.tsx` | DONE (create mutation; fixed pre-existing static-components lint) |
| `admin/instructors/[id]/page.tsx` | DONE (detail + me + 5 dependent tab queries + verify mutation) |
| `admin/instructors/[id]/edit/page.tsx` | DONE (detail query + form-populate effect + update mutation) |
| `admin/calendar/page.tsx` | DONE (instructors + sessions queries; events/colorMap derived via useMemo) |
| `admin/inbox/tickets/page.tsx` | DONE (`["admin","mentorship","tickets"]` query) |
| `admin/super-admin/page.tsx` | DONE (health query) |
| `src/lib/report-utils.ts` `useReportData` | DONE (current + previous-period queries, dependent on range) — powers `admin/reports*` |

## Verification baseline
- Web tsc: only 3 pre-existing errors remain (validator.ts inbox/messages, LiveSessionBanner ×2) — `courses/new` slug error was fixed during conversion
- Web eslint: 0 errors across all `src/app/admin/**` + `src/lib/report-utils.ts`
- Dev servers running via `pnpm dev`; API `/health` 200
- Smoke test: all 64 static admin routes → 307 (auth guard)
