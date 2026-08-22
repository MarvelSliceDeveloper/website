"use client";

import { useState } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import {
  IconPlus,
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react";
import { FormModal } from "@/components/admin/FormModal";
import { useAIGenerate } from "@/lib/use-ai-generate";

interface ProposedModule {
  title: string;
  description: string;
}

export default function AIModuleGenerator({
  courseId,
  courseTitle,
  onAdded,
}: {
  courseId: string;
  courseTitle?: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("beginner");
  const [proposed, setProposed] = useState<ProposedModule[]>([]);
  const [adding, setAdding] = useState(false);

  const aiGenerate = useAIGenerate<{ modules: ProposedModule[] }>();

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Enter a topic or paste the course description first");
      return;
    }
    aiGenerate.mutate(
      {
        type: "MODULES",
        prompt: topic.trim(),
        context: { questionCount: count, difficulty },
      },
      {
        onSuccess: (res) => {
          setProposed(res.data.modules ?? []);
          if (!res.data.modules?.length) toast.error("AI returned no modules");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleAddAll = async () => {
    setAdding(true);
    let added = 0;
    try {
      for (const mod of proposed) {
        await api.post(`/api/admin/courses/${courseId}/modules`, {
          title: mod.title,
          description: mod.description,
        });
        added++;
      }
      toast.success(`Added ${added} module${added !== 1 ? "s" : ""}`);
      setProposed([]);
      setTopic("");
      setOpen(false);
      onAdded();
    } catch (err: unknown) {
      toast.error(
        `${getErrorMessage(err)} (${added}/${proposed.length} modules were created — remove duplicates before retrying)`,
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/60 bg-violet-500/5 px-4 py-3 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-500/10"
      >
        <IconSparkles size={18} />
        Generate Modules with AI
      </button>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Course Modules with AI"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAddAll}
              disabled={adding || aiGenerate.isPending || proposed.length === 0}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
            >
              {adding ? (
                <>
                  <IconLoader2 size={13} className="animate-spin" /> Adding…
                </>
              ) : (
                `Add All (${proposed.length})`
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              What should the course cover?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                courseTitle
                  ? `e.g. A practical ${courseTitle} curriculum`
                  : "e.g. Complete Python for data analysis curriculum"
              }
              className="field min-h-[80px] resize-y text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Number of modules
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(Math.min(Math.max(parseInt(e.target.value) || 5, 2), 12))
                }
                min={2}
                max={12}
                className="field w-full text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="field w-full text-xs"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiGenerate.isPending}
            className="w-full flex items-center justify-center gap-1.5 rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
          >
            {aiGenerate.isPending ? (
              <>
                <IconLoader2 size={14} className="animate-spin" />
                Generating outline…
              </>
            ) : (
              <>
                <IconSparkles size={14} /> Generate Outline
              </>
            )}
          </button>

          {proposed.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Proposed modules — review and edit below before adding
              </p>
              {proposed.map((m, i) => (
                <div key={i} className="space-y-1.5 rounded-md border border-border/70 bg-muted/20 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted">{i + 1}</span>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) =>
                        setProposed((prev) =>
                          prev.map((p, pi) =>
                            pi === i ? { ...p, title: e.target.value } : p,
                          ),
                        )
                      }
                      className="field flex-1 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setProposed((prev) => prev.filter((_, pi) => pi !== i))}
                      className="p-1 text-muted hover:text-danger"
                      aria-label={`Remove module ${i + 1}`}
                    >
                      <IconPlus size={13} className="rotate-45" />
                    </button>
                  </div>
                  <textarea
                    value={m.description}
                    onChange={(e) =>
                      setProposed((prev) =>
                        prev.map((p, pi) =>
                          pi === i ? { ...p, description: e.target.value } : p,
                        ),
                      )
                    }
                    className="field w-full resize-y text-[11px]"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>
    </>
  );
}
