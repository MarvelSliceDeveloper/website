import { IconClipboardList, IconAward, IconCalendar } from "@tabler/icons-react";
import type { Assignment } from "./types";

interface Props {
  assignments: Assignment[];
  selectedId: string | null;
  onSelect: (a: Assignment) => void;
  onBack: () => void;
}

export function AssignmentsList({ assignments, selectedId, onSelect, onBack }: Props) {
  if (assignments.length === 0) {
    return (
      <div className="glass-card p-12 text-center border border-border/80">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-violet-500/10 text-violet-400 mx-auto mb-4">
          <IconClipboardList size={24} />
        </div>
        <p className="font-semibold text-foreground">No assignments yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create your first quiz or assignment to get started.</p>
      </div>
    );
  }

  return (
    <div className="glass-card border border-border/80 divide-y divide-border/40">
      {assignments.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a)}
          className={`w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-card-hover ${
            selectedId === a.id ? "bg-violet-500/5 border-l-2 border-violet-500" : ""
          }`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            a.type === "QUIZ" ? "bg-violet-500/20 text-violet-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            <IconAward size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
              <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                a.type === "QUIZ" ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {a.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {a.batch.name} · {a.course.title}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted mt-1">
              <span className="flex items-center gap-1"><IconCalendar size={11} /> Due: {new Date(a.dueDate).toLocaleDateString()}</span>
              <span>{a._count?.submissions ?? 0} submissions</span>
              {a.type === "QUIZ" && <span>{a._count?.questions ?? 0} questions</span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
