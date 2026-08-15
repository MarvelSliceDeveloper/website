"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconRefresh,
  IconRotate,
  IconX,
  IconCheck,
  IconShieldCheck,
  IconUserSearch,
} from "@tabler/icons-react";

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  razorpayRefundId: string | null;
  initiatedBy: { id: string; name: string; email: string } | null;
  approvedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: string;
    amount: number;
    status: string;
    razorpayPaymentId: string | null;
    user?: { id: string; name: string; email: string; phone: string | null };
    package?: { id: string; name: string; price: number | null };
  };
}

interface LookupResult {
  payment: {
    paymentId: string;
    razorpayPaymentId: string | null;
    amount: number;
    status: string;
    refundedTotal: number;
    remaining: number;
    createdAt: string;
  };
  user: { id: string; name: string; email: string; phone: string | null };
  package: { id: string; name: string; price: number | null } | null;
}

type ApiResponse = {
  items: Refund[];
  total: number;
  page: number;
  limit: number;
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending Approval",
    classes: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  },
  APPROVED: {
    label: "Approved",
    classes: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  },
  PROCESSING: {
    label: "Processing",
    classes: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-success/15 text-success border-success/25",
  },
  FAILED: {
    label: "Failed",
    classes: "bg-danger/15 text-danger border-danger/25",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-danger/15 text-danger border-danger/25",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-muted/15 text-muted-foreground border-muted/25",
  },
};

