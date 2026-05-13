|**LMS Admin Feature — Implementation Plan**|Confidential  |  v1.0|
| :- | -: |

**LMS Admin Feature**

Implementation Plan

Course Management  ·  Video Embedding  ·  Batch Management  ·  Live Sessions

# **1. Overview & Scope**
This document covers only the new Admin features to be added to your existing LMS. The plan is broken into five major functional areas, each with sub-features, API design, database schema notes, and a phased delivery roadmap.

||<p>**A. Course & Module (Lesson) Management**</p><p>• Create, edit, delete courses with rich metadata</p><p>• Organize courses into modules (lessons) with drag-and-drop ordering</p><p>• Full CRUD for both courses and modules</p><p>• Draft → Published workflow with publish/unpublish control</p>|
| :- | :- |

||<p>**B. Video Management (Embedded — No New Tab)**</p><p>• Upload video files directly (stored on S3 / Cloudflare R2)</p><p>• Paste external URLs (YouTube, Vimeo, Loom, direct MP4)</p><p>• All videos play inside the LMS page — never opens a new tab</p><p>• Custom HTML5 player with progress tracking</p>|
| :- | :- |

||<p>**C. Course Designer (Visual Design Tool)**</p><p>• Upload course thumbnail / cover photo</p><p>• Add banner images, intro text, learning objectives</p><p>• Rich text description editor (like a CMS)</p><p>• Preview mode — see exactly what students will see</p>|
| :- | :- |

||<p>**D. Publish & Course Management**</p><p>• Draft / Published / Archived status per course</p><p>• Publish with one click; unpublish anytime</p><p>• Course dashboard with enrollment count, completion %, last updated</p><p>• Soft-delete with restore option</p>|
| :- | :- |

||<p>**E. Batch Management & Online Sessions**</p><p>• Create student batches and assign courses to them</p><p>• Assign students to batches individually or via CSV import</p><p>• Schedule live online sessions (Zoom / Google Meet / custom link)</p><p>• Session calendar view; auto-notifications to batch students</p>|
| :- | :- |


# **2. Course & Module Management**
## **2.1 Course Entity — Fields**
Each course stores the following data:

|**Field**|**Type**|**Notes**|
| :- | :- | :- |
|course\_id|UUID|Primary key, auto-generated|
|title|VARCHAR(200)|Required|
|slug|VARCHAR(200)|URL-safe, auto-generated from title|
|description|TEXT (HTML)|Rich text from editor|
|thumbnail\_url|VARCHAR(500)|S3 or CDN URL|
|cover\_image\_url|VARCHAR(500)|Banner image|
|status|ENUM|draft | published | archived|
|category|VARCHAR(100)|e.g. Programming, Design|
|tags|JSON array|Searchable keywords|
|learning\_objectives|JSON array|Bullet points shown to student|
|duration\_minutes|INT|Auto-computed from modules|
|created\_by|UUID (FK)|Admin user ID|
|published\_at|TIMESTAMP|Null if draft|
|created\_at / updated\_at|TIMESTAMP|Auto-managed|

## **2.2 Module (Lesson) Entity — Fields**

|**Field**|**Type**|**Notes**|
| :- | :- | :- |
|module\_id|UUID|Primary key|
|course\_id|UUID (FK)|Parent course|
|title|VARCHAR(200)|Lesson title|
|description|TEXT|Short lesson description|
|sort\_order|INT|Controls lesson sequence (drag-to-reorder)|
|video\_type|ENUM|upload | youtube | vimeo | loom | url|
|video\_url|VARCHAR(500)|S3 URL or external link|
|video\_embed\_id|VARCHAR(100)|YouTube/Vimeo ID extracted from URL|
|duration\_seconds|INT|Video length in seconds|
|is\_free\_preview|BOOLEAN|Unlocked for non-enrolled users|
|resources|JSON array|Attachments/PDFs for download|


# **3. Video Embedding — No New Tab**
The core requirement is that videos must play inside the LMS page, never redirecting the user to YouTube or another site. The approach depends on the video source:

