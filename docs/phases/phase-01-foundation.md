# Phase 1 — Foundation & Setup

> ⏱️ **Duration**: Week 1 (1 week)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 0

---

## 🎯 Objective

Scaffold the full monorepo, configure the database schema, set up shared packages, and ensure the dev environment is ready for all team members.

---

## ✅ Tasks

### 1.1 — Monorepo Initialization

- [ ] Initialize **Turborepo** with pnpm workspaces
- [ ] Create workspace structure:
  ```
  /lms-project
    /apps
      /web          → Next.js 14 App Router + TypeScript
      /api          → Node.js + Express + TypeScript
    /packages
      /types        → Shared TypeScript interfaces
      /config       → Shared env/config schemas (Zod)
      /utils        → Shared date helpers, formatters
    turbo.json
    pnpm-workspace.yaml
    package.json
  ```
- [ ] Configure `turbo.json` with build/dev/lint/test pipelines
- [ ] Verify `pnpm dev` starts both `web` and `api` concurrently

### 1.2 — Next.js App Setup (`/apps/web`)

- [ ] Initialize Next.js 14 with App Router and TypeScript
- [ ] Install and configure **Tailwind CSS** + **shadcn/ui**
- [ ] Set up app directory structure:
  ```
  /app
    /(auth)          → /login, /register, /ms-callback
    /(platform)/[platformSlug]
    /(instructor)/panel
    /(admin)/dashboard
  /components        → ui / course / calendar / video / layout
  /lib               → msal.ts, api.ts, auth.ts
  /hooks             → custom React hooks
  ```
- [ ] Create a basic layout with placeholder navigation
- [ ] Set up **Inter** or **Outfit** font from Google Fonts
- [ ] Configure `next.config.js` with image domains, redirects

### 1.3 — Express API Setup (`/apps/api`)

- [ ] Initialize Express with TypeScript
- [ ] Set up modular folder structure:
  ```
  /src
    /modules
      /auth        → routes, controller, service, middleware
      /platforms
      /users
      /courses
      /sessions
      /calendar
      /recordings
      /enrollments
      /payments
      /progress
      /certificates
      /graph       → central MS Graph module
    /jobs          → Bull job definitions
    /middleware     → global middleware
    /utils         → helpers
    index.ts       → server entry point
  ```
- [ ] Set up global error handling middleware
- [ ] Set up request ID middleware (for structured logging)
- [ ] Set up CORS configuration
- [ ] Set up rate limiting middleware (express-rate-limit)
- [ ] Create health check endpoint: `GET /health`

### 1.4 — Prisma & Database Schema

- [ ] Install Prisma and initialize with PostgreSQL provider
- [ ] Define **all core tables** in `schema.prisma`:
  - `platform` — id, name, slug (unique), msplatformId (unique), plan (free/pro/enterprise)
  - `User` — id, , name, email, msUserId, msAccessToken (encrypted), msRefreshToken (encrypted), role (STUDENT/INSTRUCTOR/ADMIN), avatar
  - `Course` — id, , title, description, instructorId, price, isPublished, thumbnail, category, tags
  - `Module` — id, courseId, title, order
  - `LiveSession` — id, courseId, moduleId, teamsMeetingId (unique), joinUrl, scheduledAt, endedAt, createdFrom (LMS/TEAMS)
  - `Recording` — id, sessionId (unique), teamsRecordingId, sharePointUrl, duration, syncedAt
  - `CalendarEvent` — id, , msEventId, title, startAt, endAt, joinUrl, sessionId
  - `Enrollment` — id, userId, courseId, enrolledAt
  - `Progress` — id, userId, recordingId, watchedSeconds, completedAt
  - `Certificate` — id, userId, courseId, issuedAt, verificationCode (unique)
  - `Payment` — id, userId, courseId, razorpayOrderId, razorpayPaymentId, status (created/paid/failed), amount
  - **🆕 `Notification`** — id, userId, type, title, message, isRead, createdAt
  - **🆕 `Discussion`** — id, courseId, userId, title, content, createdAt
  - **🆕 `DiscussionReply`** — id, discussionId, userId, content, createdAt
- [ ] Add database indexes:
  - `User`: composite index on `(, email)`
  - `Course`: index on ``, `instructorId`
  - `Enrollment`: unique constraint on `(userId, courseId)`
  - `Progress`: unique constraint on `(userId, recordingId)`
  - `CalendarEvent`: index on `(, startAt)`
- [ ] Run `prisma migrate dev` to create initial migration
- [ ] Seed script with sample platform + admin user for development

### 1.5 — Shared Packages

- [ ] `/packages/types` — Define TypeScript interfaces:
  - User, platform, Course, Module, Session, Recording, Enrollment, etc.
  - API response types: `ApiResponse<T>`, `PaginatedResponse<T>`, `ErrorResponse`
  - Role enums: `UserRole`, `CoursePlan`, `PaymentStatus`
- [ ] `/packages/config` — Zod env validation schemas:
  - Database URL, Redis URL, JWT secret, MS client ID/secret, Razorpay keys
  - Separate schemas for `web` and `api` apps
- [ ] `/packages/utils` — Shared helpers:
  - Date formatters (relative time, calendar display)
  - Currency formatter (INR)
  - Slug generator
  - Pagination helper

### 1.6 — Docker Compose for Local Dev

- [ ] Create `docker-compose.yml` with:
  - PostgreSQL 16 container (port 5432)
  - Redis 7 container (port 6379)
  - pgAdmin (optional, for database inspection)
- [ ] Document startup: `docker-compose up -d && pnpm dev`
- [ ] Add volume mounts for data persistence

### 1.7 — Environment Configuration

- [ ] Create `.env.example` with all required variables:
  ```env
  # Database
  DATABASE_URL=postgresql://user:pass@localhost:5432/lms_dev

  # Redis
  REDIS_URL=redis://localhost:6379

  # Auth
  JWT_SECRET=
  JWT_EXPIRY=7d
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=http://localhost:3000

  # Microsoft Azure AD
  MS_CLIENT_ID=
  MS_CLIENT_SECRET=
  MS_platform_ID=
  MS_REDIRECT_URI=

  # Razorpay
  RAZORPAY_KEY_ID=
  RAZORPAY_KEY_SECRET=
  RAZORPAY_WEBHOOK_SECRET=

  # Encryption
  TOKEN_ENCRYPTION_KEY=

  # Sentry
  SENTRY_DSN=

  # App
  API_URL=http://localhost:4000
  WEB_URL=http://localhost:3000
  ```
- [ ] Validate all env vars on app startup using Zod schemas from `/packages/config`

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Monorepo scaffold | `pnpm dev` starts both apps |
| Next.js app with routing | Pages render at `localhost:3000` |
| Express API with health check | `GET localhost:4000/health` returns 200 |
| Prisma schema (all tables) | `prisma migrate dev` succeeds |
| Shared types package | Both apps import from `@lms/types` |
| Docker Compose | `docker-compose up -d` starts Postgres + Redis |
| `.env.example` | All required vars documented |

---

## 🧪 Tests to Write

- [ ] Unit: Zod env validation rejects missing required vars
- [ ] Unit: Shared utility functions (date formatters, slug generator)
- [ ] Integration: Prisma can connect to database and run a simple query
- [ ] Health check endpoint returns correct status

