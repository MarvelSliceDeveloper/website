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
  IconCopy,
} from "@tabler/icons-react";

interface ManualOrder {
  id: string;
  userId: string;
  courseId: string;
  plan: "MONTHLY" | "FULL";
  amount: number;
  transactionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  paymentId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
}

type ApiResponse = {
  items: ManualOrder[];
  total: number;
  page: number;
  limit: number;
};

interface PaymentSettings {
  id: string;
  upiId: string;
  payeeName: string;
  isManualEnabled: boolean;
}

type Tab = "PENDING" | "APPROVED" | "REJECTED";

const TABS: { key: Tab; label: string }[] = [
  { key: "PENDING", label: "Pending Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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

export default function ManualOrdersPage() {
  usePageTitle("Manual Orders");
  const [tab, setTab] = useState<Tab>("PENDING");

  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const ordersQuery = useApiQuery<ApiResponse>(
    ["admin", "manual-orders", tab],
    "/api/admin/manual-orders",
    { status: tab, limit: "100" },
  );
  const orders = ordersQuery.data?.items ?? [];
  const loading = ordersQuery.isPending;

  const settingsQuery = useApiQuery<{ settings: PaymentSettings | null }>(
    ["admin", "payment-settings"],
    "/api/admin/payment-settings",
  );
  const settings = settingsQuery.data?.settings ?? null;
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [settingsInit, setSettingsInit] = useState(false);
  // Adjust state during render when settings first load (React-recommended
  // pattern); guarded so refetches never clobber in-progress edits.
  if (settings && !settingsInit) {
    setSettingsInit(true);
    setUpiId(settings.upiId);
    setPayeeName(settings.payeeName);
    setEnabled(settings.isManualEnabled);
  }

  const settingsMutation = useMutation({
    mutationFn: () =>
      api.put("/api/admin/payment-settings", {
        upiId: upiId.trim(),
        payeeName: payeeName.trim(),
        isManualEnabled: enabled,
      }),
    onSuccess: () => {
      toast.success("UPI payment settings saved");
      void settingsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/manual-orders/${id}/approve`),
    onSuccess: () => {
      toast.success("Payment approved — invoice emailed to student");
      setApproveId(null);
      void ordersQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleApprove() {
    if (!approveId) return;
    approveMutation.mutate(approveId);
  }

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/api/admin/manual-orders/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Manual order rejected");
      setRejectId(null);
      setRejectReason("");
      void ordersQuery.refetch();
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

  function copyUtr(text: string) {
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Transaction ID copied"),
      () => toast.error("Copy failed"),
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Manual UPI Orders"
        description="Review UPI payments submitted with transaction IDs. Approving creates a PAID payment, enrolls the student, and emails the invoice."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Manual Orders", href: "/admin/manual-orders" },
        ]}
        role="Admin"
        action={
          <button
            onClick={() => void ordersQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* UPI settings card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Static UPI QR Settings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Single global QR shown on all course checkouts. Students scan,
            pay, then submit their transaction ID.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              UPI ID <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="marvelslice@okhdfc"
              className="field text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Payee name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="MarvelSlice LMS"
              className="field text-xs w-full"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Enable manual UPI payments on course checkout
          </label>
          <button
            onClick={() => settingsMutation.mutate()}
            disabled={settingsMutation.isPending}
            className="btn-primary text-xs py-2"
          >
            {settingsMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

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
          Loading manual orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No {tab.toLowerCase()} manual orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {order.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Course: {order.course.title}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                    {formatCurrency(order.amount)}
                  </span>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {order.plan === "FULL" ? "Full fees" : "Monthly"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card-hover/40 p-3 text-xs space-y-1">
                <p className="text-muted-foreground flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium text-foreground">
                      Transaction ID:{" "}
                    </span>
                    <span className="font-mono">{order.transactionId}</span>
                  </span>
                  <button
                    onClick={() => copyUtr(order.transactionId)}
                    className="flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
                  >
                    <IconCopy size={12} /> Copy
                  </button>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Submitted:{" "}
                  </span>
                  {formatDate(order.createdAt)}
                </p>
                {order.status === "REJECTED" && order.rejectionReason && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Rejection reason:{" "}
                    </span>
                    {order.rejectionReason}
                  </p>
                )}
                {order.status === "APPROVED" && order.reviewedAt && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Approved:{" "}
                    </span>
                    {formatDate(order.reviewedAt)}
                  </p>
                )}
              </div>

              {tab === "PENDING" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setApproveId(order.id)}
                    disabled={processing}
                    className="btn-primary text-xs py-2 flex items-center gap-1.5"
                  >
                    <IconCheck size={14} /> Approve &amp; Enroll
                  </button>
                  <button
                    onClick={() => {
                      setRejectId(order.id);
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
                  {order.status}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve confirm modal */}
      <ConfirmModal
        open={!!approveId}
        onClose={() => setApproveId(null)}
        onConfirm={handleApprove}
        title="Approve payment?"
        description="Approving creates a PAID payment, enrolls the student in the course, and emails the invoice. This cannot be undone."
        confirmLabel={processing ? "Processing..." : "Approve & Enroll"}
        confirmLoading={processing}
        variant="primary"
        icon={IconShieldCheck}
      />

      {/* Reject modal with reason */}
      <FormModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Reject manual order"
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
            placeholder="e.g. Transaction ID not found, wrong amount received"
            className="field text-xs w-full resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            The student will see this reason in their rejection email.
          </p>
        </div>
      </FormModal>
    </div>
  );
}
