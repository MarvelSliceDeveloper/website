"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { IconPlus, IconX } from "@tabler/icons-react";

interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  text: string;
  options: QuizOption[];
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { text: "", options: [{ label: "", isCorrect: false }] },
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

  const handleSubmit = async () => {
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
      await api.post(`/admin/courses/modules/${moduleId}/quizzes`, {
        title,
        questions,
      });
      toast.success("Quiz added successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Add Quiz</h4>
        <button
          onClick={onCancel}
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
                <IconPlus size={12} /> Add Option
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
      >
        <IconPlus size={12} /> Add Question
      </button>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary text-xs">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary text-xs"
        >
          {loading ? "Adding..." : "Add Quiz"}
        </button>
      </div>
    </div>
  );
}
