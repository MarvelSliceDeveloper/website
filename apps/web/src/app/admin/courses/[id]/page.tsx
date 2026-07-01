"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import ModuleStudyMaterialsSection from "./_components/ModuleStudyMaterialsSection";
import { toast } from "sonner";

type Resource = {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: Resource[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price: number;
  category: string | null;
  tags: string[] | null;
  learningObjectives: string[] | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  modules: Module[];
  _count: { batches: number };
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  batch: { id: string; name: string };
  module: { id: string; title: string } | null;
  recording: { id: string; syncedAt: string } | null;
};

type Recording = {
  id: string;
  sharePointUrl: string;
  duration: number;
  syncedAt: string;
  session: {
    id: string;
    scheduledAt: string;
    joinUrl: string;
    module: { id: string; title: string } | null;
    batch: { id: string; name: string };
  };
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-warning/15 text-warning border-warning/25",
  PUBLISHED: "bg-success/15 text-success border-success/25",
  ARCHIVED: "bg-muted/15 text-muted border-muted/25",
};

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const ALLOWED_THUMBNAIL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [activeTab, setActiveTab] = useState<"details" | "content" | "materials" | "sessions" | "recordings">("details");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
  });

  const fetchCourse = useCallback(async () => {
    try {
      const data = await api.get<Course>(`/api/admin/courses/${id}`);
      setCourse(data);
      setForm({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category || "",
      });
    } catch {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    api.get<Course>(`/api/admin/courses/${id}`)
      .then((data) => {
        setCourse(data);
        setForm({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category || "",
        });
      })
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveCourse = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/courses/${id}`, {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category || null,
      });
      toast.success("Course saved!");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      toast.error("Thumbnail must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error("Thumbnail must be 5 MB or smaller.");
      return;
    }
    setThumbnailUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("thumbnail", file);
      await api.post(`/api/admin/courses/${id}/thumbnail`, uploadData);
      toast.success("Thumbnail updated.");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload thumbnail");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const result = await api.post<{ published: boolean; checklist: ChecklistItem[] }>(
        `/api/admin/courses/${id}/publish`
      );
      if (!result.published) {
        const fails = result.checklist
          .filter((c: ChecklistItem) => !c.passed)
          .map((c: ChecklistItem) => `\u2022 ${c.item}`)
          .join("\n");
        toast.error(`Cannot publish:\n${fails}`);
        return;
      }
      toast.success("Course published");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.post(`/api/admin/courses/${id}/unpublish`);
      toast.success("Course unpublished");
      fetchCourse();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unpublish");
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Archive this course? Students will lose access.")) return;
    try {
      await api.delete(`/api/admin/courses/${id}`);
      toast.success("Course archived");
      router.push("/admin/courses");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to archive course");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">Course not found</p>
        <Link href="/admin/courses" className="btn-primary mt-4 inline-flex">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/courses"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 inline-flex items-center gap-1"
          >
            ← Back to Courses
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[course.status]}`}>
              {course.status}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Slug: /{course.slug} · {sortedModules.length} module{sortedModules.length !== 1 ? "s" : ""} · {course._count.batches} batch{course._count.batches !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          {course.status === "DRAFT" && (
            <button onClick={handlePublish} className="btn-primary">Publish</button>
          )}
          {course.status === "PUBLISHED" && (
            <button onClick={handleUnpublish} className="btn-secondary">Unpublish</button>
          )}
          <button onClick={handleDeleteCourse} className="btn-danger">Archive</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/50">
        <TabButton label="Course Details" active={activeTab === "details"} onClick={() => setActiveTab("details")} />
        <TabButton label="Content" active={activeTab === "content"} onClick={() => setActiveTab("content")} />
        <TabButton label="Study Materials" active={activeTab === "materials"} onClick={() => setActiveTab("materials")} />
        <TabButton label="Live Sessions" active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} />
        <TabButton label="Recordings" active={activeTab === "recordings"} onClick={() => setActiveTab("recordings")} />
      </div>

      {/* Course Details Tab */}
      {activeTab === "details" && (
        <CourseDetailsTab
          course={course}
          form={form}
          setForm={setForm}
          thumbnailUploading={thumbnailUploading}
          saving={saving}
          onThumbnailUpload={handleThumbnailUpload}
          onSave={handleSaveCourse}
        />
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <ContentTab courseId={id} modules={sortedModules} onContentChanged={fetchCourse} />
      )}

      {/* Study Materials Tab */}
      {activeTab === "materials" && (
        <ModuleStudyMaterialsSection
          courseId={id}
          modules={course.modules}
          onResourcesUpdated={fetchCourse}
        />
      )}

      {/* Live Sessions Tab */}
      {activeTab === "sessions" && (
        <SessionsTab courseId={id} />
      )}

      {/* Recordings Tab */}
      {activeTab === "recordings" && (
        <RecordingsTab courseId={id} />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

type ChecklistItem = {
  item: string;
  passed: boolean;
  message?: string;
};

type CourseFormData = {
  title: string;
  description: string;
  price: number;
  category: string;
};

function CourseDetailsTab({
  course, form, setForm, thumbnailUploading, saving, onThumbnailUpload, onSave,
}: {
  course: Course; form: CourseFormData; setForm: React.Dispatch<React.SetStateAction<CourseFormData>>; thumbnailUploading: boolean; saving: boolean; onThumbnailUpload: (file: File) => void; onSave: () => void;
}) {
  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Course Details</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Thumbnail</label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-28 overflow-hidden rounded-lg border border-border bg-card flex items-center justify-center text-xl">
            {course.thumbnailUrl ? (
              <Image src={course.thumbnailUrl} alt="Course thumbnail" width={112} height={80} className="h-full w-full object-cover" unoptimized />
            ) : "\uD83D\uDCDA"}
          </div>
          <div className="space-y-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onThumbnailUpload(file);
                event.target.value = "";
              }}
              className="field"
              disabled={thumbnailUploading}
            />
            <p className="text-xs text-muted">JPG, PNG, or WebP. Max 5 MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p: CourseFormData) => ({ ...p, title: e.target.value }))}
          className="field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p: CourseFormData) => ({ ...p, description: e.target.value }))}
          className="field min-h-[100px] resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((p: CourseFormData) => ({ ...p, category: e.target.value }))}
            className="field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Price (\u20B9)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((p: CourseFormData) => ({ ...p, price: Number(e.target.value) }))}
            className="field"
            min={0}
          />
        </div>
      </div>

      <button onClick={onSave} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

