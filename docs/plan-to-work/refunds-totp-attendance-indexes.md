# Plan: Refunds, TOTP 2FA, Attendance Duration & Missing Indexes

## Overview
Add four schema/model changes to close gaps in the current database design.

---

## 1. Refunds

### Schema
- Add `Refund` model + `RefundStatus` enum
- Add `refunds Refund[]` to Payment model
- Add `refundsInitiated Refund[] @relation("RefundInitiator")` to User model

### Backend (`apps/api/src/modules/admin/refunds/`)
- `GET /api/admin/refunds` — list all refunds (paginated)
- `POST /api/admin/refunds` — initiate refund for a payment
  - Validates payment exists, amount ≤ payment amount minus already refunded
  - Creates Refund record with status PENDING
  - Calls Razorpay refund API if configured, updates status + razorpayRefundId
- `GET /api/admin/refunds/:id` — single refund detail
- `PUT /api/admin/refunds/:id` — update status (admin override)
- `GET /api/admin/payments/:id/refunds` — refunds for a specific payment

### Frontend (`apps/web/src/app/admin/refunds/page.tsx`)
- Refund list table with payment info, amount, status, reason
- "Issue Refund" button on payment detail/row, opens form modal
- Status badges (Pending/Processing/Completed/Failed)
- Amount selector (full or partial) + reason textarea

### Sidebar
- Add "Refunds" under Sales & Finance (Admin) / Management (Super Admin)

---

## 2. Two-Factor Auth

### Schema
- `TwoFactorAuth` model (separate from User for security — secret not on User row)
- Backup codes stored as hashed JSON array
- `twoFactorEnabled` on User becomes the runtime flag (already exists)

### Backend (`apps/api/src/modules/auth/2fa.routes.ts`)
Auth: `requireAuth` (all roles)

- `POST /api/auth/2fa/setup` — generate TOTP secret + QR code URI, return to user
- `POST /api/auth/2fa/verify` — verify TOTP code, mark verifiedAt, set `twoFactorEnabled: true`
- `POST /api/auth/2fa/disable` — disable 2FA (requires current password)
- `GET /api/auth/2fa/status` — return `{ enabled, verifiedAt }`
- `GET /api/auth/2fa/backup-codes` — generate & show backup codes (only once after setup)

### Login flow change
- On login, if `twoFactorEnabled && verifiedAt`, return `{ requires2fa: true, tempToken }` instead of JWT
- Client shows TOTP input, sends `POST /api/auth/2fa/challenge` with tempToken + code → gets real JWT
- `POST /api/auth/2fa/challenge` — verify TOTP or backup code, issue JWT

### Frontend
- `/settings/security` page — enable/disable 2FA, QR code display, backup codes
- Login flow — TOTP step after password (detected via `requires2fa` in login response)

---

## 3. Attendance Duration

### Schema
- Add `leftAt DateTime?` and `durationSeconds Int?` to Attendance model

### Backend
- Modify `POST /api/attendance/join` → set `joinedAt`
- Create `POST /api/attendance/leave` → set `leftAt`, compute `durationSeconds = (leaveTime - joinTime) / 1000`
- OR auto-set on session end (if attendance is tracked via session status)

### Frontend
- Show duration in attendance reports
- (No new page — update existing attendance tables)

---

## 4. Missing Indexes

### Schema
- `@@index([status])` on Payment model
- `@@index([status, categoryId])` on Course model

These are zero-migration-cost additions (indexes don't block reads).

---

## Order of Implementation

1. Schema changes (`prisma db push`)
2. Refunds (backend + frontend)
3. TOTP 2FA (backend + frontend + login flow)
4. Attendance duration (backend + minor frontend)
5. Run tests

## Files to Create

| Feature | Files |
|---------|-------|
| Refunds backend | `apps/api/src/modules/admin/refunds/refunds.routes.ts` |
| Refunds frontend | `apps/web/src/app/admin/refunds/page.tsx` + loading/error |
| 2FA backend | `apps/api/src/modules/auth/2fa.routes.ts` |
| 2FA frontend | `apps/web/src/app/settings/security/page.tsx` |
| Attendance | Modify existing `attendance.routes.ts` |

## Files to Modify

| File | Change |
|------|--------|
| `schema.prisma` | Add Refund, TwoFactorAuth models + indexes |
| `AdminSidebar.tsx` | Add Refunds link |
| `app.ts` | Mount refunds + 2fa routes |
| `auth.controller.ts` | Login response may include `requires2fa` flag |
| `auth.service.ts` | Login may issue tempToken instead of JWT |
| `attendance.routes.ts` | Add leave endpoint |
