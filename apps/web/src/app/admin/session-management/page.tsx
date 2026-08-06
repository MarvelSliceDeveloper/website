"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconDeviceTablet,
  IconDesk,
  IconRefresh,
  IconTrash,
  IconShield,
} from "@tabler/icons-react";

interface AdminSession {
  id: string;
  tokenPrefix: string;
  ip: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

function SessionIcon(ua: string | null) {
  if (!ua) return <IconDeviceTablet size={18} />;
  if (/mobile|android|iphone/i.test(ua)) {
    return <IconDeviceTablet size={18} />;
  }
  return <IconDesk size={18} />;
}

function formatDevice(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Desktop";
}

function formatBrowser(ua: string | null): string {
  if (!ua) return "";
  if (/Edg/i.test(ua)) return "Edge";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  return "";
}

export default function SessionManagementPage() {
  usePageTitle("Session Management");
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState<string | null>(null);
  const [killingAll, setKillingAll] = useState(false);

  const fetchSessions = () => {
    setLoading(true);
    api
      .get<{ sessions: AdminSession[] }>("/api/admin/sessions/all")
      .then((data) => {
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch(() => {
        toast.error("Failed to fetch sessions");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleKill = async (id: string) => {
    if (!confirm("Terminate this session? The user will be logged out.")) return;
    setKilling(id);
    try {
      await api.post(`/api/admin/sessions/${id}/kill`);
      toast.success("Session terminated");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setKilling(null);
    }
  };

  const handleKillAll = async () => {
    if (
      !confirm(
        "Terminate ALL your active sessions? You will be logged out of all devices except this one.",
      )
    )
      return;
    setKillingAll(true);
    try {
      await api.post("/api/admin/sessions/kill-all");
      toast.success("All sessions terminated");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setKillingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Session Management"
        description="Monitor and terminate active admin sessions."
        breadcrumbs={[
          { label: "Super Admin", href: "/admin/super-admin" },
          { label: "Session Management", href: "/admin/session-management" },
        ]}
        action={
          <div className="flex gap-2">
            <button
              onClick={fetchSessions}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={handleKillAll}
              disabled={killingAll}
              className="btn-danger text-xs py-2 flex items-center gap-1.5"
            >
              <IconTrash size={14} /> {killingAll ? "Killing..." : "Kill All My Sessions"}
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <IconShield size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-muted-foreground">No active sessions found.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden border border-border/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                <th className="py-2.5 pr-3">User</th>
                <th className="py-2.5 pr-3">Device</th>
                <th className="py-2.5 pr-3">IP Address</th>
                <th className="py-2.5 pr-3">Last Active</th>
                <th className="py-2.5 pr-3">Created</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-card-hover transition-colors"
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                        {s.user?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {s.user?.name || "Unknown"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.user?.email || ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      {SessionIcon(s.userAgent)}
                      <span>
                        {formatDevice(s.userAgent)}
                        {formatBrowser(s.userAgent) && ` · ${formatBrowser(s.userAgent)}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {s.ip || "—"}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {new Date(s.lastActiveAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        s.active
                          ? "bg-success/15 text-success border-success/25"
                          : "bg-muted/15 text-muted-foreground border-muted/25"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleKill(s.id)}
                        disabled={killing === s.id || !s.active}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                        title="Terminate session"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
