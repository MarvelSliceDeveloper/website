# Course Creation Enhancement - Full Implementation Plan

**Date:** 2026-06-03  
**Status:** Planning  
**Scope:** Add study materials upload to admin course management + add assignment creation to instructor dashboard

---

## Context

The LMS currently supports:
- ✅ Admin can create/edit courses and manage modules with video URLs
- ✅ Instructors can view/grade student assignment submissions
- ✗ Admins cannot upload study materials (PDFs, docs, etc.) to modules
- ✗ Instructors cannot create assignments for their courses
- ✗ No Assignment/Submission models in database

**Goal:** Enable admins to directly upload and organize study materials in the course editor, and allow instructors to create assignments for their batches.

---

## Phase 1: Database Schema Changes

### New Prisma Models

#### 1. **Assignment Model**
```prisma
model Assignment {
  id           String    @id @default(cuid())
  batchId      String
  courseId     String
  title        String
  description  String
  instructions String?
  dueDate      DateTime
  
  createdBy    String    // Instructor ID
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  batch        Batch     @relation(fields: [batchId], references: [id], onDelete: Cascade)
  course       Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  creator      User      @relation("AssignmentCreator", fields: [createdBy], references: [id])
  submissions  AssignmentSubmission[]
}
```

**Why:** Track all assignments per batch with course reference, instructor creator, and cascade deletes.

#### 2. **AssignmentSubmission Model**
```prisma
model AssignmentSubmission {
  id             String    @id @default(cuid())
  assignmentId   String
  studentId      String
  submissionText String?
  fileUrl        String?          // If student uploads file
  grade          String?           // A+, A, B, C, F, or score
  feedback       String?           // Instructor feedback
  status         String    @default("PENDING")  // PENDING | GRADED | LATE
  submittedAt    DateTime?
  gradedAt       DateTime?
  
  assignment     Assignment        @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student        User              @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@unique([assignmentId, studentId])
}
```

**Why:** Track each student's submission, grade, and feedback with unique constraint per student per assignment.

#### 3. **Update Course Model - Add Assignment Relation**
```prisma
model Course {
  // ... existing fields ...
  assignments  Assignment[]  // New relation
}
```

#### 4. **Update User Model - Add Assignment Relations**
```prisma
model User {
  // ... existing fields ...
  assignmentsCreated   Assignment[]              @relation("AssignmentCreator")
  assignmentSubmissions AssignmentSubmission[]
}
```

**Migration File Location:** `apps/api/prisma/migrations/[timestamp]_add_assignments/migration.sql`

---

## Phase 2: Backend API Implementation

### 2.1 Assignment Module Structure

Create new module at `apps/api/src/modules/assignments/`

#### Files to Create:

**`assignments.routes.ts`**
```typescript
// POST /api/assignments                    - Create assignment (instructor only)
// GET /api/assignments                     - List assignments by batch (instructor)
// GET /api/assignments/:id                 - Get assignment details
// PUT /api/assignments/:id                 - Update assignment (creator only)
// DELETE /api/assignments/:id              - Delete assignment (creator only)
// POST /api/assignments/:id/submit         - Submit assignment (student)
// GET /api/assignments/:id/submissions     - List submissions (instructor)
// PUT /api/assignments/:id/grade/:studentId - Grade submission (instructor)
```

**`assignments.controller.ts`**
- `createAssignment()` - Validate via Zod, call service
- `listAssignments()` - Support filtering by batch, course, status
- `getAssignmentById()` - Include submissions count
- `updateAssignment()` - Only allow creator or admin
- `deleteAssignment()` - Soft delete option
- `submitAssignment()` - Create/update submission
- `listSubmissions()` - Paginated, filterable by status
- `gradeSubmission()` - Add grade and feedback

**`assignments.service.ts`**
- Zod schemas for validation:
  - `CreateAssignmentSchema` - title, description, instructions, courseId, batchId, dueDate
  - `UpdateAssignmentSchema` - same fields as above but all optional
  - `SubmitAssignmentSchema` - submissionText, optional fileUrl
  - `GradeSchema` - grade, feedback
- Business logic using Prisma queries
- Follow existing service patterns from `courses.service.ts`

**Key Validation Rules:**
- Instructor must be assigned to the batch
- Due date must be in future
- Student can only submit once per assignment (upsert logic)
- Can only grade own submissions
- Grade must be from predefined list or numeric score

#### API Response Examples:

**Create Assignment (201)**
```json
{
  "id": "cuid123",
  "title": "Project 1: REST API",
  "description": "Build a simple REST API",
  "dueDate": "2026-06-15T23:59:59Z",
  "batchId": "batch123",
  "courseId": "course456",
  "createdBy": "instructor789",
  "createdAt": "2026-06-03T10:00:00Z"
}
```

