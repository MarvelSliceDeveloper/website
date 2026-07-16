export type Resource = {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
};

export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  durationSeconds: number | null;
  isFreePreview: boolean;
  resources: Resource[];
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: Array<{ label: string; isCorrect: boolean }>;
};

export type Quiz = {
  id: string;
  title: string;
  questions: QuizQuestion[];
};

export type Assignment = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  dueDate: string | null;
  maxPoints: number;
  questionPdfUrl: string | null;
};

export type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string | null;
  tags: string[] | null;
  learningObjectives: string[] | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  modules: Module[];
  _count: { batches: number };
};

export type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  batch: { id: string; name: string };
  module: { id: string; title: string } | null;
  recording: { id: string; syncedAt: string } | null;
};

export type Recording = {
  id: string;
  sharePointUrl: string;
  duration: number;
  syncedAt: string;
  session: {
    id: string;
    scheduledAt: string;
    joinUrl: string;
    module: { id: string; title: string } | null;
    batch: { id: string; name: string };
  };
};

export type ChecklistItem = {
  item: string;
  passed: boolean;
  message?: string;
};

export type CourseFormData = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  learningObjectives: string[];
};
