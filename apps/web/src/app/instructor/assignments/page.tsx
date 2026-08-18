"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconClipboardList,
  IconUsers,
  IconClock,
  IconCheck,
  IconArrowLeft,
  IconFile,
} from "@tabler/icons-react";

type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  type: "QUIZ" | "ASSIGNMENT";
  course: { title: string };
  batch: { name: string; passingScore: number } | null;
  _count: { submissions: number };
};

type Submission = {
  id: string;
  status: "PENDING" | "GRADED";
  grade: string | null;
  totalScore: number | null;
  feedback: string | null;
  comment: string | null;
  submittedAt: string;
  answerFileUrl: string | null;
  student: { id: string; name: string; email: string };
};

function PassFailPreview({
  gradeInput,
  passingScore,
}: {
  gradeInput: string;
  passingScore: number;
}) {
  if (!gradeInput || isNaN(parseInt(gradeInput, 10))) return null;
  const finalScore = parseInt(gradeInput, 10);
  if (finalScore >= passingScore) return null;
  return (
    <p className="text-xs text-warning font-medium mt-1 flex items-center gap-1">
      Score {finalScore}/{passingScore} — student will need to resubmit
    </p>
  );
}

export default function InstructorAssignmentsPage() {
  usePageTitle("Assignments");
  const queryClient = useQueryClient();

  // Shares the cache key with the instructor dashboard's ["instructor","assignments"].
  const assignmentsQuery = useApiQuery<{ items: Assignment[] }>(
    ["instructor", "assignments"],
    "/api/assignments",
  );
  const assignments = assignmentsQuery.data?.items ?? [];
  const loading = assignmentsQuery.isPending;

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  // Dependent query: submissions for the currently selected assignment.
  const submissionsQuery = useQuery({
    queryKey: ["instructor", "submissions", selectedAssignment?.id ?? ""],
    queryFn: () =>
      api.get<{ items: Submission[] }>(
        `/api/assignments/${selectedAssignment!.id}/submissions`,
      ),
    enabled: Boolean(selectedAssignment),
  });
  const submissions = submissionsQuery.data?.items ?? [];
  const loadingSubmissions = submissionsQuery.isPending;

  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: { grade: number; feedback?: string };
    }) =>
      api.post(
        `/api/assignments/submissions/${submissionId}/grade`,
        payload,
      ),
    onSuccess: () => {
      toast.success("Submission graded successfully");
      setGradeModal(null);
      setGradeInput("");
      setFeedbackInput("");
      if (selectedAssignment) {
        void queryClient.invalidateQueries({
          queryKey: ["instructor", "submissions", selectedAssignment.id],
        });
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleGrade = () => {
    if (!gradeModal) return;
    const score = parseInt(gradeInput, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }
    gradeMutation.mutate({
      submissionId: gradeModal.id,
      payload: { grade: score, feedback: feedbackInput || undefined },
    });
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length;

  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAssignment(null)}
            className="p-2 rounded-lg hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Grading
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {selectedAssignment.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedAssignment.course.title} ·{" "}
              {selectedAssignment.batch?.name ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-warning mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Graded
            </p>
            <p className="text-2xl font-bold text-success mt-1">{gradedCount}</p>
          </div>
        </div>

        {loadingSubmissions ? (
          <div className="border border-border bg-card p-12 text-center">
            <p className="text-muted animate-pulse">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <IconUsers
              size={40}
              className="mx-auto text-muted/40 mb-3"
            />
            <p className="font-semibold text-foreground">
              No submissions yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Students haven&apos;t submitted their work yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary text-sm font-bold">
                        {sub.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {sub.student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.student.email}
                        </p>
                      </div>
                    </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconClock size={12} />
                          Submitted:{" "}
                          {new Date(sub.submittedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {sub.answerFileUrl && (
                          <a
                            href={sub.answerFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <IconFile size={12} />
                            View File
                          </a>
                        )}
                      </div>
                    {sub.comment && (
                      <div className="mt-3 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                          Student Note
                        </p>
                        <div className="prose prose-xs max-w-none text-foreground/80 [&_p]:my-0.5" dangerouslySetInnerHTML={{ __html: sub.comment }} />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {sub.status === "GRADED" ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                          <IconCheck size={12} /> Graded
                        </span>
                        <p className="text-sm font-bold text-foreground mt-1">
                          {sub.totalScore ?? sub.grade}
                          <span className="text-xs font-normal text-muted-foreground">/100</span>
                        </p>
                        {sub.feedback && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                            {sub.feedback}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setGradeModal(sub);
                          setGradeInput("");
                          setFeedbackInput("");
                        }}
                        className="btn-primary text-xs"
                      >
                        Grade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {gradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border bg-card p-4">
                <div>
                  <h3 className="font-bold text-foreground">Grade Submission</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gradeModal.student.name} · {gradeModal.student.email}
                  </p>
                </div>
                <button
                  onClick={() => setGradeModal(null)}
                  className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-4">
                {gradeModal.answerFileUrl && (
                  <div className="p-3 bg-card-hover rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Submitted File
                    </p>
                    <a
                      href={gradeModal.answerFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <IconFile size={16} />
                      View Submission
                    </a>
                  </div>
                )}

                {gradeModal.comment && (
                  <div className="rounded-lg bg-muted/20 border border-border/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Student Note
                    </p>
                    <div className="text-sm text-foreground/80 prose prose-xs max-w-none [&_p]:my-0.5" dangerouslySetInnerHTML={{ __html: gradeModal.comment }} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    className="field"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder="e.g. 85"
                    min={0}
                    max={100}
                    required
                  />
                  <PassFailPreview
                    gradeInput={gradeInput}
                    passingScore={selectedAssignment?.batch?.passingScore ?? 50}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    className="field min-h-[80px] resize-y"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Add feedback for the student..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGradeModal(null)}
                    className="btn-secondary text-xs px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrade}
                    disabled={gradeMutation.isPending || !gradeInput.trim()}
                    className="btn-primary text-xs px-4"
                  >
                    {gradeMutation.isPending ? "Submitting..." : "Submit Grade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Assignments"
        breadcrumbs={[{ label: "Assignments", href: "/instructor/assignments" }]}
        role="Instructor"
        description="View quizzes and assignments for your courses. Click to grade submissions."
      />

      {loading ? (
        <div className="border border-border bg-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <IconClipboardList
            size={40}
            className="mx-auto text-muted/40 mb-3"
          />
          <p className="font-semibold text-foreground">No assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Assignments created for your courses will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectAssignment(a)}
              className="w-full border border-border bg-card p-4 flex items-center justify-between hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <IconClipboardList size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.course.title} · {a.batch?.name ?? "—"} · {a.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Submissions</p>
                  <p className="text-lg font-bold text-foreground">
                    {a._count.submissions}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-xs font-medium text-foreground">
                    {new Date(a.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
