"use client";

import Image from "next/image";
import { useRazorpayPayment } from "../../_hooks/useRazorpayPayment";
import { toast } from "sonner";
import type { PackageDetail } from "@/lib/api-types";
import {
  IconArrowRight,
  IconBook,
  IconCalendarEvent,
  IconCheck,
  IconLock,
  IconPhone,
  IconPlaylist,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
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

// NOTE: steps collapsed from 3 to 3 (Details & Payment / Processing / Batch & Enroll) —
// the old "idle" summary screen and "collecting_info" form are now the SAME screen.
const STEPS = ["Details & Payment", "Processing", "Batch & Enroll"] as const;

function SecureCheckoutHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-2.5">
        <Image
          src="/images/logo.svg"
          alt="Marvel Slice"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="text-base font-bold tracking-tight text-foreground">
          Marvel Slice
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/10 px-3 py-1 text-[11px] font-medium text-muted-foreground">
        <IconLock size={11} />
        Secure checkout
      </span>
    </div>
  );
}

function StepIndicator({ active }: { active: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm font-medium">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const isActive = n === active;
        const isDone = n < active;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/15 text-muted-foreground"
              }`}
            >
              {isDone ? <IconCheck size={12} stroke={3} /> : n}
            </span>
            <span
              className={`hidden truncate text-xs sm:inline ${
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="ml-auto h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

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
    <div>
      {couponApplied ? (
        <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <IconSparkles size={13} className="text-success" />
            <span className="text-xs font-bold text-success">
              {couponApplied.code}
            </span>
            <span className="text-xs text-success/80">
              {couponApplied.discountType === "PERCENTAGE"
                ? `${couponApplied.discountValue}% off`
                : `₹${couponApplied.discountValue} off`}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-muted-foreground hover:text-danger"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              className="field w-0 flex-1 text-xs font-mono"
            />
            <button
              type="button"
              onClick={onApply}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-lg bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-colors hover:opacity-90 disabled:opacity-40"
            >
              {couponLoading ? "..." : "Apply"}
            </button>
          </div>
          {couponError && (
            <p className="text-[11px] text-danger">{couponError}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PriceBreakdown({
  pkg,
  couponApplied,
}: {
  pkg: PackageDetail;
  couponApplied: AppliedCoupon | null;
}) {
  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">{formatPrice(pkg.price!)}</span>
      </div>
      {couponApplied && (
        <div className="flex justify-between text-sm">
          <span className="text-success">Discount</span>
          <span className="text-success">
            −{formatPrice(couponApplied.discountAmountPaise)}
          </span>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1.5">
        <span className="text-sm font-medium text-muted-foreground">Total</span>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {formatPrice(
            couponApplied ? couponApplied.finalAmountPaise : pkg.price!,
          )}
        </span>
      </div>
    </div>
  );
}

export function RazorpayCheckoutWidget({ pkg }: Props) {
  const {
    step,
    name,
    email,
    mobile,
    isNewUser,
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

  const hasPrice = pkg.price != null && pkg.price > 0;

  if (!hasPrice) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-center text-sm text-muted-foreground">
          Contact us for pricing
        </p>
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

  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // infoSubmit now carries the checkout straight from the merged
    // details+payment screen into order creation — no separate "idle" click first.
    await infoSubmit(pkg);
  };

  const handleSubmitEnroll = async () => {
    await submitEnroll();
    toast.success("Enrolled successfully!");
  };

  const handleSubmitConsent = async () => {
    await submitConsent();
    toast.success(
      "Payment successful! An admin will contact you to complete enrollment.",
    );
  };

  // Merged step — package summary, name/email/mobile, coupon, price, and Pay
  // all live on one screen. Was previously split into "idle" then "collecting_info".
  if (step === "idle" || step === "collecting_info") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-6 p-6">
          <StepIndicator active={1} />

          <div>
            <p className="mb-1 text-[11px] font-semibold text-primary">
              Package
            </p>
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {pkg.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IconBook size={14} className="text-primary" />
                {pkg.courses.length} courses
              </span>
              <span className="flex items-center gap-1.5">
                <IconPlaylist size={14} className="text-primary" />
                {pkg.totalLessons ?? 0} lessons · {pkg.totalQuizzes ?? 0}{" "}
                quizzes
              </span>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field w-full text-sm"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field w-full text-sm"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Mobile
                  </label>
                  <div className="field flex items-center gap-1.5 py-0!">
                    <IconPhone
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="text-sm text-muted-foreground">+91</span>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) =>
                        setMobile(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      className="w-full bg-transparent py-2 text-sm outline-none"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/10 p-4">
              <CouponSection
                couponCode={couponCode}
                couponApplied={couponApplied}
                couponError={couponError}
                couponLoading={couponLoading}
                onCodeChange={setCouponCode}
                onApply={() => applyCoupon(pkg.id)}
                onRemove={removeCoupon}
              />
              <div className="mt-3 border-t border-border pt-3">
                <PriceBreakdown pkg={pkg} couponApplied={couponApplied} />
              </div>
            </div>

            {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading || !canPay}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground disabled:shadow-none"
            >
              {loading ? (
                "Please wait..."
              ) : (
                <>
                  <IconLock size={15} />
                  Pay {formatPrice(finalAmount)}
                  <IconArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <IconShieldCheck size={13} className="text-success" />
            Payments secured by Razorpay · Money-back guarantee
          </p>
        </div>
      </div>
    );
  }

  // Processing states (step 2)
  if (
    step === "creating_order" ||
    step === "processing_payment" ||
    step === "verifying"
  ) {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="p-6">
          <StepIndicator active={2} />
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {step === "creating_order" && "Setting up your payment…"}
              {step === "processing_payment" && "Opening payment window…"}
              {step === "verifying" && "Verifying payment…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Batch selection (step 3)
  if (step === "selecting_batch") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6">
          <StepIndicator active={3} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Select a batch
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment successful — pick a batch to enroll in.
            </p>
          </div>

          {batches.length > 0 ? (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {batches.map((batch: BatchDisplay) => (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    selectedBatchId === batch.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="batch"
                    value={batch.id}
                    checked={selectedBatchId === batch.id}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="accent-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {batch.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                      {batch.startDate && (
                        <span className="flex items-center gap-1">
                          <IconCalendarEvent size={12} />
                          {new Date(batch.startDate).toLocaleDateString(
                            "en-IN",
                          )}
                        </span>
                      )}
                      {batch.seatsAvailable != null && (
                        <span className="flex items-center gap-1">
                          <IconUsers size={12} />
                          {batch.seatsAvailable} seats left
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No batches available.</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmitConsent}
              disabled={loading}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm text-foreground transition-colors hover:bg-card-hover"
            >
              Contact me later
            </button>
            <button
              onClick={handleSubmitEnroll}
              disabled={!selectedBatchId || loading}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Enrolling..." : "Enroll Now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete
  if (step === "complete") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-3 p-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <IconCheck size={30} className="text-success" stroke={2.5} />
          </div>
          <p className="text-base font-semibold text-foreground">
            Welcome aboard!
          </p>
          {isNewUser && (
            <p className="text-sm text-muted-foreground">
              Check your email for login credentials.
            </p>
          )}
          <button
            onClick={reset}
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (step === "error") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-3 p-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
            <IconX size={30} className="text-danger" stroke={2.5} />
          </div>
          <p className="text-sm font-medium text-danger">
            {errorMsg || "Something went wrong."}
          </p>
          <button
            onClick={reset}
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
