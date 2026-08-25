import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import PageShell from "../components/ui/PageShell";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { SubmitButton, CancelButton } from "../components/FormButtons";
import {
  FiGrid,
  FiMonitor,
  FiServer,
  FiBookOpen,
  FiStar,
  FiAward,
  FiUsers,
  FiClock,
  FiCode,
  FiGlobe,
  FiZap,
  FiShield,
  FiHeart,
  FiLayers,
  FiFileText,
  FiImage,
  FiVideo,
  FiChevronUp,
  FiArrowLeft,
  FiEdit3,
  FiTrash2,
} from "react-icons/fi";
import useConfirm from "../hooks/useConfirm";

const ICON_OPTIONS = [
  { key: "FiGrid", Icon: FiGrid },
  { key: "FiMonitor", Icon: FiMonitor },
  { key: "FiServer", Icon: FiServer },
  { key: "FiBookOpen", Icon: FiBookOpen },
  { key: "FiStar", Icon: FiStar },
  { key: "FiAward", Icon: FiAward },
  { key: "FiUsers", Icon: FiUsers },
  { key: "FiClock", Icon: FiClock },
  { key: "FiCode", Icon: FiCode },
  { key: "FiGlobe", Icon: FiGlobe },
  { key: "FiZap", Icon: FiZap },
  { key: "FiShield", Icon: FiShield },
  { key: "FiHeart", Icon: FiHeart },
  { key: "FiLayers", Icon: FiLayers },
  { key: "FiFileText", Icon: FiFileText },
  { key: "FiImage", Icon: FiImage },
  { key: "FiVideo", Icon: FiVideo },
];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  const selected = ICON_OPTIONS.find((o) => o.key === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-36 flex items-center gap-2 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {selected ? (
          <>
            <selected.Icon className="w-4 h-4 text-gray-600 shrink-0" />
            <span className="truncate">{selected.key}</span>
          </>
        ) : (
          <span className="text-gray-400">Select</span>
        )}
        <FiChevronUp
          className={`w-3.5 h-3.5 ml-auto text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto admin-scrollbar">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                value === opt.key
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <opt.Icon className="w-4 h-4 shrink-0" />
              <span>{opt.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainingCategoriesManager() {
  const [confirm, confirmDialog] = useConfirm();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    icon: "",
    description: "",
    status: true,
    sort_order: 0,
  });

  useEffect(() => {
    supabase
      .from("training_categories")
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
    setForm({
      name: "",
      slug: "",
      icon: "",
      description: "",
      status: true,
      sort_order: 0,
    });
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      description: cat.description || "",
      status: cat.status ?? true,
      sort_order: cat.sort_order ?? 0,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      icon: form.icon,
      description: form.description,
      status: form.status,
      sort_order: editingId ? form.sort_order : categories.length,
    };
    if (editingId) {
      await supabase
        .from("training_categories")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase.from("training_categories").insert(payload);
    }
    queryClient.invalidateQueries({ queryKey: ["trainingCategories"] });
    const { data } = await supabase
      .from("training_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
    resetForm();
  }

  async function deleteCategory(id) {
    if (!(await confirm("Delete this category?"))) return;
    await supabase.from("training_categories").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["trainingCategories"] });
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
      title="Training Categories"
      subtitle="Manage categories for trainings"
    >
      <div className="flex gap-6 items-start mb-6">
        <form
          onSubmit={handleSave}
          className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-900">
            {editingId ? "Edit Category" : "Add Category"}
          </h3>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20 shrink-0">
              Icon
            </label>
            <IconPicker
              value={form.icon}
              onChange={(v) => setForm({ ...form, icon: v })}
            />
            <label className="text-sm font-medium text-gray-700 shrink-0 ml-2">
              Name
            </label>
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
              className="w-48 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
            <label className="text-sm font-medium text-gray-700 shrink-0 ml-2">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="slug"
              className="w-32 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-20 shrink-0">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional"
              rows={1}
              className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white resize-none"
            />
            <label className="text-sm font-medium text-gray-700 shrink-0 ml-2">
              Order
            </label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) })
              }
              placeholder="0"
              className="w-16 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
            <label className="text-sm font-medium text-gray-700 shrink-0 ml-3">
              Active
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, status: !form.status })}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.status ? "bg-indigo-500" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.status ? "translate-x-4" : ""}`}
                />
              </div>
              <span className="text-sm text-gray-600">
                {form.status ? "Yes" : "No"}
              </span>
            </label>
          </div>
        </form>

        <div className="w-28 shrink-0 flex flex-col gap-2 pt-9">
          <SubmitButton
            type="button"
            onClick={handleSave}
            disabled={!form.name.trim()}
            label={editingId ? "Save" : "Submit"}
          />
          {editingId && <CancelButton onClick={resetForm} />}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiGrid}
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
