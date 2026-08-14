"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import StudentPortalShell from "@/components/StudentPortalShell";
import {
  IconBell,
  IconCalendarEvent,
  IconCalendarX,
  IconVideo,
  IconCircleCheck,
  IconCircleX,
  IconFileCheck,
  IconTicket,
  IconMessage,
  IconRefresh,
  IconUser,
  IconMail,
  IconShield,
  IconHelp,
  IconInbox,
  IconChevronRight,
  IconEdit,
  IconCreditCard,
  IconPhone,
  IconClockHour4,
  IconMapPin,
  IconBuildingSkyscraper,
  IconFlag,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { getTimezoneLabel } from "@/lib/location-data";

const NOTIFICATION_TYPES = [
  "SESSION_SCHEDULED",
  "SESSION_CANCELLED",
  "RECORDING_AVAILABLE",
  "ENROLLMENT_APPROVED",
  "ENROLLMENT_REJECTED",
  "ASSIGNMENT_GRADED",
  "SUPPORT_TICKET_CREATED",
  "SUPPORT_TICKET_RESPONDED",
  "SUPPORT_TICKET_STATUS_CHANGED",
];

const TYPE_CONFIG: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  SESSION_SCHEDULED: {
    label: "Session Scheduled",
    description: "When a mentorship session is booked",
    icon: <IconCalendarEvent size={18} />,
  },
  SESSION_CANCELLED: {
    label: "Session Cancelled",
    description: "When a session is cancelled",
    icon: <IconCalendarX size={18} />,
  },
  RECORDING_AVAILABLE: {
    label: "Recording Available",
    description: "When a session recording is posted",
    icon: <IconVideo size={18} />,
  },
  ENROLLMENT_APPROVED: {
    label: "Enrollment Approved",
    description: "When your course enrollment is approved",
    icon: <IconCircleCheck size={18} />,
  },
  ENROLLMENT_REJECTED: {
    label: "Enrollment Rejected",
    description: "When your course enrollment is rejected",
    icon: <IconCircleX size={18} />,
  },
  ASSIGNMENT_GRADED: {
    label: "Assignment Graded",
    description: "When an assignment receives a grade",
    icon: <IconFileCheck size={18} />,
  },
  SUPPORT_TICKET_CREATED: {
    label: "Support Ticket Created",
    description: "When a support ticket is opened",
    icon: <IconTicket size={18} />,
  },
  SUPPORT_TICKET_RESPONDED: {
    label: "Support Ticket Reply",
    description: "When admin replies to your ticket",
    icon: <IconMessage size={18} />,
  },
  SUPPORT_TICKET_STATUS_CHANGED: {
    label: "Support Ticket Status Change",
    description: "When your ticket status changes",
    icon: <IconRefresh size={18} />,
  },
};

type SettingsSection = "profile" | "notifications" | "payments";

