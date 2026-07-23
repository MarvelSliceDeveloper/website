"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast } from "@/lib/toast";
import { IconKey, IconRefresh, IconCopy, IconTrash } from "@tabler/icons-react";

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
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDesc, setNewKeyDesc] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    try {
      const data = await api.get<{ keys: ApiKeyEntry[] }>(
        "/api/admin/api-keys",
      );
      setKeys(data.keys);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    try {
      const data = await api.post<{ id: string; name: string; key: string }>(
        "/api/admin/api-keys",
        {
          name: newKeyName.trim(),
          description: newKeyDesc.trim() || undefined,
        },
      );
      setCreatedKey(data.key);
      setNewKeyName("");
      setNewKeyDesc("");
      fetchKeys();
    } catch {
      toast.error("Failed to create API key");
    }
  }

  async function handleRevoke(id: string) {
    try {
      await api.delete(`/api/admin/api-keys/${id}`);
      toast.success("API key revoked");
      fetchKeys();
    } catch {
      toast.error("Failed to revoke API key");
    }
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
            onClick={fetchKeys}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
          <button
            onClick={() => {
              setShowCreate(true);
              setCreatedKey(null);
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

      {/* Keys Table */}
      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No API keys created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
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
                    <td className="py-3 pr-3 font-mono text-[10px] text-muted-foreground">
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
                    <td className="py-3 pr-3 text-muted">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {k.active && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="text-danger hover:text-danger/80 text-[10px] flex items-center gap-1"
                        >
                          <IconTrash size={12} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
