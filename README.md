# LMS Portal

Unified Learning Management System monorepo — Express API + Next.js web app.

## Quick Start

```bash
pnpm install
docker-compose up -d
pnpm prisma:reset
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Landing site**: http://localhost:5173 (optional, `pnpm dev:landing`)
- **Postgres** (Docker): localhost:5433
- **Redis** (Docker): localhost:6379

## Seed Logins

| Role        | Email                | Password      |
| ----------- | -------------------- | ------------- |
| Super Admin | superadmin@lms.local | superadmin123 |
| Admin       | admin@lms.local      | admin123      |
| Instructor  | instructor@lms.local | instructor123 |
| Student     | student@lms.local    | student123    |

## Landing Site (apps/landing)

The public Marvel Slice marketing website lives in `apps/landing` — a React 19 + Vite 8 app backed by its **own Supabase database**, fully independent from the LMS portal (no shared data, auth, or API).

```bash
pnpm dev:landing     # dev server → http://localhost:5173
pnpm build:landing   # production build → apps/landing/dist
pnpm lint:landing    # oxlint
```

Setup: `cd apps/landing && cp .env.example .env`, then fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Full workflow, DB schema, and the upstream-update procedure live in `apps/landing/README.md`.

## Monorepo Layout

```
LMS/
├── apps/
│   ├── api/                  # Express + Prisma + Zod
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 46 models
│   │   │   └── seed.ts       # Dev seed data
│   │   └── src/
│   │       ├── app.ts        # Express setup
│   │       ├── index.ts      # Server entry
│   │       ├── middleware/    # Auth, CSRF, rate-limit
│   │       ├── modules/      # Feature modules (30)
│   │       │   ├── auth/
│   │       │   ├── courses/
│   │       │   ├── payments/
│   │       │   ├── batches/
│   │       │   ├── sessions/
│   │       │   ├── calendar/
│   │       │   ├── assignments/
│   │       │   ├── packages/
│   │       │   ├── dashboard/
│   │       │   ├── enrollments/
│   │       │   ├── student/
│   │       │   ├── users/
│   │       │   ├── certificates/
│   │       │   ├── messages/
│   │       │   ├── notes/
│   │       │   ├── notifications/
│   │       │   ├── mentorship/
│   │       │   ├── support/
│   │       │   ├── tickets/
│   │       │   ├── attendance/
│   │       │   ├── recordings/
│   │       │   ├── youtube/
│   │       │   ├── graph/          # MS Graph OAuth + API
│   │       │   ├── api-keys/
│   │       │   ├── permissions/
│   │       │   ├── settings/
│   │       │   ├── logs/
│   │       │   ├── quiz-templates/
│   │       │   ├── assignment-templates/
│   │       │   ├── super-admin/
│   │       │   └── announcements/
│   │       ├── services/     # Email, YouTube
│   │       ├── jobs/         # Background sync
│   │       ├── utils/        # Prisma, encryption, video parsing
│   │       └── __tests__/
│   ├── landing/               # Marvel Slice marketing site (Vite 8 + React 19 + Supabase)
│   └── web/                  # Next.js 16 + React 19 + Tailwind 4
│       └── src/
│           ├── app/          # App Router pages
│           │   ├── login/
│           │   ├── set-password/
│           │   ├── catalogue/      # Public course catalogue
│           │   ├── admin/          # Admin dashboard + management
│           │   │   ├── dashboard/
│           │   │   ├── courses/[id]/  # Course builder
│           │   │   ├── batches/
│           │   │   ├── packages/
│           │   │   ├── users/
│           │   │   ├── sessions/
│           │   │   ├── calendar/
│           │   │   ├── settings/
│           │   │   ├── reports/
│           │   │   └── ...
│           │   ├── student/        # Student portal (SPA)
│           │   │   ├── _views/     # View components
│           │   │   └── settings/
│           │   └── instructor/     # Instructor portal
│           │       ├── dashboard/
│           │       └── ...
│           ├── components/   # Shared components
│           │   ├── admin/    # AdminShell, Sidebar, StatCard
│           │   ├── student/  # StudentPortalShell
│           │   ├── shared/   # EmptyState, StatusBadge, Skeleton
│           │   └── ui/       # Badge, select
│           ├── lib/          # API client, types, helpers
│           ├── hooks/        # Custom hooks
│           └── types/        # .d.ts declarations
├── packages/
│   ├── email-templates/      # 14 React Email templates
│   └── types/                # Shared TS types
├── docs/                     # 20+ documentation files
├── scripts/                  # PowerShell test helpers
├── uploads/                  # File uploads directory
├── public/                   # Static assets
├── docker-compose.yml
├── turbo.json
├── CONTRIBUTING.md
└── AGENTS.md
```

## Environment

```env
DATABASE_URL=postgresql://lms:lms@localhost:5433/lms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-32-char-min-secret
TOKEN_ENCRYPTION_KEY=32-char-exact-key
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
YOUTUBE_API_KEY=...
BREVO_API_KEY=...
MS_CLIENT_ID=...              # Microsoft OAuth
MS_CLIENT_SECRET=...
MS_TENANT_ID=...
```

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Start API + Web dev servers (Turbo) |
| `pnpm build`         | Build all packages                  |
| `pnpm lint`          | Lint all packages                   |
| `pnpm typecheck`     | TypeScript check                    |
| `pnpm test`          | Unit tests (Vitest)                 |
| `pnpm test:e2e`      | E2E tests (Playwright)              |
| `pnpm test:all`      | All test suites                     |
| `pnpm format`        | Prettier format                     |
| `pnpm prisma:reset`  | Reset DB + seed                     |
| `pnpm prisma:studio` | Open Prisma Studio                  |
| `pnpm clean`         | Clean build outputs                 |

## Prisma Schema — 46 Models

**Auth & Users:** User, LoginLog, ApiKey, PermissionOverride, ConsentLog
**Courses:** Course, Module, Lesson, Batch, BatchCourseVisibility
**Content:** Quiz, Question, QuizAttempt, Assignment, AssignmentQuestion, AssignmentMcqOption, AssignmentSubmission, StudentQuestionResponse
**Learning:** Progress, Certificate, Note, Attendance, Recording
**Sessions:** LiveSession, CalendarEvent
**Packages:** CoursePackage, PackageCourse, PackageEnrollment, PackageEnrollmentCourse
**Payments:** Payment
**Support:** SupportTicket, SupportMessage
**Mentorship:** MentorshipTicket
**Messaging:** Message
**Notifications:** Notification, NotificationPreference
**Templates:** QuizTemplate, QuizTemplateQuestion, QuizTemplateOption, AssignmentTemplate
**Course-Template Links:** CourseQuizTemplate, CourseAssignmentTemplate
**Admin:** SystemSetting, Announcement, GraphApiLog

## Key Architecture Decisions

- **CSRF**: Double-csrf pattern with exempt paths for payments, auth set-password
- **Auth**: JWT httpOnly cookies, role hierarchy (SUPER_ADMIN > ADMIN > INSTRUCTOR > STUDENT)
- **Payments**: Razorpay, amounts in paise, guest user auto-creation
- **File uploads**: Multer, static serving at `/uploads/`
- **Video**: YouTube/Vimeo/Loom detection + embed ID extraction
- **Email**: Brevo API via React Email templates
- **Calendar/Sessions**: Microsoft Teams Graph API integration
