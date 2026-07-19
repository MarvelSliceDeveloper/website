# LMS Platform — Feature Documentation & Gap Analysis

## Tech Stack

- **Backend**: Express.js (TypeScript), Prisma ORM, PostgreSQL, Redis
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind 4, ApexCharts, FullCalendar, Tiptap
- **Payments**: Razorpay
- **Email**: Brevo (Sendinblue) via React Email templates
- **Video**: YouTube Data API v3, Vimeo, Loom
- **Sessions/Calendar**: Microsoft Teams Graph API
- **Auth**: JWT (httpOnly cookies), bcrypt, Microsoft OAuth
- **Package Manager**: pnpm + Turborepo
- **Testing**: Vitest (unit/integration), Playwright (E2E)

---

## PART 1: Implemented Features

### 1. Authentication & User Management

| Feature                  | Status  | Details                                                 |
| ------------------------ | ------- | ------------------------------------------------------- |
| JWT login/logout         | ✅ Done | httpOnly cookies, HS256                                 |
| Role-based access        | ✅ Done | SUPER_ADMIN > ADMIN > INSTRUCTOR > STUDENT              |
| Registration             | ✅ Done | Zod validation, rate-limited                            |
| Password hashing         | ✅ Done | bcrypt (rounds: 12)                                     |
| mustChangePassword flow  | ✅ Done | Guest purchase → dummy password → forced reset on login |
| Change password          | ✅ Done | Settings page for all roles                             |
| Set password             | ✅ Done | /set-password page                                      |
| Microsoft Azure AD OAuth | ✅ Done | Login, callback, token refresh, consent logging         |
| User CRUD                | ✅ Done | Create, edit, suspend, soft-delete, restore             |
| User suspension          | ✅ Done | With reason tracking                                    |
| Session timeout          | ✅ Done | Per-role configurable timeout                           |
| Rate limiting            | ✅ Done | Configurable per-user limits                            |
| Login history            | ✅ Done | IP, user agent, device tracking                         |
| CSRF protection          | ✅ Done | Double-csrf with exempt paths                           |
| Super admin panel        | ✅ Done | System health, create admin, manage trash               |

### 2. Course Management

| Feature                       | Status  | Details                                        |
| ----------------------------- | ------- | ---------------------------------------------- |
| Course CRUD                   | ✅ Done | Title, description, category, tags, objectives |
| Course status workflow        | ✅ Done | DRAFT → PUBLISHED → ARCHIVED                   |
| Course thumbnail              | ✅ Done | Image upload                                   |
| Module management             | ✅ Done | Add/edit/reorder/delete                        |
| Lesson management             | ✅ Done | Add/edit/reorder/delete                        |
| Cross-type content ordering   | ✅ Done | Lessons, quizzes, assignments in any order     |
| Module free preview           | ✅ Done | Toggle per module/lesson                       |
| Lesson video types            | ✅ Done | YouTube, Vimeo, Loom, URL, uploaded            |
| YouTube auto-fetch            | ✅ Done | Fetches title/duration/thumb on URL blur       |
| Lesson resources (files)      | ✅ Done | Upload per lesson, PDF/docx/images             |
| Course soft-delete/recover    | ✅ Done | Trash management                               |
| Course publishing validation  | ✅ Done | Validates completeness before publish          |
| Batch-course visibility       | ✅ Done | Per-batch toggle                               |
| Quiz templates (attach)       | ✅ Done | Reusable quiz bank attached to courses         |
| Assignment templates (attach) | ✅ Done | Reusable assignment bank attached to courses   |

### 3. Quiz System

| Feature                | Status  | Details                               |
| ---------------------- | ------- | ------------------------------------- |
| Module quizzes         | ✅ Done | MCQs with options                     |
| Auto-grading           | ✅ Done | Score calculated from correct answers |
| Quiz attempts          | ✅ Done | Tracks submissions                    |
| Quiz templates         | ✅ Done | CRUD reusable quiz bank               |
| Student quiz view      | ✅ Done | Overdue list + start quiz flow        |
| Quiz in course content | ✅ Done | Sidebar navigation                    |
| Quiz overdue view      | ✅ Done | With start/view buttons               |
| Question management    | ✅ Done | Add/edit/delete within quiz form      |

