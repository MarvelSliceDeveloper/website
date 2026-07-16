# Completed: Sidebar Type-Specific Icons

**Status:** Completed  
**Date:** 2026-07-16  
**Task:** Add different icons for video, quiz, and assignment content in the course content sidebar.

## Summary

Added distinct icons for each content type in the course content sidebar:
- **Video lessons** → `IconPlayerPlay` (primary color when active, muted when inactive)
- **Quizzes** → `IconClipboardCheck` (amber) — shows question count
- **Assignments** → `IconFileSpreadsheet` (blue) — shows due date

## Changes Made

### 1. Prisma Schema
**File:** `apps/api/prisma/schema.prisma`
- Added `moduleId String?` field to `Assignment` model
- Added `module Module?` relation with `onDelete: SetNull`
- Added `assignments Assignment[]` to `Module` model

### 2. API Response
**File:** `apps/api/src/modules/courses/student-course.routes.ts`
- Added `assignments` to the module query include
- Changed `hasQuiz: boolean` → `quizzes: { id, title, questionCount }[]`
- Added `assignments: { id, title, type, dueDate }[]` to module response

### 3. Frontend Types
**File:** `apps/web/src/app/student/_views/_comps/types.ts`
- Added `QuizInfo` interface
- Added `AssignmentInfo` interface
- Updated `CourseModule`: `quizzes: QuizInfo[]`, `assignments: AssignmentInfo[]`

### 4. Sidebar UI
**File:** `apps/web/src/app/student/_views/CourseContentView.tsx`
- Updated imports: removed `IconCircleCheck`, added `IconClipboardCheck`, `IconFileSpreadsheet`
- Lesson icons now always use `IconPlayerPlay` (active = filled primary circle, inactive = muted circle)
- Added quiz items with amber `IconClipboardCheck` icons after lessons
- Added assignment items with blue `IconFileSpreadsheet` icons after quizzes
- Module header text changed from "{n} lectures" to "{n} items" (counts all content types)

### 5. Documentation
- Updated `AGENTS.md` with sidebar icon patterns
- Created this completion doc

## Notes

- Existing assignments without a `moduleId` will not appear in the sidebar (they still show on the dashboard)
- The `LessonSidebar.tsx` extracted component was NOT modified — only the inline sidebar in `CourseContentView.tsx`
- Run `pnpm prisma:generate` after stopping the dev server to regenerate the Prisma client
