# LMS Portal — Revised Project Overview & Architecture

**Single-Org SaaS LMS · Microsoft Teams Integration**
**Next.js 14 · Node.js · TypeScript · PostgreSQL · Razorpay**

> **Key Changes from Original Plan**
> - ❌ Multi-tenancy removed — single organisation, multiple Admins
> - ✅ Batch = Course Cohort (e.g. "Python Batch Jan 2025")
> - ✅ Admin creates batches, assigns Mentor/Instructor per batch
> - ✅ Admin schedules all Microsoft Teams live sessions (not the instructor)
> - ✅ Students self-enroll → pay via Razorpay → Admin approves → assigned to batch

---

## 01 — Core Flow

```
Student browses course catalogue
    → clicks Enroll → pays via Razorpay
    → Enrollment Request created (status: pending)
    ↓
Admin reviews & approves request
    → Admin assigns student to a Batch (e.g. "Python Batch Jan 2025")
    ↓
Admin creates Microsoft Teams meeting
    → assigns meeting to the Batch + Instructor
    → all students in that batch see the Join URL
    ↓
Instructor conducts live session
    ↓
Recording auto-syncs from SharePoint (30 min after session ends)
    ↓
Students watch recordings, take quizzes, earn certificate
```

---

## 02 — Roles & Responsibilities

| Role | What They Can Do |
|---|---|
| **Student** | Browse courses, pay to enroll, request approval, view batch sessions, watch recordings, take quizzes, download certificate |
| **Instructor / Mentor** | View assigned batches, view students in their batch, view scheduled sessions, view recordings, grade quizzes |
| **Admin** | Everything — manage users, create courses, create batches, assign instructors, approve enrollments, schedule Teams meetings, manage payments |

> There is no Super Admin vs Tenant Admin split. All Admins have the same full platform access.

---

## 03 — Feature Plan

| Feature | Description |
|---|---|
| **User Authentication** | Registration, login, roles: Student / Instructor / Admin. Microsoft OAuth for Admins and Instructors (Teams access). Email/password for Students. |
| **Course Management** | Admins create, edit, and publish courses with modules and lessons |
| **Batch (Cohort) Management** | Admins create batches linked to a course, set a start/end date, assign one Instructor |
| **Enrollment Flow** | Student self-enrolls → pays → request sits pending → Admin approves → student is placed into a batch |
| **Live Sessions** | Admin schedules Teams meeting from LMS → assigned to a batch → join URL shown to all students in that batch |
| **Recorded Content** | Auto-synced from SharePoint/Teams 30 min after session ends, streamed via signed URL |
| **Calendar View** | Synced with Microsoft Calendar; Live Now badge on active sessions |
| **Quizzes & Assessments** | Per-module quiz builder with auto-grading |
| **Progress Tracking** | Watched-seconds per recording, completion status per student |
| **Certificates** | Auto-issued PDF on 100% course completion |
| **Payments** | Razorpay — one-time purchase per course; enrollment request unlocked on payment, access granted after admin approval |
| **Admin Panel** | Full control: users, courses, batches, enrollments, sessions, payments |
| **Discussion Forums** | Course-level discussion boards (Phase 8+) |

---

## 04 — Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Server Components, SEO, production-grade |
| Styling | Tailwind CSS + shadcn/ui | TypeScript-first, accessible components |
| State (Server) | TanStack Query | Caching, refetching, loading states |
| State (Client) | Zustand | Lightweight, no boilerplate |
| Auth | NextAuth.js + MSAL.js | Handles MS OAuth + JWT sessions |
| Forms | React Hook Form + Zod | Type-safe validation |
| Backend | Node.js + Express + TypeScript | Familiar, flexible, scalable |
| ORM | Prisma | TypeScript-native, type-safe queries |
| Database | PostgreSQL | Relational, ready for this structure |
| Cache / Queue | Redis + Bull | Background jobs, session caching |
| MS Integration | Microsoft Graph API | Teams, Calendar, Recordings |
| Payments | Razorpay | India-first, easy integration |
| Monorepo | Turborepo + pnpm workspaces | Shared types across frontend/backend |
| Hosting (API) | DigitalOcean / AWS EC2 | Node.js performance |
| Hosting (Web) | Vercel | Next.js native, edge functions |

---

## 05 — Monorepo Folder Structure

```
/lms-project
  /apps
    /web   → Next.js 14 App Router + TypeScript
    /api   → Node.js + Express + TypeScript
  /packages
    /types  → Shared TypeScript interfaces (User, Course, Batch, Session…)
    /config → Shared env/config schemas (Zod)
    /utils  → Shared date helpers, formatters
  turbo.json
  pnpm-workspace.yaml
  package.json
```

