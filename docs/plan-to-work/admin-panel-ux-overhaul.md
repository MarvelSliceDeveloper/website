# Admin Panel UX Overhaul

## Overview

Multiple UX improvements to the admin panel:

1. User creation flow: package + batch selection during student creation (auto-enroll)
2. Rename "Create" → "Add" across all admin frontend
3. Table styling: square corners, working pagination
4. Users page: package filter, package column, icon-only roles, search icon
5. Search icon after every search bar

---

## Phase 1: Backend — User Creation with Package Enrollment

### 1.1 Add `packageId` to Batch model (schema change)

**File:** `apps/api/prisma/schema.prisma`

- Add optional `packageId String?` to Batch model
- Add `package CoursePackage? @relation(...)` relation
- Add `batches Batch[]` relation to CoursePackage
- Add `@@index([packageId])` for query performance
- Run `prisma db push` to apply

### 1.2 Extend Batch creation to accept optional packageId

**File:** `apps/api/src/modules/batches/batch.service.ts`

- Add optional `packageId` to `CreateBatchSchema`
- When creating a batch with `packageId`, verify the package exists and the course belongs to it
- When listing batches, include package info

### 1.3 Extend `POST /api/users` to accept package enrollment

**File:** `apps/api/src/modules/users/user.routes.ts` (line 46-113)

- Accept optional `packageId` and `courseBatchAssignments` (map of courseId → batchId)
- If `packageId` provided:
  1. Verify package exists and is ACTIVE
  2. Create user
  3. Create `PackageEnrollment` with status `APPROVED`
  4. Create `PackageEnrollmentCourse` records with assigned `batchId`s

### 1.4 Extend `GET /api/users` to include package info + filter

**File:** `apps/api/src/modules/users/user.routes.ts` (line 26-44)

- Include `packageEnrollments` with `coursePackage` name
- Add optional `packageId` query param filter

### 1.5 Add `GET /api/admin/batches/by-package/:packageId` route

**File:** `apps/api/src/modules/batches/batch.routes.ts`

- Given a packageId, return batches grouped by course
- Query: Get courses via `PackageCourse`, find batches for each course
- Response: `{ courses: [{ courseId, courseTitle, batches: [...] }] }`

---

## Phase 2: Frontend — User Creation Form with Package Selection

### 2.1 Update User Create Modal

**File:** `apps/web/src/app/admin/users/page.tsx`

- Add package `<Select>` dropdown (only when role = STUDENT)
- When package selected, fetch batches by package via new API
- Show course-to-batch mapping: for each course in the package, a batch dropdown
- Send `packageId` + `courseBatchAssignments` to `POST /api/users`

### 2.2 Update User table columns

- Extend `User` type with `packageName?: string`
- Add "Package" column BEFORE "Role" column
- Role column: show ONLY icon (remove text label)

### 2.3 Add Package filter chips in users header

- Fetch unique packages from enrolled users
- Add filter chips similar to role filter (before role filter)
- Each chip: package name + count

---

## Phase 3: Table Styling & Pagination

### 3.1 Remove border-radius from DataTable

**File:** `apps/web/src/components/admin/DataTable.tsx`

- Change all `rounded-*` classes to `rounded-none`

### 3.2 Enable pagination on Users page

- Pass `page`, `pageSize`, `totalItems`, `onPageChange` to DataTable
- Reset page on search/filter change

### 3.3 Apply square corners to other hardcoded tables

---

## Phase 4: Rename "Create" → "Add"

All instances across admin pages:

- `admin/users/page.tsx`: "Create User" → "Add User", "Create New User" → "Add New User"
- `admin/batches/page.tsx`: "Create Batch" → "Add Batch"
- `admin/batches/new/page.tsx`: "Create Batch" → "Add Batch"
- `admin/packages/page.tsx`: "Create Package" → "Add Package"
- `admin/packages/new/page.tsx`: "Create Package" → "Add Package"
- `admin/assignment-templates/`: "Create Template" → "Add Template"
- `admin/quiz-templates/`: "Create Template" → "Add Template"
- `admin/settings/api-keys/`: "Create Key" → "Add Key"
- Also update "Creating..." spinner text to "Adding..."

---

## Phase 5: Search Icon

Add `<IconSearch>` to every search input in admin panel:

- `admin/users/page.tsx`
- `admin/batches/page.tsx`
- `admin/packages/page.tsx`
- `admin/packages/enrollments/page.tsx`
- `admin/sessions/page.tsx`
- `admin/enrollments/page.tsx`
- `admin/logs/page.tsx`

Pattern: Wrap input in `relative` div, add `<IconSearch>` absolutely positioned.

---

## Verification

1. `npx tsc --noEmit` in both `apps/api` and `apps/web` — zero errors
2. Tables have square corners, pagination works
3. User creation flow: student → package → batches → submit → enrolled
4. "Add" text everywhere instead of "Create"
5. Search icons visible after all search bars
