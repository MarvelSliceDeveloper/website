# LMS Portal — Technical Architecture

> Next.js 14 · Node.js · Express · TypeScript · PostgreSQL · Prisma · Redis · Razorpay · Microsoft Graph API

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | Server Components, SSR, SEO, production-grade |
| **Styling** | Tailwind CSS + shadcn/ui | TypeScript-first, accessible component library |
| **Server State** | TanStack Query | Caching, refetching, loading/error states |
| **Client State** | Zustand | Lightweight, no boilerplate |
| **Auth** | NextAuth.js + MSAL.js | MS OAuth + email/password + JWT sessions |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Backend** | Node.js + Express + TypeScript | REST API, modular architecture |
| **ORM** | Prisma | TypeScript-native, type-safe queries, migrations |
| **Database** | PostgreSQL | Relational, multi-tenant, RLS support |
| **Cache / Queue** | Redis + Bull | Background jobs, session cache, rate limiting |
| **MS Integration** | Microsoft Graph API | Teams meetings, Calendar, Recordings, Webhooks |
| **Payments** | Razorpay | One-time, subscription, freemium models |
| **Email** | Resend / AWS SES + React Email | Transactional emails with tenant branding |
| **File Storage** | AWS S3 / Cloudflare R2 | Course thumbnails, certificates, uploads |
| **Search** | PostgreSQL Full-Text Search | Course search, autocomplete |
| **Monorepo** | Turborepo + pnpm workspaces | Shared types across frontend/backend |
| **Testing** | Vitest + Playwright + MSW | Unit, integration, E2E, API mocking |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy |
| **Error Tracking** | Sentry | Frontend + backend error reporting |
| **Logging** | Pino / Winston | Structured JSON logging |
| **Hosting (Web)** | Vercel | Native Next.js support, edge functions |
| **Hosting (API)** | DigitalOcean / AWS EC2 | Docker container, PM2, nginx |
| **Hosting (DB)** | Supabase / Neon / AWS RDS | Managed PostgreSQL |
| **Hosting (Cache)** | Upstash Redis | Serverless Redis |

---

## 2. Monorepo Structure

```
/lms-project
  /apps
    /web                    → Next.js 14 App Router + TypeScript
    /api                    → Node.js + Express + TypeScript
  /packages
    /types                  → Shared TypeScript interfaces (User, Course, Session…)
    /config                 → Shared env/config schemas (Zod)
    /utils                  → Shared date helpers, formatters, slug generator
  /tests
    /e2e                    → Playwright E2E tests
    /integration            → API integration tests
  turbo.json
  pnpm-workspace.yaml
  package.json
  docker-compose.yml        → PostgreSQL + Redis for local dev
  .github/workflows/        → CI/CD pipelines
```

---

## 3. Frontend Route Structure (`/apps/web`)

```
/app
  /(auth)
    /login                  → Email/password + MS OAuth login
    /register               → Registration form
    /ms-callback            → Microsoft OAuth callback handler
    /forgot-password        → Password reset request
    /reset-password         → Set new password

  /(tenant)/[tenantSlug]
    /                       → Landing page (hero, featured courses, stats)
    /dashboard              → Student dashboard (enrolled, progress, upcoming)
    /courses                → Course catalog (search, filter, sort)
    /courses/[courseId]      → Course detail (curriculum, instructor, enroll CTA)
    /learn/[sessionId]      → Video player + sidebar curriculum
    /calendar               → MS Calendar view (monthly/weekly/daily)
    /live/[meetingId]       → Join live Teams session
    /quiz/[quizId]          → Take quiz
    /certificates           → Student's earned certificates

  /(instructor)/[tenantSlug]/panel
    /courses                → Create / edit courses + modules
    /sessions               → Schedule Teams meetings
    /students               → View enrolled students + progress
    /recordings             → All past session recordings

  /(admin)/dashboard
    /tenants                → Manage all organisations (Super Admin)
    /users                  → All users across tenants
    /payments               → Revenue, subscriptions, refunds

  /verify/[code]            → Public certificate verification (no auth)

/components                 → ui / course / calendar / video / layout / quiz
/lib                        → msal.ts, api.ts, auth.ts, upload.ts
/hooks                      → useCalendarEvents, useRecordings, useLiveSessions, useTenant
```

---

## 4. Backend Module Structure (`/apps/api`)

```
/src
  /modules
    /auth           → Registration, login, JWT, MS OAuth, token refresh
    /tenants        → Onboard org, tenant config, plan limits
    /users          → Link MS identity, profile management
    /courses        → CRUD courses + modules + lessons
    /sessions       → Create meeting via Graph API, manage sessions
    /calendar       → Sync MS Calendar, webhook for real-time updates
    /recordings     → Fetch recording URLs, sync job, metadata
    /enrollments    → Enrollment management, capacity checks
    /payments       → Razorpay orders, webhook, refunds, invoices
    /progress       → Track watched seconds, course completion
    /certificates   → Issue PDF on completion, verification endpoint
    /quizzes        → Quiz CRUD, question management, grading
    /discussions    → Forum threads, replies, mentions
    /notifications  → In-app + email notification dispatch
    /uploads        → File upload (images, documents)
    /search         → Full-text search across courses
    /admin          → Super admin operations, analytics
    /graph          → Central MS Graph module
      graph.client.ts         → Authenticated Graph client (per user/app)
      graph.meetings.ts       → Create/get Teams meetings
      graph.calendar.ts       → Read/write calendar events
      graph.recordings.ts     → Fetch call records + recording URLs
      graph.subscriptions.ts  → Create/renew/delete webhooks
      graph.users.ts          → MS user profile sync

  /jobs
    recordingSync.job.ts      → Trigger 30 min after session ends
    calendarSync.job.ts       → Periodic calendar refresh per tenant
    certificateIssue.job.ts   → Issue cert when progress = 100%
    tokenRefresh.job.ts       → Renew MS tokens before expiry
    subscriptionRenewal.job.ts → Renew Graph webhook subscriptions

  /middleware
    auth.middleware.ts        → JWT validation + req.user
    tenant.middleware.ts      → Tenant resolution + req.tenant
    role.middleware.ts        → Role-based access control
    rateLimit.middleware.ts   → Per-route rate limiting
    requestId.middleware.ts   → Unique request ID for tracing
    errorHandler.middleware.ts → Global error handling

  /utils
    encryption.ts             → AES-256 encrypt/decrypt
    logger.ts                 → Structured logging (pino)
    email.ts                  → Email sending utility
    pdf.ts                    → PDF generation (certificates, invoices)
```

