export const MOCK_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface DashboardStats {
  totalSessions: number;
  totalBatches: number;
  totalStudents: number;
  pendingAssignments: number;
}

export interface AssignmentSubmission {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  assignmentTitle: string;
  submittedAt: string;
  status: "PENDING" | "GRADED";
}

export interface DashboardSession {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  batch: { name: string; course: { title: string } };
}

export interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string | null;
  course: { id: string; title: string };
  _count: { enrollments: number; sessions: number };
}

export interface Session {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batchId: string;
  moduleId: string | null;
  batch: { id: string; name: string; course: { id: string; title: string } };
  recording: { id: string } | null;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  type: "QUIZ" | "ASSIGNMENT";
  questionPdfUrl?: string | null;
  course: { title: string };
  batch: { name: string };
  _count?: { submissions: number; questions: number };
}

export type TicketStatus = "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface MentorshipTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  preferredDate: string | null;
  preferredTime: string | null;
  scheduledAt: string | null;
  joinUrl: string | null;
  teamsMeetingId: string | null;
  createdAt: string;
  student: { id: string; name: string; email: string };
  mentor: { id: string; name: string } | null;
}

export const MOCK_INSTRUCTOR_STATS: DashboardStats = {
  totalSessions: 24,
  totalBatches: 4,
  totalStudents: 87,
  pendingAssignments: 6,
};

export const MOCK_INSTRUCTOR_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: "sub1",
    studentName: "Amit Sharma",
    studentEmail: "amit.sharma@example.com",
    courseTitle: "Python for Data Science",
    assignmentTitle: "Capstone Project (Covid 19) - Submit Here",
    submittedAt: "2026-03-01T14:30:00.000Z",
    status: "PENDING",
  },
  {
    id: "sub2",
    studentName: "Neha Patel",
    studentEmail: "neha.patel@example.com",
    courseTitle: "Python for Data Science",
    assignmentTitle: "NumPy Basics Quiz",
    submittedAt: "2026-03-02T09:15:00.000Z",
    status: "PENDING",
  },
  {
    id: "sub3",
    studentName: "Rohit Singh",
    studentEmail: "rohit.singh@example.com",
    courseTitle: "React Full Stack",
    assignmentTitle: "Hooks Refactor Assignment",
    submittedAt: "2026-03-03T16:45:00.000Z",
    status: "PENDING",
  },
  {
    id: "sub4",
    studentName: "Priya Desai",
    studentEmail: "priya.desai@example.com",
    courseTitle: "AWS Cloud Architecture",
    assignmentTitle: "VPC Design Quiz",
    submittedAt: "2026-03-04T11:00:00.000Z",
    status: "PENDING",
  },
  {
    id: "sub5",
    studentName: "Arjun Nair",
    studentEmail: "arjun.nair@example.com",
    courseTitle: "Python for Data Science",
    assignmentTitle: "Pandas DataFrame Quiz",
    submittedAt: "2026-03-05T08:20:00.000Z",
    status: "PENDING",
  },
  {
    id: "sub6",
    studentName: "Sneha Reddy",
    studentEmail: "sneha.reddy@example.com",
    courseTitle: "React Full Stack",
    assignmentTitle: "React Basics MCQ",
    submittedAt: "2026-03-05T13:10:00.000Z",
    status: "PENDING",
  },
];

export const MOCK_INSTRUCTOR_DASHBOARD_SESSIONS: DashboardSession[] = [
  {
    id: "s1",
    joinUrl: "https://teams.microsoft.com/mock-session-1",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    batch: { name: "Batch Jan 2025", course: { title: "Python for Data Science" } },
  },
  {
    id: "s2",
    joinUrl: "https://teams.microsoft.com/mock-session-2",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    batch: { name: "Batch Jan 2025", course: { title: "Python for Data Science" } },
  },
  {
    id: "s3",
    joinUrl: "https://teams.microsoft.com/mock-session-3",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    batch: { name: "Batch Feb 2025", course: { title: "React Full Stack" } },
  },
  {
    id: "s4",
    joinUrl: "https://teams.microsoft.com/mock-session-4",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    batch: { name: "Batch Mar 2025", course: { title: "AWS Cloud Architecture" } },
  },
];

