# Mentorship Calendar Integration — TODO

## Problem
Mentorship sessions scheduled via the mentorship ticket system do **not** appear in any calendar views (admin calendar, student calendar, instructor calendar). This is because:

- Calendar views pull data from `/api/sessions` → `LiveSession` table
- Mentorship scheduling only updates `MentorshipTicket` table (sets `scheduledAt`, `joinUrl`, `teamsMeetingId`, status→SCHEDULED)
- No corresponding `LiveSession` record is created

## Current Mentorship Workflow (Working)

| Step | Action | Endpoint | Status Change |
|------|--------|----------|---------------|
| 1 | Student creates request | `POST /api/mentorship/tickets` | OPEN |
| 2 | Admin assigns mentor | `PATCH /api/mentorship/tickets/:id/assign` | ASSIGNED |
| 3 | Instructor schedules session | `PATCH /api/mentorship/tickets/:id/schedule` | SCHEDULED |
| 4 | Instructor completes | `PATCH /api/mentorship/tickets/:id/complete` | COMPLETED |
| — | Cancel anytime | `PATCH /api/mentorship/tickets/:id/cancel` | CANCELLED |

## What Works
- Student sees mentorship requests in `/student/mentorship`
- Instructor sees assigned mentorships in `/instructor/mentorship`
- Admin sees all mentorships in `/admin/mentorship`
- Mentor assignment works correctly
- Status transitions work correctly
- Notifications are sent on status changes

## What's Missing
- Scheduled mentorship sessions **do not appear in calendar views**
- No `LiveSession` record is created when mentorship is scheduled
- No `CalendarEvent` record is synced for mentorship sessions

## Affected Views
- `/admin/calendar/page.tsx` — fetches `/api/sessions`, no mentorship sessions shown
- `/student/_views/CalendarView.tsx` — fetches `/api/sessions`, no mentorship sessions shown
- Instructor calendar — likely the same pattern

## Data Model (`MentorshipTicket`)
```prisma
model MentorshipTicket {
  id             String       @id @default(cuid())
  studentId      String
  mentorId       String?      // Assigned by admin
  courseId       String?      // Optional course reference
  title          String       // Topic/subject of mentorship
  description    String       // Detailed request
  preferredDate  DateTime?    // Student's preferred date
  preferredTime  String?      // Student's preferred time slot
  scheduledAt    DateTime?    // Final scheduled time (Teams meeting)
  joinUrl        String?      // Teams meeting join URL
  teamsMeetingId String?      // Microsoft Teams meeting ID
  notes          String?      // Resolution notes
  status         TicketStatus @default(OPEN)
  // ... relations to student, mentor, course
}
```

## `LiveSession` Model (for reference)
```prisma
model LiveSession {
  id             String         @id @default(cuid())
  batchId        String         // Which batch — mentorship needs a different approach
  moduleId       String?
  title          String
  teamsMeetingId String         @unique
  joinUrl        String
  scheduledAt    DateTime
  scheduledEndAt DateTime
  endedAt        DateTime?
  createdFrom    String         // LMS, LMS_CUSTOM, TEAMS — add "MENTORSHIP"
  createdBy      String
  instructorId   String?
  // ... relations
}
```

## Proposed Fix

### 1. In `ticketService.scheduleSession()` (~line 209 of `ticket.service.ts`)
After updating the mentorship ticket (status→SCHEDULED, scheduledAt, joinUrl, teamsMeetingId), also:

```
- Create a LiveSession record with:
  - title: "Mentorship: {ticket.title} - {student.name}"
  - scheduledAt / scheduledEndAt: from schedule data (default 1hr duration)
  - joinUrl: from schedule data
  - teamsMeetingId: from schedule data
  - instructorId: mentor's ID
  - batchId: maybe null or placeholder — need to handle
  - createdFrom: "MENTORSHIP" (add this constant)
  - createdBy: instructor ID
```

### 2. Handle `batchId` requirement
`LiveSession.batchId` is required and has a FK to `Batch`. Options:
- **Option A**: Make `batchId` nullable (requires Prisma migration)
- **Option B**: Use a system "Mentorship" batch (hacky)
- **Option C**: Link mentorship to a batch if courseId is set on the ticket

### 3. Consider adding `mentorshipTicketId` to `LiveSession`
To link back from session to mentorship ticket (bi-directional link). Requires Prisma migration.

### 4. Calendar query changes
Calendar views fetch sessions. They might need filtering or labeling to distinguish mentorship sessions from regular batch sessions. Add visual indicator like "(Mentorship)" in the event title or a badge.

## Related Files
- `apps/api/src/modules/tickets/ticket.service.ts` — main logic to modify
- `apps/api/src/modules/sessions/session.service.ts` — session creation (may reuse)
- `apps/api/src/modules/tickets/ticket.controller.ts` — `scheduleSession` handler
- `apps/web/src/app/admin/calendar/page.tsx` — admin calendar
- `apps/web/src/app/student/_views/CalendarView.tsx` — student calendar
- `apps/api/prisma/schema.prisma` — `MentorshipTicket` and `LiveSession` models

## Status
**TODO** — Not yet implemented.
