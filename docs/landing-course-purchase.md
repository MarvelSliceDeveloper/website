# Landing Course Purchase Integration

> **Status:** Planned (approved for implementation)
> **Date:** 2026-08-22
> **Scope:** Let a student buy a course directly on the marketing/landing site, collect
> their name/email/phone, auto-create their LMS account, run Razorpay checkout on the
> landing page, and email them their generated password + LMS link after payment.

---

## 1. Goal

A visitor browsing a course on the **landing** site should be able to:

1. Click **Buy Course**.
2. Enter **name, email, phone**.
3. Pay via **Razorpay** (checkout modal on the landing page).
4. Receive an **email with their auto-generated password + the LMS website link** after
   the payment succeeds, so they can log in to the LMS.

The actual purchase, enrollment, and user account all live in the **LMS database**
(`apps/api` / Prisma), which is a _separate_ database from the landing's Supabase DB.

---

## 2. Current architecture (verified)

| Layer               | Path           | Stack            | Database                              |
| ------------------- | -------------- | ---------------- | ------------------------------------- |
| Landing (marketing) | `apps/landing` | Vite + React     | **Supabase** (`schema.sql`)           |
| LMS API             | `apps/api`     | Express + Prisma | **Postgres** (`prisma/schema.prisma`) |
| LMS Web             | `apps/web`     | Next.js          | uses LMS API                          |

- Landing `courses` table (Supabase) holds marketing content: `slug`, `show_pricing`, etc.
- Lead capture already exists via `course_enquiries` table (public insert RLS) and serverless
  functions like `api/submit-contact.js` (nodemailer emails the lead).
- LMS `Payment` is tied to a **`CoursePackage`** (`packageId`), not a bare `Course`.
- LMS `EnrollmentRequest` / `Payment` both require a `userId` (an authenticated LMS account).

### The core challenge

Two independent databases with **no foreign-key link**. Both `courses` tables share a `slug`,
but the landing side has no pointer to the LMS `CoursePackage`. And the LMS cannot enroll or
charge an anonymous visitor — it needs a `User`.

---

## 3. Key finding: the API already implements guest checkout

The LMS API **already contains ~90% of the required logic**:

- `POST /api/payments/create-order` (`apps/api/src/modules/payments/payment.controller.ts`,
  `optionalAuth`): if the caller is not logged in, it calls
  `paymentService.createGuestUser(name, email)` which **creates an LMS `User`** (role
  `STUDENT`) with a random 10-char password + `mustChangePassword: true`, sets a JWT cookie,
  then `createOrder(userId, packageId)` creates the Razorpay order.
- `POST /api/payments/verify` (`payment.service.ts`): verifies the Razorpay signature, marks
  the `Payment` `PAID`, performs batch enrollment, and sends an **invoice** email
  (`emailService.sendInvoiceEmail`).
- `publicPackageRouter` (`/api/packages/public`, `/api/packages/public/:slug`) — public,
  unauthenticated package lookup already exists.
- `apps/api/src/services/email.service.ts` — real email sender (`sendEmail`,
  `sendEmailWithTemplate`, Brevo-backed).
- CORS is already configured in `app.ts` (origin from `WEB_URL` env).

So we are **extending**, not building from scratch.

---

## 4. Chosen approach: inline self-signup + purchase on landing

The student becomes an LMS user automatically during checkout. The landing page stays the
storefront; the LMS API remains the source of truth for users, payments, and enrollments.

### End-to-end flow

1. `CourseDetail.jsx` → **Buy Course** opens a modal that collects **name, email, phone**.
2. Landing resolves the linked LMS package (`GET /api/packages/public/:slug`) to show the
   real price.
3. `POST /api/payments/create-order` with `{ packageId, name, email, phone }` → API creates
   the guest user (if new) + Razorpay order.
4. Razorpay checkout modal renders on the landing page (using `keyId` from the order response).
5. `POST /api/payments/verify` → on success the API marks `PAID`, enrolls the user, and
   **emails the generated password + LMS website link** (new behaviour).
