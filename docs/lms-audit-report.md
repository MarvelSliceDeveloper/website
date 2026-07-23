# LMS Project Audit Report — Gaps & Issues

Generated from codebase analysis on 2026-07-23.

---

## Critical (Must Fix Before Production)

### 1. Security Gaps

| Issue | Impact | Evidence |
|-------|--------|----------|
| **No email verification** | Anyone can register with fake emails | `User` model has no `emailVerified` field. No verification flow exists. |
| **No token blacklisting** | Logout doesn't invalidate JWT — token remains valid until 7-day expiry | `auth.controller.ts:100` only clears cookie |
| **No brute-force protection on login** | Login endpoint is vulnerable to credential stuffing | Global rate limiter (1000/15min) applies to all routes, no per-IP login tracking |
| **No HTTP security headers** | Missing helmet/X-Frame-Options/HSTS | `app.ts` — no security middleware beyond CORS |
| **JWT cookie lacks secure prefix** | Cookie named `accessToken` without `__Secure-` prefix | `auth.controller.ts:48-53` |
| **CSRF-exempt list is large** | 14 paths exempted including login/register/logout | `app.ts:136-150` |

### 2. Error Handling Chaos

| Issue | Count | Example |
|-------|-------|---------|
| **`catch (error: any)` everywhere** | ~200+ controllers | Every controller file uses this anti-pattern |
| **`console.error` instead of pino** | ~100 instances | `assignment.controller.ts`, `notification.controller.ts`, `auth.controller.ts`, etc. |
| **Inconsistent error shapes** | 3 different formats | `{error: string}`, `{error: array}` (Zod), `{message: string}` |
| **Error message leakage** | Internal messages sent to client | `module.controller.ts:26`, all Zod `error.errors` arrays |

### 3. Zero Frontend Tests

- **0 unit tests** in `apps/web/` — no `.test.tsx` files anywhere
- E2E tests exist but Playwright config is missing from repo root
- Only 19 test files for 50+ API modules — most modules (sessions, batches, packages, calendars, etc.) have zero coverage

### 4. Infrastructure Gaps

| Missing | Details |
|---------|---------|
| **CI/CD** | No `.github/workflows/` — zero automation |
| **Production Dockerfiles** | Only dev docker-compose (Postgres + Redis). No containers for API/Web apps |
| **DB migrations** | Uses `prisma db push --force-reset` (dev-only). No migration strategy for production |
| **Health check** | `GET /health` always returns "ok" — doesn't check DB/Redis connectivity |

---

## High Priority

### 5. Missing Production Features

| Feature | Details |
|---------|---------|
| **Data export** | No GDPR data export endpoint for users |
| **Payment refund flow** | `PaymentStatus` has `REFUNDED` but no API to process refunds via Razorpay |
| **Session management UI** | No page to view/revoke active sessions |
| **Audit logging** | `AuditLog` model exists but most controllers don't write to it |
| **Instructor analytics** | No per-course student progress dashboards for instructors |
| **Two-factor auth** | No 2FA at all |

### 6. API Issues

| Issue | Count |
|-------|-------|
| **Missing pagination** | 9+ list endpoints return all records (breaks at scale) — users, enrollments, notifications, messages, notes, recordings, logs, audit-logs, submissions |
| **Zod errors returned as array** | Auth, module, lesson, assignment controllers return array instead of string |
| **`: any` type usage** | `const where: any = {}` repeated in 10+ service files |

### 7. Frontend Issues

| Issue | Details |
|-------|---------|
| **Missing error.tsx/loading.tsx** | Most admin route segments lack them (users, batches, packages, sessions, settings, etc.) |
| **Missing SEO metadata** | No page-specific titles — all child pages render as " · LMS Portal" |
| **`key={i}` on dynamic lists** | 39 instances of array index as key — breaks React reconciliation on reorder |
| **1462-line component** | `CourseContentView.tsx` is monolithic and should be split |
| **Missing form labels** | Login, set-password, forgot-password, reset-password have no `<label htmlFor>` — screen-reader only |

---

## Should Fix

| Issue | Details |
|-------|---------|
| No side-wide `useCallback` on callback props in large pages | `student/page.tsx`, `dashboard/page.tsx` |
| `parseExpiryToMs` duplicated in 2 controllers | Should be shared utility |
| `EmptyState` duplicated | Local copy in `BatchDetailView.tsx` line 365 instead of importing shared component |
| Inconsistent response wrapping | Some endpoints return `{ course }`, some return direct object |
| Missing aria attributes on admin tables | No accessible names on data tables |
| Image optimization bypassed | Inline `backgroundImage` styles on login/set-password pages |
| pgAdmin exposed on port 5050 in docker-compose | Security concern |
