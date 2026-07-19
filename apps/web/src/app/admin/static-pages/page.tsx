"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconFileText,
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";

type StaticPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
};

export default function AdminStaticPagesPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPublished, setFormPublished] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchPages() {
    setLoading(true);
    try {
      const data = await api.get<{ pages: StaticPage[] }>(
        "/api/admin/static-pages",
      );
      setPages(data.pages);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPages();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleTitleChange(value: string) {
    setFormTitle(value);
    if (!slugManuallyEdited) {
      setFormSlug(generateSlug(value));
    }
  }

  function openCreate() {
    setEditingId(null);
    setFormTitle("");
    setFormSlug("");
    setFormContent("");
    setFormPublished(false);
    setSlugManuallyEdited(false);
    setShowForm(true);
  }

  function openEdit(page: StaticPage) {
    setEditingId(page.id);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormContent(page.content);
    setFormPublished(page.isPublished);
    setSlugManuallyEdited(true);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormSlug("");
    setFormContent("");
    setFormPublished(false);
    setSlugManuallyEdited(false);
  }

  async function handleSubmit() {
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formSlug.trim()) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: formTitle.trim(),
        slug: formSlug.trim(),
        content: formContent,
        isPublished: formPublished,
      };
      if (editingId) {
        await api.put(`/api/admin/static-pages/${editingId}`, body);
        toast.success("Page updated");
      } else {
        await api.post("/api/admin/static-pages", body);
        toast.success("Page created");
      }
      cancelForm();
      fetchPages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete page "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/static-pages/${id}`);
      toast.success("Page deleted");
      fetchPages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconFileText size={28} className="text-primary-hover" />
            Static Pages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage static content pages (About, Terms, Privacy, etc.).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPages}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
          >
            <IconPlus size={14} /> Create Page
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit Page" : "New Page"}
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
            placeholder="Page title"
            value={formTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="input text-xs w-full"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Slug:
            </span>
            <input
              type="text"
              placeholder="page-slug"
              value={formSlug}
              onChange={(e) => {
                setFormSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              className="input text-xs flex-1 font-mono"
            />
          </div>
          <textarea
            placeholder="Page content"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            className="input text-xs w-full min-h-[200px] font-mono"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formPublished}
                onChange={(e) => setFormPublished(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-foreground">Published</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving || !formTitle.trim() || !formSlug.trim()}
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

      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No static pages found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Title</th>
                  <th className="py-2.5 pr-3">Slug</th>
                  <th className="py-2.5 pr-3">Published</th>
                  <th className="py-2.5 pr-3">Last Updated</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pages.map((pg) => (
                  <tr
                    key={pg.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {pg.title}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        /{pg.slug}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          pg.isPublished
                            ? "bg-success/15 text-success border-success/25"
                            : "bg-muted/15 text-muted-foreground border-muted/25"
                        }`}
                      >
                        {pg.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(pg.updatedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(pg)}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(pg.id, pg.title)}
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