**Submit Assignment (200)**
```json
{
  "id": "submission123",
  "assignmentId": "cuid123",
  "studentId": "student456",
  "submissionText": "Here is my submission...",
  "status": "PENDING",
  "submittedAt": "2026-06-10T15:30:00Z"
}
```

**Grade Submission (200)**
```json
{
  "id": "submission123",
  "grade": "A",
  "feedback": "Great work!",
  "gradedAt": "2026-06-11T09:00:00Z",
  "status": "GRADED"
}
```

---

### 2.2 Module Resources (Study Materials) Enhancement

Extend existing course module structure to support file uploads.

**`modules.upload.ts`** (create new file)
- Multer config for module resources
- Support file types: PDF, DOCX, PPTX, XLSX, images (JPG, PNG, WebP)
- Max file size: 50MB per file
- Storage: `uploads/modules/[courseId]/[moduleId]/`
- Naming: UUID + original extension

**`modules.routes.ts`** (extend existing)
```typescript
// POST /api/admin/courses/modules/:id/resources    - Upload resource file
// DELETE /api/admin/courses/modules/:id/resources/:resourceId - Delete resource
// GET /api/admin/courses/modules/:id/resources     - List resources (included in module GET already)
```

**`modules.controller.ts`** (extend existing)
- `uploadResource()` - Handle file upload, update module.resources JSON array
- `deleteResource()` - Remove file and update resources array

**Module Resources JSON Structure:**
```json
[
  {
    "id": "uuid123",
    "name": "Course_Syllabus.pdf",
    "originalName": "Course Syllabus.pdf",
    "url": "/uploads/modules/course123/module456/uuid123.pdf",
    "fileType": "application/pdf",
    "size": 2048576,
    "uploadedAt": "2026-06-03T10:00:00Z"
  }
]
```

---

## Phase 3: Frontend Implementation

### 3.1 Admin Course Management - Study Materials Tab

**File:** `apps/web/src/app/admin/courses/[id]/page.tsx` (extend existing)

#### Changes:
1. Add tab navigation:
   - "Course Details" (existing)
   - "Modules" (existing)
   - "Study Materials" (NEW)

2. Create new component `ModuleStudyMaterialsSection.tsx`:
   - List modules in dropdown or tabs
   - When module selected, show resources list
   - File upload input (drag-drop support)
   - Delete resource with confirmation
   - Show file type icon, size, upload timestamp
   - Real-time reload after upload/delete

3. Update module GET response type to include resources

#### UI Layout:
```
┌─ Course Details | Modules | Study Materials ─┐
│                                                │
│ Select Module: [Dropdown with modules]         │
│                                                │
│ Resources for "Module 1: Introduction"        │
│ ┌─────────────────────────────────────────────┐│
│ │ + Drag files here or click to upload         ││
│ │ (PDF, DOCX, PPTX, Images up to 50MB)        ││
│ └─────────────────────────────────────────────┘│
│                                                │
│ Uploaded Resources:                            │
│ ┌─────────────────────────────────────────────┐│
│ │ 📄 Course_Notes.pdf (2.1 MB)           ✕   ││
│ │ 📊 Slides_Week1.pptx (5.4 MB)         ✕   ││
│ │ 📄 Assignment_Template.docx (0.5 MB)  ✕   ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**State Management:**
```typescript
const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
const [resources, setResources] = useState<Resource[]>([]);
const [uploading, setUploading] = useState(false);
const [uploadError, setUploadError] = useState("");
const [uploadSuccess, setUploadSuccess] = useState("");
```

**File Upload Handler:**
- Validate file type and size client-side
- Upload via FormData POST
- Show progress (optional: use fetch with progress event)
- Update resources list on success
- Show error message if upload fails

---

### 3.2 Instructor Dashboard - Assignment Creation

**File:** `apps/web/src/app/instructor/assignments/page.tsx` (extend existing)

#### Changes:
1. Add "Create Assignment" button at top
2. Add new modal/form for creating assignments
3. Update assignment list to show created assignments + grades for submitted assignments

#### New Component: `CreateAssignmentModal.tsx`
- Form fields:
  - Select Batch (dropdown - load instructor's batches from API)
  - Assignment Title (text input)
  - Description (textarea)
  - Instructions (textarea, optional)
  - Due Date (datetime picker)
  - Submit button

#### Form Validation:
```typescript
const CreateAssignmentSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  instructions: z.string().optional(),
  dueDate: z.date().refine(d => d > new Date(), "Due date must be in future"),
});
```

**UI Layout:**
```
Assignments & Grading

[+ Create Assignment] button

