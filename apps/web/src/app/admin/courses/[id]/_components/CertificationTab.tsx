"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import {
  IconClock,
  IconCheck,
  IconLoader2,
  IconPlus,
  IconX,
  IconSettings,
  IconClipboardText,
  IconExternalLink,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import type { Module } from "./types";
import ModuleCard from "./ModuleCard";
import RichEditor from "@/components/editor/RichEditor";
import { FormModal } from "@/components/admin/FormModal";
import { readSheet } from "read-excel-file/browser";

interface CertQuestion {
  id?: string;
  text: string;
  options: { label: string; isCorrect: boolean }[];
}

interface CertificationData {
  module: Module | null;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    timeLimitMin: number | null;
    hasMcq: boolean;
    hasAssignment: boolean;
    assignmentInstructions: string | null;
    assignmentPdfUrl: string | null;
    questionCount: number;
    questions?: CertQuestion[];
  } | null;
}

interface CertificationTabProps {
  courseId: string;
}

export default function CertificationTab({ courseId }: CertificationTabProps) {
  const courseQuery = useApiQuery<{ modules: Module[] }>(
    ["admin", "courses", courseId],
    `/api/admin/courses/${courseId}`,
  );
  const certQuery = useApiQuery<CertificationData>(
    ["admin", "courses", courseId, "certification"],
    `/api/admin/courses/${courseId}/certification`,
  );

  const [title, setTitle] = useState("Certification Exam");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimitMin, setTimeLimitMin] = useState("30");
  const [questions, setQuestions] = useState<CertQuestion[]>([
    { text: "", options: [{ label: "", isCorrect: false }] },
  ]);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentPdfUrl, setAssignmentPdfUrl] = useState("");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const applyData = (result: CertificationData) => {
    if (result.quiz) {
      setTitle(result.module?.title ?? "Certification Exam");
      setPassingScore(result.quiz.passingScore);
      setTimeLimitMin(result.quiz.timeLimitMin?.toString() ?? "30");
      setHasAssignment(result.quiz.hasAssignment ?? false);
      setAssignmentInstructions(result.quiz.assignmentInstructions ?? "");
      setAssignmentPdfUrl(result.quiz.assignmentPdfUrl ?? "");
      setQuestions(
        result.quiz.questions && result.quiz.questions.length > 0
          ? (result.quiz.questions as CertQuestion[]).map((q) => ({
              ...q,
              options: q.options.map((o) => ({ ...o })),
            }))
          : [{ text: "", options: [{ label: "", isCorrect: false }] }],
      );
    }
  };

  useEffect(() => {
    if (certQuery.data) applyData(certQuery.data);
  }, [certQuery.data]);

  const handleReload = () => {
    void courseQuery.refetch();
    void certQuery.refetch();
  };

  const certData = certQuery.data;

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/admin/courses/${courseId}/certification`, {
        title,
        passingScore,
        timeLimitMin: timeLimitMin ? parseInt(timeLimitMin) : null,
        hasAssignment,
        assignmentInstructions: hasAssignment
          ? assignmentInstructions
          : null,
        assignmentPdfUrl: hasAssignment ? assignmentPdfUrl || null : null,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({
            label: o.label,
            isCorrect: o.isCorrect,
          })),
        })),
      }),
    onSuccess: () => {
      toast.success("Certification settings saved");
      handleReload();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // ── Question helpers (immutable updates) ────────────────────────
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", options: [{ label: "", isCorrect: false }] },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text } : q)),
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { label: "", isCorrect: false }] }
          : q,
      ),
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex && q.options.length > 1
          ? { ...q, options: q.options.filter((_, oi) => oi !== oIndex) }
          : q,
      ),
    );
  };

  const updateOptionLabel = (qIndex: number, oIndex: number, label: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((opt, oi) =>
                oi === oIndex ? { ...opt, label } : opt,
              ),
            }
          : q,
      ),
    );
  };

  const markCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
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

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await readSheet(file);
      const imported: CertQuestion[] = [];
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

  const handleSaveSettings = () => saveMutation.mutate();

  const certModule = courseQuery.data?.modules.find(
    (m) => m.isCertificationModule,
  );

  if (courseQuery.isPending || certQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  // ── Questions Modal Content ────────────────────────────────────
  const questionsModalFooter = (
    <>
      <button
        onClick={() => setShowQuestionsModal(false)}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        Cancel
      </button>
      <button
        onClick={async () => {
          await handleSaveSettings();
          setShowQuestionsModal(false);
        }}
        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && (
          <IconLoader2 className="h-3 w-3 animate-spin" />
        )}
        Save Questions
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {certModule ? (
        <ModuleCard
          key={certModule.id}
          module={certModule}
          index={0}
          courseId={courseId}
          onChanged={handleReload}
          certModule
          onAddQuestion={() => setShowQuestionsModal(true)}
          onAddAssignment={() => {
            const addAssignmentBtn = document.querySelector<HTMLButtonElement>(
              `[data-cert-add-assignment="${certModule.id}"]`,
            );
            if (addAssignmentBtn) {
              addAssignmentBtn.click();
            }
          }}
          passingScore={passingScore}
          timeLimitMin={timeLimitMin ? parseInt(timeLimitMin) : null}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          canMoveUp={false}
          canMoveDown={false}
        />
      ) : (
        <div className="glass-card flex items-start gap-3 p-5">
          <IconSettings className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted">
            No certification module exists for this course yet. Configure the
            exam below and click <span className="font-medium text-foreground">Save Settings</span> to
            create it — it will always appear as the last module.
          </p>
        </div>
      )}

      {/* Exam Settings */}
      <div id="cert-exam-settings" className="glass-card p-6 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <IconSettings className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Exam Settings
            </h3>
            <p className="text-xs text-muted">
              Configure the certification exam parameters
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field">
            <label className="label">Exam Title <span className="text-danger">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label className="label flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-500" />
                Passing Score (%) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 60)}
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                Students must score at least {passingScore}% to pass
              </p>
            </div>

            <div className="field">
              <label className="label flex items-center gap-2">
                <IconClock className="h-4 w-4 text-blue-500" />
                Time Limit (minutes) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={timeLimitMin}
                onChange={(e) => setTimeLimitMin(e.target.value)}
                className="input"
              />
              <p className="text-xs text-muted mt-1">
                The exam runs a countdown timer and auto-submits when it hits 0
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
<button
            onClick={handleSaveSettings}
            className="btn-primary inline-flex items-center gap-2"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSettings className="h-4 w-4" />
            )}
            Save Settings
          </button>
          </div>
        </div>
      </div>

      {/* Exam Questions Summary Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <IconClipboardText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Exam Questions
              </h3>
              <p className="text-xs text-muted">
                {questions.filter((q) => q.text.trim()).length} MCQ question{questions.filter((q) => q.text.trim()).length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowQuestionsModal(true)}
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <IconClipboardText size={14} />
            Edit Questions
          </button>
        </div>

        {/* Quick preview of questions */}
        {questions.filter((q) => q.text.trim()).length > 0 && (
          <div className="space-y-1.5">
            {questions.filter((q) => q.text.trim()).slice(0, 5).map((q, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 text-xs"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-600 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-foreground truncate">{q.text}</span>
                <span className="text-muted ml-auto shrink-0">
                  {q.options.length} opts
                </span>
              </div>
            ))}
            {questions.filter((q) => q.text.trim()).length > 5 && (
              <p className="text-[10px] text-muted text-center pt-1">
                +{questions.filter((q) => q.text.trim()).length - 5} more questions
              </p>
            )}
          </div>
        )}
      </div>

      {/* Current Configuration Summary */}
      {certData?.quiz && (
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Current Configuration
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Passing Score</p>
              <p className="text-lg font-bold text-foreground">
                {certData.quiz.passingScore}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Time Limit</p>
              <p className="text-lg font-bold text-foreground">
                {certData.quiz.timeLimitMin
                  ? `${certData.quiz.timeLimitMin} min`
                  : "None"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Questions</p>
              <p className="text-lg font-bold text-foreground">
                {certData.quiz.questionCount}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Assignment</p>
              <p className="text-sm font-medium text-foreground">
                {certData.quiz.hasAssignment ? "Included" : "Not included"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Question Paper PDF</p>
              <p className="text-sm font-medium text-foreground">
                {certData.quiz.assignmentPdfUrl ? (
                  <a
                    href={certData.quiz.assignmentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <IconExternalLink size={12} /> View PDF
                  </a>
                ) : (
                  "None"
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      <FormModal
        open={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        title="Edit Exam Questions"
        size="lg"
        footer={questionsModalFooter}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-emerald-700">
                Import questions from Excel
              </p>
              <p className="text-[10px] text-emerald-700/80">
                Columns: Question | A | B | C | D | Correct Answer (A/B/C/D)
              </p>
            </div>
            <button
              type="button"
              onClick={() => excelInputRef.current?.click()}
              className="flex items-center gap-1 rounded-md border border-emerald-300/60 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="space-y-2 rounded-lg border border-border/70 p-3 bg-muted/20"
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
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                placeholder="Enter question prompt"
                className="input text-sm"
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
                      onChange={() => markCorrectOption(qIndex, oIndex)}
                      className="h-4 w-4 accent-primary"
                    />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) =>
                        updateOptionLabel(qIndex, oIndex, e.target.value)
                      }
                      placeholder={`Option ${oIndex + 1}`}
                      className="input flex-1"
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

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <button
              onClick={addQuestion}
              className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <IconPlus size={14} /> Add Question
            </button>
            <span className="text-[10px] text-muted">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </FormModal>
    </div>
  );
}