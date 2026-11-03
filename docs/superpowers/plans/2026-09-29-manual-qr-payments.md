# Manual UPI-QR Course Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add monthly/full plan choice + static-UPI QR + UTR submit for logged-in course purchases, with admin approval that auto-creates PAID Payment + enrollment and emails invoice.

**Architecture:** New `ManualPaymentOrder` submission table + singleton `PaymentSettings` (global UPI) + authenticated catalogue manual-order endpoints + approve/reject that reuse `generateInvoicePdf`/`sendInvoiceEmail`/`CourseEnrollment`; web renders QR client-side via `react-qr-code`, admin gets `/admin/manual-orders` page mirroring refunds/approvals pattern.

**Tech Stack:** Prisma/Postgres, Express+Zod, Next.js 19 + React 19, `react-qr-code`, jsPDF invoice, Brevo React-Email, vitest.

**Spec:** Brainstorming decision in chat 2026-09-29 — admin sets both prices; single global QR; UPI ID → auto QR; courses only logged-in; approve = mark PAID + enroll; monthly V1 = same access as full (no expiry).

## Global Constraints

- Node >=20, pnpm >=8, Postgres via `localhost:5433`, repo uses `prisma db push --force-reset` + seed (migrations may be stale).
- API errors via `handleControllerError(err, req.log)` from `apps/api/src/utils/errors.ts`; expected failures via `throw new AppError(status, msg)`.
- List endpoints via `paginate({page,limit})` from `apps/api/src/utils/paginate.ts` returning `{items,total,page,limit}`.
- Admin guards: `requireAuth, requireRole([ADMIN, SUPER_ADMIN])` hierarchical (SUPER_ADMIN passes ADMIN check).
- Frontend errors via `toast + getErrorMessage(err: unknown)` from `@/lib/toast`; data via `useApiQuery(key,url)` + `api.get/post/patch` from `@/lib/api`.
- Never use `: any`; catch as `unknown`; immutable state updates; stable keys.
- Currency `Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(paise/100)`; invoice numbers `INV-<id.slice(-8).toUpperCase()>`.
- No photo uploads; UTR text only.

---

### Task 1: DB schema — monthlyPrice + PaymentSettings + ManualPaymentOrder

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Test: `apps/api/src/__tests__/modules/manual-orders.test.ts` (new, schema-level guards run after push)

