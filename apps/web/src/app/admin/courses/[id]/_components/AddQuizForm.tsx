"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  IconPlus,
  IconX,
  IconTrash,
  IconFileSpreadsheet,
  IconSparkles,
} from "@tabler/icons-react";
import { readSheet } from "read-excel-file/browser";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";
import { useAIGenerate } from "@/lib/use-ai-generate";
import type { AIModuleContext } from "./types";

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
  moduleTitle?: string;
  moduleDescription?: string;
  courseTitle?: string;
  courseDescription?: string;
  courseModules?: AIModuleContext[];
  onSuccess: () => void;
  onCancel: () => void;
  open: boolean;
}

export default function AddQuizForm({
  moduleId,
  moduleTitle,
  moduleDescription,
  courseTitle,
  courseDescription,
  courseModules,
  onSuccess,
  onCancel,
  open,
}: AddQuizFormProps) {
  const [title, setTitle] = useState("");
  const [daysFromEnrollment, setDaysFromEnrollment] = useState("");
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

  const excelInputRef = useRef<HTMLInputElement>(null);

  // AI generation
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const aiGenerate = useAIGenerate<{
    title: string;
    questions: QuizQuestion[];
  }>();

  const handleAiGenerate = () => {
    if (!aiTopic.trim() && !moduleTitle?.trim()) {
      toast.error("Enter a topic, or add the module title first");
      return;
    }
    aiGenerate.mutate(
      {
        type: "QUIZ",
        prompt: aiTopic.trim() || `Generate a quiz for this module's content`,
        context: {
          moduleTitle: moduleTitle?.trim(),
          moduleDescription: moduleDescription?.trim(),
          courseTitle,
          courseDescription,
          modules: courseModules,
          questionCount: aiCount,
        },
      },
      {
        onSuccess: (res) => {
          const generated = res.data;
          if (!generated.questions?.length) {
            toast.error("AI returned no questions");
            return;
          }
          setQuestions(generated.questions);
          if (!title.trim() && generated.title) setTitle(generated.title);
          toast.success(
            `Generated ${generated.questions.length} question${generated.questions.length !== 1 ? "s" : ""} — review before saving`,
          );
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const createQuizMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/admin/courses/modules/${moduleId}/quizzes`, {
        title,
        daysFromEnrollment:
          daysFromEnrollment !== "" ? Number(daysFromEnrollment) : undefined,
        passingScore: 65,
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
      toast.success("Quiz added successfully");
      resetForm();
      onSuccess();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await readSheet(file);
      const imported: QuizQuestion[] = [];
      let skipped = 0;

      rows.forEach((row) => {
        const question = String(row[0] ?? "").trim();
        const options = [
          { label: String(row[1] ?? "").trim(), isCorrect: false },
          { label: String(row[2] ?? "").trim(), isCorrect: false },
          { label: String(row[3] ?? "").trim(), isCorrect: false },
          { label: String(row[4] ?? "").trim(), isCorrect: false },
        ];
        const answer = String(row[5] ?? "").trim().toUpperCase();

        if (!question || options.every((o) => !o.label)) {
          skipped++;
          return;
        }

        const answerIndex =
          answer === "A" ? 0 : answer === "B" ? 1 : answer === "C" ? 2 : answer === "D" ? 3 : -1;
        if (answerIndex >= 0) {
          options[answerIndex] = { ...options[answerIndex], isCorrect: true };
        }

        imported.push({
          text: question,
          options: options.filter((o) => o.label || o.isCorrect),
        });
      });

      if (imported.length === 0) {
        toast.error("No valid questions found. Check the file format.");
        return;
      }

      setQuestions((prev) => [...prev, ...imported]);
      toast.success(
        `Imported ${imported.length} question${imported.length !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} row${skipped !== 1 ? "s" : ""} skipped)` : ""}`,
      );
    } catch {
      toast.error("Failed to read the Excel file. Use a .xlsx file.");
    } finally {
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setDaysFromEnrollment("");
    setExamType("MCQ");
    setHasMcq(true);
    setHasAssignment(false);
    setHasCoding(false);
    setQuestions([
      { text: "", options: [{ label: "", isCorrect: false }] },
    ]);
    setAssignmentInstructions("");
    setAssignmentPdfUrl("");
    setCodingPrompt("");
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
  };

  const close = () => {
    resetForm();
    onCancel();
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    createQuizMutation.mutate();
  };

  const footer = (
    <>
      <button onClick={close} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
      <button
        type="submit"
        disabled={createQuizMutation.isPending}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
        form="add-quiz-form"
      >
        {createQuizMutation.isPending ? "Adding..." : "Add Quiz"}
      </button>
    </>
  );

  const formContent = (
    <form id="add-quiz-form" onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title"
          className="field w-full"
        />
      </div>

      {/* Due Date */}
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
        <div className="space-y-4 rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-primary">
              1. MCQ Questions
            </h5>
            <button
              type="button"
              onClick={() => excelInputRef.current?.click()}
              className="flex items-center gap-1 rounded-md border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <IconFileSpreadsheet size={13} />
              Import from Excel
            </button>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">
            Excel columns: Question | A | B | C | D | Correct Answer (A/B/C/D)
          </p>

          {/* AI generation row */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-violet-300/50 bg-violet-500/5 p-2.5">
            <IconSparkles size={15} className="shrink-0 text-violet-500" />
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAiGenerate())}
                placeholder="Optional — anything specific to focus on?"
                className="field w-full text-xs"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {moduleTitle
                  ? `Generates from this module: “${moduleTitle}${moduleDescription ? ` — ${moduleDescription.slice(0, 80)}${moduleDescription.length > 80 ? "…" : ""}` : ""}”`
                  : "No module title set yet — enter a topic above"}
              </p>
            </div>
            <input
              type="number"
              value={aiCount}
              onChange={(e) =>
                setAiCount(Math.min(Math.max(parseInt(e.target.value) || 5, 1), 30))
              }
              min={1}
              max={30}
              title="Number of questions"
              className="field w-16 text-xs"
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerate.isPending || (!aiTopic.trim() && !moduleTitle?.trim())}
              className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
            >
              {aiGenerate.isPending ? "Generating…" : "Generate with AI"}
            </button>
          </div>
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
                    type="button"
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
                className="field text-xs"
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
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="p-1 text-muted hover:text-danger"
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 mt-1"
                >
                  <IconPlus size={12} /> Add Option
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
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
            <label className="text-xs font-medium text-muted-foreground">
              Instructions
            </label>
            <RichEditor
              content={assignmentInstructions}
              onChange={setAssignmentInstructions}
              placeholder="Enter detailed assignment/project instructions for student submission..."
              minHeight="150px"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Question PDF URL (optional)
            </label>
            <input
              type="text"
              value={assignmentPdfUrl}
              onChange={(e) => setAssignmentPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../preview"
              className="field text-xs"
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
            <label className="text-xs font-medium text-muted-foreground">
              Coding Problem Description
            </label>
            <RichEditor
              content={codingPrompt}
              onChange={setCodingPrompt}
              placeholder="Describe the coding challenge and algorithm requirements..."
              minHeight="150px"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
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
                      type="button"
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
              type="button"
              onClick={addTestCase}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1"
            >
              <IconPlus size={12} /> Add Test Case
            </button>
          </div>
        </div>
      )}
    </form>
  );

  return (
    <FormModal open={open} onClose={close} title="Add Quiz" size="xl" footer={footer}>
      {formContent}
    </FormModal>
  );
}