// Graph Module — Barrel Export
// Central entry point for all Microsoft Graph API interactions

export { GraphClient, GraphError } from "./graph.client";
export {
  getTokenForUser,
  refreshMsTokenForUser,
  getAppToken,
} from "./graph.auth";

// Sub-modules
export { getMsUserProfile } from "./graph.users";
export type { MsUserProfile } from "./graph.users";

export { createOnlineMeeting, getOnlineMeeting } from "./graph.meetings";
export type { OnlineMeeting, CreateMeetingRequest } from "./graph.meetings";

export { getCalendarView, createCalendarEvent } from "./graph.calendar";
export type { CalendarEvent, CreateEventRequest } from "./graph.calendar";

export { getMeetingRecordings, getRecordingContent } from "./graph.recordings";
export type { RecordingSession } from "./graph.recordings";

export {
  createSubscription,
  renewSubscription,
  deleteSubscription,
} from "./graph.subscriptions";
export type { Subscription } from "./graph.subscriptions";
