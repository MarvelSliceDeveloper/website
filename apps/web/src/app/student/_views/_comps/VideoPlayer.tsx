"use client";

import { useRef, useEffect, useState } from "react";
import "plyr/dist/plyr.css";
import {
  IconVideo,
  IconPlayerPlay,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { CourseLesson, CourseRecording } from "./types";

type PlyrSource = import("plyr").default.SourceInfo;
type PlyrOpts = import("plyr").default.Options;

const DEFAULT_OPTIONS: PlyrOpts = {
  controls: [
    "play-large",
    "play",
    "progress",
    "current-time",
    "duration",
    "mute",
    "volume",
    "captions",
    "settings",
    "pip",
    "airplay",
    "fullscreen",
  ],
  settings: ["speed"],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
  keyboard: { focused: true, global: true },
  tooltips: { controls: true, seek: true },
  storage: { enabled: true, key: "plyr-volume" },
  clickToPlay: true,
  youtube: {
    noCookie: true,
    rel: 0,
    showinfo: 0,
    iv_load_policy: 3,
    modestbranding: 1,
  },
  vimeo: {
    byline: false,
    portrait: false,
    title: false,
    speed: false,
  },
};

interface SafePlyrProps {
  source: PlyrSource;
  options?: PlyrOpts;
  onProgress?: ProgressCallback;
  initialTime?: number;
}

type ProgressCallback = (watchedSeconds: number, completed?: boolean) => void;

/**
 * NOTE: this component is intentionally remounted (via a `key` prop from the
 * parent) whenever the video changes, instead of relying on `plyr.source = ...`
 * to swap sources on a live instance. Plyr's YouTube/Vimeo providers replace
 * the underlying <video> element with an <iframe> internally, and destroy()
 * on the old instance is not guaranteed to finish tearing down the previous
 * iframe + YouTube IFrame API callbacks before a new instance attaches to the
 * same DOM node. In practice this produced a player that rendered but never
 * responded to play clicks after switching lessons. A full unmount/remount
 * per video sidesteps that race entirely.
 */
function SafePlyr({ source, options, onProgress, initialTime }: SafePlyrProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ destroy: () => void } | null>(null);
  const onProgressRef = useRef<ProgressCallback | undefined>(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  const lastReportedRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const video = document.createElement("video");
    video.className = "plyr-react plyr";
    video.style.width = "100%";
    video.style.height = "100%";
    container.appendChild(video);

    (async () => {
      try {
        const { default: PlyrJS } = await import("plyr");
        if (cancelled) return;

        const plyr = new PlyrJS(video, {
          ...DEFAULT_OPTIONS,
          ...options,
        });
        try {
          plyr.source = source;
        } catch {
          // Plyr's source setter can race with internal element setup
          // in StrictMode double-mount. Ignore — Plyr still works.
        }
        instanceRef.current = plyr;

        if (initialTime && initialTime > 0) {
          plyr.on("ready", () => {
            try {
              plyr.currentTime = initialTime;
            } catch {
              // resume seek can race with provider metadata load
            }
          });
        }

        plyr.on("timeupdate", (event: CustomEvent) => {
          const current = event.detail?.plyr?.currentTime;
          if (
            typeof current === "number" &&
            current - lastReportedRef.current >= 10
          ) {
            lastReportedRef.current = current;
            onProgressRef.current?.(Math.floor(current));
          }
        });
        plyr.on("ended", () => {
          const duration =
            typeof plyr.duration === "number" ? Math.floor(plyr.duration) : 0;
          onProgressRef.current?.(duration, true);
        });

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Failed to initialize video player:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {
          // ignore teardown errors from late embed callbacks
        }
        instanceRef.current = null;
      }
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        .plyr__video-embed iframe {
          top: -60px;
          height: calc(100% + 125px);
          pointer-events: none !important;
        }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white/80">
          <IconAlertTriangle size={22} />
          <p className="text-xs">Couldn&apos;t load this video.</p>
        </div>
      )}
    </>
  );
}

