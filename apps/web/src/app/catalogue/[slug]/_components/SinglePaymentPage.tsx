"use client";

import { useEffect, useState } from "react";
import { IconCircleCheck } from "@tabler/icons-react";
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

// Never show raw technical errors to users — map them to safe messages.
// Coupon/batch messages are already user-facing, so they pass through.
function friendlyError(err: unknown): string {
  const raw = getErrorMessage(err).trim();
  if (!raw) return "Something went wrong. Please try again.";
  const lower = raw.toLowerCase();
  if (lower.includes("cancel"))
    return "Payment was cancelled. No money was deducted — try again when ready.";
  if (lower.includes("coupon") || lower.includes("batch") || lower.includes("select"))
    return raw;
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("failed to load") ||
    lower.includes("gateway") ||
    lower.includes("timeout") ||
    lower.includes("connection") ||
    lower.includes("internet") ||
    lower.includes("offline")
  )
    return "We're having trouble reaching the server. Check your connection and try again.";
  if (
    raw.length > 120 ||
    /error|exception|stack|status|500|404|prisma|sql|token/i.test(raw)
  )
    return "Something went wrong on our side. Please try again in a moment.";
  return raw;
}

export default function SinglePaymentPage({ pkg }: Props) {
  const isDerivedCourse = Boolean(
    (pkg as { _derivedCourseId?: string })._derivedCourseId,
  );
  const title = pkg.name;
  const basePrice = pkg.price ?? null;
  // package flow hook (used when NOT derived course)
  const pay = useRazorpayPayment();
  const totalPaise = pay.couponApplied
    ? pay.couponApplied.finalAmountPaise
    : (basePrice ?? 0);
  // GST-inclusive breakup: list prices include 18% GST, so the net payable
  // splits 82% base value / 18% GST. gst = net - base keeps the sum exact.
  const baseValuePaise = Math.round((totalPaise * 82) / 100);
  const gstPaise = totalPaise - baseValuePaise;
  const discountPaise = pay.couponApplied
    ? pay.couponApplied.discountAmountPaise
    : 0;

  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const pkgId = pkg.id;
  const pkgName = pkg.name;
  const derivedCourseId =
    (pkg as { _derivedCourseId?: string })._derivedCourseId ?? null;
  // Derived-course (single course) checkout state — backend supports only
  // { name, email, phone } (no coupon) and requires name/email/phone on verify.
  const [courseBusy, setCourseBusy] = useState(false);
  const [courseComplete, setCourseComplete] = useState(false);
  const [courseReceipt, setCourseReceipt] = useState<{
    orderId?: string;
    paymentId?: string;
  } | null>(null);
  const [courseBatches, setCourseBatches] = useState<
    { id: string; name: string }[]
  >([]);
  const [courseBatchId, setCourseBatchId] = useState("");
  const [courseDbPaymentId, setCourseDbPaymentId] = useState<string | null>(
    null,
  );
  const [courseBatchLoading, setCourseBatchLoading] = useState(false);
  const canPay =
    basePrice != null &&
    basePrice > 0 &&
    !courseBusy &&
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

  function nameErr(v: string): string {
    return v.trim().length < 2 ? "Enter your full name" : "";
  }
  function emailErr(v: string): string {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? ""
      : "Enter a valid email";
  }
  function phoneErr(v: string): string {
    const digits = v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    return digits.length !== 10 ? "Enter a 10-digit mobile number" : "";
  }
  function valid(): boolean {
    const n = nameErr(pay.name);
    const e = emailErr(pay.email);
    const p = phoneErr(pay.mobile);
    setNameError(n);
    setEmailError(e);
    setPhoneError(p);
    return !n && !e && !p;
  }

  async function afterCourseVerified(
    dbPaymentIdValue: string,
    orderId: string,
    payId: string,
  ) {
    setCourseReceipt({ orderId, paymentId: payId });
    setCourseDbPaymentId(dbPaymentIdValue);
    try {
      const list = await api.get<{ id: string; name: string }[]>(
        `/api/courses/catalogue/${derivedCourseId}/batches`,
      );
      if (list && list.length > 0) {
        setCourseBatches(list);
        return;
      }
    } catch {
      // No batches endpoint / none available — fall through to completion
    }
    setCourseComplete(true);
  }

  async function payForDerivedCourse() {
    if (!derivedCourseId) return;
    setCourseBusy(true);
    setFormError("");
    try {
      const name = pay.name.trim();
      const email = pay.email.trim();
      const phone = pay.mobile.trim();
      const res = await api.post<{
        orderId?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        payment?: { id: string };
      }>(`/api/courses/catalogue/${derivedCourseId}/checkout`, {
        name,
        email,
        phone,
      });
      const orderId = res.orderId ?? res.order_id ?? `order_${Date.now()}`;

      // Stub order (no Razorpay keys) — verify directly without a modal.
      if (!res.keyId || orderId.startsWith("stub_")) {
        const payId = `pay_${Date.now()}`;
        const verifyRes = await api.post<{ payment?: { id: string } }>(
          `/api/courses/catalogue/${derivedCourseId}/verify`,
          {
            razorpayPaymentId: payId,
            razorpayOrderId: orderId,
            razorpaySignature: "verified_signature",
            name,
            email,
            phone,
          },
        );
        await afterCourseVerified(verifyRes.payment?.id ?? "", orderId, payId);
        return;
      }

      // Real order — open the Razorpay modal.
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const rzp = new (
            window as unknown as {
              Razorpay: new (o: object) => { open: () => void };
            }
          ).Razorpay({
            key: res.keyId,
            amount: res.amount ?? basePrice ?? 0,
            currency: res.currency ?? "INR",
            name: "Marvel Slice",
            description: pkg.name,
            order_id: orderId,
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                const verifyRes = await api.post<{ payment?: { id: string } }>(
                  `/api/courses/catalogue/${derivedCourseId}/verify`,
                  {
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                    name,
                    email,
                    phone,
                  },
                );
                await afterCourseVerified(
                  verifyRes.payment?.id ?? "",
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                );
                resolve();
              } catch (err: unknown) {
                reject(
                  err instanceof Error ? err : new Error(getErrorMessage(err)),
                );
              }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
            prefill: { name, email, contact: phone || undefined },
            theme: { color: "#6c5bff" },
          });
          rzp.open();
        };
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });
    } catch (err: unknown) {
      console.error(err);
      setFormError(friendlyError(err));
    } finally {
      setCourseBusy(false);
    }
  }

  async function enrollCourseBatch() {
    if (!derivedCourseId || !courseDbPaymentId || !courseBatchId) {
      setFormError("Please select a batch");
      return;
    }
    setCourseBatchLoading(true);
    try {
      await api.post(`/api/courses/catalogue/${derivedCourseId}/enroll`, {
        paymentId: courseDbPaymentId,
        batchId: courseBatchId,
        name: pay.name.trim(),
        email: pay.email.trim(),
        phone: pay.mobile.trim(),
      });
      setCourseBatches([]);
      setCourseComplete(true);
    } catch (err: unknown) {
      console.error(err);
      setFormError(friendlyError(err));
    } finally {
      setCourseBatchLoading(false);
    }
  }

  const [invoiceBusy, setInvoiceBusy] = useState(false);

  // Downloads the invoice PDF generated by the same server template that
  // is attached to the invoice email (GET /api/payments/:id/invoice).
  async function downloadInvoice(
    paymentId: string | null,
    proof: { orderId?: string | null; paymentId?: string | null } | null,
  ) {
    if (!paymentId || invoiceBusy) return;
    setInvoiceBusy(true);
    setFormError("");
    try {
      const params = new URLSearchParams();
      if (proof?.orderId) params.set("razorpayOrderId", proof.orderId);
      if (proof?.paymentId) params.set("razorpayPaymentId", proof.paymentId);
      const qs = params.toString();
      const res = await fetch(
        `/api/payments/${paymentId}/invoice${qs ? `?${qs}` : ""}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        console.error("invoice download failed", res.status, paymentId);
        throw new Error("Couldn't download the invoice. Please try again.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${paymentId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error(err);
      setFormError(friendlyError(err));
    } finally {
      setInvoiceBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF0FF] py-14 px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1100px 500px at 15% -10%, rgba(108,91,255,0.18), transparent), radial-gradient(900px 500px at 100% 10%, rgba(30,27,74,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#1E1B3A]">
            Complete your payment
          </h1>
          <span className="text-xs text-[#6B6688]">Secured by Razorpay</span>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-25px_rgba(30,27,74,0.35)] md:grid-cols-[1fr_1.1fr]">
          {/* ---------- Order summary (receipt side) ---------- */}
          <div className="relative bg-[#F7F6FF] p-8 md:border-r md:border-dashed md:border-[#D9D5F5]">
            <BrandLogo size="xl" />

            <h2 className="mt-6 text-base font-bold leading-snug text-[#1E1B3A]">
              {title}
            </h2>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
              <IconCircleCheck size={15} />
              Verified Certificate
            </p>

            <div className="mt-7 space-y-2.5 text-sm text-[#4A4666]">
              <div className="flex items-baseline justify-between">
                <span>Price</span>
                <span className="tabular-nums text-[#1E1B3A]">
                  {formatINR(baseValuePaise)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>Discounts &amp; offers</span>
                <span className="tabular-nums text-emerald-600">
                  {discountPaise
                    ? `− ${formatINR(discountPaise)}`
                    : formatINR(0)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>GST (18%, included)</span>
                <span className="tabular-nums">{formatINR(gstPaise)}</span>
              </div>

              <div className="mt-5! flex items-baseline justify-between border-t border-dashed border-[#D9D5F5] pt-4">
                <span className="text-sm font-medium text-[#1E1B3A]">
                  Total payable
                </span>
                <span className="text-xl font-bold tabular-nums text-[#1E1B3A]">
                  {formatINR(totalPaise)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {isDerivedCourse ? (
                <p className="text-xs text-[#8A85AC]">
                  Coupons apply to packages only.
                </p>
              ) : (
                <>
                  <label
                    htmlFor="spp-coupon"
                    className="block text-xs font-medium text-[#4A4666]"
                  >
                    Have a coupon?
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="spp-coupon"
                      value={pay.couponCode}
                      onChange={(e) => pay.setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 rounded-lg border border-[#E4E1FB] bg-white px-3 py-2 text-sm text-[#1E1B3A] outline-none placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:ring-1 focus:ring-[#6C5BFF]"
                    />
                    {pay.couponApplied ? (
                      <button
                        type="button"
                        onClick={pay.removeCoupon}
                        className="rounded-lg border border-[#E4E1FB] px-3 py-2 text-xs font-medium text-[#4A4666] hover:bg-[#EEF0FF]"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pay.applyCoupon(pkgId)}
                        disabled={pay.couponLoading}
                        className="rounded-lg border border-[#6C5BFF] px-3 py-2 text-xs font-medium text-[#6C5BFF] hover:bg-[#6C5BFF] hover:text-white disabled:opacity-50"
                      >
                        {pay.couponLoading ? "Applying…" : "Apply"}
                      </button>
                    )}
                  </div>
                  {pay.couponError ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      {friendlyError(pay.couponError)}
                    </p>
                  ) : null}
                  {pay.couponApplied ? (
                    <p className="mt-1.5 text-xs text-emerald-600">
                      Coupon {pay.couponApplied.code} applied
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* ---------- Contact + pay side ---------- */}
          <div className="p-8">
            <p className="text-sm font-medium text-[#1E1B3A]">Your details</p>
            <p className="mt-0.5 text-xs text-[#8A85AC]">
              We&apos;ll send your receipt here.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="spp-name"
                  className="block text-xs font-medium text-[#4A4666]"
                >
                  Full name
                </label>
                <input
                  id="spp-name"
                  value={pay.name}
                  onChange={(e) => {
                    pay.setName(e.target.value);
                    if (nameError) setNameError(nameErr(e.target.value));
                  }}
                  onBlur={() => setNameError(nameErr(pay.name))}
                  placeholder="Full name"
                  autoComplete="name"
                  aria-invalid={nameError ? true : undefined}
                  className="mt-1.5 w-full rounded-lg border border-[#E4E1FB] bg-[#FAFAFF] px-3 py-2.5 text-sm text-[#1E1B3A] outline-none placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:bg-white focus:ring-1 focus:ring-[#6C5BFF]"
                />
                {nameError ? (
                  <p className="mt-1 text-xs text-red-600">{nameError}</p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="spp-email"
                  className="block text-xs font-medium text-[#4A4666]"
                >
                  Email
                </label>
                <input
                  id="spp-email"
                  value={pay.email}
                  onChange={(e) => {
                    pay.setEmail(e.target.value);
                    if (emailError) setEmailError(emailErr(e.target.value));
                  }}
                  onBlur={() => setEmailError(emailErr(pay.email))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={emailError ? true : undefined}
                  className="mt-1.5 w-full rounded-lg border border-[#E4E1FB] bg-[#FAFAFF] px-3 py-2.5 text-sm text-[#1E1B3A] outline-none placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:bg-white focus:ring-1 focus:ring-[#6C5BFF]"
                />
                {emailError ? (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="spp-phone"
                  className="block text-xs font-medium text-[#4A4666]"
                >
                  Phone
                </label>
                <input
                  id="spp-phone"
                  value={pay.mobile}
                  onChange={(e) => {
                    pay.setMobile(e.target.value);
                    if (phoneError) setPhoneError(phoneErr(e.target.value));
                  }}
                  onBlur={() => setPhoneError(phoneErr(pay.mobile))}
                  placeholder="10-digit mobile number"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={phoneError ? true : undefined}
                  className="mt-1.5 w-full rounded-lg border border-[#E4E1FB] bg-[#FAFAFF] px-3 py-2.5 text-sm text-[#1E1B3A] outline-none placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:bg-white focus:ring-1 focus:ring-[#6C5BFF]"
                />
                {phoneError ? (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                ) : null}
              </div>
            </div>

            {formError ? (
              <p className="mt-3 text-xs text-red-600">{formError}</p>
            ) : null}
            {pay.errorMsg ? (
              <p className="mt-3 text-xs text-red-600">
                {friendlyError(pay.errorMsg)}
              </p>
            ) : null}

            {basePrice == null || basePrice <= 0 ? (
              <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                This item is enquiry-only. Please contact us.
              </p>
            ) : (
              <button
                type="button"
                disabled={!canPay}
                onClick={async () => {
                  if (!valid()) return;
                  if (isDerivedCourse) {
                    await payForDerivedCourse();
                    return;
                  }
                  // Prefilled or guest: submit directly (avoids stale step read).
                  await pay.infoSubmit({
                    id: pkgId,
                    name: pkgName,
                    price: basePrice,
                  });
                }}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#6C5BFF] to-[#4B3FD6] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6C5BFF]/30 transition hover:from-[#7A6BFF] hover:to-[#5847E6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {courseBusy
                  ? "Processing…"
                  : pay.step === "creating_order"
                    ? "Setting up payment…"
                    : pay.step === "processing_payment"
                      ? "Opening Razorpay…"
                      : pay.step === "verifying"
                        ? "Verifying…"
                        : `Pay now · ${formatINR(totalPaise)}`}
              </button>
            )}

            {courseBatches.length > 0 && !courseComplete ? (
              <div className="mt-5 rounded-xl border border-[#E4E1FB] bg-[#FAFAFF] p-4">
                <p className="text-xs font-semibold text-[#1E1B3A]">
                  Select your batch
                </p>
                <select
                  value={courseBatchId}
                  onChange={(e) => setCourseBatchId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E4E1FB] bg-white px-3 py-2.5 text-sm text-[#1E1B3A] outline-none focus:border-[#6C5BFF]"
                >
                  <option value="">Choose a batch</option>
                  {courseBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={enrollCourseBatch}
                  disabled={!courseBatchId || courseBatchLoading}
                  className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {courseBatchLoading ? "Confirming…" : "Confirm enrollment"}
                </button>
                <p className="mt-3 text-center text-xs text-[#8A85AC]">
                  None of these suit you?{" "}
                  <a
                    href={`mailto:support@marvelslice.com?subject=${encodeURIComponent(`Batch help — ${pkgName}`)}`}
                    className="font-semibold text-[#4B3FD6] hover:underline"
                  >
                    Contact Admin
                  </a>
                </p>
              </div>
            ) : null}

            {courseComplete ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                <p className="font-semibold">Payment successful</p>
                <p className="mt-1 text-emerald-700">
                  Order {courseReceipt?.orderId ?? "—"} · Payment{" "}
                  {courseReceipt?.paymentId ?? "—"}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    downloadInvoice(courseDbPaymentId, courseReceipt)
                  }
                  disabled={invoiceBusy}
                  className="mt-3 w-full rounded-lg border border-emerald-300 bg-white py-2 font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  {invoiceBusy ? "Preparing…" : "Download invoice (PDF)"}
                </button>
              </div>
            ) : null}

            {pay.step === "selecting_batch" ? (
              <div className="mt-5 rounded-xl border border-[#E4E1FB] bg-[#FAFAFF] p-4">
                <p className="text-xs font-semibold text-[#1E1B3A]">
                  Select your batch
                </p>
                <select
                  value={pay.selectedBatchId}
                  onChange={(e) => pay.setSelectedBatchId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E4E1FB] bg-white px-3 py-2.5 text-sm text-[#1E1B3A] outline-none focus:border-[#6C5BFF]"
                >
                  <option value="">Choose a batch</option>
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
                  className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm enrollment
                </button>
                <p className="mt-3 text-center text-xs text-[#8A85AC]">
                  None of these suit you?{" "}
                  <a
                    href={`mailto:support@marvelslice.com?subject=${encodeURIComponent(`Batch help — ${pkgName}`)}`}
                    className="font-semibold text-[#4B3FD6] hover:underline"
                  >
                    Contact Admin
                  </a>
                </p>
              </div>
            ) : null}

            {pay.step === "complete" ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                <p className="font-semibold">Payment successful</p>
                <p className="mt-1 text-emerald-700">
                  Payment ID {pay.paymentId ?? "—"}
                  {pay.razorpayPaymentId
                    ? ` · Razorpay ${pay.razorpayPaymentId}`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    downloadInvoice(pay.paymentId, {
                      orderId: pay.orderId,
                      paymentId: pay.razorpayPaymentId,
                    })
                  }
                  disabled={invoiceBusy}
                  className="mt-3 w-full rounded-lg border border-emerald-300 bg-white py-2 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {invoiceBusy ? "Preparing…" : "Download invoice (PDF)"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