**Interfaces:**
- Consumes: existing `Course.price Int?`, `Payment`, `CourseEnrollment`, `User`.
- Produces: `Course.monthlyPrice Int?`; `PaymentSettings {id, upiId, payeeName, isManualEnabled, updatedById?, updatedAt}`; `ManualPaymentOrder {id, userId, courseId, plan: ManualPlan, amount: Int, transactionId @unique, status: ManualOrderStatus, rejectionReason?, reviewedById?, reviewedAt?, paymentId? @unique, createdAt, updatedAt}`; enums `ManualPlan (MONTHLY|FULL)`, `ManualOrderStatus (PENDING|APPROVED|REJECTED)`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/__tests__/modules/manual-orders.test.ts
import { describe, it, expect } from "vitest";
import { normalizeUtr, buildUpiIntent } from "../../modules/manual-orders/manual-orders.validation";
describe("manual order validation", () => {
  it("accepts 12-digit UTR", () => {
    expect(normalizeUtr("123456789012")).toBe("123456789012");
  });
  it("rejects short UTR", () => {
    expect(() => normalizeUtr("123")).toThrow();
  });
  it("builds UPI intent", () => {
    const s = buildUpiIntent({ upiId: "test@okhdfc", payeeName: "Marvel", amountPaise: 50000, note: "Course" });
    expect(s).toContain("upi://pay?pa=test@okhdfc");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lms/api vitest run src/__tests__/modules/manual-orders.test.ts`
Expected: FAIL with "Cannot find module ... manual-orders.validation"

- [ ] **Step 3: Add Prisma models**

```prisma
enum ManualPlan { MONTHLY FULL }
enum ManualOrderStatus { PENDING APPROVED REJECTED }

model PaymentSettings {
  id             String   @id @default("default")
  upiId          String
  payeeName      String
  isManualEnabled Boolean @default(false)
  updatedById    String?
  updatedAt      DateTime @updatedAt
}

model ManualPaymentOrder {
  id            String            @id @default(cuid())
  userId        String
  courseId      String
  plan          ManualPlan
  amount        Int
  transactionId String            @unique
  status        ManualOrderStatus @default(PENDING)
  rejectionReason String?
  reviewedById  String?
  reviewedAt    DateTime?
  paymentId     String?           @unique
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])
  @@index([userId, courseId, status])
  @@index([status, createdAt])
}
```

Also add to `Course`: `monthlyPrice Int? // paise; null = plan unavailable` next to `price`. Add to `User`: `manualOrders ManualPaymentOrder[]`, `reviewedManualOrders ManualPaymentOrder[] @relation("ManualOrderReviewer")` — if relation naming causes friction, use bare `reviewedById String?` without relation. Add to `Course`: `manualOrders ManualPaymentOrder[]`.

- [ ] **Step 4: Push + generate + verify test passes after validation file exists (Task 2 provides it; for now `pnpm prisma:generate` must succeed)**

Run: `pnpm --filter @lms/api prisma:generate`
Expected: PASS (client generates, no type errors)

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/src/__tests__/modules/manual-orders.test.ts
git commit -m "feat: add manual QR payment schema (monthlyPrice, settings, orders)"
```

---

### Task 2: Validation + service — settings + submit + approve/reject

**Files:**
- Create: `apps/api/src/modules/manual-orders/manual-orders.validation.ts`
- Create: `apps/api/src/modules/manual-orders/manual-orders.service.ts`
- Create: `apps/api/src/modules/manual-orders/manual-orders.controller.ts`
- Create: `apps/api/src/modules/manual-orders/manual-orders.routes.ts`
- Modify: `apps/api/src/app.ts` (mount routers)
- Test: `apps/api/src/__tests__/modules/manual-orders.test.ts` (extend)

**Interfaces:**
- Consumes: `prisma.{course,paymentSettings,manualPaymentOrder,payment,courseEnrollment}`, `AppError`, `paginate`, `generateInvoicePdf`, `emailService.sendInvoiceEmail`, `notificationService.create`.
- Produces:
  - `normalizeUtr(raw: string): string` — trim+uppercase, must match `/^([0-9]{12}|[A-Z0-9]{12,22})$/` else `AppError(400)`.
  - `buildUpiIntent(args:{upiId:string;payeeName:string;amountPaise:number;note:string}): string` — `upi://pay?pa=..&pn=..&am=(paise/100).toFixed(2)&cu=INR&tn=..` with `encodeURIComponent`.
  - `getPaymentOptions(courseId: string)` → `{ courseId, fullPrice: number|null, monthlyPrice: number|null, upi: { upiId, payeeName, isManualEnabled } | null }`.
  - `submitManualOrder(userId: string, courseId: string, plan: "MONTHLY"|"FULL", transactionId: string)` → order; throws 404 course, 400 plan unavailable / manual disabled / bad UTR, 409 duplicate UTR | pending exists | already enrolled+paid.
  - `approveManualOrder(orderId: string, reviewerId: string)` → `{ order, payment, enrollment }` in `prisma.$transaction`; 400 if not PENDING; creates `Payment{PAID, courseId, amount: order.amount}` with `razorpayOrderId: "MANUAL-"+order.id.slice(-12)` (unique, avoids null-unique issues), `CourseEnrollment.upsert` by paymentId → APPROVED; then invoice+email fire-and-forget (never throw).
  - `rejectManualOrder(orderId, reviewerId, reason)` → order REJECTED; 400 if not PENDING or reason empty.

- [ ] **Step 1: Write failing service tests (append to test file)**

```ts
it("submit rejects when manual disabled", async () => {
  await expect(submitManualOrder("u1", "c1", "FULL", "123456789012")).rejects.toThrow(/disabled/i);
});
```

Run: `pnpm --filter @lms/api vitest run src/__tests__/modules/manual-orders.test.ts` → FAIL (function undefined).

- [ ] **Step 2: Implement `manual-orders.validation.ts`**

```ts
import { AppError } from "../../utils/errors";
export function normalizeUtr(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^([0-9]{12}|[A-Z0-9]{12,22})$/.test(v)) throw new AppError(400, "Invalid transaction / UTR ID");
  return v;
}
export function buildUpiIntent(args: { upiId: string; payeeName: string; amountPaise: number; note: string }): string {
  const amt = (args.amountPaise / 100).toFixed(2);
  return `upi://pay?pa=${encodeURIComponent(args.upiId)}&pn=${encodeURIComponent(args.payeeName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(args.note.slice(0, 80))}`;
}
export function validateUpiId(upiId: string): void {
  if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,}$/.test(upiId.trim())) throw new AppError(400, "Invalid UPI ID");
}
```

- [ ] **Step 3: Implement `manual-orders.service.ts`** (follow `course.service.ts:680-915` + `enrollment.routes.ts` approve pattern; use `paginate` for list; `handleControllerError` stays in controller)

Key logic: `getSettings()` returns row or null; `getPaymentOptions` loads course (PUBLISHED, not deleted) + settings; `submitManualOrder` checks settings enabled → course+plan price → normalizeUtr → check duplicate transactionId (409) → check existing PENDING same user+course (409) → check existing PAID payment/enrollment APPROVED (409) → create PENDING with amount snapshot; `listManualOrders({status,page,limit})` via paginate include user/course; `approveManualOrder` transaction as above + after-commit `generateInvoicePdf({invoiceNumber: INV-.., userName, userEmail, packageName: course.title, amount, discountAmount: 0, date: new Date(), paymentMethod: "UPI Manual", paymentStatus: "PAID"})` + `emailService.sendInvoiceEmail({name, email, invoice:{paymentId, packageName, amount, discountAmount:0}})` fire-and-forget + `notificationService.create(...)` best-effort try/catch.

- [ ] **Step 4: Implement controller + routes**

Controller methods: `getOptions, submit, mine, list, approve, reject, getSettings, updateSettings` each try/catch → `handleControllerError`. Routes: student router `GET /api/courses/catalogue/:id/payment-options`, `POST /api/courses/catalogue/:id/manual-order (requireAuth)`, `GET /api/courses/manual-orders/mine (requireAuth)`; admin router `GET /api/admin/manual-orders`, `PATCH /api/admin/manual-orders/:id/approve`, `PATCH /api/admin/manual-orders/:id/reject`, `GET/PUT /api/admin/payment-settings` with `requireAuth, requireRole([ADMIN, SUPER_ADMIN])`. Mount in `app.ts` near payments block: `app.use("/api/courses", manualStudentRouter); app.use("/api/admin", manualAdminRouter);` — check existing catalogue mount path first (`app.ts` catalogue mount) and attach accordingly to avoid double prefix.

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm --filter @lms/api vitest run src/__tests__/modules/manual-orders.test.ts`
Expected: PASS. Run: `pnpm --filter @lms/api typecheck` (or `pnpm typecheck`) — no TS errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/manual-orders apps/api/src/app.ts
git commit -m "feat: manual UPI order API with approve-to-PAID flow"
```

---

### Task 3: Email templates for manual flow

**Files:**
- Create: `packages/email-templates/src/emails/ManualOrderReceived.tsx`
- Create: `packages/email-templates/src/emails/ManualOrderApproved.tsx`
- Create: `packages/email-templates/src/emails/ManualOrderRejected.tsx`
- Modify: `packages/email-templates/src/index.ts`
- Modify: `apps/api/src/services/email.service.ts` (add 3 methods)

**Interfaces:**
- Consumes: `BaseLayout`, `@react-email/components`, `generateInvoicePdf` (approved path reuses `sendInvoiceEmail` — no new PDF code).
- Produces: `sendManualOrderReceived({name,email,courseName,plan,amount,transactionId})`, `sendManualOrderApproved({name,email,courseName,plan,amount,paymentId})` (calls existing invoice attach), `sendManualOrderRejected({name,email,courseName,reason})`.

- [ ] **Step 1: Create the 3 components** following `EnrollmentApproved.tsx` + `BaseLayout` (Heading + green details box + Button to `${WEB_URL}/student` or catalogue slug; rejected shows amber box with reason).

- [ ] **Step 2: Export in index.ts + add service methods** mirroring `sendInvoiceEmail` (tags `["manual-payment","invoice"]`), graceful no-op if Brevo unset, try/catch returning boolean.

- [ ] **Step 3: Verify render**

Run: `pnpm --filter @lms/api typecheck`
Expected: PASS. Manual check: import template in a vitest render smoke test if quick, else skip.

- [ ] **Step 4: Commit**

```bash
git add packages/email-templates apps/api/src/services/email.service.ts
git commit -m "feat: manual payment email templates"
```

---

### Task 4: Web — plan toggle + QR + UTR submit on course checkout

**Files:**
- Modify: `apps/web/src/app/catalogue/[slug]/_components/CourseDerivedCheckoutWidget.tsx`
- Create: `apps/web/src/app/catalogue/[slug]/_components/ManualUpiCheckout.tsx`
- Modify: `apps/web/package.json` (add `react-qr-code`)
- Test: manual browser check (no unit framework on web)

**Interfaces:**
- Consumes: `GET /api/courses/catalogue/:id/payment-options`, `POST /api/courses/catalogue/:id/manual-order`, `GET /api/courses/manual-orders/mine`; `api.get/post`, `toast/getErrorMessage`, `formatInr(paise)` existing.
- Produces: `<ManualUpiCheckout courseId courseName fullPrice monthlyPrice upi />` — plan radio (FULL/MONTHLY, hidden if null) → amount → QR (`react-qr-code` value=`upi://pay?...` built client-side mirroring server) + copy-UPI + `transactionId` input (uppercase transform, 12-22 chars) + submit → pending screen; parent widget gets method toggle Razorpay/UPI.