function RecordingVideo({
  recording,
  onProgress,
  initialTime,
}: {
  recording: CourseRecording;
  onProgress?: ProgressCallback;
  initialTime?: number;
}) {
  const lastReportedRef = useRef(0);
  const resumedRef = useRef(false);

  return (
    <div className="absolute inset-0 bg-black">
      <video
        className="h-full w-full"
        controls
        src={recording.videoUrl}
        onLoadedMetadata={(e) => {
          if (!resumedRef.current && initialTime && initialTime > 0) {
            resumedRef.current = true;
            e.currentTarget.currentTime = initialTime;
          }
        }}
        onTimeUpdate={(e) => {
          const current = e.currentTarget.currentTime;
          if (current - lastReportedRef.current >= 10) {
            lastReportedRef.current = current;
            onProgress?.(Math.floor(current));
          }
        }}
        onEnded={(e) =>
          onProgress?.(Math.floor(e.currentTarget.duration || 0), true)
        }
      />
    </div>
  );
}

interface Props {
  lesson: CourseLesson | null;
  recording: CourseRecording | null;
  onProgress?: ProgressCallback;
  initialTime?: number;
}

/**
 * `videoEmbedId` is expected to be a bare provider ID (e.g. "dQw4w9WgXcQ"),
 * but data can end up containing a full URL instead. Extract the ID
 * defensively so a full URL doesn't silently break playback.
 */
function extractYoutubeId(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes("youtu")) {
    return trimmed; // already looks like a bare ID
  }
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    const vParam = url.searchParams.get("v");
    if (vParam) return vParam;
    const embedMatch = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  } catch {
    // not a valid URL, fall through
  }
  return trimmed;
}

function extractVimeoId(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/(\d+)/);
    if (match) return match[1];
  } catch {
    // not a valid URL, fall through
  }
  return trimmed;
}

function getVideoSource(lesson: CourseLesson): PlyrSource | null {
  if (lesson.videoType === "youtube" && lesson.videoEmbedId) {
    return {
      type: "video" as const,
      sources: [
        {
          src: extractYoutubeId(lesson.videoEmbedId),
          provider: "youtube" as const,
        },
      ],
    };
  }

  if (lesson.videoType === "vimeo" && lesson.videoEmbedId) {
    return {
      type: "video" as const,
      sources: [
        {
          src: extractVimeoId(lesson.videoEmbedId),
          provider: "vimeo" as const,
        },
      ],
    };
  }

  if (lesson.videoUrl) {
    return {
      type: "video" as const,
      sources: [{ src: lesson.videoUrl }],
    };
  }

  return null;
}

export function VideoPlayer({
  lesson,
  recording,
  onProgress,
  initialTime,
}: Props) {
  if (recording) {
    if (recording.videoUrl) {
      return (
        <RecordingVideo
          recording={recording}
          onProgress={onProgress}
          initialTime={initialTime}
        />
      );
    }

    return (
      <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
            <IconPlayerPlay size={24} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-100 left-90 rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white/90">
          {recording.title}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div
            className="mb-2.5 h-1 overflow-hidden rounded-full bg-white/20"
            role="slider"
            aria-valuenow={recording.watchedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Video progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${recording.watchedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>{recording.durationLabel}</span>
            <span>{recording.watchedPercent}% watched</span>
          </div>
        </div>
      </div>
    );
  }

  if (lesson && (lesson.videoUrl || lesson.videoEmbedId)) {
    const source = getVideoSource(lesson);
    if (!source) return null;

    return (
      <div className="absolute inset-0 bg-black">
        {/* `key` forces a full unmount/remount when the video changes,
            avoiding the Plyr embed race condition described in SafePlyr. */}
        <SafePlyr
          key={lesson.id}
          source={source}
          onProgress={onProgress}
          initialTime={initialTime}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm">
        <IconVideo size={24} className="text-white" />
      </div>
      <p className="absolute bottom-4 text-xs text-white/40">
        Select a lesson to start learning
      </p>
    </div>
  );
}