---

## 5. Database Schema (Prisma + PostgreSQL)

### Core Tables

| Table | Key Fields | Relations |
|-------|-----------|-----------|
| **Tenant** | id, name, slug (unique), msTenantId, plan, brandColor, logo, features | → Users, Courses, CalendarEvents |
| **User** | id, tenantId, name, email, msUserId, msAccessToken (encrypted), msRefreshToken (encrypted), role, avatar | → Tenant, Enrollments, Progress |
| **Course** | id, tenantId, title, description, instructorId, price, isPublished, thumbnail, category, level, tags | → Tenant, Modules, Enrollments |
| **Module** | id, courseId, title, order | → Course, Sessions, Lessons, Quizzes |
| **Lesson** | id, moduleId, title, type (video/text/quiz), order, content | → Module |
| **LiveSession** | id, courseId, moduleId, teamsMeetingId (unique), joinUrl, scheduledAt, endedAt, createdFrom | → Course, Module, Recording |
| **Recording** | id, sessionId (unique), teamsRecordingId, sharePointUrl, duration, syncedAt, viewCount | → LiveSession |
| **CalendarEvent** | id, tenantId, msEventId, title, startAt, endAt, joinUrl, sessionId | → Tenant, LiveSession |
| **Enrollment** | id, userId, courseId, enrolledAt | → User, Course (unique: userId+courseId) |
| **Progress** | id, userId, recordingId, watchedSeconds, completedAt | → User, Recording (unique: userId+recordingId) |
| **Certificate** | id, userId, courseId, issuedAt, verificationCode (unique), pdfUrl | → User, Course |
| **Payment** | id, userId, courseId, razorpayOrderId, razorpayPaymentId, status, amount | → User, Course |

### Additional Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **Quiz** | id, moduleId, title, passingScore, timeLimit, isPublished | Quiz definition |
| **Question** | id, quizId, type, text, options (JSON), correctAnswer, points, order | Quiz questions |
| **QuizAttempt** | id, userId, quizId, score, totalPoints, passed, startedAt, completedAt | Student quiz attempt |
| **QuestionResponse** | id, attemptId, questionId, selectedAnswer, isCorrect, pointsEarned | Per-question response |
| **Discussion** | id, courseId, userId, title, content, isPinned, createdAt | Forum thread |
| **DiscussionReply** | id, discussionId, userId, content, createdAt | Forum reply |
| **Notification** | id, userId, type, title, message, isRead, createdAt | In-app notification |
| **Attendance** | id, sessionId, userId, joinedAt, leftAt | Live session attendance |
| **Category** | id, tenantId, name, slug | Course categorisation |

---

## 6. Microsoft Graph API Integration Flows

### Flow 1: Calendar Sync
```
[MS Calendar] → GET /me/calendarView → [CalendarEvent table] → [Calendar UI]
                                                                  ↳ "Live Now" badge
```

### Flow 2: Create Meeting from LMS
```
[Instructor Form] → POST /me/onlineMeetings → [LiveSession table] → [Student Dashboard]
                                               [CalendarEvent table]   ↳ "Join Now" button
```

### Flow 3: Sync Meeting Created in Teams
```
[Instructor creates in Teams] → Graph Webhook fires → [Backend parses event]
→ [LiveSession (createdFrom: TEAMS)] + [CalendarEvent]
```

### Flow 4: Recording Sync (Post-Session)
```
[Session ends] → Bull job (30 min delay) → GET /communications/callRecords
→ Fetch SharePoint signed URL → [Recording table]
→ [Student clicks play] → Re-fetch fresh URL (expires ~1hr) → [Video Player]
```

---

## 7. Authentication Architecture

```
Option A: Microsoft OAuth
  MSAL.js popup → MS auth code → NextAuth → access_token + refresh_token
  → Backend stores AES-256 encrypted → Issues own JWT

Option B: Email/Password
  Register form → bcrypt hash → JWT issued
  → User links MS account later to unlock Teams features

Token Strategy:
  - Access token: 15 min expiry
  - Refresh token: 7 days expiry (rotated on use)
  - MS tokens: stored per-user, auto-refreshed via background job
```

---

## 8. Hosting Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel          │     │  EC2 / DO        │     │  Supabase / RDS  │
│   (Next.js)       │────▶│  (Express API)   │────▶│  (PostgreSQL)    │
│   Edge Functions  │     │  Docker + PM2    │     │  + Connection    │
│   CDN             │     │  nginx reverse   │     │    Pooling       │
└──────────────────┘     │  proxy           │     └──────────────────┘
                          │                  │             ▲
                          │                  │     ┌───────┴──────────┐
                          │                  │────▶│  Upstash Redis   │
                          └──────────────────┘     │  (Cache + Bull   │
                                                   │   Queues)        │
                                                   └──────────────────┘
```

