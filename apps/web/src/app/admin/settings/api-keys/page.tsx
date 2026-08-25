"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import {
  IconKey,
  IconRefresh,
  IconCopy,
  IconTrash,
  IconEdit,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type ApiKeyEntry = {
  id: string;
  name: string;
  description: string | null;
  key: string;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  usePageTitle("API Keys");
  const confirmDelete = useConfirmDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDesc, setNewKeyDesc] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<ApiKeyEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const keysQuery = useApiQuery<{ keys: ApiKeyEntry[] }>(
    ["admin", "api-keys"],
    "/api/admin/api-keys",
  );
  const keys = keysQuery.data?.keys ?? [];
  const loading = keysQuery.isPending;

  const youtubeStatusQuery = useApiQuery<{
    configured: boolean;
    masked: string | null;
  }>(
    ["admin", "api-keys", "youtube-status"],
    "/api/admin/api-keys/youtube-status",
  );
  const youtubeStatus = youtubeStatusQuery.isPending
    ? null
    : (youtubeStatusQuery.data ?? { configured: false, masked: null });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      api.post<{ id: string; name: string; key: string }>(
        "/api/admin/api-keys",
        body,
      ),
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setNewKeyName("");
      setNewKeyDesc("");
      void keysQuery.refetch();
    },
    onError: () => toast.error("Failed to create API key"),
  });

  function handleCreate() {
    if (!newKeyName.trim()) return;
    createMutation.mutate({
      name: newKeyName.trim(),
      description: newKeyDesc.trim() || undefined,
    });
  }

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/api-keys/${id}`),
    onSuccess: () => {
      toast.success("API key revoked");
      void keysQuery.refetch();
    },
    onError: () => toast.error("Failed to revoke API key"),
  });

  async function handleRevoke(id: string, name: string) {
    if (
      !(await confirmDelete({
        title: "Revoke API Key",
        message: `Revoke API key "${name}"? Any integration using it will stop working.`,
      }))
    )
      return;
    revokeMutation.mutate(id);
  }

  const reactivateMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/admin/api-keys/${id}`, { active: true }),
    onSuccess: () => {
      toast.success("API key reactivated");
      void keysQuery.refetch();
    },
    onError: () => toast.error("Failed to reactivate API key"),
  });

  function handleReactivate(id: string) {
    reactivateMutation.mutate(id);
  }

  function openEdit(key: ApiKeyEntry) {
    setEditingKey(key);
    setEditName(key.name);
    setEditDesc(key.description ?? "");
    setShowCreate(false);
    setCreatedKey(null);
  }

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      description: string | null;
    }) =>
      api.patch(`/api/admin/api-keys/${payload.id}`, {
        name: payload.name,
        description: payload.description,
      }),
    onSuccess: () => {
      toast.success("API key updated");
      setEditingKey(null);
      void keysQuery.refetch();
    },
    onError: () => toast.error("Failed to update API key"),
  });

  function handleUpdate() {
    if (!editingKey) return;
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({
      id: editingKey.id,
      name: editName.trim(),
      description: editDesc.trim() || null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconKey size={28} className="text-primary-hover" />
            API Keys
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage platform API keys for external integrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void keysQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
          <button
            onClick={() => {
              setShowCreate(true);
              setCreatedKey(null);
              setEditingKey(null);
            }}
            className="btn-primary text-xs py-2"
          >
            Add Key
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="glass-card p-5 border border-primary/30">
          <h3 className="text-sm font-bold mb-3">
            {createdKey ? "API Key Created" : "Add New API Key"}
          </h3>
          {createdKey ? (
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-bold text-amber-400 mb-1">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-black/20 px-2 py-1 rounded flex-1 break-all">
                    {createdKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdKey);
                      toast.success("Copied to clipboard");
                    }}
                    className="btn-secondary text-xs py-1.5 px-2"
                  >
                    <IconCopy size={14} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreatedKey(null);
                }}
                className="btn-secondary text-xs py-2"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Key name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="input text-xs w-full"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newKeyDesc}
                onChange={(e) => setNewKeyDesc(e.target.value)}
                className="input text-xs w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreate}
                  className="btn-primary text-xs py-2"
                >
                  Generate Key
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingKey && (
        <div className="glass-card p-5 border border-primary/30">
          <h3 className="text-sm font-bold mb-3">Edit API Key</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/70 block mb-1">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input text-xs w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 block mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input text-xs w-full"
              />
            </div>
            <p className="text-[10px] text-foreground/50">
              The key value itself cannot be changed — generate a new key if you
              need to rotate it.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending || !editName.trim()}
                className="btn-primary text-xs py-2 disabled:opacity-40"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditingKey(null)}
                className="btn-secondary text-xs py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-foreground/60 animate-pulse">
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-sm text-foreground/50">
            No API keys created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-foreground/50 uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Description</th>
                  <th className="py-2.5 pr-3">Key</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Last Used</th>
                  <th className="py-2.5 pr-3">Created</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {k.name}
                    </td>
                    <td className="py-3 pr-3 text-foreground/60 max-w-[220px] truncate">
                      {k.description || "—"}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[10px] text-foreground/70">
                      {k.key}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          k.active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {k.active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-foreground/60">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3 pr-3 text-foreground/60">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(k)}
                          className="text-foreground/60 hover:text-primary text-[10px] flex items-center gap-1"
                          title="Edit"
                        >
                          <IconEdit size={12} /> Edit
                        </button>
                        {k.active ? (
                          <button
                            onClick={() => handleRevoke(k.id, k.name)}
                            className="text-danger hover:text-danger/80 text-[10px] flex items-center gap-1"
                          >
                            <IconTrash size={12} /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(k.id)}
                            className="text-success hover:text-success/80 text-[10px] flex items-center gap-1"
                          >
                            <IconRefresh size={12} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* YouTube API Key Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconBrandYoutube size={20} className="text-danger" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                YouTube API Key
              </p>
              <p className="text-xs text-foreground/60 mt-0.5">
                {youtubeStatus === null
                  ? "Checking..."
                  : youtubeStatus.configured
                    ? `Configured: ${youtubeStatus.masked}`
                    : "Not configured — set YOUTUBE_API_KEY in .env"}
              </p>
            </div>
          </div>
          {youtubeStatus?.configured ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-success border border-success/25">
              Active
            </span>
          ) : youtubeStatus !== null ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-danger/15 text-danger border border-danger/25">
              Missing
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
