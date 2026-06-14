// ──────────────────────────────────────────────────────────────────────────────
// Student Portal Mock Data
// Toggle with: NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local
// ──────────────────────────────────────────────────────────────────────────────

export const MOCK_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ─── Types (shared with portal) ───────────────────────────────────────────────

export type CourseStatus = "ACTIVE" | "COMPLETED" | "PENDING";
export type SessionStatus = "LIVE" | "UPCOMING" | "PAST";
export type TicketStatus = "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  batchId: string;
  batchLabel: string;
  instructor: string;
  progress: number; // 0-100
  status: CourseStatus;
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
  joinUrl?: string;
  recordingSyncingIn?: string;
  endDateTime: string;  // ← add this if not already present
  
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
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
  price: number;
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

export interface OverdueAssignment {
  id: string;
  courseName: string;
  unitName: string;
  assignmentName: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED";
  type: "QUIZ" | "ASSIGNMENT";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

export const MOCK_STATS: DashboardStats = {
  enrolledCount: 12,
  completedCount: 8,
  liveTodayCount: 2,
  certificatesCount: 3,
};

export const MOCK_OVERDUE_ASSIGNMENTS: OverdueAssignment[] = [
  {
    id: "oa1",
    courseName: "Python for Data Science",
    unitName: "Capstone Project (Covid 19)",
    assignmentName: "Capstone Project (Covid 19) - Submit Here",
    dueDate: "2026-03-03T00:00:00.000Z",
    status: "PENDING",
    type: "ASSIGNMENT",
  },
  {
    id: "oa2",
    courseName: "Python for Data Science",
    unitName: "Capstone Project (Netflix)",
    assignmentName: "Capstone Project (Netflix) - Submit Here",
    dueDate: "2026-05-01T00:00:00.000Z",
    status: "PENDING",
    type: "ASSIGNMENT",
  },
  {
    id: "oa3",
    courseName: "React Full Stack",
    unitName: "Hooks Deep Dive",
    assignmentName: "Hooks Refactor Assignment",
    dueDate: "2026-04-24T00:00:00.000Z",
    status: "SUBMITTED",
    type: "QUIZ",
  },
];

export const MOCK_ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: "c1",
    title: "Python for Data Science",
    thumbnail: "📊",
    batchId: "b1",
    batchLabel: "Jan 2025",
    instructor: "Ravi Kumar",
    progress: 62,
    status: "ACTIVE",
  },
  {
    id: "c2",
    title: "React Full Stack",
    thumbnail: "⚛️",
    batchId: "b2",
    batchLabel: "Feb 2025",
    instructor: "Priya Mehta",
    progress: 10,
    status: "ACTIVE",
  },
  {
    id: "c3",
    title: "Node.js Backend",
    thumbnail: "🟢",
    batchId: "",
    batchLabel: "—",
    instructor: "Kiran S.",
    progress: 0,
    status: "PENDING",
  },
  {
    id: "c4",
    title: "JavaScript Foundations",
    thumbnail: "🟨",
    batchId: "b4",
    batchLabel: "Aug 2024",
    instructor: "Anita R.",
    progress: 100,
    status: "COMPLETED",
  },
];

