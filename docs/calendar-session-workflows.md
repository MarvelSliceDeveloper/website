# Calendar & Sessions — Role-Based Workflows

## Admin Workflows

### 1. Schedule a New Session

```
Admin navigates to /admin/sessions → clicks "Schedule Session"
  │
  ├─ Fills form:
  │    ├─ Course (dropdown, fetches GET /api/admin/courses)
  │    ├─ Batch (dropdown, filtered by course)
  │    ├─ Module (optional, filtered by course)
  │    ├─ Instructor override (optional, fetches GET /api/admin/batches/instructors)
  │    ├─ Custom join URL (optional — if blank, auto-creates Teams meeting)
  │    ├─ Title
  │    └─ Start / End datetime
  │
  ├─ Submits → POST /api/sessions
  │    ├─ Server validates: batch exists, module belongs to course, no time overlap
  │    ├─ If no custom URL: calls Graph API createOnlineMeeting()
  │    ├─ prisma.liveSession.create({ scheduledAt, scheduledEndAt, endedAt })
  │    └─ prisma.calendarEvent.create({ title, startAt, endAt, sessionId })
  │
  └─ Redirects to /admin/sessions list
```

### 2. View Sessions in Calendar

```
Admin navigates to /admin/calendar
  │
  ├─ Fetches GET /api/sessions (all sessions)
  │    └─ No instructorId filter for admin role
  │
  ├─ Frontend maps to FullCalendar events:
  │    ├─ title = "{course title} - {batch name}"
  │    ├─ start = scheduledAt
  │    ├─ end = endedAt (Fix A — was reading wrong field)
  │    └─ color = deterministic color per course
  │
  └─ Can filter by instructor dropdown
      └─ Click event → opens joinUrl in new tab
```

### 3. Edit a Session

```
Admin clicks edit icon on session card → opens modal
  │
  ├─ Pre-filled: title, start time, end time (from endedAt)
  │
  └─ Submits → PATCH /api/sessions/:id
       ├─ prisma.liveSession.update({
       │     title,              ← Fix B: now actually saved
       │     scheduledAt,
       │     scheduledEndAt,     ← Fix D: preserves scheduled end
       │     endedAt,            ← Fix B: now updated when rescheduled
       │   })
       └─ prisma.calendarEvent.updateMany({
             title, startAt, endAt    ← Fix B: all fields synced
           })
```

### 4. Delete a Session (Hard Delete)

```
Admin clicks delete → confirms dialog
  │
  └─ DELETE /api/sessions/:id (ADMIN role = hard delete)
       └─ Transaction:
            ├─ calendarEvent.deleteMany({ sessionId })
            ├─ attendance.deleteMany({ sessionId })
            ├─ progress.deleteMany({ recordingId }) (if recording exists)
            ├─ recording.delete({ sessionId }) (if exists)
            └─ liveSession.delete({ id })
```

### 5. Sync Teams Recording

```
Admin clicks "Sync Recording" on past session card
  │
  └─ POST /api/recordings/:sessionId/sync
       └─ Fetches meeting recording from Graph API → stores in Recording table
```

---

## Instructor Workflows

### 1. Schedule a Session

```
Instructor navigates to /instructor/sessions → clicks "Schedule Session" modal
  │
  ├─ Form (simpler than admin):
  │    ├─ Course → Batch → Module (filtered by their batches)
  │    ├─ Title
  │    ├─ Start / End datetime
  │    └─ Custom join URL (optional)
  │
  └─ Submits → POST /api/sessions
       └─ Same backend flow as admin (creates LiveSession + CalendarEvent + Teams meeting)
```

### 2. View Sessions

```
Instructor navigates to /instructor/sessions
  │
  └─ Fetches GET /api/sessions
       └─ Server filters by req.user.userId as instructorId
            └─ Only sessions where batch.instructorId matches

  ├─ Upcoming section: grid layout (2 columns), rich cards
  │    └─ Each card: time, course, batch, status badges, edit/cancel buttons
  │
  └─ Past section: list layout
       └─ Shows recording status, attendance button, sync recording button
```

