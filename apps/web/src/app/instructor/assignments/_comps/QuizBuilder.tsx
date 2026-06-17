import { IconTrash } from "@tabler/icons-react";
import type { FormQuestion } from "./types";

interface Props {
  questions: FormQuestion[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onQuestionChange: (index: number, text: string) => void;
  onMarksChange: (index: number, val: number) => void;
  onOptionChange: (index: number, optIndex: number, text: string) => void;
  onSelectCorrect: (index: number, optIndex: number) => void;
}

export function QuizBuilder({
  questions,
  onAdd,
  onRemove,
  onQuestionChange,
  onMarksChange,
  onOptionChange,
  onSelectCorrect,
}: Props) {
  return (
    <div className="space-y-4 pt-4 border-t border-border/60">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Questions ({questions.length})
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="btn-secondary text-[11px] py-1 px-3 border-violet-500/20 text-violet-400 hover:bg-violet-500/10"
        >
          + Add Question
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-4 relative"
          >
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(qIndex)}
                className="absolute top-4 right-4 text-muted hover:text-danger transition-colors"
              >
                <IconTrash size={16} />
              </button>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Question {qIndex + 1} Text
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which of the following is correct about 'let' vs 'var'?"
                  value={q.questionText}
                  onChange={(e) => onQuestionChange(qIndex, e.target.value)}
                  className="field py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Marks</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={q.marks}
                  onChange={(e) => onMarksChange(qIndex, Number(e.target.value))}
                  className="field py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Options (Select one correct answer)
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      opt.isCorrect ? "border-emerald-500/40 bg-emerald-500/10" : "border-border/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-opt-${qIndex}`}
                      checked={opt.isCorrect}
                      onChange={() => onSelectCorrect(qIndex, optIndex)}
                      className="accent-emerald-500 h-4 w-4 shrink-0"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      value={opt.optionText}
                      onChange={(e) => onOptionChange(qIndex, optIndex, e.target.value)}
                      className="bg-transparent border-none w-full p-0 text-xs focus:ring-0 text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
