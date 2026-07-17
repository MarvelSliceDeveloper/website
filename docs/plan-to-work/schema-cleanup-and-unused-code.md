# Plan: Schema Cleanup + Unused Code Removal

**Date**: 2026-07-17
**Status**: PLANNED

---

## Phase 1: Unused Code Cleanup (Safe — no behavior changes)

### 1a. Delete dead files (21 files)

**Dead student components:**
- `apps/web/src/components/Sidebar.tsx` — legacy sidebar, replaced by StudentPortalShell
- `apps/web/src/components/StudentShell.tsx` — imports Sidebar, never used
- `apps/web/src/components/student/StudentTopNoticeBar.tsx` — never imported
- `apps/web/src/components/student/StudentSectionTabs.tsx` — never imported
- `apps/web/src/components/student/OverdueAssignmentsPanel.tsx` — never imported

**Dead mentorship components:**
- `apps/web/src/components/mentorship/MentorshipTickets.tsx` — never imported (MentorshipView has own impl)
- `apps/web/src/components/mentorship/MentorshipRequestModal.tsx` — never imported

**Dead course content sidebars:**
- `apps/web/src/app/student/_views/_comps/LessonSidebar.tsx` — replaced by inline in CourseContentView
- `apps/web/src/app/student/_views/_comps/SessionSidebar.tsx` — replaced by inline

**Dead instructor assignment components (entire directories):**
- `apps/web/src/app/instructor/assignments/_comps/AssignmentsPageContent.tsx`
- `apps/web/src/app/instructor/assignments/_comps/AssignmentsList.tsx`
- `apps/web/src/app/instructor/assignments/_comps/AssignmentCreateForm.tsx`
- `apps/web/src/app/instructor/assignments/_comps/QuizBuilder.tsx`
- `apps/web/src/app/instructor/assignments/_comps/SubmissionReviewPanel.tsx`
- `apps/web/src/app/instructor/assignments/_comps/types.ts`
- `apps/web/src/app/instructor/assignments/_components/InstructorAssignmentsContent.tsx`
- `apps/web/src/app/instructor/assignments/_components/CreateAssignmentModal.tsx`

**Dead utility files:**
- `apps/web/src/lib/use-session-status.ts` — never imported
- `apps/web/src/lib/toast.ts` — 7 unused exports (showSuccess, showError, etc.), only `toast` and `getErrorMessage` are used. Reduce to just those 2 exports.

**Dead UI component:**
- `apps/web/src/components/ui/dropdown-menu.tsx` — never imported

**Dead test page:**
- `apps/web/src/app/test-page/page.tsx` — redirect to /login, unnecessary

### 1b. Delete dead shared packages

- `packages/utils/src/index.ts` — `generateSlug` and `formatCurrency` never imported from `@lms/utils`
- `packages/config/src/index.ts` — `EnvSchema` and `EnvConfig` never imported from `@lms/config`
- Remove `@lms/config` and `@lms/utils` from `apps/api/package.json` dependencies

### 1c. Remove unused npm dependencies

**From `apps/web/package.json`:**
- `react-icons` — project uses `@tabler/icons-react`
- `recharts` — project uses `react-apexcharts`
- `plyr-react` — project uses `plyr` directly
- `@tiptap/extension-character-count` — not imported
- `@radix-ui/react-dropdown-menu` — dropdown-menu.tsx is dead

**From `apps/api/package.json`:**
- `@lms/config`
- `@lms/utils`

### 1d. Remove dead exports from toast.ts

Keep only `toast` (sonner re-export) and `getErrorMessage`. Remove: `showSuccess`, `showError`, `showInfo`, `showWarning`, `showLoading`, `dismissToast`, `showPromise`.

### 1e. Remove dead types

- `apps/web/src/app/student/_views/_comps/types.ts`: Remove `RailTab` type (line 105) and `Note` interface (line 98) — never imported
- `apps/api/src/modules/courses/modules.upload.ts`: Remove `uploadModuleResource` (line 72) and `buildModuleResourceUrl` (line 78) — exported but never imported

---

## Phase 2: MentorshipTicket Field Dedup

### Problem
`joinUrl`, `scheduledAt`, and `teamsMeetingId` exist on BOTH `MentorshipTicket` AND `LiveSession`. When a mentorship ticket is scheduled, both are written with identical values (ticket.service.ts lines 262-287). The frontend reads these from MentorshipTicket directly.

### Current field usage on MentorshipTicket
| Field | Written by | Read by frontend |
|-------|-----------|-----------------|
| `joinUrl` | ticket.service.ts:264 | MentorshipView.tsx, HomeView.tsx, admin/mentorship, instructor/mentorship |
| `scheduledAt` | ticket.service.ts:262 | MentorshipView.tsx, admin/mentorship, instructor/mentorship |
| `teamsMeetingId` | ticket.service.ts:263 | admin/mentorship, instructor/mentorship |