6. Landing shows a success state: _"Check your email for login details."_

---

## 5. Gaps to close

| #   | Gap                                                                     | Where                             |
| --- | ----------------------------------------------------------------------- | --------------------------------- |
| 1   | Landing `courses` has no link to an LMS `CoursePackage`                 | landing `schema.sql` + API lookup |
| 2   | Landing frontend never calls the LMS API for checkout                   | `apps/landing/src`                |
| 3   | No "welcome with password + LMS link" email (only invoice)              | `payment.service.ts`              |
| 4   | CORS only allows `WEB_URL`; landing origin blocked                      | `app.ts`                          |
| 5   | Generated guest password is not returned/stored, so it can't be emailed | `payment.service.ts`              |

---

## 6. Implementation plan

### 6.1 LMS API (`apps/api`)

- **`payment.service.ts`**
  - `createGuestUser(name, email)` — **return the plaintext password when the user is newly
    created** (currently only `userId` + `accessToken` are returned).
  - Add `sendWelcomeEmail(user, plainPassword, lmsUrl)` using `email.service.sendEmail` /
    `sendEmailWithTemplate` (rendered from a DB email template).
  - `verifyPayment(...)` — after marking `PAID`, send the welcome email **only when the
    payment's user is a newly created guest**. Track this with a transient flag on the
    `Payment` (e.g. `welcomePassword` held only for the post-verify send) or a
    `isGuestCheckout` marker set at order creation.
- **`payment.controller.ts`** (`createOrder`)
  - Accept `phone` and persist it on the `User` (currently unused).
  - Optionally accept `packageSlug` in addition to `packageId` for easier landing integration.
- **`app.ts`**
  - Extend CORS `origin` to include the landing origin (env `LANDING_URL`), not just `WEB_URL`.

### 6.2 Landing (`apps/landing`)

- **`schema.sql`** — add `lms_package_slug` (or `lms_package_id`) column to `courses` so each
  marketing course maps to an LMS `CoursePackage`.
- **`CourseDetail.jsx` + new `BuyCourseModal` component** — real Razorpay flow:
  load the `razorpay-checkout` script, call the API, open the modal, verify on success.
  (No placeholder controls — production-real UI per project convention.)
- **`lib/lmsCheckout.js`** — small helper to call the LMS API
  (`create-order` / `verify`) and surface errors.

### 6.3 Config / env

- API: `CORS` origin = `WEB_URL` + `LANDING_URL`.
- `LMS_WEB_URL` — base URL injected into the welcome email link.
- Razorpay keys already present (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`).

---

## 7. Open decisions (to confirm before/while implementing)

1. **Link mechanism** — map each landing `course` to an LMS **`CoursePackage`** (recommended,
   since `Payment` already uses `packageId`) vs. supporting a bare `Course`.
2. **Coupons** — allow a coupon field on the landing checkout, or keep it simple for v1.
3. **Domain** — LMS link is likely a subdomain/path of the same root domain
   (e.g. `https://lms.<domain>/login`). Confirm the exact `LMS_WEB_URL`.
4. **Verification reliability** — current flow verifies client-side; consider adding the
   Razorpay **webhook** as the source of truth for `PAID` to avoid missed emails if the
   client verify fails.

---

## 8. Risks / considerations

- **Security:** the public checkout endpoint must be rate-limited and ideally captcha-gated to
  prevent abuse / payment fraud.
- **Password in email:** the generated password is a temporary credential with
  `mustChangePassword: true` — acceptable to email, but the welcome email must make this clear
  and prompt a password change on first login.
- **Email deliverability:** if the welcome email fails after a successful payment, the user is
  enrolled but locked out. Add a fallback (e.g. "resend credentials" or admin alert) and rely
  on the existing invoice email as a secondary record.
- **Reconciliation:** ensure `verifyPayment` is idempotent (already guarded by `status !==
PENDING`) so a double-call doesn't create duplicate enrollments/emails.
