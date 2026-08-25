"use client";

/**
 * ASSUMPTIONS ABOUT YOUR BACKEND — read before dropping this in.
 * This file assumes the API grows four things it doesn't have today:
 *
 * 1. POST   /api/admin/alerting-webhooks            -> now returns { webhook, secret }
 *            `secret` is only ever returned on the CREATE response (and on
 *            POST .../:id/rotate-secret). It is never returned by GET/PUT.
 * 2. POST   /api/admin/alerting-webhooks/:id/rotate-secret -> { secret }
 * 3. GET    /api/admin/alerting-webhooks/:id/deliveries    -> { deliveries: Delivery[] }
 *            Most recent N attempts: status code, ok/fail, latency, timestamp.
 * 4. GET    /api/admin/alerting-webhook-events              -> { events: string[] }
 *            So the event list isn't hardcoded on the frontend and can't drift
 *            from what the backend actually emits. Falls back to a local
 *            constant if the endpoint 404s, so this still works if you haven't
 *            built it yet.
 *
 * If your backend shapes differ, the only places that need to change are the
 * `api.*` calls themselves — the component logic doesn't otherwise care.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  IconBell,
  IconPlus,
  IconTrash,
  IconSend,
  IconRefresh,
  IconWebhook,
  IconKey,
  IconHistory,
  IconCopy,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastFiredAt: string | null;
  createdAt: string;
  consecutiveFailures: number; // 0 when healthy or never fired
};

type Delivery = {
  id: string;
  event: string;
  statusCode: number | null; // null = network error / timeout, never reached the endpoint
  ok: boolean;
  latencyMs: number | null;
  error: string | null;
  createdAt: string;
};

const FALLBACK_EVENT_OPTIONS = [
  "health.failed",
  "health.recovered",
  "backup.failed",
  "backup.completed",
];

const QUERY_KEY = ["admin", "webhooks"];

type FormState = {
  name: string;
  url: string;
  events: string[];
  active: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: "", url: "", events: [], active: true };

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";

  if (!form.url.trim()) {
    errors.url = "URL is required";
  } else {
    try {
      const parsed = new URL(form.url);
      if (parsed.protocol !== "https:") {
        errors.url = "URL must use https://";
      }
    } catch {
      errors.url = "Enter a valid URL";
    }
  }

  if (form.events.length === 0) errors.events = "Select at least one event";
  return errors;
}

export default function WebhooksPage() {
  usePageTitle("Alerting Webhooks");
  const queryClient = useQueryClient();
  const confirmDelete = useConfirmDialog();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // One-time-reveal secret (from create or rotate). Cleared on dismiss/navigation.
  const [revealedSecret, setRevealedSecret] = useState<{
    webhookId: string;
    secret: string;
  } | null>(null);

  // Which webhook's delivery log panel is expanded
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const webhooksQuery = useApiQuery<{ webhooks: Webhook[] }>(
    QUERY_KEY,
    "/api/admin/alerting-webhooks",
  );
  const webhooks = webhooksQuery.data?.webhooks ?? [];
  const loading = webhooksQuery.isPending;

  // Event catalog from the backend; falls back to the local constant so this
  // doesn't hard-break if you haven't added the endpoint yet.
  const eventsQuery = useApiQuery<{ events: string[] }>(
    ["admin", "webhook-events"],
    "/api/admin/alerting-webhook-events",
  );
  const eventOptions = eventsQuery.data?.events ?? FALLBACK_EVENT_OPTIONS;

  const deliveriesQuery = useApiQuery<{ deliveries: Delivery[] }>(
    ["admin", "webhooks", expandedLogId, "deliveries"],
    expandedLogId
      ? `/api/admin/alerting-webhooks/${expandedLogId}/deliveries`
      : "",
    undefined,
    { enabled: !!expandedLogId },
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  // Single mutation for create/update/toggle-active — they were three code
  // paths hitting the same PUT/POST before.
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id: string | null;
      data: Partial<FormState>;
    }): Promise<{ webhook: Webhook; secret?: string }> => {
      if (payload.id) {
        const res = await api.put<{ webhook: Webhook }>(
          `/api/admin/alerting-webhooks/${payload.id}`,
          payload.data,
        );
        return { webhook: res.webhook };
      }
      const res = await api.post<{ webhook: Webhook; secret: string }>(
        "/api/admin/alerting-webhooks",
        payload.data,
      );
      return { webhook: res.webhook, secret: res.secret };
    },
    onSuccess: (res, payload) => {
      if (!payload.id && res.secret) {
        // Fresh webhook: show the secret once, since it won't come back on GET.
        setRevealedSecret({ webhookId: res.webhook.id, secret: res.secret });
      }
      toast.success(payload.id ? "Webhook updated" : "Webhook created");
      resetForm();
      invalidate();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSave = () => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    saveMutation.mutate({ id: editingId, data: form });
  };

  const handleEdit = (w: Webhook) => {
    setForm({ name: w.name, url: w.url, events: w.events, active: w.active });
    setFormErrors({});
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleToggleActive = (w: Webhook) => {
    saveMutation.mutate({ id: w.id, data: { active: !w.active } });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/admin/alerting-webhooks/${id}`),
    onSuccess: () => {
      toast.success("Webhook deleted");
      invalidate();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete({
      title: "Delete Webhook",
      message: "Delete this webhook? This cannot be undone.",
    });
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const testMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{
        statusCode: number | null;
        statusText: string;
        latencyMs: number;
        ok: boolean;
      }>(`/api/admin/alerting-webhooks/${id}/test`, {}),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(
          `Test delivered — ${res.statusCode} ${res.statusText} (${res.latencyMs}ms)`,
        );
      } else {
        toast.error(
          res.statusCode
            ? `Endpoint responded ${res.statusCode} ${res.statusText}`
            : `No response — endpoint unreachable (${res.latencyMs}ms timeout)`,
        );
      }
      invalidate(); // failure count / lastFiredAt may have changed
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const rotateSecretMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ secret: string }>(
        `/api/admin/alerting-webhooks/${id}/rotate-secret`,
        {},
      ),
    onSuccess: (res, id) => {
      setRevealedSecret({ webhookId: id, secret: res.secret });
      toast.success("Secret rotated — old signing secret is now invalid");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerting Webhooks</h1>
          <p className="text-foreground/60 mt-1">
            Configure webhook endpoints for system alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void webhooksQuery.refetch()}
            className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/50 flex items-center gap-1"
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
              setFormErrors({});
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <IconPlus size={16} /> Add Webhook
          </button>
        </div>
      </div>

      {/* One-time secret reveal — shown right after create/rotate, dismissible, never re-fetchable */}
      {revealedSecret && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
            <IconKey size={16} /> Signing secret — copy it now, it won&apos;t be
            shown again
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background border border-border rounded-lg px-3 py-2 overflow-x-auto">
              {revealedSecret.secret}
            </code>
            <button
              onClick={() => handleCopySecret(revealedSecret.secret)}
              className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 flex items-center gap-1"
            >
              <IconCopy size={14} /> Copy
            </button>
            <button
              onClick={() => setRevealedSecret(null)}
              className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/50"
            >
              Done
            </button>
          </div>
          <p className="text-xs text-foreground/50">
            Use this to verify the <code>X-Signature</code> header (HMAC-SHA256)
            on incoming payloads.
          </p>
        </div>
      )}

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {editingId ? "Edit Webhook" : "New Webhook"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="webhook-name"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-1"
              >
                Name
              </label>
              <input
                id="webhook-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm ${
                  formErrors.name ? "border-red-500" : "border-border"
                }`}
                placeholder="My Webhook"
                aria-invalid={!!formErrors.name}
                aria-describedby={
                  formErrors.name ? "webhook-name-error" : undefined
                }
              />
              {formErrors.name && (
                <p
                  id="webhook-name-error"
                  className="text-xs text-red-500 mt-1"
                >
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="webhook-url"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-1"
              >
                URL
              </label>
              <input
                id="webhook-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm ${
                  formErrors.url ? "border-red-500" : "border-border"
                }`}
                placeholder="https://hooks.example.com/alert"
                aria-invalid={!!formErrors.url}
                aria-describedby={
                  formErrors.url ? "webhook-url-error" : undefined
                }
              />
              {formErrors.url && (
                <p id="webhook-url-error" className="text-xs text-red-500 mt-1">
                  {formErrors.url}
                </p>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60 block mb-2">
              Events
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Events to trigger this webhook"
            >
              {eventOptions.map((event) => {
                const selected = form.events.includes(event);
                return (
                  <button
                    key={event}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleEvent(event)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground/60 border-border hover:border-primary/50"
                    }`}
                  >
                    {event}
                  </button>
                );
              })}
            </div>
            {formErrors.events && (
              <p className="text-xs text-red-500 mt-1">{formErrors.events}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Create"}
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
          <p className="text-sm text-foreground/40">
            Add a webhook to receive system alerts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => {
            const isUnhealthy = w.active && w.consecutiveFailures >= 3;
            return (
              <div key={w.id} className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        !w.active
                          ? "bg-foreground/10"
                          : isUnhealthy
                            ? "bg-red-500/10"
                            : "bg-green-500/10"
                      }`}
                    >
                      <IconBell
                        size={20}
                        className={
                          !w.active
                            ? "text-foreground/40"
                            : isUnhealthy
                              ? "text-red-500"
                              : "text-green-500"
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{w.name}</p>
                        {isUnhealthy && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <IconAlertTriangle size={10} />{" "}
                            {w.consecutiveFailures} failures in a row
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/60 font-mono truncate max-w-sm">
                        {w.url}
                      </p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {w.events.map((e) => (
                          <span
                            key={e}
                            className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-medium"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(w)}
                      disabled={saveMutation.isPending}
                      className={`text-xs px-2 py-1 rounded-lg font-medium disabled:opacity-60 ${
                        w.active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-foreground/10 text-foreground/40"
                      }`}
                    >
                      {w.active ? "Active" : "Disabled"}
                    </button>
                    <button
                      onClick={() =>
                        setExpandedLogId(expandedLogId === w.id ? null : w.id)
                      }
                      aria-label={`View delivery history for ${w.name}`}
                      aria-expanded={expandedLogId === w.id}
                      className="text-sm px-2 py-1.5 rounded-lg border border-border hover:bg-muted/50 flex items-center gap-1"
                    >
                      <IconHistory size={14} /> Log
                    </button>
                    <button
                      onClick={() => testMutation.mutate(w.id)}
                      disabled={testMutation.isPending}
                      className="text-sm px-2 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 disabled:opacity-60"
                    >
                      <IconSend size={14} />{" "}
                      {testMutation.isPending ? "Sending..." : "Test"}
                    </button>
                    <button
                      onClick={() => rotateSecretMutation.mutate(w.id)}
                      disabled={rotateSecretMutation.isPending}
                      className="text-sm px-2 py-1.5 rounded-lg border border-border hover:bg-muted/50 flex items-center gap-1 disabled:opacity-60"
                      title="Rotate signing secret"
                    >
                      <IconKey size={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(w)}
                      className="text-sm px-2 py-1.5 rounded-lg border border-border hover:bg-muted/50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete webhook ${w.name}`}
                      className="text-sm px-2 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-60"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>

                {expandedLogId === w.id && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3">
                    {deliveriesQuery.isPending ? (
                      <p className="text-xs text-foreground/50">
                        Loading delivery history...
                      </p>
                    ) : (deliveriesQuery.data?.deliveries.length ?? 0) === 0 ? (
                      <p className="text-xs text-foreground/50">
                        No deliveries yet.
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-foreground/40 text-left">
                            <th className="font-medium pb-1">Event</th>
                            <th className="font-medium pb-1">Status</th>
                            <th className="font-medium pb-1">Latency</th>
                            <th className="font-medium pb-1">When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveriesQuery.data!.deliveries.map((d) => (
                            <tr
                              key={d.id}
                              className="border-t border-border/50"
                            >
                              <td className="py-1.5 font-mono">{d.event}</td>
                              <td
                                className={`py-1.5 font-medium ${d.ok ? "text-green-500" : "text-red-500"}`}
                              >
                                {d.statusCode ?? "no response"}
                                {d.error && (
                                  <span className="text-foreground/40 font-normal ml-1">
                                    — {d.error}
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 text-foreground/60">
                                {d.latencyMs != null ? `${d.latencyMs}ms` : "—"}
                              </td>
                              <td className="py-1.5 text-foreground/60">
                                {new Date(d.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-foreground/40">
        <p>Available events: {eventOptions.join(", ")}</p>
        <p>
          Webhooks receive POST requests with a JSON payload and an X-Signature
          header (HMAC-SHA256 of the body using your signing secret).
        </p>
      </div>
    </div>
  );
}
