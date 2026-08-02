# LMS Portal

A unified Learning Management System monorepo containing three independent applications plus shared packages:

- **`apps/web`** — The LMS portal (student / instructor / admin / super-admin dashboards, course builder, payments)
- **`apps/api`** — The LMS backend REST API (Express + Prisma)
- **`apps/landing`** — The public "Marvel Slice" marketing website, fully independent (own Supabase database)

Built with pnpm + Turborepo.

---

## Architecture

```
                              ┌────────────────────────────┐
                              │   apps/landing (React SPA)  │
                              │   marvelslice.com           │
                              └──────────────┬─────────────┘
                                             │ Supabase (own DB)
                             ┌───────────────▼──────────────┐
Public marketing site         │  Supabase Postgres + Storage │
─────────────────────────────►└──────────────────────────────┘

                              ┌────────────────────────────┐
                              │    apps/web (Next.js)       │
                              │    lms.marvelslice.com      │
                              └──────────────┬─────────────┘
                                             │ REST + WebSocket
                              ┌──────────────▼──────────────┐
                              │      apps/api (Express)      │
                              └──────┬───────┬───────┬──────┘
                                     │       │       │
                        ┌────────────▼──┐ ┌──▼────────┐ ┌▼─────────────┐
                        │ PostgreSQL     │ │ Redis     │ │ External:    │
                        │ (Prisma, 46    │ │           │ │ Razorpay,    │
                        │ models)        │ │           │ │ Brevo email, │
                        └────────────────┘ └───────────┘ │ MS Teams     │
                                                         │ Graph,       │
                                                         │ YouTube API  │
                                                         └──────────────┘
```

The landing site and the LMS are **fully independent** — no shared data, auth, or API.

---

## Tech Stack

### LMS — Frontend (`apps/web`)

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4 |
| **Charts** | ApexCharts, Recharts |
| **Calendar** | FullCalendar 6 |
| **Rich text** | TinyMCE, Tiptap |
| **Video player** | Plyr |
| **Icons** | Tabler Icons |
| **PDF generation** | jsPDF + jspdf-autotable |
| **Realtime** | Socket.io client |
| **Error tracking** | Sentry (`@sentry/react`) |
| **Notifications** | Sonner |

### LMS — Backend (`apps/api`)

| Layer | Technology |
| --- | --- |
| **Runtime** | Node.js 20+ |
| **Framework** | Express 4 |
| **ORM** | Prisma 5 (PostgreSQL, 46 models) |
| **Validation** | Zod |
| **Auth** | JWT (httpOnly cookies), bcryptjs, Microsoft OAuth (Teams/Graph), TOTP |
| **Payments** | Razorpay (amounts in paise, guest user auto-creation) |
| **Email** | Brevo API + React Email templates |
| **Files** | Multer, static serving at `/uploads/` |
| **Cache / realtime** | Redis, Socket.io |
| **Security** | CSRF (double-csrf), express-rate-limit |
| **PDF** | jsPDF, pdf-lib (certificates) |
| **Logging** | pino |
| **Testing** | Vitest, Supertest |
| **Error tracking** | Sentry (`@sentry/node`) |

### Landing Site (`apps/landing`)

| Layer | Technology |
| --- | --- |
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router v6 |
| **Server state** | TanStack Query v5 |
| **Styling** | Tailwind CSS 4 |
| **UI / Animation** | Headless UI, Framer Motion, React Icons |
| **Backend** | Supabase (own Postgres + Storage + REST) |
| **Email** | Nodemailer / Resend (dev mail server) |
| **PDF** | jsPDF + jspdf-autotable |
| **Linting** | Oxlint |
| **Deploy** | Static site (Nginx) at `marvelslice.com` |

### Shared Packages (`packages/`)

| Package | Purpose |
| --- | --- |
| `@lms/email-templates` | 14 React Email templates (welcome, reset password, invoices, etc.) |
| `@lms/types` | Shared TypeScript types |
| `@lms/utils` | Shared utilities (feature flags, etc.) |

