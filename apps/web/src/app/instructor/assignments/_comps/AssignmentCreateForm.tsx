import { useState } from "react";
import { QuizBuilder } from "./QuizBuilder";
import type { FormQuestion } from "./types";
import { emptyFormQuestions } from "./types";

interface Props {
  selectedBatchId: string;
  batches: Array<{
    id: string;
    name: string;
    course: { id: string; title: string };
  }>;
  onCancel: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    dueDate: string;
    type: "QUIZ" | "ASSIGNMENT";
    batchId: string;
    questionPdfUrl: string | null;
    maxPoints: number;
    formQuestions: FormQuestion[];
  }) => Promise<void>;
}

export function AssignmentCreateForm({
  selectedBatchId,
  batches,
  onCancel,
  onSubmit,
}: Props) {
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formType, setFormType] = useState<"QUIZ" | "ASSIGNMENT">("QUIZ");
  const [formQuestions, setFormQuestions] =
    useState<FormQuestion[]>(emptyFormQuestions());
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [formQuestionPdfUrl, setFormQuestionPdfUrl] = useState<string | null>(
    null,
  );
  const [formMaxPoints, setFormMaxPoints] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const handleAddQuestion = () => {
    const last = formQuestions[formQuestions.length - 1];
    if (last && !last.questionText.trim()) return;
    setFormQuestions((prev) => [
      ...prev,
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

  const handleRemoveQuestion = (index: number) => {
    setFormQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, text: string) => {
    setFormQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, questionText: text } : q)),
    );
  };

  const handleMarksChange = (index: number, marks: number) => {
    setFormQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, marks } : q)),
    );
  };

  const handleOptionChange = (
    index: number,
    optIndex: number,
    text: string,
  ) => {
    setFormQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? {
              ...q,
              options: q.options.map((o, oi) =>
                oi === optIndex ? { ...o, optionText: text } : o,
              ),
            }
          : q,
      ),
    );
  };

  const handleSelectCorrect = (index: number, optIndex: number) => {
    setFormQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? {
              ...q,
              options: q.options.map((o, oi) => ({
                ...o,
                isCorrect: oi === optIndex,
              })),
            }
          : q,
      ),
    );
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFormQuestionPdfUrl(data.url);
    } catch {
      setFormQuestionPdfUrl(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title: formTitle,
        description: formDescription,
        dueDate: formDueDate,
        type: formType,
        batchId: selectedBatchId,
        questionPdfUrl: formQuestionPdfUrl,
        maxPoints: formMaxPoints,
        formQuestions,
      });
      setFormTitle("");
      setFormDescription("");
      setFormDueDate("");
      setFormType("QUIZ");
      setFormQuestions(emptyFormQuestions());
      setFormQuestionPdfUrl(null);
      setFormMaxPoints(100);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 border border-border/80 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <span>📝</span> Create New Assessment
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        Build a quiz with auto-grading or post a PDF-based assignment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Batch
          </label>
          <div className="field py-2 text-sm text-foreground bg-card-hover/50 cursor-not-allowed opacity-70">
            {batches
              .filter((b) => b.id === selectedBatchId)
              .map((b) => (
                <span key={b.id}>
                  {b.name} — {b.course.title}
                </span>
              ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Assessment Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Midterm Quiz: JavaScript Fundamentals"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="field py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Description
          </label>
          <textarea
            required
            rows={2}
            placeholder="Brief description of the assessment for students..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="field text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              className="field py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Assessment Type
            </label>
            <div className="flex gap-2 h-full items-end pb-1">
              <button
                type="button"
                onClick={() => setFormType("QUIZ")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  formType === "QUIZ"
                    ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                    : "bg-background border-border/60 text-muted hover:border-border"
                }`}
              >
                Quiz (Auto-Graded)
              </button>
              <button
                type="button"
                onClick={() => setFormType("ASSIGNMENT")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  formType === "ASSIGNMENT"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-background border-border/60 text-muted hover:border-border"
                }`}
              >
                Assignment (PDF)
              </button>
            </div>
          </div>
        </div>

        {formType === "QUIZ" && (
          <QuizBuilder
            questions={formQuestions}
            onAdd={handleAddQuestion}
            onRemove={handleRemoveQuestion}
            onQuestionChange={handleQuestionChange}
            onMarksChange={handleMarksChange}
            onOptionChange={handleOptionChange}
            onSelectCorrect={handleSelectCorrect}
          />
        )}

        {formType === "ASSIGNMENT" && (
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Question PDF & Grading
            </h3>
            <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Upload Question PDF
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Upload a PDF containing the assignment questions. Students
                  will download this and submit their answers as a file.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
                  className="field py-2 text-sm"
                />
                {uploadingPdf && (
                  <p className="text-xs text-accent animate-pulse">
                    Uploading PDF…
                  </p>
                )}
                {formQuestionPdfUrl && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
                    <span className="text-emerald-400 text-sm">✅</span>
                    <span className="text-xs text-emerald-300 font-medium truncate flex-1">
                      PDF uploaded successfully
                    </span>
                    <a
                      href={formQuestionPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline shrink-0"
                    >
                      Preview →
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Maximum Points
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formMaxPoints}
                  onChange={(e) => setFormMaxPoints(Number(e.target.value))}
                  className="field py-2 text-sm w-40"
                  placeholder="100"
                />
                <p className="text-[11px] text-muted-foreground">
                  The total points this assignment is worth. Instructors will
                  manually grade submissions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onCancel}
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
  );
}
