# LMS Portal - Agent Instructions

## Project Overview

Monorepo with Express API (`apps/api`) + Next.js Web (`apps/web`) + shared packages (`packages/*`). Uses pnpm + Turborepo.

## Commands (run from repo root)

### Development

```bash
pnpm install                    # Install deps
docker-compose up -d            # Start Postgres (5433) + Redis (6379)
pnpm prisma:reset               # Reset DB + seed (uses prisma db push + seed)
pnpm dev                        # Start API (4000) + Web (3000) via Turbo
```

### Testing

```bash
pnpm test                       # Unit tests (vitest) via Turbo
pnpm test:integration           # Integration tests
pnpm test:e2e                   # E2E tests (Playwright)
pnpm test:all                   # All test suites
```

### Code Quality

```bash
pnpm lint                       # Lint all packages
pnpm lint:fix                   # Auto-fix lint
pnpm typecheck                  # Typecheck all packages
pnpm format                     # Prettier format
pnpm format:check               # Check formatting
```

### Build & Prisma

```bash
pnpm build                      # Build all packages
pnpm prisma:migrate             # Run migrations (dev)
pnpm prisma:seed                # Seed database only
pnpm prisma:studio              # Open Prisma Studio
pnpm prisma:generate            # Regenerate Prisma client
pnpm clean                      # Clean build outputs
```

## Key Configuration

- **Node**: >=20, **pnpm**: >=8 (uses corepack)
- **Postgres**: `localhost:5433` (docker maps 5433->5432)
- **Redis**: `localhost:6379`
- **API URL**: `http://localhost:4000` (health: `/health`)
- **Web URL**: `http://localhost:3000`
- **Prisma**: Uses `prisma db push --force-reset` + seed (not `migrate dev`) — migrations in repo may be stale
- **Env**: Copy `.env.example` → `.env`, set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (32+ chars), `TOKEN_ENCRYPTION_KEY` (32 chars), `API_URL`, `WEB_URL`

## Monorepo Structure

```
apps/api      # Express + Prisma + Zod
  src/index.ts         # Entry point
  prisma/schema.prisma # DB schema
  prisma/seed.ts       # Seed script (ts-node)
apps/web      # Next.js 16 + React 19 + Tailwind 4
  src/app/             # App Router pages
  src/components/      # React components
    StudentPortalShell.tsx  # Main student portal layout (header + <main>)
packages/config # Shared Zod schemas
packages/types  # Shared TS types
packages/utils  # Shared utilities
```

## Student Portal Shell

`StudentPortalShell` wraps all student-facing views. It renders a sticky header and a `<main>` container.

### Props

| Prop | Default | Description |
|------|---------|-------------|
| `fullWidth` | `false` | When `true`, removes `max-w-7xl`, `px-4`, `py-6` from `<main>` so children span full viewport width. Use for video player / course content layouts. |
| `hideHeader` | `false` | Hides the sticky header entirely. |
| `hideProfile` | `false` | Hides user email, settings, and sign-out buttons. |
| `hideLogo` | `false` | Hides the Marvel Slice logo. |
| `breadcrumbs` | `[]` | Breadcrumb trail shown in the header. |
| `showBack` | `false` | Shows the back button in the header. |

### CSS Variable: `--shell-header-height`

The shell measures its header height and sets `--shell-header-height` as an inline CSS variable on the root div. Child views can use this for height calculations:

```css
h-[calc(100vh-var(--shell-header-height,56px))]
```

The fallback is `56px` (approximate header height). This avoids overlap between the sticky header and full-height content areas like the course content video player.

### Course Content Layout Pattern

The course content view (`CourseContentView.tsx`) uses a two-column flex layout:

```
┌──────────────────────────────────┬──────────┐
│ Video + lesson info + nav bar    │ Sidebar  │
│ (flex-1)                         │ (380px)  │
└──────────────────────────────────┴──────────┘
```

- Parent passes `fullWidth` to `StudentPortalShell` when `currentView.view === "COURSE_CONTENT"`
- Root div uses `h-[calc(100vh-var(--shell-header-height,56px))]` to fill exactly the available viewport minus the header
- Video area uses `aspect-video` (16:9) with `overflow-hidden`
- Sidebar scrolls independently with `overflow-y-auto`

### Course Content Sidebar Icons

The sidebar uses type-specific icons for each content type:

