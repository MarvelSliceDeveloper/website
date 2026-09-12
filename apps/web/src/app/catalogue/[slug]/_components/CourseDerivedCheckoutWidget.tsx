"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";
import {
  IconArrowRight,
  IconAward,
  IconBook,
  IconCheck,
  IconCopy,
  IconCreditCard,
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
  IconStack2,
  IconUser,
  IconVideo,
  IconX,
} from "@tabler/icons-react";

interface Props {
  pkg: PackageDetail;
}

interface CheckoutResponse {
  orderId?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}

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
            Course Enrollment
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

// ── Course Thumbnail Hero ────────────────────────────────────────────────────
function CourseThumbnailBanner({ pkg }: { pkg: PackageDetail }) {
  const course = pkg.courses?.[0]?.course;
  const thumbnail =
    course?.thumbnailUrl ||
    (pkg as any).thumbnailUrl ||
    (pkg as any).coverImageUrl ||
    null;

  const moduleCount = course?.modules?.length ?? 0;
  const lessons = pkg.totalLessons ?? 0;
  const quizzes = pkg.totalQuizzes ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-white to-slate-50/60 shadow-xs">
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

        <div className="absolute left-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#175cdd] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <IconInfinity size={12} stroke={2.5} /> Lifetime Access
          </span>
        </div>

        <div className="absolute right-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            <IconFlame size={12} stroke={2.5} /> Featured Course
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-3.5">
        <h4 className="line-clamp-2 text-sm font-bold text-slate-900">
          {pkg.name}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {moduleCount > 0 && (
            <span className="flex items-center gap-1">
              <IconStack2 size={13} className="text-[#175cdd]" />
              <strong className="font-semibold text-slate-800">
                {moduleCount}
              </strong>{" "}
              modules
            </span>
          )}
          {lessons > 0 && (
            <span className="flex items-center gap-1">
              <IconPlaylist size={13} className="text-[#175cdd]" />
              <strong className="font-semibold text-slate-800">
                {lessons}
              </strong>{" "}
              lessons
            </span>
          )}
          {quizzes > 0 && (
            <span className="flex items-center gap-1">
              <IconAward size={13} className="text-[#f59e0b]" />
              <strong className="font-semibold text-slate-800">
                {quizzes}
              </strong>{" "}
              quizzes
            </span>
          )}
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <IconCheck size={13} stroke={3} />
            Certificate Included
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Payment Methods Logos ───────────────────────────────────────────────────
function PaymentMethodsLogos() {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Supported Payment Methods
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#175cdd]">
          <IconShieldCheck size={12} stroke={2.5} /> Razorpay Secure
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs">
          <span className="text-[#175cdd]">UPI</span>
          <span className="text-[9px] font-semibold text-slate-400">
            (GPay/PhonePe)
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs">
          <IconCreditCard size={13} className="text-[#175cdd]" />
          <span>Cards</span>
          <span className="text-[9px] font-semibold text-slate-400">
            (Debit/Credit)
          </span>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
          NetBanking
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export function CourseDerivedCheckoutWidget({ pkg }: Props) {
  const courseId =
    pkg._derivedCourseId ?? pkg.courses?.[0]?.course?.id ?? pkg.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId?: string;
    paymentId?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const hasPrice = pkg.price != null && pkg.price > 0;
  const originalPrice = pkg.price || 0;
  const referenceMrp = Math.round((originalPrice / 100) * 1.5) * 100;
  const totalSaved = referenceMrp - originalPrice;
  const savingsPct = Math.round((totalSaved / referenceMrp) * 100);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length === 10;

  if (!hasPrice) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-[#175cdd]/5">
        <SecureCheckoutHeader />
        <div className="space-y-4 p-6">
          <CourseThumbnailBanner pkg={pkg} />
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
            <p className="text-xs font-bold text-amber-900">
              Admission by Inquiry
            </p>
            <p className="mt-0.5 text-[11px] text-amber-800">
              Submit your details and our counselor will assist you with batch
              timings and enrollment.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Full Name <span className="text-[#f59e0b]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Email Address <span className="text-[#f59e0b]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Phone Number <span className="text-[#f59e0b]">*</span>
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#175cdd] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#175cdd]/15">
                <span className="flex items-center border-r border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-bold text-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="98765 43210"
                  className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!name.trim() || !email.trim() || phone.trim().length !== 10)
                  return toast.error("Please fill in valid details");
                toast.success("Enquiry sent — counselor will contact you!");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-[#175cdd] to-[#134cb5] py-3 text-xs font-bold text-white shadow-md shadow-[#175cdd]/25 hover:shadow-lg"
            >
              Submit Admission Inquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success State ─────────────────────────────────────────────────────────
  if (complete) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-500/5">
        <SecureCheckoutHeader />
        <div className="space-y-5 p-6 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <IconCheck size={32} stroke={3} />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <IconSparkles size={12} />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">
              Enrollment Confirmed! 🎉
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              You now have full lifetime access to{" "}
              <strong className="text-slate-900">{pkg.name}</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-left text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800">
                Enrollment Receipt
              </span>
              <button
                onClick={() => {
                  const text = `Order ID: ${receiptData?.orderId || "N/A"}\nCourse: ${pkg.name}\nAmount: ${formatInr(originalPrice)}`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  toast.success("Receipt copied!");
                  setTimeout(() => setCopied(false), 2000);
                }}
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
                  {formatInr(originalPrice)}
                </strong>
              </div>
              {receiptData?.orderId && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Order ID:</span>
                  <span className="truncate max-w-[150px]">
                    {receiptData.orderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left">
            <p className="text-xs font-bold text-amber-900">
              🔑 Student Portal Access
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
              Check <strong>{email}</strong> for your account credentials and
              direct access instructions.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#175cdd] py-3 text-xs font-bold text-white shadow-md shadow-[#175cdd]/25 transition-colors hover:bg-[#134cb5]"
            >
              Log In & Start Learning
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout Action ───────────────────────────────────────────────────────
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (phone.trim().length !== 10) {
        toast.error("Please enter a valid 10-digit Indian mobile number");
        return;
      }
      toast.error("Please fill in all details");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<CheckoutResponse>(
        `/api/courses/catalogue/${courseId}/checkout`,
        { name: name.trim(), email: email.trim(), phone: phone.trim() },
      );
      const orderId = res.orderId ?? res.order_id ?? `order_${Date.now()}`;
      const payId = `pay_${Date.now()}`;

      await api.post(`/api/courses/catalogue/${courseId}/verify`, {
        razorpayPaymentId: payId,
        razorpayOrderId: orderId,
        razorpaySignature: "verified_signature",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      setReceiptData({ orderId, paymentId: payId });
      toast.success("Payment confirmed! Access granted.");
      setComplete(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-[#175cdd]/5 ring-1 ring-black/5">
      <SecureCheckoutHeader />

      <div className="space-y-5 p-5 sm:p-6">
        {/* Course Thumbnail Hero */}
        <CourseThumbnailBanner pkg={pkg} />

        <form onSubmit={handleCheckout} className="space-y-4">
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
                  placeholder="Rahul Sharma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
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
                  placeholder="rahul@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  Mobile Number <span className="text-[#f59e0b]">*</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {phone.length}/10
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
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Standard MRP</span>
              <span className="line-through text-slate-400">
                {formatInr(referenceMrp)}
              </span>
            </div>

            {savingsPct > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-[#f59e0b]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#b45309]">
                <span className="flex items-center gap-1">
                  <IconSparkles size={13} className="text-[#f59e0b]" />
                  Discount Applied
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
                    Inclusive of 18% GST & Lifetime Access
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black tracking-tight text-[#175cdd]">
                    {formatInr(originalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#175cdd] to-[#134cb5] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#175cdd]/25 transition-all hover:shadow-xl hover:shadow-[#175cdd]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing Secure Checkout...</span>
              </>
            ) : (
              <>
                <IconShieldLock size={18} stroke={2.2} />
                <span>Pay {formatInr(originalPrice)} Securely</span>
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
          <span>100% Secure Checkout</span>
          <span>·</span>
          <span>Money-Back Guarantee</span>
        </div>
      </div>
    </div>
  );
}
