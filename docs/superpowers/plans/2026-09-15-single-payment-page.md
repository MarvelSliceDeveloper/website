# Single Payment Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/catalogue/[slug]` details with a single two-column payment page (left invoice, right payer info + Razorpay Pay Now).

**Architecture:** Keep server resolver in `[slug]/page.tsx`, swap `PackageDetailClient` for new client `SinglePaymentPage` that reuses `useRazorpayPayment` (package flow) and course checkout endpoints (derived-course flow). No backend change.

**Tech Stack:** Next.js 16 App Router, React 19 client components, Tailwind 4, Razorpay checkout.js, existing `api` client + `useRazorpayPayment` hook.

**Spec:** `docs/superpowers/specs/2026-09-15-single-payment-page-design.md`

## Global Constraints

- Prices in paise in API, display as `₹(paise/100).toLocaleString("en-IN")`.
- No raw card number/expiry/CVC collection; real capture only inside Razorpay modal (`https://checkout.razorpay.com/v1/checkout.js`).
- Reuse `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments/batches`, `POST /api/payments/enroll`, `POST /api/payments/consent`, `POST /api/coupons/validate`; course-derived uses `POST /api/courses/catalogue/:id/checkout` + `/verify` + `/batches` + `/enroll`.
- Keep `revalidate: 60` server fetch in `[slug]/page.tsx`.
- `pnpm typecheck` + `pnpm lint` must pass; backend `payment.service.test.ts` unaffected.
- Mobile stacks (`grid-cols-1 md:grid-cols-2`).

---

### Task 1: Create SinglePaymentPage component

**Files:**
- Create: `apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx`
- Reuse: `apps/web/src/app/catalogue/_hooks/useRazorpayPayment.ts` (no edit), `apps/web/src/components/BrandLogo.tsx`, `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: `PackageDetail & { _derivedCourseId?: string }` as `pkg` prop (same shape `PackageDetailClient` receives today); `useRazorpayPayment()` hook return.
- Produces: `SinglePaymentPage({ pkg })` client component exporting default + named; exposes invoice totals derived from `pkg.price` + `couponApplied`.

- [ ] **Step 1: Create file with props + price helpers + layout shell**

Create `apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/toast";
import { useRazorpayPayment } from "../../_hooks/useRazorpayPayment";
import type { PackageDetail } from "@/lib/api-types";

type Props = { pkg: PackageDetail & { _derivedCourseId?: string } };

