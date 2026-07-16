"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconX, IconGripVertical } from "@tabler/icons-react";

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

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
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
  const [title, setTitle] = useState(quiz.title);
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
    const updated = [...questions];
    updated[qIndex].options.push({ label: "", isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (questions[qIndex].options.length > 1) {
      const updated = [...questions];
      updated[qIndex].options = updated[qIndex].options.filter(
        (_, i) => i !== oIndex,
      );
      setQuestions(updated);
    }
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oIndex,
    }));
    setQuestions(updated);
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

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

    setLoading(true);
    try {
      await api.put(`/api/admin/courses/modules/quizzes/${quiz.id}`, {
        title,
        questions,
      });
      toast.success("Quiz updated successfully");
      setEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/courses/modules/quizzes/${quiz.id}`);
      toast.success("Quiz deleted successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete quiz");
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setTitle(quiz.title);
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
          <label className="text-xs font-medium">Quiz Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
            className="field"
          />
        </div>

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="space-y-2 rounded-md border border-border p-3">
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
                  const updated = [...questions];
                  updated[qIndex].text = e.target.value;
                  setQuestions(updated);
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
                      name={`correct-${qIndex}`}
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(qIndex, oIndex)}
                      className="h-4 w-4 accent-primary"
                    />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIndex].options[oIndex].label = e.target.value;
                        setQuestions(updated);
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
                  Add Option
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
        >
          Add Question
        </button>

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
      className={`flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 transition-all duration-200 ${isDragging ? "opacity-40 scale-[0.98]" : ""}`}
    >
      <div className="flex items-center gap-2">
        {onDragStart && (
          <span className="cursor-grab active:cursor-grabbing text-amber-400 hover:text-amber-600 transition-colors">
            <IconGripVertical size={12} />
          </span>
        )}
        <span className="text-sm font-medium text-amber-700">
          {quiz.title}
        </span>
        <span className="text-xs text-amber-600">
          {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
        </span>
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