### 4. Assignment System

| Feature                      | Status  | Details                           |
| ---------------------------- | ------- | --------------------------------- |
| Module assignments           | ✅ Done | MCQ type + file-upload type       |
| Student submissions          | ✅ Done | File upload, MCQ response         |
| Auto-grading (MCQ)           | ✅ Done | For MCQ-type assignments          |
| Manual grading (file)        | ✅ Done | With feedback, grade, total score |
| Assignment templates         | ✅ Done | CRUD reusable bank                |
| PDF question upload          | ✅ Done | For assignments                   |
| Overdue assignments view     | ✅ Done | Submit + view buttons             |
| Assignment in course content | ✅ Done | Sidebar navigation                |

### 5. Student Portal

| Feature             | Status  | Details                                              |
| ------------------- | ------- | ---------------------------------------------------- |
| Home dashboard      | ✅ Done | Stats: enrolled, completed, live today, certificates |
| Enrolled courses    | ✅ Done | With progress tracking                               |
| Course catalogue    | ✅ Done | Browse + enroll request                              |
| Course content view | ✅ Done | Two-column: video/sidebar                            |
| Video player        | ✅ Done | YouTube embed, recording playback                    |
| Live sessions view  | ✅ Done | Upcoming/active/past                                 |
| Calendar view       | ✅ Done | FullCalendar integration                             |
| Mentorship requests | ✅ Done | Create/view tickets                                  |
| Certificates        | ✅ Done | Claim + list                                         |
| Notes per course    | ✅ Done | Tiptap editor, sticky toggle                         |
| Settings            | ✅ Done | Profile, password change                             |
| Support tickets     | ✅ Done | Create, view status                                  |
| Continue learning   | ✅ Done | Resume from recording progress                       |
| Recording player    | ✅ Done | Batch recordings organized by module                 |
| Browse catalogue    | ✅ Done | Package-based purchasing                             |

### 6. Instructor Portal

| Feature            | Status  | Details                          |
| ------------------ | ------- | -------------------------------- |
| Dashboard          | ✅ Done | Stats, batch/session counts      |
| Courses view       | ✅ Done | View assigned courses            |
| Batches view       | ✅ Done | View assigned batches            |
| Session management | ✅ Done | Create Teams meetings with Graph |
| Assignment grading | ✅ Done | Grade submissions with feedback  |
| Direct messaging   | ✅ Done | With admins                      |
| Mentorship         | ✅ Done | View/complete assigned tickets   |
| Settings           | ✅ Done | Profile, password                |
| Notifications      | ✅ Done | Send custom notifications        |
| Support tickets    | ✅ Done | Raise support requests           |

### 7. Admin Dashboard & Management

| Feature              | Status  | Details                                     |
| -------------------- | ------- | ------------------------------------------- |
| Dashboard stats      | ✅ Done | Revenue, enrollments, user counts           |
| User management      | ✅ Done | CRUD, roles, suspend/restore                |
| Course builder       | ✅ Done | Details, content, sessions, recordings tabs |
| Batch management     | ✅ Done | CRUD, instructor assign, course visibility  |
| Package management   | ✅ Done | CRUD, pricing, status                       |
| Enrollment approval  | ✅ Done | Approve/reject with batch assignment        |
| Session management   | ✅ Done | Schedule Teams meetings                     |
| Calendar             | ✅ Done | View + sync                                 |
| Reports              | ✅ Done | Page exists (content TBD)                   |
| Quiz templates       | ✅ Done | CRUD                                        |
| Assignment templates | ✅ Done | CRUD                                        |
| Announcements        | ✅ Done | Send to admin/instructors                   |
| Approvals            | ✅ Done | Approve pending instructors                 |
| Notifications        | ✅ Done | View + send custom                          |
| Inbox                | ✅ Done | Messages, support, tickets                  |
| Audit logs           | ✅ Done | Login + consent combined                    |
| Login history        | ✅ Done | Per-user logins                             |
| System settings      | ✅ Done | Key-value store                             |
| API keys             | ✅ Done | Create/revoke                               |
| Permissions          | ✅ Done | Role-based overrides                        |
| Trash                | ✅ Done | Restore soft-deleted items                  |
| Microsoft settings   | ✅ Done | Manage Graph integration                    |
| Revenue & payments   | ✅ Done | Payment listing, revenue stats              |

