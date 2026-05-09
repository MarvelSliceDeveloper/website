# Phase 8 — LMS Core

> ⏱️ **Duration**: Weeks 13–16 (4 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 7  
> ⚠️ **Extended from original 2 weeks → 4 weeks** (this phase covers the entire LMS product surface — courses, modules, enrollment, progress, dashboard, landing page, catalog — and cannot be rushed)

---

## 🎯 Objective

Build the full course management system, student enrollment flow, progress dashboard, course catalog, and landing page — the core product experience that ties everything together.

---

## ✅ Tasks

### 8.1 — Course CRUD (Backend)

- [ ] Create course API endpoints:
  - `POST /api/courses` — create course (instructor/admin)
  - `GET /api/courses` — list courses (with pagination, filters)
  - `GET /api/courses/:id` — course details
  - `PATCH /api/courses/:id` — update course
  - `PATCH /api/courses/:id/publish` — publish/unpublish
  - `DELETE /api/courses/:id` — archive course (soft delete)
- [ ] Course data model:
  - Required: title, description, instructorId, 
  - Optional: price (0 = free), thumbnail, category, tags, level (beginner/intermediate/advanced)
  - Status: draft → published → archived
- [ ] Course validation:
  - Must have at least 1 module before publishing
  - Must have a description (min 50 chars)
  - Price validation (non-negative, in INR)
- [ ] **🆕 Course categories & tags**:
  - Create `Category` table: id, , name, slug
  - Allow tagging courses for filtering
  - `GET /api/categories` — list categories for platform

### 8.2 — Module & Lesson Management

- [ ] Create module API endpoints:
  - `POST /api/courses/:courseId/modules` — create module
  - `PATCH /api/modules/:id` — update module (title, order)
  - `DELETE /api/modules/:id` — delete module
  - `PATCH /api/courses/:courseId/modules/reorder` — reorder modules (drag & drop)
- [ ] Module structure:
  - Each course has ordered modules
  - Each module links to sessions/recordings
  - Modules can be expanded/collapsed in course view
- [ ] **🆕 Lesson content beyond recordings**:
  - Create `Lesson` table: id, moduleId, title, type (video/text/quiz/assignment), order, content
  - Type `text` — rich text content (markdown or HTML)
  - Type `video` — links to Recording
  - Type `quiz` — links to Quiz (Phase 10)
  - Type `assignment` — text submission (future)

### 8.3 — Instructor Course Management UI

- [ ] Instructor courses page: `/(instructor)/panel/courses`
  - List all instructor's courses with status badge (draft/published/archived)
  - Stats per course: enrolled students, completion rate, revenue
  - Actions: edit, publish, unpublish, duplicate, archive
- [ ] Course editor page:
  - Tab 1: **Details** — title, description (rich text editor), thumbnail upload, price, category, level
  - Tab 2: **Curriculum** — modules list with drag-drop reorder, add/edit/delete modules
  - Tab 3: **Sessions** — linked live sessions and recordings
  - Tab 4: **Students** — enrolled students list with progress
  - Tab 5: **Settings** — pricing model, visibility, enrollment limit
- [ ] **🆕 Course thumbnail upload**:
  - Accept image upload (JPEG/PNG, max 2MB)
  - Resize to standard dimensions (16:9 ratio, 1280x720)
  - Store on S3/Cloudinary/R2
  - Show placeholder if no thumbnail

### 8.4 — Student Enrollment Flow

- [ ] Enrollment logic:
  - **Free course** (`price = 0`): Auto-enroll on "Enroll" button click
  - **Paid course**: Redirect to payment flow (Phase 9), enroll on payment success
  - **Subscription**: Check active subscription, auto-enroll if valid
- [ ] Create enrollment API endpoints:
  - `POST /api/enrollments` — enroll in course
  - `GET /api/enrollments/me` — list current user's enrollments
  - `DELETE /api/enrollments/:id` — unenroll (with confirmation)
- [ ] Enrollment constraints:
  - Check course is published
  - Check user isn't already enrolled
  - Check platform plan allows more enrollments
  - **🆕 Check enrollment capacity** (if course has a max enrollment limit)
- [ ] **🆕 Enrollment notifications**:
  - Send welcome email on enrollment
  - Notify instructor when new student enrolls

### 8.5 — Progress Tracking & Completion

- [ ] Calculate course progress:
  - Progress = (recordings watched to 90%) / (total recordings in course) × 100
  - Include quiz scores if quizzes are part of completion criteria (Phase 10)
- [ ] Progress API:
  - `GET /api/courses/:id/progress` — overall course progress for current user
  - `GET /api/enrollments/me/progress` — progress across all enrolled courses
- [ ] Completion logic:
  - Course completed when progress = 100%
  - Trigger certificate issuance (Phase 10)
  - Send congratulations email
  - **🆕 Mark completion date** for analytics

### 8.6 — Student Dashboard

- [ ] Build dashboard page: `/dashboard`
- [ ] Dashboard sections:
  - **Continue Watching** — last 3 recordings in progress (with progress bar)
  - **Enrolled Courses** — grid of enrolled courses with progress bars
  - **Upcoming Live Sessions** — next 5 sessions with join buttons
  - **Recently Completed** — last 3 completed courses with certificates
  - **🆕 Announcements** — platform-wide announcements from admin
  - **🆕 Quick Stats** — total courses enrolled, hours watched, certificates earned
- [ ] Dashboard data API:
  - `GET /api/dashboard` — aggregated dashboard data in single response
  - Cache in Redis (TTL: 5 min) to avoid expensive multi-table queries

### 8.7 — Course Detail Page

- [ ] Build course detail page: `/courses/[courseId]`
- [ ] Page sections:
  - **Hero** — thumbnail, title, instructor, rating, price, "Enroll" CTA
  - **Description** — full course description (rich text)
  - **Curriculum** — expandable modules with lesson count and duration
  - **Instructor** — name, bio, avatar, other courses
  - **Reviews** (future) — placeholder section
  - **🆕 Prerequisites** — recommended prior courses
  - **🆕 What you'll learn** — bullet list of learning outcomes
- [ ] Dynamic CTA button:
  - Not enrolled → "Enroll Now" (with price or "Free")
  - Enrolled → "Continue Learning" (goes to last watched recording)
  - Completed → "Review Course" + certificate download

### 8.8 — Landing Page & Course Catalog

- [ ] Build landing page: `/(platform)/[platformSlug]` (root)
- [ ] Landing page sections:
  - **Hero** — headline, subheadline, CTA button, hero image
  - **Featured Courses** — carousel of top/featured courses
  - **Categories** — browse by category grid
  - **Stats** — total courses, students, live hours (animated counters)
  - **Testimonials** (future) — placeholder
  - **CTA** — "Get Started" / "Browse Courses"
- [ ] Course catalog page: `/courses`
  - Grid of course cards
  - Filters: category, level, price (free/paid), instructor
  - Sort: newest, popular, price (low/high)
  - **🆕 Search bar**: Full-text search on title + description
    - PostgreSQL `tsvector` for now, migrate to Meilisearch/Typesense later if needed
  - Pagination (12 per page)
- [ ] Course card component:
  - Thumbnail, title, instructor name, price, level badge
  - Star rating (future), student count
  - Hover: brief description preview

### 8.9 — 🆕 File Upload Infrastructure

- [ ] Set up file upload pipeline:
  - Accept: images (JPEG, PNG, WebP), documents (PDF)
  - Max size: 5MB for images, 20MB for documents
  - Storage: AWS S3 / Cloudflare R2 / Cloudinary
  - Generate thumbnails for images
  - Return CDN URL after upload
- [ ] API endpoints:
  - `POST /api/uploads/image` — upload image (course thumbnail, avatar)
  - `POST /api/uploads/document` — upload document (course material)
  - `DELETE /api/uploads/:id` — delete uploaded file
- [ ] Security:
  - Validate file type (magic bytes, not just extension)
  - Scan for malware (optional, via ClamAV or similar)
  - Signed upload URLs for large files (direct-to-S3)

### 8.10 — 🆕 Search Implementation

- [ ] PostgreSQL full-text search:
  - Add `tsvector` column to `Course` table
  - Trigger to auto-update `tsvector` on insert/update
  - `GET /api/courses/search?q=...` — search endpoint
  - Search across: title, description, tags, instructor name
- [ ] Autocomplete/suggestions:
  - `GET /api/courses/suggest?q=...` — returns top 5 matches
  - Debounced search on frontend (300ms)

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Course CRUD | Instructor can create, edit, publish courses |
| Module management | Drag-drop reorder, add/delete modules |
| Enrollment flow | Free → auto-enroll, paid → payment redirect |
| Progress tracking | Progress bars update as recordings watched |
| Student dashboard | All sections render with live data |
| Course detail page | Full page with dynamic CTA |
| Landing page | Hero, featured courses, categories |
| Course catalog | Grid with filters, sort, search, pagination |
| File uploads | Thumbnails and materials upload to cloud storage |
| Search | Full-text search across courses |

---

## 🧪 Tests to Write

- [ ] Unit: Course validation (min description, price, publish rules)
- [ ] Unit: Progress calculation (% based on recordings watched)
- [ ] Unit: Enrollment constraints (duplicate check, capacity check)
- [ ] Integration: Course CRUD operations
- [ ] Integration: Enrollment creates record and sends notification
- [ ] Integration: Progress aggregation across modules
- [ ] Integration: Search returns relevant results
- [ ] Integration: File upload stores and returns CDN URL
- [ ] E2E: Instructor creates course → publishes → student enrolls → watches → progresses
- [ ] E2E: Student searches for course → views detail → enrolls
- [ ] E2E: Dashboard shows accurate progress and upcoming sessions

