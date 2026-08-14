"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import {
  IconClipboardCheck,
  IconFileDescription,
  IconFileUpload,
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

interface InstructorStats {
  instructorId: string;
  name: string;
  pending: number;
  graded: number;
}

interface Stats {
  pending: number;
  graded: number;
  total: number;
  byInstructor: InstructorStats[];
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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  const submissionsQuery = useApiQuery<SubmissionResponse>(
    ["admin", "assignments", "review"],
    "/api/admin/assignments/review",
  );
  const submissions = submissionsQuery.data?.items ?? [];
  const loading = submissionsQuery.isPending;

  const statsQuery = useApiQuery<Stats>(
    ["admin", "assignments", "review", "stats"],
    "/api/admin/assignments/review/stats",
  );
  const stats = statsQuery.data ?? null;
  const statsLoading = statsQuery.isPending;

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

  const gradeMutation = useMutation({
    mutationFn: ({
      id,
      grade,
      feedback,
    }: {
      id: string;
      grade: number;
      feedback?: string;
    }) =>
      api.post(`/api/admin/assignments/review/${id}/grade`, {
        grade,
        feedback,
      }),
    onSuccess: () => {
      toast.success("Submission graded successfully!");
      closeGradeModal();
      void submissionsQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleGradeSubmit() {
    if (!selectedSubmission) return;
    const gradeNum = Number(gradeInput);
    if (!gradeInput.trim() || isNaN(gradeNum) || gradeNum < 0) {
      toast.error("Please enter a valid grade");
      return;
    }

    gradeMutation.mutate({
      id: selectedSubmission.id,
      grade: gradeNum,
      feedback: feedbackInput.trim() || undefined,
    });
  }

  const query = search.trim().toLowerCase();
  const filteredSubmissions = submissions.filter((s) => {
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (!query) return true;
    const haystack = [
      s.student.name,
      s.student.email,
      s.instructor?.name ?? "",
      s.assignment.id,
      s.assignment.title,
      s.course.title,
      s.batch?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
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
              void submissionsQuery.refetch();
              void statsQuery.refetch();
            }}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Pending
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-primary">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.pending ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 border border-amber-500/25">
              <IconClipboardCheck size={20} stroke={1.5} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-success/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Graded
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-success">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.graded ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success border border-success/25">
              <IconCheck size={20} stroke={1.5} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-accent/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total Submissions
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-accent">
                {statsLoading ? (
                  <span className="h-7 w-16 block animate-pulse bg-border rounded" />
                ) : (
                  stats?.total ?? "\u2014"
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent border border-accent/25">
              <IconFileUpload size={20} stroke={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions by Instructor */}
      {stats && stats.byInstructor.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Submissions by Instructor
          </h3>
          <div className="space-y-4">
            {stats.byInstructor.map((inst) => {
              const total = inst.pending + inst.graded;
              const gradedPct = total > 0 ? (inst.graded / total) * 100 : 0;
              const pendingPct = total > 0 ? (inst.pending / total) * 100 : 0;
              return (
                <div key={inst.instructorId} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {inst.name}
                      </span>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        <span className="font-semibold text-success">
                          {inst.graded} graded
                        </span>
                        {" · "}
                        <span className="font-semibold text-amber-600">
                          {inst.pending} pending
                        </span>
                        {" · "}
                        <span className="font-semibold text-foreground">
                          {total} total
                        </span>
                      </span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-border/60">
                      <div
                        className="bg-success transition-all"
                        style={{ width: `${gradedPct}%` }}
                      />
                      {inst.pending > 0 && (
                        <div
                          className="bg-amber-500 transition-all"
                          style={{ width: `${pendingPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by student, instructor, assignment ID, or assignment title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              disabled={gradeMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleGradeSubmit}
              disabled={gradeMutation.isPending}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {gradeMutation.isPending ? (
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
