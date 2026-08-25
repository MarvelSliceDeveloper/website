import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import PageShell from "../components/ui/PageShell";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { SubmitButton, CancelButton } from "../components/FormButtons";
import { FiFolder, FiArrowLeft, FiEdit3, FiTrash2 } from "react-icons/fi";
import useConfirm from "../hooks/useConfirm";

export default function BlogCategoriesManager() {
  const [confirm, confirmDialog] = useConfirm();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "" });

  useEffect(() => {
    supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data || []);
        setLoading(false);
      });
  }, []);

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", slug: "" });
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { name: form.name, slug: form.slug || slugify(form.name) };
    if (editingId) {
      await supabase
        .from("blog_categories")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase
        .from("blog_categories")
        .insert({ ...payload, sort_order: categories.length });
    }
    queryClient.invalidateQueries({ queryKey: ["blogCategories"] });
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
    resetForm();
  }

  async function deleteCategory(id) {
    if (!(await confirm("Delete this category?"))) return;
    await supabase.from("blog_categories").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["blogCategories"] });
    setCategories(categories.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const columns = [
    {
      header: "Name",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">/{row.slug}</p>
        </div>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <p className="text-sm text-neutral-600 truncate max-w-xs">
          {row.description || "-"}
        </p>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status ? "success" : "default"}>
          {row.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Order",
      accessor: "sort_order",
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => startEdit(row)}
            className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors"
            title="Edit"
          >
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteCategory(row.id)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      backTo="/admin"
      title="Blog Categories"
      subtitle="Manage categories for blog posts"
    >
      <form onSubmit={handleSave} className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-4">
          {editingId ? "Edit Category" : "Add Category"}
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                slug: editingId ? form.slug : slugify(e.target.value),
              })
            }
            placeholder="Category name"
            className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-transparent transition-all"
          />
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="slug"
            className="w-40 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-transparent transition-all font-mono text-xs"
          />
          <SubmitButton
            type="submit"
            label={editingId ? "Save" : "Submit"}
            disabled={!form.name.trim()}
          />
          {editingId && <CancelButton onClick={resetForm} label="Cancel" />}
        </div>
      </form>

      {categories.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiFileText}
            title="No categories yet"
            description="Get started by adding your first category."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={categories} searchable={false} />
      )}
      {confirmDialog}
    </PageShell>
  );
}
