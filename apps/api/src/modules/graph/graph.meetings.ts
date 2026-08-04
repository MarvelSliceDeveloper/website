import { GraphClient } from "./graph.client";

export interface CreateMeetingRequest {
  startDateTime: string;
  endDateTime: string;
  subject: string;
}

export interface OnlineMeeting {
  id: string;
  joinWebUrl: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  // Other fields exist but these are the ones we typically need
}

export async function createOnlineMeeting(
  userId: string,
  data: CreateMeetingRequest,
): Promise<OnlineMeeting> {
  const client = new GraphClient({ userId });
  return client.post("/me/onlineMeetings", data) as Promise<OnlineMeeting>;
}

export async function getOnlineMeeting(
  userId: string,
  meetingId: string,
): Promise<OnlineMeeting> {
  const client = new GraphClient({ userId });
  return client.get(
    `/me/onlineMeetings/${meetingId}`,
  ) as Promise<OnlineMeeting>;
}
