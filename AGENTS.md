# MarvelSlice LMS - Agent Instructions

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

| Prop          | Default | Description                                                                                                                                         |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullWidth`   | `false` | When `true`, removes `max-w-7xl`, `px-4`, `py-6` from `<main>` so children span full viewport width. Use for video player / course content layouts. |
| `hideHeader`  | `false` | Hides the sticky header entirely.                                                                                                                   |
| `hideProfile` | `false` | Hides user email, settings, and sign-out buttons.                                                                                                   |
| `hideLogo`    | `false` | Hides the Marvel Slice logo.                                                                                                                        |
| `breadcrumbs` | `[]`    | Breadcrumb trail shown in the header.                                                                                                               |
| `showBack`    | `false` | Shows the back button in the header.                                                                                                                |

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

| Content Type   | Icon                  | Color                               |
| -------------- | --------------------- | ----------------------------------- |
| Video lesson   | `IconPlayerPlay`      | Primary (active) / Muted (inactive) |
| Quiz           | `IconClipboardCheck`  | Amber (`text-amber-500`)            |
| Assignment     | `IconFileSpreadsheet` | Blue (`text-blue-500`)              |
| Study Material | `IconFile`            | Emerald (`text-emerald-500`)        |

Module header shows total item count: `{lessons + quizzes + assignments} items`.

**Note:** The `LessonSidebar.tsx` extracted component exists in `_comps/` but the production sidebar is inline in `CourseContentView.tsx`.

### CourseContentView Props

| Prop                  | Type       | Description                                                          |
| --------------------- | ---------- | -------------------------------------------------------------------- |
| `initialQuizId`       | `string?`  | If set, auto-selects the matching quiz in the sidebar on mount       |
| `initialAssignmentId` | `string?`  | If set, auto-selects the matching assignment in the sidebar on mount |
| `initialShowSubmit`   | `boolean?` | If `true`, opens the submit dialog immediately on mount              |

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

| Method | Route                                          | Description              |
| ------ | ---------------------------------------------- | ------------------------ |
| POST   | `/admin/courses/modules/:moduleId/quizzes`     | Add quiz to module       |
| PUT    | `/admin/courses/modules/quizzes/:id`           | Update quiz              |
| DELETE | `/admin/courses/modules/quizzes/:id`           | Delete quiz              |
| POST   | `/admin/courses/modules/:moduleId/assignments` | Add assignment to module |
| PUT    | `/admin/courses/modules/assignments/:id`       | Update assignment        |
| DELETE | `/admin/courses/modules/assignments/:id`       | Delete assignment        |

## Key Dependencies

- **API**: Express, Prisma, Zod, bcryptjs, jsonwebtoken, pino, multer, express-rate-limit
- **Web**: Next.js 16, React 19, Tailwind 4, Tiptap, FullCalendar, Recharts, Sonner
- **Auth**: JWT + cookies, Microsoft OAuth (Teams/Graph), bcrypt
- **Payments**: Razorpay
- **YouTube**: YouTube Data API v3 (free tier: 10k quota/day)
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## YouTube API Integration

The project auto-fetches video metadata when an admin adds/edits a lesson URL.

| Component      | File                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Service        | `apps/api/src/services/youtube.service.ts` — calls YouTube Data API v3, parses ISO 8601 durations |
| Route          | `apps/api/src/modules/youtube/youtube.routes.ts` — `GET /api/youtube/video-info?url=...`          |
| Frontend fetch | `AddLessonForm.tsx` and `LessonCard.tsx` — fetches on blur of video URL input                     |

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
  export default function Error({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }) {
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

## Password Management

### `mustChangePassword` Flow

When a guest user purchases a package via the catalogue, the payment service creates an account with a dummy password and sets `mustChangePassword: true`. The flow:

1. **Account created** → `POST /api/payments/create-order` (for guest) calls `createGuestUser()`, sets `mustChangePassword: true`
2. **Welcome email** sent with credentials + "Log In to Your Account" CTA
3. **User logs in** → login response includes `mustChangePassword: true`
4. **Login page redirects** → if `mustChangePassword: true`, redirects to `/set-password`
5. **Set password page** → form with requirements checklist (8+ chars, upper, lower, digit)
6. **API** → `POST /api/auth/me/set-password` validates strength, hashes, sets `mustChangePassword: false`
7. **Redirects** to role-based dashboard (student/admin/instructor)
8. **New JWT** issued with `mustChangePassword: false`

### API Endpoints

| Method  | Route                       | Auth          | Description                                                                                                          |
| ------- | --------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/api/auth/me/set-password` | `requireAuth` | Set initial password (`mustChangePassword` flow). Requires `mustChangePassword: true`. Skips current password check. |
| `PATCH` | `/api/auth/me/password`     | `requireAuth` | Change password (normal settings flow). Requires `currentPassword`. Resets `mustChangePassword: false`.              |
| `GET`   | `/api/auth/me`              | `requireAuth` | Returns `mustChangePassword` flag in response.                                                                       |

