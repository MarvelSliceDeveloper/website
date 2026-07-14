"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";

export default function AssignmentTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("QUIZ");
  const [maxPoints, setMaxPoints] = useState(100);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      api
        .get<{
          template: {
            title: string;
            description: string;
            type: string;
            maxPoints: number;
            category: string | null;
          };
        }>(`/api/admin/assignment-templates/${id}`)
        .then((data) => {
          const t = data.template;
          setTitle(t.title);
          setDescription(t.description);
          setType(t.type);
          setMaxPoints(t.maxPoints);
          setCategory(t.category || "");
        })
        .catch(() => toast.error("Failed to load template"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSave() {
    if (!title.trim() || !description.trim())
      return toast.error("Title and description are required");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        maxPoints,
        category: category.trim() || undefined,
      };

      if (isNew) {
        await api.post("/api/admin/assignment-templates", payload);
        toast.success("Assignment template created");
      } else {
        await api.put(`/api/admin/assignment-templates/${id}`, payload);
        toast.success("Assignment template updated");
      }
      router.push("/admin/assignment-templates");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this template?")) return;
    try {
      await api.delete(`/api/admin/assignment-templates/${id}`);
      toast.success("Deleted");
      router.push("/admin/assignment-templates");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center text-muted animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/assignment-templates")}
            className="btn-secondary text-xs py-2"
          >
            <IconArrowLeft size={14} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
              Library
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {isNew ? "Add Assignment Template" : "Edit Assignment Template"}
            </h1>
          </div>
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="text-danger hover:text-danger/80 text-xs flex items-center gap-1"
          >
            <IconTrash size={14} /> Delete
          </button>
        )}
      </div>

      <div className="glass-card p-5 border border-border/80 space-y-4">
        <input
          type="text"
          placeholder="Template title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input text-sm w-full"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input text-xs w-full min-h-[80px]"
        />
        <div className="flex items-center gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input text-xs"
          >
            <option value="QUIZ">QUIZ</option>
            <option value="FILE_UPLOAD">FILE_UPLOAD</option>
          </select>
          <input
            type="number"
            placeholder="Max points"
            value={maxPoints}
            onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
            className="input text-xs w-24"
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input text-xs flex-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-2.5 px-6 disabled:opacity-40"
        >
          {saving ? "Saving..." : isNew ? "Add Template" : "Save Changes"}
        </button>
        <button
          onClick={() => router.push("/admin/assignment-templates")}
          className="btn-secondary text-sm py-2.5 px-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
