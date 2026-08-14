"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  IconPlus,
  IconTrash,
  IconRefresh,
  IconX,
  IconToggleLeft,
  IconToggleRight,
  IconCopy,
  IconSparkles,
  IconTicket,
} from "@tabler/icons-react";

type Coupon = {
  id: string;
  code: string;
  title: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "LMS-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function AdminCouponsPage() {
  usePageTitle("Coupons");
  const confirmDelete = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<
    "PERCENTAGE" | "FIXED"
  >("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formMinOrderAmount, setFormMinOrderAmount] = useState("");
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const couponsQuery = useApiQuery<Coupon[]>(
    ["admin", "coupons"],
    "/api/coupons",
  );
  const coupons = couponsQuery.data ?? [];
  const loading = couponsQuery.isPending;

  function resetForm() {
    setShowForm(false);
    setFormTitle("");
    setFormCode("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("");
    setFormUsageLimit("");
    setFormMinOrderAmount("");
    setFormMaxDiscountAmount("");
    setFormExpiresAt("");
  }

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      code?: string;
      discountType: "PERCENTAGE" | "FIXED";
      discountValue: number;
      usageLimit: number | null;
      minOrderAmount: number;
      maxDiscountAmount: number | null;
      expiresAt: string | null;
    }) => api.post("/api/coupons", payload),
    onSuccess: () => {
      toast.success("Coupon created successfully!");
      resetForm();
      void couponsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleCreate() {
    if (!formTitle.trim()) {
      toast.error("Coupon title is required");
      return;
    }
    if (!formDiscountValue || Number(formDiscountValue) <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (formDiscountType === "PERCENTAGE" && Number(formDiscountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    createMutation.mutate({
      title: formTitle.trim(),
      code: formCode.trim() || undefined,
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
      minOrderAmount: formMinOrderAmount ? Number(formMinOrderAmount) : 0,
      maxDiscountAmount: formMaxDiscountAmount
        ? Number(formMaxDiscountAmount)
        : null,
      expiresAt: formExpiresAt || null,
    });
  }

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/coupons/${id}/toggle`),
    onSuccess: () => void couponsQuery.refetch(),
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleToggle = (id: string) => toggleMutation.mutate(id);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      void couponsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  async function handleDelete(id: string, code: string) {
    if (
      !(await confirmDelete({
        title: "Delete Coupon",
        message: `Delete coupon "${code}"? This cannot be undone.`,
      }))
    )
      return;
    deleteMutation.mutate(id);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard`);
  }

  function formatDiscount(coupon: Coupon): string {
    if (coupon.discountType === "PERCENTAGE") {
      return `${coupon.discountValue}% OFF`;
    }
    return `₹${coupon.discountValue} OFF`;
  }

  function getCouponStatus(coupon: Coupon): {
    label: string;
    className: string;
  } {
    if (!coupon.isActive) {
      return {
        label: "Disabled",
        className: "bg-muted/15 text-muted-foreground border-muted/25",
      };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return {
        label: "Expired",
        className: "bg-danger/15 text-danger border-danger/25",
      };
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        label: "Exhausted",
        className: "bg-amber-500/15 text-amber-600 border-amber-500/25",
      };
    }
    return {
      label: "Active",
      className: "bg-success/15 text-success border-success/25",
    };
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount coupon codes for packages."
        breadcrumbs={[{ label: "Coupons", href: "/admin/coupons" }]}
        role="Super Administration"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void couponsQuery.refetch()}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> Add Coupon
            </button>
          </div>
        }
      />

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              Add Coupon
            </h3>
            <button
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Coupon Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Sale 2026"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Coupon Code{" "}
                <span className="text-muted-foreground font-normal">
                  (leave blank to auto-generate)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SUMMER50"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="input text-xs flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setFormCode(generateRandomCode())}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  title="Generate random code"
                >
                  <IconSparkles size={14} /> Generate
                </button>
              </div>
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Discount Type <span className="text-danger">*</span>
              </label>
              <select
                value={formDiscountType}
                onChange={(e) =>
                  setFormDiscountType(e.target.value as "PERCENTAGE" | "FIXED")
                }
                className="input text-xs w-full"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
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
                    formDiscountType === "PERCENTAGE"
                      ? "e.g. 20 (for 20%)"
                      : "e.g. 500 (for ₹500)"
                  }
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  className="input text-xs w-full pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {formDiscountType === "PERCENTAGE" ? "%" : "₹"}
                </span>
              </div>
            </div>

            {/* Usage Limit */}
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
                placeholder="e.g. 100"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            {/* Min Order Amount */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Min Order Amount (₹){" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={formMinOrderAmount}
                onChange={(e) => setFormMinOrderAmount(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            {/* Max Discount Amount (for percentage) */}
            {formDiscountType === "PERCENTAGE" && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Max Discount Cap (₹){" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 2000"
                  value={formMaxDiscountAmount}
                  onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
            )}

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Expiry Date{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="input text-xs w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !formTitle.trim() || !formDiscountValue}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {createMutation.isPending ? "Adding..." : "Add Coupon"}
            </button>
            <button onClick={resetForm} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <IconTicket
              size={40}
              className="mx-auto mb-3 text-muted-foreground/40"
            />
            <p>No coupons found. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Code</th>
                  <th className="py-2.5 pr-3">Title</th>
                  <th className="py-2.5 pr-3">Discount</th>
                  <th className="py-2.5 pr-3 text-center">Usage</th>
                  <th className="py-2.5 pr-3">Expiry</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1 rounded hover:bg-muted/15 text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy code"
                          >
                            <IconCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-medium text-foreground max-w-[180px] truncate">
                        {coupon.title}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-semibold text-foreground">
                          {formatDiscount(coupon)}
                        </span>
                        {coupon.discountType === "PERCENTAGE" &&
                          coupon.maxDiscountAmount && (
                            <span className="block text-[10px] text-muted-foreground">
                              Max ₹
                              {(coupon.maxDiscountAmount / 100).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className="font-medium text-foreground">
                          {coupon.usedCount}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {coupon.usageLimit ?? "∞"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "No expiry"}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(coupon.id)}
                            className={`p-1.5 rounded-md transition-colors ${
                              coupon.isActive
                                ? "hover:bg-amber-500/10 text-success hover:text-amber-600"
                                : "hover:bg-success/10 text-muted-foreground hover:text-success"
                            }`}
                            title={
                              coupon.isActive
                                ? "Disable coupon"
                                : "Enable coupon"
                            }
                          >
                            {coupon.isActive ? (
                              <IconToggleRight size={18} />
                            ) : (
                              <IconToggleLeft size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                            title="Delete"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
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
