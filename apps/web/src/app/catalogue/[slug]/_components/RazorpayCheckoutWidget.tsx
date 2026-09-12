"use client";

import { useState } from "react";
import Link from "next/link";
import { useRazorpayPayment } from "../../_hooks/useRazorpayPayment";
import { toast } from "sonner";
import type { PackageDetail } from "@/lib/api-types";
import {
  IconArrowRight,
  IconAward,
  IconBook,
  IconCalendarEvent,
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconDiscount2,
  IconFileCertificate,
  IconFlame,
  IconInfinity,
  IconLock,
  IconMail,
  IconPhone,
  IconPlaylist,
  IconReceipt,
  IconRefresh,
  IconShieldCheck,
  IconShieldLock,
  IconSparkles,
  IconTag,
  IconTicket,
  IconUser,
  IconUsers,
  IconVideo,
  IconX,
} from "@tabler/icons-react";

interface BatchDisplay {
  id: string;
  name: string;
  startDate?: string;
  seatsAvailable?: number | null;
}

interface AppliedCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmountPaise: number;
  finalAmountPaise: number;
}

interface Props {
  pkg: PackageDetail;
}

const STEPS = ["Details & Payment", "Processing", "Batch & Access"] as const;

function formatInr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

// ── Secure Checkout Header ───────────────────────────────────────────────────
function SecureCheckoutHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border/80 bg-slate-50/70 px-5 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#175cdd] text-white shadow-sm shadow-[#175cdd]/30">
          <IconShieldLock size={18} stroke={2.2} />
        </span>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-[#175cdd]">
            Marvel Slice
          </span>
          <span className="text-[11px] font-semibold text-slate-700">
            Secure Payment Gateway
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        256-bit SSL
      </span>
    </div>
  );
}

