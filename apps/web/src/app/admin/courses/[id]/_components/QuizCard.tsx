"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconX,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconClipboardText,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";

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
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function QuizCard({
  quiz,
  onUpdate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: QuizCardProps) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(quiz.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const [title, setTitle] = useState(quiz.title);
  const [daysFromEnrollment, setDaysFromEnrollment] = useState(
    quiz.daysFromEnrollment?.toString() ?? "",
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

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/admin/courses/modules/quizzes/${quiz.id}`, {
        title,
        daysFromEnrollment:
          daysFromEnrollment !== "" ? Number(daysFromEnrollment) : null,
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
      }),
    onSuccess: () => {
      toast.success("Quiz updated successfully");
      setEditing(false);
      onUpdate();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // Validates quiz data and triggers the update mutation.
  // Checks: title required, each MCQ question needs text + correct answer.
  const handleUpdate = () => {
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

    updateMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete(`/api/admin/courses/modules/quizzes/${quiz.id}`),
    onSuccess: () => {
      toast.success("Deleted successfully");
      onUpdate();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = () => deleteMutation.mutate();

  // Resets all form state back to the original quiz values and exits edit mode.
  const cancelEdit = () => {
    setEditing(false);
    setTitle(quiz.title);
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

  const editFooter = (
    <>
      <button
        onClick={cancelEdit}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        Cancel
      </button>
      <button
        onClick={handleUpdate}
        disabled={updateMutation.isPending}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
      >
        {updateMutation.isPending ? "Saving..." : "Save Changes"}
      </button>
    </>
  );

  const editContent = (
    <>
      <div className="space-y-2">
        <label className="text-xs font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          className="field w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Due Date (Days After Enrollment)
        </label>
        <input
          type="number"
          value={daysFromEnrollment}
          onChange={(e) => setDaysFromEnrollment(e.target.value)}
          placeholder="e.g. 10"
          className="field w-full"
          min={1}
        />
      </div>

      {/* MCQ Section */}
      {hasMcq && (
        <div className="space-y-4 rounded-xl border border-[#e4e2f5] bg-white p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-[#4f63f0]">
            MCQ Questions
          </h5>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="space-y-2 rounded-lg border border-[#e4e2f5] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8b8da3]">
                  Question {qIndex + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1 text-[#8b8da3] hover:text-danger"
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
                <label className="text-[10px] uppercase tracking-wider text-[#8b8da3]">
                  Options
                </label>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`edit-correct-${qIndex}`}
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(qIndex, oIndex)}
                      className="h-4 w-4 accent-[#4f63f0]"
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
                        className="p-1 text-[#8b8da3] hover:text-danger"
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(qIndex)}
                  className="mt-1 flex items-center gap-1 text-xs text-[#4f63f0] hover:text-[#3f52e0]"
                >
                  <IconPlus size={12} /> Add Option
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs text-[#4f63f0] hover:text-[#3f52e0]"
          >
            <IconPlus size={12} /> Add Question
          </button>
        </div>
      )}

      {/* Assignment Section */}
      {hasAssignment && (
        <div className="space-y-3 rounded-xl border border-[#e4e2f5] bg-white p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-blue-500">
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
        <div className="space-y-3 rounded-xl border border-[#e4e2f5] bg-white p-3">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
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
              className="grid grid-cols-1 gap-2 rounded-lg border border-[#e4e2f5]/80 p-2 md:grid-cols-2"
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
                  className="field flex-1 text-xs"
                />
                {testCases.length > 1 && (
                  <button
                    onClick={() => removeTestCase(tcIdx)}
                    className="p-1 text-[#8b8da3] hover:text-danger"
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addTestCase}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            <IconPlus size={12} /> Add Test Case
          </button>
        </div>
      )}
    </>
  );

  const dueLabel =
    quiz.daysFromEnrollment != null
      ? `Due ${quiz.daysFromEnrollment}d after enrollment`
      : quiz.dueDate
        ? `Due ${new Date(quiz.dueDate).toLocaleDateString()}`
        : null;

  const questionCount =
    quiz.hasMcq !== false ? (quiz.questions?.length ?? 0) : 0;

  return (
    <>
      <div className="group flex items-center gap-2.5 rounded-xl border border-[#e4e2f5] bg-white px-2.5 py-2 transition-all duration-200 hover:border-[#cfcbe8] hover:bg-[#f8f7fd]">
        <div className="flex shrink-0 flex-col">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#8b5cf6] hover:bg-[#f3efff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
            title="Move up"
          >
            <IconChevronUp size={13} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded p-0.5 text-[#a3a1c9] transition-colors hover:text-[#8b5cf6] hover:bg-[#f3efff] disabled:opacity-30 disabled:hover:text-[#a3a1c9] disabled:hover:bg-transparent"
            title="Move down"
          >
            <IconChevronDown size={13} />
          </button>
        </div>

        <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#8b5cf6]">
          <IconClipboardText size={13} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[13px] font-medium text-[#1f2233]">
              {quiz.title}
            </p>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1 rounded-md border border-[#e4e2f5] bg-[#f8f7fd] px-1.5 py-0.5 text-[10px] font-mono text-[#8b8da3] transition-colors hover:border-[#cfcbe8] hover:text-[#1f2233]"
              title="Copy quiz ID"
            >
              {copied ? (
                <>
                  <IconCheck size={10} className="text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <IconCopy size={10} />
                  {quiz.id.slice(0, 8)}
                </>
              )}
            </button>
            {quiz.hasAssignment && (
              <span className="whitespace-nowrap rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-500">
                Assignment
              </span>
            )}
            {quiz.hasCoding && (
              <span className="whitespace-nowrap rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-500">
                Coding
              </span>
            )}
          </div>
          {dueLabel && (
            <p className="mt-0.5 text-[10.5px] text-[#8b8da3]">{dueLabel}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {quiz.hasMcq !== false && (
            <span className="whitespace-nowrap text-[11.5px] text-[#8b8da3]">
              {questionCount} Questions
            </span>
          )}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md px-1.5 py-1 text-[10px] font-medium text-[#4f63f0] transition-colors hover:bg-[#4f63f0]/10"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-md p-1 text-[#8b8da3] transition-colors hover:bg-danger/12 hover:text-danger"
            >
              <IconTrash size={12} />
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <FormModal
          open={editing}
          onClose={cancelEdit}
          title="Edit Quiz"
          size="xl"
          footer={editFooter}
        >
          {editContent}
        </FormModal>
      )}
    </>
  );
}
