"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import { StatusBadge } from "@/components/ui/Badge";

export default function LearnPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [recording, setRecording] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch recording details (we assume for now we use sessionId to find it)
        // In a real app, we'd have an endpoint to get recording by sessionId
        // For now, let's list recordings for the course this session belongs to
        const sessionsData = await api.get<any>(`/sessions/${sessionId}`);
        const courseId = sessionsData.session.courseId;

        const recordingsData = await api.get<any>(`/recordings`, { courseId });
        const currentRecording = recordingsData.recordings.find((r: any) => r.sessionId === sessionId);

        if (!currentRecording) {
          throw new Error("Recording not found for this session");
        }

        setRecording(currentRecording);
        setCurriculum(recordingsData.recordings);

        // 2. Fetch fresh playback URL
        const urlData = await api.get<any>(`/recordings/${currentRecording.id}/url`);
        setVideoUrl(urlData.url);

      } catch (error) {
        console.error("Failed to load recording:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) fetchData();
  }, [sessionId]);

  const handleProgress = async (watchedSeconds: number) => {
    if (!recording) return;
    try {
      await api.post("/recordings/progress", {
        recordingId: recording.id,
        watchedSeconds: Math.floor(watchedSeconds),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!recording || !videoUrl) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-background p-6 text-center">
        <p className="text-4xl mb-4">🎥</p>
        <h1 className="text-2xl font-bold text-foreground">Recording Not Available</h1>
        <p className="text-muted mt-2 max-w-md">
          This session hasn&apos;t been synced yet or the recording is still being processed by Microsoft Teams.
          Please try again in 30-60 minutes.
        </p>
        <button
          onClick={() => router.back()}
          className="btn-secondary mt-6"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100vh-52px)] flex-col overflow-hidden bg-[#0a0a0c] md:-mx-6 md:-my-6 xl:flex-row">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Video Section */}
        <div className="w-full bg-black aspect-video max-h-[70vh]">
          <VideoPlayer
            url={videoUrl}
            onProgress={handleProgress}
            initialTime={recording.progress?.[0]?.watchedSeconds || 0}
          />
        </div>

        {/* Info Section */}
        <div className="max-w-5xl p-4 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-primary px-2 py-1 rounded bg-primary/10 border border-primary/20">
              {recording.session.module.title}
            </span>
            <span className="text-xs text-muted">
              {new Date(recording.session.scheduledAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {recording.session.course.title} — Session Recording
          </h1>
          <p className="text-muted leading-relaxed">
            In this session, we covered the core concepts and practical implementations related to
            {recording.session.module.title}. Watch the full recording to catch up on any details you missed.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Instructor</p>
              <p className="font-semibold">{recording.session.course.instructorId}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Duration</p>
              <p className="font-semibold">{Math.floor(recording.duration / 60)} minutes</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Views</p>
              <p className="font-semibold">{recording.viewCount} students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <aside className="hidden w-full border-l border-border bg-card/30 backdrop-blur-xl xl:flex xl:w-96 xl:flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Course Content</h2>
          <p className="text-xs text-muted mt-1">Recordings and upcoming sessions</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {curriculum.map((item, index) => {
            const isActive = item.sessionId === sessionId;
            const progress = item.progress?.[0];
            const isCompleted = progress?.completedAt;

            return (
              <button
                key={item.id}
                onClick={() => router.push(`/student/learn/${item.sessionId}`)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${isActive
                    ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5"
                    : "hover:bg-card-hover border border-transparent"
                  }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isCompleted ? "bg-success/20 text-success" : "bg-zinc-800 text-zinc-400"
                  }`}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${isActive ? "text-primary-hover" : "text-foreground"}`}>
                    Session {index + 1}: {item.session.module.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted">
                      {Math.floor(item.duration / 60)} mins
                    </span>
                    {progress?.watchedSeconds > 0 && (
                      <div className="h-1 flex-1 rounded-full bg-zinc-800 max-w-[60px]">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min((progress.watchedSeconds / (item.duration || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