### Plan
1. **Keep fields on MentorshipTicket** (reading from LiveSession would require N+1 joins or extra queries for every mentorship list). The duplication is acceptable — it's a denormalization for read performance.
2. **Remove `notes` field from MentorshipTicket** — This is NOT duplicated on LiveSession. It's used for mentor resolution notes, which is ticket-specific. KEEP it.
3. **No schema changes needed** — the duplication is intentional denormalization.

**Decision: SKIP Phase 2** — the duplication is justified. No action needed.

---

## Phase 3: Merge Quiz Model into Assignment Model

### Problem
Two competing quiz systems exist:
- **Quiz model** (`Quiz` + `Question` + `QuizAttempt`): Simple, module-scoped, JSON options, no file upload, no manual grading
- **Assignment model** (`Assignment` + `AssignmentQuestion` + `AssignmentMcqOption` + `AssignmentSubmission` + `StudentQuestionResponse`): Rich, course+batch scoped, relational options, file upload, manual grading, notifications

The Assignment model is strictly superior. The Quiz model is redundant.

### Scope
- 11 files reference Quiz model
- 7 API routes to migrate
- 16 Prisma operations to convert
- 5 frontend components to update
- 3 Prisma models to remove (Quiz, Question, QuizAttempt)
- 1 enum to remove (QuizAttemptStatus)
- Data migration needed for existing Quiz records

### Migration Steps

**Step 1: Add `moduleId` as required on Assignment model**
- Currently `moduleId` is optional on Assignment. The Quiz model requires `moduleId`.
- Change to required, or keep optional and ensure all new quiz-type assignments have moduleId set.

**Step 2: Migrate existing Quiz data to Assignment records**
- For each Quiz record, create an Assignment with `type: "QUIZ"`
- Convert each Question to AssignmentQuestion + AssignmentMcqOption records
- Convert each QuizAttempt to AssignmentSubmission + StudentQuestionResponse records

**Step 3: Update API routes**
- Remove Quiz controller/service/routes
- Update admin course builder to create quiz-type Assignments instead of Quizzes
- Update student submission routes to use Assignment endpoints
- Remove `quizSystem` branching from student.service.ts overdue queries

**Step 4: Update frontend**
- CourseContentView: Call Assignment API routes instead of Quiz routes
- QuizOverdueView: Remove `quizSystem` branching, always use Assignment APIs
- Admin QuizCard/AddQuizForm: Create quiz-type Assignments via Assignment endpoints

**Step 5: Update Module model**
- Remove `quizzes Quiz[]` relation from Module
- Ensure `contentOrder` JSON only references Assignment IDs

**Step 6: Remove old models**
- Delete Quiz, Question, QuizAttempt models from schema
- Delete QuizAttemptStatus enum
- Run `prisma db push`

### Risk Assessment
- **HIGH**: Data migration must be perfect — losing quiz data is unacceptable
- **HIGH**: Many files to change simultaneously — must be atomic
- **MEDIUM**: Admin course builder UI changes
- **LOW**: Frontend API call changes (straightforward)

---

## Phase 4: Collapse QuizTemplate into AssignmentTemplate

### Problem
Two template systems exist:
- **QuizTemplate** (`QuizTemplate` + `QuizTemplateQuestion` + `QuizTemplateOption`): Rich, stores questions+options
- **AssignmentTemplate** (`AssignmentTemplate`): Sparse, metadata only (no questions)

### Current usage
- QuizTemplate: 3 backend files, 7 API routes, 10 Prisma operations
- AssignmentTemplate: 3 backend files, 7 API routes, 11 Prisma operations

### Plan
1. Add `questions` relation to AssignmentTemplate (QuizTemplateQuestion + QuizTemplateOption models become AssignmentTemplateQuestion + AssignmentTemplateOption)
2. Update quiz-template controller to use AssignmentTemplate model
3. Update course-template routes to use unified template
4. Remove QuizTemplate, QuizTemplateQuestion, QuizTemplateOption models
5. Remove CourseQuizTemplate join table (use CourseAssignmentTemplate)

---

## Execution Order

1. **Phase 1** (unused code cleanup) — safe, no behavior changes, do first
2. **Phase 3** (Quiz→Assignment merge) — high impact, do after cleanup reduces noise
3. **Phase 4** (QuizTemplate→AssignmentTemplate) — depends on Phase 3 completion

## Verification

After each phase:
1. `npx tsc --noEmit` in both apps/api and apps/web
2. `pnpm lint` from root
3. Manual curl test of affected endpoints
4. `prisma db push` + `prisma generate` after schema changes
