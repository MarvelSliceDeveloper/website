import { GraphClient } from './graph.client';

export interface CallRecord {
  id: string;
  version: number;
  type: string;
  modalities: string[];
  lastModifiedDateTime: string;
  startDateTime: string;
  endDateTime: string;
  joinWebUrl: string;
}

export interface RecordingSession {
  id: string;
  modalities: string[];
  startDateTime: string;
  endDateTime: string;
  caller: { id: string; displayName: string };
  callee: { id: string; displayName: string };
}

/**
 * Fetch call records for a given date range.
 * Requires Application permission: CallRecords.Read.All
 */
export async function getCallRecords(startDateTime: string, endDateTime: string): Promise<CallRecord[]> {
  const client = new GraphClient({ useAppToken: true });
  // OData filter requires ISO 8601 date strings
  const filter = `startDateTime ge '${startDateTime}' and startDateTime le '${endDateTime}'`;
  const response = await client.get(`/communications/callRecords?$filter=${encodeURIComponent(filter)}`) as { value: CallRecord[] };
  return response.value;
}

/**
 * Fetch session details for a specific call record.
 * Used to drill into meeting participants and segments.
 * Requires Application permission: CallRecords.Read.All
 */
export async function getCallRecordSessions(callId: string): Promise<RecordingSession[]> {
  const client = new GraphClient({ useAppToken: true });
  const response = await client.get(`/communications/callRecords/${callId}/sessions`) as { value: RecordingSession[] };
  return response.value;
}

/**
 * Fetch meeting recordings for a specific online meeting.
 * Uses delegated permissions: OnlineMeetingRecording.Read.All
 * The meeting organizer's userId is required.
 */
export async function getMeetingRecordings(userId: string, meetingId: string): Promise<any[]> {
  const client = new GraphClient({ userId });
  const response = await client.get(`/me/onlineMeetings/${meetingId}/recordings`) as { value: any[] };
  return response.value;
}

/**
 * Fetch a specific recording's content (binary stream URL).
 * Returns a download URL that can be used to stream the video.
 */
export async function getRecordingContent(userId: string, meetingId: string, recordingId: string): Promise<string> {
  const client = new GraphClient({ userId });
  // Set redirect to manual so we can catch the 302 and extract the Location header
  const response = await client.getRaw(`/me/onlineMeetings/${meetingId}/recordings/${recordingId}/content`, {
    redirect: 'manual'
  });
  
  if (response.status === 302 || response.status === 301) {
    const redirectUrl = response.headers.get('Location');
    if (redirectUrl) return redirectUrl;
  }

  // If not redirected, it might have returned the URL in a JSON body (depending on API version)
  // or it might have returned the content directly (not expected for 1.0)
  if (response.ok) {
    const data = await response.json().catch(() => null);
    return data?.value || data?.url || response.url;
  }

  throw new Error(`Failed to fetch recording content: ${response.statusText}`);
}
