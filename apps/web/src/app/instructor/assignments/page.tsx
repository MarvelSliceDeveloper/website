"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
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
  batch: { name: string };
  _count: { submissions: number };
};

type Submission = {
  id: string;
  status: "PENDING" | "GRADED";
  grade: string | null;
  feedback: string | null;
  comment: string | null;
  submittedAt: string;
  answerFileUrl: string | null;
  student: { id: string; name: string; email: string };
};

export default function InstructorAssignmentsPage() {
  usePageTitle("Assignments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradeModal, setGradeModal] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Assignment[] }>("/api/assignments")
      .then((res) => setAssignments(res.items ?? []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get<{ items: Submission[] }>(
        `/api/assignments/${assignmentId}/submissions`,
      );
      setSubmissions(res.items ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    fetchSubmissions(assignment.id);
  };

  const handleGrade = async () => {
    if (!gradeModal) return;
    setSubmitting(true);
    try {
      await api.post(
        `/api/assignments/submissions/${gradeModal.id}/grade`,
        {
          grade: gradeInput,
          feedback: feedbackInput || undefined,
        },
      );
      toast.success("Submission graded successfully");
      setGradeModal(null);
      setGradeInput("");
      setFeedbackInput("");
      if (selectedAssignment) {
        fetchSubmissions(selectedAssignment.id);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length;

  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedAssignment(null);
              setSubmissions([]);
            }}
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
              {selectedAssignment.batch.name}
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
                          {sub.grade}
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
                    Grade / Score
                  </label>
                  <input
                    type="text"
                    className="field"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder="e.g., 85/100, A+, Good"
                    required
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
                    disabled={submitting || !gradeInput.trim()}
                    className="btn-primary text-xs px-4"
                  >
                    {submitting ? "Submitting..." : "Submit Grade"}
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
          Instructor
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Assessments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View quizzes and assignments for your courses. Click to grade
          submissions.
        </p>
      </div>

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
                    {a.course.title} · {a.batch.name} · {a.type}
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