---

## 06 — Frontend Structure (`/apps/web`)

```
/app
  /(auth)
    /login
    /register
    /ms-callback              → Microsoft OAuth redirect handler

  /(student)
    /dashboard                → Enrolled batches, upcoming sessions, progress
    /courses
      /page.tsx               → Course catalogue
      /[courseId]/page.tsx    → Course detail + enroll CTA
    /batch/[batchId]
      /sessions               → Scheduled live sessions for this batch
      /recordings             → Past recordings for this batch
      /learn/[sessionId]      → Individual recording stream (SharePoint)
    /calendar                 → MS Calendar view + Live Now badge
    /live/[meetingId]         → Join live Teams session page
    /certificates             → Download earned certificates

  /(instructor)
    /dashboard                → Assigned batches overview
    /batch/[batchId]
      /students               → Students in this batch
      /sessions               → Sessions scheduled by admin
      /recordings             → Recordings from past sessions

  /(admin)
    /dashboard                → Platform overview: users, revenue, active batches
    /courses                  → Create / edit / publish courses
    /batches
      /page.tsx               → All batches (filter by course, status)
      /new                    → Create new batch, assign instructor, set dates
      /[batchId]
        /students             → Enrolled students, approve/reject pending
        /sessions             → Schedule Teams meeting, view all sessions
        /recordings           → All recordings for this batch
    /enrollments              → All pending enrollment requests (approve/reject)
    /users                    → Manage all students and instructors
    /payments                 → Revenue, transactions, Razorpay dashboard

/components
  /ui          → shadcn/ui base components
  /course      → CourseCard, CurriculumSidebar
  /batch       → BatchCard, StudentList, EnrollmentRequestList
  /calendar    → CalendarView, LiveBadge
  /video       → TeamsRecordingPlayer, SessionCard
  /layout      → Navbar, Sidebar, RoleShell

/lib
  /msal.ts     → Microsoft MSAL config
  /api.ts      → TanStack Query API client
  /auth.ts     → NextAuth config (MS Provider + credentials)

/hooks
  useCalendarEvents.ts
  useRecordings.ts
  useLiveSessions.ts
  useBatch.ts
  useEnrollments.ts
```

---

## 07 — Backend Structure (`/apps/api`)

```
/src
  /modules
    /auth
      auth.routes.ts         → /auth/login /auth/ms-callback
      auth.controller.ts
      auth.service.ts        → JWT issue, MS token exchange
      auth.middleware.ts     → Verify JWT + role guard

    /users
      user.routes.ts
      user.service.ts        → Create, list, update roles

    /courses
      course.routes.ts       → CRUD courses + modules
      course.service.ts

    /batches
      batch.routes.ts        → CRUD batches, assign instructor, list students
      batch.service.ts       → Core batch management logic

    /enrollments
      enrollment.routes.ts   → Student applies, admin approves/rejects
      enrollment.service.ts  → Status management + batch assignment on approval

    /sessions
      session.routes.ts
      session.service.ts     → Admin creates Teams meeting, assigns to batch
      session.scheduler.ts   → Cron: notify students of upcoming sessions

    /calendar
      calendar.routes.ts
      calendar.service.ts    → Sync MS Calendar events to DB
      calendar.webhook.ts    → Handle Graph change notifications

    /recordings
      recording.routes.ts
      recording.service.ts   → Fetch recording URLs from Graph API
      recording.sync.ts      → Cron: poll for new recordings after session ends

    /payments
      payment.routes.ts
      payment.service.ts     → Razorpay order create + webhook verify
                                On success: create EnrollmentRequest (pending)

    /progress
      progress.routes.ts
      progress.service.ts    → Track watched seconds per recording per user

    /certificates
      certificate.service.ts → Issue PDF when course progress = 100%

    /quizzes
      quiz.routes.ts
      quiz.service.ts        → Quiz CRUD, submission, auto-grading

    /graph                   ← Central Microsoft Graph API module
      graph.client.ts        → Authenticated Graph client (admin user token)
      graph.meetings.ts      → Create/get Teams meetings
      graph.calendar.ts      → Read calendar events
      graph.recordings.ts    → Fetch call records + recording URLs
      graph.subscriptions.ts → Create/renew webhooks

  /middleware
    errorHandler.ts
    roleGuard.ts             → STUDENT | INSTRUCTOR | ADMIN checks
    rateLimiter.ts

  /config
    database.ts              → Prisma client singleton
    redis.ts                 → Redis + Bull queue client
    env.ts                   → Zod-validated environment variables

  /jobs
    recordingSync.job.ts     → Triggers 30 min after session ends
    calendarSync.job.ts      → Periodic calendar refresh
    certificateIssue.job.ts  → Issue cert when progress = 100%

  server.ts
```

