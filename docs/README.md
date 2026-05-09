# LMS Portal — Documentation Hub

> Multi-Tenant SaaS LMS · Microsoft Teams Integration  
> Next.js 14 · Node.js · TypeScript · PostgreSQL · Razorpay

---

## 📁 Documentation Index

| Document | Description |
|----------|-------------|
| [Phase 0 — Pre-Build Foundation](./phases/phase-00-pre-build.md) | CI/CD, testing, monitoring, dev environment — **before any code** |
| [Phase 1 — Foundation & Setup](./phases/phase-01-foundation.md) | Monorepo, Prisma, shared types, env config |
| [Phase 2 — Authentication](./phases/phase-02-authentication.md) | JWT, Microsoft OAuth, MSAL, token encryption |
| [Phase 3 — Multi-Tenancy](./phases/phase-03-multi-tenancy.md) | Slug routing, tenant middleware, data isolation |
| [Phase 4 — Azure AD & Graph API Setup](./phases/phase-04-azure-graph.md) | App registration, API permissions, token exchange |
| [Phase 5 — Calendar Sync & UI](./phases/phase-05-calendar.md) | MS Calendar sync, CalendarView, Live Now badge |
| [Phase 6 — Live Sessions](./phases/phase-06-live-sessions.md) | Create meetings, webhooks, join URL display |
| [Phase 7 — Recordings](./phases/phase-07-recordings.md) | Post-session sync, SharePoint streaming, video player |
| [Phase 8 — LMS Core](./phases/phase-08-lms-core.md) | Courses, modules, enrollment, progress, dashboard |
| [Phase 9 — Payments (Razorpay)](./phases/phase-09-payments.md) | Orders, webhook, enrollment unlock, subscriptions |
| [Phase 10 — Quizzes & Certificates](./phases/phase-10-quizzes-certificates.md) | Quiz builder, auto-grading, PDF certificate generation |
| [Phase 11 — Admin Panel & Launch](./phases/phase-11-admin-launch.md) | Super admin, tenant admin, deploy, go live |
| [Architecture Overview](./architecture.md) | Tech stack, folder structure, DB schema, integration flows |
| [Auth API Endpoints](./auth-api.md) | Endpoints for Login, Register, Logout & Security features |
| [Timeline & Milestones](./timeline.md) | Gantt overview, key milestones, risk buffer |
| [Local Setup Guide](./local-setup.md) | How to run the project locally (with or without Docker) |
| [Command Reference](./commands.md) | Every CLI command for dev, testing, building, deploying |

---

## 🏗️ Build Summary

| Metric | Value |
|--------|-------|
| Total Phases | 12 (Phase 0–11) |
| Estimated Duration | 22–26 weeks (~5.5–6.5 months) |
| Key Milestones | 7 |
| User Roles | Student · Instructor · Admin · Super Admin |
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
| **Project** | LMS Portal — Multi-Tenant SaaS Learning Management System |
| **Started** | May 2026 |
| **Contact** | *Add your email/LinkedIn/GitHub here* |

---

*Last updated: May 2026*

