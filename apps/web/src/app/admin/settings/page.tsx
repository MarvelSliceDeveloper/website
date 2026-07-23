"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
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
  IconCheck,
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
    description: "When a course enrollment is approved",
    icon: <IconCircleCheck size={18} />,
  },
  ENROLLMENT_REJECTED: {
    label: "Enrollment Rejected",
    description: "When a course enrollment is rejected",
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

type SettingsSection = "profile" | "notifications" | "appearance";

export default function AdminSettingsPage() {
  usePageTitle("Settings");
  const router = useRouter();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("ADMIN");
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

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

  useEffect(() => {
    api
      .get<{ user: { name: string; email: string; role: string } }>(
        "/api/auth/me",
      )
      .then((res) => {
        if (res?.user) {
          setProfileName(res.user.name || "User");
          setProfileEmail(res.user.email || "");
          setProfileRole(res.user.role || "ADMIN");
          setNameInput(res.user.name || "");
        }
      })
      .catch(() => {});
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

  async function handleSaveName() {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setSavingName(true);
    try {
      await api.patch("/api/auth/me/profile", { name: nameInput.trim() });
      setProfileName(nameInput.trim());
      toast.success("Profile name updated");
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update name",
      );
    } finally {
      setSavingName(false);
    }
  }

  const hasPrefs = Object.keys(preferences).length > 0;
  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const totalCount = NOTIFICATION_TYPES.length;

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
      description: "Your account details",
    },
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
  ];

  const quickLinks = [
    { label: "Inbox", icon: <IconInbox size={16} />, href: "/admin/inbox" },
    {
      label: "Support",
      icon: <IconHelp size={16} />,
      href: "/admin/inbox/support",
    },
  ];

  function roleLabel(role: string) {
    if (role === "SUPER_ADMIN") return "Super Admin";
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  function renderProfile() {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconUser size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Profile</p>
            <p className="text-sm text-muted-foreground">
              Your account information.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <p className="text-sm font-medium text-foreground">Display Name</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Your name"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName || nameInput.trim() === profileName}
                className="btn-primary flex items-center gap-2 px-4 py-2.5 disabled:opacity-50"
              >
                <IconCheck size={16} />
                <span>{savingName ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Account Details
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconMail size={16} className="shrink-0 text-muted" />
                <span>{profileEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconShield size={16} className="shrink-0 text-muted" />
                <span className="capitalize">{profileRole.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Profile card */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shrink-0">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {profileName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profileEmail || "—"}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <IconUser size={14} className="shrink-0" />
                <span>{profileName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <IconMail size={14} className="shrink-0" />
                <span className="truncate">{profileEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <IconShield size={14} className="shrink-0" />
                <span>{roleLabel(profileRole)}</span>
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
          {activeSection === "appearance" && renderAppearance()}
        </div>
      </div>
    </div>
  );
}