### Infra & Tooling

| Tool | Purpose |
| --- | --- |
| pnpm (>= 8) | Package manager (workspaces) |
| Turborepo | Monorepo build orchestration |
| Docker Compose | Local Postgres (5433) + Redis (6379) |
| Husky + commitlint | Git hooks + conventional commits |
| Prettier / ESLint | Formatting / linting |
| TypeScript | Static typing across packages |
| Vitest / Playwright / k6 | Unit, integration, E2E, load tests |

---

## Monorepo Layout

```
LMS/
├── apps/
│   ├── api/                  # Express + Prisma + Zod
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 46 models
│   │   │   └── seed.ts       # Dev seed data
│   │   └── src/
│   │       ├── app.ts        # Express setup (Sentry, CSRF, rate-limit)
│   │       ├── index.ts      # Server entry
│   │       ├── middleware/   # Auth, CSRF, cache, rate-limit
│   │       ├── modules/      # 30+ feature modules (auth, courses, payments, ...)
│   │       ├── services/     # Email, YouTube
│   │       ├── jobs/         # Background sync (Graph, recordings)
│   │       ├── utils/        # errors, paginate, encryption
│   │       └── __tests__/    # Unit + integration tests
│   ├── landing/              # Marvel Slice marketing site (Vite 8 + React 19 + Supabase)
│   └── web/                  # Next.js 16 + React 19 + Tailwind 4
│       └── src/
│           ├── app/          # App Router pages
│           │   ├── login/            # Login + role redirects
│           │   ├── set-password/     # mustChangePassword flow
│           │   ├── forgot-password/  # Password reset request
│           │   ├── reset-password/   # Password reset (JWT token)
│           │   ├── catalogue/        # Public course catalogue + packages
│           │   ├── admin/            # Admin + super-admin dashboards
│           │   ├── student/          # Student portal (SPA)
│           │   ├── instructor/       # Instructor portal
│           │   ├── pages/            # Marketing/public pages
│           │   └── health/           # Health check
│           ├── components/   # Shared components (admin/student/shared/ui)
│           ├── lib/          # API client, toast, page-title helpers
│           ├── hooks/        # Custom hooks
│           └── types/        # .d.ts declarations
├── packages/
│   ├── email-templates/      # React Email templates
│   ├── types/                # Shared TS types
│   └── utils/                # Shared utilities
├── docs/                     # 20+ documentation files
├── scripts/                  # PowerShell test helpers
├── uploads/                  # File uploads directory
├── public/                   # Static assets
├── docker-compose.yml
├── turbo.json
├── CONTRIBUTING.md
└── AGENTS.md
```

---

## Feature Highlights

### LMS Portal (`apps/web` + `apps/api`)
- **Roles**: Super Admin, Admin, Instructor, Student (JWT role hierarchy)
- **Course builder**: modules, lessons (video with YouTube auto-metadata), quizzes, assignments, study materials, free-preview lessons
- **Student portal**: dashboard, course content player, quizzes, assignments, certificates, notes, attendance, recordings
- **Payments**: Razorpay checkout, packages (bundled courses), guest purchase with auto-account creation
- **Certifications**: auto-issued on course completion; jsPDF or uploaded-PDF templates
- **Live sessions**: Microsoft Teams meetings via Graph API, calendar, recordings
- **Admin ops**: batches, users, packages, sessions, calendar, reports, settings, announcements, templates, super-admin audit
- **Support**: tickets, mentorship tickets, messaging, notifications, attendance tracking
- **Security**: CSRF, rate limiting, login history, permission overrides, API keys, TOTP, Sentry
- **i18n ready**: locales in `next.config.ts`, translation files in `apps/web/messages/`

### Landing Site (`apps/landing`)
- DB-driven home page, course listing grouped by category, rich course detail pages with video
- Blog system (categories, tags, search), dynamic nav pages (about, contact, career)
- Full admin CMS: nav menu, course editor (10 tabs), home page, promo banners, alumni, media library, footer, admin users, blog
- Newsletter signup + career application email sending

