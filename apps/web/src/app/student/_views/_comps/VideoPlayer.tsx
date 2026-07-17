"use client";

import { useRef, useEffect, useState } from "react";
import "plyr/dist/plyr.css";
import { IconVideo, IconPlayerPlay } from "@tabler/icons-react";
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
}

function SafePlyr({ source, options }: SafePlyrProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { default: PlyrJS } = await import("plyr");
      if (cancelled || !videoRef.current) return;

      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }

      try {
        const plyr = new PlyrJS(videoRef.current, {
          ...DEFAULT_OPTIONS,
          ...options,
        });
        plyr.source = source;
        instanceRef.current = plyr;
        setReady(true);
      } catch {
        // Plyr's YouTube iframe API callback can fire after the element
        // is unmounted (e.g. when switching to quiz/resource preview).
      }
    })();

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(source), JSON.stringify(options)]);

  return (
    <>
      <style>{`
        .plyr__video-embed iframe {
          top: -60px;
          height: calc(100% + 125px);
          pointer-events: none !important;
        }
      `}</style>
      <video
        ref={videoRef}
        className="plyr-react plyr"
        style={{ width: "100%", height: "100%" }}
      />
    </>
  );
}

interface Props {
  lesson: CourseLesson | null;
  recording: CourseRecording | null;
}

function getVideoSource(lesson: CourseLesson): PlyrSource | null {
  if (lesson.videoType === "youtube" && lesson.videoEmbedId) {
    return {
      type: "video" as const,
      sources: [{ src: lesson.videoEmbedId, provider: "youtube" as const }],
    };
  }

  if (lesson.videoType === "vimeo" && lesson.videoEmbedId) {
    return {
      type: "video" as const,
      sources: [{ src: lesson.videoEmbedId, provider: "vimeo" as const }],
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

export function VideoPlayer({ lesson, recording }: Props) {
  if (recording) {
    return (
      <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
            <IconPlayerPlay size={24} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-10 left-90 rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white/90">
          {recording.title}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-white/20">
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
        <SafePlyr source={source} />
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
