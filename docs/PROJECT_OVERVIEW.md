# LMS Portal — Project Overview

A **full-featured Learning Management System** built as a pnpm Turborepo monorepo. Three portals (Admin, Instructor, Student) manage the complete learning lifecycle: courses, live sessions (Microsoft Teams), assignments, mentorship, certificates, and payments.

---

## Who Uses It

| User | Portal | What They Do |
|---|---|---|
| **Admin** | `/admin/*` | Create courses, manage batches, schedule live sessions, assign mentors, review enrollments, manage users |
| **Instructor** | `/instructor/*` | Take live sessions, create MCQ assignments, grade submissions, mentor students |
| **Student** | `/student/` (single-page) | Enroll in courses, attend live classes, watch recordings, submit assignments, take quizzes, track progress, claim certificates |

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16 + React 19 + TypeScript 5, Tailwind CSS v4, Tabler Icons |
| **Backend** | Express + TypeScript (compiled via tsup), Prisma ORM, PostgreSQL 16, Redis 7 |
| **Auth** | JWT (httpOnly cookies), bcryptjs, role-based guards (STUDENT / INSTRUCTOR / ADMIN) |
| **Payments** | Razorpay |
| **External** | Microsoft Graph API (Teams meetings, calendar sync, recording sync) |
| **Infra** | Docker Compose (Postgres + pgAdmin + Redis), Turborepo + pnpm workspaces |

---

## Monorepo Structure

```
LMS/
├── apps/
│   ├── api/          Express + Prisma backend (port 4000)
│   └── web/          Next.js frontend (port 3000)
├── packages/
│   ├── config/       Shared ESLint + TypeScript configs
│   ├── types/        Shared TypeScript types
│   └── utils/        Shared utilities
├── docs/             Documentation
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Key Features

### Course Management
- CRUD courses with thumbnails, modules, resources
- Publish / unpublish / archive lifecycle
- Student catalogue browsing + enrollment with approval pipeline

### Batch (Cohort) Management
- Group students into batches per course
- Assign instructors to batches
- Track start/end dates and max student capacity

### Live Sessions
- Schedule sessions with auto-created Microsoft Teams meetings
- Or provide custom join URLs (Zoom, Google Meet)
- Attendance tracking, recording sync, calendar integration

### Assignments & Quizzes
- Instructors create MCQ quizzes with auto-grading
- File-upload assignments for subjective work
- Grade override and feedback system

### Mentorship
- Students request 1-on-1 mentorship
- Admin assigns mentors; mentor and student schedule sessions
- Full lifecycle: OPEN → ASSIGNED → SCHEDULED → COMPLETED / CANCELLED

### Certificates
- Auto-issued when students complete all recordings in a course
- Claimable certificates page with print support

### Microsoft Graph Integration
- Teams meeting creation, calendar sync, recording retrieval
- Webhook subscriptions for real-time updates
- Token refresh with AES-256-GCM encrypted storage

---

## Quick Start

```bash
pnpm install
docker-compose up -d          # Postgres (5433) + Redis (6379) + pgAdmin (5050)
pnpm prisma:reset             # Push schema + seed data
pnpm dev                      # API :4000 + Web :3000
```

**Seed logins:** `admin@lms.local` / `admin123`, `instructor@lms.local` / `instructor123`, `student@lms.local` / `student123`

---

## Architecture Notes

- **Student portal** is a single-page view-stack (state machine in `student/page.tsx`) — not a multi-route layout. All 10 views render in-place.
- **Admin and Instructor** portals are multi-route with sidebar layouts (`AdminShell`, `InstructorShell`).
- **API modules** are organized by domain in `apps/api/src/modules/` (auth, courses, batches, sessions, recordings, assignments, mentorship, calendar, enrollments, users, notifications, dashboard, certificates, attendance).
- **Real vs mock data**: `NEXT_PUBLIC_USE_MOCK_DATA=false` in `.env.local` toggles between API-backed and mock data for student views.
- **Notifications** use **sonner** (`bottom-right`, `richColors`) for all toast pop-ups — no inline error/success divs or `alert()` calls remain.