| Content Type | Icon | Color |
|---|---|---|
| Video lesson | `IconPlayerPlay` | Primary (active) / Muted (inactive) |
| Quiz | `IconClipboardCheck` | Amber (`text-amber-500`) |
| Assignment | `IconFileSpreadsheet` | Blue (`text-blue-500`) |
| Study Material | `IconFile` | Emerald (`text-emerald-500`) |

Module header shows total item count: `{lessons + quizzes + assignments} items`.

**Note:** The `LessonSidebar.tsx` extracted component exists in `_comps/` but the production sidebar is inline in `CourseContentView.tsx`.

### CourseContentView Props

| Prop | Type | Description |
|------|------|-------------|
| `initialQuizId` | `string?` | If set, auto-selects the matching quiz in the sidebar on mount |
| `initialAssignmentId` | `string?` | If set, auto-selects the matching assignment in the sidebar on mount |
| `initialShowSubmit` | `boolean?` | If `true`, opens the submit dialog immediately on mount |

Both `initialQuizId` and `initialAssignmentId` use `useEffect` to find the item in the loaded module data and call `selectQuiz()` / `selectAssignment()` respectively.

## Student Portal — Overdue / Assignment Views

### Overdue API

`GET /api/student/assignments/overdue`

Returns **all** quizzes and assignments (not just overdue items). The frontend handles Pending vs Completed tabs locally.

Quizzes (type `QUIZ`) come from the **Quiz model** and use Quiz model API routes:
- Questions: `GET /api/courses/quizzes/:quizId/questions`
- Submit: `POST /api/courses/quizzes/:quizId/submit`
- Attempt: `GET /api/courses/quizzes/:quizId/attempt`

Assignments (type `ASSIGNMENT`) come from the **Assignment model** and use Assignment model file upload routes:
- Submit: `POST /api/assignments/:id/submit/file`

### QuizOverdueView Navigation

- **"Start Quiz"** fetches questions from Quiz model, takes MCQ submission via Quiz model routes
- **"View"** button navigates to `COURSE_CONTENT` view with `quizId` param — opens the quiz in CourseContentView sidebar

### AssignmentOverdueView Navigation

- **"View"** button navigates to `COURSE_CONTENT` view with `assignmentId` param — opens the assignment in CourseContentView sidebar
- **"Submit"** button opens the file upload UI (same as before)

### ViewState — `assignmentId` param

`assignmentId` is a recognized param in the `StudentViewState` discriminated union (`apps/web/src/app/student/_types/student-portal.ts`). It follows the same pattern as `quizId` — parsed from URL hash and forwarded to `CourseContentView` as `initialAssignmentId`.

## Admin Course Builder

The admin course detail page (`apps/web/src/app/admin/courses/[id]/`) is organized into tabbed sections:

### Component Structure

```
page.tsx                    # Thin orchestrator with state + API calls
_components/
  types.ts                  # Shared TypeScript types
  CourseDetailsTab.tsx      # Course edit form (title, description, category, tags, objectives)
  ContentTab.tsx            # Course builder with module list
  ModuleCard.tsx            # Module card with lessons, quizzes, assignments
  LessonCard.tsx            # Lesson card with video URL + isFreePreview toggle
  AddModuleForm.tsx         # Inline add module form
  AddLessonForm.tsx         # Inline add lesson form
  QuizCard.tsx              # Quiz display/edit/delete
  AddQuizForm.tsx           # Inline add quiz with questions
  AssignmentCard.tsx        # Assignment display/edit/delete
  AddAssignmentForm.tsx     # Inline add assignment form
  ModuleStudyMaterialsSection.tsx  # File upload per lesson
  SessionsTab.tsx           # Live session management
  RecordingsTab.tsx         # Recording sync
  TabButton.tsx             # Reusable tab button
```

### Quiz/Assignment API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/admin/courses/modules/:moduleId/quizzes` | Add quiz to module |
| PUT | `/admin/courses/modules/quizzes/:id` | Update quiz |
| DELETE | `/admin/courses/modules/quizzes/:id` | Delete quiz |
| POST | `/admin/courses/modules/:moduleId/assignments` | Add assignment to module |
| PUT | `/admin/courses/modules/assignments/:id` | Update assignment |
| DELETE | `/admin/courses/modules/assignments/:id` | Delete assignment |

## Key Dependencies

