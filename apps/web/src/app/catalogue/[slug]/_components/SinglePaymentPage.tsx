"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import {
  IconCircleCheck,
  IconCheck,
  IconClock,
  IconCopy,
  IconDeviceMobile,
  IconLock,
  IconQrcode,
  IconSparkles,
  IconTicket,
} from "@tabler/icons-react";
import BrandLogo from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";

type Props = { pkg: PackageDetail };

interface PackageBatchOption {
  id: string;
  name: string;
  startDate: string;
  course: { id: string; title: string } | null;
  seatsAvailable: number | null;
}

interface CouponValidation {
  couponId: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  originalAmountPaise: number;
  discountAmountPaise: number;
  finalAmountPaise: number;
}

interface PackagePaymentOptions {
  packageId: string;
  packageName: string;
  price: number | null;
  upi: {
    upiId: string;
    payeeName: string;
    isManualEnabled: boolean;
  } | null;
  upiIntent: string | null;
  batches: PackageBatchOption[];
}

function formatINR(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// Never show raw technical errors to users — map them to safe messages.
function friendlyError(err: unknown): string {
  const raw = getErrorMessage(err).trim();
  if (!raw) return "Something went wrong. Please try again.";
  const lower = raw.toLowerCase();
  if (lower.includes("cancel"))
    return "Payment was cancelled. No money was deducted — try again when ready.";
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

const inputClass =
  "w-full rounded-xl border border-[#E4E1FB] bg-[#FAFAFF] py-3 pl-3.5 pr-10 text-sm text-[#1E1B3A] outline-none transition placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:bg-white focus:ring-2 focus:ring-[#6C5BFF]/20 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100";

const UTR_RE = /^([0-9]{12}|[A-Z0-9]{12,22})$/;

// Input sanitisers: bad characters never even land in the field.
function cleanName(v: string): string {
  return v
    .replace(/[^\p{L}\s.'-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 60);
}
function cleanEmail(v: string): string {
  return v.replace(/\s/g, "").slice(0, 100);
}
function cleanPhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2); // drop +91 / 91
  return d.slice(0, 10);
}
function cleanUtr(v: string): string {
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 22);
}

function nameErr(v: string): string {
  return v.trim().length < 2 ? "Enter your full name" : "";
}
function emailErr(v: string): string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? ""
    : "Enter a valid email";
}
function phoneErr(v: string): string {
  return cleanPhone(v).length !== 10 ? "Enter a 10-digit mobile number" : "";
}
function utrErr(v: string): string {
  const s = v.trim().toUpperCase();
  if (!s) return "Enter the UTR from your UPI app";
  if (UTR_RE.test(s)) return "";
  return s.length < 12
    ? `UTR needs 12 digits — ${s.length} of 12 entered`
    : "Enter a valid 12-digit UTR / UPI reference number";
}

