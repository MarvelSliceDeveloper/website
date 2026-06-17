"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconArrowLeft, IconBell, IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const NOTIFICATION_TYPES = [
  "SESSION_SCHEDULED",
  "SESSION_CANCELLED",
  "RECORDING_AVAILABLE",
  "ENROLLMENT_APPROVED",
  "ENROLLMENT_REJECTED",
  "ASSIGNMENT_GRADED",
];

const TYPE_LABELS: Record<string, string> = {
  SESSION_SCHEDULED: "Session Scheduled",
  SESSION_CANCELLED: "Session Cancelled",
  RECORDING_AVAILABLE: "Recording Available",
  ENROLLMENT_APPROVED: "Enrollment Approved",
  ENROLLMENT_REJECTED: "Enrollment Rejected",
  ASSIGNMENT_GRADED: "Assignment Graded",
};

const TYPE_ICONS: Record<string, string> = {
  SESSION_SCHEDULED: "🔔",
  SESSION_CANCELLED: "❌",
  RECORDING_AVAILABLE: "📹",
  ENROLLMENT_APPROVED: "✅",
  ENROLLMENT_REJECTED: "🚫",
  ASSIGNMENT_GRADED: "📝",
};

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ preferences: { type: string; enabled: boolean }[] }>("/api/notifications/preferences")
      .then((data) => {
        const map: Record<string, boolean> = {};
        for (const p of data.preferences || []) {
          map[p.type] = p.enabled;
        }
        setPreferences(map);
      })
      .catch(() => {});
  }, []);

  async function toggle(type: string) {
    const newVal = !(preferences[type] ?? true);
    setSaving(type);
    try {
      await api.patch("/api/notifications/preferences", { type, enabled: newVal });
      setPreferences((prev) => ({ ...prev, [type]: newVal }));
    } catch { /* ignore */ }
    finally { setSaving(null); }
  }

  const hasPrefs = Object.keys(preferences).length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1"
        >
          <IconArrowLeft size={14} /> Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your notification preferences.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <IconBell size={20} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Notification Preferences</p>
            <p className="text-sm text-muted-foreground">Choose which notifications you want to receive.</p>
          </div>
        </div>

        {NOTIFICATION_TYPES.map((type) => {
          const enabled = preferences[type] ?? true;
          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:bg-card-hover"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{TYPE_ICONS[type]}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{TYPE_LABELS[type]}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggle(type)}
                disabled={saving === type}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  enabled ? "bg-primary" : "bg-border"
                } ${saving === type ? "opacity-50" : ""}`}
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

        {!hasPrefs && NOTIFICATION_TYPES.length > 0 && (
          <p className="text-sm text-muted text-center py-4">
            Default preferences are active. Toggle any switch to customize.
          </p>
        )}
      </div>
    </div>
  );
}
