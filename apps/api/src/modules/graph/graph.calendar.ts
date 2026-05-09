import { GraphClient } from './graph.client';

export interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  onlineMeeting?: {
    joinUrl: string;
  };
  isOnlineMeeting: boolean;
}

export interface CreateEventRequest {
  subject: string;
  body?: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: 'teamsForBusiness';
}

export async function getCalendarView(userId: string, startDateTime: string, endDateTime: string): Promise<CalendarEvent[]> {
  const client = new GraphClient({ userId });
  const params = new URLSearchParams({
    startDateTime,
    endDateTime,
  });
  const response = await client.get(`/me/calendarView?${params.toString()}`) as { value: CalendarEvent[] };
  return response.value;
}

export async function createCalendarEvent(userId: string, data: CreateEventRequest): Promise<CalendarEvent> {
  const client = new GraphClient({ userId });
  return client.post('/me/events', data) as Promise<CalendarEvent>;
}
