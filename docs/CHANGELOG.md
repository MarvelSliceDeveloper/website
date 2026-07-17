# Changelog

## 2026-07-17 - Quiz System Consolidation

### Removed

- **Assignment model quiz creation path eliminated.** Removed `createQuiz()`, `CreateQuizSchema`, `SubmitMcqAnswersSchema`, `submitMcqAnswers()`, and `getAssignmentQuestions()` from `assignments/assignment.service.ts`. Quizzes are now created exclusively via the Quiz model (`POST /api/admin/courses/modules/:moduleId/quizzes`).
- **Assignment MCQ routes removed.** Removed `GET /api/assignments/:id/questions` and `POST /api/assignments/:id/submit/mcq` from routes and controller. Quiz MCQ submission now only goes through Quiz model routes (`/api/courses/quizzes/:id/submit`).
- **`quizSystem` field removed.** The `quizSystem: "QUIZ_MODEL" | "ASSIGNMENT_MODEL"` discriminator was removed from `OverdueAssignmentItem` (API), `OverdueAssignment` (frontend type), and all `result.push()` calls in `student.service.ts`. Quizzes always use Quiz model routes; assignments always use Assignment model file upload.
- **QuizOverdueView simplified.** Removed all `quizSystem` branching — `handleStartQuiz()`, `handleViewResult()`, and `handleSubmitMcq()` now always use Quiz model API routes (`/api/courses/quizzes/:id/...`).

### Changed

- **Assignment model is now file-upload only.** The `POST /api/assignments/` route now only accepts `CreateFileAssignmentSchema` (PDF questions, file-upload answers). The `type: "QUIZ"` creation path was removed.
- **Remaining assignment routes:** `POST /` (file assignment creation), `POST /upload-pdf`, `GET /` (list), `POST /:id/submit/file`, `GET /submissions/:id/result`, `GET /:id/submissions`, `POST /submissions/:id/grade`.

## 2026-07-17 - Unused Code Cleanup (Phase 1)

### Removed

- **21 dead files deleted.** Legacy student components (Sidebar.tsx, StudentShell.tsx, StudentTopNoticeBar.tsx, StudentSectionTabs.tsx, OverdueAssignmentsPanel.tsx), duplicate mentorship components (MentorshipTickets.tsx, MentorshipRequestModal.tsx), replaced course content sidebars (LessonSidebar.tsx, SessionSidebar.tsx), orphaned instructor assignment components (8 files across _comps/ and _components/), dead utilities (use-session-status.ts, dropdown-menu.tsx), and unnecessary test-page redirect.
- **2 dead shared packages deleted.** `packages/utils/` (generateSlug, formatCurrency — never imported) and `packages/config/` (EnvSchema, EnvConfig — never imported). Removed `@lms/config` and `@lms/utils` from api/package.json.
- **7 unused npm dependencies removed.** From web: `react-icons`, `recharts`, `plyr-react`, `@tiptap/extension-character-count`, `@radix-ui/react-dropdown-menu`. From api: `@lms/config`, `@lms/utils`.
- **Dead exports cleaned.** `toast.ts` reduced to 2 exports (toast, getErrorMessage) from 9. Dead types `Note` and `RailTab` removed from student types. Dead `uploadModuleResource` and `buildModuleResourceUrl` removed from modules.upload.ts.
- **4 empty directories removed.** `instructor/assignments/_comps/`, `instructor/assignments/_components/`, `test-page/`, `components/mentorship/`.

## 2026-07-17 - Cross-Type DnD, Quiz Fixes & Overdue Pipeline Fix

### Added