---

## 08 — Database Schema (Prisma + PostgreSQL)

```prisma
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

enum EnrollmentStatus {
  PENDING    // paid, waiting admin approval
  APPROVED   // admin approved, assigned to batch
  REJECTED
}

model User {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  passwordHash    String?  // null for MS OAuth users
  msUserId        String?  // Microsoft Object ID
  msAccessToken   String?  // AES-256 encrypted
  msRefreshToken  String?  // AES-256 encrypted
  role            Role
  enrollments     EnrollmentRequest[]
  progress        Progress[]
  certificates    Certificate[]
  instructorOf    Batch[]  @relation("BatchInstructor")
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String
  price       Float
  isPublished Boolean  @default(false)
  modules     Module[]
  batches     Batch[]
}

model Module {
  id       String       @id @default(cuid())
  courseId String
  title    String
  order    Int
  course   Course       @relation(fields: [courseId], references: [id])
  sessions LiveSession[]
  quizzes  Quiz[]
}

// A Batch is a course cohort — e.g. "Python Batch Jan 2025"
model Batch {
  id           String              @id @default(cuid())
  courseId     String
  instructorId String              // Assigned mentor/instructor
  name         String              // e.g. "Python Batch Jan 2025"
  startDate    DateTime
  endDate      DateTime
  isActive     Boolean             @default(true)
  course       Course              @relation(fields: [courseId], references: [id])
  instructor   User                @relation("BatchInstructor", fields: [instructorId], references: [id])
  enrollments  EnrollmentRequest[]
  sessions     LiveSession[]
}

// Student applies → pays → pending → admin approves → assigned to batch
model EnrollmentRequest {
  id        String           @id @default(cuid())
  userId    String
  courseId  String           // Which course they paid for
  batchId   String?          // Filled by admin on approval
  status    EnrollmentStatus @default(PENDING)
  payment   Payment?
  appliedAt DateTime         @default(now())
  reviewedAt DateTime?
  user      User             @relation(fields: [userId], references: [id])
  batch     Batch?           @relation(fields: [batchId], references: [id])
}

// Admin creates Teams meeting → assigns to a batch
model LiveSession {
  id              String    @id @default(cuid())
  batchId         String    // Which batch this session is for
  moduleId        String?
  teamsMeetingId  String    @unique
  joinUrl         String
  scheduledAt     DateTime
  endedAt         DateTime?
  createdBy       String    // Admin user ID
  batch           Batch     @relation(fields: [batchId], references: [id])
  recording       Recording?
  calendarEvent   CalendarEvent?
}

model Recording {
  id               String    @id @default(cuid())
  sessionId        String    @unique
  teamsRecordingId String
  sharePointUrl    String    // Expires ~1hr — re-fetch on every play
  duration         Int       // seconds
  syncedAt         DateTime
  progress         Progress[]
  session          LiveSession @relation(fields: [sessionId], references: [id])
}

model CalendarEvent {
  id          String      @id @default(cuid())
  msEventId   String      @unique
  title       String
  startAt     DateTime
  endAt       DateTime
  joinUrl     String?
  sessionId   String?     @unique
  session     LiveSession? @relation(fields: [sessionId], references: [id])
}

model Progress {
  id             String    @id @default(cuid())
  userId         String
  recordingId    String
  watchedSeconds Int
  completedAt    DateTime?
  user           User      @relation(fields: [userId], references: [id])
  recording      Recording @relation(fields: [recordingId], references: [id])
}

model Certificate {
  id       String   @id @default(cuid())
  userId   String
  courseId String
  issuedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
}

model Payment {
  id                 String   @id @default(cuid())
  enrollmentId       String   @unique
  razorpayOrderId    String
  razorpayPaymentId  String?
  status             String   // created | paid | failed
  amount             Float
  createdAt          DateTime @default(now())
  enrollment         EnrollmentRequest @relation(fields: [enrollmentId], references: [id])
}

model Quiz {
  id        String         @id @default(cuid())
  moduleId  String
  title     String
  questions Question[]
  module    Module         @relation(fields: [moduleId], references: [id])
}

model Question {
  id            String   @id @default(cuid())
  quizId        String
  text          String
  options       Json     // [{label, isCorrect}]
  quiz          Quiz     @relation(fields: [quizId], references: [id])
}
```

---

## 09 — Microsoft Graph API — Integration Flows

