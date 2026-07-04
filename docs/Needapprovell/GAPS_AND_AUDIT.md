# LMS Portal — Gaps & Audit Findings

> Generated: 2026-07-02
> Audit scope: API endpoints, Prisma schema, Web UI pages, feature coverage

---

## Critical Missing Features

| Priority | Feature                            | Impact                                                                                                      |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| CRITICAL | No self-registration / signup page | Users can only be created by admin. No independent student onboarding.                                      |
| CRITICAL | No password reset flow             | No "Forgot Password" — locked-out users have no recovery path.                                              |
| CRITICAL | No payment/checkout UI             | Razorpay installed, `Payment` model exists, but no frontend checkout. Students cannot pay for paid courses. |
| HIGH     | No student quiz-taking interface   | `Quiz`/`Question` models exist but no interactive quiz-taking UI.                                           |
| HIGH     | No student assignment file upload  | `answerFileUrl` field exists but no upload UI for students.                                                 |
| MEDIUM   | No public course catalog           | No landing page for unauthenticated visitors to browse courses.                                             |
| MEDIUM   | No course rating/reviews           | No model or UI for student feedback.                                                                        |
| MEDIUM   | No profile picture upload          | Only initial-letter avatars everywhere.                                                                     |
| LOW      | No discussion forums               | No forum/discussion model.                                                                                  |
| LOW      | No learning paths / curricula      | No curriculum sequencing model.                                                                             |
| LOW      | No gamification                    | No badges, leaderboards, or points.                                                                         |
| LOW      | No audit log (user activity)       | Only Graph API logs exist.                                                                                  |
| LOW      | No bulk user import (CSV)          | Users must be created one-by-one via admin UI.                                                              |
| LOW      | No multi-language / i18n           | English only.                                                                                               |

---

## Prisma Schema Issues

### Missing FK Constraints

| Model         | Field       | Issue                                                                   |
| ------------- | ----------- | ----------------------------------------------------------------------- |
| `Certificate` | `courseId`  | Plain `String` — no relation to `Course` (can reference deleted course) |
| `Note`        | `moduleId`  | Plain `String?` — no relation to `Module`                               |
| `Course`      | `createdBy` | Plain `String?` — no relation to `User`                                 |
| `LiveSession` | `createdBy` | Plain `String` — no relation to `User`                                  |

### Redundant Fields

| Model   | Fields                | Issue                                                             |
| ------- | --------------------- | ----------------------------------------------------------------- |
| `Batch` | `isActive` + `status` | Overlapping — `isActive=true` should always match `status=ACTIVE` |

### Missing Unique Constraints

| Model               | Constraint                   | Risk                            |
| ------------------- | ---------------------------- | ------------------------------- |
| `EnrollmentRequest` | None on `[userId, courseId]` | Duplicate enrollments possible  |
| `Certificate`       | None on `[userId, courseId]` | Duplicate certificates possible |

### Plain Strings Instead of Enums

| Model          | Field                                             | Suggested   |
| -------------- | ------------------------------------------------- | ----------- |
| `Payment`      | `status` (`"created"`, `"paid"`, `"failed"`)      | Prisma enum |
| `Assignment`   | `type` (`"QUIZ"`, `"ASSIGNMENT"`)                 | Prisma enum |
| `Notification` | `type` (`"SESSION_SCHEDULED"`, etc.)              | Prisma enum |
| `Message`      | `entityType` (`"BATCH"`, `"COURSE"`, `"SESSION"`) | Prisma enum |
| `LiveSession`  | `createdFrom` (`"LMS"`, `"TEAMS"`, etc.)          | Prisma enum |

---

## Missing Database Indexes

Indexes missing on foreign keys that are frequently queried (estimated 25+ missing):

| Model               | Missing Index On                       | Query Pattern                    |
| ------------------- | -------------------------------------- | -------------------------------- |
| `Module`            | `courseId`                             | Lookup modules by course         |
| `Batch`             | `courseId`, `instructorId`             | Batches by course / instructor   |
| `EnrollmentRequest` | `userId`, `courseId`, `batchId`        | Enrollments by user/course/batch |
| `LiveSession`       | `batchId`, `instructorId`              | Sessions by batch / instructor   |
| `MentorshipTicket`  | `studentId`                            | Tickets by student               |
| `SupportTicket`     | `userId`                               | Tickets by user                  |
| `SupportMessage`    | `ticketId`                             | Messages by ticket               |
| `Notification`      | `userId` (+ compound `[userId, read]`) | Notifications by user            |
| `Assignment`        | `batchId`                              | Assignments by batch             |
| `Quiz`              | `moduleId`                             | Quizzes by module                |

---

## API Architecture Notes

### Endpoints Handled Inline (No Controller/Service Layer)

These routes do logic directly in the route file rather than a separate controller:

- `users/user.routes.ts` — full CRUD inline
- `courses/student-course.routes.ts` — student catalog/enrolled/content inline
- `enrollments/enrollment.routes.ts` — admin enrollment approval inline

### Shared Ticket Controller

Both `mentorship` and `support` modules reuse the same `ticketController`/`ticketService` with a middleware-set type flag. A generic base `/api/tickets` router is also mounted but largely redundant.

---

## UI Duplication Notes

- **Settings page** is nearly identical across admin, instructor, and student (3 copies).
- **Notification inbox** is similar across roles but separate.
- **Support ticket** flow is split into separate files per role.