---

## Quick Start

```bash
pnpm install
docker-compose up -d
pnpm prisma:reset
pnpm dev
```

- **Web (LMS)**: http://localhost:3000
- **API**: http://localhost:4000 (health: `/health`)
- **Landing site**: http://localhost:5173 (optional, `pnpm dev:landing`)
- **Postgres** (Docker): localhost:5433
- **Redis** (Docker): localhost:6379

### Landing site setup

```bash
cd apps/landing
cp .env.example .env
# Fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

See `apps/landing/README.md` for DB schema, seed data, and first admin user.

---

## Seed Logins

After `pnpm prisma:reset`:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | superadmin@lms.local | superadmin123 |
| Admin | admin@lms.local | admin123 |
| Instructor | instructor@lms.local | instructor123 |
| Student | student@lms.local | student123 |

---

## Environment

Copy `.env.example` → `.env` in the repo root:

```env
DATABASE_URL=postgresql://lms_user:password@localhost:5433/lms_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-32-char-min-secret
TOKEN_ENCRYPTION_KEY=32-byte-base64-key
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000

# Optional integrations (feature toggles off when blank)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
YOUTUBE_API_KEY=...
BREVO_API_KEY=...
MS_CLIENT_ID=...                 # Microsoft OAuth (Teams/Graph)
MS_CLIENT_SECRET=...
MS_TENANT_ID=common
SENTRY_DSN=...
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start API (4000) + Web (3000) via Turbo |
| `pnpm dev:api` / `pnpm dev:web` | Start a single app |
| `pnpm dev:landing` | Landing site dev server (5173) |
| `pnpm build` | Build all packages |
| `pnpm build:api` / `pnpm build:web` / `pnpm build:landing` | Build a single app |
| `pnpm lint` / `pnpm lint:fix` | Lint all packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:integration` | Integration tests |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm test:all` | All test suites |
| `pnpm test:load` | Load tests (k6) |
| `pnpm format` / `pnpm format:check` | Prettier format |
| `pnpm prisma:reset` | Reset DB + seed |
| `pnpm prisma:migrate` | Run Prisma migrations |
| `pnpm prisma:seed` | Seed only |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm clean` | Clean build outputs |

---

## Testing

```bash
pnpm test              # unit (Vitest) — 250+ tests across 23 files
pnpm test:integration  # API integration (Vitest)
pnpm test:e2e          # Playwright E2E
pnpm test:all          # everything
pnpm test:load         # k6 load tests
```

---

## Key Architecture Decisions

- **CSRF**: double-csrf pattern; exempt paths for payments and auth (set/reset password)
- **Auth**: JWT httpOnly cookies, role hierarchy SUPER_ADMIN > ADMIN > INSTRUCTOR > STUDENT
- **Payments**: Razorpay, amounts in paise, guest user auto-creation with `mustChangePassword` flow
- **File uploads**: Multer, static serving at `/uploads/`
- **Video**: YouTube/Vimeo/Loom detection + embed ID extraction (YouTube Data API v3 metadata)
- **Email**: Brevo API via React Email templates
- **Calendar/Sessions**: Microsoft Teams Graph API integration
- **Certificates**: auto-issue on course completion; jsPDF or uploaded-PDF template overlay
- **DB migrations**: repo uses `prisma db push --force-reset` + seed (migration files may be stale)

---

## Deployment

- **LMS portal** (`apps/web` + `apps/api`): served at `lms.marvelslice.com` via Nginx routes
- **Landing site** (`apps/landing`): static `dist/` served by Nginx at `marvelslice.com` (Vercel config is legacy)

---

## Documentation

- `AGENTS.md` — agent/contributor instructions (commands, conventions, architecture)
- `CONTRIBUTING.md` — git workflow and PR requirements
- `apps/landing/README.md` — landing site details (schema, routes, admin CMS)
- `docs/` — integration guides (YouTube, Razorpay, Microsoft Graph, i18n, database backup, API docs, changelog)