### 1. Calendar Sync
```
GET /me/calendarView?startDateTime=…&endDateTime=…
  → Store events in CalendarEvent table
  → Frontend shows calendar; "Live Now" badge if now is between startAt and endAt
```

### 2. Admin Creates Meeting from LMS (main flow)
```
Admin fills session form (batch, module, date/time)
  → POST /me/onlineMeetings { startDateTime, endDateTime, subject }
  → Store teamsMeetingId + joinUrl in LiveSession (batchId set)
  → All students enrolled in that batch can see the join URL
```

### 3. Recording Sync (after session ends)
```
Bull job triggers 30 min after session.scheduledAt + estimated duration
  → GET /communications/callRecords?$filter=…
  → Fetch SharePoint temporary signed URL
  → Store sharePointUrl in Recording table
  → Frontend: re-fetch fresh signed URL on each play (URLs expire ~1 hr)
```

---

## 10 — Authentication Architecture

| Path | Flow |
|---|---|
| **Microsoft OAuth** (Admins & Instructors) | MSAL.js popup → MS returns auth code → NextAuth exchanges for access_token + refresh_token → Backend stores tokens (AES-256 encrypted) → Issue own JWT for API calls |
| **Email / Password** (Students) | Register/Login → bcrypt hash → JWT issued → Student can link MS account later if needed |

> Token refresh runs as a background job before expiry. Graph API calls for scheduling meetings use the Admin's stored MS token.

---

## 11 — Payment & Enrollment Flow

```
Student clicks "Enroll" on Course Detail page
  ↓
POST /payments/create-order
  → Backend creates Razorpay order → returns { orderId, amount, currency }
  ↓
Frontend opens Razorpay checkout widget
  ↓
Student pays → Razorpay fires webhook to POST /payments/webhook
  ↓
Backend verifies HMAC signature
  → Creates EnrollmentRequest { status: PENDING }
  ↓
Admin sees pending request in /admin/enrollments
  → Admin approves + assigns to a Batch
  → EnrollmentRequest { status: APPROVED, batchId: "..." }
  ↓
Student gets access to batch sessions, recordings, and materials
```

---

## 12 — Key Pages

**Student**
- Course catalogue (landing / browse)
- Course detail + Enroll CTA
- Student dashboard — enrolled batches, upcoming sessions, progress
- Batch session page — join URL, recordings list
- Recording player (SharePoint stream)
- Calendar — MS Calendar sync with Live Now badge
- Certificate download page

**Instructor / Mentor**
- Instructor dashboard — assigned batches
- Batch detail — student list, sessions, recordings
- (No meeting creation — Admin handles this)

**Admin**
- Admin dashboard — platform overview
- Course management (create / edit / publish)
- Batch management (create batch → assign instructor → manage students)
- Enrollment requests (pending approvals)
- Session scheduling (Teams meeting creation → assign to batch)
- User management
- Payments & revenue

---

## 13 — Hosting Plan

| Service | Provider | Notes |
|---|---|---|
| Frontend (Next.js) | Vercel | Native Next.js support, edge functions |
| Backend API | DigitalOcean / AWS EC2 | Docker container, PM2 |
| Database | Supabase / Neon / RDS | Managed PostgreSQL |
| Cache + Queues | Upstash Redis | Serverless Redis, free tier available |
| Video Storage | SharePoint (via Teams) | No separate storage needed |
| Dev Tunnels | ngrok | For Graph API webhooks in local dev |

---

## 14 — Critical Pre-Coding Decisions

| Decision | Recommendation |
|---|---|
| **Azure AD App Mode** | Single Azure AD app (not per-user apps). Admin authenticates once; their token is used for all Graph API calls (meeting creation, calendar sync). |
| **Calendar Sync Strategy** | Polling first (simpler), webhooks in production for real-time sync. |
| **SharePoint URL expiry** | Signed URLs expire in ~1 hr. Never store permanently. Re-fetch from Graph API every time a student hits play. |
| **Role Guard** | All admin routes protected by role middleware. Instructors can only see their assigned batches — enforced at the service layer, not just the frontend. |
| **Enrollment State Machine** | PENDING → APPROVED (with batchId) or REJECTED. Once approved, batch membership is the source of truth for access. |

---

## 15 — Project Plan & Timeline

**11 Phases · 17 Weeks · ~4.5 Months**