### 8. Payments (Razorpay)

| Feature                  | Status  | Details                                  |
| ------------------------ | ------- | ---------------------------------------- |
| Order creation           | ✅ Done | POST /api/payments/create-order          |
| Payment verification     | ✅ Done | HMAC SHA256 verification                 |
| Batch selection          | ✅ Done | List available batches                   |
| Enrollment after payment | ✅ Done | Auto-enroll or consent-with-admin        |
| Guest user creation      | ✅ Done | Account + dummy password + welcome email |
| Admin payment list       | ✅ Done | With Razorpay ID, amount                 |
| Revenue stats            | ✅ Done | Dashboard charts                         |

### 9. Course Packages

| Feature               | Status  | Details                           |
| --------------------- | ------- | --------------------------------- |
| Package CRUD          | ✅ Done | Name, description, price, courses |
| Package status        | ✅ Done | DRAFT / ACTIVE / ARCHIVED         |
| Package enrollment    | ✅ Done | Approve/reject workflow           |
| Package-level batches | ✅ Done | Batches scoped to packages        |
| Public catalogue      | ✅ Done | GET /api/packages/public          |
| Guest purchase flow   | ✅ Done | Browse → Pay → Batch → Enroll     |

### 10. Live Sessions & Calendar

| Feature                  | Status  | Details                            |
| ------------------------ | ------- | ---------------------------------- |
| Microsoft Teams meetings | ✅ Done | Create via Graph API               |
| Session CRUD             | ✅ Done | Schedule, cancel, update           |
| Session status           | ✅ Done | LIVE / UPCOMING / PAST (computed)  |
| Calendar sync            | ✅ Done | Teams events → CalendarEvent model |
| Attendance tracking      | ✅ Done | Students join via "Join Now"       |
| Recording sync           | ✅ Done | Background job                     |
| Events webhook           | ✅ Done | Handle Teams events                |

### 11. Recording Management

| Feature              | Status  | Details                       |
| -------------------- | ------- | ----------------------------- |
| Teams recording sync | ✅ Done | Background job                |
| Recording playback   | ✅ Done | SharePoint URL with token     |
| Progress tracking    | ✅ Done | Watched seconds per recording |
| Per-batch recordings | ✅ Done | Organized by module           |

### 12. Email Notifications

| Feature                      | Status  | Details                              |
| ---------------------------- | ------- | ------------------------------------ |
| Brevo integration            | ✅ Done | Transactional email                  |
| Welcome email                | ✅ Done | With credentials box for guest users |
| Session scheduled            | ✅ Done | React Email template                 |
| Session cancelled            | ✅ Done | React Email template                 |
| Recording available          | ✅ Done | React Email template                 |
| Enrollment approved          | ✅ Done | React Email template                 |
| Enrollment rejected          | ✅ Done | React Email template                 |
| Assignment graded            | ✅ Done | React Email template                 |
| Mentorship notifications     | ✅ Done | Created, status changed              |
| Support ticket notifications | ✅ Done | Created, reply, status changed       |
| Custom notifications         | ✅ Done | Send via admin/instructor            |
| Notification preferences     | ✅ Done | Per-type toggle for in-app + email   |

### 13. Direct Messaging

| Feature                    | Status  | Details                            |
| -------------------------- | ------- | ---------------------------------- |
| Admin-instructor messaging | ✅ Done | Subject/body                       |
| Entity-context messages    | ✅ Done | Linked to batches/courses/sessions |
| Conversation listing       | ✅ Done | Thread view + mark read            |

### 14. Mentorship

| Feature           | Status  | Details                                           |
| ----------------- | ------- | ------------------------------------------------- |
| Ticket creation   | ✅ Done | Student creates request                           |
| Mentor assignment | ✅ Done | Admin assigns instructor                          |
| Schedule session  | ✅ Done | Teams meeting creation                            |
| Status workflow   | ✅ Done | OPEN → ASSIGNED → SCHEDULED → COMPLETED/CANCELLED |