### Auth Controller Files

- `apps/api/src/modules/auth/auth.controller.ts` — Handlers: `changePassword`, `setPassword`
- `apps/api/src/modules/auth/auth.routes.ts` — Route definitions
- `apps/api/src/modules/auth/auth.service.ts` — `generateTokens()` returns `mustChangePassword` in `user` object
- `apps/api/src/app.ts` — `set-password` is CSRF-exempt (line 83)

### Set Password Page

| Aspect     | Detail                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| Route      | `/set-password`                                                                            |
| File       | `apps/web/src/app/set-password/page.tsx`                                                   |
| Design     | Matches login page (blue gradient left panel + glass card form)                            |
| Auth guard | Checks `GET /api/auth/me` on mount; if `mustChangePassword: false`, redirects to dashboard |
| Validation | Live password requirements checklist (8+ chars, uppercase, lowercase, digit, match)        |
| Success    | Calls `POST /api/auth/me/set-password`, redirects to role-based dashboard                  |

### Settings Page Password Change

| Role       | File                                            | API Endpoint                  |
| ---------- | ----------------------------------------------- | ----------------------------- |
| Admin      | `apps/web/src/app/admin/settings/page.tsx`      | `PATCH /api/auth/me/password` |
| Instructor | `apps/web/src/app/instructor/settings/page.tsx` | `PATCH /api/auth/me/password` |
| Student    | `apps/web/src/app/student/settings/page.tsx`    | `PATCH /api/auth/me/password` |

### Welcome Email

| Aspect          | Detail                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Template        | `packages/email-templates/src/emails/WelcomeEmail.tsx` — React Email component                                                |
| Props           | `userName` + optional `credentials` (`{ email, password }`)                                                                   |
| Credentials box | Green background (`bg-green-50`), monospace font, appears only when `credentials` is passed                                   |
| CTA button      | "Log In to Your Account" → `${WEB_URL}/login`                                                                                 |
| Sending         | `apps/api/src/services/email.service.ts` → `sendWelcomeEmail()` renders template via `@react-email/render`, sends via Brevo   |
| Dummy password  | Generated by `generateDummyPassword()` in `payment.service.ts` — 10 chars, excludes ambiguous chars (`i`, `l`, `o`, `0`, `1`) |

## Common Gotchas

- **Postgres port**: Use `5433` in `DATABASE_URL` (docker-compose maps 5433→5432)
- **Prisma env**: If Prisma can't find `DATABASE_URL`, ensure `.env` is in repo root (copy to `apps/api/` if needed)
- **Prisma migrations**: Repo uses `db push --force-reset` + seed instead of `migrate dev`; migration files may be stale
- **No pre-commit hooks**: No Husky config found — run `pnpm format` manually
- **No CI workflows**: No `.github/workflows/` found

