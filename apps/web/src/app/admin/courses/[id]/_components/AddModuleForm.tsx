"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus } from "@tabler/icons-react";
import { FormModal } from "@/components/admin/FormModal";

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

  const openForm = () => {
    setTitle("");
    setDesc("");
    setIsFreePreview(false);
    setShow(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/${courseId}/modules`, {
        title,
        description: desc || undefined,
        isFreePreview,
      });
      setShow(false);
      toast.success("Module added");
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add module");
    } finally {
      setAdding(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={adding}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
        form="add-module-form"
      >
        {adding ? "Adding..." : "Add Module"}
      </button>
    </>
  );

  return (
    <>
      <button
        onClick={openForm}
        className="border-2 border-dashed border-border/60 rounded-xl hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-2 w-full py-6 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <IconPlus size={20} />
        <span>Add Module</span>
      </button>

      <FormModal
        open={show}
        onClose={() => setShow(false)}
        title="Add Module"
        size="md"
        footer={footer}
      >
        <form id="add-module-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module title (required)"
              className="field w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description"
              className="field w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isFreePreview}
              onChange={(e) => setIsFreePreview(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            <span>Free preview (accessible without enrollment)</span>
          </label>
        </form>
      </FormModal>
    </>
  );
}