- [ ] **Step 1: Install dep**

Run: `pnpm --filter @lms/web add react-qr-code`
Expected: package.json updated, lockfile updated.

- [ ] **Step 2: Build `ManualUpiCheckout.tsx`** — states `plan, utr, loading, submitted, myStatus`; fetch options on mount via `api.get`; immutable updates; stable keys; `"use client"` (uses hooks). Include: plan cards, QR box (white padding, 160px), amount + UPI ID copy buttons (`navigator.clipboard`), steps hint, UTR input `maxLength 22`, submit disabled unless valid, success panel "Submitted for review — track via email", link to "My payments" status list.

- [ ] **Step 3: Wire into `CourseDerivedCheckoutWidget.tsx`** — add method tabs above pricing box (`Razorpay | UPI QR`), render `<ManualUpiCheckout/>` when UPI + `isManualEnabled`, else show "UPI payments paused" note. Keep Razorpay path untouched.

- [ ] **Step 4: Verify**

Run: `pnpm --filter @lms/web lint` + `pnpm --filter @lms/web build` (or at least `typecheck`).
Expected: PASS with no ESLint errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: UPI QR checkout with plan choice and UTR submit"
```

---

### Task 5: Admin — `/admin/manual-orders` management + UPI settings

**Files:**
- Create: `apps/web/src/app/admin/manual-orders/page.tsx`
- Create: `apps/web/src/app/admin/manual-orders/loading.tsx`
- Create: `apps/web/src/app/admin/manual-orders/error.tsx`
- Test: browser check + `pnpm --filter @lms/web lint`

**Interfaces:**
- Consumes: `GET /api/admin/manual-orders?status=&page&limit`, `PATCH /:id/approve`, `PATCH /:id/reject`, `GET/PUT /api/admin/payment-settings`; primitives `AdminPageHeader, FormModal, ConfirmModal, CardSkeleton, EmptyState, useConfirmDialog, useApiQuery, usePageTitle`.
- Produces: page with settings card (upiId, payeeName, enable switch + save) + tabs PENDING|APPROVED|REJECTED + table (student, course, plan, amount en-IN, UTR mono+copy, date en-IN) + Review modal (Approve confirm / Reject reason textarea) + toast + refetch.

- [ ] **Step 1: Build page** copying `apps/web/src/app/admin/refunds/approvals/page.tsx` tab pattern + `enrollments/page.tsx` approve-with-no-extra-input + `payments/page.tsx` statusConfig pills + currency/date format. `usePageTitle("Manual Orders")`. Client component (`useState`, mutations via react-query + `api.patch`, `queryClient.invalidateQueries`).

- [ ] **Step 2: Add loading.tsx (`LoadingPage`) + error.tsx (`ErrorPage` + "use client")** per repo convention.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @lms/web lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/manual-orders
git commit -m "feat: admin manual order approvals and UPI settings"
```

