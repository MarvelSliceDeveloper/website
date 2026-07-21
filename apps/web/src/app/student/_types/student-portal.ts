// Shared view state types for the student single-page portal

/**
 * Student portal view state types for the single-page application router.
 *
 * The student portal uses a discriminated union (ViewState) instead of
 * traditional URL-based routing. The current view is stored in state and
 * optionally reflected in the URL hash for deep linking.
 *
 * ViewName — union of all possible view identifiers
 * ViewState — current view + optional params (courseId, batchId, etc.)
 *
 * Params are context-specific: e.g. COURSE_CONTENT needs courseId + moduleId,
 * while RECORDING_PLAYER needs sessionId.
 */

/** All possible student portal views */
export type ViewName =
  | "ONBOARDING"
  | "HOME"
  | "COURSES"
  | "BATCH_DETAIL"
  | "RECORDING_PLAYER"
  | "LIVE_SESSIONS"
  | "CALENDAR"
  | "MENTORSHIP"
  | "CERTIFICATES"
  | "COURSE_DETAIL"
  | "COURSE_CONTENT"
  | "ASSIGNMENT_OVERDUE"
  | "QUIZ_OVERDUE"
  | "COURSE_COMPLETED";

export interface ViewState {
  view: ViewName;
  params?: {
    batchId?: string;
    sessionId?: string; // also used as recordingId
    courseId?: string;
    moduleId?: string;
    ticketId?: string;
    quizId?: string;
    assignmentId?: string;
    resourceUrl?: string;
    resourceName?: string;
  };
}
