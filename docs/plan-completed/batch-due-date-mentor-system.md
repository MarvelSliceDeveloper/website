# Batch Due Date, Late Penalty & Course Mentor System

## Overview

A complete system for:

1. **Relative due dates** — assignments/quizzes get due dates calculated as `enrollmentDate + N days` (configurable per batch)
2. **Late submission penalty** — configurable percentage deduction (default 25%) for late submissions
3. **Per-student extensions** — admin can extend deadlines for individual students
4. **Course mentors per batch** — assign instructors to specific courses within a package-batch

---

## Phase 1: Database Schema Changes

### Batch Model — New Fields

| Field                          | Type   | Default | Description                                                        |
| ------------------------------ | ------ | ------- | ------------------------------------------------------------------ |
| `defaultDaysToComplete`        | `Int?` | `null`  | Default days-from-enrollment for assignments/quizzes in this batch |
| `lateSubmissionPenaltyPercent` | `Int`  | `25`    | Default late penalty for batch (overridable per item)              |

### Assignment Model — New Fields

| Field                          | Type      | Default | Description                                                                          |
| ------------------------------ | --------- | ------- | ------------------------------------------------------------------------------------ |
| `daysFromEnrollment`           | `Int?`    | `null`  | If set → dueDate = enrollmentDate + daysFromEnrollment; `dueDate` becomes calculated |
| `lateSubmissionPenaltyPercent` | `Int?`    | `null`  | Overrides batch default. `null` = use batch default                                  |
| `allowLateSubmission`          | `Boolean` | `false` | Allow submissions after due date (with penalty)                                      |
| `lateSubmissionGracePeriodHrs` | `Int?`    | `null`  | Optional max hours past due allowed                                                  |

### Quiz Model — New Fields

| Field                          | Type      | Default | Description        |
| ------------------------------ | --------- | ------- | ------------------ |
| `daysFromEnrollment`           | `Int?`    | `null`  | Same as Assignment |
| `lateSubmissionPenaltyPercent` | `Int?`    | `null`  | Same as Assignment |
| `allowLateSubmission`          | `Boolean` | `false` | Same as Assignment |
| `lateSubmissionGracePeriodHrs` | `Int?`    | `null`  | Same as Assignment |

### AssignmentSubmission Model — New Fields

| Field                | Type        | Default | Description                            |
| -------------------- | ----------- | ------- | -------------------------------------- |
| `isLate`             | `Boolean`   | `false` | Was this submitted after the due date? |
| `latePenaltyPercent` | `Int?`      | `null`  | Penalty applied                        |
| `latePenaltyAmount`  | `Int?`      | `null`  | Points deducted                        |
| `originalScore`      | `Int?`      | `null`  | Score before penalty                   |
| `extensionDeadline`  | `DateTime?` | `null`  | Per-student extended deadline          |

### QuizAttempt Model — New Fields

| Field                | Type        | Default | Description                                                |
| -------------------- | ----------- | ------- | ---------------------------------------------------------- |
| `submittedAt`        | `DateTime?` | `null`  | When student submitted (distinct from `createdAt` = start) |
| `isLate`             | `Boolean`   | `false` |                                                            |
| `latePenaltyPercent` | `Int?`      | `null`  |                                                            |
| `latePenaltyAmount`  | `Int?`      | `null`  |                                                            |
| `originalPercentage` | `Float?`    | `null`  | Score before penalty                                       |
| `extensionDeadline`  | `DateTime?` | `null`  |                                                            |

### New Model: `BatchCourseMentor`

```prisma
model BatchCourseMentor {
  id        String   @id @default(cuid())
  batchId   String
  courseId  String
  mentorId  String   // User with INSTRUCTOR role

  batch   Batch  @relation(fields: [batchId], references: [id], onDelete: Cascade)
  course  Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  mentor  User   @relation(fields: [mentorId], references: [id])

  @@unique([batchId, courseId])
  @@index([batchId])
  @@index([mentorId])
}
```

### New Model: `BatchAssignmentExtension`

Extensions are granted at the batch level — when an admin extends a deadline for an assignment/quiz, ALL students in that batch get the extended deadline.

