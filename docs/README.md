# LMS Portal — Documentation Hub

> Centralized Content Marketplace LMS · Microsoft Teams Integration  
> Next.js 14 · Node.js · TypeScript · PostgreSQL · Razorpay

---

## 📁 Documentation Index

| Document | Description |
|----------|-------------|
| [Phase 0 — Pre-Build Foundation](./phases/phase-00-pre-build.md) | CI/CD, testing, monitoring, dev environment — **before any code** |
| [Phase 1 — Foundation & Setup](./phases/phase-01-foundation.md) | Monorepo, Prisma, shared types, env config |
| [Phase 2 — Authentication](./phases/phase-02-authentication.md) | JWT, Microsoft OAuth, MSAL, token encryption |
| [Phase 3 — Student UI & Dashboard](./phases/phase-03-student-ui.md) | Prioritized Student Dashboard, progression bar, 1-on-1 requests |
| [Phase 4 — Batch & Enrollment Management](./phases/phase-04-batch.md) | Cohorts, manual approvals, instructor assignment |
| [Phase 5 — Azure AD & Graph API Setup](./phases/phase-05-azure-graph.md) | App registration, API permissions, token exchange |
| [Phase 6 — Calendar Sync & UI](./phases/phase-06-calendar.md) | MS Calendar sync, CalendarView, Live Now badge |
| [Phase 7 — Live Sessions](./phases/phase-07-live-sessions.md) | Create meetings, webhooks, join URL display |
| [Phase 8 — Recordings & Video](./phases/phase-08-recordings.md) | Pre-recorded videos, post-session sync, video player |
| [Phase 9 — LMS Core](./phases/phase-09-lms-core.md) | Courses, modules, assignments, progress |
| [Phase 10 — Payments](./phases/phase-10-payments.md) | Manual payments, deferred Razorpay |
| [Phase 11 — Quizzes & Certificates](./phases/phase-11-quizzes-certificates.md) | Quiz builder, auto-grading, PDF certificate generation |
| [Phase 12 — Admin Panel & Launch](./phases/phase-12-admin-launch.md) | Admin features, platform deploy, go live |
| [Mentorship Feature](./mentorship.md) | 1-on-1 mentorship system with admin management |
| [Architecture Overview](./architecture.md) | Tech stack, folder structure, DB schema, integration flows |
| [Auth API Endpoints](./auth-api.md) | Endpoints for Login, Register, Logout & Security features |
| [Calendar & Graph API](./calendar-api.md) | Calendar sync, live sessions, webhooks, Graph module reference |
| [Sessions API](./sessions-api.md) | Live session CRUD, Teams sync webhook, attendance |
| [Recordings API](./recordings-api.md) | Recording sync, playback URLs, watch progress |
| [Timeline & Milestones](./timeline.md) | Gantt overview, key milestones, risk buffer |
| [Local Setup Guide](./local-setup.md) | How to run the project locally (with or without Docker) |
| [Command Reference](./commands.md) | Every CLI command for dev, testing, building, deploying |

---

## 🏗️ Build Summary

| Metric | Value |
|--------|-------|
| Total Phases | 13 (Phase 0–12) |
| Estimated Duration | 22–26 weeks (~5.5–6.5 months) |
| Key Milestones | 7 |
| User Roles | Student · Instructor · Admin |
| Monetisation Models | One-time · Subscription · Freemium |

---

## 🔑 Quick Links

- **Tech Stack**: Next.js 14, Express, TypeScript, PostgreSQL, Prisma, Redis, Bull, Razorpay
- **Hosting**: Vercel (frontend) · EC2/DigitalOcean (API) · Supabase/Neon (DB) · Upstash (Redis)
- **MS Integration**: Graph API — Calendar, Teams Meetings, Recordings, Webhooks
- **Monorepo**: Turborepo + pnpm workspaces

---

## 👤 Creator

| Field | Detail |
|-------|--------|
| **Created By** | Harish Kumar |
| **Project** | LMS Portal — Centralized Content Marketplace |
| **Started** | May 2026 |
| **Contact** | *Add your email/LinkedIn/GitHub here* |

---

*Last updated: May 2026*

