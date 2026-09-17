# Single Payment Page replacing /catalogue/[slug] — Design Spec

Date: 2026-09-15
Status: Approved for planning (no code yet)
Owner: LMS Web
Decisions from brainstorming: Replace `/catalogue/[slug]` details with single payment page only (Approach A). Dynamic price from course or package. Layout like reference image. Collect name/email/phone before pay. Keep coupon + tax/total. Pay Now opens Razorpay popup (PCI-safe, no raw card handling).

## 1. Goal

Replace the current scrollable course/package details page at `/catalogue/[slug]` with a single payment page:

- Left panel = invoice summary: logo, course/package title + thumbnail, price, discounts/offers (coupon), tax, total, coupon input, download invoice after success.
- Right panel = payer info + payment: name, email, phone inputs, payment method tabs (visual), Pay Now button that opens Razorpay checkout.js modal.
- No curriculum / description / FAQ / reviews / sessions sections.
- Works for both single catalogue courses (`GET /api/courses/catalogue/:slug`) and packages (`GET /api/packages/public/:slug`), reusing existing slug resolution.

## 2. Non-goals

- No change to payment backend API (`/api/payments/*`, `/api/courses/catalogue/:id/checkout|verify` stay as-is).
- No custom card number/expiry/CVC collection or direct card processing (PCI scope). Image card fields are visual reference only; real capture happens in Razorpay modal.
- No removal of `/catalogue` list grid in v1 (list stays as entry; cards retitled to Buy Now). Full deletion of list is out of scope unless later requested.
- No new tax engine; tax stays display-only (₹0 unless already computed by coupon validation).
- No PDF invoice template redesign beyond existing receipt data (orderId, paymentId, razorpayPaymentId).

## 3. Current state (verified)

- `apps/web/src/app/catalogue/page.tsx:64` — client list grid, fetches `GET /api/courses/catalogue` + `GET /api/packages/public`, renders `CourseCard`, `PackageCard`, `CatalogueListItem`, links to `/catalogue/:slug`.
- `apps/web/src/app/catalogue/[slug]/page.tsx:93` — server component, tries `getCatalogueCourse(slug)` then `getPackage(slug)`, renders `PackageDetailClient`.
- `apps/web/src/app/catalogue/[slug]/_components/PackageDetailClient.tsx` — long scrollable details + sticky checkout.
- Checkout widgets: `RazorpayCheckoutWidget.tsx`, `CourseDerivedCheckoutWidget.tsx`, `InternCheckoutWidget.tsx` — all use `checkout.razorpay.com/v1/checkout.js` + `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments/batches`, `POST /api/payments/enroll`, `POST /api/payments/consent`.
- Shared hook: `apps/web/src/app/catalogue/_hooks/useRazorpayPayment.ts:51` — state machine `idle|collecting_info|creating_order|processing_payment|verifying|selecting_batch|complete|error` + coupon state (`POST /api/coupons/validate`).
- Cards: `CourseCard.tsx:29 href=/catalogue/slug`, `PackageCard.tsx:23 href=/catalogue/slug`.

## 4. Web changes (`apps/web`)

### 4.1 `apps/web/src/app/catalogue/[slug]/page.tsx` (edit)

Keep `getCatalogueCourse` + `getPackage` + `courseToPackageDetail` resolver unchanged. Replace render:

```tsx
import SinglePaymentPage from "./_components/SinglePaymentPage";
if (course) return <SinglePaymentPage item={{ kind: "course", ...course }} />;
const pkg = await getPackage(slug);
if (!pkg) return <NotFound />;
return <SinglePaymentPage item={{ kind: "package", ...pkg }} />;
```

Keep `revalidate: 60`, keep not-found block.

### 4.2 New `apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx` (create, client)

Props: `{ item: { kind: "course"|"package"; id; slug; title|name; thumbnailUrl?; coverImageUrl?; price: number|null; description? } }`.

Layout (match image):
- Page wrapper: `min-h-screen bg-[#6c5bff]` with decorative blobs, centered white card `max-w-4xl rounded-2xl grid md:grid-cols-2 overflow-hidden`.
- Left (invoice, `bg-slate-50`): BrandLogo, course thumbnail + title, price rows: Price ₹X, Discounts & Offers -₹Y (if couponApplied), Tax ₹0.00, divider, Total ₹Z bold. Coupon input + Apply/Remove (reuse `useRazorpayPayment` coupon state). After `complete`: show Download invoice button (window.print or existing receipt link) + payment IDs.
- Right (payment): tabs `Credit or Debit Card | Bank Transfer` (visual active state only, both route to same Razorpay modal since method chosen inside Razorpay). Inputs: Cardholder Name -> `name`, Email -> `email`, Phone -> `mobile` (10-digit validation). Pay Now button: disabled if !name || !email || !phone || !price. onClick -> `infoSubmit({ id, name, price })` flow from hook (create-order -> openRazorpayCheckout -> verify -> batches/consent).
- States: reuse `step` from hook for button label: `creating_order -> Setting up payment...`, `processing_payment -> Opening Razorpay...`, `verifying -> Verifying...`, `selecting_batch -> show BatchPicker inline`, `complete -> success check + enrollment note`, `error -> errorMsg box + Try again (reset)`.
- Prefill logged-in user via existing `startCheckout` auto-fetch `/api/auth/me` on mount.
- Validation: name >=2 chars, email regex, phone 10 digits (allow +91 prefix strip). Show inline errors.
- Responsive: `grid-cols-1 md:grid-cols-2`, left stacks above right on mobile.
- a11y: labels for inputs, aria-live for step/error.