function formatCurrency(paise: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRefundsPage() {
  usePageTitle("Refunds");
  const [showForm, setShowForm] = useState(false);

  const [formPaymentId, setFormPaymentId] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");

  const refundsQuery = useApiQuery<ApiResponse>(
    ["admin", "refunds"],
    "/api/admin/refunds",
  );
  const refunds = refundsQuery.data?.items ?? [];
  const loading = refundsQuery.isPending;

  const meQuery = useApiQuery<{ user: { role: string } }>(
    ["auth", "me"],
    "/api/auth/me",
  );
  const isSuperAdmin = meQuery.data?.user?.role === "SUPER_ADMIN";

  function resetForm() {
    setShowForm(false);
    setFormPaymentId("");
    setLookupResult(null);
    setFormAmount("");
    setFormReason("");
  }

  const lookupMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<LookupResult>("/api/admin/refunds/lookup", {
        razorpayPaymentId: id,
      }),
    onSuccess: (result) => {
      setLookupResult(result);
      if (result.payment.status !== "PAID") {
        toast.warning(
          `This payment is ${result.payment.status}. Only PAID payments can be refunded.`,
        );
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleVerify() {
    const id = formPaymentId.trim();
    if (!id) {
      toast.error("Payment ID is required");
      return;
    }
    setLookupResult(null);
    lookupMutation.mutate(id);
  }

  const createRefundMutation = useMutation({
    mutationFn: (payload: {
      razorpayPaymentId: string | null;
      amount: number;
      reason?: string;
    }) => api.post("/api/admin/refunds", payload),
    onSuccess: () => {
      toast.success(
        "Refund requested. It will be processed after superadmin approval.",
      );
      resetForm();
      void refundsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleRequestRefund() {
    if (!lookupResult) return;
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    const amountInPaise = Math.round(Number(formAmount) * 100);
    if (amountInPaise > lookupResult.payment.remaining) {
      toast.error(
        `Amount exceeds remaining balance of ${formatCurrency(lookupResult.payment.remaining)}`,
      );
      return;
    }
    createRefundMutation.mutate({
      razorpayPaymentId: lookupResult.payment.razorpayPaymentId,
      amount: amountInPaise,
      reason: formReason.trim() || undefined,
    });
  }

  const remaining = lookupResult?.payment.remaining ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Refunds"
        description="Verify a payment and request a refund. Refunds are processed only after superadmin approval."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Refunds", href: "/admin/refunds" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refundsQuery.refetch()}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            {isSuperAdmin && (
              <Link
                href="/admin/refunds/approvals"
                className="btn-secondary text-xs py-2 flex items-center gap-1.5"
              >
                <IconShieldCheck size={14} /> Approvals
              </Link>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRotate size={14} /> Issue Refund
            </button>
          </div>
        }
      />

      {/* Issue Refund Modal */}
      <FormModal
        open={showForm}
        onClose={resetForm}
        title="Issue Refund"
        size="md"
        footer={
          <>
            <button
              onClick={resetForm}
              className="btn-secondary text-sm"
              disabled={createRefundMutation.isPending || lookupMutation.isPending}
            >
              Cancel
            </button>
            {lookupResult ? (
              <button
                onClick={handleRequestRefund}
                disabled={createRefundMutation.isPending}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {createRefundMutation.isPending ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Requesting...
                  </>
                ) : (
                  "Request Refund"
                )}
              </button>
            ) : (
              <button
                onClick={handleVerify}
                disabled={lookupMutation.isPending || !formPaymentId.trim()}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {lookupMutation.isPending ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <IconUserSearch size={14} /> Verify Payment
                  </>
                )}
              </button>
            )}
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Razorpay Payment ID <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. pay_N6y0gXz9dZf1qL"
            value={formPaymentId}
            onChange={(e) => {
              setFormPaymentId(e.target.value);
              setLookupResult(null);
            }}
            disabled={lookupMutation.isPending}
            className="field text-xs w-full"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Enter the Razorpay payment ID. We&apos;ll verify the payment and
            show the payer&apos;s details before you continue.
          </p>
        </div>

        {lookupMutation.isPending && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-border border-t-primary" />
            Fetching payment details...
          </div>
        )}

        {lookupResult && (
          <div className="rounded-xl border border-border bg-card-hover/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verified Payment
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  lookupResult.payment.status === "PAID"
                    ? "bg-success/15 text-success border-success/25"
                    : "bg-warning/15 text-warning border-warning/25"
                }`}
              >
                {lookupResult.payment.status}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconUserSearch size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {lookupResult.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lookupResult.user.email}
                  {lookupResult.user.phone ? ` · ${lookupResult.user.phone}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Package: {lookupResult.package?.name ?? "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-muted-foreground">Paid Amount</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(lookupResult.payment.amount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-muted-foreground">Already Refunded</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(lookupResult.payment.refundedTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-muted-foreground">Remaining Balance</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-muted-foreground">Payment Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(lookupResult.payment.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {lookupResult && (
          <>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Amount (₹) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`e.g. ${formatCurrency(lookupResult.payment.amount)}`}
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="field text-xs w-full"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter the amount in rupees. Maximum refundable:{" "}
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Reason{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Why is this refund being issued?"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="field text-xs w-full resize-none"
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[11px] text-warning">
              <IconShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span>
                This request will be sent to the superadmin for approval. The
                Razorpay refund is executed only after approval.
              </span>
            </div>
          </>
        )}
      </FormModal>

      {/* Refunds Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          All Refunds
        </h3>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading refunds...
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No refunds found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Payer</th>
                  <th className="py-2.5 pr-3">Payment ID</th>
                  <th className="py-2.5 pr-3 text-right">Amount</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Reason</th>
                  <th className="py-2.5 pr-3">Requested By</th>
                  <th className="py-2.5 pr-3">Approved By</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {refunds.map((refund) => {
                  const cfg = statusConfig[refund.status] ?? {
                    label: refund.status,
                    classes: "bg-muted/15 text-muted-foreground border-muted/25",
                  };
                  const payer = refund.payment?.user;
                  return (
                    <tr key={refund.id} className="hover:bg-card-hover transition-colors">
                      <td className="py-3 pr-3">
                        {payer ? (
                          <div>
                            <span className="font-medium text-foreground">
                              {payer.name}
                            </span>
                            <br />
                            <span className="text-[10px] text-muted-foreground">
                              {payer.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-mono text-foreground font-medium">
                          {refund.payment?.razorpayPaymentId ?? refund.paymentId}
                        </span>
                        {refund.razorpayRefundId && (
                          <span className="block text-[10px] text-muted-foreground">
                            rzp: {refund.razorpayRefundId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(refund.amount, refund.currency)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}
                        >
                          {refund.status === "COMPLETED" && <IconCheck size={10} />}
                          {(refund.status === "CANCELLED" ||
                            refund.status === "REJECTED") && <IconX size={10} />}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground max-w-[180px]">
                        {refund.reason || "—"}
                        {refund.status === "REJECTED" && refund.rejectionReason && (
                          <span className="block text-[10px] text-danger">
                            Rejected: {refund.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {refund.initiatedBy ? (
                          <div>
                            <span className="text-foreground font-medium">
                              {refund.initiatedBy.name}
                            </span>
                            <br />
                            <span className="text-[10px] text-muted-foreground">
                              {refund.initiatedBy.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {refund.approvedBy ? (
                          <div>
                            <span className="text-foreground font-medium">
                              {refund.approvedBy.name}
                            </span>
                            <br />
                            <span className="text-[10px] text-muted-foreground">
                              {refund.approvedBy.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(refund.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
