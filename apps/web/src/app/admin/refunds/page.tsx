"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconRefresh,
  IconRotate,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  initiatedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  payment?: { id: string; amount: number; status: string; razorpayPaymentId: string | null };
}

type ApiResponse = {
  items: Refund[];
  total: number;
  page: number;
  limit: number;
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-600 border-amber-500/25",
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
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formPaymentId, setFormPaymentId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");

  async function fetchRefunds() {
    setLoading(true);
    try {
      const data = await api.get<ApiResponse>("/api/admin/refunds");
      setRefunds(data.items ?? []);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRefunds();
  }, []);

  function resetForm() {
    setShowForm(false);
    setFormPaymentId("");
    setFormAmount("");
    setFormReason("");
  }

  async function handleIssueRefund() {
    if (!formPaymentId.trim()) {
      toast.error("Payment ID is required");
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const amountInPaise = Math.round(Number(formAmount) * 100);
      await api.post("/api/admin/refunds", {
        paymentId: formPaymentId.trim(),
        amount: amountInPaise,
        reason: formReason.trim() || undefined,
      });
      toast.success("Refund issued successfully!");
      resetForm();
      fetchRefunds();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Refunds"
        description="Manage payment refunds."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Refunds", href: "/admin/refunds" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRefunds}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
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
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleIssueRefund}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Issuing...
                </>
              ) : (
                "Issue Refund"
              )}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Payment ID <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter the Razorpay payment ID"
            value={formPaymentId}
            onChange={(e) => setFormPaymentId(e.target.value)}
            className="input text-xs w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Amount (₹) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 500.00"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            className="input text-xs w-full"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Enter the amount in rupees (e.g. 500 for ₹500)
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Reason{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Why is this refund being issued?"
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            className="input text-xs w-full resize-none"
          />
        </div>
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
                  <th className="py-2.5 pr-3">Payment ID</th>
                  <th className="py-2.5 pr-3 text-right">Amount</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Reason</th>
                  <th className="py-2.5 pr-3">Initiated By</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {refunds.map((refund) => {
                  const cfg = statusConfig[refund.status] ?? {
                    label: refund.status,
                    classes: "bg-muted/15 text-muted-foreground border-muted/25",
                  };
                  return (
                    <tr
                      key={refund.id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div>
                          <span className="font-mono text-foreground font-medium">
                            {refund.payment?.razorpayPaymentId ?? refund.paymentId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(refund.amount, refund.currency)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}
                        >
                          {refund.status === "COMPLETED" && <IconCheck size={10} />}
                          {refund.status === "CANCELLED" && <IconX size={10} />}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate">
                        {refund.reason || "—"}
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
