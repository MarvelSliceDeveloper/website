"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
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
  IconPalette,
  IconEdit,
  IconCreditCard,
} from "@tabler/icons-react";

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

type SettingsSection = "notifications" | "appearance" | "payments";

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentRole, setStudentRole] = useState("STUDENT");
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("notifications");

  const [payments, setPayments] = useState<
    Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      method: string | null;
      razorpayPaymentId: string | null;
      createdAt: string;
      package: { name: string } | null;
    }>
  >([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ preferences: { type: string; enabled: boolean }[] }>(
        "/api/notifications/preferences",
      )
      .then((data) => {
        const map: Record<string, boolean> = {};
        for (const p of data.preferences || []) {
          map[p.type] = p.enabled;
        }
        setPreferences(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load user profile for shell header
  useEffect(() => {
    api
      .get<{ user: { name: string; email: string; role: string } }>(
        "/api/auth/me",
      )
      .then((res) => {
        if (res?.user) {
          setStudentName(res.user.name || "Student");
          setStudentEmail(res.user.email || "");
          setStudentRole(res.user.role || "STUDENT");
        }
      })
      .catch(() => {});
  }, []);

  // Load payment history
  useEffect(() => {
    setPaymentsLoading(true);
    api
      .get<{
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
      }>("/api/student/payments")
      .then((res) => setPayments(res.payments || []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, []);

  async function toggle(type: string) {
    const newVal = !(preferences[type] ?? true);
    setSaving(type);
    const label = TYPE_CONFIG[type]?.label || type;
    const promise = api.patch("/api/notifications/preferences", {
      type,
      enabled: newVal,
    });
    toast.promise(promise, {
      loading: `${label}: ${newVal ? "enabling" : "disabling"}...`,
      success: `${label} ${newVal ? "enabled" : "disabled"}`,
      error: "Failed to update preference",
    });
    try {
      await promise;
      setPreferences((prev) => ({ ...prev, [type]: newVal }));
    } catch {
      /* handled by toast */
    } finally {
      setSaving(null);
    }
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
      id: "notifications",
      label: "Notifications",
      icon: <IconBell size={18} />,
      description: "Manage alert preferences",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <IconPalette size={18} />,
      description: "Theme and display",
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
                  disabled={saving === type}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    enabled ? "bg-primary" : "bg-border"
                  } ${saving === type ? "opacity-50 pointer-events-none" : ""}`}
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

  function renderAppearance() {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconPalette size={20} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Appearance</p>
            <p className="text-sm text-muted-foreground">
              Customize your visual preferences.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">
            Use the moon/sun toggle in the top header bar to switch between dark
            and light modes. Your preference is saved automatically.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 rounded-lg bg-[#0b1020] border border-border/60 flex items-center justify-center">
              <span className="text-[10px] font-medium text-white/70">
                Dark
              </span>
            </div>
            <div className="h-10 w-20 rounded-lg bg-[#f4f7ff] border border-border/60 flex items-center justify-center">
              <span className="text-[10px] font-medium text-[#1a2238]">
                Light
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-violet-600 text-xl font-bold text-white shadow-md transition-transform group-hover:scale-105">
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
            {activeSection === "notifications" && renderNotifications()}
            {activeSection === "appearance" && renderAppearance()}
            {activeSection === "payments" && renderPayments()}
          </div>
        </div>
      </div>
    </StudentPortalShell>
  );
}
