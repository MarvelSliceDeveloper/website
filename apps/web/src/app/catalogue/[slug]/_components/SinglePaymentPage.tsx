"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { useRazorpayPayment } from "../../_hooks/useRazorpayPayment";
import type { PackageDetail } from "@/lib/api-types";

type Props = { pkg: PackageDetail & { _derivedCourseId?: string } };

function formatINR(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function SinglePaymentPage({ pkg }: Props) {
  const isDerivedCourse = Boolean(
    (pkg as { _derivedCourseId?: string })._derivedCourseId,
  );
  const title = pkg.name;
  const thumb = pkg.courses?.[0]?.course?.thumbnailUrl ?? null;
  const basePrice = pkg.price ?? null;
  // package flow hook (used when NOT derived course)
  const pay = useRazorpayPayment();
  const totalPaise = pay.couponApplied
    ? pay.couponApplied.finalAmountPaise
    : (basePrice ?? 0);
  const discountPaise = pay.couponApplied
    ? pay.couponApplied.discountAmountPaise
    : 0;

  const [method, setMethod] = useState<"card" | "bank">("card");
  const [formError, setFormError] = useState("");
  const pkgId = pkg.id;
  const pkgName = pkg.name;
  const canPay =
    basePrice != null &&
    basePrice > 0 &&
    pay.step !== "creating_order" &&
    pay.step !== "processing_payment" &&
    pay.step !== "verifying";

  useEffect(() => {
    // prefill logged-in user once
    let cancelled = false;
    api
      .get<{ user: { name: string; email: string; phone?: string | null } }>(
        "/api/auth/me",
      )
      .then((me) => {
        if (cancelled || !me?.user) return;
        pay.setName(me.user.name ?? "");
        pay.setEmail(me.user.email ?? "");
        if (me.user.phone) pay.setMobile(me.user.phone);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function valid(): boolean {
    if (pay.name.trim().length < 2) {
      setFormError("Enter your full name");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pay.email.trim())) {
      setFormError("Enter a valid email");
      return false;
    }
    const digits = pay.mobile
      .replace(/\D/g, "")
      .replace(/^91(?=\d{10}$)/, "");
    if (digits.length !== 10) {
      setFormError("Enter a 10-digit mobile number");
      return false;
    }
    setFormError("");
    return true;
  }

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
              {thumb ? (
                <img
                  src={thumb}
                  alt={title}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : null}
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">
                  {isDerivedCourse
                    ? "Course"
                    : pkg.isInternship
                      ? "Internship"
                      : "Package"}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Price</span>
                <span>{formatINR(basePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discounts & Offers</span>
                <span>
                  {discountPaise
                    ? `- ${formatINR(discountPaise)}`
                    : "$ 0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>$ 0.00</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span>{formatINR(totalPaise)}</span>
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="spp-coupon"
                className="block text-xs font-semibold text-slate-600"
              >
                Coupon
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="spp-coupon"
                  value={pay.couponCode}
                  onChange={(e) => pay.setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {pay.couponApplied ? (
                  <button
                    type="button"
                    onClick={pay.removeCoupon}
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => pay.applyCoupon(pkgId)}
                    disabled={pay.couponLoading}
                    className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    Apply
                  </button>
                )}
              </div>
              {pay.couponError ? (
                <p className="mt-1 text-xs text-red-600">{pay.couponError}</p>
              ) : null}
              {pay.couponApplied ? (
                <p className="mt-1 text-xs text-emerald-600">
                  Coupon {pay.couponApplied.code} applied
                </p>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${method === "card" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
              >
                Credit or Debit Card
              </button>
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${method === "bank" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
              >
                Bank Transfer
              </button>
            </div>
            <label
              htmlFor="spp-name"
              className="mt-4 block text-xs font-semibold text-slate-600"
            >
              Name
            </label>
            <input
              id="spp-name"
              value={pay.name}
              onChange={(e) => pay.setName(e.target.value)}
              placeholder="YOUR FULL NAME"
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase"
            />
            <label
              htmlFor="spp-email"
              className="mt-3 block text-xs font-semibold text-slate-600"
            >
              Email
            </label>
            <input
              id="spp-email"
              value={pay.email}
              onChange={(e) => pay.setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <label
              htmlFor="spp-phone"
              className="mt-3 block text-xs font-semibold text-slate-600"
            >
              Phone
            </label>
            <input
              id="spp-phone"
              value={pay.mobile}
              onChange={(e) => pay.setMobile(e.target.value)}
              placeholder="10-digit mobile"
              inputMode="tel"
              autoComplete="tel"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            {formError ? (
              <p className="mt-2 text-xs text-red-600">{formError}</p>
            ) : null}
            {pay.errorMsg ? (
              <p className="mt-2 text-xs text-red-600">{pay.errorMsg}</p>
            ) : null}
            {basePrice == null || basePrice <= 0 ? (
              <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                This item is enquiry-only. Please contact us.
              </p>
            ) : (
              <button
                type="button"
                disabled={!canPay}
                onClick={async () => {
                  if (!valid()) return;
                  if (isDerivedCourse) {
                    // Course flow wires in Task 2
                    setFormError(
                      "Course checkout wires in the next step — try a package slug for now.",
                    );
                    return;
                  }
                  // Prefilled or guest: submit directly (avoids stale step read).
                  await pay.infoSubmit({
                    id: pkgId,
                    name: pkgName,
                    price: basePrice,
                  });
                }}
                className="mt-4 w-full rounded-lg bg-[#6c5bff] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {pay.step === "creating_order"
                  ? "Setting up payment..."
                  : pay.step === "processing_payment"
                    ? "Opening Razorpay..."
                    : pay.step === "verifying"
                      ? "Verifying..."
                      : `Pay Now ${formatINR(totalPaise)}`}
              </button>
            )}
            {pay.step === "selecting_batch" ? (
              <div className="mt-4 rounded-lg border p-3">
                <p className="text-xs font-bold">Select batch</p>
                <select
                  value={pay.selectedBatchId}
                  onChange={(e) => pay.setSelectedBatchId(e.target.value)}
                  className="mt-1 w-full rounded border px-2 py-2 text-sm"
                >
                  <option value="">Choose batch</option>
                  {pay.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={pay.submitEnroll}
                  disabled={!pay.selectedBatchId || pay.loading}
                  className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Confirm Enrollment
                </button>
              </div>
            ) : null}
            {pay.step === "complete" ? (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                Payment successful. Payment ID: {pay.paymentId ?? "—"}{" "}
                {pay.razorpayPaymentId
                  ? `· Razorpay: ${pay.razorpayPaymentId}`
                  : ""}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-2 w-full rounded-lg border border-emerald-300 bg-white py-2 font-bold"
                >
                  Download invoice (PDF via print)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
