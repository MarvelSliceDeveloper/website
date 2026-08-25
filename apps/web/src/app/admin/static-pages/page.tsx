"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconX,
  IconExternalLink,
  IconArrowBackUp,
} from "@tabler/icons-react";

type StaticPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
};

type StaticPageInput = {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function StaticPageForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial: StaticPage | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: StaticPageInput) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initial);
  const [slugError, setSlugError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
      setSlugError(null);
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
  }

  function handleSlugBlur() {
    const trimmed = slug.trim();
    if (trimmed && !SLUG_REGEX.test(trimmed)) {
      setSlugError(
        "Slug must be lowercase letters, numbers, and hyphens only (e.g. about-us).",
      );
    } else {
      setSlugError(null);
    }
  }

  function resetSlugToAuto() {
    setSlug(generateSlug(title));
    setSlugManuallyEdited(false);
    setSlugError(null);
  }

  function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    if (!trimmedSlug) {
      toast.error("Slug is required");
      return;
    }
    if (!SLUG_REGEX.test(trimmedSlug)) {
      toast.error("Slug must be lowercase letters, numbers, and hyphens only");
      return;
    }

    onSubmit({
      title: trimmedTitle,
      slug: trimmedSlug,
      content,
      isPublished,
    });
  }

  const isValid =
    title.trim().length > 0 && slug.trim().length > 0 && !slugError;

  return (
    <div
      role="dialog"
      aria-label={initial ? "Edit page" : "New page"}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">
          {initial ? "Edit Page" : "Add Page"}
        </h3>
        <button
          onClick={onCancel}
          aria-label="Close form"
          className="text-muted-foreground hover:text-foreground"
        >
          <IconX size={16} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Page title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        aria-label="Page title"
        className="input text-xs w-full"
      />

      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Slug:
          </span>
          <input
            type="text"
            placeholder="page-slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={handleSlugBlur}
            aria-label="Page slug"
            aria-invalid={!!slugError}
            className={`input text-xs flex-1 font-mono ${
              slugError ? "border-danger focus:border-danger" : ""
            }`}
          />
          {slugManuallyEdited && (
            <button
              type="button"
              onClick={resetSlugToAuto}
              title="Reset slug to auto-generated"
              aria-label="Reset slug to auto-generated"
              className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <IconArrowBackUp size={14} />
            </button>
          )}
        </div>
        {slugError && (
          <p className="mt-1 text-[11px] text-danger">{slugError}</p>
        )}
      </div>

      <textarea
        placeholder="Page content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        aria-label="Page content"
        className="input text-xs w-full min-h-[200px] font-mono"
      />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-xs text-foreground">Published</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !isValid}
          className="btn-primary text-xs py-2 disabled:opacity-40"
        >
          {saving ? "Saving..." : initial ? "Update" : "Create"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-xs py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminStaticPagesPage() {
  usePageTitle("Static Pages");
  const confirmDelete = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);

  const pagesQuery = useApiQuery<{ pages: StaticPage[] }>(
    ["admin", "static-pages"],
    "/api/admin/static-pages",
  );
  const pages = pagesQuery.data?.pages ?? [];
  const loading = pagesQuery.isPending;

  function openCreate() {
    setEditingPage(null);
    setShowForm(true);
  }

  function openEdit(page: StaticPage) {
    setEditingPage(page);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingPage(null);
  }

  const saveMutation = useMutation({
    mutationFn: (input: StaticPageInput) =>
      editingPage
        ? api.put(`/api/admin/static-pages/${editingPage.id}`, input)
        : api.post("/api/admin/static-pages", input),
    onSuccess: () => {
      toast.success(editingPage ? "Page updated" : "Page created");
      cancelForm();
      void pagesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (input: StaticPageInput) => {
    saveMutation.mutate(input);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/static-pages/${id}`),
    onSuccess: () => {
      toast.success("Page deleted");
      void pagesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (id: string, title: string) => {
    if (deleteMutation.isPending) return;
    if (
      !(await confirmDelete({
        title: "Delete Page",
        message: `Delete page "${title}"? This cannot be undone.`,
      }))
    )
      return;

    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Static Pages"
        description="Manage static content pages (About, Terms, Privacy, etc.)."
        breadcrumbs={[{ label: "Static Pages", href: "/admin/static-pages" }]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void pagesQuery.refetch()}
              aria-label="Refresh page list"
              className="btn-secondary text-xs py-2 flex items-center gap-1.5"
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <button
              onClick={openCreate}
              aria-label="Create new page"
              className="btn-primary text-xs py-2 flex items-center gap-1.5"
            >
              <IconPlus size={14} /> Add Page
            </button>
          </div>
        }
      />

      {showForm && (
        <StaticPageForm
          initial={editingPage}
          saving={saveMutation.isPending}
          onCancel={cancelForm}
          onSubmit={handleSubmit}
        />
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          /{pg.slug}
                        </span>
                        {pg.isPublished && (
                          <Link
                            href={`/${pg.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live page"
                            aria-label={`View live page for ${pg.title}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <IconExternalLink size={12} />
                          </Link>
                        )}
                      </div>
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
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === pg.id
                          }
                          aria-label={`Edit ${pg.title}`}
                          title="Edit"
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(pg.id, pg.title)}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === pg.id
                          }
                          aria-label={`Delete ${pg.title}`}
                          title="Delete"
                          className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors disabled:opacity-40"
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