### 3. Edit a Session

```
Instructor clicks edit icon → modal
  │
  └─ Submits → PATCH /api/sessions/:id
       └─ Backend double-checks: session.batch.instructorId === userId
            └─ Same update flow as admin (Fix B + Fix D applied)
```

### 4. Cancel a Session (Soft Cancel)

```
Instructor clicks cancel → confirmation
  │
  └─ DELETE /api/sessions/:id (INSTRUCTOR role = soft cancel)
       └─ notifySessionCancelled()
            └─ Transaction:
                 ├─ calendarEvent.deleteMany({ sessionId })  ← Fix C: removes from calendar
                 └─ liveSession.update({ endedAt: new Date() })  ← cancel timestamp
```

### 5. View Attendance

```
Instructor clicks "Attendance" on session card → modal opens
  │
  └─ Fetches GET /api/attendance/:sessionId
       └─ Shows student name, email, joinedAt time
```

### 6. Start / Join Session

```
Instructor clicks "Start Class" or "View Link"
  │
  └─ Opens session.joinUrl in new tab (Teams meeting or custom URL)
```

---

## Student Workflows

### 1. View Calendar

```
Student navigates via:
  ├─ Sidebar → "Calendar" → /student?view=calendar   ← Fix E: now works
  └─ Dashboard → "View Full Calendar" button (SPA navigation)
       │
       └─ StudentPortalPage checks ?view=calendar query param
            └─ Initializes viewStack with [{ view: "CALENDAR" }]
                 │
                 └─ CalendarView renders events from GET /api/calendar/events
                      ├─ Color-coded: Live (red), Upcoming (blue), Mentorship (indigo)
                      ├─ Month / Week / List views via FullCalendar
                      └─ "This Week" list below with Live/Upcoming/Past status badges
```

### 2. View Live Sessions List

```
Student navigates via:
  ├─ Dashboard → "Sessions" tab
  └─ SPA navigation → LiveSessionsView

  ├─ Fetches GET /api/sessions (server filters by student's enrolled batches)
  │
  └─ Computes status from CLIENT time (not server):
       ├─ LIVE: scheduledAt <= now && (!endedAt || endedAt >= now)
       ├─ UPCOMING: scheduledAt > now
       └─ PAST: endedAt < now
            └─ Filter tabs: All / Live Now / Upcoming / Past
```

### 3. Join a Live Session

```
Student clicks "Join on Teams"
  │
  ├─ POST /api/attendance/:sessionId/join → records attendance (userId, sessionId, joinedAt)
  │
  └─ Opens session.joinUrl in new tab (Teams meeting)
```

### 4. View Session in Course Content

```
Student opens course → navigates to module
  │
  └─ CourseContentView renders:
       ├─ "Live Now" banner if session is active
       └─ SessionSidebar with:
            ├─ Live Now (red pulse dot) — Join button
            ├─ Upcoming (accent dot)
            └─ Past (muted dot) — Recording badge if available
```

### 5. View Recording (Past Session)

```
Student clicks recording badge on past session
  │
  └─ Navigates to RecordingPlayerView
       ├─ Watches video recording
       ├─ Progress tracked: watchedSeconds stored in Progress table
       └─ 90% watched = automatically marked completed
```

### 6. Sync from Microsoft Teams (if linked)

```
Student (or any user with linked MS account) clicks "Sync Calendar" in settings
  │
  └─ POST /api/calendar/sync
       ├─ Calls Graph API getCalendarView(userId, startDate, endDate)
       ├─ For each MS event:
       │    ├─ Try to match joinUrl to existing LiveSession
       │    └─ Upsert CalendarEvent by msEventId
       └─ Returns synced events
```

---

## Cross-Role Data Flow Diagram

