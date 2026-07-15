# Known Bugs & Issues

This directory tracks known bugs and issues discovered during development and code review.

## Fixed Bugs

See [CHANGELOG.md](../CHANGELOG.md) for resolved issues.

## Open Issues

### MODERATE — Catalogue `isEnrolled` doesn't check package enrollments for rejected/other statuses

- **File:** `apps/api/src/modules/courses/student-course.routes.ts`
- **Description:** The `/catalogue` endpoint now checks `PackageEnrollmentCourse` for `APPROVED` status, but only for `isEnrolled` display. If a student had a `PENDING` package enrollment for a course, they could still submit an individual enrollment request (since the check in `POST /enroll` now properly prevents this). This is mostly correct now, but worth noting.

### LOW — Course creation form doesn\'t validate slug uniqueness

- **Area:** Course creation/admin routes
- **Description:** There is no server-side validation that a course slug is unique before creation. If two courses have the same slug, URL routes may conflict.

### LOW — No pagination on admin enrollment list endpoints

- **Files:** `apps/api/src/modules/enrollments/enrollment.routes.ts`, `apps/api/src/modules/packages/package.service.ts`
- **Description:** Both `GET /api/admin/enrollments` and `GET /api/admin/package-enrollments` return all records without pagination. With many enrollments, this could cause performance issues.

### LOW — EnrollmentRequest table has no direct Course relation

- **File:** `apps/api/prisma/schema.prisma` — `EnrollmentRequest` model
- **Description:** The `EnrollmentRequest` model stores `courseId` as a plain String field without a Prisma relation to the `Course` model. This means course title lookups require a separate query (as seen in `enrollment.routes.ts:39-44`). Adding a proper relation would simplify queries and allow cascading operations.
