"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconFileText, IconRefresh, IconPlus } from "@tabler/icons-react";

type AssignmentTemplate = {
  id: string;
  title: string;
  type: string;
  maxPoints: number;
  category: string | null;
  createdAt: string;
};

export default function AssignmentTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const data = await api.get<{ templates: AssignmentTemplate[] }>(
        "/api/admin/assignment-templates",
      );
      setTemplates(data.templates);
    } catch {
      toast.error("Failed to load assignment templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Library
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconFileText size={28} className="text-primary-hover" />
            Assignment Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Predefined assignment templates. Attach to courses during creation.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/assignment-templates/new")}
          className="btn-primary text-xs py-2 flex items-center gap-1.5"
        >
          <IconPlus size={14} /> Create Template
        </button>
      </div>

      <button onClick={fetchTemplates}
        className="btn-secondary text-xs py-2 flex items-center gap-1.5">
        <IconRefresh size={14} /> Refresh
      </button>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          No assignment templates yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin/assignment-templates/${t.id}`)}
              className="glass-card p-5 border border-border/80 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted flex-wrap">
                <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {t.type}
                </span>
                <span>{t.maxPoints} pts</span>
                {t.category && (
                  <>
                    <span>·</span>
                    <span>{t.category}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
