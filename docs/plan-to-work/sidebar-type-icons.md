# Plan: Sidebar Type-Specific Icons

**Status:** In Progress  
**Date:** 2026-07-16  
**Task:** Add different icons for video, quiz, and assignment content in the course content sidebar.

## Goal

Show distinct icons for each content type in the course content sidebar:
- **Video** → `IconPlayerPlay` (primary color)
- **Quiz** → `IconClipboardCheck` (amber)
- **Assignment** → `IconFileSpreadsheet` (blue)

## Changes

### 1. Prisma Schema — Add `moduleId` to Assignment
**File:** `apps/api/prisma/schema.prisma`

- Add `moduleId String?` to `Assignment` model
- Add optional `module Module?` relation
- Add `assignments Assignment[]` to `Module` model
- Run `pnpm prisma:generate`

### 2. API — Include quizzes + assignments in course content
**File:** `apps/api/src/modules/courses/student-course.routes.ts`

- Return `quizzes: { id, title, questionCount }` per module (replace `hasQuiz: boolean`)
- Include `assignments: { id, title, type, dueDate }` per module
- Update module query to include assignments relation

### 3. Frontend Types
**File:** `apps/web/src/app/student/_views/_comps/types.ts`

- Add `QuizInfo` and `AssignmentInfo` types
- Update `CourseModule`: `quizzes: QuizInfo[]`, `assignments: AssignmentInfo[]`
- Remove `hasQuiz: boolean`

### 4. Sidebar Icons & Items
**File:** `apps/web/src/app/student/_views/CourseContentView.tsx`

- Import `IconClipboardCheck`, `IconFileSpreadsheet`
- Replace `IconCircleCheck` with type-aware icons for inactive lessons
- Add quiz items with `IconClipboardCheck` after lessons
- Add assignment items with `IconFileSpreadsheet` after quizzes
- Update module header text to count all content types

### 5. Verify
- `pnpm prisma:generate`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

## Important Notes

- Assignments were previously course/batch-level only. This plan adds optional `moduleId` to link them to modules.
- Existing assignments without a `moduleId` will not appear in the sidebar (they'll still show on the dashboard).
- The `LessonSidebar.tsx` extracted component is NOT being modified — only the inline sidebar in `CourseContentView.tsx`.
