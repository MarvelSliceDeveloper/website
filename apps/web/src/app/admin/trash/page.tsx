"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { IconTrash, IconRefresh, IconRestore } from "@tabler/icons-react";

type TrashEntity = {
  id: string;
  type: string;
  name?: string;
  title?: string;
  email?: string;
  deletedAt: string;
};

export default function TrashPage() {
  usePageTitle("Trash");
  const [trash, setTrash] = useState<Record<string, TrashEntity[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  async function fetchTrash() {
    setLoading(true);
    try {
      const data = await api.get<{ trash: Record<string, TrashEntity[]> }>(
        "/api/admin/trash",
      );
      setTrash(data.trash);
    } catch {
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrash();
  }, []);

  async function handleRestore(type: string, id: string) {
    try {
      await api.post(`/api/admin/trash/${type}/${id}/restore`);
      toast.success(`${type} restored`);
      fetchTrash();
    } catch {
      toast.error("Failed to restore");
    }
  }

  const tabs = [
    { key: "users", label: "Users" },
    { key: "courses", label: "Courses" },
    { key: "batches", label: "Batches" },
    { key: "sessions", label: "Sessions" },
    { key: "assignments", label: "Assignments" },
  ];

  const currentItems: TrashEntity[] = trash[activeTab] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconTrash size={28} className="text-primary-hover" />
            Trash
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Soft-deleted entities. Restore or permanently remove.
          </p>
        </div>
        <button
          onClick={fetchTrash}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No deleted {activeTab} found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Deleted At</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {item.name ||
                        item.title ||
                        item.email ||
                        item.id.slice(0, 12)}
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(item.deletedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRestore(activeTab, item.id)}
                        className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1"
                      >
                        <IconRestore size={12} /> Restore
                      </button>
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