### 15. Support Tickets

| Feature             | Status  | Details                              |
| ------------------- | ------- | ------------------------------------ |
| Ticket CRUD         | ✅ Done | Title, description                   |
| Admin response      | ✅ Done | Reply with messages                  |
| Status management   | ✅ Done | OPEN → IN_PROGRESS → RESOLVED/CLOSED |
| Email notifications | ✅ Done | Created, responded, status changed   |

### 16. Microsoft Graph Integration

| Feature                  | Status  | Details                           |
| ------------------------ | ------- | --------------------------------- |
| OAuth with admin consent | ✅ Done | Token refresh, app-only tokens    |
| User profile fetch       | ✅ Done | Microsoft user info               |
| Online meetings          | ✅ Done | Create Teams meetings             |
| Calendar                 | ✅ Done | Get calendar view, create events  |
| Recordings               | ✅ Done | Get from SharePoint               |
| Subscriptions            | ✅ Done | Webhook subscriptions for changes |
| Token encryption         | ✅ Done | AES-256-GCM                       |
| Consent logging          | ✅ Done | Grant/revoke tracking             |

### 17. File Uploads

| Feature                | Status  | Details                       |
| ---------------------- | ------- | ----------------------------- |
| Course thumbnails      | ✅ Done | Image upload                  |
| Lesson resources       | ✅ Done | PDF, docx, pptx, xlsx, images |
| Assignment submissions | ✅ Done | File upload                   |
| Assignment PDFs        | ✅ Done | Question paper upload         |
| Multer configuration   | ✅ Done | Size limits, type validation  |
| Static serving         | ✅ Done | /uploads/ and /images/        |

### 18. UI / UX

| Feature               | Status  | Details                          |
| --------------------- | ------- | -------------------------------- |
| Light/dark theme      | ✅ Done | localStorage persistence         |
| StudentPortalShell    | ✅ Done | Header, breadcrumbs, back button |
| AdminShell            | ✅ Done | Sidebar navigation               |
| InstructorShell       | ✅ Done | Sidebar navigation               |
| Responsive design     | ✅ Done | Mobile/tablet/desktop            |
| Animations            | ✅ Done | Login, spinner, drag-drop        |
| Rich text editor      | ✅ Done | Tiptap for notes                 |
| Drag-and-drop reorder | ✅ Done | Modules, content, lessons        |

---

## PART 2: Key Workflows

### A. Guest Purchase Flow

1. User browses public catalogue (`/catalogue`)
2. Selects package → clicks "Buy Now"
3. If logged in → create Razorpay order directly
4. If guest → shows name/email form → creates account with dummy password → sends order
5. Razorpay checkout opens → user pays
6. Callback verifies payment → user picks batch
7. If batch available → auto-enrolled (APPROVED)
8. If no batch suits → "Consent with Admin" → PENDING enrollment
9. Welcome email sent with credentials
10. First login → mustChangePassword → redirected to /set-password
11. Sets password → redirected to dashboard

### B. Admin Course Creation Flow

1. Admin creates course (title, description, category, tags, objectives)
2. Adds modules with titles
3. Within module: adds lessons (video URL + resources), quizzes (MCQ), assignments
4. Drag-and-drop to reorder content across types
5. Optionally attaches quiz/assignment templates
6. Publishes course (validates content)
7. Creates batch, assigns instructor, sets date range
8. Enrolls students or opens enrollment

### C. Student Learning Flow

1. Student logs in → student portal home
2. Views enrolled courses with progress
3. Opens course → two-column view (video + sidebar)
4. Watches video lessons → progress tracked automatically
5. Takes quizzes → auto-graded → results shown
6. Submits assignments → uploaded → instructor grades
7. Joins live sessions via Teams link
8. Views recordings after sessions end
9. Takes notes per course (Tiptap sticky notes)
10. Claims certificate when course completed

### D. Session & Recording Flow

1. Admin/instructor creates session (title, batch, date/time, module)
2. Microsoft Teams meeting created via Graph API
3. Students see session as upcoming
4. Session starts → status becomes LIVE → students join via "Join Now"
5. Session ends → Teams recording syncs via background job
6. Recording available → students watch → progress tracked

