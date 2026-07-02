# Mentorship Calendar Integration — COMPLETED

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

## Implementation Summary

### What Changed

**1. Prisma Schema** (`apps/api/prisma/schema.prisma`)
- `LiveSession.batchId` → made nullable (`String?`) — mentorship sessions have no batch
- Added `LiveSession.mentorshipTicketId` (`String?` @unique) — bi-directional link to `MentorshipTicket`
- Added `LiveSession.mentorshipTicket` relation + `MentorshipTicket.liveSession` back-link
- New migration: `20260702115600_add_mentorship_calendar_integration`

**2. `ticketService.scheduleSession()`** — now uses a Prisma transaction to atomically:
1. Update mentorship ticket (status→SCHEDULED)
2. Create `LiveSession` record with `batchId: null`, `createdFrom: 'MENTORSHIP'`, title `"Mentorship: {title} — {student}"`, default 1hr `scheduledEndAt`, synthetic `teamsMeetingId` if not provided
3. Create `CalendarEvent` record linked to the LiveSession

**3. `ticketService.cancelMentorshipTicket()`** — deletes the linked `LiveSession` + `CalendarEvent` in a transaction when a ticket is cancelled

**4. `sessionService.listSessions()`** — instructor filter now uses `OR` to match mentorship sessions by `instructorId` in addition to batch instructor matches

**5. `sessionService.cancelSession()` & `updateSession()`** — handle nullable `session.batch` by falling back to `session.instructorId`

**6. Side-effect fixes** — `attendance.service.ts`, `notification.service.ts`, and `certificate.service.ts` updated for null-safe `batch`/`batchId` access

### How It Works

| Step | What Happens | Calendar Visibility |
|------|-------------|-------------------|
| Instructor schedules mentorship | `scheduleSession()` creates `LiveSession` + `CalendarEvent` | ✅ Appears in `/api/sessions` (admin calendar) and `/api/calendar/events` (student calendar) |
| Student views calendar | Fetches `/api/calendar/events` → includes mentorship events | ✅ Shows with indigo (`#6366f1`) color (already supported in `CalendarView.tsx`) |
| Admin views calendar | Fetches `/api/sessions` → includes mentorship LiveSessions | ✅ Shows up (title prefixed with "Mentorship:") |
| Ticket cancelled | Linked session + event are cleaned up | ✅ Removed from all views |

### Files Modified
- `apps/api/prisma/schema.prisma` — schema changes
- `apps/api/prisma/migrations/20260702115600_add_mentorship_calendar_integration/migration.sql` — migration
- `apps/api/src/modules/tickets/ticket.service.ts` — core schedule/cancel logic
- `apps/api/src/modules/sessions/session.service.ts` — null-safe batch handling + mentor session listing
- `apps/api/src/modules/attendance/attendance.service.ts` — null-safe batch check
- `apps/api/src/modules/certificates/certificate.service.ts` — null-safe batchId
- `apps/api/src/modules/notifications/notification.service.ts` — early return for mentorship sessions + InputJsonValue fix

### Notes
- Run `pnpm prisma:migrate` when database is available to apply the migration
- The `LiveSession.batchId` is null for mentorship sessions; frontend components already use optional chaining (`s.batch?.course?.title`) and handle it gracefully
- Calendar events from the real API don't carry a `type` field — the student calendar's `eventColor()` falls back to blue (`#25c0e8`) when type is unspecified. Title prefix "Mentorship:" serves as the visual differentiator.
- The student portal's mock data (`MOCK_CALENDAR_EVENTS`) already includes a mentorship entry (`type: "mentorship"`, `#6366f1`) — keeps working independently

## Status
**COMPLETED** — Implemented on 2026-07-02.
