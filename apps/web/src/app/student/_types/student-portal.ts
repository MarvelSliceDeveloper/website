// Shared view state types for the student single-page portal

export type ViewName =
  | "HOME"
  | "COURSES"
  | "BATCH_DETAIL"
  | "RECORDING_PLAYER"
  | "LIVE_SESSIONS"
  | "CALENDAR"
  | "MENTORSHIP"
  | "CERTIFICATES"
  | "BROWSE_CATALOGUE"
  | "COURSE_DETAIL"
  | "COURSE_CONTENT";

export interface ViewState {
  view: ViewName;
  params?: {
    batchId?: string;
    sessionId?: string; // also used as recordingId
    courseId?: string;
    moduleId?: string;
    ticketId?: string;
  };
}
