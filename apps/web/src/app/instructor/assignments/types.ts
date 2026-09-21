export type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: "QUIZ" | "ASSIGNMENT";
  maxPoints: number;
  questionPdfUrl: string | null;
  course: { id: string; title: string };
  batch: {
    id: string;
    name: string;
    passingScore: number;
    _count?: { enrollments?: number };
  } | null;
  submissions?: {
    id: string;
    status: "PENDING" | "GRADED";
    totalScore: number | null;
    grade: string | null;
    submittedAt: string;
  }[];
  _count: { submissions: number };
  createdAt?: string;
};

export type Submission = {
  id: string;
  status: "PENDING" | "GRADED";
  grade: string | null;
  totalScore: number | null;
  feedback: string | null;
  comment: string | null;
  submittedAt: string;
  answerFileUrl: string | null;
  student: { id: string; name: string; email: string };
};

export type InstructorBatch = {
  id: string;
  name: string;
  courseId: string | null;
  course: { id: string; title: string } | null;
  courseMentors?: Array<{ course: { id: string; title: string } }>;
  _count?: { enrollments?: number };
};

export type InstructorCourse = {
  id: string;
  title: string;
};

export type AssignmentStatusFilter =
  "ALL" | "NEEDS_REVIEW" | "DUE_SOON" | "OVERDUE" | "GRADED";

export type SortKey = "dueDate" | "pending" | "submissions" | "title";
export type SortDir = "asc" | "desc";
