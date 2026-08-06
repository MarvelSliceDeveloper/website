"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/toast";
import {
  IconClock,
  IconCheck,
  IconLoader2,
  IconPlus,
  IconX,
  IconSettings,
  IconClipboardText,
} from "@tabler/icons-react";
import type { Module } from "./types";
import ModuleCard from "./ModuleCard";
import RichEditor from "@/components/editor/RichEditor";

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
    questionCount: number;
    questions?: CertQuestion[];
  } | null;
}

interface CertificationTabProps {
  courseId: string;
}

export default function CertificationTab({ courseId }: CertificationTabProps) {
  const [courseData, setCourseData] = useState<{ modules: Module[] } | null>(
    null,
  );
  const [data, setData] = useState<CertificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Certification Exam");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimitMin, setTimeLimitMin] = useState("30");
  const [questions, setQuestions] = useState<CertQuestion[]>([
    { text: "", options: [{ label: "", isCorrect: false }] },
  ]);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);

  const applyData = (result: CertificationData) => {
    setData(result);
    if (result.quiz) {
      setTitle(result.module?.title ?? "Certification Exam");
      setPassingScore(result.quiz.passingScore);
      setTimeLimitMin(result.quiz.timeLimitMin?.toString() ?? "30");
      setHasAssignment(result.quiz.hasAssignment ?? false);
      setAssignmentInstructions(result.quiz.assignmentInstructions ?? "");
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

  const reload = async () => {
    try {
      const [courseRes, certRes] = await Promise.all([
        api.get<{ modules: Module[] }>(`/api/admin/courses/${courseId}`),
        api.get<CertificationData>(
          `/api/admin/courses/${courseId}/certification`,
        ),
      ]);
      setCourseData(courseRes);
      applyData(certRes);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadCourse = api
      .get<{ modules: Module[] }>(`/api/admin/courses/${courseId}`)
      .then((res) => {
        if (!cancelled) setCourseData(res);
      })
      .catch(() => {
        /* course data is non-critical here */
      });
    const loadCert = api
      .get<CertificationData>(`/api/admin/courses/${courseId}/certification`)
      .then((res) => {
        if (!cancelled) applyData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      });
    Promise.all([loadCourse, loadCert]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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

  const handleSaveQuestion = async () => {
    setQuestionSaving(true);
    try {
      await api.put(`/api/admin/courses/${courseId}/certification`, {
        title,
        passingScore,
        timeLimitMin: timeLimitMin ? parseInt(timeLimitMin) : null,
        hasAssignment,
        assignmentInstructions: hasAssignment
          ? assignmentInstructions
          : null,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({
            label: o.label,
            isCorrect: o.isCorrect,
          })),
        })),
      });
      toast.success("Certification settings saved");
      reload();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setQuestionSaving(false);
    }
  };

  const certModule = courseData?.modules.find((m) => m.isCertificationModule);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {certModule ? (
        <ModuleCard
          key={certModule.id}
          module={certModule}
          index={0}
          courseId={courseId}
          onChanged={reload}
          certModule
          onAddQuestion={() => {
            setShowQuestions(true);
            document
              .getElementById("cert-exam-settings")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onAddAssignment={() => {
            setHasAssignment(true);
            setShowQuestions(false);
            document
              .getElementById("cert-exam-settings")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          passingScore={passingScore}
          timeLimitMin={timeLimitMin ? parseInt(timeLimitMin) : null}
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
            <label className="label">Exam Title</label>
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
                Passing Score (%)
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
                Time Limit (minutes) *
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

          {/* Assignment Section */}
          <div className="rounded-xl border border-border/70 p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasAssignment}
                onChange={(e) => setHasAssignment(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">
                Include Assignment
              </span>
              <span className="text-xs text-muted">
                Students must submit an assignment along with the exam
              </span>
            </label>
            {hasAssignment && (
              <div className="mt-3 space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Assignment Instructions
                </label>
                <RichEditor
                  content={assignmentInstructions}
                  onChange={setAssignmentInstructions}
                  placeholder="Enter assignment instructions..."
                  minHeight="150px"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveQuestion}
              className="btn-primary inline-flex items-center gap-2"
              disabled={questionSaving}
            >
              {questionSaving ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconSettings className="h-4 w-4" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Exam Questions Builder */}
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
                {questions.length} MCQ question{questions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowQuestions((v) => !v)}
            className="btn-secondary text-xs"
          >
            {showQuestions ? "Hide" : "Edit Questions"}
          </button>
        </div>

        {showQuestions && (
          <div className="space-y-4">
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

            <div className="flex items-center justify-between">
              <button
                onClick={addQuestion}
                className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <IconPlus size={14} /> Add Question
              </button>
              <button
                onClick={handleSaveQuestion}
                className="btn-primary text-xs inline-flex items-center gap-1"
                disabled={questionSaving}
              >
                {questionSaving && (
                  <IconLoader2 className="h-3 w-3 animate-spin" />
                )}
                Save Questions
              </button>
            </div>
          </div>
        )}
      </div>

      {data.quiz && (
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Current Configuration
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Passing Score</p>
              <p className="text-lg font-bold text-foreground">
                {data.quiz.passingScore}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Time Limit</p>
              <p className="text-lg font-bold text-foreground">
                {data.quiz.timeLimitMin
                  ? `${data.quiz.timeLimitMin} min`
                  : "None"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted">Questions</p>
              <p className="text-lg font-bold text-foreground">
                {data.quiz.questionCount}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted">Assignment</p>
            <p className="text-sm font-medium text-foreground">
              {data.quiz.hasAssignment ? "Included" : "Not included"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}