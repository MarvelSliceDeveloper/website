export const MOCK_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface DashboardChartData {
  studentsPerCourse: { courseTitle: string; count: number }[];
  enrollmentTrend: { month: string; count: number }[];
  batchDistribution: { status: string; count: number }[];
  revenueTrend: { month: string; total: number }[];
  userRoleDistribution: { role: string; count: number }[];
  topCourses: { courseTitle: string; enrollmentCount: number }[];
}

export const MOCK_DASHBOARD_CHARTS: DashboardChartData = {
  studentsPerCourse: [
    { courseTitle: "Python for Data Science", count: 45 },
    { courseTitle: "React Full Stack", count: 38 },
    { courseTitle: "AWS Cloud Architecture", count: 27 },
    { courseTitle: "DevOps with Docker & K8s", count: 22 },
    { courseTitle: "TypeScript Advanced", count: 18 },
  ],
  enrollmentTrend: [
    { month: "Jan", count: 12 },
    { month: "Feb", count: 28 },
    { month: "Mar", count: 35 },
    { month: "Apr", count: 42 },
    { month: "May", count: 55 },
    { month: "Jun", count: 68 },
  ],
  batchDistribution: [
    { status: "ACTIVE", count: 4 },
    { status: "UPCOMING", count: 2 },
    { status: "COMPLETED", count: 3 },
  ],
  revenueTrend: [
    { month: "Jan", total: 120000 },
    { month: "Feb", total: 280000 },
    { month: "Mar", total: 350000 },
    { month: "Apr", total: 420000 },
    { month: "May", total: 550000 },
    { month: "Jun", total: 680000 },
  ],
  userRoleDistribution: [
    { role: "STUDENT", count: 120 },
    { role: "INSTRUCTOR", count: 8 },
    { role: "ADMIN", count: 3 },
  ],
  topCourses: [
    { courseTitle: "Python for Data Science", enrollmentCount: 45 },
    { courseTitle: "React Full Stack", enrollmentCount: 38 },
    { courseTitle: "AWS Cloud Architecture", enrollmentCount: 27 },
    { courseTitle: "DevOps with Docker & K8s", enrollmentCount: 22 },
    { courseTitle: "TypeScript Advanced", enrollmentCount: 18 },
  ],
};
