import { IconPlayerPlay, IconVideo } from "@tabler/icons-react";
import type { CourseLesson, CourseRecording } from "./types";

interface Props {
  lesson: CourseLesson | null;
  recording: CourseRecording | null;
}

export function VideoPlayer({ lesson, recording }: Props) {
  if (recording) {
    return (
      <>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
            <IconPlayerPlay size={24} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-3 left-3 rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white/90">
          {recording.title}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${recording.watchedPercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-[19px] text-white/60">
            <span>{recording.durationLabel}</span>
            <span>{recording.watchedPercent}% watched</span>
          </div>
        </div>
      </>
    );
  }

  if (lesson?.videoUrl || lesson?.videoEmbedId) {
    const embedId = lesson.videoEmbedId;
    if (lesson.videoType === "youtube" && embedId) {
      return <YouTubePlayer embedId={embedId} />;
    }
    if (lesson.videoUrl) {
      return <video className="absolute inset-0 h-full w-full" controls src={lesson.videoUrl} />;
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(230,25%,12%)] to-[hsl(230,25%,8%)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 backdrop-blur-sm">
        <IconVideo size={24} className="text-white" />
      </div>
      <p className="absolute bottom-4 text-xs text-white/40">Select a lesson to start learning</p>
    </div>
  );
}

function YouTubePlayer({ embedId }: { embedId: string }) {
  return (
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        src={`https://www.youtube.com/embed/${embedId}?rel=0`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="absolute bottom-0 right-0 w-24 h-8 z-10 cursor-default" />
    </div>
  );
}