export const MOCK_INSTRUCTOR_BATCHES: Batch[] = [
  {
    id: "b1",
    name: "Batch Jan 2025",
    startDate: "2025-01-15T00:00:00.000Z",
    endDate: "2025-03-30T00:00:00.000Z",
    maxStudents: 30,
    description: "Python for Data Science — covers Python basics through machine learning.",
    course: { id: "c1", title: "Python for Data Science" },
    _count: { enrollments: 28, sessions: 14 },
  },
  {
    id: "b2",
    name: "Batch Feb 2025",
    startDate: "2025-02-01T00:00:00.000Z",
    endDate: "2025-04-15T00:00:00.000Z",
    maxStudents: 25,
    description: "React Full Stack — from React fundamentals to advanced server components.",
    course: { id: "c2", title: "React Full Stack" },
    _count: { enrollments: 22, sessions: 6 },
  },
  {
    id: "b3",
    name: "Batch Mar 2025",
    startDate: "2025-03-01T00:00:00.000Z",
    endDate: "2025-05-30T00:00:00.000Z",
    maxStudents: 30,
    description: "AWS Cloud Architecture — compute, storage, networking, security, and beyond.",
    course: { id: "c5", title: "AWS Cloud Architecture" },
    _count: { enrollments: 20, sessions: 8 },
  },
  {
    id: "b4",
    name: "Batch Dec 2024",
    startDate: "2024-12-01T00:00:00.000Z",
    endDate: "2025-02-28T00:00:00.000Z",
    maxStudents: 25,
    description: "JavaScript Foundations — core JS concepts for beginners.",
    course: { id: "c4", title: "JavaScript Foundations" },
    _count: { enrollments: 17, sessions: 12 },
  },
];

export const MOCK_INSTRUCTOR_SESSIONS: Session[] = [
  {
    id: "s1",
    joinUrl: "https://teams.microsoft.com/mock-session-1",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-1",
    batchId: "b1",
    moduleId: "m4",
    batch: { id: "b1", name: "Batch Jan 2025", course: { id: "c1", title: "Python for Data Science" } },
    recording: null,
  },
  {
    id: "s2",
    joinUrl: "https://teams.microsoft.com/mock-session-2",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-1",
    batchId: "b1",
    moduleId: "m4",
    batch: { id: "b1", name: "Batch Jan 2025", course: { id: "c1", title: "Python for Data Science" } },
    recording: null,
  },
  {
    id: "s3",
    joinUrl: "https://teams.microsoft.com/mock-session-3",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-2",
    batchId: "b2",
    moduleId: "m2",
    batch: { id: "b2", name: "Batch Feb 2025", course: { id: "c2", title: "React Full Stack" } },
    recording: null,
  },
  {
    id: "s4",
    joinUrl: "https://teams.microsoft.com/mock-session-4",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: null,
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-3",
    batchId: "b3",
    moduleId: "m3",
    batch: { id: "b3", name: "Batch Mar 2025", course: { id: "c5", title: "AWS Cloud Architecture" } },
    recording: null,
  },
  {
    id: "s5",
    joinUrl: "https://teams.microsoft.com/mock-session-5",
    scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-1",
    batchId: "b1",
    moduleId: "m3",
    batch: { id: "b1", name: "Batch Jan 2025", course: { id: "c1", title: "Python for Data Science" } },
    recording: { id: "r1" },
  },
  {
    id: "s6",
    joinUrl: "https://teams.microsoft.com/mock-session-6",
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-3",
    batchId: "b3",
    moduleId: "m2",
    batch: { id: "b3", name: "Batch Mar 2025", course: { id: "c5", title: "AWS Cloud Architecture" } },
    recording: { id: "r2" },
  },
  {
    id: "s7",
    joinUrl: "https://teams.microsoft.com/mock-session-7",
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    createdFrom: "LMS_SCHEDULER",
    createdBy: "instructor-3",
    batchId: "b3",
    moduleId: "m1",
    batch: { id: "b3", name: "Batch Mar 2025", course: { id: "c5", title: "AWS Cloud Architecture" } },
    recording: { id: "r3" },
  },
  {
    id: "s8",
    joinUrl: "https://teams.microsoft.com/mock-session-8",
    scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    createdFrom: "LMS_CUSTOM",
    createdBy: "instructor-4",
    batchId: "b4",
    moduleId: null,
    batch: { id: "b4", name: "Batch Dec 2024", course: { id: "c4", title: "JavaScript Foundations" } },
    recording: { id: "r4" },
  },
];

export const MOCK_INSTRUCTOR_ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Capstone Project (Covid 19) - Submit Here",
    description: "Analyze COVID-19 dataset using Pandas and present findings.",
    dueDate: "2026-03-03T00:00:00.000Z",
    maxPoints: 100,
    type: "ASSIGNMENT",
    course: { title: "Python for Data Science" },
    batch: { name: "Batch Jan 2025" },
    _count: { submissions: 12, questions: 0 },
  },
  {
    id: "a2",
    title: "NumPy Basics Quiz",
    description: "Test your understanding of NumPy arrays and operations.",
    dueDate: "2026-03-10T00:00:00.000Z",
    maxPoints: 20,
    type: "QUIZ",
    course: { title: "Python for Data Science" },
    batch: { name: "Batch Jan 2025" },
    _count: { submissions: 18, questions: 10 },
  },
  {
    id: "a3",
    title: "Hooks Refactor Assignment",
    description: "Refactor a class component to use React Hooks.",
    dueDate: "2026-04-24T00:00:00.000Z",
    maxPoints: 50,
    type: "ASSIGNMENT",
    course: { title: "React Full Stack" },
    batch: { name: "Batch Feb 2025" },
    _count: { submissions: 8, questions: 0 },
  },
  {
    id: "a4",
    title: "VPC Design Quiz",
    description: "MCQ covering VPC, subnets, route tables, and NAT gateways.",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPoints: 15,
    type: "QUIZ",
    course: { title: "AWS Cloud Architecture" },
    batch: { name: "Batch Mar 2025" },
    _count: { submissions: 5, questions: 15 },
  },
  {
    id: "a5",
    title: "Pandas DataFrame Quiz",
    description: "Quiz on Pandas DataFrame operations and transformations.",
    dueDate: "2026-03-15T00:00:00.000Z",
    maxPoints: 15,
    type: "QUIZ",
    course: { title: "Python for Data Science" },
    batch: { name: "Batch Jan 2025" },
    _count: { submissions: 20, questions: 10 },
  },
];

