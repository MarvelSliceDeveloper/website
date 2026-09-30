"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconRefresh,
  IconCheck,
  IconX,
  IconShieldCheck,
} from "@tabler/icons-react";

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  metadata?: {
    manualRefund?: boolean;
    refundTransactionId?: string;
  } | null;
  initiatedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  payment?: {
    id: string;
    amount: number;
    status: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    user?: { id: string; name: string; email: string; phone: string | null };
    package?: { id: string; name: string; price: number | null };
  };
}

function isManualRefund(refund: Refund): boolean {
  return refund.payment?.razorpayOrderId?.startsWith("MANUAL_") ?? false;
}

type ApiResponse = {
  items: Refund[];
  total: number;
  page: number;
  limit: number;
};

type Tab = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

const TABS: { key: Tab; label: string }[] = [
  { key: "PENDING", label: "Pending Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "COMPLETED", label: "Completed" },
];

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

export default function RefundApprovalsPage() {
  usePageTitle("Refund Approvals");
  const [tab, setTab] = useState<Tab>("PENDING");

  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [refundUtr, setRefundUtr] = useState("");
  const [refundUtrError, setRefundUtrError] = useState("");

  const refundsQuery = useApiQuery<ApiResponse>(
    ["admin", "refunds", "approvals", tab],
    "/api/admin/refunds",
    { status: tab, limit: "100" },
  );
  const refunds = refundsQuery.data?.items ?? [];
  const loading = refundsQuery.isPending;

  const approveRefund = refunds.find((r) => r.id === approveId) ?? null;
  const approveIsManual = approveRefund ? isManualRefund(approveRefund) : false;

  const approveMutation = useMutation({
    mutationFn: ({ id, utr }: { id: string; utr?: string }) =>
      api.post(
        `/api/admin/refunds/${id}/approve`,
        utr ? { refundTransactionId: utr } : {},
      ),
    onSuccess: (_, variables) => {
      toast.success(
        variables.utr
          ? "Manual refund recorded with UTR"
          : "Refund approved and processed via Razorpay",
      );
      setApproveId(null);
      setRefundUtr("");
      setRefundUtrError("");
      void refundsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function closeApprove() {
    setApproveId(null);
    setRefundUtr("");
    setRefundUtrError("");
  }

  function handleApprove() {
    if (!approveId) return;
    if (approveIsManual) {
      const normalized = refundUtr.trim().toUpperCase();
      if (!/^([0-9]{12}|[A-Z0-9]{12,22})$/.test(normalized)) {
        setRefundUtrError(
          "Enter the 12-digit UTR of the refund you made via UPI",
        );
        return;
      }
      approveMutation.mutate({ id: approveId, utr: normalized });
      return;
    }
    approveMutation.mutate({ id: approveId });
  }

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/admin/refunds/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Refund request rejected");
      setRejectId(null);
      setRejectReason("");
      void refundsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleReject() {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({ id: rejectId, reason: rejectReason.trim() });
  }

  const processing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Refund Approvals"
        description="Review and approve refund requests. Razorpay refunds execute via API; manual UPI refunds are recorded with the refund UTR."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Refunds", href: "/admin/refunds" },
          { label: "Approvals", href: "/admin/refunds/approvals" },
        ]}
        role="Super Admin"
        action={
          <button
            onClick={() => void refundsQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              tab === t.key
                ? "bg-primary/10 text-primary border-primary/20"
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted animate-pulse">
          Loading refund requests...
        </div>
      ) : refunds.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No {tab.toLowerCase()} refunds found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {refunds.map((refund) => {
            const payer = refund.payment?.user;
            return (
              <div
                key={refund.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {payer?.name ?? "Unknown payer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payer?.email ?? "—"}
                      {payer?.phone ? ` · ${payer.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Package: {refund.payment?.package?.name ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                    {formatCurrency(refund.amount, refund.currency)}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-card-hover/40 p-3 text-xs space-y-1">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Payment:{" "}
                    </span>
                    <span className="font-mono">
                      {refund.payment?.razorpayPaymentId ?? refund.paymentId}
                    </span>
                    {isManualRefund(refund) && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        UPI
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Reason:{" "}
                    </span>
                    {refund.reason || "—"}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Requested by:{" "}
                    </span>
                    {refund.initiatedBy?.name ?? "System"} ·{" "}
                    {formatDate(refund.createdAt)}
                  </p>
                </div>

                {tab === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setApproveId(refund.id)}
                      disabled={processing}
                      className="btn-primary text-xs py-2 flex items-center gap-1.5"
                    >
                      <IconCheck size={14} /> Approve &amp; Refund
                    </button>
                    <button
                      onClick={() => {
                        setRejectId(refund.id);
                        setRejectReason("");
                      }}
                      disabled={processing}
                      className="btn-danger text-xs py-2 flex items-center gap-1.5"
                    >
                      <IconX size={14} /> Reject
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {refund.status === "REJECTED" && refund.rejectionReason
                      ? `Rejected: ${refund.rejectionReason}`
                      : refund.status}
                    {refund.metadata?.refundTransactionId && (
                      <span className="block font-mono">
                        refund utr: {refund.metadata.refundTransactionId}
                      </span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve confirm modal — manual UPI refunds collect the refund UTR */}
      {approveIsManual ? (
        <FormModal
          open={!!approveId}
          onClose={closeApprove}
          title="Record manual refund"
          size="sm"
          footer={
            <>
              <button
                onClick={closeApprove}
                className="btn-cancel text-sm"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    Recording...
                  </>
                ) : (
                  "Record & Complete"
                )}
              </button>
            </>
          }
        >
          <p className="text-xs text-muted-foreground">
            Refund{" "}
            {approveRefund
              ? formatCurrency(approveRefund.amount, approveRefund.currency)
              : ""}{" "}
            from the company UPI app first, then enter its UTR below to complete
            this refund.
          </p>
          <div className="mt-3">
            <label className="block text-xs font-medium text-foreground mb-1">
              Refund UTR <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={refundUtr}
              maxLength={22}
              onChange={(e) => {
                setRefundUtr(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 22),
                );
                if (refundUtrError) setRefundUtrError("");
              }}
              placeholder="e.g. 123456789012"
              className="field text-xs w-full font-mono tracking-wider"
            />
            {refundUtrError ? (
              <p className="mt-1 text-xs text-danger">{refundUtrError}</p>
            ) : (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Find this in your UPI app payment history.
              </p>
            )}
          </div>
        </FormModal>
      ) : (
        <ConfirmModal
          open={!!approveId}
          onClose={closeApprove}
          onConfirm={handleApprove}
          title="Approve refund?"
          description="Approving executes the refund against Razorpay immediately. This cannot be undone."
          confirmLabel={processing ? "Processing..." : "Approve & Refund"}
          confirmLoading={processing}
          variant="primary"
          icon={IconShieldCheck}
        />
      )}

      {/* Reject modal with reason */}
      <FormModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Reject refund request"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setRejectId(null)}
              className="btn-cancel text-sm"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="btn-danger text-sm flex items-center gap-1.5"
            >
              {processing ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Rejection reason <span className="text-danger">*</span>
          </label>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Invalid payment, duplicate request, policy violation"
            className="field text-xs w-full resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            The requesting admin will see this reason on the refund record.
          </p>
        </div>
      </FormModal>
    </div>
  );
}
