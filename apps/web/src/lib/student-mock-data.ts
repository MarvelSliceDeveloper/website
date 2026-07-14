// Re-export types from api-types.ts for backward compatibility.
// All mock data has been removed — real API data is used instead.
export type {
  CourseStatus,
  SessionStatus,
  TicketStatus,
  EnrolledCourse,
  Batch,
  BatchSession,
  BatchRecording,
  BatchModule,
  LiveSession,
  CalendarEvent,
  MentorshipTicket,
  Certificate,
  CatalogueCourse,
  ContinueLearningItem,
  DashboardStats,
  DashboardChartData,
  OverdueAssignment,
} from "./api-types";

// Deprecated — always false, kept only for backward compat
export const MOCK_ENABLED = false;
