"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconUserShare,
  IconRefresh,
  IconX,
  IconCheck,
  IconCopy,
  IconSend,
  IconTicket,
} from "@tabler/icons-react";

type ReferralStatus = "PENDING" | "APPROVED" | "REJECTED" | "COUPON_SENT";

type Referral = {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string | null;
  status: ReferralStatus;
  couponId: string | null;
  couponCode: string | null;
  adminNote: string | null;
  createdAt: string;
  referrer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
};

const STATUS_TABS: { key: ReferralStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "COUPON_SENT", label: "Coupon Sent" },
];

const STATUS_BADGE: Record<ReferralStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  APPROVED: "bg-success/15 text-success border-success/25",
  REJECTED: "bg-danger/15 text-danger border-danger/25",
  COUPON_SENT: "bg-primary/15 text-primary border-primary/25",
};

export default function AdminReferralsPage() {
  usePageTitle("Referrals");
  const [activeTab, setActiveTab] = useState<ReferralStatus | "ALL">("ALL");
  const [sendCouponFor, setSendCouponFor] = useState<Referral | null>(null);

  // Send-coupon form fields
  const [couponDiscountType, setCouponDiscountType] = useState<
    "PERCENTAGE" | "FIXED"
  >("PERCENTAGE");
  const [couponDiscountValue, setCouponDiscountValue] = useState("");
  const [couponUsageLimit, setCouponUsageLimit] = useState("1");
  const [couponExpiresAt, setCouponExpiresAt] = useState("");
  const [couponNote, setCouponNote] = useState("");

  const referralsQuery = useApiQuery<Referral[]>(
    ["admin", "referrals"],
    "/api/referrals",
  );
  const referrals = referralsQuery.data ?? [];
  const loading = referralsQuery.isPending;

  const filteredReferrals =
    activeTab === "ALL"
      ? referrals
      : referrals.filter((r) => r.status === activeTab);

  const counts = {
    ALL: referrals.length,
    PENDING: referrals.filter((r) => r.status === "PENDING").length,
    APPROVED: referrals.filter((r) => r.status === "APPROVED").length,
    REJECTED: referrals.filter((r) => r.status === "REJECTED").length,
    COUPON_SENT: referrals.filter((r) => r.status === "COUPON_SENT").length,
  };

  function resetCouponForm() {
    setSendCouponFor(null);
    setCouponDiscountType("PERCENTAGE");
    setCouponDiscountValue("");
    setCouponUsageLimit("1");
    setCouponExpiresAt("");
    setCouponNote("");
  }

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: ReferralStatus;
      adminNote?: string;
    }) => api.patch(`/api/referrals/${id}/status`, { status, adminNote }),
    onSuccess: () => {
      toast.success("Referral updated");
      void referralsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const sendCouponMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        discountType: "PERCENTAGE" | "FIXED";
        discountValue: number;
        usageLimit: number | null;
        expiresAt: string | null;
        adminNote: string | null;
      };
    }) => api.post(`/api/referrals/${id}/send-coupon`, payload),
    onSuccess: () => {
      toast.success("Coupon sent successfully!");
      resetCouponForm();
      void referralsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleSendCoupon() {
    if (!sendCouponFor) return;
    if (!couponDiscountValue || Number(couponDiscountValue) <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (
      couponDiscountType === "PERCENTAGE" &&
      Number(couponDiscountValue) > 100
    ) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    sendCouponMutation.mutate({
      id: sendCouponFor.id,
      payload: {
        discountType: couponDiscountType,
        discountValue: Number(couponDiscountValue),
        usageLimit: couponUsageLimit ? Number(couponUsageLimit) : null,
        expiresAt: couponExpiresAt || null,
        adminNote: couponNote.trim() || null,
      },
    });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard`);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Referrals"
        description="Review student referrals, approve them and send coupon codes to referred students."
        breadcrumbs={[{ label: "Referrals", href: "/admin/referrals" }]}
        role="Administration"
        action={
          <button
            onClick={() => void referralsQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-white/20"
                  : "bg-muted/15 text-muted-foreground"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Referrals Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading referrals...
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <IconUserShare
              size={40}
              className="mx-auto mb-3 text-muted-foreground/40"
            />
            <p>No referrals yet. When a student submits a referral it will appear here.</p>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No {activeTab !== "ALL" ? activeTab.toLowerCase() + " " : ""}
            referrals found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Referred By (Student)</th>
                  <th className="py-2.5 pr-3">Referred Person</th>
                  <th className="py-2.5 pr-3">Submitted</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Coupon Code</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredReferrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    {/* Referrer */}
                    <td className="py-3 pr-3">
                      <p className="font-medium text-foreground">
                        {referral.referrerName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {referral.referrerEmail}
                      </p>
                    </td>

                    {/* Referred person */}
                    <td className="py-3 pr-3">
                      <p className="font-medium text-foreground">
                        {referral.refereeName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {referral.refereeEmail}
                        {referral.refereePhone
                          ? ` · ${referral.refereePhone}`
                          : ""}
                      </p>
                    </td>

                    {/* Submitted */}
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(referral.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[referral.status]}`}
                      >
                        {referral.status === "COUPON_SENT"
                          ? "Coupon Sent"
                          : referral.status.charAt(0) +
                            referral.status.slice(1).toLowerCase()}
                      </span>
                      {referral.adminNote && (
                        <p
                          className="mt-1 text-[10px] text-muted-foreground max-w-[140px] truncate"
                          title={referral.adminNote}
                        >
                          {referral.adminNote}
                        </p>
                      )}
                    </td>

                    {/* Coupon */}
                    <td className="py-3 pr-3">
                      {referral.couponCode ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {referral.couponCode}
                          </span>
                          <button
                            onClick={() =>
                              copyCode(referral.couponCode as string)
                            }
                            className="p-1 rounded hover:bg-muted/15 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy code"
                          >
                            <IconCopy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {referral.status === "PENDING" && (
                          <>
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  id: referral.id,
                                  status: "APPROVED",
                                })
                              }
                              className="p-1.5 rounded-md hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                              title="Approve"
                            >
                              <IconCheck size={16} />
                            </button>
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  id: referral.id,
                                  status: "REJECTED",
                                })
                              }
                              className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                              title="Reject"
                            >
                              <IconX size={16} />
                            </button>
                          </>
                        )}

                        {referral.status === "REJECTED" && (
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: referral.id,
                                status: "APPROVED",
                              })
                            }
                            className="p-1.5 rounded-md hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                            title="Approve"
                          >
                            <IconCheck size={16} />
                          </button>
                        )}

                        {(referral.status === "PENDING" ||
                          referral.status === "APPROVED") && (
                          <button
                            onClick={() => {
                              setSendCouponFor(referral);
                              setCouponNote(referral.adminNote ?? "");
                            }}
                            className="btn-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                            title="Create and send a coupon code"
                          >
                            <IconSend size={12} /> Send Coupon
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Coupon Modal */}
      {sendCouponFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconTicket size={16} className="text-primary" />
                Send Coupon to {sendCouponFor.refereeName}
              </h3>
              <button
                onClick={resetCouponForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={16} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              A unique <span className="font-mono">REF-XXXXX</span> coupon code
              will be created and emailed to{" "}
              <span className="text-foreground font-medium">
                {sendCouponFor.refereeEmail}
              </span>
              . Referral status will be set to Coupon Sent.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Discount Type <span className="text-danger">*</span>
                </label>
                <select
                  value={couponDiscountType}
                  onChange={(e) =>
                    setCouponDiscountType(
                      e.target.value as "PERCENTAGE" | "FIXED",
                    )
                  }
                  className="input text-xs w-full"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Discount Value <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={
                      couponDiscountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"
                    }
                    value={couponDiscountValue}
                    onChange={(e) => setCouponDiscountValue(e.target.value)}
                    className="input text-xs w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {couponDiscountType === "PERCENTAGE" ? "%" : "₹"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Usage Limit{" "}
                  <span className="text-muted-foreground font-normal">
                    (blank = unlimited)
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={couponUsageLimit}
                  onChange={(e) => setCouponUsageLimit(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Expiry Date{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={couponExpiresAt}
                  onChange={(e) => setCouponExpiresAt(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Admin Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved after phone verification"
                value={couponNote}
                onChange={(e) => setCouponNote(e.target.value)}
                className="input text-xs w-full resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                onClick={handleSendCoupon}
                disabled={
                  sendCouponMutation.isPending || !couponDiscountValue
                }
                className="btn-primary text-xs py-2 disabled:opacity-40"
              >
                {sendCouponMutation.isPending
                  ? "Sending..."
                  : "Create & Send Coupon"}
              </button>
              <button
                onClick={resetCouponForm}
                className="btn-secondary text-xs py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