```prisma
model BatchAssignmentExtension {
  id              String   @id @default(cuid())
  batchId         String
  assignmentId    String?  // null if quiz extension
  quizId          String?  // null if assignment extension
  originalDueDate DateTime
  extendedDueDate DateTime
  grantedById     String   // Admin who granted
  reason          String?  @db.Text
  createdAt       DateTime @default(now())

  batch      Batch      @relation(fields: [batchId], references: [id], onDelete: Cascade)
  grantedBy  User       @relation(fields: [grantedById], references: [id])
  assignment Assignment? @relation(fields: [assignmentId], references: [id])
  quiz       Quiz?      @relation(fields: [quizId], references: [id])

  @@unique([batchId, assignmentId])
  @@unique([batchId, quizId])
  @@index([batchId])
}
```

---

## Phase 2: Backend API Changes

### 2.1 Batch CRUD Updates

**`POST /api/admin/batches`** — accept new fields:

- `defaultDaysToComplete` (optional int)
- `lateSubmissionPenaltyPercent` (optional int, default 25)

**`PUT /api/admin/batches/:id`** — accept same fields

### 2.2 Course Builder — Assignment/Quiz API Updates

**`POST /api/admin/courses/modules/:moduleId/assignments`**

- Add `daysFromEnrollment` (optional int)
- Add `lateSubmissionPenaltyPercent` (optional int)
- Add `allowLateSubmission` (boolean)
- Add `lateSubmissionGracePeriodHrs` (optional int)
- If `daysFromEnrollment` is set, `dueDate` becomes calculated; if not, use absolute date as before

**`PUT /api/admin/courses/modules/assignments/:id`** — same fields

**`POST /api/admin/courses/modules/:moduleId/quizzes`** — same fields

**`PUT /api/admin/courses/modules/quizzes/:id`** — same fields

**Backward compatibility**: All new fields optional. Old requests with only `dueDate` continue to work as before.

### 2.3 Due Date Calculation Service

New service: `apps/api/src/services/due-date-calculator.service.ts`

```typescript
function calculateDueDate(
  enrollmentDate: Date,
  daysFromEnrollment: number | null,
  absoluteDueDate: Date | null,
): Date {
  if (daysFromEnrollment) {
    const d = new Date(enrollmentDate);
    d.setDate(d.getDate() + daysFromEnrollment);
    return d;
  }
  return absoluteDueDate ?? new Date(); // fallback
}
```

**Where to call it:**

- When `EnrollmentRequest` is approved → recalculate due dates for all assignments/quizzes in the batch
- When `PackageEnrollment` is approved → same
- When `addStudents` to batch → same
- New assignments/quizzes added AFTER enrollment → calculated on-the-fly when queried

### 2.4 Late Submission Detection & Penalty

**Assignment submission** (`POST /api/assignments/:id/submit/file`):

1. Get student's enrollment date for the batch
2. Calculate effective due date (from `daysFromEnrollment` or absolute `dueDate`)
3. Check `extensionDeadline` on `AssignmentSubmission` (if exists, use that as deadline)
4. If `now > effectiveDueDate`:
   - If `allowLateSubmission` is false → reject submission
   - If `allowLateSubmission` is true → mark `isLate = true`
   - Calculate penalty: `latePenaltyAmount = maxPoints * (latePenaltyPercent / 100)`
   - Store `originalScore`, `latePenaltyPercent`, `latePenaltyAmount`

**Quiz submission** (`POST /api/courses/quizzes/:quizId/submit`):

1. Same logic as above
2. Store `originalPercentage` before penalty
3. Apply penalty to final `percentage` and `score`

### 2.5 Batch-Level Extension API

Extensions are granted at the batch level — when extended, ALL students in the batch get the new deadline.

