// ──────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for API data (replaces mock data type exports)
// ──────────────────────────────────────────────────────────────────────────────

export type CourseStatus = "ACTIVE" | "COMPLETED" | "PENDING" | "REJECTED";
export type SessionStatus = "LIVE" | "UPCOMING" | "PAST";
export type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  batchId: string;
  batchLabel: string;
  instructor: string;
  progress: number; // 0-100
  status: CourseStatus;
  source?: "enrollment" | "package";
}

export interface Batch {
  id: string;
  courseTitle: string;
  batchLabel: string;
  instructor: string;
  startDate: string;
  endDate: string;
  overallProgress: number;
  sessions: BatchSession[];
  recordings: BatchRecording[];
  modules: BatchModule[];
}

export interface BatchSession {
  id: string;
  dayLabel: string;
  title: string;
  status: SessionStatus;
  scheduledAt: string;
  endDateTime: string;
  joinUrl?: string;
  instructor: string;
}

export interface BatchRecording {
  id: string;
  sessionId?: string;
  moduleId?: string;
  dayLabel: string;
  title: string;
  duration: string;
  watchedPercent: number;
  videoUrl: string;
}

export interface BatchModule {
  id: string;
  title: string;
  completionPercent: number;
}

export interface LiveSession {
  id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  batchLabel: string;
  status: SessionStatus;
  scheduledAt: string;
  endDateTime: string;
  joinUrl?: string;
  recordingSyncingIn?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  type: "live" | "upcoming" | "mentorship";
  joinUrl?: string;
}

export interface MentorshipTicket {
  id: string;
  courseTitle: string;
  topic: string;
  status: TicketStatus;
  createdAt: string;
  preferredTime?: string;
  notes?: string;
  instructor?: string;
  joinUrl?: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    updatedAt: string;
  };
  issuedAt?: string;
  verifyUrl?: string;
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
  earned: boolean;
}

export interface ClaimableCertificate {
  courseId: string;
  course: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    updatedAt: string;
  };
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalItems: number;
  completedItems: number;
  isComplete: boolean;
  hasCertificationModule: boolean;
  certificationQuizPassed: boolean;
  details: {
    totalLessons: number;
    completedLessons: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalAssignments: number;
    completedAssignments: number;
  };
}

export interface CatalogueCourse {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  nextBatch: string;
  isEnrolled: boolean;
  tags: string[];
  curriculum: { title: string; sessions: number }[];
  whatYouLearn: string[];
}

export interface ContinueLearningItem {
  recordingId?: string;
  lessonId?: string;
  courseId?: string;
  moduleId?: string;
  batchId: string;
  courseTitle: string;
  dayLabel: string;
  watchedPercent: number;
  thumbnail: string;
}

export interface DashboardStats {
  enrolledCount: number;
  completedCount: number;
  liveTodayCount: number;
  certificatesCount: number;
}

export interface DashboardChartData {
  studentsPerCourse: { courseTitle: string; count: number }[];
  studentsPerPackage: { packageName: string; count: number }[];
  enrollmentTrend: { month: string; count: number }[];
  batchDistribution: { status: string; count: number }[];
  userRoleDistribution: { role: string; count: number }[];
  topCourses: { courseTitle: string; enrollmentCount: number }[];
  recentEnrollments: {
    id: string;
    userName: string;
    userEmail: string;
    packageName: string;
    status: string;
    razorpayPaymentId: string | null;
    amount: number | null;
    appliedAt: string;
  }[];
  monthlyRevenue: { month: string; amount: number }[];
  revenueByPackage: { packageName: string; total: number }[];
}

export interface CataloguePackage {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  status: string;
  createdAt: string;
  isInternship?: boolean;
  courses: {
    course: {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      thumbnailUrl: string | null;
    };
  }[];
  batches: {
    id: string;
    name: string;
    startDate: string;
    maxStudents: number | null;
  }[];
  _count: { enrollments: number };
  totalLessons: number;
  totalQuizzes: number;
  totalAssignments: number;
  totalPracticals: number;
}

// Extended package detail returned by GET /api/packages/public/:slug
export interface PackageDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  isInternship?: boolean;
  courses: {
    course: {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      thumbnailUrl: string | null;
      learningObjectives: string[] | null;
      modules: { id: string; title: string; order: number }[];
    };
  }[];
  batches: {
    id: string;
    name: string;
    startDate: string;
    maxStudents: number | null;
  }[];
  _count: { enrollments: number };
  totalLessons: number;
  totalQuizzes: number;
  totalAssignments: number;
  totalPracticals: number;
}

export interface OverdueAssignment {
  id: string;
  courseId: string;
  courseName: string;
  moduleName: string;
  unitName: string;
  assignmentName: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED";
  type: "QUIZ" | "ASSIGNMENT";
  submissionId?: string | null;
  answerFileUrl?: string | null;
  grade?: string | null;
  totalScore?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  total?: number | null;
  percentage?: number | null;
  isPassed?: boolean | null;
}

export interface StudentResultItem {
  id: string;
  type: "ASSIGNMENT" | "QUIZ" | "PROJECT";
  title: string;
  courseName: string;
  moduleName: string;
  score: number | null;
  total: number | null;
  percentage: number | null;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
}