export const MOCK_BATCHES: Record<string, Batch> = {
  b1: {
    id: "b1",
    courseTitle: "Python for Data Science",
    batchLabel: "Batch Jan 2025",
    instructor: "Ravi Kumar",
    startDate: "15 Jan 2025",
    endDate: "30 Mar 2025",
    overallProgress: 62,
    modules: [
      { id: "m1", title: "Python Basics", completionPercent: 100 },
      { id: "m2", title: "Data Structures", completionPercent: 67 },
      { id: "m3", title: "File & IO", completionPercent: 33 },
      { id: "m4", title: "Pandas & NumPy", completionPercent: 0 },
      { id: "m5", title: "Visualisation", completionPercent: 0 },
    ],
    sessions: [
      {
        id: "s1",
        dayLabel: "Day 12",
        title: "Python Pandas Deep Dive",
        status: "LIVE",
        scheduledAt: now.toISOString(),
        joinUrl: "https://teams.microsoft.com/mock-session-1",
        instructor: "Ravi Kumar",
      },
      {
        id: "s2",
        dayLabel: "Day 13",
        title: "Matplotlib & Visualisation",
        status: "UPCOMING",
        scheduledAt: tomorrow,
        instructor: "Ravi Kumar",
      },
      {
        id: "s3",
        dayLabel: "Day 11",
        title: "NumPy Arrays",
        status: "PAST",
        scheduledAt: yesterday,
        instructor: "Ravi Kumar",
      },
    ],
    recordings: [
      { id: "r1", sessionId: "s3", moduleId: "m4", dayLabel: "Day 11", title: "NumPy Arrays", duration: "2h 15m", watchedPercent: 100, videoUrl: "" },
      { id: "r2", sessionId: "s2", moduleId: "m4", dayLabel: "Day 10", title: "Pandas Introduction", duration: "1h 50m", watchedPercent: 62, videoUrl: "" },
      { id: "r3", sessionId: "s1", moduleId: "m3", dayLabel: "Day 9", title: "File Handling", duration: "2h 00m", watchedPercent: 0, videoUrl: "" },
    ],
  },
  b2: {
    id: "b2",
    courseTitle: "React Full Stack",
    batchLabel: "Batch Feb 2025",
    instructor: "Priya Mehta",
    startDate: "1 Feb 2025",
    endDate: "15 Apr 2025",
    overallProgress: 10,
    modules: [
      { id: "m1", title: "React Basics", completionPercent: 50 },
      { id: "m2", title: "Hooks & State", completionPercent: 0 },
      { id: "m3", title: "Server Components", completionPercent: 0 },
    ],
    sessions: [
      {
        id: "s4",
        dayLabel: "Day 3",
        title: "React Server Components Deep Dive",
        status: "UPCOMING",
        scheduledAt: inTwoDays,
        instructor: "Priya Mehta",
      },
    ],
    recordings: [
      { id: "r4", sessionId: "s4", moduleId: "m2", dayLabel: "Day 2", title: "React Hooks", duration: "1h 30m", watchedPercent: 10, videoUrl: "" },
      { id: "r5", sessionId: "s4", moduleId: "m1", dayLabel: "Day 1", title: "React Basics", duration: "1h 45m", watchedPercent: 100, videoUrl: "" },
    ],
  },
};

export const MOCK_LIVE_SESSIONS: LiveSession[] = [
  {
    id: "ls1",
    title: "Python Pandas Deep Dive — Day 12",
    courseTitle: "Python for Data Science",
    instructor: "Ravi Kumar",
    batchLabel: "Jan 2025",
    status: "LIVE",
    scheduledAt: now.toISOString(),
    joinUrl: "https://teams.microsoft.com/mock-session-1",
  },
  {
    id: "ls2",
    title: "React Full Stack — Day 3",
    courseTitle: "React Full Stack",
    instructor: "Priya Mehta",
    batchLabel: "Feb 2025",
    status: "UPCOMING",
    scheduledAt: inTwoDays,
  },
  {
    id: "ls3",
    title: "Python for Data Science — Day 13",
    courseTitle: "Python for Data Science",
    instructor: "Ravi Kumar",
    batchLabel: "Jan 2025",
    status: "UPCOMING",
    scheduledAt: tomorrow,
  },
  {
    id: "ls4",
    title: "NumPy Deep Dive — Day 11",
    courseTitle: "Python for Data Science",
    instructor: "Ravi Kumar",
    batchLabel: "Jan 2025",
    status: "PAST",
    scheduledAt: yesterday,
    recordingSyncingIn: "~20 min",
  },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "ce1",
    title: "🔴 Python Day 12 (LIVE)",
    start: now.toISOString(),
    end: inOneHour,
    type: "live",
    joinUrl: "https://teams.microsoft.com/mock-session-1",
  },
  {
    id: "ce2",
    title: "📅 React Day 3",
    start: inTwoDays,
    end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    type: "upcoming",
  },
  {
    id: "ce3",
    title: "📅 Python Day 13",
    start: tomorrow,
    end: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    type: "upcoming",
  },
];

export const MOCK_MENTORSHIP_TICKETS: MentorshipTicket[] = [
  {
    id: "t1",
    courseTitle: "Python for Data Science",
    topic: "Confused about list comprehensions vs map/filter",
    status: "COMPLETED",
    createdAt: "2025-01-20T10:00:00Z",
    instructor: "Ravi Kumar",
    notes: "Discussed list comprehensions with examples. Practice problems shared.",
  },
  {
    id: "t2",
    courseTitle: "React Full Stack",
    topic: "React Hooks — useEffect cleanup function confusion",
    status: "COMPLETED",
    createdAt: "2025-02-03T14:00:00Z",
    instructor: "Priya Mehta",
    notes: "Explained cleanup pattern with timer and subscription examples.",
  },
];

