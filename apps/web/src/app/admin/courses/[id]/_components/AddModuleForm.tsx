"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus } from "@tabler/icons-react";

export default function AddModuleForm({
  courseId,
  onAdded,
}: {
  courseId: string;
  onAdded: () => void;
}) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/${courseId}/modules`, {
        title,
        description: desc || undefined,
        isFreePreview,
      });
      setTitle("");
      setDesc("");
      setIsFreePreview(false);
      setShow(false);
      toast.success("Module added");
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add module");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-border/60 rounded-xl hover:border-primary/30 transition-colors">
      {show ? (
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Module title (required)"
            className="field"
            required
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="field"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isFreePreview}
              onChange={(e) => setIsFreePreview(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Free preview (accessible without enrollment)
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {adding ? (
                "Adding..."
              ) : (
                <>
                  <IconPlus size={16} /> Add Module
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex items-center justify-center gap-2 w-full py-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <IconPlus size={18} /> Add Module
        </button>
      )}
    </div>
  );
}
