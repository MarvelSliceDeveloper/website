import type { ViewState } from "../../_types/student-portal";

export interface CourseLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: Array<{ name: string; url: string }>;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  lessons: CourseLesson[];
  completionPercent: number;
  recordingsCount: number;
  sessionsCount: number;
  hasQuiz: boolean;
}

export interface CourseSession {
  id: string;
  moduleId: string | null;
  moduleTitle: string | null;
  scheduledAt: string;
  endedAt: string | null;
  joinUrl: string;
  isLive: boolean;
  isUpcoming: boolean;
  hasRecording: boolean;
}

export interface CourseRecording {
  id: string;
  sessionId: string;
  moduleId: string | null;
  moduleTitle: string;
  dayLabel: string;
  title: string;
  scheduledAt: string;
  duration: number;
  durationLabel: string;
  watchedPercent: number;
  isCompleted: boolean;
}

export interface CourseContentData {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    status: string;
  };
  batch: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  modules: CourseModule[];
  sessions: CourseSession[];
  recordings: CourseRecording[];
  overallProgress: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export type RailTab = "lesson" | "editor" | "note" | "session" | "resource";

export interface CourseContentViewProps {
  courseId: string;
  navigate: (v: ViewState) => void;
  goBack: () => void;
}
