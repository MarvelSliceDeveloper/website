# Plan: Module → Lesson Hierarchy

## Goal
Allow a single Module to contain many child Lessons. Students see modules as collapsible sections with a dropdown to navigate lessons.

## Changes

### 1. Prisma Schema — New Lesson Model
- Add `Lesson` model with: id, moduleId, title, description, order, videoType, videoUrl, videoEmbedId, durationSeconds, isFreePreview, resources (Json?)
- Move video/resource fields from Module → Lesson
- Module becomes a container: id, courseId, title, description, order, isFreePreview

### 2. Seed Script
- Create 2–3 lessons per seeded module using existing video data

### 3. API — New Lesson Endpoints
- `POST /api/admin/courses/modules/:moduleId/lessons` — create
- `PUT /api/admin/courses/modules/lessons/:id` — update
- `DELETE /api/admin/courses/modules/lessons/:id` — delete (cascade reorder)
- `PATCH /api/admin/courses/:courseId/modules/:moduleId/lessons/reorder` — reorder
- `POST /api/admin/courses/:courseId/modules/:moduleId/lessons/:id/resources` — upload resource
- `DELETE /api/admin/courses/modules/lessons/:id/resources/:resourceId` — delete resource
- Update module create/update to remove video fields
- Update student `GET /api/courses/:courseId/content` to nest lessons under modules

### 4. Admin UI — Course Builder
- Modules are collapsible sections with a chevron toggle
- Each expanded module shows its lessons (drag-reorderable)
- Each lesson has inline editing (title, description, video URL)
- "Add Lesson" button inside each module
- Module itself still draggable at top level

### 5. Student UI — CourseContentView
- Module list in sidebar: each module has an expand chevron
- Expanding shows lessons indented below
- Each lesson is clickable → loads video/content
- Active lesson highlighted