## Features Added (Post-Research)

### Forgot / Reset Password

| Endpoint                    | Method | Description                                                                                       |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `/api/auth/forgot-password` | POST   | Sends reset link email (JWT token, 15 min expiry). Always returns success (no email enumeration). |
| `/api/auth/reset-password`  | POST   | Verifies JWT token, validates password strength, hashes + updates. Clears `mustChangePassword`.   |
| `/forgot-password`          | Page   | Email input form, sends request, shows confirmation                                               |
| `/reset-password`           | Page   | Token from URL, password requirements checklist, new password form                                |

Both endpoints are CSRF-exempt (line 93 of `app.ts`). Email template at `packages/email-templates/src/emails/ResetPasswordEmail.tsx`.

### Error Tracking (Sentry)

- **Backend**: `@sentry/node` initialized in `apps/api/src/app.ts` if `SENTRY_DSN` env var is set. Request/tracing/error handlers registered.
- **Frontend**: `SentryProvider` + `SentryErrorBoundary` in `apps/web/src/components/`. Wraps root layout via `Providers.tsx`. Requires `NEXT_PUBLIC_SENTRY_DSN`.

### Cookie Consent Banner

- `CookieConsentBanner` component at `apps/web/src/components/CookieConsentBanner.tsx`
- Renders at bottom of all pages (added to `layout.tsx`)
- Stores consent in `localStorage` key `lms-cookie-consent`

### Feature Flags

- `packages/utils/src/feature-flags.ts` — env-var based flags (`FEATURE_NEW_DASHBOARD`, `FEATURE_ONBOARDING_WIZARD`, `FEATURE_I18N`, `FEATURE_COURSE_REVIEWS`, `FEATURE_LIVE_ANALYTICS`)
- Use `isFeatureEnabled("NEW_DASHBOARD")` to check

### HTTP Caching Headers

- `apps/api/src/middleware/cache.middleware.ts` — Express middleware setting `Cache-Control` and `ETag` headers
- Skips caching for authenticated requests or non-GET methods

### i18n Structure

- `next.config.ts` has `i18n: { locales: ["en"], defaultLocale: "en" }`
- Translation file at `apps/web/messages/en.json`
- See `docs/i18n.md` for activation instructions

### Database Backup Docs

- `docs/database-backup.md` — pg_dump commands, Docker backup, cron job example, retention policy

## Error Handling Patterns

### API Controllers — Unified Error Handling

All controllers use `handleControllerError(err, (req as any).log)` from `apps/api/src/utils/errors.ts`. This function:

- Handles `ZodError` → returns `{ error: "field: message" }` (400)
- Handles `AppError` → returns `{ error: message }` with the error's statusCode
- Handles unknown errors → logs via pino, returns `{ error: message }` (500)

```ts
import { handleControllerError } from "../../utils/errors";

try {
  // ...
} catch (err: unknown) {
  const { statusCode, body } = handleControllerError(err, (req as any).log);
  return res.status(statusCode).json(body);
}
```

Use `throw new AppError(400, "message")` in services for expected error cases.

### API Pagination

Use `paginate()` from `apps/api/src/utils/paginate.ts` for all list endpoints:

```ts
import { paginate } from "../../utils/paginate";

const { skip, take, page, limit } = paginate({ page, limit });
const [items, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take }),
  prisma.model.count({ where }),
]);
return { items, total, page, limit };
```

Default: page=1, limit=20 (max 100).

### Frontend Page Titles

- **Server Components**: Add `export const metadata: Metadata = { title: "Name" }`
- **Client Components**: Add `usePageTitle("Name")` from `@/lib/use-page-title` (sets `document.title` using the root layout template "%s · MarvelSlice LMS")

### Frontend error.tsx / loading.tsx

Each route segment should have both files, using shared components:

**error.tsx** (`"use client"`):

