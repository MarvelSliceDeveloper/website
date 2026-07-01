"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { IconX, IconDeviceFloppy, IconCheck, IconPin } from "@tabler/icons-react";
import { api } from "@/lib/api";
import RichEditor from "@/components/editor/RichEditor";
import { useDraggable } from "@/hooks/useDraggable";
import { useResizable } from "@/hooks/useResizable";

interface StickyNoteWidgetProps {
  courseId: string;
  moduleId: string | null;
  moduleTitle?: string;
  onClose: () => void;
}

interface StickyNote {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isSticky?: boolean;
}

const STORAGE_PREFIX = "sticky-note-";

export default function StickyNoteWidget({ courseId, moduleId, moduleTitle, onClose }: StickyNoteWidgetProps) {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const noteIdRef = useRef<string | null>(null);
  const bodyRef = useRef(body);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Draggable
  const {
    position,
    isDragging,
    ref: dragRef,
    handleMouseDown,
    handleTouchStart,
  } = useDraggable({
    initialPosition: { x: 80, y: 80 },
    bounds: "viewport",
  });

  // Resizable
  const {
    width,
    height,
    isResizing,
    handleMouseDown: handleResizeMouseDown,
    handleTouchStart: handleResizeTouchStart,
  } = useResizable({
    initialWidth: 400,
    initialHeight: 350,
    minWidth: 320,
    minHeight: 220,
    maxWidth: 900,
    maxHeight: 800,
  });

  const storageKey = `${STORAGE_PREFIX}${courseId}-${moduleId}`;

  const [contentLoaded, setContentLoaded] = useState(false);

  // Append daily date header if today is a new session
  const ensureTodaySection = useCallback((existingBody: string) => {
    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
    const marker = `data-sticky-date="${today}"`;
    if (existingBody.includes(marker)) return existingBody;
    // Prepend new date section
    return `<div ${marker} style="font-weight:600;font-size:0.75rem;color:#92400e;margin-bottom:4px;">📌 ${today}</div>\n\n${existingBody}`;
  }, []);

  // Load existing note on mount (with daily date-section append)
  useEffect(() => {
    if (!moduleId) return;

    isMountedRef.current = true;
    const loadNote = async () => {
      let loadedBody = "";
      let loadedId: string | null = null;

      try {
        // 1. Try to find a note flagged as sticky
        let res = await api.get<{ notes: StickyNote[] }>(
          `/api/notes?courseId=${courseId}&moduleId=${moduleId}&isSticky=true`
        );
        let existingNote = res.notes?.[0];

        // 2. Fallback: no sticky note yet — take the first note and migrate it
        if (!existingNote) {
          res = await api.get<{ notes: StickyNote[] }>(`/api/notes?courseId=${courseId}&moduleId=${moduleId}`);
          existingNote = res.notes?.[0];

          if (existingNote && isMountedRef.current) {
            // Migrate existing note to sticky
            await api.patch(`/api/notes/${existingNote.id}`, { isSticky: true }).catch(() => {});
          }
        }

        if (existingNote && isMountedRef.current) {
          loadedBody = existingNote.body || "";
          loadedId = existingNote.id;
        }
      } catch {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored && isMountedRef.current) {
            const parsed = JSON.parse(stored) as StickyNote;
            loadedBody = parsed.body || "";
            loadedId = parsed.id;
          }
        } catch { /* ignore */ }
      }

      if (!isMountedRef.current) return;

      // Ensure today's date section exists
      const bodyWithDate = ensureTodaySection(loadedBody);

      if (loadedId) {
        setNoteId(loadedId);
        setBody(bodyWithDate);
        // If date section was added, persist it
        if (bodyWithDate !== loadedBody) {
          await api.patch(`/api/notes/${loadedId}`, { body: bodyWithDate }).catch(() => {});
        }
      } else {
        // New note: prepend today's date header
        const today = new Date().toLocaleDateString("en-IN", {
          weekday: "short", day: "numeric", month: "short", year: "numeric",
        });
        setBody(`<div data-sticky-date="${today}" style="font-weight:600;font-size:0.72rem;color:#92400e;margin-bottom:4px;">📌 ${today}</div>\n\n`);
      }

      if (isMountedRef.current) setContentLoaded(true);
    };

    loadNote();

    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [courseId, moduleId, storageKey, ensureTodaySection]);

  // Sync refs with state for use in callbacks
  useEffect(() => { noteIdRef.current = noteId; }, [noteId]);
  useEffect(() => { bodyRef.current = body; }, [body]);

  // Save to localStorage as backup
  const saveToLocal = useCallback((noteBody: string, noteIdToSave: string | null) => {
    if (!moduleId) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        id: noteIdToSave,
        body: noteBody,
        updatedAt: new Date().toISOString(),
      }));
    } catch { /* ignore */ }
  }, [moduleId, storageKey]);

  // Auto-save with debounce
  const save = useCallback(async () => {
    if (!moduleId || !isMountedRef.current) return;

    setStatus("saving");

    try {
      const currentNoteId = noteIdRef.current;
      const currentBody = bodyRef.current;

      if (currentNoteId) {
        await api.patch(`/api/notes/${currentNoteId}`, { body: currentBody });
        saveToLocal(currentBody, currentNoteId);
      } else {
        const res = await api.post<{ note: StickyNote }>("/api/notes", {
          courseId,
          moduleId,
          title: `${moduleTitle || "Module"} - Sticky Notes`,
          body: currentBody,
          isSticky: true,
        });
        saveToLocal(currentBody, res.note.id);
        if (isMountedRef.current) setNoteId(res.note.id);
      }

      if (isMountedRef.current) {
        setStatus("saved");
        setTimeout(() => {
          if (isMountedRef.current) setStatus("idle");
        }, 2000);
      }
    } catch {
      if (isMountedRef.current) {
        setStatus("error");
        saveToLocal(bodyRef.current, noteIdRef.current);
        setTimeout(() => {
          if (isMountedRef.current) setStatus("idle");
        }, 3000);
      }
    }
  }, [courseId, moduleId, moduleTitle, saveToLocal]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save();
    }, 1500);
  }, [save]);

  const handleContentChange = useCallback((html: string) => {
    bodyRef.current = html;
    setBody(html);
    debouncedSave();
  }, [debouncedSave]);

  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await save();
  }, [save]);

  const handleClose = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    save();
    setTimeout(() => onClose(), 300);
  }, [save, onClose]);

  // Start drag from header area only (not editor toolbar or resize handle)
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".resize-handle") || target.closest(".tiptap-toolbar") || target.closest("button") || target.closest("a")) return;
    if ("touches" in e) {
      handleTouchStart(e as React.TouchEvent<HTMLDivElement>);
    } else {
      handleMouseDown(e as React.MouseEvent<HTMLDivElement>);
    }
  };

  if (!moduleId) return null;

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 rounded-xl border border-amber-200/60 bg-amber-50/95 shadow-2xl shadow-black/20 backdrop-blur-sm transition-shadow overflow-hidden ${isDragging ? "shadow-black/40 scale-[1.02]" : ""} ${isResizing ? "select-none" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
      }}
    >
      {/* Header - drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-amber-200/60 cursor-move select-none shrink-0"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-2 min-w-0">
          <IconPin className="text-amber-600 shrink-0" size={16} />
          <span className="text-xs font-semibold text-amber-800 truncate">
            {moduleTitle || "Sticky Notes"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status */}
          <div className="flex items-center gap-1">
            {status === "saving" && (
              <span className="text-[10px] text-amber-700 animate-pulse">Saving...</span>
            )}
            {status === "saved" && (
              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
                <IconCheck size={10} /> Saved
              </span>
            )}
            {status === "error" && (
              <span className="text-[10px] text-red-700">Saved locally</span>
            )}
          </div>

          {/* Manual save */}
          <button
            onClick={handleManualSave}
            disabled={status === "saving"}
            className="p-1 rounded text-amber-700/60 hover:text-amber-900 hover:bg-amber-100/50 transition-colors disabled:opacity-40"
            title="Save now"
          >
            <IconDeviceFloppy size={14} />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1 rounded text-amber-700/60 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Close"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-2" style={{ height: `calc(100% - 40px)` }}>
        {contentLoaded ? (
          <RichEditor
            key={noteId || "new"}
            content={body}
            onChange={handleContentChange}
            placeholder="Take notes... (auto-saves)"
            minHeight="100%"
            autoFocus={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-amber-700/40 text-xs">
            Loading notes...
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center text-amber-300/50 hover:text-amber-500 transition-colors"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 12L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          <path d="M8 12L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
        </svg>
      </div>
    </div>
  );
}
