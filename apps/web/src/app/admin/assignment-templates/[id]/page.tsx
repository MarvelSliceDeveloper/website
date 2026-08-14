"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type TemplateDetail = {
  template: {
    title: string;
    description: string;
    type: string;
    maxPoints: number;
    category: string | null;
  };
};

export default function AssignmentTemplateEditorPage() {
  usePageTitle("Assignment Template Details");
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("QUIZ");
  const [maxPoints, setMaxPoints] = useState(100);
  const [category, setCategory] = useState("");
  const confirmDelete = useConfirmDialog();
  const queryClient = useQueryClient();

  const detailQuery = useApiQuery<TemplateDetail>(
    ["admin", "assignment-templates", id],
    isNew ? "" : `/api/admin/assignment-templates/${id}`,
    undefined,
    { enabled: !isNew },
  );
  const loading = detailQuery.isLoading;

  useEffect(() => {
    if (detailQuery.data) {
      const t = detailQuery.data.template;
      setTitle(t.title);
      setDescription(t.description);
      setType(t.type);
      setMaxPoints(t.maxPoints);
      setCategory(t.category || "");
    }
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      type: string;
      maxPoints: number;
      category?: string;
    }) =>
      isNew
        ? api.post("/api/admin/assignment-templates", payload)
        : api.put(`/api/admin/assignment-templates/${id}`, payload),
    onSuccess: () => {
      toast.success(
        isNew ? "Assignment template created" : "Assignment template updated",
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "assignment-templates"],
      });
      router.push("/admin/assignment-templates");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/admin/assignment-templates/${id}`),
    onSuccess: () => {
      toast.success("Deleted");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "assignment-templates"],
      });
      router.push("/admin/assignment-templates");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    saveMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      type,
      maxPoints,
      category: category.trim() || undefined,
    });
  };

  const handleDelete = async () => {
    if (
      !(await confirmDelete({
        title: "Delete Template",
        message: "Delete this template?",
      }))
    )
      return;
    deleteMutation.mutate();
  };

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
          disabled={saveMutation.isPending}
          className="btn-primary text-sm py-2.5 px-6 disabled:opacity-40"
        >
          {saveMutation.isPending
            ? "Saving..."
            : isNew
              ? "Add Template"
              : "Save Changes"}
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