- **API**: Express, Prisma, Zod, bcryptjs, jsonwebtoken, pino, multer, express-rate-limit
- **Web**: Next.js 16, React 19, Tailwind 4, Tiptap, FullCalendar, Recharts, Sonner
- **Auth**: JWT + cookies, Microsoft OAuth (Teams/Graph), bcrypt
- **Payments**: Razorpay
- **YouTube**: YouTube Data API v3 (free tier: 10k quota/day)
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## YouTube API Integration

The project auto-fetches video metadata when an admin adds/edits a lesson URL.

| Component | File |
|-----------|------|
| Service | `apps/api/src/services/youtube.service.ts` — calls YouTube Data API v3, parses ISO 8601 durations |
| Route | `apps/api/src/modules/youtube/youtube.routes.ts` — `GET /api/youtube/video-info?url=...` |
| Frontend fetch | `AddLessonForm.tsx` and `LessonCard.tsx` — fetches on blur of video URL input |

**Env**: `YOUTUBE_API_KEY` in root `.env`. Get from [Google Cloud Console](https://console.cloud.google.com/). See `docs/youtube-integration.md`.

## Seed Users (after `pnpm prisma:reset`)

| Role       | Email                | Password      |
| ---------- | -------------------- | ------------- |
| Admin      | admin@lms.local      | admin123      |
| Instructor | instructor@lms.local | instructor123 |
| Student    | student@lms.local    | student123    |

## Testing Notes

- Unit/integration: `vitest` in `apps/api` (configured in package.json)
- E2E: Playwright (config not in repo root)
- Run `pnpm test:all` in CI

## Git Workflow (from CONTRIBUTING.md)

- `main` = production, `develop` = integration branch
- Branch prefixes: `feature/`, `fix/`, `hotfix/`
- PR requirements: `pnpm test:all`, `pnpm lint`, `pnpm typecheck` pass
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Format with `pnpm format` before commit

## React / Next.js Code Quality

### Required Route Files

Each route segment should have:

- **`error.tsx`** — Client component (`"use client"`) that catches errors and shows a reset button. Pattern:
  ```tsx
  "use client";
  export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <button onClick={reset}>Try again</button>;
  }
  ```
- **`loading.tsx`** — Server component (no `"use client"`) for Suspense fallback. Shows a spinner.

Existing at: root, `/student`, `/admin`, `/instructor`.

### `"use client"` Rules

- Only add `"use client"` when the component uses **React hooks** (`useState`, `useEffect`), **event handlers**, or **browser APIs**.
- **Do NOT** add `"use client"` to pure presentational components (e.g. `StatCard.tsx`, `LoadingSkeleton.tsx`, `StudentTable.tsx`) — they can be Server Components.

### State Mutations — Immutable Patterns

When updating arrays/objects in state, **never mutate directly**:

```tsx
// ❌ BAD — mutates state directly
questions[qIndex].options.push(newOption);
updated[qIndex].options[qIndex] = { ... };

// ✅ GOOD — immutable update
setQuestions(prev => prev.map((q, i) =>
  i === qIndex ? { ...q, options: [...q.options, newOption] } : q
));
```

### `any` Type Avoidance

- **Never** use `: any` type annotations. Use `unknown` + narrowing instead.
- For catch blocks: `catch (err: unknown)` then `err instanceof Error ? err.message : fallback`.
- Use `getErrorMessage(err: unknown)` from `@/lib/toast` for API errors.
- For jsPDF autoTable `lastAutoTable.finalY` — use the type declaration in `src/types/jspdf-autotable.d.ts` (augments jsPDF module with `lastAutoTable?: { finalY: number }`).

### Array Keys

- Use stable, unique keys (not array indices) for dynamic lists that can reorder or have items removed/added.
- Key with `index` is acceptable only for **static, never-reordered** lists.

## Code Architecture

### Type Declarations

Project-level `.d.ts` files live in `apps/web/src/types/`:
- `jspdf-autotable.d.ts` — Augments `jsPDF` interface with `lastAutoTable` property

## Common Gotchas

- **Postgres port**: Use `5433` in `DATABASE_URL` (docker-compose maps 5433→5432)
- **Prisma env**: If Prisma can't find `DATABASE_URL`, ensure `.env` is in repo root (copy to `apps/api/` if needed)
- **Prisma migrations**: Repo uses `db push --force-reset` + seed instead of `migrate dev`; migration files may be stale
- **No pre-commit hooks**: No Husky config found — run `pnpm format` manually
- **No CI workflows**: No `.github/workflows/` found
