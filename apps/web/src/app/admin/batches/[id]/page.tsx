"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconTrash,
  IconPlus,
  IconEdit,
  IconCalendarEvent,
  IconVideo,
} from "@tabler/icons-react";

type BatchCourse = {
  id: string;
  courseId: string;
  order: number;
  isVisible: boolean;
  isExamRequired?: boolean;
  course: { id: string; title: string; slug: string };
};

type Student = {
  id: string;
  user: { id: string; name: string; email: string };
  appliedAt: string;
};

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  recording: { id: string; syncedAt: string } | null;
};

type Batch = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxStudents: number | null;
  description: string | null;
  course: { id: string; title: string } | null;
  package?: { id: string; name: string } | null;
  instructor: { id: string; name: string; email: string } | null;
  enrollments: Student[];
  packageEnrollmentCourses: {
    enrollment: { user: { id: string; name: string; email: string } };
  }[];
  sessions: Session[];
  _count: {
    enrollments: number;
    packageEnrollmentCourses: number;
    sessions: number;
  };
};

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-accent/15 text-accent border-accent/25",
  ACTIVE: "bg-success/15 text-success border-success/25",
  COMPLETED: "bg-muted/15 text-muted border-muted/25",
};

export default function BatchDetailPage() {
  usePageTitle("Batch Details");
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "sessions" | "courses" | "extensions" | "mentors">(
    "students",
  );
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [togglingExam, setTogglingExam] = useState<string | null>(null);

  // Sessions search
  const [sessionSearch, setSessionSearch] = useState("");

  // Extensions state
  const [extensions, setExtensions] = useState<any[]>([]);
  const [extLoading, setExtLoading] = useState(false);
  const [showAddExt, setShowAddExt] = useState(false);
  const [extAssignmentId, setExtAssignmentId] = useState("");
  const [extQuizId, setExtQuizId] = useState("");
  const [extNewDate, setExtNewDate] = useState("");
  const [extReason, setExtReason] = useState("");

  // Mentors state
  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [mentorCourseId, setMentorCourseId] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);
  const [instructorOptions, setInstructorOptions] = useState<any[]>([]);

  const fetchBatch = useCallback(async () => {
    try {
      const data = await api.get<Batch>(`/api/admin/batches/${id}`);
      setBatch(data);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await api.get<{ courses: BatchCourse[] }>(
        `/api/admin/batches/${id}/courses`,
      );
      setCourses(data.courses);
    } catch {
      setCourses([]);
    }
  }, [id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  const fetchExtensions = useCallback(async () => {
    setExtLoading(true);
    try {
      const data = await api.get<any[]>(`/api/admin/batches/${id}/extensions`);
      setExtensions(data);
    } catch {
      setExtensions([]);
    } finally {
      setExtLoading(false);
    }
  }, [id]);

  const fetchMentors = useCallback(async () => {
    setMentorLoading(true);
    try {
      const data = await api.get<any[]>(`/api/admin/batches/${id}/mentors`);
      setMentors(data);
    } catch {
      setMentors([]);
    } finally {
      setMentorLoading(false);
    }
  }, [id]);

  const fetchInstructors = useCallback(async () => {
    try {
      const data = await api.get<any[]>("/api/admin/batches/instructors");
      setInstructorOptions(data);
    } catch {
      setInstructorOptions([]);
    }
  }, []);

  useEffect(() => {
    if (tab === "courses" || tab === "mentors") {
      fetchCourses();
    }
    if (tab === "extensions") {
      fetchExtensions();
    }
    if (tab === "mentors") {
      fetchMentors();
      fetchInstructors();
    }
  }, [tab, fetchCourses, fetchExtensions, fetchMentors, fetchInstructors]);

  const handleToggleVisibility = async (courseId: string) => {
    setToggling(courseId);
    try {
      const result = await api.put<BatchCourse>(
        `/api/admin/batches/${id}/courses/${courseId}/visibility`,
      );
      setCourses((prev) =>
        prev.map((c) =>
          c.courseId === result.courseId
            ? { ...c, isVisible: result.isVisible }
            : c,
        ),
      );
      toast.success(
        result.isVisible ? "Course is now visible" : "Course is now hidden",
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const handleToggleExamRequired = async (courseId: string) => {
    setTogglingExam(courseId);
    try {
      const result = await api.put<BatchCourse>(
        `/api/admin/batches/${id}/courses/${courseId}/exam-required`,
      );
      setCourses((prev) =>
        prev.map((c) =>
          c.courseId === result.courseId
            ? { ...c, isExamRequired: result.isExamRequired }
            : c,
        ),
      );
      toast.success(
        result.isExamRequired
          ? "Course certificate enabled"
          : "Course certificate disabled",
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingExam(null);
    }
  };

  const uniqueStudents = useMemo(() => {
    if (!batch) return [];
    const map = new Map<
      string,
      {
        id: string;
        user: { id: string; name: string; email: string };
        appliedAt?: string;
        type: "Course" | "Package";
      }
    >();

    for (const e of batch.enrollments || []) {
      if (e.user?.id && !map.has(e.user.id)) {
        map.set(e.user.id, {
          id: e.id,
          user: e.user,
          appliedAt: e.appliedAt,
          type: "Course",
        });
      }
    }

    for (const pec of batch.packageEnrollmentCourses || []) {
      const u = pec.enrollment?.user;
      if (u?.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          user: u,
          type: "Package",
        });
      }
    }

    return Array.from(map.values());
  }, [batch]);

  const filteredSessions = useMemo(() => {
    if (!batch) return [];
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return batch.sessions;
    return batch.sessions.filter((s) => {
      const date = new Date(s.scheduledAt).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        date.toLowerCase().includes(q) ||
        s.createdFrom.toLowerCase().includes(q) ||
        (s.recording ? "recording available" : "no recording").includes(q) ||
        (s.endedAt ? "past" : "upcoming").includes(q)
      );
    });
  }, [batch, sessionSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted animate-pulse">Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-semibold text-foreground">Batch not found</p>
        <Link href="/admin/batches" className="btn-primary mt-4 inline-flex">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={batch.name}
        description={batch.course?.title ?? batch.package?.name ?? "All Courses"}
        breadcrumbs={[
          { label: "Batches", href: "/admin/batches" },
          { label: batch.name, href: "#" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[batch.status] || ""}`}
            >
              {batch.status}
            </span>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {uniqueStudents.length}
          </p>
          <p className="text-xs text-muted">Students</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {batch._count.sessions}
          </p>
          <p className="text-xs text-muted">Sessions</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {batch.maxStudents ?? "∞"}
          </p>
          <p className="text-xs text-muted">Capacity</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            {batch.instructor?.name ?? "—"}
          </p>
          <p className="text-xs text-muted">Instructor</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {(["students", "sessions", "courses", "extensions", "mentors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "students"
              ? `Students (${uniqueStudents.length})`
              : t === "sessions"
                ? `Sessions (${batch.sessions.length})`
                : t === "courses"
                  ? `Courses (${courses.length || 0})`
                  : t === "extensions"
                    ? `Extensions (${extensions.length})`
                    : "Mentors"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "students" && (
        <div className="space-y-4">
          {uniqueStudents.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No students enrolled yet.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Student
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Email
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Enrollment
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {uniqueStudents.map((item) => (
                    <tr
                      key={item.user.id}
                      className="hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              item.type === "Package"
                                ? "bg-accent/20 text-accent"
                                : "bg-primary/20 text-primary-hover"
                            }`}
                          >
                            {item.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {item.user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {item.user.email}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {item.appliedAt
                          ? new Date(item.appliedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : item.type}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] ${
                            item.type === "Package"
                              ? "bg-accent/10 text-accent"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {batch.sessions.length} session
              {batch.sessions.length !== 1 ? "s" : ""} scheduled for this batch.
            </p>
            <div className="min-w-[200px] max-w-sm">
              <SearchInput
                placeholder="Search sessions..."
                value={sessionSearch}
                onChange={setSessionSearch}
              />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                {batch.sessions.length === 0
                  ? "No sessions scheduled yet."
                  : "No sessions match your search."}
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Scheduled At
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Source
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Recording
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredSessions.map((session) => {
                    const isPast =
                      session.endedAt ||
                      new Date(session.scheduledAt) < new Date();
                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-card-hover/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <IconCalendarEvent size={15} />
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {new Date(session.scheduledAt).toLocaleString(
                                "en-IN",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {session.createdFrom}
                        </td>
                        <td className="px-5 py-3">
                          {session.recording ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                              <IconVideo size={13} />
                              Available
                            </span>
                          ) : isPast ? (
                            <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning">
                              No Recording
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                              isPast
                                ? "bg-muted/15 text-muted border-muted/25"
                                : "bg-accent/15 text-accent border-accent/25"
                            }`}
                          >
                            {isPast ? "Past" : "Upcoming"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <a
                            href={session.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-xs"
                          >
                            {isPast ? "View Details" : "Join URL →"}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "extensions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Grant extensions for assignments/quizzes. Applies to ALL students in the batch.
            </p>
            <button
              onClick={() => setShowAddExt(!showAddExt)}
              className="btn-primary text-xs flex items-center gap-1"
            >
              <IconPlus size={14} /> Grant Extension
            </button>
          </div>

          {showAddExt && (
            <div className="glass-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Assignment ID (optional)</label>
                  <input
                    type="text"
                    value={extAssignmentId}
                    onChange={(e) => setExtAssignmentId(e.target.value)}
                    placeholder="Or leave blank and use Quiz ID"
                    className="field text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Quiz ID (optional)</label>
                  <input
                    type="text"
                    value={extQuizId}
                    onChange={(e) => setExtQuizId(e.target.value)}
                    placeholder="Or leave blank and use Assignment ID"
                    className="field text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">New Due Date *</label>
                  <input
                    type="datetime-local"
                    value={extNewDate}
                    onChange={(e) => setExtNewDate(e.target.value)}
                    className="field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Reason (optional)</label>
                  <input
                    type="text"
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    placeholder="e.g. Public holiday"
                    className="field text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddExt(false)} className="btn-secondary text-xs">Cancel</button>
                <button
                  onClick={async () => {
                    if (!extNewDate || (!extAssignmentId && !extQuizId)) {
                      toast.error("Provide a due date and either an Assignment or Quiz ID");
                      return;
                    }
                    try {
                      await api.post(`/api/admin/batches/${id}/extensions`, {
                        assignmentId: extAssignmentId || undefined,
                        quizId: extQuizId || undefined,
                        extendedDueDate: new Date(extNewDate).toISOString(),
                        reason: extReason || undefined,
                      });
                      toast.success("Extension granted");
                      setShowAddExt(false);
                      setExtAssignmentId("");
                      setExtQuizId("");
                      setExtNewDate("");
                      setExtReason("");
                      fetchExtensions();
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                  className="btn-primary text-xs"
                >
                  Grant
                </button>
              </div>
            </div>
          )}

          {extLoading ? (
            <p className="text-sm text-muted animate-pulse">Loading...</p>
          ) : extensions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">No extensions granted yet.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Item</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Original Due</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Extended To</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Granted By</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Reason</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {extensions.map((ext: any) => (
                    <tr key={ext.id} className="hover:bg-card-hover/50 transition-colors">
                      <td className="px-5 py-3 text-sm">
                        {ext.assignment?.title || ext.quiz?.title || "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {new Date(ext.originalDueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-xs text-warning font-medium">
                        {new Date(ext.extendedDueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{ext.grantedBy?.name || "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted">{ext.reason || "—"}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={async () => {
                            try {
                              await api.delete(`/api/admin/batches/${id}/extensions/${ext.id}`);
                              toast.success("Extension revoked");
                              fetchExtensions();
                            } catch (err) {
                              toast.error(getErrorMessage(err));
                            }
                          }}
                          className="text-danger hover:text-danger text-xs"
                        >
                          <IconTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "mentors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Assign instructors as course mentors for this batch.
            </p>
            <button
              onClick={() => setShowAddMentor(!showAddMentor)}
              className="btn-primary text-xs flex items-center gap-1"
            >
              <IconPlus size={14} /> Assign Mentor
            </button>
          </div>

          {showAddMentor && (
            <div className="glass-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Course *</label>
                  <select
                    value={mentorCourseId}
                    onChange={(e) => setMentorCourseId(e.target.value)}
                    className="field text-xs"
                  >
                    <option value="">Select course...</option>
                    {(courses.length > 0 ? courses : []).map((c: BatchCourse) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Instructor *</label>
                  <select
                    value={mentorUserId}
                    onChange={(e) => setMentorUserId(e.target.value)}
                    className="field text-xs"
                  >
                    <option value="">Select instructor...</option>
                    {instructorOptions.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => {
                  setShowAddMentor(false);
                  setMentorCourseId("");
                  setMentorUserId("");
                  setEditingMentorId(null);
                }} className="btn-secondary text-xs">Cancel</button>
                <button
                  onClick={async () => {
                    if (!mentorCourseId || !mentorUserId) {
                      toast.error("Select a course and an instructor");
                      return;
                    }
                    try {
                      await api.post(`/api/admin/batches/${id}/mentors`, {
                        courseId: mentorCourseId,
                        mentorId: mentorUserId,
                      });
                      toast.success(editingMentorId ? "Mentor updated" : "Mentor assigned");
                      setShowAddMentor(false);
                      setMentorCourseId("");
                      setMentorUserId("");
                      setEditingMentorId(null);
                      fetchMentors();
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                  className="btn-primary text-xs"
                >
                  {editingMentorId ? "Update" : "Assign"}
                </button>
              </div>
            </div>
          )}

          {mentorLoading ? (
            <p className="text-sm text-muted animate-pulse">Loading...</p>
          ) : (
            <div className="space-y-4">
              {batch?.instructor && (
                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold uppercase text-muted mb-2">Primary Instructor</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{batch.instructor.name}</span>
                    <span className="text-muted">{batch.instructor.email}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Primary</span>
                  </div>
                </div>
              )}
              {!batch?.instructor && (
                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold uppercase text-muted mb-2">Primary Instructor</h4>
                  <p className="text-sm text-muted-foreground">No primary instructor assigned. Use course mentors below.</p>
                </div>
              )}

              {mentors.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <p className="text-muted-foreground text-sm">No per-course mentors assigned yet.</p>
                </div>
              ) : (
                <div className="glass-card overflow-hidden rounded-none">
                  <h4 className="px-5 py-3 text-xs font-semibold uppercase text-muted border-b border-border">Course Mentors</h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Course</th>
                        <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Mentor</th>
                        <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Email</th>
                        <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {mentors.map((m: any) => (
                        <tr key={m.id} className="hover:bg-card-hover/50 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium">{m.course?.title}</td>
                          <td className="px-5 py-3 text-sm">{m.mentor?.name}</td>
                          <td className="px-5 py-3 text-xs text-muted">{m.mentor?.email}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setMentorCourseId(m.course?.id ?? m.courseId);
                                  setMentorUserId(m.mentor?.id ?? "");
                                  setEditingMentorId(m.id);
                                  setShowAddMentor(true);
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Edit mentor"
                              >
                                <IconEdit size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.delete(`/api/admin/batches/${id}/mentors/${m.courseId}`);
                                    toast.success("Mentor removed");
                                    fetchMentors();
                                  } catch (err) {
                                    toast.error(getErrorMessage(err));
                                  }
                                }}
                                className="text-danger hover:text-danger text-xs"
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
          )}
        </div>
      )}

      {tab === "courses" && (
        <div className="space-y-3">
          {!batch.package ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Course visibility is only available for package-level batches.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No courses found in the linked package.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-none">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted w-12">
                      #
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Course
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Course Visibility
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted">
                      Certificate
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase text-muted text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {courses.map((bc) => (
                    <tr
                      key={bc.courseId}
                      className="hover:bg-card-hover/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {bc.order + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {bc.course.title}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {bc.isVisible ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                            <IconEye size={13} />
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-muted/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <IconEyeOff size={13} />
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {bc.isExamRequired !== false ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-muted/30 bg-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleToggleExamRequired(bc.courseId)
                            }
                            disabled={togglingExam === bc.courseId}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                              bc.isExamRequired !== false
                                ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                : "border-border text-muted-foreground hover:bg-card-hover"
                            } disabled:opacity-50`}
                          >
                            {togglingExam === bc.courseId ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : bc.isExamRequired !== false ? (
                              "Disable Course Certificate"
                            ) : (
                              "Enable Course Certificate"
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleVisibility(bc.courseId)}
                            disabled={toggling === bc.courseId}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              bc.isVisible
                                ? "border-warning/30 text-warning hover:bg-warning/10"
                                : "border-primary/30 text-primary hover:bg-primary/10"
                            } disabled:opacity-50`}
                          >
                            {toggling === bc.courseId ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : bc.isVisible ? (
                              <>
                                <IconLockOpen size={13} /> Hide
                              </>
                            ) : (
                              <>
                                <IconLock size={13} /> Show
                              </>
                            )}
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
      )}
    </div>
  );
}
