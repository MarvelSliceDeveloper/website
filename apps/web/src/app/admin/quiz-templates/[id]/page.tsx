"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";

type QuestionForm = {
  text: string;
  marks: number;
  options: { optionText: string; isCorrect: boolean }[];
};

export default function QuizTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      api
        .get<{
          template: {
            title: string;
            description: string | null;
            category: string | null;
            questions: any[];
          };
        }>(`/api/admin/quiz-templates/${id}`)
        .then((data) => {
          const t = data.template;
          setTitle(t.title);
          setDescription(t.description || "");
          setCategory(t.category || "");
          setQuestions(
            t.questions.map((q: any) => ({
              text: q.text,
              marks: q.marks,
              options: q.options.map((o: any) => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
              })),
            })),
          );
        })
        .catch(() => toast.error("Failed to load template"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { text: "", marks: 1, options: [{ optionText: "", isCorrect: false }] },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addOption(qIndex: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = {
        ...copy[qIndex],
        options: [
          ...copy[qIndex].options,
          { optionText: "", isCorrect: false },
        ],
      };
      return copy;
    });
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = {
        ...copy[qIndex],
        options: copy[qIndex].options.filter((_, i) => i !== oIndex),
      };
      return copy;
    });
  }

  async function handleSave() {
    if (!title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        questions: questions.map((q) => ({
          text: q.text,
          marks: q.marks,
          options: q.options,
        })),
      };

      if (isNew) {
        await api.post("/api/admin/quiz-templates", payload);
        toast.success("Quiz template created");
      } else {
        await api.put(`/api/admin/quiz-templates/${id}`, payload);
        toast.success("Quiz template updated");
      }
      router.push("/admin/quiz-templates");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this template?")) return;
    try {
      await api.delete(`/api/admin/quiz-templates/${id}`);
      toast.success("Deleted");
      router.push("/admin/quiz-templates");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center text-muted animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/quiz-templates")}
            className="btn-secondary text-xs py-2"
          >
            <IconArrowLeft size={14} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
              Library
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {isNew ? "Add Quiz Template" : "Edit Quiz Template"}
            </h1>
          </div>
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="text-danger hover:text-danger/80 text-xs flex items-center gap-1"
          >
            <IconTrash size={14} /> Delete
          </button>
        )}
      </div>

      <div className="glass-card p-5 border border-border/80 space-y-4">
        <input
          type="text"
          placeholder="Template title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input text-sm w-full"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input text-xs w-full"
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input text-xs w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Questions ({questions.length})
          </h2>
          <button
            onClick={addQuestion}
            className="btn-primary text-xs py-1.5 px-3"
          >
            + Add Question
          </button>
        </div>

        {questions.map((q, qi) => (
          <div
            key={qi}
            className="glass-card p-4 border border-border/80 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) => {
                    const copy = [...questions];
                    copy[qi] = { ...copy[qi], text: e.target.value };
                    setQuestions(copy);
                  }}
                  className="input text-xs w-full"
                />
                <input
                  type="number"
                  placeholder="Marks"
                  value={q.marks}
                  onChange={(e) => {
                    const copy = [...questions];
                    copy[qi] = {
                      ...copy[qi],
                      marks: parseInt(e.target.value) || 1,
                    };
                    setQuestions(copy);
                  }}
                  className="input text-xs w-20"
                />
              </div>
              <button
                onClick={() => removeQuestion(qi)}
                className="text-danger hover:text-danger/80 text-[10px] shrink-0 mt-1"
              >
                <IconTrash size={12} />
              </button>
            </div>

            <div className="pl-4 border-l-2 border-border/60 space-y-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={o.isCorrect}
                    onChange={(e) => {
                      const copy = [...questions];
                      copy[qi].options[oi] = {
                        ...copy[qi].options[oi],
                        isCorrect: e.target.checked,
                      };
                      setQuestions(copy);
                    }}
                    className="shrink-0"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${oi + 1}`}
                    value={o.optionText}
                    onChange={(e) => {
                      const copy = [...questions];
                      copy[qi].options[oi] = {
                        ...copy[qi].options[oi],
                        optionText: e.target.value,
                      };
                      setQuestions(copy);
                    }}
                    className="input text-[10px] flex-1"
                  />
                  {q.options.length > 1 && (
                    <button
                      onClick={() => removeOption(qi, oi)}
                      className="text-muted hover:text-danger text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addOption(qi)}
                className="text-[10px] text-primary-hover hover:text-primary"
              >
                + Add option
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-2.5 px-6 disabled:opacity-40"
        >
          {saving ? "Saving..." : isNew ? "Add Template" : "Save Changes"}
        </button>
        <button
          onClick={() => router.push("/admin/quiz-templates")}
          className="btn-secondary text-sm py-2.5 px-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
