"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { IconNotes, IconTrash, IconFilter, IconChevronRight, IconBook, IconStar, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import StudentPortalShell from "@/components/StudentPortalShell";
import RichEditor from "@/components/editor/RichEditor";

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

export default function StudentNotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editIsSticky, setEditIsSticky] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    courseId: "",
    title: "",
    body: "",
    isSticky: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = courseFilter ? `?courseId=${courseFilter}` : "";
        const data = await api.get<{ notes: NoteItem[] }>(`/api/notes${params}`);
        if (!cancelled) setNotes(data.notes || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
        if (!cancelled) setNotes([]);
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ courses: CourseInfo[] }>("/api/courses/enrolled");
        if (!cancelled) setCourses(data.courses || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    api.get<{ user: { name: string; email: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          setStudentName(res.user.name || "Student");
          setStudentEmail(res.user.email || "");
        }
      })
      .catch(() => { });
  }, []);

  async function deleteNote(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingNoteId === id) setEditingNoteId(null);
      toast.success("Note deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function startEdit(note: NoteItem) {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditIsSticky(note.isSticky || false);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await api.patch(`/api/notes/${id}`, { title: editTitle, body: editBody, isSticky: editIsSticky });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title: editTitle, body: editBody, isSticky: editIsSticky } : n)));
      setEditingNoteId(null);
      toast.success("Note updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setEditTitle("");
    setEditBody("");
    setEditIsSticky(false);
  }

  async function createNote(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const note = await api.post<{ note: NoteItem }>("/api/notes", createForm);
      setNotes((prev) => [note.note, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ courseId: "", title: "", body: "", isSticky: false });
      toast.success("Note created");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      stripHtml(note.body).toLowerCase().includes(q) ||
      note.course.title.toLowerCase().includes(q)
    );
  });

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => {
        router.push("/student");
      }}
    >
      <div className="space-y-6">
        <div>
          <p className="sp-eyebrow">Student</p>
          <div className="flex items-center justify-between gap-3">
            <h1 className="mt-1.5 text-2xl font-bold text-foreground">My Notes</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <IconPlus size={16} /> New Note
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? "s" : ""} across {courses.length} course{courses.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field w-full pl-9 pr-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <IconX size={14} />
              </button>
            )}
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
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!courseFilter
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  }`}
              >
                <IconNotes size={15} />
                All Notes
                <span className="ml-auto text-xs text-muted">{notes.length}</span>
              </button>
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCourseFilter(c.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${courseFilter === c.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                    }`}
                >
                  <IconBook size={15} />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-9 xl:col-span-9 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-card-hover/60 border border-border/40" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                  <IconNotes size={32} />
                </div>
                <p className="text-base font-semibold text-foreground">No notes found</p>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
                  Try adjusting your search or filter.
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`glass-card overflow-hidden transition-all ${editingNoteId === note.id ? "ring-2 ring-primary/30" : ""
                    }`}
                >
                  {editingNoteId === note.id ? (
                    <div className="p-4 space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Note title..."
                        className="field w-full text-sm font-semibold"
                      />
                      <RichEditor
                        content={editBody}
                        onChange={setEditBody}
                        placeholder="Write your note..."
                        minHeight="150px"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="btn-secondary text-xs">
                          Cancel
                        </button>
                        <button onClick={() => saveEdit(note.id)} disabled={saving} className="btn-primary text-xs">
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(note)} className="w-full text-left p-4 hover:bg-card-hover/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center rounded-full border border-border/50 bg-card-hover/50 px-2 py-0.5 text-[10px] font-medium text-muted">
                              {note.course.title}
                            </span>
                            {note.moduleId && (
                              <span className="text-[10px] text-muted-foreground">Module note</span>
                            )}
                            {note.isSticky && (
                              <IconStar size={12} className="text-warning fill-current" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {note.title || "Untitled Note"}
                          </p>
                          {note.body && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {stripHtml(note.body)}
                            </p>
                          )}
                          <p className="text-[11px] text-muted mt-1">
                            {new Date(note.updatedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                        <IconChevronRight size={15} className="shrink-0 text-muted mt-1" />
                      </div>
                    </button>
                  )}
                  <div className={`flex justify-end border-t border-border/40 px-4 py-1.5 ${editingNoteId === note.id ? "hidden" : ""}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <IconTrash size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Create Note</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={createNote} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Course</label>
                <select
                  value={createForm.courseId}
                  onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value })}
                  className="field w-full text-sm"
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Note title..."
                  className="field w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Content</label>
                <RichEditor
                  content={createForm.body}
                  onChange={(body) => setCreateForm({ ...createForm, body })}
                  placeholder="Write your note..."
                  minHeight="120px"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, isSticky: !createForm.isSticky })}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-warning"
                >
                  <IconStar size={14} className={createForm.isSticky ? "text-warning fill-current" : ""} />
                  Pin to top
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={creating || !createForm.courseId} className="btn-primary text-xs">
                    {creating ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentPortalShell>
  );
}