### E. Package & Batch Enrollment Flow

1. Admin creates package with courses + price
2. Creates batches under package with instructor
3. Toggles course visibility per batch
4. Users purchase package → select batch → auto enrolled
5. Admin can manually enroll users or approve/reject pending

### F. Notification Flow

1. System event triggers (session scheduled, enrollment approved, etc.)
2. Notification record created in database
3. If email enabled for that notification type → Brevo API called with React Email template
4. In-app notification visible in user's notification panel
5. User can mark read, mark all read, clear read

---

## PART 3: Potential Gaps & Things to Research

### Critical / High Priority

| #   | Feature                            | Notes                                                                                                 |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | **Mobile app (iOS/Android)**       | Currently web-only. Any mobile plans?                                                                 |
| 2   | **Proctored exams/quizzes**        | Current quizzes are unproctored. No webcam/monitoring.                                                |
| 3   | **Content delivery network (CDN)** | Video files served directly. No CDN for scaling.                                                      |
| 4   | **Backup & disaster recovery**     | No backup strategy, restore process, or data export documented.                                       |
| 5   | **Performance / load testing**     | No benchmarks, no load test scripts beyond k6/ directory in api.                                      |
| 6   | **CI/CD pipeline**                 | No GitHub Actions / CI workflows (only dependabot.yml exists).                                        |
| 7   | **Monitoring & alerting**          | No Sentry integration working? Sentry DSN env var exists but no frontend setup. No uptime monitoring. |
| 8   | **Search functionality**           | No full-text search for courses, users, or content.                                                   |
| 9   | **Audit trail for course changes** | No version history or change tracking for course edits.                                               |
| 10  | **Bulk operations**                | No bulk user import, bulk enrollment, or batch operations.                                            |

### Medium Priority

| #   | Feature                            | Notes                                                               |
| --- | ---------------------------------- | ------------------------------------------------------------------- |
| 11  | **Discussion forums / Q&A**        | No per-course/lesson discussion or Q&A.                             |
| 12  | **Course rating & reviews**        | No star rating or review system for courses.                        |
| 13  | **Learning paths / prerequisites** | No prerequisite chaining or learning path enforcement.              |
| 14  | **Gamification**                   | No badges, leaderboards, points, or achievements.                   |
| 15  | **SCORM / xAPI support**           | No SCORM package import or xAPI tracking.                           |
| 16  | **Multi-language / i18n**          | English only. No internationalization.                              |
| 17  | **Accessibility (a11y)**           | No WCAG audit or accessibility focus documented.                    |
| 18  | **PDF certificate generation**     | Certificates are DB records only. No PDF download.                  |
| 19  | **Course duplication**             | No "duplicate course" feature.                                      |
| 20  | **Scheduled content release**      | No drip-feed / scheduled lesson unlocking.                          |
| 21  | **Waitlist for full batches**      | No waitlist mechanism when batch is full.                           |
| 22  | **Coupons / discounts**            | No promo codes or discount system.                                  |
| 23  | **Refund workflow**                | No refund initiation, approval, or Razorpay refund API integration. |
| 24  | **Tax calculation**                | No GST/tax computation on payments.                                 |
| 25  | **Invoice generation**             | No invoice PDF on successful payment.                               |
| 26  | **Multiple instructors per batch** | Only one instructor per batch currently.                            |
| 27  | **Submissions deadline alerts**    | No automated reminders for upcoming assignment deadlines.           |
| 28  | **Email templates admin UI**       | Templates are hardcoded React Email components. No admin editor.    |
| 29  | **Content versioning**             | No revision history for course/module/lesson content.               |
| 30  | **Announcements to students**      | Announcements currently go to admin/instructors only, not students. |

### Low Priority / Nice to Have

