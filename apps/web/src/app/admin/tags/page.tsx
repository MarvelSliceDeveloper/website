"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SUGGESTED_TAGS } from "@/lib/suggestions";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";

type Tag = {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number };
};

export default function AdminTagsPage() {
  usePageTitle("Tags");
  const confirmDelete = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");

  const tagsQuery = useApiQuery<{ tags: Tag[] }>(
    ["admin", "tags"],
    "/api/admin/tags",
  );
  const tags = tagsQuery.data?.tags ?? [];
  const loading = tagsQuery.isPending;

  const saveMutation = useMutation({
    mutationFn: ({
      id,
      name,
      suggested,
    }: {
      id: string | null;
      name: string;
      suggested?: boolean;
    }) =>
      id
        ? api.put(`/api/admin/tags/${id}`, { name })
        : api.post("/api/admin/tags", { name }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.suggested
          ? `Tag "${vars.name}" created`
          : vars.id
            ? "Tag updated"
            : "Tag created",
      );
      cancelForm();
      void tagsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/tags/${id}`),
    onSuccess: () => {
      toast.success("Tag deleted");
      void tagsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function openCreate() {
    setEditingId(null);
    setFormName("");
    setShowForm(true);
  }

  function openEdit(tag: Tag) {
    setEditingId(tag.id);
    setFormName(tag.name);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    saveMutation.mutate({ id: editingId, name: formName.trim() });
  }

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirmDelete({
        title: "Delete Tag",
        message: `Delete tag "${name}"? This cannot be undone.`,
      }))
    )
      return;
    deleteMutation.mutate(id);
  }

  function createSuggested(name: string) {
    saveMutation.mutate({ id: null, name, suggested: true });
  }

  const existingNames = new Set(tags.map((t) => t.name.toLowerCase()));
  const query = formName.trim().toLowerCase();
  const suggestions = SUGGESTED_TAGS.filter(
    (t) => !existingNames.has(t.toLowerCase()) && t.toLowerCase().includes(query),
  ).slice(0, 24);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Tags"
        description="Manage course tags for filtering and organization."
        breadcrumbs={[{ label: "Tags", href: "/admin/tags" }]}
        role="Administration"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void tagsQuery.refetch()}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> Add Tag
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit Tag" : "New Tag"}
            </h3>
            <button
              onClick={cancelForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Tag name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="input text-xs w-full"
          />
          <p className="text-[10px] text-muted-foreground">
            Slug will be auto-generated from the name.
          </p>
          {!editingId && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Popular suggestions — click to add
              </p>
              {suggestions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  No matching suggestions.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => createSuggested(s)}
                      disabled={saveMutation.isPending}
                      className="text-[11px] px-2 py-1 rounded-full border border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !formName.trim()}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Create"}
            </button>
            <button onClick={cancelForm} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No tags found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Slug</th>
                  <th className="py-2.5 pr-3 text-center">Courses</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {tag.name}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {tag.slug}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-center text-muted-foreground">
                      {tag._count.courses}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tag)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id, tag.name)}
                          className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
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
