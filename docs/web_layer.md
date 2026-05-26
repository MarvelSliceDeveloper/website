# Web Layer Documentation (`apps/web`)

## Scope
- Actual web folder in this repo is `apps/web` (not root-level `web`).
- Stack: Next.js App Router + React + TypeScript + Tailwind.

## Main Flow (Where code is)
- Root app shell/metadata/fonts: `apps/web/src/app/layout.tsx`
- Authentication UI: `apps/web/src/app/login/page.tsx`
- Shared API client: `apps/web/src/lib/api.ts`
- Role areas:
  - Admin pages: `apps/web/src/app/admin/**`
  - Student portal: `apps/web/src/app/student/**`
  - Instructor pages: `apps/web/src/app/instructor/**` and `apps/web/src/app/(instructor)/**`
- Reusable UI components: `apps/web/src/components/**`
- Mock student data toggle/source: `apps/web/src/lib/student-mock-data.ts`

## Page-to-API Wiring (examples)
- Login page calls `POST /api/auth/login` via `src/lib/api.ts`.
- Admin courses page calls:
  - `GET /api/admin/courses`
  - `POST /api/admin/courses/:id/publish`
  - `POST /api/admin/courses/:id/unpublish`
  - `DELETE /api/admin/courses/:id`
- Student portal page loads multiple APIs in parallel (`/api/courses/enrolled`, `/api/sessions`, `/api/calendar/events`, etc.).

## Current Limitations
1. **Network-dependency in build**: Google font fetch in `layout.tsx` can fail in restricted/offline CI.
2. **Mixed fallback strategy**: some screens silently fallback to empty/mock data on API failure, which can hide backend issues.
3. **No central toast/error UX standard**: many pages use `alert()` or local error text.
4. **API typing is partial**: several pages still rely on `any` for API payloads.
5. **Client-heavy data loading** in student page can increase render-time complexity and harden debugging.

## How to Modify Safely
1. Start from route file under `src/app/**/page.tsx` (or layout/component if shared).
2. Keep API interaction through `src/lib/api.ts` for consistent cookies/error handling.
3. Add/adjust response types near usage before changing render logic.
4. For new API features, confirm endpoint + response contract in API controllers/services first.
5. Maintain role-based navigation consistency when changing admin/student/instructor areas.
6. If changing mock behavior, verify `NEXT_PUBLIC_USE_MOCK_DATA` scenarios explicitly.

## Web Change Checklist
- [ ] UI change applied in correct route/component file
- [ ] API endpoint path and payload verified with backend contract
- [ ] Types updated (avoid introducing new `any`)
- [ ] Loading, empty, and error states handled
- [ ] Mock mode and real API mode both checked (if impacted)
- [ ] `pnpm lint` and `pnpm build` run and checked

## Error Prevention (What to do)
- Keep API calls wrapped in predictable error handling and surface user-friendly messages.
- Avoid silent catch fallbacks for critical admin operations; show actionable errors.
- Use stronger runtime guards when mapping API payloads before rendering.
- For CI stability, use local fonts or ensure outbound font fetch availability in build environment.
- Keep auth-dependent screens prepared for `401/403` responses and redirect/recover cleanly.

## Baseline Validation Notes (before this doc update)
- `pnpm lint` failed due API lint dependency issue (`eslint` not found in `apps/api` context), blocking monorepo lint.
- `pnpm build` failed in web because `next/font/google` could not fetch `DM Sans` and `Sora` in this environment.
- `pnpm test` failed because API package has no discovered test files (Vitest exit 1).