```tsx
"use client";
import ErrorPage from "@/components/ErrorPage";
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
}
```

**loading.tsx**:

```tsx
import LoadingPage from "@/components/LoadingPage";
export default function RouteLoading() {
  return <LoadingPage />;
}
```

## Certification System

### Auto-Issue Flow

When a student completes all content in a course (quizzes + assignments + recordings), a certificate is auto-issued. Triggered on:

- Quiz submission: `POST /api/courses/quizzes/:quizId/submit` → calls `checkAndIssueForQuiz()`
- Assignment grading: `POST /api/assignments/submissions/:submissionId/grade` → calls `checkAndIssueForAssignment()`

Disable auto-issue with `AUTO_CERTIFICATE=false` env var.

### Completion Check

`apps/api/src/modules/certificates/certificate-completion.service.ts`:

- `getCourseContentProgress(userId, courseId)` — returns `{ isComplete, totalItems, completedItems, details }`
- Checks quizzes (any non-PENDING QuizAttempt) and module-level assignments (GRADED AssignmentSubmission)
- `checkAndIssueCertificate(userId, courseId)` — creates Certificate if all content complete
- Lessons with `videoUrl` are auto-counted as present (no watch tracking exists for standalone lessons)

### Two PDF Generation Options

| Option              | Template Type | Description                                                                                            |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| **jsPDF** (default) | `jsPdf`       | Dynamically generated using jsPDF with customizable colors, fonts, patterns from `CertificateTemplate` |
| **Uploaded PDF**    | `uploadedPdf` | Pre-designed PDF uploaded by admin. Text is overlaid at defined coordinates using pdf-lib              |

### Admin PDF Upload

- `POST /api/admin/certificate-templates/:id/upload-pdf` — upload PDF + JSON placeholder field definitions
- `DELETE /api/admin/certificate-templates/:id/pdf-template` — remove uploaded PDF template
- Placeholder fields are defined as `[{ key, x, y, fontSize, color, align }]` overlaid on the uploaded PDF
- Available placeholder keys: `studentName`, `courseName`, `date`, `certificateNumber`, `verifyUrl`

### Schema Fields Added

```prisma
model CertificateTemplate {
  pdfTemplateType   String   @default("jsPdf")  // "jsPdf" | "uploadedPdf"
  pdfTemplateUrl    String?  // Relative path to uploaded PDF
  pdfTemplateFields Json?    // [{key:"studentName",x:100,y:150,fontSize:22,color:"#1e293b",align:"center"}]
}

model Certificate {
  autoIssued         Boolean  @default(false)
  uploadedTemplateId String?
  uploadedTemplate   CertificateTemplate? @relation
}
```

## Test Status

### Latest Run: 250/250 passing (23 test files)

All 250 tests pass consistently across 23 test files. Suite completes in ~17s.

### Pre-existing Bug Fixes (2026-07-23)

| Bug                                        | File(s)                                                   | Fix                                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `practicals` field in module include       | `course.service.ts`                                       | Removed `practicals` from Prisma `include` (non-existent relation)                                                                                           |
| `throw new Error()` → 500 responses        | `course.service.ts`, `quiz.service.ts`, `auth.service.ts` | Replaced 15+ `throw new Error()` with `throw new AppError(statusCode, ...)` — 404 for not-found, 409 for duplicate, 401 for invalid creds, 403 for suspended |
| `notes` vs `items` in test                 | `notes.test.ts`                                           | Changed `res.body.notes` → `res.body.items` (API uses `paginate()` which returns `items`)                                                                    |
| `loginAs("STUDENT")` race condition        | `notes.test.ts`, `auth-extended.test.ts`                  | Used fresh registered students instead of shared `student@lms.local` for password-change and notes tests                                                     |
| Duplicate email test expected wrong status | `auth-extended.test.ts`                                   | Updated expectation from `[400,500]` to `409` (now `AppError` returns correct status)                                                                        |