| # | Phase | Weeks | Duration |
|---|---|---|---|
| 1 | Foundation & Setup | 1 | 1 week |
| 2 | Authentication | 2–3 | 2 weeks |
| 3 | Batch & Enrollment Management | 3–4 | 2 weeks |
| 4 | Azure AD + Graph API Setup | 4–5 | 2 weeks |
| 5 | Calendar Sync + UI | 5–6 | 2 weeks |
| 6 | Live Sessions (Admin-driven) | 7–8 | 2 weeks |
| 7 | Recordings | 9–10 | 2 weeks |
| 8 | LMS Core (Courses, Progress, Dashboard) | 11–12 | 2 weeks |
| 9 | Payments (Razorpay) | 13 | 1 week |
| 10 | Quizzes + Certificates | 14–15 | 2 weeks |
| 11 | Admin Panel + Launch | 16–17 | 2 weeks |

---

### Phase Detail

**Phase 1 — Foundation & Setup (Week 1)**
- Initialise Turborepo + pnpm monorepo
- Create shared types package (User, Course, Batch, Session…)
- Set up Prisma with full PostgreSQL schema
- Zod env validation, ESLint, Prettier, Husky
- Docker Compose for local dev (Postgres + Redis)

**Phase 2 — Authentication (Week 2–3)**
- Email/password for students (bcrypt + JWT)
- Microsoft OAuth via MSAL.js + NextAuth for Admins & Instructors
- AES-256 token encryption in DB
- Role-based middleware (STUDENT / INSTRUCTOR / ADMIN)
- Token refresh background job

**Phase 3 — Batch & Enrollment Management (Week 3–4)**
- Batch CRUD (create batch, link to course, assign instructor, set dates)
- Admin: enrollment request review (approve → assign to batch / reject)
- Instructor: view assigned batches and student lists
- Student: view batch sessions and materials after approval

**Phase 4 — Azure AD + Graph API Setup (Week 4–5)**
- Register multi-tenant Azure AD app
- Configure permissions: `Calendars.Read`, `OnlineMeetings.ReadWrite`, `OnlineMeetingRecording.Read.All`, `CallRecords.Read.All`
- Build Graph API client module using Admin's stored token
- Test MS token exchange end-to-end

**Phase 5 — Calendar Sync + UI (Week 5–6)**
- Poll `GET /me/calendarView` to fetch events into CalendarEvent table
- Calendar UI with monthly/weekly view
- Live Now badge logic
- Optional: Graph webhook for real-time sync (production)

**Phase 6 — Live Sessions / Admin-driven (Week 7–8)**
- Admin session form → `POST /me/onlineMeetings` → stored against batch
- Join URL displayed to all students in the batch
- Graph webhook for Teams-created meetings (createdFrom: TEAMS)
- ngrok setup for local webhook testing

**Phase 7 — Recordings (Week 9–10)**
- Bull job triggers 30 min after session ends
- Fetch call records + SharePoint signed URL
- Store in Recording table; re-fetch on every play
- Video player with HLS/signed URL streaming
- Watched-seconds progress tracking

**Phase 8 — LMS Core (Week 11–12)**
- Course CRUD (create, edit, publish, archive)
- Module and lesson management
- Student dashboard (batches, progress bars, upcoming sessions)
- Landing page with course catalogue

**Phase 9 — Payments (Week 13)**
- `POST /payments/create-order` → Razorpay order
- Frontend Razorpay checkout widget
- Webhook → HMAC verify → create EnrollmentRequest (PENDING)
- Admin approval → batch assignment → course access granted

**Phase 10 — Quizzes + Certificates (Week 14–15)**
- Quiz builder per module (MCQ + short answer)
- Auto-grading and score recording
- Auto-issue PDF certificate on 100% course completion
- Certificate verification page (public URL)

**Phase 11 — Admin Panel + Launch (Week 16–17)**
- Full admin dashboard: all courses, batches, users, payments
- Production deploy: Vercel (web) + EC2 (API) + Supabase (DB)
- DNS, SSL, monitoring (Sentry, Upstash)
- Load testing and security hardening
- Go live!

---

### Key Milestones

| Milestone | Target | Description |
|---|---|---|
| Auth + Batch Shell Live | End of Week 4 | Users can register/login, admins can create batches and assign instructors |
| MS Calendar Integrated | End of Week 6 | Calendar page shows MS Calendar events with Live Now badge |
| Live Sessions + Recordings End-to-End | End of Week 10 | Admin schedules Teams meeting for a batch; students join live; recordings auto-sync |
| Full LMS Core Working | End of Week 12 | Courses, modules, batches, enrollment approval, progress tracking all functional |
| Payments Live | End of Week 13 | Students pay → pending → admin approves → batch access granted |
| Production Launch | End of Week 17 | Full platform deployed; admin panels live; monitored and hardened |

---

*LMS Portal — Revised Architecture · Single-Org · Batch-Cohort Model · Admin-Driven Sessions*
