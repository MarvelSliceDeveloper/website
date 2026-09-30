"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconQrcode,
} from "@tabler/icons-react";

interface PaymentOptions {
  courseId: string;
  courseTitle: string;
  fullPrice: number | null;
  monthlyPrice: number | null;
  upi: {
    upiId: string;
    payeeName: string;
    isManualEnabled: boolean;
  } | null;
  options: Record<string, { amount: number; upiIntent: string | null }>;
}

interface Props {
  courseId: string;
  courseName: string;
}

function formatInr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export function ManualUpiCheckout({ courseId, courseName }: Props) {
  const [data, setData] = useState<PaymentOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [plan, setPlan] = useState<"FULL" | "MONTHLY">("FULL");
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<PaymentOptions>(
          `/api/courses/catalogue/${courseId}/payment-options`,
        );
        if (cancelled) return;
        setData(res);
        if (res.fullPrice == null && res.monthlyPrice != null) {
          setPlan("MONTHLY");
        }
      } catch (err: unknown) {
        if (!cancelled) toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = utr.trim().toUpperCase();
    if (!/^([0-9]{12}|[A-Z0-9]{12,22})$/.test(normalized)) {
      toast.error("Enter a valid 12-digit UTR / UPI reference number");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/courses/catalogue/${courseId}/manual-order`, {
        plan,
        transactionId: normalized,
      });
      setSubmitted(true);
      toast.success("Payment submitted for review!");
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 401) {
        setNeedsLogin(true);
        toast.error("Please log in to submit a UPI payment");
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (needsLogin) {
    return (
      <div className="space-y-3 rounded-xl border border-[#175cdd]/25 bg-[#175cdd]/5 p-5 text-center">
        <h4 className="text-sm font-bold text-slate-900">Log in required</h4>
        <p className="text-[11px] leading-relaxed text-slate-600">
          UPI payments with transaction-ID verification are available for
          logged-in students. Please log in to continue.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-xl bg-[#175cdd] py-2.5 text-xs font-bold text-white hover:bg-[#134cb5]"
        >
          Log In to Continue
        </Link>
      </div>
    );
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-xs font-semibold text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#175cdd] border-t-transparent" />
        Loading UPI payment options...
      </div>
    );
  }

  if (!data?.upi || !data.upi.isManualEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-center">
        <p className="text-xs font-bold text-amber-900">UPI payments paused</p>
        <p className="mt-0.5 text-[11px] text-amber-800">
          Manual UPI payment is not available right now. Please pay via
          Razorpay or try again later.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          <IconClock size={20} />
        </span>
        <h4 className="text-sm font-bold text-emerald-950">
          Payment submitted for review
        </h4>
        <p className="text-[11px] leading-relaxed text-emerald-800">
          Your {plan === "FULL" ? "full-fee" : "monthly"} payment for{" "}
          <strong>{courseName}</strong> is pending admin approval. You will
          receive an email with your invoice and course access once approved.
        </p>
        <p className="font-mono text-[11px] text-emerald-700">
          Ref: {utr.trim().toUpperCase()}
        </p>
      </div>
    );
  }

  const plans: Array<{ key: "FULL" | "MONTHLY"; amount: number | null }> = (
    [
      { key: "FULL", amount: data.fullPrice },
      { key: "MONTHLY", amount: data.monthlyPrice },
    ] as Array<{ key: "FULL" | "MONTHLY"; amount: number | null }>
  ).filter((p) => p.amount != null);
  const activeAmount = plan === "FULL" ? data.fullPrice : data.monthlyPrice;
  const upiIntent = data.options?.[plan]?.upiIntent ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plan choice */}
      <div className="grid grid-cols-2 gap-2.5">
        {plans.map((p) => {
          const isSelected = plan === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPlan(p.key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-[#175cdd] bg-[#175cdd]/5 shadow-sm ring-2 ring-[#175cdd]/15"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-[#175cdd]" : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#175cdd]" />
                  )}
                </span>
                {p.key === "FULL" ? "Full fees" : "Monthly"}
              </span>
              <span className="mt-1 block text-lg font-black text-slate-900">
                {formatInr(p.amount ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {p.key === "FULL" ? "One-time payment" : "Per month"}
              </span>
            </button>
          );
        })}
      </div>

      {/* QR */}
      {upiIntent && activeAmount != null ? (
        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <IconQrcode size={14} className="text-[#175cdd]" />
            Scan to pay {formatInr(activeAmount)}
          </div>
          <div className="flex justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <QRCode value={upiIntent} size={160} />
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
              <span className="font-mono font-semibold text-slate-800">
                {data.upi.upiId}
              </span>
              <button
                type="button"
                onClick={() => copyText(data.upi?.upiId ?? "", "upi")}
                className="flex items-center gap-1 font-semibold text-[#175cdd] hover:underline"
              >
                <IconCopy size={12} />
                {copied === "upi" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
              <span className="font-bold text-slate-800">
                {formatInr(activeAmount)}{" "}
                <span className="font-medium text-slate-500">
                  to {data.upi.payeeName}
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  copyText(String(Math.round(activeAmount / 100)), "amt")
                }
                className="flex items-center gap-1 font-semibold text-[#175cdd] hover:underline"
              >
                <IconCopy size={12} />
                {copied === "amt" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <ol className="list-decimal space-y-0.5 pl-5 text-[11px] leading-relaxed text-slate-600">
            <li>Pay the exact amount via any UPI app (GPay / PhonePe / Paytm).</li>
            <li>Copy the 12-digit UTR / UPI reference number from the app.</li>
            <li>Paste it below and submit for verification.</li>
          </ol>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center text-[11px] text-amber-800">
          This plan is not available for UPI payment right now.
        </div>
      )}

      {/* UTR input */}
      <div>
        <label className="mb-1 block text-xs font-bold text-slate-700">
          Transaction / UTR ID <span className="text-[#f59e0b]">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={22}
          value={utr}
          onChange={(e) =>
            setUtr(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 22),
            )
          }
          placeholder="e.g. 123456789012"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 font-mono text-sm tracking-wider text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#175cdd] focus:bg-white focus:ring-2 focus:ring-[#175cdd]/15"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          Find this in your UPI app payment history (UTR / UPI Ref No.).
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || !upiIntent}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#175cdd] to-[#134cb5] py-3 text-sm font-bold text-white shadow-lg shadow-[#175cdd]/25 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <IconCheck size={16} stroke={2.5} />
            <span>Submit Payment for Review</span>
          </>
        )}
      </button>
    </form>
  );
}