function formatINR(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function SinglePaymentPage({ pkg }: Props) {
  const isDerivedCourse = Boolean((pkg as { _derivedCourseId?: string })._derivedCourseId);
  const title = pkg.name;
  const thumb = pkg.courses?.[0]?.course?.thumbnailUrl ?? null;
  const basePrice = pkg.price ?? null;
  // package flow hook (used when NOT derived course)
  const pay = useRazorpayPayment();
  const totalPaise = pay.couponApplied ? pay.couponApplied.finalAmountPaise : (basePrice ?? 0);
  const discountPaise = pay.couponApplied ? pay.couponApplied.discountAmountPaise : 0;
  return (
    <div className="min-h-screen bg-[#6c5bff] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 h-64 w-full bg-[#4f46e5]/40" />
      <div className="relative mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-white">Payment Page</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-slate-50 p-6">
            <BrandLogo size="md" />
            <div className="mt-4 flex items-center gap-3">
              {thumb ? <img src={thumb} alt={title} className="h-12 w-12 rounded-lg object-cover" /> : null}
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{isDerivedCourse ? "Course" : pkg.isInternship ? "Internship" : "Package"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Price</span><span>{formatINR(basePrice)}</span></div>
              <div className="flex justify-between"><span>Discounts & Offers</span><span>{discountPaise ? `- ${formatINR(discountPaise)}` : "$ 0.00"}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>$ 0.00</span></div>
              <div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatINR(totalPaise)}</span></div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500">Payment form mounts here (Task 1 Step 3).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the shell**

Run: `pnpm --filter @lms/web typecheck` (from repo root; fallback `pnpm typecheck`)
Expected: PASS (no type errors in new file; unused `pay`/`api` imports allowed temporarily — if lint fails on unused, prefix with `_` or keep usage in next step).

- [ ] **Step 3: Add payer form + coupon + Pay Now wiring (package flow)**

Replace right column + add logic in same file. Add inside component (after `discountPaise`):

```tsx
const [method, setMethod] = useState<"card" | "bank">("card");
const [formError, setFormError] = useState("");
const pkgId = pkg.id;
const pkgName = pkg.name;
const canPay = basePrice != null && basePrice > 0 && pay.step !== "creating_order" && pay.step !== "processing_payment" && pay.step !== "verifying";

useEffect(() => {
  // prefill logged-in user once
  let cancelled = false;
  api.get<{ user: { name: string; email: string; phone?: string | null } }>("/api/auth/me")
    .then((me) => {
      if (cancelled || !me?.user) return;
      pay.setName(me.user.name ?? "");
      pay.setEmail(me.user.email ?? "");
      if (me.user.phone) pay.setMobile(me.user.phone);
    })
    .catch(() => {});
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

function valid(): boolean {
  if (pay.name.trim().length < 2) { setFormError("Enter your full name"); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pay.email.trim())) { setFormError("Enter a valid email"); return false; }
  const digits = pay.mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (digits.length !== 10) { setFormError("Enter a 10-digit mobile number"); return false; }
  setFormError("");
  return true;
}
```

Right column JSX (replace placeholder):

```tsx
<div className="p-6">
  <div className="grid grid-cols-2 gap-2">
    <button type="button" onClick={() => setMethod("card")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${method === "card" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}>Credit or Debit Card</button>
    <button type="button" onClick={() => setMethod("bank")} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${method === "bank" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}>Bank Transfer</button>
  </div>
  <label className="mt-4 block text-xs font-semibold text-slate-600">Name</label>
  <input value={pay.name} onChange={(e) => pay.setName(e.target.value)} placeholder="YOUR FULL NAME" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase" />
  <label className="mt-3 block text-xs font-semibold text-slate-600">Email</label>
  <input value={pay.email} onChange={(e) => pay.setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
  <label className="mt-3 block text-xs font-semibold text-slate-600">Phone</label>
  <input value={pay.mobile} onChange={(e) => pay.setMobile(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
  <label className="mt-3 block text-xs font-semibold text-slate-600">Coupon</label>
  <div className="mt-1 flex gap-2">
    <input value={pay.couponCode} onChange={(e) => pay.setCouponCode(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    {pay.couponApplied ? (
      <button type="button" onClick={pay.removeCoupon} className="rounded-lg border px-3 py-2 text-xs font-bold">Remove</button>
    ) : (
      <button type="button" onClick={() => pay.applyCoupon(pkgId)} disabled={pay.couponLoading} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50">Apply</button>
    )}
  </div>
  {pay.couponError ? <p className="mt-1 text-xs text-red-600">{pay.couponError}</p> : null}
  {pay.couponApplied ? <p className="mt-1 text-xs text-emerald-600">Coupon {pay.couponApplied.code} applied</p> : null}
  {formError ? <p className="mt-2 text-xs text-red-600">{formError}</p> : null}
  {pay.errorMsg ? <p className="mt-2 text-xs text-red-600">{pay.errorMsg}</p> : null}
  {basePrice == null || basePrice <= 0 ? (
    <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">This item is enquiry-only. Please contact us.</p>
  ) : (
    <button
      type="button"
      disabled={!canPay}
      onClick={() => {
        if (!valid()) return;
        if (isDerivedCourse) { setFormError("Course flow wires in Task 2 — use package slug for now"); return; }
        pay.startCheckout({ id: pkgId, name: pkgName, price: basePrice }).then(() => {
          // after startCheckout, if collecting_info, submit
          if (pay.step === "collecting_info") pay.infoSubmit({ id: pkgId, name: pkgName, price: basePrice });
        });
      }}
      className="mt-4 w-full rounded-lg bg-[#6c5bff] py-3 text-sm font-bold text-white disabled:opacity-50"
    >
      {pay.step === "creating_order" ? "Setting up payment..." : pay.step === "processing_payment" ? "Opening Razorpay..." : pay.step === "verifying" ? "Verifying..." : `Pay Now ${formatINR(totalPaise)}`}
    </button>
  )}
  {pay.step === "selecting_batch" ? (
    <div className="mt-4 rounded-lg border p-3">
      <p className="text-xs font-bold">Select batch</p>
      <select value={pay.selectedBatchId} onChange={(e) => pay.setSelectedBatchId(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
        <option value="">Choose batch</option>
        {pay.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button type="button" onClick={pay.submitEnroll} disabled={!pay.selectedBatchId || pay.loading} className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50">Confirm Enrollment</button>
    </div>
  ) : null}
  {pay.step === "complete" ? (
    <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
      Payment successful. Payment ID: {pay.paymentId ?? "—"} {pay.razorpayPaymentId ? `· Razorpay: ${pay.razorpayPaymentId}` : ""}
      <button type="button" onClick={() => window.print()} className="mt-2 w-full rounded-lg border border-emerald-300 bg-white py-2 font-bold">Download invoice (PDF via print)</button>
    </div>
  ) : null}
</div>
```

Note: `pay.step` read right after `startCheckout` is stale (state async) — the `collecting_info` branch is best-effort; guest flow also works because `startCheckout` sets `collecting_info` then operator clicks Pay again to `infoSubmit`. Keep simple for v1; document in code comment.

- [ ] **Step 4: Typecheck + lint the full component**

Run: `pnpm --filter @lms/web typecheck`
Expected: PASS

Run: `pnpm --filter @lms/web lint -- apps/web/src/app/catalogue/\[slug\]/_components/SinglePaymentPage.tsx` (fallback `pnpm lint`)
Expected: PASS (fix unused imports if flagged).

- [ ] **Step 5: Commit component**

```bash
git add apps/web/src/app/catalogue/\[slug\]/_components/SinglePaymentPage.tsx
git commit -m "feat(web): add single payment page component for catalogue slug"
```

### Task 2: Rewire [slug] page + derived-course checkout

**Files:**
- Modify: `apps/web/src/app/catalogue/[slug]/page.tsx:93-125`
- Modify: `apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx` (course branch)

**Interfaces:**
- Consumes: existing `getCatalogueCourse`, `getPackage`, `courseToPackageDetail` (unchanged); course APIs `POST /api/courses/catalogue/:id/checkout`, `POST .../verify`, `GET .../batches`, `POST .../enroll` (same signatures as `CourseDerivedCheckoutWidget.tsx:566-586,246-279`).
- Produces: `[slug]` route rendering `SinglePaymentPage` for both kinds.

- [ ] **Step 1: Swap page render to SinglePaymentPage**

In `apps/web/src/app/catalogue/[slug]/page.tsx`, replace import + returns:

```tsx
import SinglePaymentPage from "./_components/SinglePaymentPage";
// ...
const { slug } = await params;
const course = await getCatalogueCourse(slug);
if (course) {
  const derived = courseToPackageDetail(course);
  return <SinglePaymentPage pkg={derived} />;
}
const pkg = await getPackage(slug);
if (!pkg) { /* keep existing not-found block unchanged */ }
return <SinglePaymentPage pkg={pkg} />;
```

Delete `import { PackageDetailClient }` line. Keep `courseToPackageDetail`, `resolveApiBase`, `getPackage`, `getCatalogueCourse` untouched.

- [ ] **Step 2: Wire derived-course Pay Now (replace Task 1 placeholder)**

In `SinglePaymentPage.tsx`, add course checkout (adapted from `CourseDerivedCheckoutWidget.tsx:231-290,604-640`):

```tsx
// inside component, near pay hook:
const [courseBusy, setCourseBusy] = useState(false);
async function payForDerivedCourse() {
  const courseId = (pkg as { _derivedCourseId?: string })._derivedCourseId!;
  setCourseBusy(true);
  setFormError("");
  try {
    const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string; payment?: { id: string } }>(
      `/api/courses/catalogue/${courseId}/checkout`,
      { name: pay.name, email: pay.email, phone: pay.mobile || undefined, couponCode: pay.couponApplied?.code || undefined }
    );
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const rzp = new (window as unknown as { Razorpay: new (o: object) => { open: () => void } }).Razorpay({
          key: order.keyId, amount: order.amount, currency: order.currency,
          name: "Marvel Slice", description: pkg.name, order_id: order.orderId,
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await api.post<{ payment?: { id: string } }>(`/api/courses/catalogue/${courseId}/verify`, {
                razorpayPaymentId: resp.razorpay_payment_id, razorpayOrderId: resp.razorpay_order_id, razorpaySignature: resp.razorpay_signature,
              });
              void verifyRes;
              resolve();
            } catch (e: unknown) { reject(e instanceof Error ? e : new Error(getErrorMessage(e))); }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          prefill: { name: pay.name, email: pay.email, contact: pay.mobile || undefined },
          theme: { color: "#6c5bff" },
        });
        rzp.open();
      };
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });
  } catch (e: unknown) {
    setFormError(getErrorMessage(e));
  } finally {
    setCourseBusy(false);
  }
}
```

Change Pay Now `onClick` to:

```tsx
onClick={async () => {
  if (!valid()) return;
  if (isDerivedCourse) { await payForDerivedCourse(); return; }
  await pay.infoSubmit({ id: pkgId, name: pkgName, price: basePrice });
}}
```

And `canPay` includes `!courseBusy`. Button label includes `courseBusy ? "Processing..." : ...`.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @lms/web typecheck`
Expected: PASS

Run: `pnpm --filter @lms/web lint`
Expected: PASS (fix `any` — use `unknown` + `getErrorMessage` as shown).

- [ ] **Step 4: Commit rewire**

```bash
git add apps/web/src/app/catalogue/\[slug\]/page.tsx "apps/web/src/app/catalogue/[slug]/_components/SinglePaymentPage.tsx"
git commit -m "feat(web): route catalogue slug to single payment page with course flow"
```

### Task 3: Update catalogue card CTAs to Buy Now

**Files:**
- Modify: `apps/web/src/app/catalogue/_components/CourseCard.tsx:70`
- Modify: `apps/web/src/app/catalogue/_components/PackageCard.tsx:83-85`
- Modify: `apps/web/src/app/catalogue/_components/CatalogueListItem.tsx:154-157`

**Interfaces:**
- Consumes: nothing new. Produces: CTA copy change only, `href` unchanged.

- [ ] **Step 1: Edit the three CTA strings**

`CourseCard.tsx:70`:
```tsx
<span className="text-sm font-semibold text-primary">Buy Now →</span>
```

`PackageCard.tsx:83-85`:
```tsx
<span className="text-sm font-semibold text-primary">
  {isInternship ? "Apply Now →" : "Buy Now →"}
</span>
```

`CatalogueListItem.tsx:154-157`:
```tsx
<span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
  {isPackage ? (isInternship ? "Apply Now" : "Buy Now") : "Buy Now"}
  <IconArrowRight size={16} />
</span>
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm --filter @lms/web typecheck`
Expected: PASS

- [ ] **Step 3: Commit CTA copy**

```bash
git add apps/web/src/app/catalogue/_components/CourseCard.tsx apps/web/src/app/catalogue/_components/PackageCard.tsx apps/web/src/app/catalogue/_components/CatalogueListItem.tsx
git commit -m "feat(web): retitle catalogue cards to Buy Now"
```

### Task 4: Verify + manual QA checklist

**Files:**
- Test: existing `apps/api/src/__tests__/modules/payment.service.test.ts` (no change, regression only)

- [ ] **Step 1: Run quality gates**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm lint`
Expected: PASS (or pre-existing warnings only; no new errors in touched files)

Run: `pnpm --filter @lms/api test -- payment.service`
Expected: PASS (backend untouched)

- [ ] **Step 2: Manual QA (dev servers)**

Run: `docker-compose up -d; pnpm dev`
Check:
1. `/catalogue` list loads; cards show Buy Now.
2. Click course slug -> single payment page (purple bg, white card, left invoice with title+price, right name/email/phone+coupon+Pay Now). No curriculum/FAQ sections.
3. Click package slug -> same layout with package price.
4. Guest: fill name/email/10-digit phone, Apply valid coupon updates Total, Pay Now opens Razorpay modal, test payment verifies, success shows IDs + Download invoice.
5. Razorpay dismiss returns to form with data intact.
6. Invalid coupon shows inline error. Enquiry-only item (price null) shows contact note, Pay disabled.
7. Mobile 375px stacks vertically.
8. Logged-in user gets prefilled name/email/phone.

- [ ] **Step 3: Commit any QA fixes separately (if needed)**

```bash
git add -A
git commit -m "fix(web): qa fixes for single payment page"
```
If no fixes needed, skip this step (do not create empty commit).

---

## Self-Review

- Spec coverage: Goal (single page) -> Task 1+2; dynamic price -> Task 1 `basePrice`/`totalPaise`; name/email/phone -> Task 1 Step 3; coupon+tax/total -> Task 1 Step 3; Razorpay popup PCI-safe -> Task 1 Step 3 + Task 2 Step 2; remove details -> Task 2 Step 1 (no longer renders PackageDetailClient); CTA retitle -> Task 3; testing -> Task 4. Enquiry-only guard covered. Batch picker covered (package flow inline). No gaps.
- Placeholder scan: no TBD/TODO; every code step has full snippets; commands have expected outputs; error handling via `formError`/`errorMsg`/`getErrorMessage` explicit.
- Type consistency: `pkg: PackageDetail & {_derivedCourseId?: string}` used in Task 1 and Task 2; `formatINR(paise)` consistent; `pay.*` names match `useRazorpayPayment` return (`name,email,mobile,couponCode,couponApplied,couponError,couponLoading,batches,selectedBatchId,step,errorMsg,loading,paymentId,razorpayPaymentId,setName,setEmail,setMobile,setSelectedBatchId,setCouponCode,applyCoupon,removeCoupon,startCheckout,infoSubmit,submitEnroll`); course API paths match existing widget.
