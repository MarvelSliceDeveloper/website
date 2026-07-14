import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import type { Assignment, StudentSubmission, SubmissionDetail } from "./types";

interface Props {
  selectedAssignment: Assignment;
  submissions: StudentSubmission[];
  loadingSubmissions: boolean;
  onBack: () => void;
  onGrade: (
    submissionId: string,
    grade: string,
    feedback: string,
  ) => Promise<void>;
}

export function SubmissionReviewPanel({
  selectedAssignment,
  submissions,
  loadingSubmissions,
  onBack,
  onGrade,
}: Props) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDetail | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gradingSuccess, setGradingSuccess] = useState(false);
  const [submissionDetailLoading, setSubmissionDetailLoading] = useState(false);

  const handleSelectSubmission = async (sub: StudentSubmission) => {
    setGradingSuccess(false);
    setSubmissionDetailLoading(true);
    try {
      const res = await fetch(`/api/student/submissions?id=${sub.id}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to load submission details");
      setSelectedSubmission(data);
      setGradeInput(data.grade || "");
      setFeedbackInput(data.feedback || "");
    } catch {
      setSelectedSubmission(null);
    } finally {
      setSubmissionDetailLoading(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setSubmitting(true);
    try {
      await onGrade(selectedSubmission.id, gradeInput, feedbackInput);
      setGradingSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card p-5 border border-border/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                Batch: {selectedAssignment.batch.name}
              </span>
              <h2 className="text-lg font-bold text-foreground mt-1">
                {selectedAssignment.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedAssignment.course.title}
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-xs text-muted hover:text-foreground font-medium"
            >
              ← Back to assignments
            </button>
          </div>
          <p className="text-sm text-muted-foreground pt-1 border-t border-border/40">
            {selectedAssignment.description}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              📅 Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              💯 Max Points: {selectedAssignment.maxPoints}
            </span>
          </div>
        </div>

        <div className="glass-card p-5 border border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Submissions ({submissions.length})
          </h3>

          {loadingSubmissions ? (
            <div className="text-center py-8 text-sm text-muted animate-pulse">
              Fetching student submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No submissions recorded yet for this assignment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Submitted</th>
                    <th className="py-2.5">
                      {selectedAssignment.type === "QUIZ"
                        ? "Auto Score"
                        : "File"}
                    </th>
                    <th className="py-2.5">Grade</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className={`hover:bg-card-hover transition-colors ${selectedSubmission?.id === sub.id ? "bg-violet-500/12" : ""}`}
                    >
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-foreground">
                          {sub.student.name}
                        </p>
                        <p className="text-[10px] text-muted">
                          {sub.student.email}
                        </p>
                      </td>
                      <td className="py-3 pr-2 text-muted">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-2 font-bold text-foreground">
                        {selectedAssignment.type === "QUIZ" ? (
                          sub.totalScore !== null ? (
                            `${sub.totalScore}/${selectedAssignment.maxPoints}`
                          ) : (
                            "-"
                          )
                        ) : sub.answerFileUrl ? (
                          <a
                            href={sub.answerFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-[10px]"
                          >
                            📎 Download
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sub.status === "GRADED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                        >
                          {sub.status === "GRADED"
                            ? sub.grade || "Graded"
                            : "Pending Evaluation"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleSelectSubmission(sub)}
                          className="btn-secondary text-[10px] py-1 px-2.5"
                        >
                          {selectedAssignment.type === "QUIZ"
                            ? "Review Answers"
                            : "Review & Grade"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5 border border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Evaluation Assistant
          </h3>

          {submissionDetailLoading ? (
            <div className="text-center py-8 text-sm text-muted animate-pulse">
              Loading submission details...
            </div>
          ) : !selectedSubmission ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Select a student from the list to review their answers, see the
              auto-graded score, and add custom feedback notes.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl border border-border/80 bg-background/50">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Student Profile
                </p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {selectedSubmission.student.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSubmission.student.email}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">
                      {selectedSubmission.assignment.type === "QUIZ"
                        ? "Auto Grade"
                        : "Score"}
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {selectedSubmission.totalScore !== null
                        ? selectedSubmission.totalScore
                        : "—"}{" "}
                      / {selectedSubmission.assignment.maxPoints}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted uppercase">
                      Status
                    </p>
                    <p
                      className={`text-xs font-bold ${selectedSubmission.status === "GRADED" ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {selectedSubmission.status}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSubmission.assignment.type === "QUIZ" && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    Student Responses
                  </p>
                  {selectedSubmission.assignment.questions.map((q, idx) => {
                    const response = selectedSubmission.questionResponses.find(
                      (r) => r.questionId === q.id,
                    );
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-lg border border-border/50 bg-background/30 text-xs"
                      >
                        <p className="font-semibold text-foreground">
                          {idx + 1}. {q.questionText}
                        </p>
                        <div className="mt-2 space-y-1.5 pl-1.5">
                          {q.options.map((o) => {
                            const isSelected =
                              o.id === response?.selectedOptionId;
                            return (
                              <div
                                key={o.id}
                                className={`flex items-start gap-1.5 p-1 rounded ${o.isCorrect ? "bg-emerald-500/10 text-emerald-400 font-semibold" : isSelected ? "bg-danger/10 text-danger" : "text-muted-foreground"}`}
                              >
                                <span className="mt-0.5 shrink-0">
                                  {o.isCorrect ? "✅" : isSelected ? "❌" : "○"}
                                </span>
                                <span className="leading-tight">
                                  {o.optionText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted">
                          <span>Marks weight: {q.marks}</span>
                          <span
                            className={
                              response?.isCorrect
                                ? "text-emerald-400 font-bold"
                                : "text-danger font-bold"
                            }
                          >
                            {response?.isCorrect
                              ? `+${q.marks} marks`
                              : "0 marks"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedSubmission.assignment.type === "ASSIGNMENT" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    Submitted Files
                  </p>
                  {selectedSubmission.assignment.questionPdfUrl && (
                    <a
                      href={selectedSubmission.assignment.questionPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-background/30 text-xs hover:border-primary/40 transition-colors"
                    >
                      <span>📄</span>
                      <span className="font-medium text-foreground">
                        Question PDF
                      </span>
                      <span className="ml-auto text-primary text-[10px]">
                        Open →
                      </span>
                    </a>
                  )}
                  {selectedSubmission.answerFileUrl ? (
                    <a
                      href={selectedSubmission.answerFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-background/30 text-xs hover:border-primary/40 transition-colors"
                    >
                      <span>📎</span>
                      <span className="font-medium text-foreground">
                        Student Answer File
                      </span>
                      <span className="ml-auto text-primary text-[10px]">
                        Download →
                      </span>
                    </a>
                  ) : (
                    <div className="p-3 rounded-lg border border-border/50 bg-background/30 text-xs text-muted-foreground">
                      No answer file submitted yet.
                    </div>
                  )}
                </div>
              )}

              <form
                onSubmit={handleGradeSubmission}
                className="space-y-3 pt-3 border-t border-border/60"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    Final Score / Grade
                  </label>
                  <input
                    type="text"
                    required
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="field py-1.5 text-xs"
                    placeholder="e.g. 8/10 or A+"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    Grader Feedback Notes
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="field text-xs"
                    placeholder="Provide advice, study tips, or congrats..."
                  />
                </div>
                {gradingSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <IconCheck size={14} /> Evaluation updated successfully!
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full text-xs py-2 justify-center"
                >
                  {submitting ? "Saving..." : "Save Evaluation"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