## **3.1 YouTube / Vimeo / Loom**
These platforms provide official embed iframes. The admin pastes the full URL; your backend extracts the video ID and stores it. The frontend renders an iframe with the embed URL — the video plays inline on your page.

**URL Parsing Logic (Backend):**

YouTube: https://youtube.com/watch?v=ABC123  →  extract 'v' param  →  embed as:

`    `https://www.youtube.com/embed/ABC123?rel=0&modestbranding=1

Vimeo:   https://vimeo.com/123456789         →  extract path ID  →  embed as:

`    `https://player.vimeo.com/video/123456789?byline=0

Loom:    https://loom.com/share/ABC           →  extract share ID   →  embed as:

`    `https://www.loom.com/embed/ABC

|<p>**⚠  Important — YouTube Branding**</p><p>Add rel=0 to avoid showing related videos from other channels.</p><p>Add modestbranding=1 to reduce the YouTube logo.</p><p>Users can still open YouTube via the iframe's full-screen controls — this is expected browser behaviour and cannot be blocked.</p>|
| :- |

## **3.2 Direct File Upload**
- Admin uploads an MP4/WebM file via the admin panel
- File uploads to S3 (or Cloudflare R2) via a presigned URL — never through your server
- Store the S3 URL in video\_url field
- Frontend renders a native HTML5 <video> element — fully embedded, no new tab
- Add poster= attribute from the course thumbnail for a clean look before play

|<p>**S3 Presigned Upload Flow**</p><p>1\. Admin selects file in browser</p><p>2\. Frontend calls POST /api/admin/uploads/presign with {filename, contentType}</p><p>3\. Backend generates S3 presigned PUT URL (expires in 15 min) and returns it</p><p>4\. Frontend uploads file directly to S3 using that URL (no server bandwidth used)</p><p>5\. On success, frontend saves the final S3 URL to the module record</p>|
| :- |


# **4. Course Designer**
The Course Designer is the admin's visual editor for making a course look professional before publishing. Think of it like a simplified page builder inside the admin panel.

## **4.1 Components to Build**

|**Component**|**What It Does**|
| :- | :- |
|Thumbnail Uploader|Drag & drop or click to upload course cover image (16:9 ratio, max 2MB). Stored on S3.|
|Banner / Hero Image|Wide banner displayed at the top of the course page. Separate upload field.|
|Course Title & Tagline|Editable inline; title is also the SEO heading|
|Rich Text Description|WYSIWYG editor (Quill.js or TipTap). Supports bold, lists, links, code blocks.|
|Learning Objectives|Add/remove bullet point objectives. Shown as a checklist to students.|
|Category & Tags|Dropdown category + free-form tag input for search filtering|
|Prerequisites|Optional text field or linked course selector|
|Course Preview Video|A short trailer video (same embed logic as lessons) shown before enrollment|
|Preview Mode|Toggle button — shows a read-only student view of the course landing page|

## **4.2 Recommended Libraries**
- Rich Text Editor: TipTap (React-based, extensible) or Quill.js
- Image Upload: react-dropzone for drag-and-drop + direct S3 presigned upload
- Image Cropper: react-image-crop to enforce 16:9 thumbnail aspect ratio
- Tag Input: react-select with creatable option
- Drag-to-Reorder Modules: @dnd-kit/sortable (lightweight, accessible)


# **5. Publish & Course Status Management**
## **5.1 Status Lifecycle**
Every course follows this state machine:

`  `**DRAFT**      →      **PUBLISHED**      →      **ARCHIVED**  

Published → Draft (unpublish) is also allowed. Archived courses are hidden from students but data is preserved.
## **5.2 Publish Checklist (Pre-Publish Validation)**
Before allowing publish, the system should validate:

- Course has a title (required)
- Course has at least one module
- At least one module has a video (upload or link)
- Thumbnail image is uploaded
- Description is not empty
- If any check fails, show a checklist modal with red/green status per item

## **5.3 Course Dashboard Table**
The admin's main course list should show:

- Course title + thumbnail preview
- Status badge (Draft / Published / Archived)
- Number of modules
- Total enrolled students
- Completion rate (%)
- Last updated date
- Actions: Edit | Publish/Unpublish | Preview | Delete


# **6. Batch Management & Online Sessions**
## **6.1 Batch Entity**
A Batch is a group of students taking a specific course together, typically with a start and end date (like a cohort).

|**Field**|**Type**|**Notes**|
| :- | :- | :- |
|batch\_id|UUID|Primary key|
|course\_id|UUID (FK)|Which course this batch is for|
|name|VARCHAR(100)|e.g. 'Batch 1 — June 2025'|
|start\_date|DATE|Batch start date|
|end\_date|DATE|Batch end date|
|max\_students|INT|Capacity limit (optional)|
|status|ENUM|upcoming | active | completed|
|description|TEXT|Optional notes about this batch|

## **6.2 Assigning Students to a Batch**
- Admin opens a batch → clicks 'Add Students'
- Search by name/email to find registered students
- Multi-select and add to batch in one action
- OR: Upload a CSV file with student emails for bulk assignment
- The system auto-enrolls these students in the batch's course
- Students see the batch schedule and sessions on their dashboard

## **6.3 Online Session Scheduling**
Admin can schedule live sessions for any batch. Sessions are not pre-recorded — they are live meetings.

|**Field**|**Type**|**Notes**|
| :- | :- | :- |
|session\_id|UUID|Primary key|
|batch\_id|UUID (FK)|Which batch this session is for|
|title|VARCHAR(200)|e.g. 'Week 1 Live Q&A'|
|scheduled\_at|TIMESTAMP|Date + time of session|
|duration\_minutes|INT|Expected length|
|platform|ENUM|zoom | google\_meet | teams | custom|
|meeting\_link|VARCHAR(500)|The join URL — shown to batch students|
|meeting\_id|VARCHAR(100)|Optional meeting ID / passcode info|
|recording\_url|VARCHAR(500)|Added after session ends (same embed logic)|
|status|ENUM|scheduled | live | completed | cancelled|
|notes|TEXT|Agenda / materials for students|

|<p>**Session Notification Flow**</p><p>When a session is created → all students in the batch receive an email with the join link and time.</p><p>24 hours before session → reminder email is sent automatically.</p><p>After session → admin can upload recording URL and it becomes watchable inline on the batch page.</p>|
| :- |


# **7. API Design**
All endpoints are under /api/admin/ and require admin JWT authentication. Standard REST conventions apply.

## **7.1 Course Endpoints**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|**GET**|/api/admin/courses|List all courses (with filters: status, category, search)|
|**POST**|/api/admin/courses|Create a new course (returns draft)|
|**GET**|/api/admin/courses/:id|Get full course detail including modules|
|**PUT**|/api/admin/courses/:id|Update course fields (title, description, etc.)|
|**DELETE**|/api/admin/courses/:id|Soft-delete course (set status to archived)|
|**POST**|/api/admin/courses/:id/publish|Validate and publish course (runs checklist)|
|**POST**|/api/admin/courses/:id/unpublish|Revert published course to draft|

## **7.2 Module (Lesson) Endpoints**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|**POST**|/api/admin/courses/:id/modules|Add a module to a course|
|**PUT**|/api/admin/modules/:id|Update module (title, video, resources)|
|**DELETE**|/api/admin/modules/:id|Delete a module|
|**PATCH**|/api/admin/courses/:id/modules/reorder|Save new sort order after drag-and-drop (send ordered array of IDs)|

## **7.3 Upload Endpoints**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|**POST**|/api/admin/uploads/presign|Get S3 presigned URL for direct browser-to-S3 upload|
|**DELETE**|/api/admin/uploads|Delete a file from S3 by URL|

## **7.4 Batch Endpoints**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|**GET**|/api/admin/batches|List all batches (filter by course, status)|
|**POST**|/api/admin/batches|Create a batch (linked to a course)|
|**PUT**|/api/admin/batches/:id|Update batch details|
|**DELETE**|/api/admin/batches/:id|Delete batch|
|**GET**|/api/admin/batches/:id/students|List students enrolled in this batch|
|**POST**|/api/admin/batches/:id/students|Add students to batch (array of user IDs)|
|**DELETE**|/api/admin/batches/:id/students/:uid|Remove a student from batch|
|**POST**|/api/admin/batches/:id/import|Bulk import students via CSV|

