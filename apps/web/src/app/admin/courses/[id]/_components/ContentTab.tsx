"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus } from "@tabler/icons-react";
import type { Module } from "./types";
import ModuleCard from "./ModuleCard";
import AddModuleForm from "./AddModuleForm";
import AIModuleGenerator from "./AIModuleGenerator";

export default function ContentTab({
  courseId,
  modules,
  onContentChanged,
}: {
  courseId: string;
  modules: Module[];
  onContentChanged: () => void;
}) {
  const regularModules = useMemo(
    () => modules.filter((m) => !m.isCertificationModule),
    [modules],
  );

  const reorderMutation = useMutation({
    mutationFn: async (moduleIds: string[]) => {
      const promise = api.patch(
        `/api/admin/courses/${courseId}/modules/reorder`,
        { moduleIds },
      );
      toast.promise(promise, {
        loading: "Saving order...",
        success: "Module order saved",
        error: "Failed to reorder",
      });
      return promise;
    },
  });

  const handleMoveModule = async (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= regularModules.length) return;
    const reordered = [...regularModules];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    try {
      await reorderMutation.mutateAsync(reordered.map((m) => m.id));
    } catch {
      // error toast handled inside mutationFn
    }
    onContentChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Course Builder
        </h2>
        <span className="text-xs text-muted">
          {regularModules.length} module{regularModules.length !== 1 ? "s" : ""}
        </span>
      </div>

      {modules.some((m) => m.isCertificationModule) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600">
          The certification exam module is configured in the{" "}
          <strong>Certification</strong> tab and is always placed last.
        </div>
      )}

      {regularModules.length === 0 ? (
        <div className="border-2 border-dashed border-border/60 rounded-xl hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <IconPlus size={24} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">No modules yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Add your first module to start building the course content.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {regularModules.map((mod, idx) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              index={idx}
              courseId={courseId}
              onChanged={onContentChanged}
              onMoveUp={() => handleMoveModule(idx, -1)}
              onMoveDown={() => handleMoveModule(idx, 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < regularModules.length - 1}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AIModuleGenerator courseId={courseId} onAdded={onContentChanged} />
        <AddModuleForm courseId={courseId} onAdded={onContentChanged} />
      </div>
    </div>
  );
}
