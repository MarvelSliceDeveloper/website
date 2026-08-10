"use client";

import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus } from "@tabler/icons-react";
import type { Module } from "./types";
import ModuleCard from "./ModuleCard";
import AddModuleForm from "./AddModuleForm";

export default function ContentTab({
  courseId,
  modules,
  onContentChanged,
}: {
  courseId: string;
  modules: Module[];
  onContentChanged: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);

  const regularModules = useMemo(
    () => modules.filter((m) => !m.isCertificationModule),
    [modules],
  );

  const items = useMemo(() => {
    if (dragOrder) {
      return dragOrder
        .map((id) => regularModules.find((m) => m.id === id)!)
        .filter(Boolean);
    }
    return regularModules;
  }, [regularModules, dragOrder]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };
  const handleDragLeave = () => {
    setOverIndex(null);
  };
  const handleDrop = async (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) {
      reset();
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIdx, 0, moved);
    setDragOrder(reordered.map((m) => m.id));
    const promise = api.patch(`/api/admin/courses/${courseId}/modules/reorder`, {
      moduleIds: reordered.map((m) => m.id),
    });
    toast.promise(promise, {
      loading: "Saving order...",
      success: "Module order saved",
      error: "Failed to reorder",
    });
    try {
      await promise;
      setDragOrder(null);
      onContentChanged();
    } catch {
      setDragOrder(null);
      onContentChanged();
    }
    reset();
  };
  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Course Builder
        </h2>
        <span className="text-xs text-muted">
          {items.length} module{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {modules.some((m) => m.isCertificationModule) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600">
          The certification exam module is configured in the{" "}
          <strong>Certification</strong> tab and is always placed last.
        </div>
      )}

      {items.length === 0 ? (
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
          {items.map((mod, idx) => (
            <div key={mod.id}>
              {overIndex === idx && dragIndex !== idx && overIndex !== null && (
                <div
                  key="drag"
                  className="h-1 rounded-full bg-primary/40 mx-1 transition-all"
                />
              )}
              <ModuleCard
                key="module"
                module={mod}
                index={idx}
                courseId={courseId}
                onChanged={onContentChanged}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(idx)}
                isDragging={dragIndex === idx}
              />
            </div>
          ))}
        </div>
      )}

      <AddModuleForm courseId={courseId} onAdded={onContentChanged} />
    </div>
  );
}
