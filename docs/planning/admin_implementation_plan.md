# LMS Admin Features — Implementation Plan

> Based on [LMS_Admin_Implementation_Plan.md](file:///d:/Harish%20Kumar/Project/LMS/docs/Overview/LMS_Admin_Implementation_Plan.md) + existing codebase audit.

---

## What We're Reusing (Already Built)

| Existing Asset | Location | Reuse For |
|---|---|---|
| Auth middleware (`requireAuth`, `requireRole`) | [auth.middleware.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/middleware/auth.middleware.ts) | Protect all `/api/admin/*` routes |
| Prisma client singleton | [prisma.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/utils/prisma.ts) | All new services |
| Session service (Teams meetings) | [session.service.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/modules/sessions/session.service.ts) | Extend for generic meeting links |
| Graph API module | [graph/](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/modules/graph) | Teams meeting creation |
| Frontend API client | [api.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/web/src/lib/api.ts) | All frontend API calls |
| Design system (CSS) | [globals.css](file:///d:/Harish%20Kumar/Project/LMS/apps/web/src/app/globals.css) | `.glass-card`, `.btn-primary`, `.field`, etc. |
| Admin layout + sidebar | [admin/layout.tsx](file:///d:/Harish%20Kumar/Project/LMS/apps/web/src/app/admin/layout.tsx), [AdminSidebar.tsx](file:///d:/Harish%20Kumar/Project/LMS/apps/web/src/components/AdminSidebar.tsx) | Add new nav items |
| Zod validation pattern | Auth service | All new API schemas |

---

## Schema Changes Required

> [!IMPORTANT]
> The current Prisma schema needs significant updates before any API work begins.

### Course Model — Add Fields

```diff
 model Course {
   id          String   @id @default(cuid())
   title       String
+  slug        String   @unique
   description String
+  thumbnailUrl  String?
+  coverImageUrl String?
+  status      CourseStatus @default(DRAFT)
   price       Float
-  isPublished Boolean  @default(false)
+  category    String?
+  tags        Json?    // string[]
+  learningObjectives Json? // string[]
+  durationMinutes Int?
+  createdBy   String?
+  publishedAt DateTime?
   modules     Module[]
   batches     Batch[]
+  createdAt   DateTime @default(now())
+  updatedAt   DateTime @updatedAt
 }

+enum CourseStatus {
+  DRAFT
+  PUBLISHED
+  ARCHIVED
+}
```

### Module Model — Add Fields

```diff
 model Module {
   id       String  @id @default(cuid())
   courseId  String
   title    String
+  description String?
   order    Int
+  videoType    String?  // upload | youtube | vimeo | loom | url
+  videoUrl     String?
+  videoEmbedId String?
+  durationSeconds Int?
+  isFreePreview Boolean @default(false)
+  resources    Json?   // [{name, url}]
   course   Course  @relation(fields: [courseId], references: [id])
   sessions LiveSession[]
   quizzes  Quiz[]
 }
```

### Batch Model — Add Fields

```diff
 model Batch {
   id           String  @id @default(cuid())
   courseId      String
   instructorId String
   name         String
   startDate    DateTime
   endDate      DateTime
   isActive     Boolean @default(true)
+  maxStudents  Int?
+  status       BatchStatus @default(UPCOMING)
+  description  String?
   course       Course  @relation(fields: [courseId], references: [id])
   instructor   User    @relation(...)
   enrollments  EnrollmentRequest[]
   sessions     LiveSession[]
 }

+enum BatchStatus {
+  UPCOMING
+  ACTIVE
+  COMPLETED
+}
```

### Shared Types — Fix Mismatches

```diff
// packages/types/src/index.ts
 export enum UserRole {
   STUDENT = 'STUDENT',
   INSTRUCTOR = 'INSTRUCTOR',
   ADMIN = 'ADMIN',
-  SUPER_ADMIN = 'SUPER_ADMIN'
 }

-export enum CoursePlan {
-  FREE = 'FREE',
-  PRO = 'PRO',
-  ENTERPRISE = 'ENTERPRISE'
-}

+export enum CourseStatus {
+  DRAFT = 'DRAFT',
+  PUBLISHED = 'PUBLISHED',
+  ARCHIVED = 'ARCHIVED',
+}

+export enum BatchStatus {
+  UPCOMING = 'UPCOMING',
+  ACTIVE = 'ACTIVE',
+  COMPLETED = 'COMPLETED',
+}
```

---

## Implementation Phases

### Phase 0 — Foundation (Pre-requisite)
**Duration: ~0.5 day**

| # | Task | Type | Details |
|---|---|---|---|
| 0.1 | Update Prisma schema | Backend | Add all new fields to Course, Module, Batch models + new enums |
| 0.2 | Run `prisma migrate dev` | Backend | Generate and apply migration |
| 0.3 | Fix shared types | Shared | Remove `SUPER_ADMIN`, `CoursePlan`; add `CourseStatus`, `BatchStatus` |
| 0.4 | Delete `modules/tenants/` | Backend | Remove leftover empty directory |
| 0.5 | Update AdminSidebar | Frontend | Add nav items: Dashboard, Courses, Batches, Sessions, Users |

**Files touched:**
- `apps/api/prisma/schema.prisma`
- `packages/types/src/index.ts`
- `apps/web/src/components/AdminSidebar.tsx`

---

### Phase 1 — Course CRUD API + Admin Course List Page
**Duration: ~2 days**

#### API: `modules/courses/`

| # | Task | File to Create | Details |
|---|---|---|---|
| 1.1 | Course service | `course.service.ts` | `createCourse`, `listCourses` (with filters: status, category, search), `getCourse`, `updateCourse`, `softDeleteCourse` |
| 1.2 | Course controller | `course.controller.ts` | Request/response handling, Zod validation |
| 1.3 | Course routes | `course.routes.ts` | Mount under `/api/admin/courses` — all routes require `ADMIN` role |
| 1.4 | Mount in index.ts | `src/index.ts` | Import and mount `courseRouter` |

**API Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/courses` | List with filters (status, category, search) |
| `POST` | `/api/admin/courses` | Create new course (returns draft) |
| `GET` | `/api/admin/courses/:id` | Full detail including modules |
| `PUT` | `/api/admin/courses/:id` | Update course fields |
| `DELETE` | `/api/admin/courses/:id` | Soft-delete (set status → ARCHIVED) |

#### Frontend: `/admin/courses`

| # | Task | File to Create | Details |
|---|---|---|---|
| 1.5 | Course list page | `app/admin/courses/page.tsx` | Table with: title, thumbnail, status badge, module count, enrolled students, last updated, actions (Edit/Delete) |
| 1.6 | Create course modal/page | `app/admin/courses/new/page.tsx` | Form: title, description, category, price — creates draft |

**Pattern:** Follow the existing controller→service→prisma pattern from [session.service.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/modules/sessions/session.service.ts).

---

### Phase 2 — Module (Lesson) CRUD + Course Detail Page
**Duration: ~1.5 days**

#### API: Add to `modules/courses/`

| # | Task | File | Details |
|---|---|---|---|
| 2.1 | Module service | `module.service.ts` | `addModule`, `updateModule`, `deleteModule`, `reorderModules` |
| 2.2 | Module controller | `module.controller.ts` | Handle module CRUD |
| 2.3 | Module routes | Add to `course.routes.ts` | Nested under course routes |

**API Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/courses/:id/modules` | Add module to course |
| `PUT` | `/api/admin/modules/:id` | Update module |
| `DELETE` | `/api/admin/modules/:id` | Delete module |
| `PATCH` | `/api/admin/courses/:id/modules/reorder` | Save new sort order (array of IDs) |

#### Frontend: `/admin/courses/[id]`

| # | Task | File to Create | Details |
|---|---|---|---|
| 2.4 | Course detail/edit page | `app/admin/courses/[id]/page.tsx` | Left: course form fields. Right: module list with drag-to-reorder |
| 2.5 | Module form component | `components/admin/ModuleForm.tsx` | Add/edit module: title, description, video type, video URL |
| 2.6 | Drag-and-drop module list | `components/admin/ModuleList.tsx` | Uses `@dnd-kit/sortable` for reordering |

**New dependency:** `@dnd-kit/core`, `@dnd-kit/sortable`

---

### Phase 3 — Video Embedding
**Duration: ~1.5 days**

#### API: Upload Endpoints

| # | Task | File to Create | Details |
|---|---|---|---|
| 3.1 | Upload service | `modules/uploads/upload.service.ts` | S3 presigned URL generation, video URL parsing (YouTube/Vimeo/Loom → embed ID) |
| 3.2 | Upload controller | `modules/uploads/upload.controller.ts` | Handle presign requests |
| 3.3 | Upload routes | `modules/uploads/upload.routes.ts` | `POST /api/admin/uploads/presign`, `DELETE /api/admin/uploads` |
| 3.4 | Video URL parser utility | `src/utils/videoParser.ts` | Extract embed IDs from YouTube, Vimeo, Loom URLs |

**API Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/uploads/presign` | Get S3 presigned PUT URL (15 min expiry) |
| `DELETE` | `/api/admin/uploads` | Delete file from S3 by URL |

#### Frontend: Video Components

| # | Task | File to Create | Details |
|---|---|---|---|
| 3.5 | Unified video player | Update [VideoPlayer.tsx](file:///d:/Harish%20Kumar/Project/LMS/apps/web/src/components/VideoPlayer.tsx) | Support YouTube/Vimeo/Loom iframes + HTML5 `<video>` for S3 uploads |
| 3.6 | Video upload component | `components/admin/VideoUpload.tsx` | Drag-drop file upload with progress bar → presigned S3 upload |
| 3.7 | Video URL input | `components/admin/VideoUrlInput.tsx` | Paste URL → auto-detect type → show preview |

**New dependencies:** `react-dropzone`, `@aws-sdk/s3-request-presigner` (backend)

---

### Phase 4 — Course Designer + Publish Workflow
**Duration: ~2 days**

#### API: Publish Endpoints

| # | Task | Details |
|---|---|---|
| 4.1 | Publish/unpublish service methods | Add to `course.service.ts`: `publishCourse` (with pre-publish validation), `unpublishCourse` |
| 4.2 | Publish routes | `POST /api/admin/courses/:id/publish`, `POST /api/admin/courses/:id/unpublish` |

#### Frontend: Course Designer

| # | Task | File to Create | Details |
|---|---|---|---|
| 4.3 | Thumbnail uploader | `components/admin/ThumbnailUploader.tsx` | Drag-drop + image crop (16:9) → S3 upload |
| 4.4 | Rich text editor | `components/admin/RichTextEditor.tsx` | TipTap v2 — bold, lists, links, code blocks |
| 4.5 | Learning objectives editor | `components/admin/ObjectivesEditor.tsx` | Add/remove bullet points |
| 4.6 | Category & tags input | `components/admin/TagsInput.tsx` | Dropdown category + free-form tag input |
| 4.7 | Pre-publish checklist modal | `components/admin/PublishChecklist.tsx` | Validates: title, ≥1 module, ≥1 video, thumbnail, description |
| 4.8 | Course preview mode | `app/admin/courses/[id]/preview/page.tsx` | Read-only student view of the course |

**New dependencies:** `@tiptap/react`, `@tiptap/starter-kit`, `react-image-crop`, `react-select`

---

### Phase 5 — Batch Management
**Duration: ~1.5 days**

#### API: `modules/batches/`

| # | Task | File to Create | Details |
|---|---|---|---|
| 5.1 | Batch service | `batch.service.ts` | CRUD + `addStudents`, `removeStudent`, `importStudentsCSV` |
| 5.2 | Batch controller | `batch.controller.ts` | Handle batch operations |
| 5.3 | Batch routes | `batch.routes.ts` | Mount under `/api/admin/batches` |
| 5.4 | CSV parser utility | `src/utils/csvParser.ts` | Parse CSV with student emails for bulk import |

**API Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/batches` | List batches (filter by course, status) |
| `POST` | `/api/admin/batches` | Create batch (linked to course) |
| `PUT` | `/api/admin/batches/:id` | Update batch details |
| `DELETE` | `/api/admin/batches/:id` | Delete batch |
| `GET` | `/api/admin/batches/:id/students` | List students in batch |
| `POST` | `/api/admin/batches/:id/students` | Add students (array of user IDs) |
| `DELETE` | `/api/admin/batches/:id/students/:uid` | Remove student |
| `POST` | `/api/admin/batches/:id/import` | Bulk import via CSV |

#### Frontend: `/admin/batches`

| # | Task | File to Create | Details |
|---|---|---|---|
| 5.5 | Batch list page | `app/admin/batches/page.tsx` | Table: name, course, status, student count, dates, actions |
| 5.6 | Create batch page | `app/admin/batches/new/page.tsx` | Form: course select, name, dates, max students, instructor |
| 5.7 | Batch detail page | `app/admin/batches/[id]/page.tsx` | Students tab + Sessions tab |
| 5.8 | Student assignment component | `components/admin/StudentAssignment.tsx` | Search students, multi-select, CSV upload |

**New dependency:** `csv-parse` (backend)

---

### Phase 6 — Admin Session Scheduling
**Duration: ~1 day**

#### API: Extend Sessions

| # | Task | Details |
|---|---|---|
| 6.1 | Add admin session endpoints | Extend existing session routes or create admin-specific routes for batch-scoped session management |
| 6.2 | Add recording URL patch | `PATCH /api/admin/sessions/:id/recording` — add recording URL after session |

**Reuses:** Existing [session.service.ts](file:///d:/Harish%20Kumar/Project/LMS/apps/api/src/modules/sessions/session.service.ts) — already handles Teams meeting creation, listing, updating.

#### Frontend: `/admin/sessions`

| # | Task | File to Create | Details |
|---|---|---|---|
| 6.3 | Admin sessions page | `app/admin/sessions/page.tsx` | Calendar view (FullCalendar) + list view toggle |
| 6.4 | Create session modal | `components/admin/CreateSessionModal.tsx` | Select batch, title, date/time, platform, meeting link |
| 6.5 | Session calendar component | `components/admin/SessionCalendar.tsx` | Monthly/weekly calendar view |

**New dependency:** `@fullcalendar/react`, `@fullcalendar/daygrid`

---

### Phase 7 — Admin Dashboard + Users + Cleanup
**Duration: ~1 day**

#### API: Users Module

| # | Task | File to Create | Details |
|---|---|---|---|
| 7.1 | User service | `modules/users/user.service.ts` | `listUsers`, `getUserById`, `updateUserRole` |
| 7.2 | User controller + routes | `user.controller.ts`, `user.routes.ts` | CRUD for user management |

#### Frontend: Admin Dashboard + Users

| # | Task | File to Create | Details |
|---|---|---|---|
| 7.3 | Admin dashboard | `app/admin/dashboard/page.tsx` | Stats: total courses, students, active batches, revenue |
| 7.4 | User management page | `app/admin/users/page.tsx` | Table with role badges, search, role change |
| 7.5 | Update login redirect | `app/login/page.tsx` | Admin → `/admin/dashboard` instead of `/admin/mentorship` |
| 7.6 | Update AdminSidebar | `AdminSidebar.tsx` | Final nav with all pages |

---

## File Tree — All New Files

```
apps/api/src/
├── modules/
│   ├── courses/
│   │   ├── course.routes.ts          ← Phase 1
│   │   ├── course.controller.ts      ← Phase 1
│   │   ├── course.service.ts         ← Phase 1
│   │   ├── module.controller.ts      ← Phase 2
│   │   └── module.service.ts         ← Phase 2
│   ├── batches/
│   │   ├── batch.routes.ts           ← Phase 5
│   │   ├── batch.controller.ts       ← Phase 5
│   │   └── batch.service.ts          ← Phase 5
│   ├── uploads/
│   │   ├── upload.routes.ts          ← Phase 3
│   │   ├── upload.controller.ts      ← Phase 3
│   │   └── upload.service.ts         ← Phase 3
│   └── users/
│       ├── user.routes.ts            ← Phase 7
│       ├── user.controller.ts        ← Phase 7
│       └── user.service.ts           ← Phase 7
├── utils/
│   ├── videoParser.ts                ← Phase 3
│   └── csvParser.ts                  ← Phase 5

apps/web/src/
├── app/admin/
│   ├── dashboard/page.tsx            ← Phase 7
│   ├── courses/
│   │   ├── page.tsx                  ← Phase 1
│   │   ├── new/page.tsx              ← Phase 1
│   │   └── [id]/
│   │       ├── page.tsx              ← Phase 2
│   │       └── preview/page.tsx      ← Phase 4
│   ├── batches/
│   │   ├── page.tsx                  ← Phase 5
│   │   ├── new/page.tsx              ← Phase 5
│   │   └── [id]/page.tsx             ← Phase 5
│   ├── sessions/page.tsx             ← Phase 6
│   └── users/page.tsx                ← Phase 7
├── components/admin/
│   ├── ModuleForm.tsx                ← Phase 2
│   ├── ModuleList.tsx                ← Phase 2
│   ├── VideoUpload.tsx               ← Phase 3
│   ├── VideoUrlInput.tsx             ← Phase 3
│   ├── ThumbnailUploader.tsx         ← Phase 4
│   ├── RichTextEditor.tsx            ← Phase 4
│   ├── ObjectivesEditor.tsx          ← Phase 4
│   ├── TagsInput.tsx                 ← Phase 4
│   ├── PublishChecklist.tsx          ← Phase 4
│   ├── StudentAssignment.tsx         ← Phase 5
│   ├── CreateSessionModal.tsx        ← Phase 6
│   └── SessionCalendar.tsx           ← Phase 6
```

---

## Dependencies to Install

| Package | Phase | Where | Purpose |
|---|---|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | 2 | Frontend | Module drag-to-reorder |
| `react-dropzone` | 3 | Frontend | File upload drag-drop |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | 3 | Backend | S3 presigned URLs |
| `@tiptap/react` + `@tiptap/starter-kit` | 4 | Frontend | Rich text editor |
| `react-image-crop` | 4 | Frontend | Thumbnail 16:9 crop |
| `react-select` | 4 | Frontend | Category/tag selection |
| `csv-parse` | 5 | Backend | CSV student import |
| `@fullcalendar/react` + `@fullcalendar/daygrid` | 6 | Frontend | Session calendar |

---

## Execution Order Summary

| Phase | What | Est. | Cumulative |
|---|---|---|---|
| **0** | Schema migration + sidebar + type fixes | 0.5 day | 0.5 day |
| **1** | Course CRUD API + admin course list | 2 days | 2.5 days |
| **2** | Module CRUD + course detail + drag reorder | 1.5 days | 4 days |
| **3** | Video embedding (S3 upload + URL parsing + player) | 1.5 days | 5.5 days |
| **4** | Course designer + publish workflow | 2 days | 7.5 days |
| **5** | Batch management (CRUD + students + CSV) | 1.5 days | 9 days |
| **6** | Admin session scheduling + calendar | 1 day | 10 days |
| **7** | Dashboard + users + cleanup | 1 day | **11 days** |

> [!NOTE]
> Each phase is independently deployable and testable. Phase 0 must be done first; Phases 1–4 must be sequential (course → modules → video → publish). Phases 5–7 can be parallelized.