Created Assignments (instructor):
┌─────────────────────────────────┐
│ Project 1: REST API             │
│ Batch: Python Jan 2025          │
│ Due: 2026-06-15                 │
│ Status: 6 submitted / 10 total  │
│ [View] [Edit] [Delete]          │
└─────────────────────────────────┘

Student Submissions - Awaiting Review:
┌─────────────────────────────────┐
│ Assignment Title                │
│ Student: John Doe               │
│ Submitted: 2 days ago           │
│ [Grade]                         │
└─────────────────────────────────┘
```

#### Create Assignment Form State:
```typescript
const [showCreateForm, setShowCreateForm] = useState(false);
const [batches, setBatches] = useState<Batch[]>([]);
const [createForm, setCreateForm] = useState({
  batchId: "",
  title: "",
  description: "",
  instructions: "",
  dueDate: "",
});
const [creating, setCreating] = useState(false);
```

---

### 3.3 Assignment List Component Updates

**Modify:** `apps/web/src/app/instructor/assignments/page.tsx`

1. Fetch assignments created by instructor:
   ```typescript
   useEffect(() => {
     async function loadData() {
       const myAssignments = await api.get("/api/assignments");
       const submissions = await api.get("/api/assignments/submissions");
       // ...
     }
   }, []);
   ```

2. Show sections:
   - "My Assignments" - assignments created by instructor
   - "Pending Reviews" - submissions awaiting grading
   - "Completed Grading" - already graded submissions

---

## Phase 4: New File Structure

### Backend Files to Create:
```
apps/api/src/modules/assignments/
├── assignments.routes.ts      (NEW)
├── assignments.controller.ts  (NEW)
├── assignments.service.ts     (NEW)

apps/api/src/modules/courses/
├── modules.upload.ts          (EXTEND - new resources upload)

apps/api/prisma/
└── migrations/
    └── [timestamp]_add_assignments/
        └── migration.sql       (NEW)
```

### Frontend Files to Create/Modify:
```
apps/web/src/app/
├── admin/courses/[id]/
│   └── page.tsx              (MODIFY - add Study Materials tab)
│   └── _components/
│       └── ModuleStudyMaterialsSection.tsx  (NEW)
│
└── instructor/assignments/
    └── page.tsx              (MODIFY - add Create Assignment)
    └── _components/
        └── CreateAssignmentModal.tsx        (NEW)
        └── AssignmentList.tsx               (NEW)
```

---

## Phase 5: Implementation Steps (In Order)

### Step 1: Database Migration
1. Write Prisma schema changes for Assignment and AssignmentSubmission
2. Create migration file
3. Run: `pnpm prisma migrate dev`
4. Update: `pnpm prisma generate`

### Step 2: Backend - Assignments Module
1. Create `assignments.routes.ts` with all endpoints (starting with stubs)
2. Create `assignments.service.ts` with Zod schemas and database queries
3. Create `assignments.controller.ts` with handlers
4. Add route mounting in `apps/api/src/index.ts`: `app.use('/api/assignments', assignmentRoutes)`
5. Test endpoints with Postman/curl (or add to test suite)

### Step 3: Backend - Module Resources Upload
1. Create `modules.upload.ts` with Multer config for resources
2. Extend `modules.controller.ts` to add resource upload/delete handlers
3. Extend `modules.routes.ts` to add resource endpoints
4. Update `modules.service.ts` to handle resources JSON array updates
5. Test file uploads

### Step 4: Frontend - Admin Study Materials
1. Create `ModuleStudyMaterialsSection.tsx` component
2. Modify `admin/courses/[id]/page.tsx` to add tab navigation
3. Integrate Study Materials tab with file upload UI
4. Test upload, delete, and real-time updates

### Step 5: Frontend - Instructor Assignments
1. Create `CreateAssignmentModal.tsx` component
2. Create `AssignmentList.tsx` component to show created assignments
3. Modify `instructor/assignments/page.tsx` to:
   - Load instructor's batches on mount
   - Show "Create Assignment" button
   - Display created assignments separately from submissions
4. Connect API calls to backend endpoints
5. Test creation, listing, and grading

---

## Phase 6: Critical Files Reference

### Key Existing Files (as patterns):
- `apps/api/src/modules/courses/course.service.ts` - Zod schema pattern, service structure
- `apps/api/src/modules/courses/course.controller.ts` - Error handling, response format
- `apps/api/src/modules/courses/course.upload.ts` - Multer configuration
- `apps/api/src/middleware/auth.middleware.ts` - Role-based authorization
- `apps/web/src/app/admin/courses/[id]/page.tsx` - Form state management, API calls
- `apps/web/src/lib/api.ts` - API client methods
- `apps/api/prisma/schema.prisma` - Prisma patterns, relationships

### New Critical Files to Create:
- `apps/api/src/modules/assignments/assignments.service.ts`
- `apps/api/src/modules/assignments/assignments.controller.ts`
- `apps/api/src/modules/assignments/assignments.routes.ts`
- `apps/web/src/app/instructor/assignments/_components/CreateAssignmentModal.tsx`
- `apps/web/src/app/admin/courses/[id]/_components/ModuleStudyMaterialsSection.tsx`

---

## Phase 7: API Endpoints Summary

### Assignment Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/assignments` | INSTRUCTOR | Create assignment |
| GET | `/api/assignments` | INSTRUCTOR | List instructor's assignments |
| GET | `/api/assignments/:id` | INSTRUCTOR/STUDENT | Get assignment details |
| PUT | `/api/assignments/:id` | INSTRUCTOR | Update assignment (creator only) |
| DELETE | `/api/assignments/:id` | INSTRUCTOR | Delete assignment (creator only) |
| POST | `/api/assignments/:id/submit` | STUDENT | Submit assignment |
| GET | `/api/assignments/:id/submissions` | INSTRUCTOR | List submissions for assignment |
| PUT | `/api/assignments/:id/grade/:studentId` | INSTRUCTOR | Grade submission |

