# Code Audit — 2026-07-18

**Scope:** `apps/api` + `apps/web`

---

## 🛠 Fixed During Audit

| File                                                 | Error                                                    | Fix                         |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------- |
| `apps/api/src/modules/courses/lesson.service.ts:211` | `(JsonValue\|undefined)[]` not assignable to Prisma JSON | Added type predicate filter |
| `apps/api/src/modules/courses/module.service.ts:39`  | `null` not assignable to Prisma JSON                     | Changed to `Prisma.DbNull`  |

---

## 🚨 HIGH

### 1. YouTube route has NO auth middleware

`apps/api/src/modules/youtube/youtube.routes.ts` — `GET /api/youtube/video-info` is completely public. Any unauthenticated user can call it and consume your YouTube API quota.

**Fix:** Add `requireAuth` middleware to the route.

### 2. Ticket routes have no role guards

- `ticket.routes.ts` — Any authenticated user (including students) can list/assign/modify all tickets. No `requireRole()` guard.
- `support.routes.ts` — Same issue; only `requireAuth`, no role restriction.
- `mentorship.routes.ts:67` — `GET /tickets/:id` lets any authenticated user view any mentorship ticket by ID.

**Fix:** Add `requireRole(["ADMIN", "INSTRUCTOR"])` or appropriate role guards.

### 3. Array index-as-key in dynamic lists (causes stale UI, focus loss)

Using `key={index}` for lists that can be reordered/added/removed causes React to reuse DOM nodes incorrectly.

| File                                                              | Lines    | Description                                                                  |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `apps/web/src/app/admin/courses/[id]/_components/AddQuizForm.tsx` | 157, 193 | `key={qIndex}`, `key={oIndex}` — questions/options dynamically added/removed |
| `apps/web/src/app/admin/courses/[id]/_components/QuizCard.tsx`    | 192, 228 | Same pattern in edit mode                                                    |
| `apps/web/src/components/admin/DataTable.tsx`                     | 147, 168 | `key={i}` — rows reorder when sort column/direction changes                  |

**Fix:** Use a stable unique ID instead of index. For questions/options, generate a temp ID (e.g., `crypto.randomUUID()` or incrementing counter).

### 4. Input validation missing on 7 route files (~25 endpoints)

The following route files have **no Zod validation** — only manual null checks:

- `apps/api/src/modules/users/user.routes.ts` (4 routes)
- `apps/api/src/modules/courses/student-course.routes.ts` (6 routes)
- `apps/api/src/modules/enrollments/enrollment.routes.ts` (3 routes)
- `apps/api/src/modules/super-admin/super-admin.routes.ts` (6 routes)
- `apps/api/src/modules/courses/course-template.routes.ts` (4 routes)
- `apps/api/src/modules/trash/trash.routes.ts` (2 routes)
- `apps/api/src/modules/youtube/youtube.routes.ts` (1 route)

**Fix:** Define Zod schemas and validate request body/query/params in each route handler.

---

## ⚠️ MEDIUM

### 5. Missing `error.tsx` / `loading.tsx` in 57/59 route segments

Only the root `/` and `/student` have co-located error + loading boundaries. All sub-routes under `/admin/`, `/instructor/`, `/student/*`, plus `/login` and `/catalogue` — none have them.

**Fix:** Add `error.tsx` and `loading.tsx` to each route segment directory.

### 6. `catch (error)` without `: unknown` in ~36 blocks across 20+ files

AGENTS.md requires `catch (err: unknown)` + `instanceof Error` narrowing. Most files use bare `catch (err)` (implicit `any`).

Affected files include:

- `apps/web/src/app/student/notes/page.tsx`
- `apps/web/src/app/admin/batches/[id]/page.tsx`
- `apps/web/src/app/admin/batches/new/page.tsx`
- `apps/web/src/app/admin/batches/page.tsx`
- `apps/web/src/app/admin/enrollments/page.tsx`
- `apps/web/src/app/admin/inbox/messages/page.tsx`
- `apps/web/src/app/admin/inbox/support/page.tsx`
- `apps/web/src/app/admin/approvals/page.tsx`
- `apps/web/src/app/admin/packages/page.tsx`
- `apps/web/src/app/admin/packages/new/page.tsx`
- `apps/web/src/app/admin/packages/[id]/page.tsx`
- `apps/web/src/app/admin/packages/enrollments/page.tsx`
- `apps/web/src/app/admin/reports/page.tsx`
- `apps/web/src/app/admin/courses/page.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/mentorship/page.tsx`
- `apps/web/src/app/admin/quiz-templates/[id]/page.tsx`
- `apps/web/src/app/student/_views/LiveSessionsView.tsx`
- `apps/web/src/app/student/_views/_comps/VideoPlayer.tsx`

**Fix:** Change `catch (err)` → `catch (err: unknown)` and narrow with `err instanceof Error`.

### 7. Missing useEffect deps in `CourseContentView.tsx`

`selectQuiz`, `selectAssignment`, `selectResource` called from 3 `useEffect` blocks but omitted from dependency arrays.

- `apps/web/src/app/student/_views/CourseContentView.tsx:329` — `selectQuiz(initialQuizId)`
- `apps/web/src/app/student/_views/CourseContentView.tsx:335` — `selectAssignment(initialAssignmentId)`
- `apps/web/src/app/student/_views/CourseContentView.tsx:351` — `selectResource(initialResourceId)`

These functions are `async` and defined in the component body without `useCallback`, so they're recreated on every render. The effect captures a stale closure.

**Fix:** Either wrap in `useCallback` and include in deps, or restructure to avoid the pattern.

### 8. Race condition in quiz submission

`apps/api/src/modules/courses/student-course.routes.ts:627-634` — The existing-attempt check and submission creation are two separate queries. Two concurrent requests can both pass the existence check and create duplicate attempts.

**Fix:** Use a Prisma `$transaction` with proper isolation.

### 9. Login endpoint lacks brute-force rate limiting

The global rate limiter (`app.ts:139`) applies equally to all routes. The login endpoint (`POST /api/auth/login`) should have a much lower limit (e.g., 5-10 attempts per minute per IP).

**Fix:** Add route-specific rate limiter for `/api/auth/login`.

---

## 🟢 LOW

### 10. `StickyNoteWidget.tsx:244` — `setTimeout` with no cleanup

`setTimeout(() => onClose(), 300)` in `handleClose` has no cleanup. If the component unmounts within 300ms, `onClose` could fire on an unmounted component.

### 11. `StudyMaterialContent.tsx` — Unnecessary `"use client"`

`apps/web/src/app/student/_views/_comps/StudyMaterialContent.tsx` has `"use client"` but uses no hooks, event handlers, or browser APIs. Can be a Server Component.

### 12. Inconsistent error response shapes across API endpoints

Some endpoints return `{ error: "message" }`, others return `{ error: [{ path, message }] }` (Zod), and some return `{ error: error.message }` (leaking internal details).

### 13. `secure` cookie flag depends on `NODE_ENV`

In `auth.controller.ts:35-38` and `:69-72`, cookies are set with `secure: process.env.NODE_ENV === "production"`. If `NODE_ENV` is not set in production, `secure` will be `false` and cookies will be sent over HTTP.

### 14. No ownership/authorization checks on sensitive data

- `mentorship.routes.ts:67` — `GET /tickets/:id` with only `requireAuth` but no check that the user is the ticket owner, assigned mentor, or admin
- `ticket.routes.ts` — All routes have no role guards
- `support.routes.ts` — Same issue

### 15. `Course_Creation_Best_Practices.md` — stale doc

`docs/Course_Creation_Best_Practices.md` is a generic instructional-design research paper, not project-specific. Consider removing.

---

## Stats

| Metric               | Value                  |
| -------------------- | ---------------------- |
| TS compilation (API) | 0 errors (2 fixed)     |
| TS compilation (Web) | 0 errors               |
| Lint errors (Web)    | 0                      |
| Lint warnings (Web)  | 103 (all pre-existing) |