## **7.5 Online Session Endpoints**

|**Method**|**Endpoint**|**Description**|
| :- | :- | :- |
|**GET**|/api/admin/sessions|List all sessions (filter by batch, date range)|
|**POST**|/api/admin/batches/:id/sessions|Create a session for a batch|
|**PUT**|/api/admin/sessions/:id|Update session details|
|**DELETE**|/api/admin/sessions/:id|Cancel/delete session|
|**PATCH**|/api/admin/sessions/:id/recording|Add recording URL after session ends|


# **8. Phased Implementation Roadmap**
Recommended delivery order — each phase is independently deployable and testable:

|**Phase**|**Feature Area**|**Key Tasks**|**Est. Duration**|
| :- | :- | :- | :- |
|Phase 1|Course CRUD + Module CRUD|Create/edit/delete courses & modules. Basic list view. No video yet.|1\.5 weeks|
|Phase 2|Video Embedding|URL parsing for YouTube/Vimeo/Loom. S3 upload flow. Embedded player component.|1 week|
|Phase 3|Course Designer|Thumbnail upload, rich text editor, learning objectives, preview mode.|1\.5 weeks|
|Phase 4|Publish Workflow|Status state machine, pre-publish checklist, publish/unpublish API, course dashboard.|0\.5 week|
|Phase 5|Batch Management|Batch CRUD, student assignment, CSV import, batch dashboard.|1 week|
|Phase 6|Online Sessions|Session scheduling, calendar view, meeting link storage, recording URL.|1 week|
|Phase 7|Notifications|Email on session creation, 24hr reminders, enrollment confirmation.|0\.5 week|

|<p>**Total Estimated Timeline**</p><p>Phases 1–4 (Course + Video + Designer + Publish): ~4.5 weeks</p><p>Phases 5–7 (Batch + Sessions + Notifications): ~2.5 weeks</p><p>Total: ~7 weeks for full admin feature set</p><p>Note: Estimates assume 1 full-stack developer. Parallelise Phase 3 (frontend-heavy) and Phase 2 (backend-heavy) with 2 developers to save ~1 week.</p>|
| :- |


# **9. Technology Recommendations**
## **Frontend**
- Framework: React (Next.js recommended for SSR course pages)
- Rich Text: TipTap v2 — more extensible than Quill, modern React support
- Drag & Drop (module reorder): @dnd-kit/sortable
- File Upload: react-dropzone + axios for progress bar
- Image Crop: react-image-crop for enforcing thumbnail aspect ratio
- Video Player: video.js (for uploaded files) / native iframe (for YouTube/Vimeo)
- Calendar (sessions): FullCalendar React — free for basic usage
- State Management: Zustand or Redux Toolkit
- UI Component Library: shadcn/ui or Chakra UI

## **Backend**
- Runtime: Node.js (Express or Fastify) or Django REST Framework
- File Storage: AWS S3 or Cloudflare R2 (cheaper egress) with presigned URLs
- Database: PostgreSQL (relations between courses, modules, batches, sessions)
- Job Queue (notifications): Bull + Redis for delayed/scheduled emails
- Email: Nodemailer + SendGrid or AWS SES
- Authentication: JWT with admin role check on all /api/admin/\* routes

## **Security Notes**
- All admin API endpoints must check req.user.role === 'admin' middleware
- S3 presigned URLs should expire after 15 minutes
- Validate video URLs server-side before saving (whitelist YouTube/Vimeo/Loom domains)
- Sanitize rich text HTML with DOMPurify before storing (prevent XSS)
- Rate-limit CSV import endpoint (max 1000 students per upload)


*End of Implementation Plan — LMS Admin Features*
|Learning Management System  •  Admin Module|Page |
| :- | -: |