### Module Resources Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/courses/modules/:id/resources` | ADMIN | Upload resource file |
| DELETE | `/api/admin/courses/modules/:id/resources/:resourceId` | ADMIN | Delete resource |

---

## Phase 8: Testing & Verification

### Backend Testing:
1. Create assignment as instructor:
   ```bash
   curl -X POST http://localhost:4000/api/assignments \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "batchId": "batch123",
       "title": "Project 1",
       "description": "Build REST API",
       "dueDate": "2026-06-15T23:59:59Z"
     }'
   ```

2. Submit assignment as student:
   ```bash
   curl -X POST http://localhost:4000/api/assignments/asgn123/submit \
     -H "Authorization: Bearer <student-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "submissionText": "Here is my solution..."
     }'
   ```

3. Grade submission:
   ```bash
   curl -X PUT http://localhost:4000/api/assignments/asgn123/grade/student456 \
     -H "Authorization: Bearer <instructor-token>" \
     -d '{"grade": "A", "feedback": "Great work!"}'
   ```

4. Upload module resource:
   ```bash
   curl -X POST http://localhost:4000/api/admin/courses/modules/mod123/resources \
     -H "Authorization: Bearer <admin-token>" \
     -F "resource=@/path/to/file.pdf"
   ```

### Frontend Testing:
1. Admin can upload study materials:
   - Login as admin
   - Go to admin course detail
   - Click "Study Materials" tab
   - Select module
   - Upload PDF/DOCX
   - Verify file appears in list
   - Delete and verify removal

2. Instructor can create assignments:
   - Login as instructor
   - Go to Assignments page
   - Click "Create Assignment"
   - Fill form and submit
   - Verify assignment appears in list
   - Submit as student
   - Grade as instructor

3. Full workflow:
   - Admin uploads course materials
   - Instructor creates assignment
   - Student views assignment and submits
   - Instructor grades and provides feedback
   - Student sees grade in assignments page

---

## Phase 9: Environment & Dependencies

### No new npm packages needed
- Multer already in use for course thumbnails
- Zod already in use for validation
- Next.js form handling already established

### Environment Variables (if needed)
- `MAX_MODULE_RESOURCE_SIZE` - Default 50MB
- `ALLOWED_RESOURCE_TYPES` - MIME types whitelist

---

## Implementation Timeline

- **Step 1 (Database):** 15 min
- **Step 2 (Assignments API):** 45 min
- **Step 3 (Module Resources API):** 30 min
- **Step 4 (Admin UI):** 45 min
- **Step 5 (Instructor UI):** 45 min
- **Testing & Refinement:** 30 min

**Total Estimated:** ~2.5 hours

---

## Success Criteria

✅ Admin can upload PDFs/docs to modules  
✅ Uploaded files show in list with download links  
✅ Admin can delete resources  
✅ Instructor can create assignments with title, description, due date  
✅ Student receives assignment and can submit text/file  
✅ Instructor can grade submission with feedback  
✅ All API endpoints return proper error codes and messages  
✅ File uploads validate type and size  
✅ Permissions enforced (only assigned instructors can grade, etc.)  

---

## Notes

- Study materials upload follows existing course thumbnail pattern
- Assignment submission uses same Zod validation as course module
- No S3 integration in this phase (reserved for deployment phase)
- All timestamps use ISO 8601 format
- Cascade delete on batch/course ensures data integrity