export default function SettingsPage() {
  usePageTitle("Settings");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

  // Shared cached queries — /api/auth/me and /api/student/profile use the same
  // keys as the student portal, so navigating here reads from cache instantly.
  const meQuery = useApiQuery<{
    user: { name: string; email: string; role: string };
  }>(["auth", "me"], "/api/auth/me");
  const profileQuery = useApiQuery<{
    user: {
      phone?: string;
      timezone?: string;
      address?: string;
      state?: string;
      country?: string;
    };
  }>(["student", "profile"], "/api/student/profile");
  const paymentsQuery = useApiQuery<{
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      method: string | null;
      razorpayPaymentId: string | null;
      createdAt: string;
      package: { name: string } | null;
    }>;
  }>(["student", "payments"], "/api/student/payments");
  const preferencesQuery = useApiQuery<{
    preferences: { type: string; enabled: boolean }[];
  }>(["student", "notification-preferences"], "/api/notifications/preferences");

  const studentName = meQuery.data?.user?.name || "Student";
  const studentEmail = meQuery.data?.user?.email || "";
  const studentRole = meQuery.data?.user?.role || "STUDENT";

  const studentPhone = profileQuery.data?.user?.phone ?? "";
  const studentTimezone = profileQuery.data?.user?.timezone ?? "";
  const studentAddress = profileQuery.data?.user?.address ?? "";
  const studentState = profileQuery.data?.user?.state ?? "";
  const studentCountry = profileQuery.data?.user?.country ?? "";
  const profileLoading = profileQuery.isPending;

  const payments = paymentsQuery.data?.payments ?? [];
  const paymentsLoading = paymentsQuery.isPending;

  // Notification preferences as a type → enabled map.
  const preferences = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of preferencesQuery.data?.preferences ?? []) {
      map[p.type] = p.enabled;
    }
    return map;
  }, [preferencesQuery.data]);
  const loading = preferencesQuery.isPending;

  const toggleMutation = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      await api.patch("/api/notifications/preferences", { type, enabled });
      return { type, enabled };
    },
    onMutate: ({ type, enabled }) => {
      const label = TYPE_CONFIG[type]?.label || type;
      toast.loading(`${label}: ${enabled ? "enabling" : "disabling"}...`);
    },
    onSuccess: (_, { type, enabled }) => {
      const label = TYPE_CONFIG[type]?.label || type;
      toast.success(`${label} ${enabled ? "enabled" : "disabled"}`);
      // Reflect the new value in the cached preferences so the switch updates.
      queryClient.setQueryData<
        { preferences: { type: string; enabled: boolean }[] }
      >(["student", "notification-preferences"], (old) => {
        const prefs = old?.preferences ?? [];
        const existing = prefs.find((p) => p.type === type);
        return {
          preferences: existing
            ? prefs.map((p) => (p.type === type ? { ...p, enabled } : p))
            : [...prefs, { type, enabled }],
        };
      });
    },
    onError: () => {
      toast.error("Failed to update preference");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["student", "notification-preferences"],
      });
    },
  });

  function toggle(type: string) {
    const newVal = !(preferences[type] ?? true);
    toggleMutation.mutate({ type, enabled: newVal });
  }

  const hasPrefs = Object.keys(preferences).length > 0;
  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = NOTIFICATION_TYPES.length;

  // ── Sidebar sections ───────────────────────────────────────────────

  const sidebarSections: {
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: "profile",
      label: "Profile",
      icon: <IconUser size={18} />,
      description: "Your contact details",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <IconBell size={18} />,
      description: "Manage alert preferences",
    },
    {
      id: "payments",
      label: "Payment History",
      icon: <IconCreditCard size={18} />,
      description: "View your transactions",
    },
  ];

  const quickLinks = [
    {
      label: "Support",
      icon: <IconHelp size={16} />,
      href: "/student/support",
    },
    { label: "Inbox", icon: <IconInbox size={16} />, href: "/student/inbox" },
  ];

  // ── Profile panel ──────────────────────────────────────────────────

  function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="shrink-0 text-muted">{icon}</span>
        <span className="text-muted-foreground min-w-[100px]">{label}</span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
    );
  }

  function renderProfile() {
    if (profileLoading) {
      return (
        <div className="animate-pulse space-y-3 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-card-hover/60" />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconUser size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Profile</p>
            <p className="text-sm text-muted-foreground">
              Your account and contact information.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Account Details */}
          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-medium text-foreground border-b border-border/50 pb-2">
              Account Details
            </p>
            <InfoRow icon={<IconUser size={15} />} label="Name" value={studentName} />
            <InfoRow icon={<IconMail size={15} />} label="Email" value={studentEmail} />
            <InfoRow icon={<IconShield size={15} />} label="Role" value={studentRole.toLowerCase()} />
          </div>

          {/* Contact Info */}
          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-medium text-foreground border-b border-border/50 pb-2">
              Contact Information
            </p>
            <InfoRow icon={<IconPhone size={15} />} label="Phone" value={studentPhone} />
            <InfoRow icon={<IconClockHour4 size={15} />} label="Time Zone" value={studentTimezone ? getTimezoneLabel(studentTimezone) : null} />
            <InfoRow icon={<IconMapPin size={15} />} label="Address" value={studentAddress} />
            <InfoRow icon={<IconBuildingSkyscraper size={15} />} label="State" value={studentState} />
            <InfoRow icon={<IconFlag size={15} />} label="Country" value={studentCountry} />
            {!studentPhone && !studentTimezone && !studentAddress && !studentState && !studentCountry && (
              <p className="text-xs text-muted-foreground italic">No contact details added yet.</p>
            )}
          </div>

          {/* Payment History Summary */}
          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-medium text-foreground border-b border-border/50 pb-2">
              Invoices & Payments
            </p>
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card-hover/40 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.package?.name ?? "Package"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {p.currency === "INR" ? "₹" : p.currency} {(p.amount / 100).toLocaleString("en-IN")}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        p.status === "PAID" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveSection("payments")}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              View all payments →
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Notification preferences panel ─────────────────────────────────

  function renderNotifications() {
    if (loading) {
      return (
        <div className="animate-pulse space-y-3 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-card-hover/60" />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconBell size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Notification Preferences
            </p>
            <p className="text-sm text-muted-foreground">
              Choose which notifications you want to receive.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {hasPrefs ? enabledCount : totalCount} / {totalCount} active
            </span>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {NOTIFICATION_TYPES.map((type) => {
            const config = TYPE_CONFIG[type];
            const enabled = preferences[type] ?? true;
            return (
              <div
                key={type}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-card-hover/50"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors ${
                      enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium transition-colors ${enabled ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggle(type)}
                  disabled={
                    toggleMutation.isPending &&
                    toggleMutation.variables?.type === type
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    enabled ? "bg-primary" : "bg-border"
                  } ${
                    toggleMutation.isPending &&
                    toggleMutation.variables?.type === type
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {!hasPrefs && (
          <div className="px-6 py-5 text-center text-sm text-muted border-t border-border/60">
            Default preferences are active. Toggle any switch to customize.
          </div>
        )}
      </>
    );
  }

  // ── Appearance panel ───────────────────────────────────────────────

  // ── Payment history panel ──────────────────────────────────────────

  function renderPayments() {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconCreditCard size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Payment History</p>
            <p className="text-sm text-muted-foreground">
              View all your past transactions and receipts.
            </p>
          </div>
        </div>

        <div className="p-6">
          {paymentsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-card-hover/60" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <IconCreditCard
                size={36}
                className="mx-auto text-muted-foreground/40 mb-3"
              />
              <p className="text-sm text-muted-foreground">
                No payments yet. Browse the catalogue to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card-hover/40 px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconCreditCard size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.package?.name ?? "Package"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {p.razorpayPaymentId && (
                        <span className="ml-2 text-[10px] text-muted">
                          {p.razorpayPaymentId}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {p.currency === "INR" ? "₹" : p.currency}{" "}
                      {(p.amount / 100).toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        p.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : p.status === "FAILED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <p className="sp-eyebrow">Student</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>

        {/* Desktop two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Profile card */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <div className="group relative shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-hover text-xl font-bold text-white shadow-md transition-transform group-hover:scale-105">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary-hover transition-colors text-[10px]">
                    <IconEdit size={12} />
                  </button>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {studentName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {studentEmail || "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <IconUser size={14} className="shrink-0" />
                  <span>{studentName}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <IconMail size={14} className="shrink-0" />
                  <span className="truncate">{studentEmail || "—"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <IconShield size={14} className="shrink-0" />
                  <span className="capitalize">
                    {studentRole.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings sections */}
            <div className="glass-card p-2 space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3 pt-2 pb-1.5">
                Settings
              </p>
              {sidebarSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  }`}
                >
                  <span className="shrink-0">{section.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-[11px] opacity-70">
                      {section.description}
                    </p>
                  </div>
                  <IconChevronRight
                    size={14}
                    className={`shrink-0 transition-colors ${
                      activeSection === section.id
                        ? "text-primary"
                        : "text-muted/50"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Quick links */}
            <div className="glass-card p-2 space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3 pt-2 pb-1.5">
                Quick Links
              </p>
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                  <IconChevronRight
                    size={14}
                    className="ml-auto shrink-0 text-muted/50"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: active settings panel */}
          <div className="lg:col-span-8 xl:col-span-9 rounded-xl border border-border/60 bg-card overflow-hidden">
            {activeSection === "profile" && renderProfile()}
            {activeSection === "notifications" && renderNotifications()}
            {activeSection === "payments" && renderPayments()}
          </div>
        </div>
      </div>
    </StudentPortalShell>
  );
}
