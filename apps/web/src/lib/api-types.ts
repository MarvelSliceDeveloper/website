// ──────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types for API data (replaces mock data type exports)
// ──────────────────────────────────────────────────────────────────────────────

export type CourseStatus = "ACTIVE" | "COMPLETED" | "PENDING";
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
  endDateTime?: string;
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
  notes?: string;
  instructor?: string;
  joinUrl?: string;
}

export interface Certificate {
  id: string;
  courseTitle: string;
  batchLabel: string;
  issuedAt?: string;
  verifyUrl?: string;
  completionPercent: number;
  earned: boolean;
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
  recordingId: string;
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
    appliedAt: string;
  }[];
}

export interface OverdueAssignment {
  id: string;
  courseName: string;
  unitName: string;
  assignmentName: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED";
  type: "QUIZ" | "ASSIGNMENT";
  submissionId?: string | null;
}