export const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: "cert1",
    courseTitle: "Python for Data Science",
    batchLabel: "Batch Oct 2024",
    issuedAt: "15 Dec 2024",
    verifyUrl: "https://lms.portal/verify/abc123",
    completionPercent: 100,
    earned: true,
  },
  {
    id: "cert2",
    courseTitle: "JavaScript Foundations",
    batchLabel: "Batch Aug 2024",
    issuedAt: "30 Sep 2024",
    verifyUrl: "https://lms.portal/verify/def456",
    completionPercent: 100,
    earned: true,
  },
  {
    id: "cert3",
    courseTitle: "React Full Stack",
    batchLabel: "Batch Feb 2025",
    completionPercent: 10,
    earned: false,
  },
  {
    id: "cert4",
    courseTitle: "Python for Data Science",
    batchLabel: "Batch Jan 2025",
    completionPercent: 62,
    earned: false,
  },
];

export const MOCK_CATALOGUE: CatalogueCourse[] = [
  {
    id: "cat1",
    title: "Python for Data Science",
    thumbnail: "📊",
    duration: "12 weeks",
    instructor: "Ravi Kumar",
    price: 4999,
    nextBatch: "Feb 2025",
    isEnrolled: true,
    tags: ["Data", "Python"],
    whatYouLearn: ["Pandas & NumPy", "Data Visualisation", "Machine Learning basics", "Jupyter Notebooks"],
    curriculum: [
      { title: "Python Basics", sessions: 4 },
      { title: "Data Structures", sessions: 3 },
      { title: "Pandas & NumPy", sessions: 4 },
      { title: "Visualisation", sessions: 3 },
    ],
  },
  {
    id: "cat2",
    title: "React Full Stack",
    thumbnail: "⚛️",
    duration: "10 weeks",
    instructor: "Priya Mehta",
    price: 3999,
    nextBatch: "Mar 2025",
    isEnrolled: true,
    tags: ["Frontend", "React"],
    whatYouLearn: ["React Hooks", "Server Components", "Next.js", "API integration"],
    curriculum: [
      { title: "React Basics", sessions: 4 },
      { title: "Hooks & State", sessions: 3 },
      { title: "Server Components", sessions: 4 },
    ],
  },
  {
    id: "cat3",
    title: "Node.js Backend Development",
    thumbnail: "🟢",
    duration: "10 weeks",
    instructor: "Kiran S.",
    price: 4499,
    nextBatch: "1 Mar 2025",
    isEnrolled: false,
    tags: ["Backend", "Node"],
    whatYouLearn: ["REST API design with Express", "PostgreSQL with Prisma ORM", "Authentication (JWT, OAuth)", "Deployment on AWS EC2"],
    curriculum: [
      { title: "Node.js Foundations", sessions: 4 },
      { title: "Express & Routing", sessions: 3 },
      { title: "Database & Prisma", sessions: 4 },
      { title: "Auth & Security", sessions: 3 },
      { title: "Deployment", sessions: 2 },
    ],
  },
  {
    id: "cat4",
    title: "DevOps & Cloud Engineering",
    thumbnail: "☁️",
    duration: "8 weeks",
    instructor: "Suresh P.",
    price: 5499,
    nextBatch: "Apr 2025",
    isEnrolled: false,
    tags: ["DevOps", "Cloud"],
    whatYouLearn: ["Docker & Kubernetes", "CI/CD pipelines", "AWS fundamentals", "Infrastructure as Code"],
    curriculum: [
      { title: "Docker & Containers", sessions: 3 },
      { title: "Kubernetes", sessions: 4 },
      { title: "CI/CD", sessions: 3 },
      { title: "AWS", sessions: 4 },
    ],
  },
];

export const MOCK_CONTINUE_LEARNING: ContinueLearningItem[] = [
  {
    recordingId: "r2",
    batchId: "b1",
    courseTitle: "Python for Data Science — Batch Jan 2025",
    dayLabel: "Day 10 Recording",
    watchedPercent: 62,
    thumbnail: "📊",
  },
  {
    recordingId: "r4",
    batchId: "b2",
    courseTitle: "React Full Stack — Batch Feb 2025",
    dayLabel: "Day 2 Recording",
    watchedPercent: 10,
    thumbnail: "⚛️",
  },
];
