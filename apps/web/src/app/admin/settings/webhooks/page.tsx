"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  IconBell,
  IconPlus,
  IconTrash,
  IconSend,
  IconRefresh,
  IconWebhook,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastFiredAt: string | null;
  createdAt: string;
};

const EVENT_OPTIONS = [
  "health.failed",
  "health.recovered",
  "backup.failed",
  "backup.completed",
];

export default function WebhooksPage() {
  usePageTitle("Alerting Webhooks");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], active: true });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirmDelete = useConfirmDialog();

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ webhooks: Webhook[] }>("/api/admin/alerting-webhooks");
      setWebhooks(res.webhooks || []);
    } catch {
      toast.error("Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error("Name, URL, and at least one event are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/admin/alerting-webhooks/${editingId}`, form);
        toast.success("Webhook updated");
      } else {
        await api.post("/api/admin/alerting-webhooks", form);
        toast.success("Webhook created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", url: "", events: [], active: true });
      fetchWebhooks();
    } catch {
      toast.error("Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (w: Webhook) => {
    setForm({ name: w.name, url: w.url, events: w.events, active: w.active });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirmDelete({
        title: "Delete Webhook",
        message: "Delete this webhook?",
      }))
    )
      return;
    try {
      await api.delete(`/api/admin/alerting-webhooks/${id}`);
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTest = async (id: string) => {
    try {
      const res = await api.post<{ statusCode: number; statusText: string }>(`/api/admin/alerting-webhooks/${id}/test`, {});
      toast.success(`Test sent — ${res.statusCode} ${res.statusText}`);
    } catch {
      toast.error("Webhook test failed");
    }
  };

  const handleToggleActive = async (w: Webhook) => {
    try {
      await api.put(`/api/admin/alerting-webhooks/${w.id}`, { active: !w.active });
      toast.success(w.active ? "Webhook disabled" : "Webhook enabled");
      fetchWebhooks();
    } catch {
      toast.error("Failed to update webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerting Webhooks</h1>
          <p className="text-foreground/60 mt-1">Configure webhook endpoints for system alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchWebhooks} className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/50 flex items-center gap-1">
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", url: "", events: [], active: true }); }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <IconPlus size={16} /> Add Webhook
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? "Edit Webhook" : "New Webhook"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                placeholder="My Webhook"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-1">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                placeholder="https://hooks.example.com/alert"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-2">Events</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.events.includes(event)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground/60 border-border hover:border-primary/50"
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-foreground/60">Loading webhooks...</p>
      ) : webhooks.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <IconWebhook size={40} className="mx-auto text-foreground/20 mb-3" />
          <p className="text-foreground/60">No webhooks configured</p>
          <p className="text-sm text-foreground/40">Add a webhook to receive system alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <div key={w.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.active ? "bg-green-500/10" : "bg-foreground/10"}`}>
                  <IconBell size={20} className={w.active ? "text-green-500" : "text-foreground/40"} />
                </div>
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-foreground/60 font-mono truncate max-w-sm">{w.url}</p>
                  <div className="flex gap-1.5 mt-1">
                    {w.events.map((e) => (
                      <span key={e} className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-medium">{e}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(w)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    w.active ? "bg-green-500/10 text-green-500" : "bg-foreground/10 text-foreground/40"
                  }`}
                >
                  {w.active ? "Active" : "Disabled"}
                </button>
                <button onClick={() => handleTest(w.id)} className="text-sm px-2 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1">
                  <IconSend size={14} /> Test
                </button>
                <button onClick={() => handleEdit(w)} className="text-sm px-2 py-1.5 rounded-lg border border-border hover:bg-muted/50">
                  Edit
                </button>
                <button onClick={() => handleDelete(w.id)} className="text-sm px-2 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-foreground/40">
        <p>Available events: {EVENT_OPTIONS.join(", ")}</p>
        <p>Webhooks receive POST requests with JSON payload containing event type and timestamp.</p>
      </div>
    </div>
  );
}