| Method   | Route                                        | Description                                        |
| -------- | -------------------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/admin/batches/:batchId/extensions`     | Grant batch-level extension for an assignment/quiz |
| `GET`    | `/api/admin/batches/:batchId/extensions`     | List extensions for the batch                      |
| `DELETE` | `/api/admin/batches/:batchId/extensions/:id` | Revoke extension (falls back to original due date) |

Request body:

```json
{
  "assignmentId": "string (optional if quizId)",
  "quizId": "string (optional if assignmentId)",
  "extendedDueDate": "ISO datetime",
  "reason": "string (optional)"
}
```

### 2.6 Batch Course Mentor API

| Method   | Route                                                        | Description                            |
| -------- | ------------------------------------------------------------ | -------------------------------------- |
| `POST`   | `/api/admin/batches/:id/mentors`                             | Assign mentor to a course in the batch |
| `GET`    | `/api/admin/batches/:id/mentors`                             | List mentors for batch                 |
| `DELETE` | `/api/admin/batches/:id/mentors/:mentorId/courses/:courseId` | Remove mentor for a course             |

Request body:

```json
{
  "courseId": "string",
  "mentorId": "string"
}
```

**Effect**: When a mentor is assigned to a batch-course combo, they can:

- View student submissions for that course's assignments
- Grade assignments for that course
- View quiz results for that course

### 2.7 Instructor Dashboard Updates

Instructor's batch view should filter by their mentor assignments (not just `batch.instructorId`).

Extend `batchController.listBatches` to check:

- If user is INSTRUCTOR → return batches where `instructorId = userId` OR `BatchCourseMentor.mentorId = userId`

---

## Phase 3: Frontend Changes

### 3.1 Batch Create/Edit Form

**File:** `apps/web/src/app/admin/batches/new/page.tsx`

Add fields after "Description":

- **Default Days to Complete** — number input, optional (tooltip: "Assignments and quizzes will have due dates calculated as enrollment date + N days")
- **Late Submission Penalty %** — number input, default 25 (tooltip: "Default penalty applied when submitting after due date")

**Edit mode**: The batch detail page (`apps/web/src/app/admin/batches/[id]/page.tsx`) should get an "Edit" button that opens a modal/form with the same fields.

### 3.2 Course Builder Updates

**AddAssignmentForm.tsx** — Add collapse-able "Advanced" section:

- **Due Date Mode**: Radio/select — "Absolute Date" (existing datetime-local) OR "Days from Enrollment" (number input + label "days after student enrolls")
- When "Days from Enrollment" is selected, hide the datetime-local dueDate field
- **Late Submission**: Toggle "Allow Late Submission" (checkbox)
  - If enabled, show "Penalty %" (number, default 25) and "Grace Period (hours)" (number, optional)

**AddQuizForm.tsx** — Same as above

**AssignmentCard.tsx** — Edit mode same fields

**QuizCard.tsx** — Edit mode same fields (note: QuizCard currently missing dueDate in edit — fix this too)

### 3.3 Batch Detail — Course Mentor Tab

**File:** `apps/web/src/app/admin/batches/[id]/page.tsx`

Add a new "Mentors" tab (4th tab):

- Shows a table: Course Name | Mentor Name | Actions (Remove)
- "Add Mentor" dropdown: select course + select instructor
- Only visible for package-level batches (where `packageId` is set)

### 3.4 Batch Detail — Extensions Tab

Add to the batch detail page:

- Shows table: Assignment/Quiz | Course | Original Due Date | Extended Due Date | Granted By | Actions (Revoke)
- "Grant Extension" form: select assignment/quiz from the batch, set new deadline, optional reason
- Extension applies to ALL students in the batch

### 3.5 Student View — Showing Calculated Due Dates

When assignments/quizzes are displayed to students, show the calculated due date (based on enrollment date) rather than the raw `dueDate` from the DB.

**Files affected:**

- `AssignmentOverdueView.tsx` — display calculated due date
- `QuizOverdueView.tsx` — display calculated due date
- `CourseContentView.tsx` — sidebar shows due dates
- `HomeView.tsx` — overdue detection should use calculated dates

### 3.6 Student View — Late Penalty Display

When a student submits late:

- Show warning: "This submission is X days late. A Y% penalty will be applied."
- After grading: show original score, penalty, and final score

---

## Phase 4: Testing & Verification

1. **Create batch** with `defaultDaysToComplete = 10`, `lateSubmissionPenaltyPercent = 25`
2. **Create assignment** with `daysFromEnrollment = 5` → overrides batch default
3. **Enroll student** → assignment due date = enrollment date + 5 days
4. **Student submits after due date** → `isLate = true`, 25% penalty applied
5. **Admin grants batch extension** → all students get new deadline
6. **Assign course mentor** → mentor can see and grade submissions
7. **No batch default** → assignment uses absolute dueDate (backward compatible)

---

## Backward Compatibility

- All new fields are optional in API schemas (Zod `.optional()`)
- Existing assignments without `daysFromEnrollment` use absolute `dueDate` as before
- Existing batches without `defaultDaysToComplete` have no special behavior
- `lateSubmissionPenaltyPercent` defaults to 25 for new items; existing items use `null` (no penalty)
- `allowLateSubmission` defaults to `false` — existing assignments reject late submissions (current behavior)
