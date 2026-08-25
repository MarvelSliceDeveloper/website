# Plan: Remove Assignment Late-Submission Penalty + "Grade" → "Mark"

## Goal

1. Rename the "Grade" column label to "Mark" in the student assignment overdue view.
2. Fully remove the late-submission penalty system (DB fields, admin settings, seed data, instructor penalty UI).
3. Late submissions stay allowed and are accepted silently — no penalty, no notification, no special handling.

## What happens after this change (late submission)

- Student submits an assignment after the due date → submission is accepted exactly like an on-time one (unchanged).
- No penalty % is stored, no points are deducted at grading time, no notification is sent.
- Instructor grades the score as-is; submission is marked GRADED if score >= batch passing score (same rule as on-time submissions). No forced resubmission due to lateness.

## Scope: Full removal

### 1. API — Prisma schema (`apps/api/prisma/schema.prisma`)

Remove fields:

- `Batch.lateSubmissionPenaltyPercent` (line 245)
- `Quiz.lateSubmissionPenaltyPercent`, `Quiz.allowLateSubmission`, `Quiz.lateSubmissionGracePeriodHrs` (471-473)
- `QuizAttempt.isLate`, `latePenaltyPercent`, `latePenaltyAmount`, `originalPercentage` (517-520)
- `Assignment.lateSubmissionPenaltyPercent`, `Assignment.allowLateSubmission`, `Assignment.lateSubmissionGracePeriodHrs` (673-675)
- `AssignmentSubmission.isLate`, `latePenaltyPercent`, `latePenaltyAmount`, `originalScore` (704-707)

Regenerate client: `pnpm prisma:generate`. DB sync via `pnpm prisma:reset` (documented workflow; column drops are destructive so a reset is required).

### 2. API — assignment grading/submission (`assignment.service.ts`)

- `GradeSubmissionSchema`: drop `latePenaltyPercent` (line 23).
- `gradeSubmission()`: drop the `latePenaltyPercent` param and penalty math (333-336); `totalScore = grade`; keep passing-score status rule (GRADED if >= passing); stop writing `originalScore`/`latePenaltyPercent`/`latePenaltyAmount` (349-351).
- `submitFileAnswer()`: drop `lateSubmissionPenaltyPercent` from batch select (370), drop `isLate`/`latePenaltyPercent`/`originalScore`/`latePenaltyAmount` computation + writes (391, 420-421, 428-435). No notification.

### 3. API — controllers/routes/services

- `assignment.controller.ts`: stop parsing/passing `latePenaltyPercent` (112, 118).
- `due-date.service.ts`: delete dead `calculateLatePenalty()` + `LatePenaltyResult` (61-93).
- `batch.service.ts`: drop `lateSubmissionPenaltyPercent` from schemas (40, 55) and create/update writes (122, 211, 476-477).
- `courses/assignment.service.ts` + `courses/quiz.service.ts`: drop the three penalty fields from create/update schemas and data writes.
- No notification changes needed.

### 4. API — seed (`prisma/seed.ts`)

- Remove batch default penalty (637), assignment/quiz penalty options (787, 795), and the penalty option types/writes (1510-1525, 1545-1566, 1582).

### 5. Web — instructor grading UI (`instructor/assignments/page.tsx`)

- Remove `originalScore`/`latePenaltyPercent`/`latePenaltyAmount`/`isLate` from `Submission` type (32-35) and the "Late" badge (246-250).
- Remove `latePenalty` state + its resets (77, 129, 298); stop sending `latePenaltyPercent` in the grade request (123).
- `PassFailPreview`: remove penalty math (56-58).
- Remove the "⚠ Late Submission … Apply a late penalty" block (358-383) and the "Final score (-x% penalty)" hint (399-407).
- Remove the "-{n} late penalty" row (282-286).

### 6. Web — admin forms

- `admin/courses/[id]/_components/types.ts`: remove penalty fields (41-43, 66-68).
- `AssignmentCard.tsx`, `AddAssignmentForm.tsx`, `QuizCard.tsx`, `AddQuizForm.tsx`: remove penalty states/UI/save/reset code and "Late OK (-x%)" badges.
- `admin/batches/new/page.tsx`: remove `lateSubmissionPenaltyPercent` form state, default, submit payload, and input (41, 69, 181-182, 430-431).
- `admin/batches/[id]/page.tsx`: no penalty usage found — no change.

### 7. Web — overdue view rename

- `student/_views/AssignmentOverdueView.tsx:207`: header "Grade" → "Mark". (Grade cell logic unchanged; API field stays `grade`.)

### 8. Tests / verification

- No tests reference penalty fields (confirmed). Run `pnpm test`, `pnpm lint`, `pnpm typecheck` for affected packages, and `pnpm prisma:generate`.

## Files touched

- `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`
- `apps/api/src/modules/assignments/assignment.service.ts`, `assignment.controller.ts`
- `apps/api/src/modules/batches/batch.service.ts`
- `apps/api/src/modules/courses/assignment.service.ts`, `courses/quiz.service.ts`
- `apps/api/src/services/due-date.service.ts`
- `apps/web/src/app/student/_views/AssignmentOverdueView.tsx`
- `apps/web/src/app/instructor/assignments/page.tsx`
- `apps/web/src/app/admin/batches/new/page.tsx`
- `apps/web/src/app/admin/courses/[id]/_components/{types,AssignmentCard,AddAssignmentForm,QuizCard,AddQuizForm}.tsx`

## Notes

- Batch passing-score (pass/fail) logic is kept — it is independent of the late penalty.
- DB reset required after schema changes (destructive).
