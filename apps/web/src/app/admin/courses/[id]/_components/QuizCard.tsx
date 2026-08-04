"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  IconX,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";

interface QuizOption {
  id?: string;
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id?: string;
  text: string;
  options: QuizOption[];
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  isSpecialExam?: boolean;
  passingScore?: number;
  timeLimitMin?: number | null;
  maxAttempts?: number | null;
  examType?: string;
  hasMcq?: boolean;
  hasAssignment?: boolean;
  hasCoding?: boolean;
  assignmentInstructions?: string | null;
  assignmentPdfUrl?: string | null;
  codingPrompt?: string | null;
  testCases?: TestCase[] | null;
  questions: QuizQuestion[];
  dueDate?: string | null;
  daysFromEnrollment?: number | null;
}

interface QuizCardProps {
  quiz: Quiz;
  onUpdate: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  isDragging?: boolean;
}

export default function QuizCard({
  quiz,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
}: QuizCardProps) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(quiz.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const [title, setTitle] = useState(quiz.title);
  const [dueDateMode, setDueDateMode] = useState<"absolute" | "days">(
    quiz.daysFromEnrollment != null ? "days" : "absolute"
  );
  const [dueDate, setDueDate] = useState(
    quiz.dueDate ? new Date(quiz.dueDate).toISOString().slice(0, 16) : ""
  );
  const [daysFromEnrollment, setDaysFromEnrollment] = useState(
    quiz.daysFromEnrollment?.toString() ?? ""
  );
  const [passingScore, setPassingScore] = useState(quiz.passingScore ?? 65);
  const [examType, setExamType] = useState<string>(quiz.examType ?? "MCQ");

  // Feature Toggles & Contents
  const [hasMcq, setHasMcq] = useState(quiz.hasMcq ?? true);
  const [hasAssignment, setHasAssignment] = useState(
    quiz.hasAssignment ?? false,
  );
  const [hasCoding, setHasCoding] = useState(quiz.hasCoding ?? false);
  const [assignmentInstructions, setAssignmentInstructions] = useState(
    quiz.assignmentInstructions ?? "",
  );
  const [assignmentPdfUrl, setAssignmentPdfUrl] = useState(
    quiz.assignmentPdfUrl ?? "",
  );
  const [codingPrompt, setCodingPrompt] = useState(quiz.codingPrompt ?? "");
  const [testCases, setTestCases] = useState<TestCase[]>(
    quiz.testCases && quiz.testCases.length > 0
      ? quiz.testCases
      : [{ input: "", expectedOutput: "", isHidden: false }],
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o })),
    })),
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: [{ label: "", isCorrect: false }] },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const addOption = (qIndex: number) => {
    setQuestions(
      questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { label: "", isCorrect: false }] }
          : q,
      ),
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (questions[qIndex].options.length > 1) {
      setQuestions(
        questions.map((q, i) =>
          i === qIndex
            ? { ...q, options: q.options.filter((_, oi) => oi !== oIndex) }
            : q,
        ),
      );
    }
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions(
      questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((opt, oi) => ({
                ...opt,
                isCorrect: oi === oIndex,
              })),
            }
          : q,
      ),
    );
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false },
    ]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  // Validates quiz data and sends PUT request to update the quiz.
  // Checks: title required, each MCQ question needs text + correct answer.
  // Sends only relevant fields based on enabled features (MCQ, assignment, coding).
  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (hasMcq) {
      for (const q of questions) {
        if (!q.text.trim()) {
          toast.error("Please fill in all question texts");
          return;
        }
        const hasCorrect = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          toast.error("Each question must have a correct answer");
          return;
        }
      }
    }

    setLoading(true);
    try {
      await api.put(`/api/admin/courses/modules/quizzes/${quiz.id}`, {
        title,
        dueDate: dueDateMode === "absolute" && dueDate ? new Date(dueDate).toISOString() : null,
        daysFromEnrollment: dueDateMode === "days" && daysFromEnrollment !== "" ? Number(daysFromEnrollment) : null,
        passingScore: Number(passingScore),
        examType:
          hasMcq && hasAssignment && hasCoding ? "ALL_IN_ONE" : examType,
        hasMcq,
        hasAssignment,
        hasCoding,
        assignmentInstructions: hasAssignment
          ? assignmentInstructions
          : undefined,
        assignmentPdfUrl: hasAssignment ? assignmentPdfUrl : undefined,
        codingPrompt: hasCoding ? codingPrompt : undefined,
        testCases: hasCoding ? testCases : undefined,
        questions: hasMcq ? questions : [],
      });
      toast.success("Quiz updated successfully");
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update quiz:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update quiz",
      );
    } finally {
      setLoading(false);
    }
  };

  // Deletes this quiz after confirmation. Calls onUpdate to refresh the parent list.
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/courses/modules/quizzes/${quiz.id}`);
      toast.success("Deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Resets all form state back to the original quiz values and exits edit mode.
  const cancelEdit = () => {
    setEditing(false);
    setTitle(quiz.title);
    setDueDateMode(quiz.daysFromEnrollment != null ? "days" : "absolute");
    setDueDate(quiz.dueDate ? new Date(quiz.dueDate).toISOString().slice(0, 16) : "");
    setDaysFromEnrollment(quiz.daysFromEnrollment?.toString() ?? "");
    setPassingScore(quiz.passingScore ?? 65);
    setExamType(quiz.examType ?? "MCQ");
    setHasMcq(quiz.hasMcq ?? true);
    setHasAssignment(quiz.hasAssignment ?? false);
    setHasCoding(quiz.hasCoding ?? false);
    setAssignmentInstructions(quiz.assignmentInstructions ?? "");
    setCodingPrompt(quiz.codingPrompt ?? "");
    setTestCases(
      quiz.testCases && quiz.testCases.length > 0
        ? quiz.testCases
        : [{ input: "", expectedOutput: "", isHidden: false }],
    );
    setQuestions(
      quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      })),
    );
  };

  if (editing) {
    return (
      <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Edit Quiz</h4>
          <button
            onClick={cancelEdit}
            className="p-1 text-muted hover:text-foreground"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="field"
          />
        </div>

        {/* Due Date Mode */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Due Date</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDueDateMode("absolute")}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${dueDateMode === "absolute" ? "bg-primary text-white border-primary" : "bg-paper text-ink border-hairline"}`}
            >
              Absolute Date
            </button>
            <button
              type="button"
              onClick={() => setDueDateMode("days")}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${dueDateMode === "days" ? "bg-primary text-white border-primary" : "bg-paper text-ink border-hairline"}`}
            >
              Days from Enrollment
            </button>
          </div>
        </div>

        {dueDateMode === "absolute" ? (
          <div className="space-y-2">
            <label className="text-xs font-medium">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="field"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium">Days After Enrollment</label>
            <input
              type="number"
              value={daysFromEnrollment}
              onChange={(e) => setDaysFromEnrollment(e.target.value)}
              placeholder="e.g. 10"
              className="field"
              min={1}
            />
          </div>
        )}

        {/* MCQ Section */}
        {hasMcq && (
          <div className="space-y-4 rounded-md border border-border p-3 bg-card">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-primary">
              MCQ Questions
            </h5>
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="space-y-2 rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Question {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1 text-muted hover:text-danger"
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => {
                    setQuestions(
                      questions.map((question, i) =>
                        i === qIndex
                          ? { ...question, text: e.target.value }
                          : question,
                      ),
                    );
                  }}
                  placeholder="Enter question"
                  className="field"
                />

                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Options
                  </label>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`edit-correct-${qIndex}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIndex, oIndex)}
                        className="h-4 w-4 accent-primary"
                      />
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          setQuestions(
                            questions.map((question, qi) =>
                              qi === qIndex
                                ? {
                                    ...question,
                                    options: question.options.map(
                                      (option, oi) =>
                                        oi === oIndex
                                          ? { ...option, label: e.target.value }
                                          : option,
                                    ),
                                  }
                                : question,
                            ),
                          );
                        }}
                        placeholder={`Option ${oIndex + 1}`}
                        className="field flex-1"
                      />
                      {q.options.length > 1 && (
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="p-1 text-muted hover:text-danger"
                        >
                          <IconX size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 mt-1"
                  >
                    <IconPlus size={12} /> Add Option
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addQuestion}
              className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <IconPlus size={12} /> Add Question
            </button>
          </div>
        )}

        {/* Assignment Section */}
        {hasAssignment && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-card">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Assignment / Practical Task
            </h5>
            <RichEditor
              content={assignmentInstructions}
              onChange={setAssignmentInstructions}
              placeholder="Enter assignment instructions..."
              minHeight="150px"
            />
            <input
              type="text"
              value={assignmentPdfUrl}
              onChange={(e) => setAssignmentPdfUrl(e.target.value)}
              placeholder="Question PDF URL (e.g. /uploads/assignments/question.pdf)"
              className="field text-xs"
            />
          </div>
        )}

        {/* Coding Test Cases Section */}
        {hasCoding && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-card">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Coding Problem & Testcases
            </h5>
            <RichEditor
              content={codingPrompt}
              onChange={setCodingPrompt}
              placeholder="Coding problem description..."
              minHeight="150px"
            />
            {testCases.map((tc, tcIdx) => (
              <div
                key={tcIdx}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded border border-border/60"
              >
                <input
                  type="text"
                  value={tc.input}
                  onChange={(e) => {
                    setTestCases(
                      testCases.map((t, i) =>
                        i === tcIdx ? { ...t, input: e.target.value } : t,
                      ),
                    );
                  }}
                  placeholder="Input"
                  className="field text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      setTestCases(
                        testCases.map((t, i) =>
                          i === tcIdx
                            ? { ...t, expectedOutput: e.target.value }
                            : t,
                        ),
                      );
                    }}
                    placeholder="Expected Output"
                    className="field text-xs flex-1"
                  />
                  {testCases.length > 1 && (
                    <button
                      onClick={() => removeTestCase(tcIdx)}
                      className="p-1 text-muted hover:text-danger"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addTestCase}
              className="text-xs text-emerald-400 flex items-center gap-1"
            >
              <IconPlus size={12} /> Add Test Case
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={cancelEdit} className="btn-secondary text-xs">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="btn-primary text-xs"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
      className={`flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 transition-all duration-200 ${
        isDragging ? "opacity-40 scale-[0.98]" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {onDragStart && (
          <span className="cursor-grab active:cursor-grabbing text-amber-400 hover:text-amber-600 transition-colors">
            <IconGripVertical size={12} />
          </span>
        )}
        <span className="text-sm font-medium text-amber-700">{quiz.title}</span>
        <button
          onClick={copyId}
          className="group relative inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors"
          title="Copy quiz ID"
        >
          {copied ? (
            <IconCheck size={10} className="text-emerald-500" />
          ) : (
            <IconCopy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            {quiz.id.slice(0, 8)}...
          </span>
        </button>
        {quiz.daysFromEnrollment != null ? (
          <span className="text-[11px] text-amber-600">
            Due: {quiz.daysFromEnrollment}d after enrollment
          </span>
        ) : quiz.dueDate ? (
          <span className="text-[11px] text-amber-600">
            Due: {new Date(quiz.dueDate).toLocaleDateString()}
          </span>
        ) : null}
        <div className="flex items-center gap-1 text-[11px] text-amber-600">
          {quiz.hasMcq !== false && (
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {quiz.questions?.length ?? 0} MCQs
            </span>
          )}
          {quiz.hasAssignment && (
            <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
              Assignment
            </span>
          )}
          {quiz.hasCoding && (
            <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">
              Coding ({quiz.testCases?.length ?? 0} Testcases)
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-primary hover:text-primary-hover px-2 py-1"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-danger hover:text-danger px-2 py-1"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
