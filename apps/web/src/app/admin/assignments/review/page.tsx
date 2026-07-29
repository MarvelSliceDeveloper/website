"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconClipboardCheck,
  IconFileDescription,
  IconUser,
  IconCheck,
  IconX,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";

interface SubmissionStudent {
  id: string;
  name: string;
  email: string;
}

interface SubmissionAssignment {
  id: string;
  title: string;
}

interface SubmissionCourse {
  id: string;
  title: string;
}

interface SubmissionBatch {
  id: string;
  name: string;
}

interface SubmissionInstructor {
  id: string;
  name: string;
  email: string;
}

interface Submission {
  id: string;
  student: SubmissionStudent;
  assignment: SubmissionAssignment;
  course: SubmissionCourse;
  batch: SubmissionBatch | null;
  instructor: SubmissionInstructor | null;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  status: "PENDING" | "GRADED";
  submittedAt: string;
  gradedAt: string | null;
}

interface Stats {
  totalPending: number;
  totalGraded: number;
  totalSubmissions: number;
}

interface SubmissionResponse {
  items: Submission[];
  total: number;
  page: number;
  limit: number;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  },
  GRADED: {
    label: "Graded",
    classes: "bg-success/15 text-success border-success/25",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AssignmentReviewPage() {
  usePageTitle("Assignment Review Queue");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [searchAssignment, setSearchAssignment] = useState("");
  const [searchInstructor, setSearchInstructor] = useState("");
  const [searchCourse, setSearchCourse] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const data = await api.get<SubmissionResponse>("/api/admin/assignments/review");
      setSubmissions(data.items ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const data = await api.get<Stats>("/api/admin/assignments/review/stats");
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, []);

  function openGradeModal(submission: Submission) {
    setSelectedSubmission(submission);
    setGradeInput(submission.grade?.toString() ?? "");
    setFeedbackInput(submission.feedback ?? "");
    setGradeModalOpen(true);
  }

  function closeGradeModal() {
    setGradeModalOpen(false);
    setSelectedSubmission(null);
    setGradeInput("");
    setFeedbackInput("");
  }

  async function handleGradeSubmit() {
    if (!selectedSubmission) return;
    const gradeNum = Number(gradeInput);
    if (!gradeInput.trim() || isNaN(gradeNum) || gradeNum < 0) {
      toast.error("Please enter a valid grade");
      return;
    }

    setSaving(true);
    try {
      await api.post(
        `/api/admin/assignments/review/${selectedSubmission.id}/grade`,
        { grade: gradeNum, feedback: feedbackInput.trim() || undefined },
      );
      toast.success("Submission graded successfully!");
      closeGradeModal();
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (
      searchAssignment &&
      !s.assignment.title.toLowerCase().includes(searchAssignment.toLowerCase())
    )
      return false;
    if (
      searchInstructor &&
      !s.instructor?.name.toLowerCase().includes(searchInstructor.toLowerCase())
    )
      return false;
    if (
      searchCourse &&
      !s.course.title.toLowerCase().includes(searchCourse.toLowerCase())
    )
      return false;
    if (
      searchStudent &&
      !s.student.name.toLowerCase().includes(searchStudent.toLowerCase()) &&
      !s.student.email.toLowerCase().includes(searchStudent.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Assignment Review Queue"
        description="Review and grade pending assignment submissions across all instructors."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Assignments", href: "/admin/assignment-templates" },
          { label: "Review Queue", href: "/admin/assignments/review" },
        ]}
        action={
          <button
            onClick={() => {
              fetchSubmissions();
              fetchStats();
            }}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-primary/15 via-primary/8 to-accent/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Pending
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-primary">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.totalPending ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 border border-amber-500/25">
              <IconClipboardCheck size={20} stroke={1.5} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-success/50 bg-gradient-to-br from-success/15 via-success/8 to-success/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Graded
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-success">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.totalGraded ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success border border-success/25">
              <IconCheck size={20} stroke={1.5} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-accent/50 bg-gradient-to-br from-accent/15 via-accent/8 to-accent/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Submissions
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-accent">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.totalSubmissions ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent border border-accent/25">
              <IconFileDescription size={20} stroke={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Assignment
            </label>
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchAssignment}
              onChange={(e) => setSearchAssignment(e.target.value)}
              className="input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Instructor
            </label>
            <input
              type="text"
              placeholder="Search instructor..."
              value={searchInstructor}
              onChange={(e) => setSearchInstructor(e.target.value)}
              className="input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Course
            </label>
            <input
              type="text"
              placeholder="Search course..."
              value={searchCourse}
              onChange={(e) => setSearchCourse(e.target.value)}
              className="input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Student
            </label>
            <input
              type="text"
              placeholder="Search student..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input text-xs w-full"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="GRADED">Graded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Submissions
          {filteredSubmissions.length > 0 && (
            <span className="text-muted-foreground font-normal">
              {" "}
              &middot; {filteredSubmissions.length}
            </span>
          )}
        </h3>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No submissions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Student</th>
                  <th className="py-2.5 pr-3">Assignment</th>
                  <th className="py-2.5 pr-3">Course</th>
                  <th className="py-2.5 pr-3">Batch</th>
                  <th className="py-2.5 pr-3">Instructor</th>
                  <th className="py-2.5 pr-3">Submitted At</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredSubmissions.map((sub) => {
                  const cfg = statusConfig[sub.status] ?? {
                    label: sub.status,
                    classes: "bg-muted/15 text-muted-foreground border-muted/25",
                  };
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
                            {sub.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-foreground font-medium block">
                              {sub.student.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {sub.student.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-medium text-foreground">
                        {sub.assignment.title}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {sub.course.title}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {sub.batch?.name ?? "\u2014"}
                      </td>
                      <td className="py-3 pr-3">
                        {sub.instructor ? (
                          <span className="text-foreground font-medium">
                            {sub.instructor.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">\u2014</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}
                        >
                          {sub.status === "GRADED" && <IconCheck size={10} />}
                          {sub.status === "PENDING" && (
                            <IconX size={10} />
                          )}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openGradeModal(sub)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
                            title="View Detail"
                          >
                            <IconEye size={12} /> View
                          </button>
                          {sub.status === "PENDING" && (
                            <button
                              onClick={() => openGradeModal(sub)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                              title="Grade Submission"
                            >
                              <IconClipboardCheck size={12} /> Grade
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      <FormModal
        open={gradeModalOpen}
        onClose={closeGradeModal}
        title={
          selectedSubmission
            ? `Grade: ${selectedSubmission.assignment.title}`
            : "Grade Submission"
        }
        size="lg"
        footer={
          <>
            <button
              onClick={closeGradeModal}
              className="btn-secondary text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleGradeSubmit}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck size={14} /> Submit Grade
                </>
              )}
            </button>
          </>
        }
      >
        {selectedSubmission && (
          <div className="space-y-4">
            {/* Submission Detail */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/10 border border-border/50">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  Student
                </p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <IconUser size={14} className="text-muted-foreground" />
                  {selectedSubmission.student.name}
                </p>
                <p className="text-xs text-muted-foreground ml-5">
                  {selectedSubmission.student.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  Assignment
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedSubmission.assignment.title}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  Course
                </p>
                <p className="text-sm text-foreground">
                  {selectedSubmission.course.title}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  Submitted
                </p>
                <p className="text-sm text-foreground">
                  {formatDate(selectedSubmission.submittedAt)}
                </p>
              </div>
              {selectedSubmission.batch && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    Batch
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedSubmission.batch.name}
                  </p>
                </div>
              )}
              {selectedSubmission.instructor && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    Instructor
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedSubmission.instructor.name}
                  </p>
                </div>
              )}
            </div>

            {/* File Link */}
            {selectedSubmission.fileUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                  Submitted File
                </p>
                <a
                  href={selectedSubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <IconFileDescription size={14} />
                  View Submission File
                </a>
              </div>
            )}

            {/* Grade Input */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Grade <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter grade (0-100)"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Feedback{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                rows={4}
                placeholder="Provide feedback to the student..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                className="input text-xs w-full resize-none"
              />
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
