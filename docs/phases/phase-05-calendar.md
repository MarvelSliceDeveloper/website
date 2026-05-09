# Phase 5 — Calendar Sync & UI

> ⏱️ **Duration**: Weeks 7–8 (2 weeks)  
> 📌 **Status**: 🔄 In Progress  
> 🔗 **Depends on**: Phase 4

---

## 🎯 Objective

Sync Microsoft Calendar events into the LMS database and build a calendar UI with monthly/weekly views and a "Live Now" badge for active sessions.

---

## ✅ Tasks

### 5.1 — Calendar Sync Backend

- [ ] Create calendar sync service:
  - `syncCalendarForUser(userId, startDate, endDate)`
  - Calls `GET /me/calendarView?startDateTime=...&endDateTime=...`
  - Upserts events into `CalendarEvent` table (match by `msEventId`)
  - Handle deleted events (mark as deleted or remove)
- [ ] Create background sync job: `calendarSync.job.ts`
  - Runs every 15 minutes per active platform
  - Syncs next 30 days of events for all users with MS tokens
  - Uses Bull queue for parallel processing per platform
  - **🆕 Retry policy**: 3 retries with exponential backoff, dead-letter after failure
- [ ] Create API endpoints:
  - `GET /api/calendar/events?start=...&end=...` — fetch events for current user
  - `GET /api/calendar/events/today` — today's events with live status
  - `GET /api/calendar/live` — currently active sessions only
- [ ] Link calendar events to LiveSessions:
  - When syncing, check if event matches an existing LiveSession (by teamsMeetingId)
  - If matched, populate `sessionId` on CalendarEvent

### 5.2 — Graph Webhook for Real-Time Sync (Production)

- [ ] Create webhook endpoint: `POST /api/webhooks/calendar`
  - Handle MS validation request (return `validationToken`)
  - On change notification: queue calendar re-sync for affected user
- [ ] Create subscription management:
  - `POST /api/calendar/subscribe` — create Graph webhook on `/me/events`
  - Webhook expiry: max 3 days (MS limit) → auto-renew via Bull job
  - `subscriptionRenewal.job.ts` — renew all expiring subscriptions daily
- [ ] **🆕 Webhook security**:
  - Validate `clientState` token on incoming notifications
  - Verify notification came from Microsoft (check certificate)
  - Rate-limit webhook endpoint

### 5.3 — "Live Now" Badge Logic

- [ ] Create helper function: `isSessionLive(startAt, endAt)`
  - Returns true if `now` is between `startAt` and `endAt`
  - Add 15-min buffer after `endAt` (sessions often run over)
- [ ] Create API endpoint: `GET /api/sessions/live`
  - Returns currently active sessions for the user's platform
  - Used by dashboard and calendar for real-time badge updates
- [ ] Frontend: Create `LiveBadge` component
  - Pulsing green dot animation
  - "Live Now" text
  - Auto-refreshes every 30 seconds (polling or SSE)

### 5.4 — Calendar UI Page

- [ ] Build calendar page at `/calendar`
- [ ] Implement **monthly view**:
  - Grid of days, events shown as colored pills
  - Click day → expand to see event details
  - Color-coding: live sessions (green), recordings available (blue), upcoming (gray)
- [ ] Implement **weekly view**:
  - Time-slot grid (8am–10pm)
  - Events as blocks with duration proportional to time
  - Drag to navigate weeks
- [ ] Implement **daily view** (agenda):
  - Chronological list of events
  - Shows: title, time, instructor, course, join button (if live)
- [ ] Event detail popover:
  - Title, description, instructor
  - Start/end time
  - Course link (if linked to a course)
  - "Join Meeting" button (if live)
  - "Watch Recording" link (if recording available)
- [ ] **🆕 Mobile responsive**:
  - Single column layout on mobile
  - Swipe to change week/month
  - Touch-friendly event interactions

### 5.5 — 🆕 Calendar Notifications

- [ ] In-app notification 10 minutes before session starts
- [ ] Browser push notification (with user opt-in)
- [ ] Add notification preferences to user settings:
  - Email reminder: 30 min / 1 hr / 1 day before
  - Push notification: 10 min before
  - In-app: always

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Calendar sync from MS | Events appear in DB after sync |
| Background sync job | Events auto-refresh every 15 min |
| Calendar webhook (real-time) | Changes in MS Calendar reflect within seconds |
| Calendar UI (monthly/weekly/daily) | All three views render correctly |
| "Live Now" badge | Green badge on active sessions |
| Event detail popover | Shows full event info + actions |
| Calendar notifications | User notified before sessions |

---

## 🧪 Tests to Write

- [ ] Unit: `isSessionLive()` correctly identifies live/not-live sessions
- [ ] Unit: Calendar event upsert handles create/update/delete
- [ ] Integration: Calendar sync job fetches and stores events
- [ ] Integration: Webhook endpoint validates MS notification
- [ ] Integration: Live sessions endpoint returns only active sessions
- [ ] E2E: User views calendar, sees events, clicks to view details
- [ ] E2E: "Live Now" badge appears during active session

