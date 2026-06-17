"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
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
  IconArrowLeft,
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

const TYPE_CONFIG: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  SESSION_SCHEDULED: { label: "Session Scheduled", description: "When a mentorship session is booked", icon: <IconCalendarEvent size={18} /> },
  SESSION_CANCELLED: { label: "Session Cancelled", description: "When a session is cancelled", icon: <IconCalendarX size={18} /> },
  RECORDING_AVAILABLE: { label: "Recording Available", description: "When a session recording is posted", icon: <IconVideo size={18} /> },
  ENROLLMENT_APPROVED: { label: "Enrollment Approved", description: "When your course enrollment is approved", icon: <IconCircleCheck size={18} /> },
  ENROLLMENT_REJECTED: { label: "Enrollment Rejected", description: "When your course enrollment is rejected", icon: <IconCircleX size={18} /> },
  ASSIGNMENT_GRADED: { label: "Assignment Graded", description: "When an assignment receives a grade", icon: <IconFileCheck size={18} /> },
  SUPPORT_TICKET_CREATED: { label: "Support Ticket Created", description: "When a support ticket is opened", icon: <IconTicket size={18} /> },
  SUPPORT_TICKET_RESPONDED: { label: "Support Ticket Reply", description: "When admin replies to your ticket", icon: <IconMessage size={18} /> },
  SUPPORT_TICKET_STATUS_CHANGED: { label: "Support Ticket Status Change", description: "When your ticket status changes", icon: <IconRefresh size={18} /> },
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ preferences: { type: string; enabled: boolean }[] }>("/api/notifications/preferences")
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

  async function toggle(type: string) {
    const newVal = !(preferences[type] ?? true);
    setSaving(type);
    const label = TYPE_CONFIG[type]?.label || type;
    const promise = api.patch("/api/notifications/preferences", { type, enabled: newVal });
    toast.promise(promise, {
      loading: `${label}: ${newVal ? "enabling" : "disabling"}...`,
      success: `${label} ${newVal ? "enabled" : "disabled"}`,
      error: "Failed to update preference",
    });
    try {
      await promise;
      setPreferences((prev) => ({ ...prev, [type]: newVal }));
    } catch { /* handled by toast */ }
    finally { setSaving(null); }
  }

  const hasPrefs = Object.keys(preferences).length > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-24 rounded bg-card-hover" />
          <div className="h-7 w-48 rounded bg-card-hover" />
          <div className="h-4 w-64 rounded bg-card-hover" />
          <div className="h-80 rounded-xl bg-card-hover" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/student" className="btn-secondary text-xs inline-flex items-center gap-1.5 w-fit">
          <IconArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your notification preferences.</p>
        </div>

      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <IconBell size={20} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Notification Preferences</p>
            <p className="text-sm text-muted-foreground">Choose which notifications you want to receive.</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {NOTIFICATION_TYPES.map((type) => {
            const config = TYPE_CONFIG[type];
            const enabled = preferences[type] ?? true;
            return (
              <div
                key={type}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-card-hover"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
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
          <div className="px-6 py-5 text-center text-sm text-muted">
            Default preferences are active. Toggle any switch to customize.
          </div>
        )}
      </div>
    </div>
  );
}
