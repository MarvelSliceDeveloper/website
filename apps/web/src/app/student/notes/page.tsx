"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import {
  IconNotes,
  IconTrash,
  IconFilter,
  IconChevronRight,
  IconBook,
  IconStar,
  IconPlus,
  IconX,
  IconDownload,
} from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import StudentPortalShell from "@/components/StudentPortalShell";
import RichEditor from "@/components/editor/RichEditor";
import { usePageTitle } from "@/lib/use-page-title";
import { SearchInput } from "@/components/ui/SearchInput";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CourseInfo {
  id: string;
  title: string;
}

interface NoteItem {
  id: string;
  title: string;
  body: string;
  moduleId: string | null;
  isSticky: boolean;
  createdAt: string;
  updatedAt: string;
  course: CourseInfo;
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

const NOTES_PAGE_SIZE = 100;

function sanitizeFilename(name: string): string {
  const cleaned = (name || "note").replace(/[^\w\d -]/g, "").trim();
  return cleaned.replace(/\s+/g, "_") || "note";
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function noteToPlainText(note: NoteItem): string {
  const course = note.course?.title || "Unknown Course";
  const updated = new Date(note.updatedAt).toLocaleDateString("en-IN");
  return [
    `Title: ${note.title || "Untitled Note"}`,
    `Course: ${course}`,
    `Updated: ${updated}`,
    "",
    stripHtml(note.body || "").trim(),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Shared editor panel — used for both "create" and "edit". Giving both flows
// the same full-height writing surface fixes the old bug where the create
// modal (120px editor, max-w-lg) was smaller than the inline edit view
// (150px), and both were too small for writing a real note.
// ---------------------------------------------------------------------------

interface NoteFormValue {
  courseId: string;
  title: string;
  body: string;
  isSticky: boolean;
}

interface NoteEditorPanelProps {
  mode: "create" | "edit";
  courses: CourseInfo[];
  initialValue: NoteFormValue;
  saving: boolean;
  onClose: () => void;
  onSubmit: (value: NoteFormValue) => void;
  onDelete?: () => void;
  onDownload?: (format: "txt" | "html") => void;
  deleting?: boolean;
  meta?: { createdAt: string; updatedAt: string };
}

function NoteEditorPanel({
  mode,
  courses,
  initialValue,
  saving,
  onClose,
  onSubmit,
  onDelete,
  onDownload,
  deleting,
  meta,
}: NoteEditorPanelProps) {
  const [courseId, setCourseId] = useState(initialValue.courseId);
  const [title, setTitle] = useState(initialValue.title);
  const [body, setBody] = useState(initialValue.body);
  const [isSticky, setIsSticky] = useState(initialValue.isSticky);
  const [errors, setErrors] = useState<{ courseId?: string; title?: string }>(
    {},
  );

  // Close on Escape, and stop background scroll while the panel is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function validate(): boolean {
    const next: { courseId?: string; title?: string } = {};
    if (mode === "create" && !courseId)
      next.courseId = "Select a course to attach this note to";
    if (title.length > 200)
      next.title = "Title must be 200 characters or fewer";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ courseId, title, body, isSticky });
  }

  const dirty =
    title !== initialValue.title ||
    body !== initialValue.body ||
    isSticky !== initialValue.isSticky ||
    courseId !== initialValue.courseId;

  function handleClose() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  }

  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      {/* Scrim */}
      <button
        aria-label="Close editor"
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Popup note card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "Create note" : "Edit note"}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        style={{ maxHeight: "min(82vh, 19220px)" }}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Header — a warm "sticky note" strip so the popup reads as a note, not a form */}
          <div
            className={`flex items-start justify-between gap-4 px-6 pt-5 pb-4 shrink-0 transition-colors ${
              isSticky ? "bg-warning/10" : "bg-card-hover/40"
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <IconNotes size={14} className="text-muted shrink-0" />
                <p className="sp-eyebrow">
                  {mode === "create" ? "New note" : "Editing note"}
                </p>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled note"
                maxLength={200}
                autoFocus
                className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted focus:outline-none"
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSticky(!isSticky)}
                title={isSticky ? "Unpin note" : "Pin to top"}
                className={`rounded-lg p-2 transition-colors ${
                  isSticky
                    ? "text-warning"
                    : "text-muted-foreground hover:bg-card-hover hover:text-warning"
                }`}
              >
                <IconStar
                  size={18}
                  className={isSticky ? "fill-current" : ""}
                />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>
          </div>

          {/* Course row */}
          <div className="border-b border-border/40 px-6 py-2.5 shrink-0">
            {mode === "create" ? (
              <>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="field w-full max-w-xs text-sm"
                >
                  <option value="">Select a course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="mt-1 text-xs text-danger">{errors.courseId}</p>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card-hover/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <IconBook size={12} />
                {courses.find((c) => c.id === courseId)?.title ||
                  "Unknown course"}
              </span>
            )}
          </div>

          {/* Editor — scrolls within the fixed-height popup */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <RichEditor
              content={body}
              onChange={setBody}
              placeholder="Start writing..."
              minHeight="480px"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border/40 px-6 py-3.5 shrink-0 bg-card-hover/20">
            <div className="text-[11px] text-muted">
              {meta
                ? `Last edited ${new Date(meta.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : "Notes save to this course automatically"}
            </div>
            <div className="flex items-center gap-2">
              {mode === "edit" && onDownload && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDownloadMenuOpen((v) => !v)}
                    title="Download this note"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                  >
                    <IconDownload size={14} />
                    Download
                  </button>
                  {downloadMenuOpen && (
                    <>
                      <button
                        aria-label="Close download menu"
                        onClick={() => setDownloadMenuOpen(false)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div className="absolute bottom-full right-0 z-20 mb-1.5 w-36 overflow-hidden rounded-lg border border-border/50 bg-background shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            onDownload("txt");
                            setDownloadMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-card-hover hover:text-foreground"
                        >
                          <IconDownload size={13} /> Plain text (.txt)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDownload("html");
                            setDownloadMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-card-hover hover:text-foreground"
                        >
                          <IconDownload size={13} /> HTML (.html)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  <IconTrash size={14} />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (mode === "create" && !courseId)}
                className="btn-primary text-xs"
              >
                {saving
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Create note"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const EMPTY_FORM: NoteFormValue = {
  courseId: "",
  title: "",
  body: "",
  isSticky: false,
};

export default function StudentNotesPage() {
  usePageTitle("Notes");
  const router = useRouter();
  const confirmDelete = useConfirmDialog();
  const queryClient = useQueryClient();

  // UI-only state (filters, panel open/closed). Server data lives in the
  // query cache below.
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [panel, setPanel] = useState<
    { mode: "create" } | { mode: "edit"; note: NoteItem } | null
  >(null);

  // Notes are fetched in pages of NOTES_PAGE_SIZE until every note is loaded.
  const notesQuery = useQuery({
    queryKey: ["student", "notes"],
    queryFn: async () => {
      const all: NoteItem[] = [];
      let fetched = 0;
      let total = 0;
      do {
        const params = new URLSearchParams();
        params.set("page", String(Math.floor(fetched / NOTES_PAGE_SIZE) + 1));
        params.set("limit", String(NOTES_PAGE_SIZE));
        const data = await api.get<{ items: NoteItem[]; total: number }>(
          `/api/notes?${params.toString()}`,
        );
        const items = data.items || [];
        all.push(...items);
        fetched += items.length;
        total = data.total || 0;
      } while (fetched < total);
      return all;
    },
    staleTime: 30_000,
  });
  const coursesQuery = useApiQuery<{ courses: CourseInfo[] }>(
    ["student", "courses-enrolled"],
    "/api/courses/enrolled",
  );
  const meQuery = useApiQuery<{ user: { name: string; email: string } }>(
    ["auth", "me"],
    "/api/auth/me",
  );

  const notes = notesQuery.data ?? [];
  const courses = coursesQuery.data?.courses ?? [];
  const loading = notesQuery.isPending;
  const studentName = meQuery.data?.user?.name || "Student";
  const studentEmail = meQuery.data?.user?.email || "";

  // CRUD mutations keep the cached note list in sync (prepend / update /
  // remove) and reconcile with the server afterwards.
  const createMutation = useMutation({
    mutationFn: (form: NoteFormValue) =>
      api.post<{ note: NoteItem }>("/api/notes", form),
    onSuccess: (res) => {
      queryClient.setQueryData<NoteItem[]>(["student", "notes"], (old) => [
        res.note,
        ...(old ?? []),
      ]);
      setPanel(null);
      toast.success("Note created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ...form }: NoteFormValue & { id: string }) =>
      api.patch(`/api/notes/${id}`, form),
    onSuccess: (_, { id, title, body, isSticky }) => {
      queryClient.setQueryData<NoteItem[]>(["student", "notes"], (old) =>
        (old ?? []).map((n) =>
          n.id === id ? { ...n, title, body, isSticky } : n,
        ),
      );
      setPanel(null);
      toast.success("Note updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notes/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NoteItem[]>(["student", "notes"], (old) =>
        (old ?? []).filter((n) => n.id !== id),
      );
      setPanel((p) => (p?.mode === "edit" && p.note.id === id ? null : p));
      toast.success("Note deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  async function deleteNote(id: string) {
    const confirmed = await confirmDelete({
      title: "Delete Note",
      message: "Are you sure you want to delete this note?",
    });
    if (!confirmed) return;
    deleteMutation.mutate(id);
  }

  function downloadNote(note: NoteItem, format: "txt" | "html") {
    const date = new Date(note.updatedAt).toISOString().slice(0, 10);
    const base = `${sanitizeFilename(note.title)}_${date}`;
    if (format === "txt") {
      downloadTextFile(
        `${base}.txt`,
        noteToPlainText(note),
        "text/plain;charset=utf-8",
      );
    } else {
      downloadTextFile(
        `${base}.html`,
        note.body || "",
        "text/html;charset=utf-8",
      );
    }
    toast.success("Note downloaded");
  }

  function downloadAllNotes() {
    if (filteredNotes.length === 0) {
      toast.error("No notes to download");
      return;
    }
    const separator = "\n\n" + "=".repeat(48) + "\n\n";
    const content = [
      `My Notes - ${new Date().toLocaleDateString("en-IN")}`,
      `Total: ${filteredNotes.length}`,
      "",
      filteredNotes.map(noteToPlainText).join(separator),
    ].join("\n");
    downloadTextFile(
      `my-notes_${new Date().toISOString().slice(0, 10)}.txt`,
      content,
      "text/plain;charset=utf-8",
    );
    toast.success("All notes downloaded");
  }

  const filteredNotes = notes
    .filter((note) => !courseFilter || note.course?.id === courseFilter)
    .filter((note) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        stripHtml(note.body).toLowerCase().includes(q) ||
        note.course?.title.toLowerCase().includes(q)
      );
    });

  const stickyCount = notes.filter((n) => n.isSticky).length;
  const notesThisWeek = notes.filter((n) => {
    const d = new Date(n.updatedAt);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => {
        router.push("/student");
      }}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Notes",
              value: notes.length,
              icon: IconNotes,
              bg: "bg-primary/15",
              text: "text-primary",
            },
            {
              label: "Sticky Notes",
              value: stickyCount,
              icon: IconStar,
              bg: "bg-warning/15",
              text: "text-warning",
            },
            {
              label: "Edited This Week",
              value: notesThisWeek,
              icon: IconChevronRight,
              bg: "bg-brand-blue-tint",
              text: "text-brand-blue",
            },
            {
              label: "Courses",
              value: courses.length,
              icon: IconBook,
              bg: "bg-success/15",
              text: "text-success",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-3.5 group hover:-translate-y-0.5 transition-all cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                  <p className={`text-xl font-black ${stat.text}`}>
                    {loading ? "\u2014" : stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform`}
                >
                  <stat.icon size={16} stroke={1.8} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="sp-eyebrow">Student</p>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                My Notes
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadAllNotes}
                className="btn-secondary flex items-center gap-1.5 text-sm shrink-0"
              >
                <IconDownload size={16} /> Download All
              </button>
              <button
                onClick={() => setPanel({ mode: "create" })}
                className="btn-primary flex items-center gap-1.5 text-sm shrink-0"
              >
                <IconPlus size={16} /> New Note
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search notes..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">
            <div className="glass-card p-2 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted px-3 pt-2 pb-1">
                <IconFilter size={12} className="inline mr-1 -mt-0.5" /> Courses
              </p>
              <button
                onClick={() => setCourseFilter("")}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !courseFilter
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                }`}
              >
                <IconNotes size={15} />
                All Notes
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {notes.length}
                </span>
              </button>
              {courses.map((c) => {
                const count = notes.filter((n) => n.course?.id === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCourseFilter(c.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      courseFilter === c.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                    }`}
                  >
                    <IconBook size={15} />
                    <span className="truncate">{c.title}</span>
                    <span className="ml-auto text-xs text-muted">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-9 xl:col-span-9 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-card-hover/60 border border-border/40"
                  />
                ))}
              </div>
            ) : notesQuery.isError ? (
              <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-base font-semibold text-foreground">
                  Failed to load notes
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Please try again.
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconNotes size={32} />
                </div>
                <p className="text-base font-semibold text-foreground">
                  {searchQuery || courseFilter
                    ? "No notes found"
                    : "No notes yet"}
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {searchQuery || courseFilter
                    ? "Try adjusting your search or filter."
                    : "Create your first note to get started."}
                </p>
              </div>
            ) : (
              <>
                {filteredNotes.map((note) => {
                  const borderClass = note.isSticky
                    ? "border-l-warning/40"
                    : note.moduleId
                      ? "border-l-accent/30"
                      : "border-l-primary/20";

                  return (
                    <div
                      key={note.id}
                      className={`glass-card border-l-4 overflow-hidden transition-all ${borderClass}`}
                    >
                      <button
                        onClick={() => setPanel({ mode: "edit", note })}
                        className="w-full text-left p-4 hover:bg-card-hover/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="inline-flex items-center rounded-full border border-border/50 bg-card-hover/50 px-2 py-0.5 text-[10px] font-medium text-muted">
                                {note.course?.title || "Unknown Course"}
                              </span>
                              {note.moduleId && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-brand-blue/20 bg-brand-blue-tint px-2 py-0.5 text-[10px] font-medium text-brand-blue">
                                  Module
                                </span>
                              )}
                              {note.isSticky && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/5 px-2 py-0.5 text-[10px] font-medium text-warning">
                                  <IconStar
                                    size={10}
                                    className="fill-current"
                                  />
                                  Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-1">
                              {note.title || "Untitled Note"}
                            </p>
                            {note.body && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {stripHtml(note.body)}
                              </p>
                            )}
                            <p className="text-[11px] text-muted mt-1">
                              {new Date(note.updatedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <IconChevronRight
                            size={15}
                            className="shrink-0 text-muted mt-1"
                          />
                        </div>
                      </button>
                      <div className="flex flex-wrap justify-end gap-1 border-t border-border/40 px-4 py-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadNote(note, "txt");
                          }}
                          title="Download as plain text"
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <IconDownload size={12} /> .txt
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadNote(note, "html");
                          }}
                          title="Download as HTML"
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <IconDownload size={12} /> .html
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <IconTrash size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {panel?.mode === "create" && (
        <NoteEditorPanel
          mode="create"
          courses={courses}
          initialValue={EMPTY_FORM}
          saving={createMutation.isPending}
          onClose={() => setPanel(null)}
          onSubmit={(value) => createMutation.mutate(value)}
        />
      )}

      {panel?.mode === "edit" && (
        <NoteEditorPanel
          mode="edit"
          courses={courses}
          initialValue={{
            courseId: panel.note.course?.id ?? "",
            title: panel.note.title,
            body: panel.note.body,
            isSticky: panel.note.isSticky,
          }}
          meta={{
            createdAt: panel.note.createdAt,
            updatedAt: panel.note.updatedAt,
          }}
          saving={saveMutation.isPending}
          deleting={deleteMutation.isPending}
          onClose={() => setPanel(null)}
          onSubmit={(value) =>
            saveMutation.mutate({ id: panel.note.id, ...value })
          }
          onDelete={() => deleteNote(panel.note.id)}
          onDownload={(format) => downloadNote(panel.note, format)}
        />
      )}
    </StudentPortalShell>
  );
}
