# Plan: Shell Layout Fix + Test Cases + Code Documentation

## Task 1: Fix StudentPortalShell Header Layout

**Issue:** In `StudentPortalShell.tsx`, the back button ("Previous") appears **before** the logo. User wants: Logo first, then Back button.

**Current layout (lines 157-188):**

```
[Back Button] → [Logo] → [Breadcrumbs] → ...right side
```

**Desired layout:**

```
[Logo] → [Back Button] → [Breadcrumbs] → ...right side
```

**File:** `apps/web/src/components/StudentPortalShell.tsx`
**Change:** Swap the order of the back button (lines 158-169) and logo block (lines 171-188) inside the left `<div>`.

**Risk:** Low — purely cosmetic reordering of two sibling elements within a flex container.

---

## Task 2: Implement Unit Tests for Important Functions

### Current State

- **4 Vitest test files** (health, auth, csrf, notes) — all integration-style (hit HTTP)
- **4 Playwright E2E specs** — browser-level smoke + workflow tests
- **0 isolated unit tests** for pure utility/service functions

### Testing Strategy

#### Phase 1: Pure Utility Functions (no mocking, no DB) — HIGH PRIORITY

These are trivially testable with zero setup:

| Function                                        | File                                                         | Why                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `parseVideoUrl()`                               | `apps/api/src/utils/video.ts`                                | Pure regex, 3 providers (YouTube/Vimeo/Loom), null cases |
| `encryptToken()` / `decryptToken()`             | `apps/api/src/utils/encryption.ts`                           | Security-critical roundtrip, error format validation     |
| `extractVideoId()` + `parseISO8601Duration()`   | `apps/api/src/services/youtube.service.ts`                   | Pure functions, multiple pattern matching                |
| `generateSlug()`                                | `apps/api/src/modules/courses/course.service.ts`             | Pure string transform, edge cases                        |
| `parseExpiryToMs()`                             | `apps/api/src/modules/auth/auth.controller.ts`               | Pure function, multiple units (d/h/m)                    |
| `verifySignature()` + `generateDummyPassword()` | `apps/api/src/modules/payments/payment.service.ts`           | HMAC verification, password generation constraints       |
| `chunkArray()`                                  | `apps/api/src/modules/notifications/notification.service.ts` | Pure array utility                                       |
| `getSubjectForType()` + `getTextForType()`      | `apps/api/src/services/email.service.ts`                     | Pure switch-case, 15+ branches                           |

#### Phase 2: Middleware Unit Tests — HIGH PRIORITY (security-critical)

| Function            | File                                          | Why                                                   |
| ------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `requireAuth`       | `apps/api/src/middleware/auth.middleware.ts`  | JWT verification, session timeout, payload validation |
| `requireRole`       | `apps/api/src/middleware/auth.middleware.ts`  | Role-based access, SUPER_ADMIN inheritance            |
| `requireSuperAdmin` | `apps/api/src/middleware/auth.middleware.ts`  | Super admin restriction                               |
| `optionalAuth`      | `apps/api/src/middleware/auth.middleware.ts`  | Silent fail on invalid token                          |
| `cacheMiddleware`   | `apps/api/src/middleware/cache.middleware.ts` | Header generation, ETag, 304, auth bypass             |

#### Phase 3: Zod Schema Validation Tests — MEDIUM PRIORITY

Test that key schemas accept valid data and reject invalid:

- `RegisterSchema`, `LoginSchema` (auth)
- `CreateCourseSchema`, `UpdateCourseSchema` (courses)
- `CreateBatchSchema` (batches)
- `CreateSessionSchema` (sessions with `.refine()`)

### Test File Structure

```
apps/api/src/__tests__/
  utils/
    video.test.ts
    encryption.test.ts
  services/
    youtube.service.test.ts
    email.service.test.ts
  middleware/
    auth.middleware.test.ts
    cache.middleware.test.ts
  modules/
    auth/auth.controller.test.ts
    courses/course.service.test.ts
    payments/payment.service.test.ts
    notifications/notification.service.test.ts
  schemas/
    auth.schema.test.ts
    course.schema.test.ts
```

---

## Task 3: Code Documentation

### Strategy

Add concise inline documentation across the codebase without over-commenting:

1. **Module-level JSDoc** on every exported service/controller function — purpose, params, return value
2. **File-level header comments** on key files — what the file does, key exports
3. **Inline comments** only for non-obvious logic (business rules, security decisions, workarounds)
4. **README-style docs** for complex modules (payments, courses, auth flows)

### Priority Files for Documentation

**Backend Services (business logic):**

- `apps/api/src/services/youtube.service.ts`
- `apps/api/src/services/email.service.ts`
- `apps/api/src/utils/video.ts`
- `apps/api/src/utils/encryption.ts`

**Backend Modules (controllers + services):**

- `apps/api/src/modules/auth/auth.controller.ts` — already partially commented
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/courses/course.service.ts`
- `apps/api/src/modules/payments/payment.service.ts`
- `apps/api/src/modules/batches/batch.service.ts`
- `apps/api/src/modules/sessions/session.service.ts`
- `apps/api/src/modules/assignments/assignment.service.ts`
- `apps/api/src/modules/student/student.service.ts`

**Middleware:**

- `apps/api/src/middleware/auth.middleware.ts` — already well-commented
- `apps/api/src/middleware/cache.middleware.ts` — already has JSDoc

**Frontend:**

- `apps/web/src/components/StudentPortalShell.tsx`
- `apps/web/src/app/student/_types/student-portal.ts`

### Documentation Style

```typescript
/**
 * Generates a URL-safe slug from a course title.
 * Strips special characters, collapses whitespace, and lowercases.
 *
 * @param title - The course title to slugify
 * @returns URL-safe slug string
 */
function generateSlug(title: string): string { ... }
```

---

## Execution Order

1. **Task 1** — Fix shell layout (5 min, simple swap)
2. **Task 2** — Write unit tests (Phase 1 pure functions, then Phase 2 middleware, then Phase 3 schemas)
3. **Task 3** — Add documentation to tested files (pairs well since we're already reading them)

## Verification

- Run `pnpm test` to confirm all new + existing tests pass
- Run `pnpm lint` and `pnpm typecheck` to confirm no regressions
- Run `pnpm format` to ensure consistent formatting