| #   | Feature                               | Notes                                                           |
| --- | ------------------------------------- | --------------------------------------------------------------- |
| 31  | **White-label / custom branding**     | Platform name configurable but no custom logo/theme per tenant. |
| 32  | **API rate limiting per endpoint**    | Global rate limit exists but no per-endpoint granularity.       |
| 33  | **Webhook for external integrations** | Only MS Graph webhooks exist. No generic webhook system.        |
| 34  | **OAuth2 / SSO for other providers**  | Only Microsoft AD. No Google, GitHub, or SAML.                  |
| 35  | **Two-factor authentication**         | No 2FA / TOTP.                                                  |
| 36  | **Social login**                      | No Google/Facebook/LinkedIn login.                              |
| 37  | **Content bookmarking**               | No "bookmark this lesson" feature.                              |
| 38  | **Offline access**                    | No PWA or offline content download.                             |
| 39  | **Dark mode for login pages**         | Login/set-password are light-mode only.                         |
| 40  | **Analytics dashboard**               | Reports page exists but content might need expansion.           |
| 41  | **WebSocket / real-time**             | No real-time notifications (no WebSocket/SSE). Uses polling.    |
| 42  | **Student group management**          | No custom groups within batches.                                |
| 43  | **Attendance reports**                | Attendance tracked but no analytics/reports.                    |
| 44  | **Zoom / Google Meet integration**    | Only Microsoft Teams for live sessions.                         |
| 45  | **SMS notifications**                 | No SMS channel for notifications.                               |
| 46  | **Push notifications**                | No browser push or mobile push.                                 |
| 47  | **Drag-and-drop course builder**      | Modules use drag-reorder but not a visual builder.              |
| 48  | **Quiz timer**                        | No time limit on quizzes.                                       |
| 49  | **Randomized questions**              | Same questions every time. No shuffling.                        |
| 50  | **Pass/fail threshold on quizzes**    | No minimum score to pass.                                       |

---

## PART 4: API Endpoints Overview

### Auth

| Method | Route                     | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| POST   | /api/auth/register        | Register new user                         |
| POST   | /api/auth/login           | Login                                     |
| POST   | /api/auth/logout          | Logout                                    |
| GET    | /api/auth/me              | Current user profile                      |
| PATCH  | /api/auth/me/profile      | Update profile                            |
| PATCH  | /api/auth/me/password     | Change password                           |
| POST   | /api/auth/me/set-password | Set initial password (mustChangePassword) |

### Courses (Admin)

| Method         | Route                                                      | Description                |
| -------------- | ---------------------------------------------------------- | -------------------------- |
| GET/POST       | /api/admin/courses                                         | List / Create              |
| GET/PUT/DELETE | /api/admin/courses/:id                                     | Get / Update / Delete      |
| POST           | /api/admin/courses/:id/publish                             | Publish                    |
| POST           | /api/admin/courses/:id/unpublish                           | Unpublish                  |
| POST           | /api/admin/courses/:id/thumbnail                           | Upload thumbnail           |
| POST           | /api/admin/courses/:id/modules                             | Add module                 |
| PUT/DELETE     | /api/admin/courses/modules/:id                             | Update / Delete module     |
| PATCH          | /api/admin/courses/modules/reorder                         | Reorder modules            |
| PUT            | /api/admin/courses/modules/lessons/:id                     | Update lesson              |
| DELETE         | /api/admin/courses/modules/lessons/:id                     | Delete lesson              |
| POST           | /api/admin/courses/modules/:moduleId/lessons/reorder       | Reorder lessons            |
| POST           | /api/admin/courses/modules/:moduleId/content/reorder       | Reorder cross-type content |
| POST           | /api/admin/courses/modules/:moduleId/quizzes               | Add quiz                   |
| PUT/DELETE     | /api/admin/courses/modules/quizzes/:id                     | Update / Delete quiz       |
| POST           | /api/admin/courses/modules/:moduleId/assignments           | Add assignment             |
| PUT/DELETE     | /api/admin/courses/modules/assignments/:id                 | Update / Delete assignment |
| POST           | /api/admin/courses/:courseId/lessons/:lessonId/resources   | Upload resource            |
| DELETE         | /api/admin/courses/lessons/:lessonId/resources/:resourceId | Delete resource            |
| POST           | /api/admin/courses/:id/recover                             | Recover deleted course     |
| POST           | /api/admin/courses/:id/quiz-templates                      | Attach quiz template       |
| POST           | /api/admin/courses/:id/assignment-templates                | Attach assignment template |

### Batches