// ── Multi-Step Indicator ─────────────────────────────────────────────────────
function StepIndicator({ active }: { active: number }) {
  return (
    <ol className="flex items-center gap-2 py-1 text-xs font-medium">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const isActive = n === active;
        const isDone = n < active;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#175cdd] text-white shadow-sm shadow-[#175cdd]/40 ring-2 ring-[#175cdd]/20"
                  : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? <IconCheck size={13} stroke={3} /> : n}
            </span>
            <span
              className={`hidden truncate text-[11px] sm:inline ${
                isActive
                  ? "font-bold text-[#175cdd]"
                  : isDone
                    ? "font-medium text-slate-700"
                    : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`ml-auto h-0.5 flex-1 transition-colors ${
                  isDone ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Course / Package Hero Preview with Thumbnail ────────────────────────────
function CourseThumbnailBanner({ pkg }: { pkg: PackageDetail }) {
  const thumbnail =
    pkg.courses?.[0]?.course?.thumbnailUrl ||
    (pkg as any).thumbnailUrl ||
    (pkg as any).coverImageUrl ||
    null;

  const totalLessons = pkg.totalLessons ?? 0;
  const totalQuizzes = pkg.totalQuizzes ?? 0;
  const totalAssignments = pkg.totalAssignments ?? 0;
  const courseCount = pkg.courses?.length ?? 1;

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-white to-slate-50/60 shadow-xs">
      {/* Thumbnail area */}
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-slate-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={pkg.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#175cdd] via-[#1a4497] to-slate-900 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.25),transparent_60%)]" />
            <div className="relative text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md">
                <IconVideo size={24} stroke={1.8} />
              </span>
              <p className="mt-1.5 line-clamp-1 max-w-[200px] text-xs font-bold text-white">
                {pkg.name}
              </p>
            </div>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#175cdd] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <IconInfinity size={12} stroke={2.5} /> Lifetime Access
          </span>
        </div>

        <div className="absolute right-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            <IconFlame size={12} stroke={2.5} /> Best Value
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Details below thumbnail */}
      <div className="p-3.5">
        <h4 className="line-clamp-2 text-sm font-bold text-slate-900">
          {pkg.name}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <IconBook size={13} className="text-[#175cdd]" />
            <strong className="font-semibold text-slate-800">
              {courseCount}
            </strong>{" "}
            {courseCount === 1 ? "course" : "courses"}
          </span>
          {totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <IconPlaylist size={13} className="text-[#175cdd]" />
              <strong className="font-semibold text-slate-800">
                {totalLessons}
              </strong>{" "}
              lessons
            </span>
          )}
          {totalQuizzes > 0 && (
            <span className="flex items-center gap-1">
              <IconAward size={13} className="text-[#f59e0b]" />
              <strong className="font-semibold text-slate-800">
                {totalQuizzes}
              </strong>{" "}
              quizzes
            </span>
          )}
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <IconFileCertificate size={13} />
            Verified Certificate
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Payment Methods Logos Row ───────────────────────────────────────────────
function PaymentMethodsLogos() {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Guaranteed Safe & Instant Checkout
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#175cdd]">
          <IconShieldCheck size={12} stroke={2.5} /> Powered by Razorpay
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        {/* UPI Badge */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs">
          <span className="text-[#175cdd]">UPI</span>
          <span className="text-[9px] font-semibold text-slate-400">
            (GPay/PhonePe/Paytm)
          </span>
        </div>

        {/* Cards Badge */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs">
          <IconCreditCard size={13} className="text-[#175cdd]" />
          <span>Cards</span>
          <span className="text-[9px] font-semibold text-slate-400">
            (Visa/MC/RuPay)
          </span>
        </div>

        {/* NetBanking / EMI */}
        <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
          NetBanking · EMI
        </div>
      </div>
    </div>
  );
}

// ── Coupon Component with Instant Savings ───────────────────────────────────
function CouponSection({
  couponCode,
  couponApplied,
  couponError,
  couponLoading,
  onCodeChange,
  onApply,
  onRemove,
}: {
  couponCode: string;
  couponApplied: AppliedCoupon | null;
  couponError: string;
  couponLoading: boolean;
  onCodeChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      {couponApplied ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
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
                You saved {formatInr(couponApplied.discountAmountPaise)} with
                this coupon!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-white hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <IconTicket size={14} className="text-[#f59e0b]" /> Have a Promo
              or Coupon Code?
            </span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter coupon (e.g. MSLMS10)"
                value={couponCode}
                onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-slate-900 outline-none transition-all placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
              />
            </div>
            <button
              type="button"
              onClick={onApply}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-xl bg-[#175cdd] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#175cdd]/25 transition-all hover:bg-[#134cb5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {couponLoading ? "Applying..." : "Apply"}
            </button>
          </div>
          {couponError && (
            <p className="text-[11px] font-medium text-red-600">{couponError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Price Breakdown ─────────────────────────────────────────────────────────
function PriceBreakdown({
  pkg,
  couponApplied,
}: {
  pkg: PackageDetail;
  couponApplied: AppliedCoupon | null;
}) {
  const originalPrice = pkg.price!;
  // Synthetic reference MRP (standard 40% discount representation for conversion)
  const referenceMrp = Math.round((originalPrice / 100) * 1.5) * 100;
  const finalPrice = couponApplied
    ? couponApplied.finalAmountPaise
    : originalPrice;
  const totalSaved = referenceMrp - finalPrice;
  const savingsPct = Math.round((totalSaved / referenceMrp) * 100);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Standard MRP</span>
        <span className="line-through text-slate-400">
          {formatInr(referenceMrp)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Special Offer Price</span>
        <span className="font-semibold text-slate-800">
          {formatInr(originalPrice)}
        </span>
      </div>

      {couponApplied && (
        <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
          <span className="flex items-center gap-1">
            <IconDiscount2 size={13} />
            Coupon Discount ({couponApplied.code})
          </span>
          <span>−{formatInr(couponApplied.discountAmountPaise)}</span>
        </div>
      )}

      {/* Savings Callout Tag */}
      {savingsPct > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-[#f59e0b]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#b45309]">
          <span className="flex items-center gap-1">
            <IconSparkles size={13} className="text-[#f59e0b]" />
            Total Savings Today
          </span>
          <span>
            Save {formatInr(totalSaved)} ({savingsPct}% OFF)
          </span>
        </div>
      )}

      <div className="border-t border-slate-200/80 pt-2.5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-sm font-bold text-slate-900">
              Total Amount
            </span>
            <p className="text-[10px] font-medium text-slate-500">
              Inclusive of all taxes & GST
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black tracking-tight text-[#175cdd]">
              {formatInr(finalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Checkout Widget ────────────────────────────────────────────────────
export function RazorpayCheckoutWidget({ pkg }: Props) {
  const {
    step,
    name,
    email,
    mobile,
    isNewUser,
    orderId,
    razorpayPaymentId,
    batches,
    selectedBatchId,
    errorMsg,
    loading,
    couponCode,
    couponApplied,
    couponError,
    couponLoading,
    setName,
    setEmail,
    setMobile,
    setSelectedBatchId,
    setCouponCode,
    infoSubmit,
    submitEnroll,
    submitConsent,
    applyCoupon,
    removeCoupon,
    reset,
  } = useRazorpayPayment();

  const [copied, setCopied] = useState(false);

  const hasPrice = pkg.price != null && pkg.price > 0;

  if (!hasPrice) {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-md">
        <SecureCheckoutHeader />
        <div className="py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#175cdd]/10 text-[#175cdd]">
            <IconMail size={24} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">
            Enquiry Only Course
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            This program requires counselor review. Contact us for enrollment.
          </p>
          <a
            href="mailto:support@marvelslice.com"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#175cdd] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#134cb5]"
          >
            Contact Admissions
          </a>
        </div>
      </div>
    );
  }

  const finalAmount = couponApplied
    ? couponApplied.finalAmountPaise
    : pkg.price!;

  const canPay =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    mobile.trim().length === 10;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPay) {
      if (mobile.trim().length !== 10) {
        toast.error("Please enter a valid 10-digit Indian phone number");
        return;
      }
      toast.error("Please fill in all details");
      return;
    }
    await infoSubmit(pkg);
  };

  const handleSubmitEnroll = async () => {
    await submitEnroll();
    toast.success("Enrolled successfully in batch!");
  };

  const handleSubmitConsent = async () => {
    await submitConsent();
    toast.success("Payment recorded! Our team will assign your cohort.");
  };

  const handleCopyReceipt = () => {
    const text = `Order ID: ${orderId || "N/A"}\nPayment ID: ${
      razorpayPaymentId || "N/A"
    }\nPackage: ${pkg.name}\nAmount: ${formatInr(finalAmount)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Receipt details copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step 1: Details & Payment ─────────────────────────────────────────────
  if (step === "idle" || step === "collecting_info") {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-[#175cdd]/5 ring-1 ring-black/5">
        <SecureCheckoutHeader />

        <div className="space-y-5 p-5 sm:p-6">
          <StepIndicator active={1} />

          {/* Thumbnail preview of course/package */}
          <CourseThumbnailBanner pkg={pkg} />

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            {/* Customer Information */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Full Name <span className="text-[#f59e0b]">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconUser size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Email Address <span className="text-[#f59e0b]">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconMail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
                    placeholder="rahul@example.com"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Course credentials & access links will be sent here.
                </p>
              </div>

              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>
                    Phone Number <span className="text-[#f59e0b]">*</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {mobile.length}/10
                  </span>
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 transition-all focus-within:border-[#175cdd] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#175cdd]/15">
                  <div className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-bold text-slate-700">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Coupon Promo Section */}
            <CouponSection
              couponCode={couponCode}
              couponApplied={couponApplied}
              couponError={couponError}
              couponLoading={couponLoading}
              onCodeChange={setCouponCode}
              onApply={() => applyCoupon(pkg.id)}
              onRemove={removeCoupon}
            />

            {/* Price Breakdown */}
            <PriceBreakdown pkg={pkg} couponApplied={couponApplied} />

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading || !canPay}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#175cdd] to-[#134cb5] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#175cdd]/25 transition-all hover:shadow-xl hover:shadow-[#175cdd]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connecting to Razorpay...</span>
                </>
              ) : (
                <>
                  <IconShieldLock size={18} stroke={2.2} />
                  <span>Pay {formatInr(finalAmount)} Securely</span>
                  <IconArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Payment Methods Badges */}
          <PaymentMethodsLogos />

          {/* Trust Guarantee Footnote */}
          <div className="flex items-center justify-center gap-2 text-center text-[11px] font-medium text-slate-500">
            <IconShieldCheck size={14} className="text-emerald-600" />
            <span>100% Money-Back Guarantee</span>
            <span>·</span>
            <span>Instant Access</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Processing Payment ────────────────────────────────────────────
  if (
    step === "creating_order" ||
    step === "processing_payment" ||
    step === "verifying"
  ) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-[#175cdd]/5">
        <SecureCheckoutHeader />
        <div className="space-y-6 p-6">
          <StepIndicator active={2} />

          <div className="py-12 text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              {/* Pulsing glow rings */}
              <div className="absolute inset-0 animate-ping rounded-full bg-[#175cdd]/15" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-[#f59e0b]/20" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#175cdd] text-white shadow-md shadow-[#175cdd]/30">
                <IconShieldLock size={28} stroke={2.2} />
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {step === "creating_order" && "Initializing Secure Checkout…"}
              {step === "processing_payment" && "Opening Razorpay Gateway…"}
              {step === "verifying" && "Verifying Payment & Enrollment…"}
            </h3>

            <p className="mx-auto mt-2 max-w-xs text-xs text-slate-500">
              Please do not close or refresh this page while we finalize your
              transaction.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-medium text-slate-600">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              Direct Encrypted Connection
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Batch Selection ───────────────────────────────────────────────
  if (step === "selecting_batch") {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-[#175cdd]/5">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6">
          <StepIndicator active={3} />

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
              <IconCheck size={16} stroke={3} />
            </span>
            <h3 className="mt-2 text-sm font-bold text-emerald-950">
              Payment Successful!
            </h3>
            <p className="mt-0.5 text-xs text-emerald-700">
              Select your preferred batch cohort to complete enrollment.
            </p>
          </div>

          {batches.length > 0 ? (
            <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
              {batches.map((batch: BatchDisplay) => {
                const isSelected = selectedBatchId === batch.id;
                return (
                  <label
                    key={batch.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-[#175cdd] bg-[#175cdd]/5 shadow-sm ring-2 ring-[#175cdd]/15"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="batch"
                      value={batch.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="mt-1 h-4 w-4 accent-[#175cdd]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">
                          {batch.name}
                        </p>
                        {batch.seatsAvailable != null && (
                          <span className="rounded-full bg-[#f59e0b]/15 px-2 py-0.5 text-[10px] font-bold text-[#b45309]">
                            {batch.seatsAvailable} seats left
                          </span>
                        )}
                      </div>
                      {batch.startDate && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                          <IconCalendarEvent size={12} className="text-[#175cdd]" />
                          Starts{" "}
                          {new Date(batch.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No immediate batches scheduled. Our team will coordinate your
              onboarding cohort.
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleSubmitConsent}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Contact Me Later
            </button>
            <button
              onClick={handleSubmitEnroll}
              disabled={!selectedBatchId || loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#175cdd] to-[#134cb5] py-2.5 text-xs font-bold text-white shadow-sm shadow-[#175cdd]/25 transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Enrolling..." : "Enroll in Batch"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Complete State ────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-500/5">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6 text-center">
          {/* Confetti Celebration Icon */}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <IconCheck size={32} stroke={3} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <IconSparkles size={12} />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">
              Welcome Aboard! 🎉
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Your enrollment in{" "}
              <strong className="text-slate-900">{pkg.name}</strong> is
              confirmed.
            </p>
          </div>

          {/* Receipt Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-left text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800">
                Transaction Receipt
              </span>
              <button
                onClick={handleCopyReceipt}
                className="flex items-center gap-1 font-semibold text-[#175cdd] hover:underline"
              >
                <IconCopy size={12} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-2 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <strong className="text-slate-900">
                  {formatInr(finalAmount)}
                </strong>
              </div>
              {orderId && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Order ID:</span>
                  <span className="truncate max-w-[150px]">{orderId}</span>
                </div>
              )}
              {razorpayPaymentId && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Payment ID:</span>
                  <span className="truncate max-w-[150px]">
                    {razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isNewUser ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left">
              <p className="text-xs font-bold text-amber-900">
                🔑 Initial Login Credentials
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                We sent your temporary password to <strong>{email}</strong>.
                Please check your inbox to activate your account.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              You can now access your lessons and course materials right from
              your student portal.
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {isNewUser ? (
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#175cdd] py-3 text-xs font-bold text-white shadow-md shadow-[#175cdd]/25 transition-colors hover:bg-[#134cb5]"
              >
                Log In to Your Account
                <IconArrowRight size={14} />
              </Link>
            ) : (
              <Link
                href="/student"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#175cdd] py-3 text-xs font-bold text-white shadow-md shadow-[#175cdd]/25 transition-colors hover:bg-[#134cb5]"
              >
                Go to My Courses
                <IconArrowRight size={14} />
              </Link>
            )}

            <button
              onClick={reset}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Error State ───────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-xl shadow-red-500/5">
        <SecureCheckoutHeader />
        <div className="space-y-4 p-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <IconX size={28} stroke={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Payment Could Not Be Completed
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {errorMsg ||
                "Your transaction was not completed. No amount was deducted."}
            </p>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              onClick={reset}
              className="flex-1 rounded-xl bg-[#175cdd] py-3 text-xs font-bold text-white shadow-sm shadow-[#175cdd]/20 hover:bg-[#134cb5]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
