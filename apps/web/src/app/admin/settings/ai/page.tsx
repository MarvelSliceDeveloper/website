"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
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

type AIProvider = "gemini" | "openrouter";

type ProviderStatus = {
  configured: boolean;
  maskedKey: string | null;
  model: string;
};

type AIStatus = ProviderStatus & {
  provider: AIProvider;
  providers: Record<AIProvider, ProviderStatus>;
};

type HealthResult = {
  ok: boolean;
  provider?: AIProvider;
  model?: string;
  latencyMs?: number;
  error?: string;
};

type OpenRouterModel = { id: string; name: string };

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (recommended)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (cheapest)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const PROVIDER_LABEL: Record<AIProvider, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

const PROVIDER_HINT: Record<AIProvider, string> = {
  gemini: "Get a free key at Google AI Studio. The key is encrypted before storage and never exposed to browsers.",
  openrouter:
    "Get a key at openrouter.ai. The key is encrypted before storage and never exposed to browsers.",
};

const PROVIDER_KEY_URL: Record<AIProvider, string> = {
  gemini: "https://aistudio.google.com/apikey",
  openrouter: "https://openrouter.ai/keys",
};

const PROVIDER_KEY_LABEL: Record<AIProvider, string> = {
  gemini: "Google AI Studio → Get API key",
  openrouter: "OpenRouter → Get API key",
};