| Method         | Route                                               | Description              |
| -------------- | --------------------------------------------------- | ------------------------ |
| GET/POST       | /api/admin/batches                                  | List / Create            |
| GET/PUT/DELETE | /api/admin/batches/:id                              | Get / Update / Delete    |
| GET            | /api/admin/batches/:id/students                     | List batch students      |
| POST           | /api/admin/batches/:id/students                     | Add student              |
| DELETE         | /api/admin/batches/:id/students/:uid                | Remove student           |
| PUT            | /api/admin/batches/:id/courses/:courseId/visibility | Toggle course visibility |

### Packages

| Method         | Route                          | Description                |
| -------------- | ------------------------------ | -------------------------- |
| GET/POST       | /api/admin/packages            | List / Create              |
| GET/PUT/DELETE | /api/admin/packages/:id        | Get / Update / Delete      |
| PATCH          | /api/admin/packages/:id/status | Update status              |
| GET            | /api/packages/public           | Public catalogue (no auth) |

### Payments

| Method | Route                       | Description           |
| ------ | --------------------------- | --------------------- |
| POST   | /api/payments/create-order  | Create Razorpay order |
| POST   | /api/payments/verify        | Verify payment        |
| GET    | /api/payments/batches       | Available batches     |
| POST   | /api/payments/enroll        | Enroll in batch       |
| POST   | /api/payments/consent       | Consent enrollment    |
| GET    | /api/admin/payments         | List all payments     |
| GET    | /api/admin/payments/revenue | Revenue stats         |

### Student

| Method | Route                                  | Description       |
| ------ | -------------------------------------- | ----------------- |
| GET    | /api/student/assignments/overdue       | Overdue items     |
| GET    | /api/student/continue-learning         | Continue learning |
| GET    | /api/courses/enrolled                  | Enrolled courses  |
| GET    | /api/courses/catalogue                 | Course catalogue  |
| GET    | /api/courses/:courseId/content         | Course content    |
| GET    | /api/courses/quizzes/:quizId/questions | Quiz questions    |
| POST   | /api/courses/quizzes/:quizId/submit    | Submit quiz       |
| GET    | /api/courses/quizzes/:quizId/attempt   | Quiz attempt      |

### Sessions

| Method       | Route             | Description     |
| ------------ | ----------------- | --------------- |
| GET/POST     | /api/sessions     | List / Create   |
| PATCH/DELETE | /api/sessions/:id | Update / Delete |

### Recordings

| Method | Route                           | Description           |
| ------ | ------------------------------- | --------------------- |
| GET    | /api/recordings                 | List                  |
| POST   | /api/recordings/progress        | Track watch progress  |
| POST   | /api/recordings/:sessionId/sync | Sync Teams recordings |

---

## Part 5: Database Schema (46 Models)

```
User ─┬─ EnrollmentRequest
      ├─ Progress
      ├─ Certificate
      ├─ QuizAttempt
      ├─ AssignmentSubmission ─── StudentQuestionResponse
      ├─ Attendance
      ├─ Notification ─── NotificationPreference
      ├─ Message (sender/receiver)
      ├─ SupportTicket ─── SupportMessage
      ├─ MentorshipTicket ─── LiveSession
      ├─ Note
      ├─ LoginLog
      ├─ ConsentLog
      ├─ Payment
      ├─ PackageEnrollment ─── PackageEnrollmentCourse
      └─ GraphApiLog

Course ─┬─ Module ─┬─ Lesson
         │          ├─ Quiz ─── Question
         │          └─ Assignment ─── AssignmentQuestion ─── AssignmentMcqOption
         ├─ LiveSession ─── Recording ─── Progress
         │              └─ CalendarEvent
         ├─ Batch ─── BatchCourseVisibility
         ├─ Certificate
         ├─ MentorshipTicket
         ├─ PackageCourse
         └─ QuizTemplate / AssignmentTemplate (via junction tables)

CoursePackage ─┬─ PackageCourse
               ├─ Payment
               ├─ PackageEnrollment
               └─ Batch
```

---

_This document was generated for gap analysis. Feed it to ChatGPT/Cursor to identify missing features, suggest improvements, or generate a product roadmap._
