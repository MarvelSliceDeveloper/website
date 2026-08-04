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

export interface QuizInfo {
  id: string;
  title: string;
  questionCount: number;
  dueDate: string | null;
  isSpecialExam?: boolean;
  passingScore?: number;
  timeLimitMin?: number | null;
  maxAttempts?: number | null;
  examType?: string;
}

export interface AssignmentInfo {
  id: string;
  title: string;
  type: string;
  description: string;
  maxPoints: number;
  dueDate: string;
  questionPdfUrl: string | null;
}

export interface PracticalInfo {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  pdfUrl: string | null;
  resources: Array<{ name: string; url: string }>;
}

export interface ContentOrderItem {
  type: "LESSON" | "QUIZ" | "ASSIGNMENT" | "PRACTICAL";
  id: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  isCertificationModule: boolean;
  contentOrder: ContentOrderItem[] | null;
  lessons: CourseLesson[];
  completionPercent: number;
  recordingsCount: number;
  sessionsCount: number;
  quizzes: QuizInfo[];
  assignments: AssignmentInfo[];
  practicals: PracticalInfo[];
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
    instructor: string;
  } | null;
  modules: CourseModule[];
  sessions: CourseSession[];
  recordings: CourseRecording[];
  overallProgress: number;
}

export interface CourseContentViewProps {
  courseId: string;
  navigate: (v: ViewState) => void;
  goBack: () => void;
  initialQuizId?: string;
  initialAssignmentId?: string;
  initialResourceUrl?: string;
  initialResourceName?: string;
}
