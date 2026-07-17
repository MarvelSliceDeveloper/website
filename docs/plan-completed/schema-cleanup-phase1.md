# Plan Completed: Phase 1 — Unused Code Cleanup

**Date**: 2026-07-17
**Status**: COMPLETED

## Summary

Removed 21 dead files, 2 dead shared packages, 7 unused npm dependencies, and cleaned up dead exports/types. No behavior changes — all deletions were confirmed unused via import/usage analysis.

## Changes Made

### Deleted Files (21)

**Student components (5):**
- `apps/web/src/components/Sidebar.tsx` — legacy sidebar, replaced by StudentPortalShell
- `apps/web/src/components/StudentShell.tsx` — imported Sidebar only, never used
- `apps/web/src/components/student/StudentTopNoticeBar.tsx` — never imported
- `apps/web/src/components/student/StudentSectionTabs.tsx` — never imported
- `apps/web/src/components/student/OverdueAssignmentsPanel.tsx` — never imported

**Mentorship components (2):**
- `apps/web/src/components/mentorship/MentorshipTickets.tsx` — duplicate of MentorshipView
- `apps/web/src/components/mentorship/MentorshipRequestModal.tsx` — duplicate of mentorship page

**Course content sidebars (2):**
- `apps/web/src/app/student/_views/_comps/LessonSidebar.tsx` — replaced by inline in CourseContentView
- `apps/web/src/app/student/_views/_comps/SessionSidebar.tsx` — replaced by inline

**Instructor assignments (8):**
- `apps/web/src/app/instructor/assignments/_comps/AssignmentsPageContent.tsx`
- `apps/web/src/app/instructor/assignments/_comps/AssignmentsList.tsx`
- `apps/web/src/app/instructor/assignments/_comps/AssignmentCreateForm.tsx`
- `apps/web/src/app/instructor/assignments/_comps/QuizBuilder.tsx`
- `apps/web/src/app/instructor/assignments/_comps/SubmissionReviewPanel.tsx`
- `apps/web/src/app/instructor/assignments/_comps/types.ts`
- `apps/web/src/app/instructor/assignments/_components/InstructorAssignmentsContent.tsx`
- `apps/web/src/app/instructor/assignments/_components/CreateAssignmentModal.tsx`

**Utilities/UI/pages (4):**
- `apps/web/src/lib/use-session-status.ts` — never imported
- `apps/web/src/lib/toast.ts` — cleaned (kept only `toast` + `getErrorMessage`)
- `apps/web/src/components/ui/dropdown-menu.tsx` — never imported
- `apps/web/src/app/test-page/page.tsx` — unnecessary redirect to /login

### Deleted Packages (2)
- `packages/utils/` — `generateSlug` and `formatCurrency` never imported
- `packages/config/` — `EnvSchema` and `EnvConfig` never imported
- Removed `@lms/config` and `@lms/utils` from `apps/api/package.json`

### Removed npm Dependencies (5 from web, 2 from api)
**apps/web/package.json:**
- `react-icons` — project uses `@tabler/icons-react`
- `recharts` — project uses `react-apexcharts`
- `plyr-react` — project uses `plyr` directly
- `@tiptap/extension-character-count` — never imported
- `@radix-ui/react-dropdown-menu` — dropdown-menu.tsx was dead

**apps/api/package.json:**
- `@lms/config`
- `@lms/utils`

### Cleaned Exports
- `apps/web/src/lib/toast.ts` — removed 7 unused functions (showSuccess, showError, showInfo, showWarning, showLoading, dismissToast, showPromise) and associated types
- `apps/web/src/app/student/_views/_comps/types.ts` — removed dead `Note` interface and `RailTab` type
- `apps/api/src/modules/courses/modules.upload.ts` — removed dead `uploadModuleResource` and `buildModuleResourceUrl` exports, made `MODULE_RESOURCE_FIELD` and `MAX_RESOURCE_BYTES` private

### Empty Directories Removed
- `apps/web/src/app/instructor/assignments/_comps/`
- `apps/web/src/app/instructor/assignments/_components/`
- `apps/web/src/app/test-page/`
- `apps/web/src/components/mentorship/`

## Verification
- `npx tsc --noEmit` — no new errors introduced
- All remaining errors are pre-existing (AssignmentCard.tsx `questionPdfUrl`, lesson.service.ts/module.service.ts Prisma JSON types)