```
                    ┌─────────────┐
                    │  Microsoft  │
                    │   Teams     │
                    │  (Graph)    │
                    └──────┬──────┘
                           │ webhook POST /api/webhooks/events
                           ▼
         ┌─────────────────────────────────────┐
         │         Events Webhook              │
         │  - Validates clientState            │
         │  - Fetches event from Graph API     │
         │  - Checks isOnlineMeeting           │
         │  - Finds instructor's batch         │
         │  - Creates/updates LiveSession      │
         │  - Creates/updates CalendarEvent    │
         └────────────────┬────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────────┐
         │         Session Service             │
         │                                     │
         │  createSession()                    │
         │    ├─ Validate batch/module/overlap │
         │    ├─ Create Teams meeting (Graph)  │
         │    ├─ Create LiveSession            │
         │    └─ Create CalendarEvent          │
         │                                     │
         │  updateSession()                    │
         │    ├─ Update LiveSession            │
         │    │  (title, scheduledAt,          │
         │    │   scheduledEndAt, endedAt)     │
         │    └─ Update CalendarEvent          │
         │       (title, startAt, endAt)       │
         │                                     │
         │  cancelSession()                    │
         │    ├─ ADMIN: hard-delete + cascade  │
         │    └─ INSTRUCTOR: delete            │
         │       CalendarEvent + set endedAt   │
         └────────────────┬────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │   LiveSession    │    │  CalendarEvent   │
    │   (PostgreSQL)   │    │  (PostgreSQL)    │
    │                  │    │                  │
    │  scheduledAt     │    │  msEventId (uniq)│
    │  scheduledEndAt  │◄──┼── sessionId      │
    │  endedAt         │    │  title           │
    │  title           │    │  startAt         │
    │  batchId         │    │  endAt           │
    │  joinUrl         │    │  joinUrl         │
    │  teamsMeetingId  │    └────────┬─────────┘
    │  createdFrom     │             │
    │  createdBy       │             │
    │  instructorId    │             │
    └────────┬─────────┘             │
             │                       │
             ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │   API Endpoints  │    │  API Endpoints   │
    │                  │    │                  │
    │  GET /api/       │    │  GET /api/       │
    │  sessions        │    │  calendar/events │
    │  (used by admin  │    │  (used by        │
    │   calendar +     │    │   student        │
    │   all role pages)│    │   calendar)      │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │   Admin Views    │    │  Student Views   │
    │                  │    │                  │
    │  /admin/sessions │    │  ?view=calendar  │
    │  /admin/calendar │    │  LiveSessionsView│
    │                  │    │  SessionSidebar  │
    └─────────────────┘    └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  Instructor Views│
    │                  │
    │  /instructor/    │
    │   sessions       │
    └─────────────────┘
```

---

## Session Status State Machine

```
                    ┌──────────┐
                    │  CREATED │
                    └────┬─────┘
                         │ scheduledAt > now
                         ▼
                    ┌──────────┐
              ┌────▶│ UPCOMING │◀────┐
              │     └────┬─────┘     │
              │          │ scheduledAt <= now
              │          ▼           │
              │     ┌──────────┐     │
              │     │   LIVE   │─────┤
              │     └────┬─────┘     │
              │          │ endedAt < now OR canceled
              │          ▼           │
              │     ┌──────────┐     │
              └─────│   PAST   │─────┘
                    └──────────┘

  Status determined by client-side logic:
  - LIVE:     scheduledAt <= now && (!endedAt || endedAt >= now)
  - UPCOMING: scheduledAt > now
  - PAST:     endedAt < now (or explicitly canceled)

  endedAt serves dual purpose:
  - Before cancel: holds scheduled end time
  - After cancel:  holds cancel timestamp (scheduledEndAt preserves original)
```

---

## Fixes Applied

| Fix | What                                                                     | Why                                                             |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| A   | Admin calendar reads `endedAt` instead of undefined `endDateTime`        | Events always showed 1hr duration                               |
| B   | Session updates sync title + dates to both LiveSession and CalendarEvent | Edits were invisible to student calendar                        |
| C   | Instructor cancel deletes CalendarEvent                                  | Canceled sessions kept appearing                                |
| D   | Added `scheduledEndAt` to LiveSession                                    | `endedAt` conflicted between scheduled end and cancel timestamp |
| E   | Sidebar Calendar link → `/student?view=calendar`                         | Link 404ed, no route existed                                    |
