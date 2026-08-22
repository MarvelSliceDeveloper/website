"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconSparkles,
  IconRefresh,
  IconActivity,
  IconKey,
  IconTrash,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AIStatus = {
  configured: boolean;
  maskedKey: string | null;
  model: string;
};

type HealthResult = {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
};

const AI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (recommended)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (cheapest)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

export default function AIIntegrationPage() {
  usePageTitle("AI Integration");

  const [apiKeyInput, setApiKeyInput] = useState("");
  const statusQuery = useApiQuery<AIStatus>(
    ["admin", "ai", "status"],
    "/api/admin/ai/status",
  );
  const status = statusQuery.data;

  const invalidateStatus = () => void statusQuery.refetch();

  const saveKeyMutation = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>("/api/admin/ai/api-key", {
        apiKey: apiKeyInput.trim(),
      }),
    onSuccess: (res) => {
      toast.success(res.message || "API key saved");
      setApiKeyInput("");
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: () => api.delete<{ message: string }>("/api/admin/ai/api-key"),
    onSuccess: () => {
      toast.success("API key removed");
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const saveModelMutation = useMutation({
    mutationFn: (model: string) =>
      api.post<{ message: string }>("/api/admin/ai/model", { model }),
    onSuccess: () => {
      toast.success("Model updated");
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const healthMutation = useMutation({
    mutationFn: () =>
      api.post<HealthResult>("/api/admin/ai/health-check", {}),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Gemini is healthy (${res.latencyMs ?? "?"} ms)`);
      } else {
        toast.error(res.error || "Health check failed");
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Settings
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
            <IconSparkles size={28} className="text-primary-hover" />
            AI Integration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Google Gemini for AI-assisted course and content
            generation.
          </p>
        </div>
        <button
          onClick={() => void statusQuery.refetch()}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Status card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Status</h2>
          {statusQuery.isPending ? (
            <span className="text-xs text-muted">Loading…</span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                status?.configured
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status?.configured ? "bg-success animate-pulse" : "bg-danger"
                }`}
              />
              {status?.configured ? "Configured" : "Not configured"}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              Provider
            </dt>
            <dd className="mt-1 font-medium text-foreground">Google Gemini</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              API Key
            </dt>
            <dd className="mt-1 font-mono text-foreground">
              {status?.maskedKey ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              Model
            </dt>
            <dd className="mt-1 font-mono text-foreground">
              {status?.model ?? "—"}
            </dd>
          </div>
        </dl>

        {/* Health check */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card-hover/30 px-4 py-3">
          <button
            type="button"
            onClick={() => healthMutation.mutate()}
            disabled={healthMutation.isPending || !status?.configured}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            <IconActivity size={14} />
            {healthMutation.isPending ? "Checking…" : "Run Health Check"}
          </button>
          {!status?.configured && (
            <p className="text-xs text-muted">
              Add an API key below to enable AI generation.
            </p>
          )}
          {healthMutation.data && (
            <div className="flex items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${
                  healthMutation.data.ok
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    healthMutation.data.ok
                      ? "bg-success animate-pulse"
                      : "bg-danger"
                  }`}
                />
                {healthMutation.data.ok ? "Healthy" : "Unhealthy"}
              </span>
              {healthMutation.data.ok && (
                <span className="text-muted">
                  model{" "}
                  <span className="font-mono text-foreground">
                    {healthMutation.data.model}
                  </span>{" "}
                  · {healthMutation.data.latencyMs} ms
                </span>
              )}
              {healthMutation.data.error && (
                <span className="max-w-md truncate text-danger">
                  {healthMutation.data.error}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* API Key card */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <IconKey size={18} className="text-primary-hover" />
          Gemini API Key
        </h2>
        <p className="text-xs text-muted">
          Get a free key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Google AI Studio → Get API key
          </a>
          . The key is encrypted before storage and never exposed to browsers.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={
              status?.configured
                ? "Replace with a new API key…"
                : "Paste your Gemini API key…"
            }
            className="field flex-1 font-mono text-xs"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => saveKeyMutation.mutate()}
            disabled={saveKeyMutation.isPending || apiKeyInput.trim().length < 20}
            className="btn-primary text-xs px-4 disabled:opacity-50"
          >
            {saveKeyMutation.isPending ? "Saving…" : "Save Key"}
          </button>
          {status?.configured && (
            <button
              type="button"
              onClick={() => deleteKeyMutation.mutate()}
              disabled={deleteKeyMutation.isPending}
              className="btn-secondary text-xs px-3 py-2 flex items-center justify-center gap-1 text-danger hover:text-danger"
            >
              <IconTrash size={13} /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Model card */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Model</h2>
        <p className="text-xs text-muted">
          Used for all AI generation (courses, quizzes, assignments, lesson
          descriptions, notifications).
        </p>
        <Select
          value={status?.model ?? ""}
          onValueChange={(val) => {
            if (val && val !== status?.model) saveModelMutation.mutate(val);
          }}
          disabled={statusQuery.isPending}
        >
          <SelectTrigger className="field w-full max-w-sm">
            <SelectValue placeholder="-- Select a model --" />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Where it's used */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-foreground">
          Where AI is used
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>✨ Course details draft — course builder</li>
          <li>✨ Module outlines — course builder</li>
          <li>✨ Quiz questions — Add Quiz form</li>
          <li>✨ Assignment briefs — Add Assignment form</li>
          <li>✨ Lesson descriptions — Add/Edit Lesson forms</li>
          <li>✨ Notification drafts — Send Notification</li>
        </ul>
      </div>
    </div>
  );
}