---

### Task 6: Seed + verification

**Files:**
- Modify: `apps/api/prisma/seed.ts` (ensure default PaymentSettings row + a course with monthlyPrice for local testing)
- Test: full suite `pnpm --filter @lms/api test` (vitest) must stay green

**Interfaces:**
- Consumes: all Tasks 1-5.
- Produces: local flow verified — submit UTR → admin approve → PAID + enrollment + invoice email attempt logged.

- [ ] **Step 1: Seed default settings** (`upsert id=default, upiId demo@okhdfc, payeeName MarvelSlice, isManualEnabled true` in dev only) + set one catalog course `monthlyPrice`.

- [ ] **Step 2: Run full checks**

Run: `pnpm --filter @lms/api vitest run` then `pnpm typecheck` then `pnpm lint`
Expected: all green (250 pre-existing + new tests).

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "chore: seed manual UPI settings for dev"
```

## Self-Review

- Spec coverage: monthly/full choice (T1 schema + T4 UI), global QR auto-render (T2 intent + T4 QR + T5 settings), UTR box no photos (T2 validation + T4 input), admin management page (T5), submit→approval→email+invoice (T2 approve + T3 templates). All covered.
- Placeholders: none — every step has file paths, signatures, code, commands.
- Type consistency: `plan: MONTHLY|FULL`, `status: PENDING|APPROVED|REJECTED`, `amount` paise everywhere, `transactionId` unique uppercase, invoice `INV-<8>`.
