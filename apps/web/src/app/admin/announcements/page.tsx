"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconBellRinging, IconSend, IconRefresh } from "@tabler/icons-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  createdAt: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("ADMIN");
  const [sending, setSending] = useState(false);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const data = await api.get<{ announcements: Announcement[] }>(
        "/api/admin/announcements",
      );
      setAnnouncements(data.announcements);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await api.post("/api/admin/announcements", {
        title: title.trim(),
        body: body.trim(),
        targetRole,
      });
      toast.success("Announcement sent");
      setTitle("");
      setBody("");
      setShowCreate(false);
      fetchAnnouncements();
    } catch {
      toast.error("Failed to send announcement");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconBellRinging size={28} className="text-primary-hover" />
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send broadcast announcements to roles.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary text-xs py-2 flex items-center gap-1.5"
        >
          <IconSend size={14} /> New Announcement
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-5 border border-primary/30 space-y-3">
          <input
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input text-xs w-full"
          />
          <textarea
            placeholder="Announcement body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input text-xs w-full min-h-[100px]"
          />
          <div className="flex items-center gap-3">
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="input text-xs"
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="STUDENT">Student</option>
            </select>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-5 border border-border/80">
        <button onClick={fetchAnnouncements}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5 mb-4">
          <IconRefresh size={14} /> Refresh
        </button>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No announcements yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="border border-border/60 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.body}</p>
                  </div>
                  <span className="text-[10px] text-muted whitespace-nowrap ml-4">
                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {a.targetRole}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
