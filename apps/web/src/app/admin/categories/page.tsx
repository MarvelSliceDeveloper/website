"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SUGGESTED_CATEGORIES } from "@/lib/suggestions";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  _count: { courses: number };
};

export default function AdminCategoriesPage() {
  usePageTitle("Categories");
  const confirmDelete = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const categoriesQuery = useApiQuery<{ categories: Category[] }>(
    ["admin", "categories"],
    "/api/admin/categories",
  );
  const categories = categoriesQuery.data?.categories ?? [];
  const loading = categoriesQuery.isPending;

  const saveMutation = useMutation({
    mutationFn: ({
      id,
      name,
      description,
    }: {
      id: string | null;
      name: string;
      description?: string;
      suggested?: boolean;
    }) =>
      id
        ? api.put(`/api/admin/categories/${id}`, { name, description })
        : api.post("/api/admin/categories", { name, description }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.suggested
          ? `Category "${vars.name}" created`
          : vars.id
            ? "Category updated"
            : "Category created",
      );
      cancelForm();
      void categoriesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      void categoriesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function openCreate() {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormDescription("");
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }
    saveMutation.mutate({
      id: editingId,
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });
  }

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirmDelete({
        title: "Delete Category",
        message: `Delete category "${name}"? This cannot be undone.`,
      }))
    )
      return;
    deleteMutation.mutate(id);
  }

  function createSuggested(name: string) {
    saveMutation.mutate({ id: null, name, suggested: true });
  }

  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const query = formName.trim().toLowerCase();
  const suggestions = SUGGESTED_CATEGORIES.filter(
    (c) =>
      !existingNames.has(c.toLowerCase()) && c.toLowerCase().includes(query),
  ).slice(0, 24);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Categories"
        description="Manage course categories."
        breadcrumbs={[{ label: "Categories", href: "/admin/categories" }]}
        role="Administration"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void categoriesQuery.refetch()}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> Add Category
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit Category" : "New Category"}
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
            placeholder="Category name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="input text-xs w-full"
          />
          <textarea
            placeholder="Description (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="input text-xs w-full min-h-[80px]"
          />
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
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No categories found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Slug</th>
                  <th className="py-2.5 pr-3 text-center">Courses</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {cat.name}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-center text-muted-foreground">
                      {cat._count.courses}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          cat.isActive
                            ? "bg-success/15 text-success border-success/25"
                            : "bg-muted/15 text-muted-foreground border-muted/25"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
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
