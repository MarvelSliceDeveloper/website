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
  IconPlaylist,
  IconReceipt,
  IconRefresh,
  IconShieldCheck,
  IconUser,
  IconUsers,
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

const STEPS = ["Your Information", "Payment", "Batch & Enroll"] as const;

function SecureCheckoutHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-2.5">
        <Image
          src="/images/logo.svg"
          alt="Marvel Slice"
          width={28}
          height={28}
          className="h-7 w-auto"
        />
        <span className="text-sm font-extrabold tracking-tight">
          <span className="text-blue-600">Marvel</span>{" "}
          <span className="text-blue-500">Slice</span>
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
        <IconLock size={12} />
        Secure Checkout
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
          <li key={label} className="flex min-w-0 items-center gap-2">
            {i > 0 && (
              <div className="mx-1 h-[2px] w-5 shrink-0 rounded bg-border sm:w-8" />
            )}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                  : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/15 text-muted-foreground"
              }`}
            >
              {isDone ? <IconCheck size={12} stroke={3} /> : n}
            </span>
            <span
              className={`hidden truncate text-xs font-medium sm:inline ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-muted-foreground">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconShieldCheck size={15} className="text-primary" />
        Razorpay Secure
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconReceipt size={15} className="text-primary" />
        Email Invoice
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <IconRefresh size={15} className="text-primary" />
        Money-back Guarantee
      </span>
    </div>
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
      <p className="mb-2 text-xs font-medium text-foreground">
        Have a coupon code?
      </p>
      {couponApplied ? (
        <div className="flex items-center justify-between rounded-lg border border-success/25 bg-success/10 px-3 py-2">
          <div>
            <span className="text-xs font-bold text-success">
              {couponApplied.code}
            </span>
            <span className="ml-2 text-xs text-success/80">
              {couponApplied.discountType === "PERCENTAGE"
                ? `${couponApplied.discountValue}% off`
                : `₹${couponApplied.discountValue} off`}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-danger hover:text-danger/80"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              className="field flex-1 text-xs font-mono"
            />
            <button
              type="button"
              onClick={onApply}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
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
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">{formatPrice(pkg.price!)}</span>
      </div>
      {couponApplied && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-success">
            Discount ({couponApplied.code})
          </span>
          <span className="font-medium text-success">
            −{formatPrice(couponApplied.discountAmountPaise)}
          </span>
        </div>
      )}
      <div className="flex justify-between border-t border-border pt-2 text-base">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-bold text-foreground">
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
    setSelectedBatchId,
    setCouponCode,
    startCheckout,
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

  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  const handleBuyNow = async () => {
    await startCheckout(pkg);
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Idle state — order summary with the primary action
  if (step === "idle") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Package
            </p>
            <h3 className="text-base font-semibold text-foreground">
              {pkg.name}
            </h3>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconBook size={16} className="shrink-0 text-primary" />
              Courses included — {pkg.courses.length}
            </div>
            <div className="flex items-center gap-2">
              <IconPlaylist size={16} className="shrink-0 text-primary" />
              Lessons &amp; Quizzes — {pkg.totalLessons ?? 0} lessons ·{" "}
              {pkg.totalQuizzes ?? 0} quizzes
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <CouponSection
              couponCode={couponCode}
              couponApplied={couponApplied}
              couponError={couponError}
              couponLoading={couponLoading}
              onCodeChange={setCouponCode}
              onApply={() => applyCoupon(pkg.id)}
              onRemove={removeCoupon}
            />
          </div>

          <PriceBreakdown pkg={pkg} couponApplied={couponApplied} />

          <button
            onClick={handleBuyNow}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <IconLock size={15} />
            Buy Now — {formatPrice(finalAmount)}
          </button>

          <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
            <IconShieldCheck size={13} className="text-success" />
            Secure payment via Razorpay
          </p>
        </div>
      </div>
    );
  }

  // Collecting info — guest checkout form (step 1)
  if (step === "collecting_info") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-6 p-6">
          <StepIndicator active={1} />

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconUser size={14} /> Your Details
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field w-full text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field w-full text-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? (
                "Please wait..."
              ) : (
                <>
                  Continue to Payment
                  <IconArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <TrustRow />

          {/* Order summary — pay disabled until details are submitted */}
          <div className="space-y-4 border-t border-border pt-4">
            <CouponSection
              couponCode={couponCode}
              couponApplied={couponApplied}
              couponError={couponError}
              couponLoading={couponLoading}
              onCodeChange={setCouponCode}
              onApply={() => applyCoupon(pkg.id)}
              onRemove={removeCoupon}
            />
            <PriceBreakdown pkg={pkg} couponApplied={couponApplied} />
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-muted/30 py-3 text-sm font-semibold text-muted-foreground opacity-60"
            >
              <IconLock size={15} />
              Pay {formatPrice(finalAmount)}
            </button>
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
              <IconShieldCheck size={13} className="text-success" />
              Secure payment via Razorpay
            </p>
          </div>
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
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="p-6">
          <StepIndicator active={2} />
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {step === "creating_order" && "Setting up payment..."}
              {step === "processing_payment" && "Opening payment window..."}
              {step === "verifying" && "Verifying payment..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Batch selection (step 3)
  if (step === "selecting_batch") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6">
          <StepIndicator active={3} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Select a Batch
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment was successful! Choose a batch to enroll in:
            </p>
          </div>

          {batches.length > 0 ? (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {batches.map((batch: BatchDisplay) => (
                <label
                  key={batch.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
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
                    {batch.startDate && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <IconCalendarEvent size={12} />
                        Starts{" "}
                        {new Date(batch.startDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                    {batch.seatsAvailable != null && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <IconUsers size={12} />
                        {batch.seatsAvailable} seats left
                      </p>
                    )}
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
              className="flex-1 rounded-lg border border-border py-2 text-sm text-foreground transition-colors hover:bg-card-hover"
            >
              Contact me later
            </button>
            <button
              onClick={handleSubmitEnroll}
              disabled={!selectedBatchId || loading}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
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
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-4 p-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <IconCheck size={32} className="text-success" stroke={2.5} />
          </div>
          <p className="font-medium text-foreground">Welcome aboard!</p>
          {isNewUser && (
            <p className="text-sm text-muted-foreground">
              Check your email for login credentials.
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
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
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <SecureCheckoutHeader />
        <div className="space-y-4 p-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/20">
            <svg
              className="h-8 w-8 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-sm text-danger">
            {errorMsg || "Something went wrong."}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
