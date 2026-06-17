import { IconCheck, IconPlayerPlay, IconChevronDown, IconChevronUp, IconBookmark, IconFileDescription } from "@tabler/icons-react";
import type { CourseContentData, CourseModule } from "./types";

interface Props {
  data: CourseContentData;
  selectedModuleId: string | null;
  selectedRecordingId: string | null;
  expandedModules: Set<string>;
  bookmarks: string[];
  onSelectModule: (id: string) => void;
  onSelectRecording: (id: string) => void;
  onToggleModule: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export function LessonSidebar({
  data,
  selectedModuleId,
  selectedRecordingId,
  expandedModules,
  bookmarks,
  onSelectModule,
  onSelectRecording,
  onToggleModule,
  onToggleBookmark,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex-shrink-0">
        <p className="text-sm font-medium text-foreground">{data.course.title}</p>
        <p className="text-[17px] text-muted-foreground mt-0.5">{data.batch?.name ?? "Course"}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {data.modules.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No modules yet.</p>
        ) : (
          data.modules.map((mod, idx) => {
            const isExpanded = expandedModules.has(mod.id);
            const isSelected = selectedModuleId === mod.id;
            const isComplete = mod.completionPercent === 100;
            const inProgress = mod.completionPercent > 0 && mod.completionPercent < 100;
            const modRecordings = data.recordings.filter((r) => r.moduleId === mod.id);

            return (
              <div key={mod.id}>
                <div
                  onClick={() => { onSelectModule(mod.id); onToggleModule(mod.id); }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/5"}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] flex-shrink-0 border ${
                    isComplete ? "bg-primary border-primary text-white" :
                    isSelected ? "border-primary text-primary" :
                    inProgress ? "border-primary/50 text-primary" :
                    "border-border text-muted-foreground"
                  }`}>
                    {isComplete ? <IconCheck size={10} /> :
                     isSelected ? <IconPlayerPlay size={9} className="ml-0.5" /> : idx + 1}
                  </div>
                  <span className={`text-[12px] font-medium flex-1 truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {mod.title}
                  </span>
                  <span className="text-[12px] text-muted shrink-0">
                    {mod.durationSeconds ? `${Math.floor(mod.durationSeconds / 60)}m` : "—"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(mod.id); }}
                    className="p-0.5 rounded hover:bg-muted/10 transition-colors"
                  >
                    <IconBookmark
                      size={12}
                      className={bookmarks.includes(mod.id) ? "text-warning" : "text-muted-foreground"}
                      fill={bookmarks.includes(mod.id) ? "currentColor" : "none"}
                    />
                  </button>
                  {isExpanded ? <IconChevronUp size={18} className="text-muted shrink-0" /> :
                    <IconChevronDown size={18} className="text-muted shrink-0" />}
                </div>

                {isExpanded && (
                  <div className="pl-11 pr-3 pb-1.5 space-y-0.5">
                    {(mod.videoUrl || mod.videoEmbedId) && (
                      <div
                        onClick={() => { onSelectModule(mod.id); onSelectRecording(""); }}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer transition-colors ${selectedModuleId === mod.id && !selectedRecordingId ? "bg-primary/10" : "hover:bg-muted/5"}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedModuleId === mod.id && !selectedRecordingId ? "bg-primary" : "bg-border"}`} />
                        <span className={`text-xs flex-1 truncate ${selectedModuleId === mod.id && !selectedRecordingId ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          Video Lesson
                        </span>
                        <span className="text-[11px] text-muted">
                          {mod.durationSeconds ? `${Math.floor(mod.durationSeconds / 60)}:${String(mod.durationSeconds % 60).padStart(2, "0")}` : "—"}
                        </span>
                      </div>
                    )}

                    {modRecordings.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => { onSelectModule(mod.id); onSelectRecording(rec.id); }}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer transition-colors ${selectedRecordingId === rec.id ? "bg-primary/10" : "hover:bg-muted/5"}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedRecordingId === rec.id ? "bg-primary" : rec.isCompleted ? "bg-primary" : "bg-border"}`} />
                        <span className={`text-xs flex-1 truncate ${selectedRecordingId === rec.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {rec.dayLabel} — {rec.title}
                        </span>
                        <span className="text-[11px] text-muted">{rec.durationLabel}</span>
                      </div>
                    ))}

                    {modRecordings.length === 0 && !mod.videoUrl && !mod.videoEmbedId && (
                      <p className="py-1.5 text-[11px] text-muted italic">No content available</p>
                    )}

                    {mod.resources?.length > 0 && (
                      <>
                        <div className="my-1.5 border-t border-border/20" />
                        <div className="flex items-center gap-1.5 px-3 py-1">
                          <IconFileDescription size={12} className="text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground">Study Material</span>
                        </div>
                        {mod.resources.map((r, ri) => (
                          <a key={ri} href={r.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 py-1.5 px-3 rounded-md hover:bg-muted/5 transition-colors text-xs text-muted-foreground">
                            <IconFileDescription size={13} className="shrink-0 text-muted" />
                            {r.name}
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
