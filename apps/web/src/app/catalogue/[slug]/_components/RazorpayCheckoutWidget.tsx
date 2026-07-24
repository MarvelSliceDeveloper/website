"use client";

import Image from "next/image";
import { useRazorpayPayment } from "../../_hooks/useRazorpayPayment";
import { toast } from "sonner";
import type { PackageDetail } from "@/lib/api-types";

interface BatchDisplay {
  id: string;
  name: string;
  startDate?: string;
  seatsAvailable?: number | null;
}

interface Props {
  pkg: PackageDetail;
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
        <p className="text-sm text-muted-foreground text-center">
          Contact us for pricing
        </p>
      </div>
    );
  }

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

  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  // Idle state — show initial pay card
  if (step === "idle") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
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
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>
        </div>

          <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{pkg.name}</span>
            <span className="font-semibold text-foreground">
              {formatPrice(pkg.price!)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Courses included</span>
            <span className="text-foreground">{pkg.courses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lessons &amp; Quizzes</span>
            <span className="text-foreground">{pkg.totalLessons ?? 0} lessons · {pkg.totalQuizzes ?? 0} quizzes</span>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="border-t border-border pt-4 mb-4">
          <p className="text-xs font-medium text-foreground mb-2">Have a coupon code?</p>
          {couponApplied ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/25 rounded-lg px-3 py-2">
              <div>
                <span className="text-xs font-bold text-success">{couponApplied.code}</span>
                <span className="text-xs text-success/80 ml-2">
                  {couponApplied.discountType === "PERCENTAGE"
                    ? `${couponApplied.discountValue}% off`
                    : `₹${couponApplied.discountValue} off`}
                </span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs text-danger hover:text-danger/80 font-medium"
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
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="field flex-1 text-xs font-mono"
                />
                <button
                  onClick={() => applyCoupon(pkg.id)}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
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

        <div className="border-t border-border pt-4 mb-6">
          {couponApplied ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(pkg.price!)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-success font-medium">Discount ({couponApplied.code})</span>
                <span className="text-success font-medium">−{formatPrice(couponApplied.discountAmountPaise)}</span>
              </div>
              <div className="flex justify-between text-base pt-1 border-t border-border/50">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg text-foreground">
                  {formatPrice(couponApplied.finalAmountPaise)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-base">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-foreground">
                {formatPrice(pkg.price!)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleBuyNow}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
        >
          Buy Now — {formatPrice(couponApplied ? couponApplied.finalAmountPaise : pkg.price!)}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          🔒 Secure payment via Razorpay
        </p>
      </div>
    );
  }

  // Collecting info — guest checkout form
  if (step === "collecting_info") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Your Information
        </h3>
        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
          {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

          <div className="border-t border-border pt-4">
            {/* Coupon in collecting_info */}
            <div className="mb-4">
              <p className="text-xs font-medium text-foreground mb-2">Have a coupon code?</p>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-success/10 border border-success/25 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs font-bold text-success">{couponApplied.code}</span>
                    <span className="text-xs text-success/80 ml-2">
                      {couponApplied.discountType === "PERCENTAGE"
                        ? `${couponApplied.discountValue}% off`
                        : `₹${couponApplied.discountValue} off`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs text-danger hover:text-danger/80 font-medium"
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
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="field flex-1 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(pkg.id)}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
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

            {couponApplied ? (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{pkg.name}</span>
                  <span className="text-foreground">{formatPrice(pkg.price!)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success font-medium">Discount ({couponApplied.code})</span>
                  <span className="text-success font-medium">−{formatPrice(couponApplied.discountAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-base pt-1 border-t border-border/50">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">
                    {formatPrice(couponApplied.finalAmountPaise)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">{pkg.name}</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(pkg.price!)}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : `Pay ${formatPrice(couponApplied ? couponApplied.finalAmountPaise : pkg.price!)}`}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure payment via Razorpay
          </p>
        </form>
      </div>
    );
  }

  // Processing states
  if (
    step === "creating_order" ||
    step === "processing_payment" ||
    step === "verifying"
  ) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="text-center py-8">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {step === "creating_order" && "Setting up payment..."}
            {step === "processing_payment" && "Opening payment window..."}
            {step === "verifying" && "Verifying payment..."}
          </p>
        </div>
      </div>
    );
  }

  // Batch selection
  if (step === "selecting_batch") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Select a Batch
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your payment was successful! Choose a batch to enroll in:
        </p>

        {batches.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {batches.map((batch: BatchDisplay) => (
              <label
                key={batch.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {batch.name}
                  </p>
                  {batch.startDate && (
                    <p className="text-xs text-muted">
                      Starts{" "}
                      {new Date(batch.startDate).toLocaleDateString("en-IN")}
                    </p>
                  )}
                  {batch.seatsAvailable != null && (
                    <p className="text-xs text-muted">
                      {batch.seatsAvailable} seats left
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-4">No batches available.</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmitConsent}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-card-hover transition-colors"
          >
            Contact me later
          </button>
          <button
            onClick={handleSubmitEnroll}
            disabled={!selectedBatchId || loading}
            className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Enrolling..." : "Enroll Now"}
          </button>
        </div>
      </div>
    );
  }

  // Complete
  if (step === "complete") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-foreground font-medium">Welcome aboard!</p>
          {isNewUser && (
            <p className="text-sm text-muted-foreground">
              Check your email for login credentials.
            </p>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
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
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-danger"
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
          <p className="text-danger text-sm">
            {errorMsg || "Something went wrong."}
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