- **Cross-type drag-and-drop reordering.** Admins can now freely mix lessons, quizzes, and assignments in any order within a module via drag-and-drop. The ordering is stored as a JSON `contentOrder` field on the Module model and respected in both admin and student views. (`apps/api/prisma/schema.prisma`, `apps/api/src/modules/courses/module.service.ts`, `apps/web/src/app/admin/courses/[id]/_components/ModuleCard.tsx`)
- **`PATCH /api/admin/courses/modules/:moduleId/content/reorder`** endpoint. Accepts `{ items: [{type, id}] }` and validates all IDs belong to the target module. (`apps/api/src/modules/courses/module.controller.ts`, `apps/api/src/modules/courses/course.routes.ts`)
- **`ContentOrderItem` type** added to both admin and student type definitions. (`apps/web/src/app/admin/courses/[id]/_components/types.ts`, `apps/web/src/app/student/_views/_comps/types.ts`)
- **`QuizAttemptStatus` enum** (`PENDING | SUBMITTED | GRADED`) and `status` field on `QuizAttempt` model. (`apps/api/prisma/schema.prisma`)
- **Assignment `order` field** added to the Assignment model for future ordering. (`apps/api/prisma/schema.prisma`)
- **Quiz Next/Submit button at bottom of active phase.** Students now see a green Submit button on the last question instead of only the inline submit in the question card. (`apps/web/src/app/student/_views/_comps/QuizContent.tsx`)
- **`passingPercentage={60}` prop** passed to QuizContent from CourseContentView. (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **`buildUnifiedList()` helper** in both admin ModuleCard and student CourseContentView. Renders lessons, quizzes, and assignments in `contentOrder` sequence with backward-compat fallback. (`apps/web/src/app/admin/courses/[id]/_components/ModuleCard.tsx`, `apps/web/src/app/student/_views/CourseContentView.tsx`)

### Changed

- **Student sidebar now respects `contentOrder`.** The course content accordion renders items in the admin-defined mixed sequence instead of always showing lessons → quizzes → assignments. (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Student Previous/Next navigation follows unified order.** Navigation buttons now cycle through all content types in `contentOrder` sequence, including cross-module transitions. Counter shows "Item X of Y" instead of "Lesson X of Y". (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Student content API returns `contentOrder`.** The `GET /api/courses/:courseId/content` endpoint now includes the `contentOrder` JSON field in its module response. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **CRUD hooks maintain `contentOrder`.** Adding or deleting a lesson, quiz, or assignment now appends to / removes from the module's `contentOrder` array automatically. (`apps/api/src/modules/courses/lesson.service.ts`, `quiz.service.ts`, `assignment.service.ts`)
- **Admin `ModuleCard` rewritten** with unified `buildUnifiedList()`, single `contentDragIdx`/`contentOverIdx` state, and `handleContentDrop()` calling the new reorder API. (`apps/web/src/app/admin/courses/[id]/_components/ModuleCard.tsx`)
- **Quiz/Assignment error handling.** `QuizCard.tsx`, `AddQuizForm.tsx`, and `handleSubmitQuiz` now `console.error` + show real error messages via `toast.error()`. (`apps/web/src/app/admin/courses/[id]/_components/QuizCard.tsx`, `AddQuizForm.tsx`, `apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Fixed duplicate "Result Page" text** in quiz navigator. (`apps/web/src/app/student/_views/_comps/QuizContent.tsx`)

### Fixed

- **CRITICAL: Overdue assignments and continue learning showed empty.** `getOverdueAssignments()` and `getContinueLearning()` in `student.service.ts` queried the `EnrollmentRequest` table (zero records for package-enrolled students) instead of `PackageEnrollment` → `PackageEnrollmentCourse`. Rewrote both methods to use the correct enrollment tables. (`apps/api/src/modules/courses/student.service.ts`)

### Extracted

- **QuizContent, AssignmentContent, StudyMaterialContent** extracted from CourseContentView into `_comps/` directory for maintainability. (`apps/web/src/app/student/_views/_comps/QuizContent.tsx`, `AssignmentContent.tsx`, `StudyMaterialContent.tsx`)

## 2026-07-16 - Admin Course Builder Improvements

### Added

- **Admin course detail page refactored.** Split 1485-line monolith into 10 focused components under `_components/`. (`apps/web/src/app/admin/courses/[id]/`)
- **Quiz inline creation.** Admins can now create quizzes with multiple questions and options directly in the course builder. (`apps/web/src/app/admin/courses/[id]/_components/AddQuizForm.tsx`, `QuizCard.tsx`)
- **Assignment inline creation.** Admins can now create assignments with title, type, description, due date, and max points directly in the course builder. (`apps/web/src/app/admin/courses/[id]/_components/AddAssignmentForm.tsx`, `AssignmentCard.tsx`)
- **Quiz/Assignment API endpoints.** Added CRUD routes for quizzes and assignments linked to modules. (`apps/api/src/modules/courses/quiz.service.ts`, `quiz.controller.ts`, `assignment.service.ts`, `assignment.controller.ts`)
- **Study materials lesson selector.** Admins can now select which lesson to upload resources to instead of always targeting the first lesson. (`apps/web/src/app/admin/courses/[id]/_components/ModuleStudyMaterialsSection.tsx`)
- **isFreePreview toggle.** Added checkbox to lesson and module creation forms to mark content as free preview. (`apps/web/src/app/admin/courses/[id]/_components/LessonCard.tsx`, `AddLessonForm.tsx`, `AddModuleForm.tsx`)
- **Tags and learning objectives.** Course details form now supports adding/removing tags and learning objectives. (`apps/web/src/app/admin/courses/[id]/_components/CourseDetailsTab.tsx`)
- **Better delete confirmations.** Delete actions now show descriptive warnings about what will be removed.

### Changed

- **Course content API includes quizzes/assignments.** Admin course detail endpoint now returns full quiz and assignment data per module. (`apps/api/src/modules/courses/course.service.ts`)
- **Student sidebar shows study materials.** Files uploaded to lessons now appear in the student sidebar with `IconFile` (emerald). (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Module item count.** Now counts lessons + quizzes + assignments instead of just lessons.

## 2026-07-16 - Sidebar Type-Specific Icons

### Added

- **Type-specific icons in course content sidebar.** Each content type now has a distinct icon: video lessons use `IconPlayerPlay`, quizzes use `IconClipboardCheck` (amber), assignments use `IconFileSpreadsheet` (blue). (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Quiz items in sidebar.** Modules now display their quizzes in the sidebar with question count. (`apps/web/src/app/student/_views/CourseContentView.tsx`)
- **Assignment items in sidebar.** Modules now display their linked assignments in the sidebar with due date. (`apps/web/src/app/student/_views/CourseContentView.tsx`)

### Changed

- **`Assignment` model now has optional `moduleId`.** Assignments can be linked to a specific module within a course. Existing assignments without a `moduleId` will not appear in the sidebar. (`apps/api/prisma/schema.prisma`)
- **Course content API response.** `GET /api/courses/:courseId/content` now returns `quizzes` (with question count) and `assignments` per module instead of `hasQuiz: boolean`. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **Module header text.** Changed from "{n} lectures" to "{n} items" to reflect all content types. (`apps/web/src/app/student/_views/CourseContentView.tsx`)

## 2026-07-15 - Enrollment & Content Access Fixes

### Fixed

- **CRITICAL: Course content 403 for package-enrolled students**. The `GET /api/courses/:courseId/content` endpoint only checked the `EnrollmentRequest` table for approved status. If a student was enrolled via a package (`PackageEnrollmentCourse`), they got a 403 even though the admin correctly saw "APPROVED". Now checks both `EnrollmentRequest` and `PackageEnrollmentCourse` before returning content. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **CRITICAL: No admin UI for individual enrollment approvals**. The `/admin/enrollments` page was just a redirect to `/admin/packages/enrollments`, making it impossible for admins to approve individual `EnrollmentRequest` records through the UI. Replaced with a full approval management page (status filters, approve/reject with batch assignment modal). (`apps/web/src/app/admin/enrollments/page.tsx`)
- **MODERATE: Deduplication order inverted**. The `/enrolled` endpoint comment said "prefer individual enrollment" but the spread order `[...packageCourses, ...individualCourses]` made package courses win. Fixed to `[...individualCourses, ...packageCourses]`. (`apps/api/src/modules/courses/student-course.routes.ts`)
- **MODERATE: No notifications for package enrollment approval/rejection**. Unlike individual enrollments, package enrollment approval/rejection sent no in-app notification or email to the student. Added `notificationService.create()` and `dispatchEmailsForNotification()` calls in both `approveEnrollment` and `rejectEnrollment`. (`apps/api/src/modules/packages/package.service.ts`)
- **LOW: Hardcoded "PENDING" status for enrollments without batch**. The `/enrolled` endpoint hardcoded `status: "PENDING"` for enrollments where `!e.batch`, even if the actual DB status was `APPROVED` or `REJECTED`. Now uses the actual status from the database. (`apps/api/src/modules/courses/student-course.routes.ts`)

## 2026-07-15 - Package-Only Batch Refactor

### Changed

- **`Batch.courseId` is now nullable.** One batch can represent an entire package cohort
  (`courseId: null`, `packageId` set) instead of one batch per course. The admin "Add New Batch"
  form creates **one batch** for the whole package (not N batches). Course membership is
  derived from `PackageCourse` records.
- **`LiveSession.courseId` added.** Admins can directly pick which course within a package
  a live session belongs to, enabling per-course session filtering in the student dashboard.
- **`POST /api/admin/batches` can now create either a single batch** (when `courseId`
  is provided — direct API usage) **or one batch for the whole package** (when only `packageId`
  is provided — used by the admin form). The old `POST /api/admin/batches/bulk` endpoint
  was removed; its logic was folded into the single create endpoint.
- **Relaxed ID validation.** `courseId`, `packageId`, and `instructorId` in the batch
  create schemas are now validated as non-empty strings (`z.string().min(1)`) instead of
  `z.string().cuid()`. The DB uses `@default(cuid())` but does not enforce the format,
  and seed data uses fixed IDs (e.g. `"pkg-fullstack"`), so strict cuid checks rejected
  valid IDs (the `Invalid cuid` error on `packageId`).
- **Improved frontend error display.** `lib/api.ts` now attaches the structured error
  body to thrown errors and `lib/toast.ts` `getErrorMessage` renders Zod error arrays as
  readable, field-level messages (e.g. `packageId: Invalid cuid`) instead of
  `[object Object],[object Object]`.

### Added

- The batch create form now has client-side validation (required package/instructor/name/dates)
  with inline errors and a disabled submit until valid.

## 2026-07-13 - UI/UX Improvements

### Added

- Pagination support in DataTable component (already existed)
- Hash-based color generation for course thumbnails without images
- Lines to differentiate sidebar sub-menu items

### Changed

- Student dashboard stat tiles: Updated gradients to orange, green, and blue (medium intensity)
- "Back" button renamed to "Previous" in student portal header
- "Create Course" renamed to "Add Course" in admin dashboard and course creation page
- User avatar dropdown: Shows only icon (removed name display)
- Quick Access section: Improved color intensity from light to medium
- Student dashboard header: Changed from transparent/blur to solid white background
- All flat square corners changed to round-2xl edges
- Color palette updated from light to medium intensity throughout

### Removed

- Price display removed from:
  - BrowseCatalogueView (student portal)
  - CourseDetailView (student portal)
  - Course Catalogue page (public)
  - Admin courses management table
  - Admin new course creation form

### Files Modified

- `apps/web/src/components/student/StudentStatTiles.tsx`
- `apps/web/src/components/StudentPortalShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/admin/DataTable.tsx`
- `apps/web/src/components/admin/StatCard.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/courses/page.tsx`
- `apps/web/src/app/admin/courses/new/page.tsx`
- `apps/web/src/app/student/_views/HomeView.tsx`
- `apps/web/src/app/student/_views/BrowseCatalogueView.tsx`
- `apps/web/src/app/student/_views/CourseDetailView.tsx`
- `apps/web/src/app/catalogue/page.tsx`

## 2026-07-14 - Batch & User Creation Fixes

### Fixed

- **Packages not visible in users page**: `GET /api/admin/packages` returns `{ packages: [...] }` but the frontend was treating the response as a direct array. Fixed to parse `res.packages`.
- **courseBatchAssignments format mismatch**: Frontend sent `Record<string, string>` but backend expected `Array<{courseId, batchId}>`. Batch assignments were silently dropped on student creation. Now converts to proper array format.
- **Prisma client regeneration**: Regenerated after schema changes to ensure `packageId` on Batch model is recognized.

### Changed

- **Batch creation form reworked to Package-first flow**: Instead of selecting a course directly, admins now select a Package first, then the Course dropdown shows only courses from that package. The batch is linked to the package via `packageId`.
- **Batch list cards now show package name**: If a batch belongs to a package, the package name is displayed below the course title.
- **Removed "Pending" indicator from users table**: The instructor approval pending badge was removed from the Role column.
- **Simplified student assignment to single batch**: Instead of per-course batch selection, admin picks ONE batch from the package. The batch is assigned to its matching course; other package courses are enrolled without a batch.
- **Seed data now includes packages**: Two packages seeded — "Full Stack Developer Bootcamp" (Python + React + JS) and "Cloud & DevOps Engineer" (AWS + Python). All batches linked to packages. Students enrolled via PackageEnrollment with batch assignments.

### Files Modified

- `apps/web/src/app/admin/users/page.tsx` — Fixed packages API parsing, removed Pending indicator, simplified to single batchId
- `apps/web/src/app/admin/batches/new/page.tsx` — Reworked to Package-first flow
- `apps/web/src/app/admin/batches/page.tsx` — Added package field to Batch type and card display
- `apps/api/src/modules/users/user.routes.ts` — Simplified POST /api/users to accept single batchId
- `apps/api/prisma/seed.ts` — Added packages, package-linked batches, and package enrollments
