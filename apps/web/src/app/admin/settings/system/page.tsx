"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { IconSettings, IconRefresh } from "@tabler/icons-react";

type Setting = {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
};

export default function SystemSettingsPage() {
  usePageTitle("System Settings");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const settingsQuery = useApiQuery<{ settings: Setting[] }>(
    ["admin", "settings", "system"],
    "/api/admin/settings",
  );
  const settings = settingsQuery.data?.settings ?? [];
  const loading = settingsQuery.isPending;

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settingsQuery.data?.settings ?? []) {
      map[s.key] = s.value;
    }
    setEditing(map);
  }, [settingsQuery.data]);

  const saveSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/api/admin/settings/${key}`, { value }),
    onSuccess: (_data, { key }) => {
      toast.success(`Setting "${key}" updated`);
    },
    onError: () => toast.error("Failed to update setting"),
  });
  const savingKey = saveSettingMutation.isPending
    ? (saveSettingMutation.variables?.key ?? null)
    : null;

  function handleSave(key: string) {
    saveSettingMutation.mutate({ key, value: editing[key] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconSettings size={28} className="text-primary-hover" />
            System Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide configuration values.
          </p>
        </div>
        <button
          onClick={() => void settingsQuery.refetch()}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading settings...</p>
        </div>
      ) : (
        <div className="glass-card p-5 border border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Key</th>
                  <th className="py-2.5 pr-3">Value</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Description</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {settings.map((setting) => (
                  <tr
                    key={setting.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono text-foreground font-medium">
                      {setting.key}
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type={setting.type === "number" ? "number" : "text"}
                        value={editing[setting.key] ?? setting.value}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        className="input text-xs py-1.5 w-full max-w-[200px]"
                      />
                    </td>
                    <td className="py-3 pr-3 text-muted">{setting.type}</td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px]">
                      {setting.description || "—"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={savingKey === setting.key}
                        className="btn-primary text-[10px] py-1.5 px-3 disabled:opacity-40"
                      >
                        {savingKey === setting.key ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
