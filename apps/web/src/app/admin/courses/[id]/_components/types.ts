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

export type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

export type Quiz = {
  id: string;
  title: string;
  dueDate?: string | null;
  daysFromEnrollment?: number | null;
  allowLateSubmission?: boolean;
  lateSubmissionPenaltyPercent?: number | null;
  lateSubmissionGracePeriodHrs?: number | null;
  isSpecialExam?: boolean;
  passingScore?: number;
  timeLimitMin?: number | null;
  maxAttempts?: number | null;
  examType?: string;
  hasMcq?: boolean;
  hasAssignment?: boolean;
  hasCoding?: boolean;
  assignmentInstructions?: string | null;
  assignmentPdfUrl?: string | null;
  codingPrompt?: string | null;
  testCases?: TestCase[] | null;
  questions: QuizQuestion[];
};

export type Assignment = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  dueDate: string;
  daysFromEnrollment?: number | null;
  allowLateSubmission?: boolean;
  lateSubmissionPenaltyPercent?: number | null;
  lateSubmissionGracePeriodHrs?: number | null;
  maxPoints: number;
  questionPdfUrl: string | null;
};

export type Practical = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoType: string | null;
  videoUrl: string | null;
  videoEmbedId: string | null;
  pdfUrl: string | null;
  resources: Resource[];
};

export type ContentOrderItem = {
  type: "LESSON" | "QUIZ" | "ASSIGNMENT" | "PRACTICAL";
  id: string;
};

export type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isFreePreview: boolean;
  contentOrder: ContentOrderItem[] | null;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
  practicals: Practical[];
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