type FieldProps = {
  id: string;
  label: React.ReactNode;
  error: string;
  ok: boolean;
  hint?: React.ReactNode;
  className?: string;
  inputClassName?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

function Field({
  id,
  label,
  error,
  ok,
  hint,
  className = "",
  inputClassName = "",
  ...rest
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-[#4A4666]">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${inputClass} ${inputClassName}`}
          {...rest}
        />
        {ok && !error ? (
          <IconCircleCheck
            size={17}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
          />
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <div className="mt-1.5 text-[11px] text-[#8A85AC]">{hint}</div>
      ) : null}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E1B4A] text-[11px] font-bold text-white">
      {n}
    </span>
  );
}

export default function SinglePaymentPage({ pkg }: Props) {
  const title = pkg.name;
  const pkgId = pkg.id;
  const basePrice = pkg.price ?? null;

  const [data, setData] = useState<PackagePaymentOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [utrError, setUtrError] = useState("");

  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchError, setBatchError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] =
    useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const batches = data?.batches ?? [];
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  // Amount shown in the QR: discounted total when a coupon is applied,
  // otherwise the server price snapshot.
  const totalPaise = couponApplied
    ? couponApplied.finalAmountPaise
    : (data?.price ?? basePrice ?? 0);
  // GST-inclusive breakup: list prices include 18% GST, so the net payable
  // splits 82% base value / 18% GST. gst = net - base keeps the sum exact.
  const baseValuePaise = Math.round((totalPaise * 82) / 100);
  const gstPaise = totalPaise - baseValuePaise;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<PackagePaymentOptions>(
          `/api/packages/${pkgId}/payment-options`,
        );
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) setFormError(friendlyError(err));
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkgId]);

  useEffect(() => {
    // prefill logged-in user once
    let cancelled = false;
    api
      .get<{ user: { name: string; email: string; phone?: string | null } }>(
        "/api/auth/me",
      )
      .then((me) => {
        if (cancelled || !me?.user) {
          if (!cancelled) setIsGuest(true);
          return;
        }
        setName(me.user.name ?? "");
        setEmail(me.user.email ?? "");
        if (me.user.phone) setPhone(cleanPhone(me.user.phone));
      })
      .catch(() => {
        if (!cancelled) setIsGuest(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function valid(): boolean {
    const errs = {
      "spp-name": nameErr(name),
      "spp-email": emailErr(email),
      "spp-phone": phoneErr(phone),
      "spp-utr": utrErr(utr),
    };
    setNameError(errs["spp-name"]);
    setEmailError(errs["spp-email"]);
    setPhoneError(errs["spp-phone"]);
    setUtrError(errs["spp-utr"]);
    if (batches.length > 0 && !selectedBatchId) {
      setBatchError("Choose the batch you want to join");
      document.getElementById("spp-batch")?.focus();
      return false;
    }
    setBatchError("");
    const firstBad = (Object.keys(errs) as (keyof typeof errs)[]).find(
      (k) => errs[k],
    );
    if (firstBad) {
      document.getElementById(firstBad)?.focus();
      return false;
    }
    return true;
  }

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Copy failed — please copy manually");
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);
    try {
      const result = await api.post<CouponValidation>("/api/coupons/validate", {
        code,
        packageId: pkgId,
      });
      setCouponApplied(result);
      setCouponCode(result.code);
      toast.success(
        `Coupon applied — you saved ${formatINR(result.discountAmountPaise)}!`,
      );
    } catch (err: unknown) {
      setCouponError(getErrorMessage(err));
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid()) return;
    const normalized = utr.trim().toUpperCase();
    setSubmitting(true);
    setFormError("");
    try {
      await api.post(`/api/packages/${pkgId}/manual-order`, {
        transactionId: normalized,
        batchId: selectedBatchId || undefined,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ...(couponApplied ? { couponCode: couponApplied.code } : {}),
      });
      setSubmitted(true);
      toast.success(
        couponApplied
          ? `Payment submitted for review! Coupon saved you ${formatINR(couponApplied.discountAmountPaise)}.`
          : "Payment submitted for review!",
      );
    } catch (err: unknown) {
      setFormError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const upiEnabled = data?.upi?.isManualEnabled === true;
  const serverIntent = data?.upiIntent ?? null;
  const discountedIntent =
    couponApplied && data?.upi
      ? `upi://pay?pa=${encodeURIComponent(data.upi.upiId)}` +
        `&pn=${encodeURIComponent(data.upi.payeeName)}` +
        `&am=${(couponApplied.finalAmountPaise / 100).toFixed(2)}&cu=INR` +
        `&tn=${encodeURIComponent(title.slice(0, 80))}`
      : null;
  const upiIntent = discountedIntent ?? serverIntent;

  return (
    <div className="min-h-screen bg-[#EEF0FF] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1100px 500px at 15% -10%, rgba(108,91,255,0.18), transparent), radial-gradient(900px 500px at 100% 10%, rgba(30,27,74,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3 px-1">
          <BrandLogo size="xl" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[#4A4666] ring-1 ring-[#E4E1FB]">
            <IconLock size={13} className="text-emerald-600" />
            Secure UPI checkout
          </span>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-25px_rgba(30,27,74,0.35)] md:grid-cols-[1.05fr_1fr]">
          {/* ---------- LEFT: order + details + UTR ---------- */}
          <div className="order-2 p-6 sm:p-8 md:order-1">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEEBFB] pb-6">
              <div className="min-w-0">
                <p className="text-xs text-[#8A85AC]">You&apos;re buying</p>
                <h1 className="mt-1 text-xl font-bold leading-snug text-[#1E1B3A]">
                  {title}
                </h1>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                  <IconCircleCheck size={15} />
                  Verified Certificate
                </p>
              </div>
              <p className="shrink-0 text-right text-2xl font-bold tabular-nums text-[#1E1B3A]">
                {formatINR(totalPaise)}
              </p>
            </div>

            {submitted ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white">
                  <IconClock size={22} />
                </span>
                <h4 className="text-base font-bold text-red-950">
                  Payment submitted for review
                </h4>
                <p className="text-sm leading-relaxed text-red-800">
                  Your payment{couponApplied ? <> of <strong>{formatINR(couponApplied.finalAmountPaise)}</strong> (coupon {couponApplied.code} applied)</> : null} for <strong>{title}</strong> is pending admin
                  approval. You will receive an email with your invoice and
                  package access once approved.
                  {isGuest
                    ? " We created your student account — your login details were emailed to you."
                    : ""}
                </p>
                <p className="inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-xs text-red-700 ring-1 ring-red-200">
                  Ref: {utr.trim().toUpperCase()}
                </p>
                {selectedBatch && (
                  <p className="inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                    Batch: {selectedBatch.name}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-6">
                {/* Step 1 */}
                <div className="flex items-center gap-2.5">
                  <StepBadge n={1} />
                  <div>
                    <p className="text-sm font-semibold text-[#1E1B3A]">
                      Your details
                    </p>
                    <p className="text-xs text-[#8A85AC]">
                      We&apos;ll send your receipt here.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    id="spp-name"
                    label="Full name"
                    className="sm:col-span-2"
                    value={name}
                    onChange={(e) => {
                      const v = cleanName(e.target.value);
                      setName(v);
                      if (nameError) setNameError(nameErr(v));
                    }}
                    onBlur={() => setNameError(nameErr(name))}
                    placeholder="Full name"
                    autoComplete="name"
                    error={nameError}
                    ok={!nameErr(name)}
                  />
                  <Field
                    id="spp-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const v = cleanEmail(e.target.value);
                      setEmail(v);
                      if (emailError) setEmailError(emailErr(v));
                    }}
                    onBlur={() => setEmailError(emailErr(email))}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={emailError}
                    ok={!emailErr(email)}
                  />
                  <Field
                    id="spp-phone"
                    label="Phone"
                    value={phone}
                    onChange={(e) => {
                      const v = cleanPhone(e.target.value);
                      setPhone(v);
                      if (phoneError) setPhoneError(phoneErr(v));
                    }}
                    onBlur={() => setPhoneError(phoneErr(phone))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    error={phoneError}
                    ok={!phoneErr(phone)}
                    hint={`${phone.length}/10 digits`}
                  />
                </div>

                {batches.length > 0 && (
                  <div className="mt-4">
                    <label
                      htmlFor="spp-batch"
                      className="block text-xs font-medium text-[#4A4666]"
                    >
                      Which batch do you want to join?{" "}
                      <span className="text-[#f59e0b]">*</span>
                    </label>
                    <select
                      id="spp-batch"
                      value={selectedBatchId}
                      onChange={(e) => {
                        setSelectedBatchId(e.target.value);
                        if (batchError) setBatchError("");
                      }}
                      aria-invalid={batchError ? true : undefined}
                      className="mt-1.5 w-full rounded-lg border border-[#E4E1FB] bg-[#FAFAFF] px-3 py-2.5 text-sm text-[#1E1B3A] outline-none focus:border-[#6C5BFF] focus:bg-white focus:ring-1 focus:ring-[#6C5BFF]"
                    >
                      <option value="">Choose a batch</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                          {b.course ? ` · ${b.course.title}` : ""} · starts{" "}
                          {new Date(b.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {b.seatsAvailable != null
                            ? ` (${b.seatsAvailable} seats left)`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {batchError ? (
                      <p className="mt-1 text-xs text-red-600">{batchError}</p>
                    ) : null}
                  </div>
                )}

                {/* Coupon */}
                <div className="mt-6">
                  {couponApplied ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <IconSparkles size={15} />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black tracking-wider text-emerald-800">
                              {couponApplied.code}
                            </span>
                            <span className="rounded-full bg-emerald-200/70 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              APPLIED
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-emerald-700">
                            You saved{" "}
                            {formatINR(couponApplied.discountAmountPaise)} with
                            this coupon!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-white hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#4A4666]">
                        <IconTicket size={14} className="text-[#f59e0b]" />
                        Have a Promo or Coupon Code?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon (e.g. MSLMS10)"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleApplyCoupon())
                          }
                          className="w-full rounded-xl border border-[#E4E1FB] bg-[#FAFAFF] px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider text-[#1E1B3A] outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#B4B0D6] focus:border-[#6C5BFF] focus:bg-white focus:ring-2 focus:ring-[#6C5BFF]/20"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="shrink-0 rounded-xl bg-[#1E1B4A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#2d2760] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {couponLoading ? "Applying..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-600">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className="mt-8 flex items-center gap-2.5">
                  <StepBadge n={2} />
                  <div>
                    <p className="text-sm font-semibold text-[#1E1B3A]">
                      Confirm your payment
                    </p>
                    <p className="text-xs text-[#8A85AC]">
                      Pay using the QR, then paste the UTR from your UPI app.
                    </p>
                  </div>
                </div>

                <Field
                  id="spp-utr"
                  className="mt-4"
                  label={
                    <>
                      Transaction / UTR ID{" "}
                      <span className="text-[#f59e0b]">*</span>
                    </>
                  }
                  inputClassName="font-mono tracking-wider"
                  value={utr}
                  onChange={(e) => {
                    const v = cleanUtr(e.target.value);
                    setUtr(v);
                    if (formError) setFormError("");
                    if (utrError) setUtrError(utrErr(v));
                  }}
                  onBlur={() => utr && setUtrError(utrErr(utr))}
                  placeholder="e.g. 123456789012"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={22}
                  error={utrError}
                  ok={!utrErr(utr)}
                  hint={
                    <div className="flex items-start justify-between gap-3">
                      <span>
                        Find this in your UPI app payment history (UTR / UPI Ref
                        No.).
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {utr.length}/12
                      </span>
                    </div>
                  }
                />

                {formError ? (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError}
                  </p>
                ) : null}

                {basePrice == null || basePrice <= 0 ? (
                  <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    This item is enquiry-only. Please contact us.
                  </p>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || !upiIntent}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5BFF] to-[#4B3FD6] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6C5BFF]/30 transition hover:from-[#7A6BFF] hover:to-[#5847E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5BFF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={16} stroke={2.5} />
                        <span>Submit payment for review</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            )}
          </div>

          {/* ---------- RIGHT: pay panel with QR ---------- */}
          <div className="relative order-1 overflow-hidden bg-gradient-to-b from-[#26216B] to-[#1E1B4A] p-6 text-white sm:p-8 md:order-2 md:border-l md:border-dashed md:border-white/20">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(108,91,255,0.7), transparent)",
              }}
            />

            <div className="relative">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-white/70">Total payable</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatINR(totalPaise)}
                </p>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Price</span>
                  <span className="tabular-nums">
                    {formatINR(baseValuePaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%, included)</span>
                  <span className="tabular-nums">{formatINR(gstPaise)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between font-semibold text-emerald-300">
                    <span>Coupon {couponApplied.code}</span>
                    <span className="tabular-nums">
                      −{formatINR(couponApplied.discountAmountPaise)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {loadingOptions ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 p-10 text-xs font-medium text-white/80">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading UPI payment options...
                  </div>
                ) : !upiEnabled ? (
                  <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-5 text-center">
                    <p className="text-sm font-semibold text-amber-200">
                      UPI payments paused
                    </p>
                    <p className="mt-1 text-xs text-amber-100/80">
                      Manual UPI payment is not available right now. Please try
                      again later.
                    </p>
                  </div>
                ) : upiIntent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/80">
                      <IconQrcode size={15} />
                      Scan to pay {formatINR(totalPaise)}
                    </div>

                    <div className="mx-auto w-fit rounded-3xl bg-white p-4 shadow-2xl shadow-black/30">
                      <QRCode value={upiIntent} size={188} />
                    </div>

                    <p className="text-center text-[11px] text-white/60">
                      Works with GPay, PhonePe, Paytm and any UPI app
                    </p>

                    {/* On phones you can't scan your own screen — open the app directly */}
                    <a
                      href={upiIntent}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-[#1E1B4A] transition hover:bg-[#F1EFFF] md:hidden"
                    >
                      <IconDeviceMobile size={16} />
                      Open in UPI app
                    </a>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/50">UPI ID</p>
                          <p className="truncate font-mono text-sm font-semibold">
                            {data?.upi?.upiId}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(data?.upi?.upiId ?? "", "upi")
                          }
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 font-semibold hover:bg-white/25"
                        >
                          {copied === "upi" ? (
                            <IconCheck size={13} />
                          ) : (
                            <IconCopy size={13} />
                          )}
                          {copied === "upi" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/50">
                            Amount to {data?.upi?.payeeName}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatINR(totalPaise)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              String(Math.round(totalPaise / 100)),
                              "amt",
                            )
                          }
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 font-semibold hover:bg-white/25"
                        >
                          {copied === "amt" ? (
                            <IconCheck size={13} />
                          ) : (
                            <IconCopy size={13} />
                          )}
                          {copied === "amt" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <p className="text-center text-[11px] leading-relaxed text-white/50">
                      Pay the exact amount, then copy the 12-digit UTR from your
                      app and submit it on the left.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-center text-xs text-amber-100">
                    UPI payment is not available for this package right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
