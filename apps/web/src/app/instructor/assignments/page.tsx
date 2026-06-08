"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  IconClipboardList,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconUsers,
  IconCalendar,
  IconAward,
  IconBook,
  IconMessageCircle,
} from "@tabler/icons-react";

type Batch = {
  id: string;
  name: string;
  course: {
    id: string;
    title: string;
  };
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  course: {
    title: string;
  };
  batch: {
    name: string;
  };
  _count?: {
    submissions: number;
    questions: number;
  };
};

type StudentSubmission = {
  id: string;
  studentId: string;
  status: "PENDING" | "GRADED";
  submittedAt: string;
  totalScore: number | null;
  grade: string | null;
  feedback: string | null;
  student: {
    name: string;
    email: string;
  };
};

type SubmissionDetail = StudentSubmission & {
  assignment: {
    title: string;
    maxPoints: number;
    questions: Array<{
      id: string;
      questionText: string;
      marks: number;
      options: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    }>;
  };
  questionResponses: Array<{
    id: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
};

type FormQuestion = {
  questionText: string;
  marks: number;
  options: Array<{ optionText: string; isCorrect: boolean }>;
};

export default function InstructorAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);

  // Loading flags
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Manual grading state
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [gradingSuccess, setGradingSuccess] = useState(false);

  // Form state for creating assignments
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBatchId, setFormBatchId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formMaxPoints, setFormMaxPoints] = useState(10);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([
    {
      questionText: "",
      marks: 1,
      options: [
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    },
  ]);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [batchesRes, assignmentsRes] = await Promise.all([
          api.get<Batch[]>("/api/admin/batches"),
          api.get<{ assignments: Assignment[] }>("/api/assignments"),
        ]);
        setBatches(batchesRes || []);
        setAssignments(assignmentsRes.assignments || []);
      } catch (err) {
        console.error("Error loading instructor assignment data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch submissions when selected assignment changes
  useEffect(() => {
    if (!selectedAssignment) {
      setSubmissions([]);
      setSelectedSubmission(null);
      return;
    }

    const assignmentId = selectedAssignment.id;

    async function loadSubmissions() {
      try {
        setLoadingSubmissions(true);
        setSelectedSubmission(null);
        const res = await api.get<{ submissions: StudentSubmission[] }>(
          `/api/assignments/${assignmentId}/submissions`
        );
        setSubmissions(res.submissions || []);
      } catch (err) {
        console.error("Error loading submissions:", err);
      } finally {
        setLoadingSubmissions(false);
      }
    }
    loadSubmissions();
  }, [selectedAssignment]);

  // Fetches detailed response answers and scores for a specific student submission.
  async function handleSelectSubmission(sub: StudentSubmission) {
    try {
      const res = await api.get<{ result: SubmissionDetail }>(
        `/api/assignments/submissions/${sub.id}/result`
      );
      setSelectedSubmission(res.result);
      setGradeInput(res.result.grade || `${res.result.totalScore || 0}/${res.result.assignment.maxPoints}`);
      setFeedbackInput(res.result.feedback || "");
      setGradingSuccess(false);
    } catch (err) {
      console.error("Error loading submission details:", err);
    }
  }

  // Sends the custom grade override and qualitative feedback to the backend.
  async function handleGradeSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      await api.post(`/api/assignments/submissions/${selectedSubmission.id}/grade`, {
        grade: gradeInput,
        feedback: feedbackInput,
      });
      setGradingSuccess(true);

      // Refresh submissions list
      const res = await api.get<{ submissions: StudentSubmission[] }>(
        `/api/assignments/${selectedAssignment!.id}/submissions`
      );
      setSubmissions(res.submissions || []);

      // Update active selected submission view
      setSelectedSubmission((prev) =>
        prev
          ? {
            ...prev,
            status: "GRADED",
            grade: gradeInput,
            feedback: feedbackInput,
          }
          : null
      );
    } catch (err: any) {
      alert(`Error saving grade: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Appends a new blank MCQ question with default four empty options to the form schema.
  const handleAddQuestion = () => {
    setFormQuestions([
      ...formQuestions,
      {
        questionText: "",
        marks: 1,
        options: [
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ],
      },
    ]);
  };

  // Removes an MCQ question from the form list; prevented if only one question remains.
  const handleRemoveQuestion = (qIndex: number) => {
    if (formQuestions.length === 1) return;
    setFormQuestions(formQuestions.filter((_, idx) => idx !== qIndex));
  };

  // Updates the prompt/text of a specific MCQ question in the builder.
  const handleQuestionChange = (qIndex: number, text: string) => {
    const updated = [...formQuestions];
    updated[qIndex].questionText = text;
    setFormQuestions(updated);
  };

  // Updates the weight/marks score allocated to a specific MCQ question.
  const handleQuestionMarksChange = (qIndex: number, val: number) => {
    const updated = [...formQuestions];
    updated[qIndex].marks = val;
    setFormQuestions(updated);
  };

  // Updates the text of a specific multiple-choice answer option.
  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...formQuestions];
    updated[qIndex].options[optIndex].optionText = text;
    setFormQuestions(updated);
  };

  // Toggles which option is marked correct; ensures exactly one option is correct per question.
  const handleSelectCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...formQuestions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIndex;
    });
    setFormQuestions(updated);
  };

  // Validates input fields and posts the new MCQ assignment with nested questions to the database.
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchId) {
      alert("Please select a batch.");
      return;
    }

    const selectedBatch = batches.find((b) => b.id === formBatchId);
    if (!selectedBatch) return;

    // Validate questions
    for (const q of formQuestions) {
      if (!q.questionText.trim()) {
        alert("Please write a question text for all questions.");
        return;
      }
      for (const o of q.options) {
        if (!o.optionText.trim()) {
          alert("All multiple-choice options must have text filled.");
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const computedMaxPoints = formQuestions.reduce((sum, q) => sum + Number(q.marks), 0);

      await api.post("/api/assignments", {
        courseId: selectedBatch.course.id,
        batchId: formBatchId,
        title: formTitle,
        description: formDesc,
        dueDate: new Date(formDueDate).toISOString(),
        maxPoints: computedMaxPoints,
        questions: formQuestions,
      });

      // Reset Form
      setFormTitle("");
      setFormDesc("");
      setFormBatchId("");
      setFormDueDate("");
      setFormQuestions([
        {
          questionText: "",
          marks: 1,
          options: [
            { optionText: "", isCorrect: true },
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
            { optionText: "", isCorrect: false },
          ],
        },
      ]);

      // Refresh list & tab
      const assignmentsRes = await api.get<{ assignments: Assignment[] }>("/api/assignments");
      setAssignments(assignmentsRes.assignments || []);
      setActiveTab("list");
      alert("Assignment created successfully!");
    } catch (err: any) {
      alert(`Error creating assignment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Assignments Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Post and evaluate MCQ-based class tests and automated assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab("list");
              setSelectedAssignment(null);
            }}
            className={`btn-secondary text-xs py-2 px-4 ${activeTab === "list" && !selectedAssignment ? "border-violet-500/30 bg-violet-500/10 text-violet-400" : ""
              }`}
          >
            <IconClipboardList size={16} /> All Assignments
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`btn-primary text-xs py-2 px-4 ${activeTab === "create" ? "shadow-lg" : ""
              }`}
          >
            <IconPlus size={16} /> Create Assignment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-sm text-muted animate-pulse">
          Loading dashboard content...
        </div>
      ) : activeTab === "create" ? (
        /* ==================== CREATE VIEW ==================== */
        <div className="glass-card p-6 border border-border/80 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            🆕 Create MCQ Assignment
          </h2>

          <form onSubmit={handleCreateAssignment} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Batch
                </label>
                <select
                  required
                  value={formBatchId}
                  onChange={(e) => setFormBatchId(e.target.value)}
                  className="field py-2.5"
                >
                  <option value="">Select Batch (Course)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="field py-2.5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assignment Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TypeScript Fundamentals Midterm"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="field"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Instructions / Description
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the guidelines, topic coverage, and expectations."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="field"
              />
            </div>

            {/* Questions Builder */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Questions ({formQuestions.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-secondary text-[11px] py-1 px-3 border-violet-500/20 text-violet-400 hover:bg-violet-500/10"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-6">
                {formQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-4 relative"
                  >
                    {formQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="absolute top-4 right-4 text-muted hover:text-danger transition-colors"
                        title="Remove Question"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                          Question {qIndex + 1} Text
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Which of the following is correct about 'let' vs 'var'?"
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                          className="field py-2 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                          Marks
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={50}
                          value={q.marks}
                          onChange={(e) => handleQuestionMarksChange(qIndex, Number(e.target.value))}
                          className="field py-2 text-sm"
                        />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                        Options (Select one correct answer)
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${opt.isCorrect
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : "border-border/60"
                              }`}
                          >
                            <input
                              type="radio"
                              name={`correct-opt-${qIndex}`}
                              checked={opt.isCorrect}
                              onChange={() => handleSelectCorrectOption(qIndex, optIndex)}
                              className="accent-emerald-500 h-4 w-4 shrink-0"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              value={opt.optionText}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="bg-transparent border-none w-full p-0 text-xs focus:ring-0 text-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs px-6"
              >
                {submitting ? "Creating..." : "Publish Assignment"}
              </button>
            </div>
          </form>
        </div>
      ) : selectedAssignment ? (
        /* ==================== SUBMISSIONS DASHBOARD (SELECTED ASSIGNMENT) ==================== */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                    Batch: {selectedAssignment.batch.name}
                  </span>
                  <h2 className="text-lg font-bold text-foreground mt-1">{selectedAssignment.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedAssignment.course.title}</p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
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
                        <th className="py-2.5">Auto Score</th>
                        <th className="py-2.5">Grade</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {submissions.map((sub) => (
                        <tr
                          key={sub.id}
                          className={`hover:bg-card-hover transition-colors ${selectedSubmission?.id === sub.id ? "bg-violet-500/5" : ""
                            }`}
                        >
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-foreground">{sub.student.name}</p>
                            <p className="text-[10px] text-muted">{sub.student.email}</p>
                          </td>
                          <td className="py-3 pr-2 text-muted">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-2 font-bold text-foreground">
                            {sub.totalScore !== null ? `${sub.totalScore}/${selectedAssignment.maxPoints}` : "-"}
                          </td>
                          <td className="py-3 pr-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${sub.status === "GRADED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                                }`}
                            >
                              {sub.status === "GRADED" ? sub.grade || "Graded" : "Pending Evaluation"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleSelectSubmission(sub)}
                              className="btn-secondary text-[10px] py-1 px-2.5"
                            >
                              Review Answers
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

          {/* Submission Evaluation Sidebar */}
          <div className="space-y-4">
            <div className="glass-card p-5 border border-border/80">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Evaluation Assistant
              </h3>

              {!selectedSubmission ? (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  Select a student from the list to review their answers, see the auto-graded score, and add custom feedback notes.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl border border-border/80 bg-background/50">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Student Profile</p>
                    <p className="text-sm font-bold text-foreground mt-1">{selectedSubmission.student.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedSubmission.student.email}</p>

                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                      <div>
                        <p className="text-[9px] font-bold text-muted uppercase">Auto Grade</p>
                        <p className="text-base font-bold text-foreground">
                          {selectedSubmission.totalScore} / {selectedSubmission.assignment.maxPoints}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted uppercase">Status</p>
                        <p
                          className={`text-xs font-bold ${selectedSubmission.status === "GRADED" ? "text-emerald-400" : "text-amber-400"
                            }`}
                        >
                          {selectedSubmission.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question Answers Details */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Student Responses</p>
                    {selectedSubmission.assignment.questions.map((q, idx) => {
                      const response = selectedSubmission.questionResponses.find(
                        (r) => r.questionId === q.id
                      );
                      const selectedOption = q.options.find(
                        (o) => o.id === response?.selectedOptionId
                      );

                      return (
                        <div key={q.id} className="p-3 rounded-lg border border-border/50 bg-background/30 text-xs">
                          <p className="font-semibold text-foreground">
                            {idx + 1}. {q.questionText}
                          </p>
                          <div className="mt-2 space-y-1.5 pl-1.5">
                            {q.options.map((o) => {
                              const isSelected = o.id === response?.selectedOptionId;
                              return (
                                <div
                                  key={o.id}
                                  className={`flex items-start gap-1.5 p-1 rounded ${o.isCorrect
                                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                                    : isSelected
                                      ? "bg-danger/10 text-danger"
                                      : "text-muted-foreground"
                                    }`}
                                >
                                  <span className="mt-0.5 shrink-0">
                                    {o.isCorrect ? "✅" : isSelected ? "❌" : "○"}
                                  </span>
                                  <span className="leading-tight">{o.optionText}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted">
                            <span>Marks weight: {q.marks}</span>
                            <span className={response?.isCorrect ? "text-emerald-400 font-bold" : "text-danger font-bold"}>
                              {response?.isCorrect ? `+${q.marks} marks` : "0 marks"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual Grading Form */}
                  <form onSubmit={handleGradeSubmission} className="space-y-3 pt-3 border-t border-border/60">
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
      ) : (
        /* ==================== LIST VIEW (ALL ASSIGNMENTS) ==================== */
        <div className="space-y-4">
          <div className="glass-card p-5 border border-border/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Active MCQ Assignments
            </h2>

            {assignments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                📚 No assignments posted yet. Click "+ Create Assignment" to post one!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="glass-card p-4 space-y-4 border border-border hover:border-violet-500/30 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                          {assignment.batch.name}
                        </span>
                        <span className="text-[10px] text-muted flex items-center gap-1">
                          <IconCalendar size={11} />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground mt-2 truncate">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border/50">
                      <span>{assignment._count?.questions || 0} Questions</span>
                      <span className="font-semibold text-foreground">
                        {assignment._count?.submissions || 0} Submissions
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="btn-secondary w-full justify-center text-xs py-1.5 border-violet-500/10 text-violet-400 hover:bg-violet-500/10"
                    >
                      View Submissions & Evaluate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
