"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";

type TabId = "categories" | "titles" | "tags" | "package-names";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  _count: { courses: number };
};

type TagItem = {
  id: string;
  name: string;
  slug: string;
  _count: { courses: number };
};

type TitleItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type PackageNameItem = {
  id: string;
  name: string;
  isActive: boolean;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "titles", label: "Course Titles" },
  { id: "tags", label: "Tags" },
  { id: "package-names", label: "Package Names" },
];

export default function AdminContentPage() {
  usePageTitle("Content");
  const confirmDelete = useConfirmDialog();

  const [activeTab, setActiveTab] = useState<TabId>("categories");

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [packageNames, setPackageNames] = useState<PackageNameItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Add/edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchTab(tab: TabId) {
    setLoading(true);
    try {
      if (tab === "categories") {
        const data = await api.get<{ categories: CategoryItem[] }>(
          "/api/admin/content/categories",
        );
        setCategories(data.categories);
      } else if (tab === "titles") {
        const data = await api.get<{ titles: TitleItem[] }>(
          "/api/admin/content/titles",
        );
        setTitles(data.titles);
      } else if (tab === "tags") {
        const data = await api.get<{ tags: TagItem[] }>(
          "/api/admin/content/tags",
        );
        setTags(data.tags);
      } else {
        const data = await api.get<{ packageNames: PackageNameItem[] }>(
          "/api/admin/content/package-names",
        );
        setPackageNames(data.packageNames);
      }
    } catch {
      if (tab === "categories") setCategories([]);
      else if (tab === "titles") setTitles([]);
      else if (tab === "tags") setTags([]);
      else setPackageNames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab]);

  const items =
    activeTab === "categories"
      ? categories
      : activeTab === "titles"
        ? titles
        : activeTab === "tags"
          ? tags
          : packageNames;

  const count =
    activeTab === "categories"
      ? categories.length
      : activeTab === "titles"
        ? titles.length
        : activeTab === "tags"
          ? tags.length
          : packageNames.length;

  function openCreate() {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setShowForm(true);
  }

  function openEdit(item: (typeof items)[number]) {
    setEditingId(item.id);
    setFormName(item.name);
    setFormDescription(
      "description" in item && typeof item.description === "string"
        ? item.description
        : "",
    );
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormDescription("");
  }

  const endpointBase =
    activeTab === "categories"
      ? "/api/admin/categories"
      : activeTab === "titles"
        ? "/api/admin/content/titles"
        : activeTab === "tags"
          ? "/api/admin/tags"
          : "/api/admin/content/package-names";

  async function handleSubmit() {
    if (!formName.trim()) {
      alert("Name is required");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: formName.trim() };
      if (activeTab === "categories") {
        body.description = formDescription.trim() || undefined;
      }
      if (editingId) {
        await api.put(`${endpointBase}/${editingId}`, body);
      } else {
        await api.post(endpointBase, body);
      }
      cancelForm();
      fetchTab(activeTab);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const label = TABS.find((t) => t.id === activeTab)?.label || "Item";
    if (
      !(await confirmDelete({
        title: `Delete ${label}`,
        message: `Delete "${name}"? This cannot be undone.`,
      }))
    )
      return;
    try {
      await api.delete(`${endpointBase}/${id}`);
      fetchTab(activeTab);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Content"
        description="Manage categories, course titles, tags, and package names shown in forms."
        breadcrumbs={[{ label: "Content", href: "/admin/content" }]}
        role="Super Admin"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTab(activeTab)}
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> Add{" "}
              {TABS.find((t) => t.id === activeTab)?.label}
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId
                ? `Edit ${TABS.find((t) => t.id === activeTab)?.label}`
                : `New ${TABS.find((t) => t.id === activeTab)?.label}`}
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
            placeholder="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="input text-xs w-full"
          />
          {activeTab === "categories" && (
            <textarea
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="input text-xs w-full min-h-[80px]"
            />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving || !formName.trim()}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button onClick={cancelForm} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        ) : count === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No items found. Add one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  {activeTab === "categories" && (
                    <>
                      <th className="py-2.5 pr-3">Slug</th>
                      <th className="py-2.5 pr-3 text-center">Courses</th>
                      <th className="py-2.5 pr-3">Status</th>
                    </>
                  )}
                  {activeTab === "tags" && (
                    <>
                      <th className="py-2.5 pr-3">Slug</th>
                      <th className="py-2.5 pr-3 text-center">Courses</th>
                    </>
                  )}
                  {activeTab === "titles" && (
                    <th className="py-2.5 pr-3">Status</th>
                  )}
                  {activeTab === "package-names" && (
                    <th className="py-2.5 pr-3">Status</th>
                  )}
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {item.name}
                    </td>
                    {activeTab === "categories" && (
                      <>
                        <td className="py-3 pr-3">
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {(item as CategoryItem).slug}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-center text-muted-foreground">
                          {(item as CategoryItem)._count.courses}
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge
                            active={(item as CategoryItem).isActive}
                          />
                        </td>
                      </>
                    )}
                    {activeTab === "tags" && (
                      <>
                        <td className="py-3 pr-3">
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {(item as TagItem).slug}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-center text-muted-foreground">
                          {(item as TagItem)._count.courses}
                        </td>
                      </>
                    )}
                    {(activeTab === "titles" || activeTab === "package-names") && (
                      <td className="py-3 pr-3">
                        <StatusBadge active={(item as TitleItem).isActive} />
                      </td>
                    )}
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
        active
          ? "bg-success/15 text-success border-success/25"
          : "bg-muted/15 text-muted-foreground border-muted/25"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}