export const MOCK_INSTRUCTOR_BATCHES_FOR_ASSIGNMENTS = [
  { id: "b1", name: "Batch Jan 2025", course: { id: "c1", title: "Python for Data Science" } },
  { id: "b2", name: "Batch Feb 2025", course: { id: "c2", title: "React Full Stack" } },
  { id: "b3", name: "Batch Mar 2025", course: { id: "c5", title: "AWS Cloud Architecture" } },
  { id: "b4", name: "Batch Dec 2024", course: { id: "c4", title: "JavaScript Foundations" } },
];

export const MOCK_INSTRUCTOR_TICKETS: MentorshipTicket[] = [
  {
    id: "t1",
    title: "Help with list comprehensions",
    description: "Confused about list comprehensions vs map/filter in Python.",
    status: "COMPLETED",
    preferredDate: "2025-01-25",
    preferredTime: "15:00",
    scheduledAt: "2025-01-25T15:00:00.000Z",
    joinUrl: "https://teams.microsoft.com/mentor-1",
    teamsMeetingId: null,
    createdAt: "2025-01-20T10:00:00.000Z",
    student: { id: "stu1", name: "Amit Sharma", email: "amit.sharma@example.com" },
    mentor: { id: "inst1", name: "Ravi Kumar" },
  },
  {
    id: "t2",
    title: "React Hooks useEffect cleanup",
    description: "Need help understanding the cleanup function in useEffect.",
    status: "COMPLETED",
    preferredDate: "2025-02-08",
    preferredTime: "14:00",
    scheduledAt: "2025-02-08T14:00:00.000Z",
    joinUrl: "https://teams.microsoft.com/mentor-2",
    teamsMeetingId: null,
    createdAt: "2025-02-03T14:00:00.000Z",
    student: { id: "stu2", name: "Neha Patel", email: "neha.patel@example.com" },
    mentor: { id: "inst2", name: "Priya Mehta" },
  },
  {
    id: "t3",
    title: "VPC peering vs Transit Gateway",
    description: "Need help understanding the difference between VPC peering and Transit Gateway in AWS.",
    status: "ASSIGNED",
    preferredDate: "2025-03-18",
    preferredTime: "11:00",
    scheduledAt: null,
    joinUrl: null,
    teamsMeetingId: null,
    createdAt: "2025-03-14T11:00:00.000Z",
    student: { id: "stu3", name: "Rohit Singh", email: "rohit.singh@example.com" },
    mentor: { id: "inst3", name: "Suresh P." },
  },
  {
    id: "t4",
    title: "Matplotlib subplots layout",
    description: "Stuck on creating complex subplot layouts with Matplotlib.",
    status: "SCHEDULED",
    preferredDate: "2025-03-18",
    preferredTime: "16:00",
    scheduledAt: "2025-03-18T16:00:00.000Z",
    joinUrl: "https://teams.microsoft.com/mentor-3",
    teamsMeetingId: null,
    createdAt: "2025-03-12T14:00:00.000Z",
    student: { id: "stu4", name: "Priya Desai", email: "priya.desai@example.com" },
    mentor: { id: "inst1", name: "Ravi Kumar" },
  },
  {
    id: "t5",
    title: "React Server Components",
    description: "Would like to understand RSC vs client components better.",
    status: "SCHEDULED",
    preferredDate: "2025-03-20",
    preferredTime: "10:00",
    scheduledAt: "2025-03-20T10:00:00.000Z",
    joinUrl: "https://teams.microsoft.com/mentor-4",
    teamsMeetingId: null,
    createdAt: "2025-03-15T09:00:00.000Z",
    student: { id: "stu5", name: "Arjun Nair", email: "arjun.nair@example.com" },
    mentor: { id: "inst2", name: "Priya Mehta" },
  },
  {
    id: "t6",
    title: "IAM policy writing",
    description: "Need guidance on writing least-privilege IAM policies.",
    status: "ASSIGNED",
    preferredDate: "2025-03-22",
    preferredTime: "15:30",
    scheduledAt: null,
    joinUrl: null,
    teamsMeetingId: null,
    createdAt: "2025-03-16T08:30:00.000Z",
    student: { id: "stu6", name: "Sneha Reddy", email: "sneha.reddy@example.com" },
    mentor: { id: "inst3", name: "Suresh P." },
  },
];
