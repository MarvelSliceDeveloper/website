# Phase 6 — Live Sessions

> ⏱️ **Duration**: Weeks 9–11 (3 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 4, Phase 5  
> ⚠️ **Extended from original 2 weeks → 3 weeks** (webhook debugging + ngrok setup is non-trivial)

---

## 🎯 Objective

Enable instructors to create Teams meetings from the LMS, automatically sync meetings created directly in Teams, and provide students with a seamless "Join Now" experience.

---

## ✅ Tasks

### 6.1 — Session Creation from LMS

- [ ] Create instructor session form:
  - Course selection (dropdown of instructor's courses)
  - Module selection (within selected course)
  - Title, description
  - Date, start time, end time
  - Recurrence (optional): daily, weekly, custom
- [ ] Create API endpoint: `POST /api/sessions`
  - Validate form data with Zod
  - Call Graph API: `POST /me/onlineMeetings`
    ```json
    {
      "startDateTime": "...",
      "endDateTime": "...",
      "subject": "Course Name — Session Title"
    }
    ```
  - Store in `LiveSession` table:
    - `teamsMeetingId` (from Graph response)
    - `joinUrl` (from Graph response)
    - `createdFrom: 'LMS'`
  - Also create corresponding `CalendarEvent`
- [ ] Handle errors:
  - MS Graph API failure → show user-friendly error
  - Duplicate session → prevent scheduling over existing session
  - Token expired → trigger re-auth prompt

### 6.2 — Session Management (Instructor)

- [ ] Create instructor sessions page: `/(instructor)/[tenantSlug]/panel/sessions`
  - List all sessions for instructor's courses
  - Status indicators: Scheduled, Live, Completed, Cancelled
  - Sort by date (upcoming first)
  - Filter by course, status, date range
- [ ] Session actions:
  - Edit session (update time/title) — calls `PATCH /me/onlineMeetings/{id}`
  - Cancel session — marks as cancelled, notifies enrolled students
  - Reschedule — updates time, sends notification
- [ ] Create API endpoints:
  - `GET /api/sessions?courseId=...&status=...` — list sessions
  - `PATCH /api/sessions/:id` — update session
  - `DELETE /api/sessions/:id` — cancel session
  - `GET /api/sessions/:id` — session details

### 6.3 — Webhook: Sync Meetings Created in Teams

- [ ] Create webhook endpoint: `POST /api/webhooks/events`
  - Handle MS validation request (return `validationToken` as plain text)
  - On change notification:
    1. Extract `resourceData` from notification
    2. Fetch full event details from Graph API
    3. Check if event is an online meeting (has `onlineMeeting` property)
    4. If yes: Create `LiveSession` with `createdFrom: 'TEAMS'`
    5. Create corresponding `CalendarEvent`
- [ ] Subscribe to calendar changes:
  - Resource: `/me/events`
  - Change types: `created`, `updated`, `deleted`
  - Expiry: max 4230 minutes (≈ 3 days)
  - Store subscription ID in database for renewal
- [ ] Subscription renewal job:
  - `subscriptionRenewal.job.ts` — renew all expiring subscriptions
  - Run daily, renew subscriptions expiring within 24 hours
- [ ] **🆕 Webhook reliability**:
  - Idempotency: Check if session already exists before creating
  - Deduplication: Use `msEventId` as unique key
  - Queue processing: Use Bull to process webhook notifications async
  - Dead-letter queue: Store failed notifications for manual review

### 6.4 — ngrok Setup for Local Webhook Testing

- [ ] Document ngrok setup:
  ```bash
  ngrok http 4000
  # Use the generated URL as webhook notification URL
  # Example: https://abc123.ngrok.io/api/webhooks/events
  ```
- [ ] Create helper script to update webhook subscription URL when ngrok URL changes
- [ ] **🆕 Alternative**: Document use of VS Code dev tunnels as ngrok alternative

### 6.5 — Student Join Experience

- [ ] Create live session page: `/(tenant)/[tenantSlug]/live/[meetingId]`
  - Display: session title, course, instructor, scheduled time
  - Large "Join Meeting" button (opens Teams meeting URL)
  - Show "Session is Live" with pulsing indicator during active session
  - Show "Session hasn't started yet" with countdown before start time
  - Show "Session has ended" with link to recording (if available)
- [ ] Student dashboard integration:
  - "Upcoming Live Sessions" section on dashboard
  - Shows next 5 sessions across all enrolled courses
  - "Live Now" badge on active sessions
  - One-click join from dashboard

### 6.6 — 🆕 Session Attendance Tracking

- [ ] Track which students joined a live session:
  - Create `Attendance` table: id, sessionId, userId, joinedAt, leftAt
  - After session ends, fetch attendance from Graph API:
    - `GET /communications/callRecords/{id}/sessions/{sessionId}/participants`
  - Match MS user IDs to local users
- [ ] Create API endpoint: `GET /api/sessions/:id/attendance`
- [ ] Show attendance report to instructor:
  - Who attended, duration, join/leave times
  - Attendance percentage per student

### 6.7 — 🆕 Session Email Notifications

- [ ] Send email to enrolled students when:
  - New session is scheduled → "New live session: [Title] on [Date]"
  - Session is about to start (30 min before) → reminder email
  - Session is cancelled → cancellation notice
  - Session is rescheduled → updated time notice
- [ ] Use email template system (React Email or similar)
- [ ] Allow students to unsubscribe from session emails

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Session creation form | Instructor creates meeting, appears in Teams |
| Session management page | List, edit, cancel sessions |
| Webhook for Teams-created meetings | Meeting in Teams auto-appears in LMS |
| Webhook subscription renewal | Subscriptions auto-renew before expiry |
| Student join page | Student can join live session via URL |
| Attendance tracking | Instructor sees who attended |
| Session notifications | Students receive email reminders |
| ngrok documentation | Dev can test webhooks locally |

---

## 🧪 Tests to Write

- [ ] Unit: Session creation validates required fields
- [ ] Unit: Webhook payload parsing handles all change types
- [ ] Unit: Idempotency prevents duplicate session creation
- [ ] Integration: Session creation calls Graph API and stores result
- [ ] Integration: Webhook processes notification and creates session
- [ ] Integration: Subscription renewal extends expiry
- [ ] Integration: Attendance records created from Graph data
- [ ] E2E: Instructor creates session → student sees it on dashboard → joins
- [ ] E2E: Session created in Teams → appears in LMS within 1 minute