export default function AIIntegrationPage() {
  usePageTitle("AI Integration");
  const confirmDelete = useConfirmDialog();

  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("gemini");
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const statusQuery = useApiQuery<AIStatus>(
    ["admin", "ai", "status"],
    "/api/admin/ai/status",
  );
  const status = statusQuery.data;
  const activeProvider = status?.provider ?? "gemini";

  // Default the viewed provider to the active one once status loads.
  useEffect(() => {
    if (status?.provider && !selectionInitialized) {
      setSelectedProvider(status.provider);
      setSelectionInitialized(true);
    }
  }, [status?.provider, selectionInitialized]);

  // Drive reads/mutations from this local value, not async `status`, so a
  // delete/save can't target the wrong provider during the refetch after a switch.
  const resolvedProvider = selectedProvider;

  const invalidateStatus = () => void statusQuery.refetch();

  const handleSelectProvider = (p: AIProvider) => {
    setSelectedProvider(p);
    if (p !== status?.provider) switchProviderMutation.mutate(p);
  };

  const switchProviderMutation = useMutation({
    mutationFn: (provider: AIProvider) =>
      api.post<{ message: string }>("/api/admin/ai/provider", { provider }),
    onSuccess: (res, provider) => {
      toast.success(res.message || `Provider set to ${provider}`);
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const saveKeyMutation = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>("/api/admin/ai/api-key", {
        provider: resolvedProvider,
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
    mutationFn: (provider: AIProvider) =>
      api.delete<{ message: string }>(
        `/api/admin/ai/api-key?provider=${provider}`,
      ),
    onSuccess: () => {
      toast.success("API key removed");
      setApiKeyInput("");
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleRemoveKey = async () => {
    const ok = await confirmDelete({
      title: `Remove ${PROVIDER_LABEL[resolvedProvider]} API key?`,
      message: `This deletes the stored ${PROVIDER_LABEL[resolvedProvider]} key and can't be undone. You'll need to paste it again to re-enable AI generation.`,
      confirmLabel: "Remove key",
      danger: true,
    });
    if (ok) deleteKeyMutation.mutate(resolvedProvider);
  };

  const saveModelMutation = useMutation({
    mutationFn: (model: string) =>
      api.post<{ message: string }>("/api/admin/ai/model", {
        provider: resolvedProvider,
        model,
      }),
    onSuccess: () => {
      toast.success("Model updated");
      invalidateStatus();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const healthMutation = useMutation({
    mutationFn: () => api.post<HealthResult>("/api/admin/ai/health-check", {}),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(
          `${res.provider ?? resolvedProvider} is healthy (${
            res.latencyMs ?? "?"
          } ms)`,
        );
      } else {
        toast.error(res.error || "Health check failed");
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const modelsQuery = useApiQuery<{ provider: string; items: OpenRouterModel[] }>(
    ["admin", "ai", "openrouter-models"],
    "/api/admin/ai/openrouter/models",
    undefined,
    { enabled: resolvedProvider === "openrouter" },
  );
  const openRouterModels = modelsQuery.data?.items ?? [];

  const providerStatus = status?.providers?.[resolvedProvider];

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
            Configure an AI provider (Google Gemini or OpenRouter) for
            AI-assisted course and content generation.
          </p>
        </div>
        <button
          onClick={() => void statusQuery.refetch()}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Active provider card */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Active Provider
        </h2>
        <p className="text-xs text-muted">
          Choose which provider generates AI content. Each provider keeps its
          own API key and model.
        </p>
        <div className="flex flex-wrap gap-2">
          {(["gemini", "openrouter"] as AIProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectProvider(p)}
              disabled={
                switchProviderMutation.isPending ||
                p === resolvedProvider
              }
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                p === resolvedProvider
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card-hover/30 text-muted-foreground hover:bg-card-hover"
              }`}
            >
              {PROVIDER_LABEL[p]}
              {p === activeProvider && " (active)"}
            </button>
          ))}
        </div>
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
                providerStatus?.configured
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  providerStatus?.configured
                    ? "bg-success animate-pulse"
                    : "bg-danger"
                }`}
              />
              {providerStatus?.configured ? "Configured" : "Not configured"}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              Provider
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {PROVIDER_LABEL[resolvedProvider]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              API Key
            </dt>
            <dd className="mt-1 font-mono text-foreground">
              {providerStatus?.maskedKey ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              Model
            </dt>
            <dd className="mt-1 font-mono text-foreground">
              {providerStatus?.model || "—"}
            </dd>
          </div>
        </dl>

        {/* Health check */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card-hover/30 px-4 py-3">
          <button
            type="button"
            onClick={() => healthMutation.mutate()}
            disabled={healthMutation.isPending || !providerStatus?.configured}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            <IconActivity size={14} />
            {healthMutation.isPending ? "Checking…" : "Run Health Check"}
          </button>
          {!providerStatus?.configured && (
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
          {PROVIDER_LABEL[resolvedProvider]} API Key
        </h2>
        <p className="text-xs text-muted">
          {PROVIDER_HINT[resolvedProvider]}{" "}
          <a
            href={PROVIDER_KEY_URL[resolvedProvider]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {PROVIDER_KEY_LABEL[resolvedProvider]}
          </a>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={
              providerStatus?.configured
                ? "Replace with a new API key…"
                : `Paste your ${
                    resolvedProvider === "gemini"
                      ? "Gemini"
                      : "OpenRouter"
                  } API key…`
            }
            className="field flex-1 font-mono text-xs"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => saveKeyMutation.mutate()}
            disabled={
              saveKeyMutation.isPending || apiKeyInput.trim().length < 20
            }
            className="btn-primary text-xs px-4 disabled:opacity-50"
          >
            {saveKeyMutation.isPending ? "Saving…" : "Save Key"}
          </button>
          {providerStatus?.configured && (
            <button
              type="button"
              onClick={() => void handleRemoveKey()}
              disabled={deleteKeyMutation.isPending}
              className="btn-secondary text-xs px-3 py-2 flex items-center justify-center gap-1 text-danger hover:text-danger"
            >
              <IconTrash size={13} />{" "}
              {deleteKeyMutation.isPending ? "Removing…" : "Remove"}
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
        {resolvedProvider === "openrouter" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void modelsQuery.refetch()}
              disabled={
                !providerStatus?.configured || modelsQuery.isFetching
              }
              className="btn-secondary w-fit text-xs py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              <IconRefresh size={14} />
              {modelsQuery.isFetching ? "Loading models…" : "Load available models"}
            </button>
            {modelsQuery.isError && (
              <p className="text-xs text-danger">{getErrorMessage(modelsQuery.error)}</p>
            )}
            {modelsQuery.isSuccess && openRouterModels.length === 0 && (
              <p className="text-xs text-muted">
                No models returned. Load the list to populate this dropdown.
              </p>
            )}
          </div>
        )}
        <Select
          key={resolvedProvider}
          value={providerStatus?.model || ""}
          onValueChange={(val) => {
            if (val && val !== providerStatus?.model)
              saveModelMutation.mutate(val);
          }}
          disabled={
            statusQuery.isPending ||
            (resolvedProvider === "openrouter" && !providerStatus?.configured)
          }
        >
          <SelectTrigger className="field w-full max-w-sm">
            <SelectValue placeholder="-- Select a model --" />
          </SelectTrigger>
          <SelectContent>
            {resolvedProvider === "gemini"
              ? GEMINI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))
              : openRouterModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
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
