"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus, IconX, IconTrash } from "@tabler/icons-react";

interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  text: string;
  options: QuizOption[];
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface AddQuizFormProps {
  moduleId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddQuizForm({
  moduleId,
  onSuccess,
  onCancel,
}: AddQuizFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSpecialExam, setIsSpecialExam] = useState(false);
  const [passingScore, setPassingScore] = useState(65);
  const [examType, setExamType] = useState<
    "MCQ" | "ASSIGNMENT" | "CODING_TESTCASE" | "ALL_IN_ONE"
  >("MCQ");

  // Section Toggles
  const [hasMcq, setHasMcq] = useState(true);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [hasCoding, setHasCoding] = useState(false);

  // Section Contents
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { text: "", options: [{ label: "", isCorrect: false }] },
  ]);
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentPdfUrl, setAssignmentPdfUrl] = useState("");
  const [codingPrompt, setCodingPrompt] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expectedOutput: "", isHidden: false },
  ]);

  const [loading, setLoading] = useState(false);

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

  // Test Case Handlers
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!hasMcq && !hasAssignment && !hasCoding) {
      toast.error(
        "Please enable at least one exam component (MCQ, Assignment, or Coding)",
      );
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

    if (hasAssignment && !assignmentInstructions.trim()) {
      toast.error("Please enter assignment instructions");
      return;
    }

    if (hasCoding && !codingPrompt.trim()) {
      toast.error("Please enter coding challenge prompt");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/courses/modules/${moduleId}/quizzes`, {
        title,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isSpecialExam,
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
      toast.success(
        isSpecialExam
          ? "Special Exam added successfully"
          : "Quiz added successfully",
      );
      onSuccess();
    } catch (error) {
      console.error("Failed to add quiz:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add quiz",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Add Quiz / Special Exam</h4>
        <button
          onClick={onCancel}
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
          placeholder="Enter title (e.g. Comprehensive Certification Exam)"
          className="field"
        />
      </div>

      <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
        <input
          type="checkbox"
          id="isSpecialExam"
          checked={isSpecialExam}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsSpecialExam(checked);
            if (checked) {
              setHasMcq(true);
              setHasAssignment(true);
              setHasCoding(true);
            }
          }}
          className="h-4 w-4 rounded accent-amber-500"
        />
        <label
          htmlFor="isSpecialExam"
          className="text-xs font-medium cursor-pointer text-amber-300"
        >
          Mark as Special / Certification Exam (Includes MCQ + Assignment +
          Coding Testcases)
        </label>
      </div>

      {isSpecialExam && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">
              Exam Components Included:
            </span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMcq}
                  onChange={(e) => setHasMcq(e.target.checked)}
                  className="rounded accent-primary"
                />
                MCQ Quiz
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAssignment}
                  onChange={(e) => setHasAssignment(e.target.checked)}
                  className="rounded accent-primary"
                />
                Assignment
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCoding}
                  onChange={(e) => setHasCoding(e.target.checked)}
                  className="rounded accent-primary"
                />
                Coding Testcases
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-500/20">
            <div className="space-y-1">
              <label className="text-xs font-medium">Passing Score (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Due Date (optional)</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field"
              />
            </div>
          </div>
        </div>
      )}

      {!isSpecialExam && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Due Date (optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field"
          />
        </div>
      )}

      {/* MCQ Section */}
      {hasMcq && (
        <div className="space-y-4 rounded-md border border-border p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-primary">
            1. MCQ Questions
          </h5>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="space-y-2 rounded-md border border-border/70 p-3 bg-muted/20"
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
                placeholder="Enter question prompt"
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
                      name={`correct-${qIndex}`}
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
                                  options: question.options.map((option, oi) =>
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
        <div className="space-y-3 rounded-md border border-border p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            2. Assignment / Practical Task
          </h5>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Assignment Instructions
            </label>
            <textarea
              value={assignmentInstructions}
              onChange={(e) => setAssignmentInstructions(e.target.value)}
              placeholder="Enter detailed assignment/project instructions for student submission..."
              className="field min-h-[90px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Question PDF URL (optional)
            </label>
            <input
              type="text"
              value={assignmentPdfUrl}
              onChange={(e) => setAssignmentPdfUrl(e.target.value)}
              placeholder="https://.../question.pdf or /uploads/assignments/question.pdf"
              className="field"
            />
          </div>
        </div>
      )}

      {/* Coding Test Cases Section */}
      {hasCoding && (
        <div className="space-y-3 rounded-md border border-border p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            3. Coding Problem & Testcases
          </h5>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Coding Problem Description
            </label>
            <textarea
              value={codingPrompt}
              onChange={(e) => setCodingPrompt(e.target.value)}
              placeholder="Describe the coding challenge and algorithm requirements..."
              className="field min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">
              Test Cases (Input & Output Pairs)
            </label>
            {testCases.map((tc, tcIdx) => (
              <div
                key={tcIdx}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2.5 rounded border border-border/60 bg-muted/20 relative"
              >
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">
                    Input
                  </label>
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
                    placeholder="e.g. [2, 7, 11, 15], target = 9"
                    className="field text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      Expected Output
                    </label>
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
                      placeholder="e.g. [0, 1]"
                      className="field text-xs"
                    />
                  </div>
                  {testCases.length > 1 && (
                    <button
                      onClick={() => removeTestCase(tcIdx)}
                      className="p-1 mt-3 text-muted hover:text-danger"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addTestCase}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1"
            >
              <IconPlus size={12} /> Add Test Case
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary text-xs"
        >
          {loading ? "Adding..." : "Add Quiz / Special Exam"}
        </button>
      </div>
    </div>
  );
}
