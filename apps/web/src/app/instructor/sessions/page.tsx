"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  IconVideo,
  IconRefresh,
  IconUsers,
  IconCalendar,
  IconCheck,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconPlus,
  IconLink
} from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";

type Course = {
  id: string;
  title: string;
};

type Batch = {
  id: string;
  name: string;
  course: { id: string; title: string };
};

type Module = {
  id: string;
  title: string;
  order: number;
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batchId: string;
  moduleId: string | null;
  batch: { id: string; name: string; course: { id: string; title: string } };
  recording: { id: string } | null;
};

type AttendanceRecord = {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InstructorSessionsPage() {
  return (
    <Suspense fallback={
      <div className="glass-card p-12 text-center">
        <p className="text-muted animate-pulse">Loading sessions...</p>
      </div>
    }>
      <SessionsPageContent />
    </Suspense>
  );
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Attendance modal state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // CRUD states
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const [form, setForm] = useState({
    courseId: "",
    batchId: "",
    moduleId: "",
    title: "",
    startDateTime: "",
    endDateTime: "",
    customJoinUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get<{ sessions?: Session[] }>("/api/sessions");
      setSessions(Array.isArray(response.sessions) ? response.sessions : []);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Authentication") || err.message?.includes("401")) {
        window.location.href = "/login";
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch courses when create modal opens
  const openCreateModal = async () => {
    setShowCreateModal(true);
    setForm({
      courseId: "",
      batchId: "",
      moduleId: "",
      title: "",
      startDateTime: "",
      endDateTime: "",
      customJoinUrl: "",
    });
    setLoadingCourses(true);
    try {
      const data = await api.get<{ courses: Course[] }>("/api/admin/courses?limit=100");
      setCourses(data.courses || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch batches & modules when course selection changes
  useEffect(() => {
    if (!form.courseId) {
      setBatches([]);
      setModules([]);
      return;
    }

    async function loadCourseOptions() {
      setLoadingBatches(true);
      setLoadingModules(true);
      try {
        const batchData = await api.get<Batch[]>(`/api/admin/batches?courseId=${form.courseId}`);
        setBatches(Array.isArray(batchData) ? batchData : []);

        const courseData = await api.get<{ modules: Module[] }>(`/api/admin/courses/${form.courseId}`);
        setModules(courseData.modules || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBatches(false);
        setLoadingModules(false);
      }
    }

    loadCourseOptions();
  }, [form.courseId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/api/sessions", {
        batchId: form.batchId,
        moduleId: form.moduleId || undefined,
        title: form.title,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
        customJoinUrl: form.customJoinUrl || undefined,
      });

      setShowCreateModal(false);
      fetchSessions();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (session: Session) => {
    setEditingSession(session);
    setForm({
      courseId: session.batch?.course?.id || "",
      batchId: session.batchId,
      moduleId: session.moduleId || "",
      title: session.joinUrl.includes("fallback") ? "Live Session" : "Scheduled Session",
      startDateTime: new Date(session.scheduledAt).toISOString().slice(0, 16),
      endDateTime: new Date(new Date(session.scheduledAt).getTime() + 3600000).toISOString().slice(0, 16),
      customJoinUrl: session.createdFrom === "LMS_CUSTOM" ? session.joinUrl : "",
    });
    setShowEditModal(true);
  };

  const handleEditSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setSubmitting(true);

    try {
      await api.patch(`/api/sessions/${editingSession.id}`, {
        title: form.title || undefined,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
      });

      setShowEditModal(false);
      setEditingSession(null);
      fetchSessions();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to cancel this live session? This will mark it as ended.")) return;

    try {
      await api.delete(`/api/sessions/${sessionId}`);
      toast.success("Session cancelled successfully!");
      fetchSessions();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSyncRecording = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      toast.success("Recording synced successfully! The video is now available for students.");
      fetchSessions();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewAttendance = async (session: Session) => {
    setSelectedSession(session);
    setLoadingAttendance(true);
    try {
      const data = await api.get<{ attendance: AttendanceRecord[] }>(`/api/attendance/${session.id}`);
      setAttendance(data.attendance || []);
    } catch (err: any) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const now = new Date();
  let filteredSessions = sessions;

  if (statusFilter === "UPCOMING") {
    filteredSessions = sessions.filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now);
  } else if (statusFilter === "PAST") {
    filteredSessions = sessions.filter((s) => s.endedAt || new Date(s.scheduledAt) < now);
  }

  const upcoming = filteredSessions.filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now);
  const past = filteredSessions.filter((s) => s.endedAt || new Date(s.scheduledAt) < now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Live Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage, schedule, and configure your live classes.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-1">
          <IconPlus size={16} /> Schedule Session
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading live sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">🎥</div>
          <p className="text-lg font-semibold text-foreground">No sessions assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            You do not have any sessions scheduled yet. Click above to schedule your first live session!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
                <span className="live-pulse h-2 w-2 rounded-full bg-emerald-500" />
                Upcoming Live Classes ({upcoming.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {upcoming.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    upcoming
                    onViewAttendance={handleViewAttendance}
                    onEdit={openEditModal}
                    onDelete={handleDeleteSession}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Past Sessions ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    upcoming={false}
                    syncing={syncingId === session.id}
                    onSyncRecording={handleSyncRecording}
                    onViewAttendance={handleViewAttendance}
                    onEdit={openEditModal}
                    onDelete={handleDeleteSession}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="font-bold text-foreground">Schedule Live Session</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground"><IconX size={20} /></button>
            </div>

            <form onSubmit={handleCreateSession} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Course</label>
                <select
                  className="field"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value, batchId: "", moduleId: "" })}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Batch</label>
                  <select
                    className="field"
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    disabled={!form.courseId || loadingBatches}
                    required
                  >
                    <option value="">-- Batch --</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Module</label>
                  <select
                    className="field"
                    value={form.moduleId}
                    onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                    disabled={!form.courseId || loadingModules}
                  >
                    <option value="">-- None / General --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>Mod {m.order}: {m.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Session Title</label>
                <input
                  type="text"
                  className="field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Types and Interfaces Deep Dive"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="field"
                    value={form.startDateTime}
                    onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="field"
                    value={form.endDateTime}
                    onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Custom Join URL (Optional)</label>
                <input
                  type="url"
                  className="field"
                  value={form.customJoinUrl}
                  onChange={(e) => setForm({ ...form, customJoinUrl: e.target.value })}
                  placeholder="e.g. Google Meet, Zoom or standard Teams URL"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs px-4">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs px-4">
                  {submitting ? "Scheduling..." : "Schedule Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="font-bold text-foreground">Edit Live Session</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground"><IconX size={20} /></button>
            </div>

            <form onSubmit={handleEditSession} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Session Title</label>
                <input
                  type="text"
                  className="field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="field"
                    value={form.startDateTime}
                    onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="field"
                    value={form.endDateTime}
                    onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary text-xs px-4">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs px-4">
                  {submitting ? "Updating..." : "Update Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <div>
                <h3 className="font-bold text-foreground">Session Attendance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSession.batch.course.title} · {selectedSession.batch.name}
                </p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground"><IconX size={20} /></button>
            </div>

            <div className="p-4 max-h-[350px] overflow-y-auto">
              {loadingAttendance ? (
                <div className="py-8 text-center text-sm text-muted animate-pulse">Loading attendance sheet...</div>
              ) : attendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No attendance records found. Either no students clicked &quot;Join Now&quot;, or the session hasn&apos;t started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{record.user.name}</p>
                        <p className="text-xs text-muted-foreground">{record.user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <IconCheck size={12} /> Joined
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(record.joinedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card p-3 flex justify-end">
              <button onClick={() => setSelectedSession(null)} className="btn-secondary text-xs px-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  upcoming,
  syncing,
  onSyncRecording,
  onViewAttendance,
  onEdit,
  onDelete
}: {
  session: Session;
  upcoming: boolean;
  syncing?: boolean;
  onSyncRecording?: (id: string) => void;
  onViewAttendance: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-4 border border-border/80 hover:border-violet-500/20 hover:shadow-lg transition-all duration-200 justify-between">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${upcoming ? "bg-violet-500/20 text-violet-400" : "bg-muted/10"
            }`}>
            {upcoming ? "📅" : "🎬"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {new Date(session.scheduledAt).toLocaleString("en-IN", {
                weekday: "short", day: "numeric", month: "short",
                year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {session.batch?.course?.title || "Course Session"}
            </p>
            <p className="text-xs text-muted font-medium mt-0.5 truncate">
              Batch: {session.batch?.name || "General"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] uppercase font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                {session.createdFrom}
              </span>
              {session.recording ? (
                <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <IconCheck size={10} /> Sync Complete
                </span>
              ) : !upcoming ? (
                <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                  Pending Sync
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(session)}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
            title="Edit Session"
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
            title="Cancel Session"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
        <a
          href={session.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs flex-1 justify-center py-1.5 px-3"
        >
          {upcoming ? "Start Class →" : "View Link"}
        </a>

        <button
          onClick={() => onViewAttendance(session)}
          className="btn-secondary text-xs flex-1 justify-center py-1.5 px-3 flex items-center gap-1.5"
        >
          <IconUsers size={14} /> Attendance
        </button>

        {!upcoming && !session.recording && onSyncRecording && (
          <button
            onClick={() => onSyncRecording(session.id)}
            disabled={syncing}
            className="btn-secondary text-xs flex-1 justify-center py-1.5 px-3 flex items-center gap-1 border-violet-500/20 text-violet-400 hover:bg-violet-500/10 disabled:opacity-50"
          >
            <IconRefresh size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Teams"}
          </button>
        )}
      </div>
    </div>
  );
}
