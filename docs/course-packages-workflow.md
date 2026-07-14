# Course Packages Workflow - Implementation Plan

## Overview

Replace the current per-course enrollment approval system with a **Package-based enrollment** model. Courses are grouped into packages; admin enrolls students into packages and assigns batches.

## Current Flow (Before)

1. Admin creates individual courses
2. Student browses public catalogue
3. Student pays per course via Razorpay
4. Enrollment request goes to PENDING
5. Admin approves/rejects per-course
6. Student assigned to a batch

## New Flow (After)

1. Admin creates individual courses (unchanged)
2. Admin creates **Packages** (bundles of courses, e.g. "Backend Development")
3. No public catalogue (removed)
4. Admin directly enrolls students into packages (no online payment)
5. Admin assigns batches for each course in the package
6. Student sees all package courses in dashboard

## Prisma Schema Changes

### New Models

```prisma
model CoursePackage {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float    @default(0)
  status      PackageStatus @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  courses     PackageCourse[]
  enrollments PackageEnrollment[]
}

model PackageCourse {
  id        String      @id @default(cuid())
  packageId String
  courseId   String
  order     Int         @default(0)
  package   CoursePackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  course    Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([packageId, courseId])
}

model PackageEnrollment {
  id        String   @id @default(cuid())
  userId    String
  packageId String
  status    EnrollmentStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User         @relation(fields: [userId], references: [id])
  package CoursePackage @relation(fields: [packageId], references: [id])
  courses PackageEnrollmentCourse[]
}

model PackageEnrollmentCourse {
  id           String @id @default(cuid())
  enrollmentId String
  courseId      String
  batchId      String?
  enrollment   PackageEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  course       Course  @relation(fields: [courseId], references: [id])
  batch        Batch?  @relation(fields: [batchId], references: [id])
}

enum PackageStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### Modified Models

- `Course` — add `packageCourses PackageCourse[]`
- `Batch` — add `packageEnrollmentCourses PackageEnrollmentCourse[]`
- `User` — add `packageEnrollments PackageEnrollment[]`

## Backend API

### New Module: `apps/api/src/modules/packages/`

| File                    | Purpose                            |
| ----------------------- | ---------------------------------- |
| `package.routes.ts`     | CRUD routes + enrollment endpoints |
| `package.controller.ts` | Request handlers                   |
| `package.service.ts`    | Business logic                     |
| `package.validation.ts` | Zod schemas                        |

### Endpoints

#### Package Management (Admin)

| Method | Route                            | Description         |
| ------ | -------------------------------- | ------------------- |
| GET    | `/api/admin/packages`            | List all packages   |
| POST   | `/api/admin/packages`            | Create package      |
| GET    | `/api/admin/packages/:id`        | Get package details |
| PUT    | `/api/admin/packages/:id`        | Update package      |
| DELETE | `/api/admin/packages/:id`        | Delete (DRAFT only) |
| PATCH  | `/api/admin/packages/:id/status` | Activate/archive    |

#### Package Enrollments (Admin)

| Method | Route                                        | Description                   |
| ------ | -------------------------------------------- | ----------------------------- |
| POST   | `/api/admin/packages/:id/enroll`             | Enroll student into package   |
| PATCH  | `/api/admin/package-enrollments/:id/approve` | Approve + assign batches      |
| PATCH  | `/api/admin/package-enrollments/:id/reject`  | Reject enrollment             |
| GET    | `/api/admin/package-enrollments`             | List enrollments (filterable) |

#### Student

| Method | Route                   | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/api/student/packages` | Get enrolled packages + courses |

## Frontend Changes

### Admin Sidebar (`AdminSidebar.tsx`)

- Rename "Enrollments" → "Packages"
- Update hrefs to `/admin/packages/*`

### New Pages: `apps/web/src/app/admin/packages/`

| Page                   | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `page.tsx`             | Package list (cards with course count, status)             |
| `new/page.tsx`         | Create package (name, description, multi-course selector)  |
| `[id]/page.tsx`        | Package detail (courses, enrolled students)                |
| `enrollments/page.tsx` | Enrollment requests with approve/reject + batch assignment |

### Remove

- `apps/web/src/app/admin/enrollments/` — redirect to packages
- `apps/web/src/app/catalogue/` — delete entirely

### Student Dashboard

- Update course query to include courses from approved `PackageEnrollment`s

## Execution Order

1. Prisma schema → `prisma db push` + generate
2. Backend validation schemas (Zod)
3. Backend service (CRUD + enrollment)
4. Backend controller + routes
5. Register routes in `routes.ts`
6. Admin sidebar navigation update
7. Admin package pages (list, create, detail)
8. Admin enrollment page (package enrollment + batch assignment)
9. Remove/redirect old enrollment pages
10. Remove catalogue
11. Student dashboard update
12. Typecheck + lint