// --- Content Tab (Modules) ---

function ContentTab({ courseId, modules, onContentChanged }: { courseId: string; modules: Module[]; onContentChanged: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Modules ({modules.length})</h2>
      </div>

      {modules.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No modules yet. Add your first module below.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              courseId={courseId}
              onChanged={onContentChanged}
            />
          ))}
        </div>
      )}

      <AddModuleForm courseId={courseId} onAdded={onContentChanged} />
    </div>
  );
}

function ModuleCard({ module: mod, courseId, onChanged }: {
  module: Module; courseId: string; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: mod.title, description: mod.description || "", videoUrl: mod.videoUrl || "" });

  const handleSave = async () => {
    try {
      await api.put(`/api/admin/courses/modules/${mod.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        videoUrl: editForm.videoUrl || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update module");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete module "${mod.title}"?`)) return;
    try {
      await api.delete(`/api/admin/courses/modules/${mod.id}`);
      onChanged();
    } catch { toast.error("Failed to delete module"); }
  };

  const handleMove = async (direction: "up" | "down") => {
    try {
      const allModules = await api.get<Course>(`/api/admin/courses/${courseId}`);
      const sorted = [...allModules.modules].sort((a: Module, b: Module) => a.order - b.order);
      const idx = sorted.findIndex((m: Module) => m.id === mod.id);
      if ((direction === "up" && idx === 0) || (direction === "down" && idx === sorted.length - 1)) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      await api.patch(`/api/admin/courses/${courseId}/modules/reorder`, { moduleIds: sorted.map((m: Module) => m.id) });
      onChanged();
    } catch { toast.error("Failed to reorder"); }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="flex flex-col gap-0.5 pt-1">
          <button onClick={() => handleMove("up")} className="text-muted hover:text-foreground disabled:opacity-20 text-xs" title="Move up">▲</button>
          <button onClick={() => handleMove("down")} className="text-muted hover:text-foreground disabled:opacity-20 text-xs" title="Move down">▼</button>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary-hover">{mod.order + 1}</div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input type="text" value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} className="field" />
              <input type="text" value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="field" />
              <input type="url" value={editForm.videoUrl} onChange={(e) => setEditForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL" className="field" />
              <div className="flex gap-2">
                <button onClick={handleSave} className="btn-primary text-xs">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">{mod.title}</p>
          )}
          {!editing && mod.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{mod.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(!editing)} className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} className="text-xs font-medium text-danger hover:text-danger/80 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function AddModuleForm({ courseId, onAdded }: { courseId: string; onAdded: () => void }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", videoUrl: "" });
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/api/admin/courses/${courseId}/modules`, {
        title: form.title,
        description: form.description || undefined,
        videoUrl: form.videoUrl || undefined,
      });
      setForm({ title: "", description: "", videoUrl: "" });
      setShow(false);
      onAdded();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to add module"); }
    finally { setAdding(false); }
  };

  return (
    <div className="glass-card p-4">
      {show ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Module title" className="field" required />
          <input type="text" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description (optional)" className="field" />
          <input type="url" value={form.videoUrl} onChange={(e) => setForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL (optional)" className="field" />
          <div className="flex gap-2">
            <button type="submit" disabled={adding} className="btn-primary text-sm">{adding ? "Adding..." : "Add Module"}</button>
            <button type="button" onClick={() => setShow(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShow(true)} className="btn-secondary w-full justify-center">+ Add Module</button>
      )}
    </div>
  );
}

// --- Live Sessions Tab ---

function SessionsTab({ courseId }: { courseId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: Session[] }>(`/api/admin/courses/${courseId}/sessions`);
      setSessions(data.sessions || []);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => {
    api.get<{ sessions: Session[] }>(`/api/admin/courses/${courseId}/sessions`)
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSync = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully!");
      fetchSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No recording found yet.");
    } finally { setSyncingId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Live Sessions ({sessions.length})</h2>
        <Link href="/admin/sessions/new" className="btn-primary text-xs">+ Schedule Session</Link>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center"><p className="text-muted animate-pulse text-sm">Loading sessions...</p></div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No sessions scheduled for this course yet.</p>
          <Link href="/admin/sessions/new" className="btn-primary mt-4 inline-flex text-sm">+ Schedule Session</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(session.scheduledAt).toLocaleString("en-IN", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.batch.name}
                  {session.module && ` \u00B7 ${session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {session.recording ? (
                    <span className="text-[10px] uppercase font-medium bg-success/15 text-success px-1.5 py-0.5 rounded">Recording</span>
                  ) : new Date(session.scheduledAt) > new Date() ? (
                    <span className="text-[10px] uppercase font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded">Upcoming</span>
                  ) : (
                    <span className="text-[10px] uppercase font-medium bg-warning/15 text-warning px-1.5 py-0.5 rounded">No Recording</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {!session.recording && new Date(session.scheduledAt) <= new Date() && (
                  <button onClick={() => handleSync(session.id)} disabled={syncingId === session.id}
                    className="btn-secondary text-xs px-2.5 py-1.5">
                    {syncingId === session.id ? "Syncing..." : "Sync"}
                  </button>
                )}
                <a href={session.joinUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs shrink-0">
                  {new Date(session.scheduledAt) > new Date() ? "Join \u2192" : "View"}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Recordings Tab ---

function RecordingsTab({ courseId }: { courseId: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = useCallback(async () => {
    try {
      const data = await api.get<{ recordings: Recording[] }>(`/api/admin/courses/${courseId}/recordings`);
      setRecordings(data.recordings || []);
    } catch { setRecordings([]); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => {
    api.get<{ recordings: Recording[] }>(`/api/admin/courses/${courseId}/recordings`)
      .then((data) => setRecordings(data.recordings || []))
      .catch(() => setRecordings([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Recordings ({recordings.length})</h2>

      {loading ? (
        <div className="glass-card p-8 text-center"><p className="text-muted animate-pulse text-sm">Loading recordings...</p></div>
      ) : recordings.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No recordings available yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordings.map((rec) => (
            <div key={rec.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {new Date(rec.session.scheduledAt).toLocaleString("en-IN", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rec.session.batch.name}
                  {rec.session.module && ` \u00B7 ${rec.session.module.title}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    {rec.duration > 0 ? `${Math.floor(rec.duration / 60)}m ${rec.duration % 60}s` : "Duration unknown"}
                  </span>
                  <span className="text-xs text-muted">\u00B7</span>
                  <span className="text-xs text-muted">
                    Synced {new Date(rec.syncedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <a href={rec.session.joinUrl} target="_blank" rel="noopener noreferrer"
                className="btn-secondary text-xs shrink-0 ml-2">View Recording</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