Price math: `price` in paise from API. Display `₹(paise/100).toLocaleString("en-IN")`. If `couponApplied`, total = `couponApplied.finalAmountPaise`; discount = `couponApplied.discountAmountPaise`; else total = price. Pass `couponCode` through to `create-order` (hook already does).

### 4.3 Cards CTA text (edit, no route change)

- `CourseCard.tsx:70` — `View Course →` -> `Buy Now →`.
- `PackageCard.tsx` — same CTA change.
- `CatalogueListItem.tsx:44` — same CTA change.
- Keep `href=/catalogue/slug` (now payment page). Keep prefetch.

### 4.4 Deprecated (delete after 1 sprint, or keep unused)

- `PackageDetailClient.tsx`, `RazorpayCheckoutWidget.tsx`, `CourseDerivedCheckoutWidget.tsx`, `InternCheckoutWidget.tsx` — no longer imported by `[slug]/page.tsx`. Mark `@deprecated` first, delete in cleanup PR to allow rollback.

## 5. API / backend

No change. Reused as-is:

- `POST /api/payments/create-order { packageId|courseId, name, email, phone, couponCode }` (optionalAuth)
- `POST /api/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- `GET /api/payments/batches?packageId=`
- `POST /api/payments/enroll` (requireAuth), `POST /api/payments/consent` (requireAuth)
- `POST /api/coupons/validate { code, packageId }`
- Course flow `POST /api/courses/catalogue/:id/checkout|verify` where applicable (via derived-course path).

## 6. Checkout flow

1. Visit `/catalogue/:slug` -> server fetch item -> render `SinglePaymentPage` with price.
2. If logged in, prefill name/email/phone from `GET /api/auth/me`; else user types.
3. Optional: apply coupon -> `POST /api/coupons/validate` -> totals update.
4. Click Pay Now -> `POST /api/payments/create-order` -> Razorpay modal opens (`keyId, orderId`).
5. Razorpay success -> `POST /api/payments/verify` -> fetch batches.
6. If batches.length > 0 -> inline batch select + `POST /api/payments/enroll`; else `POST /api/payments/consent` -> `complete`.
7. Show success + IDs + Download invoice.

Failure: modal dismiss -> back to `idle`; verify fail -> `error` with retry; coupon invalid -> inline `couponError`.

## 7. What is removed from UI

Description HTML, modules/curriculum counts beyond title, learning objectives, instructor, highlights, projects, certifications, FAQs, related courses, sessions/recordings, Talk to Advisor, Enquire modal, sticky glance sidebar. Only title + thumbnail + price retained in invoice panel.

## 8. Testing & rollout

- `pnpm typecheck && pnpm lint && pnpm test:all` (backend `payment.service.test.ts` unaffected).
- Manual: (a) course slug -> payment page shows course price, pay as guest with name/email/phone succeeds; (b) package slug -> shows package price + coupon discount math correct; (c) logged-in prefill works; (d) batch-required package shows picker after verify; (e) mobile stacks; (f) invalid coupon shows error; (g) Razorpay dismiss returns to form without loss; (h) old details URL `/catalogue/:slug` now renders payment (no scrollable sections).
- Rollback: revert `[slug]/page.tsx` import to `PackageDetailClient` (keep file 1 sprint).

## 9. Risks

- Users expecting details before paying may hesitate — mitigate with thumbnail + title + total lessons line in invoice panel (optional one-liner, no scroll).
- Bank Transfer tab has no separate flow — both tabs open same Razorpay modal where user picks method; label tabs as visual only to avoid confusion.
- Price null (enquiry-only) courses: Pay Now disabled, show Contact/Enquiry note instead of breaking.

## 10. Files to touch

`apps/web/src/app/catalogue/[slug]/page.tsx`, `apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx` (new), `apps/web/src/app/catalogue/_components/CourseCard.tsx`, `apps/web/src/app/catalogue/_components/PackageCard.tsx`, `apps/web/src/app/catalogue/_components/CatalogueListItem.tsx`, deprecated: `PackageDetailClient.tsx`, `RazorpayCheckoutWidget.tsx`, `CourseDerivedCheckoutWidget.tsx`, `InternCheckoutWidget.tsx`.

---

Spec self-review: no TBD/TODO, prices in paise explicit, auth stated, PCI rationale explicit, rollback defined, scope is single implementation plan.
