# Intern Role Implementation Plan

## Goal

Introduce a new `INTERN` user role. Interns apply through the public catalogue with a form (name, phone, email, designation, interest fields), pay a fee, and appear under Admin → Users as "Intern". Admin can:

1. Schedule online classes for interns (all interns OR by interest field).
2. Send notifications to intern role with zip/PDF attachments (like assignments).
3. Interns have **no login** — no portal access.

## Key Decisions

- **New role enum**: add `INTERN` to Prisma `Role` enum + `packages/types` `UserRole`.
- **No login**: `INTERN` role is not allowed through the login flow (login page blocks / redirects it). `middleware.ts` should not route interns anywhere; a dedicated intern-only route guard `requireRole([...ADMIN, SUPER_ADMIN])` on all intern APIs means interns can never fetch anything.
- **No mentor / no team**: Interns are not assigned to batches or mentors. Scheduling is a new concept — "intern sessions" targeted at `all` or a specific interest field.

## Data Model

```prisma
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
  SUPER_ADMIN
  INTERN
}
```

User model new fields:

```prisma
designation   String?   // "Working" | "Studying"
interestField String[]  // ["Frontend","Backend","Cybersecurity", ...]
```

## Touch Points

### 1. Enums & shared types

- `apps/api/prisma/schema.prisma` — add `INTERN` to `Role`
- `packages/types/src/index.ts` — add `INTERN = "INTERN"` to `UserRole`

### 2. Auth / guards

- `apps/api/src/middleware/auth.middleware.ts` — add `INTERN` to `VALID_ROLES`; decide hierarchy (INTERN is lowest, do NOT inherit into admin surfaces). Keep hierarchy `[SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT]`; add `INTERN` at bottom.
- `apps/api/src/app.ts` — no login route changes needed.

### 3. Catalogue intern form + payment

- `apps/web/src/app/catalogue/[slug]/_components/RazorpayCheckoutWidget.tsx` — add optional "Apply as Intern" path or an intern package card that collects name, phone, email, designation, interest fields, then opens Razorpay.
- `apps/api/src/modules/payments/payment.service.ts` — `createGuestUser` gains a `role` param; interns created with `role: "INTERN"` + designation/interest fields. Also new intern signup endpoint.
- `apps/api/src/modules/payments/payment.routes.ts` — new `POST /api/payments/intern` (public, CSRF-exempt) creating the intern user + Razorpay order.

### 4. Admin — intern management

- `apps/web/src/app/admin/users/page.tsx` — add `INTERN` role filter chip + badge + columns for designation / interest fields.
- `apps/api/src/modules/users/user.routes.ts` — allow `INTERN` in role validation arrays; GET users already returns all roles.
- `apps/web/src/components/AdminSidebar.tsx` — add an "Interns" section linking to filtered users view (`/admin/users?role=INTERN`).

### 5. Scheduling for interns

- New intern scheduling: reuse `LiveSession` with a new `InternSession` model OR an `internTarget` field. Simplest: a new `InternSession` model (title, description, scheduledAt, joinUrl, targetField? — null = all). Reuse Teams meeting creation + notifications.
- Admin UI: `apps/web/src/app/admin/sessions/intern/page.tsx` or an "Intern Sessions" section with "all / by field" selector.

### 6. Notifications with attachments

- `apps/api/src/modules/notifications/notification.service.ts` — support `INTERN` target type + attachment upload (zip/pdf) stored via multer; `Notification.metadata` stores `attachmentUrl`.
- `apps/web/src/app/admin/notifications/send/page.tsx` — add "INTERN" target option + file upload.
- Notification email renders attachment link.

## Open Questions

- Does the intern form live inside an existing package purchase (add to same `RazorpayCheckoutWidget`) or a standalone "Internship" package on the catalogue?
- Store interest fields as a fixed enum vs free-text multi-select?
- Should interns receive email with credentials at all (they don't log in)?

## Verification

- `pnpm prisma:reset` to regenerate DB with new enum/fields.
- `pnpm typecheck`, `pnpm lint`.
- Manual: create intern via catalogue, verify it appears under Admin → Users → Intern; schedule intern session; send notification with attachment.
