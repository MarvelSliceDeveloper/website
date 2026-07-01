# Microsoft 365 Integration — Full Feature Roadmap

**Date:** 2026-06-16  
**Status:** Planning  
**Current State:** Teams meeting creation (with broken fallback), recording sync, calendar read-only skeleton

---

## Overview

This document catalogs every Microsoft 365 integration opportunity for this LMS, ordered by impact-to-effort ratio. Each feature includes its Graph API surface, required permissions, implementation phases, and rationale.

---

## Phase 1: Fix the Silent Fallback (Quick Win)

**Problem:** `session.service.ts:84` catches Graph errors and generates a fake `https://teams.microsoft.com/l/meetup-join/fallback-{Date.now()}` URL — no frontend feedback, admins schedule sessions thinking they got real Teams links.

### Changes

| Area | Change |
|------|--------|
| `session.service.ts` | After catch, save `teamsMeetingId = 'error-{timestamp}'` and `joinUrl = ''` (empty) instead of fake URL |
| `POST /api/sessions` response | Add `teamsStatus: 'ok' \| 'error' \| 'custom'` and `teamsError?: string` fields |
| Session creation form | Show inline warning banner when `teamsStatus === 'error'`, with the error message and a fallback URL field |
| Admin Sessions list | Show a red badge "Teams Unavailable" on sessions with no real join URL, allow post-hoc editing |

### Relevant files

- `apps/api/src/modules/sessions/session.service.ts:84-89`
- `apps/web/src/app/admin/sessions/new/page.tsx:345-412`
- `apps/web/src/app/admin/sessions/page.tsx`
- `apps/web/src/app/instructor/sessions/page.tsx`

### Effort: 1–2 days

---

## Phase 2: Teams Meeting Attendance Reports

**API:** `GET /me/onlineMeetings/{meetingId}/attendanceReports` and `GET .../attendanceRecords`  
**Docs:** https://learn.microsoft.com/en-us/graph/api/meetingattendancereport-list  
**Permission:** `OnlineMeetingArtifact.Read.All` (delegated, admin consent)

### What it enables

After a meeting ends, Teams generates an attendance report containing:
- Each participant's name, email, and duration
- Join/leave timestamps
- Whether the person was the organizer

**In the LMS, this means:**
- Auto-mark student attendance for live sessions (no manual roll-call)
- Instructor dashboard shows which students stayed for the full session vs. dropped early
- Admin analytics: average attendance rates per batch/course

### Implementation

| Step | Description |
|------|-------------|
| DB | New `MeetingAttendance` model: `id, sessionId, userId?, attendeeEmail, displayName, joinDateTime, leaveDateTime, duration, isOrganizer` |
| Backend | New `graph.attendance.ts` module + `POST /api/sessions/:id/sync-attendance` endpoint |
| Job | Extend the existing `recording-sync.job.ts` (or create `attendance-sync.job.ts`) to poll for attendance reports after session end |
| UI | Attendance tab in session detail view, export to CSV |

### Effort: 3–5 days

---

## Phase 3: Outlook Email Notifications

**API:** `POST /me/sendMail`  
**Docs:** https://learn.microsoft.com/en-us/graph/api/user-sendmail  
**Permission:** `Mail.Send` (delegated)

### What it enables

Send automated emails via the admin's Outlook account:
- **Session reminder** — email all enrolled students 1 hour before a live session
- **Assignment posted** — email batch when new assignment is created
- **Recording available** — email when recording is synced
- **Certificate issued** — email student when certificate is generated

### Implementation

| Step | Description |
|------|-------------|
| Backend | New `graph.mail.ts` module with `sendMail(fromUserId, to, subject, body)` helper |
| Service | New `notification-email.service.ts` — checks if sender has linked MS account, falls back to SMTP if not |
| Templates | HTML email templates for each notification type using the LMS brand |
| Scheduling | Use existing notification triggers: session creation, recording sync, assignment grading, etc. |

### Effort: 4–6 days

---

## Phase 4: Two-Way Calendar Sync

**Current state:** One-way sync (`getCalendarView`) exists but is unused in any auto-flow.

### What it enables

- **LMS → Outlook:** When an admin schedules a session, auto-create an Outlook calendar event with the Teams join link (this is `createCalendarEvent()` — already implemented, never called)
- **Outlook → LMS:** Keep syncing outlook events to show in the admin calendar view alongside LMS sessions
- **Student calendar feed:** Give students a read-only view of their sessions in Outlook

### Changes

| Step | Description |
|------|-------------|
| `session.service.ts` | After `createOnlineMeeting`, call `createCalendarEvent()` to put it on the admin's calendar |
| Batch view toggle | "Also create Outlook events for all students" option when scheduling |
| API | `POST /api/calendar/sync` triggered on session create/update (already exists but needs wiring) |

### Graph endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/me/calendarView?startDateTime=&endDateTime=` | GET | Fetch existing events |
| `/me/events` | POST | Create event with Teams meeting link |
| `/me/events/{id}` | PATCH | Update event when session rescheduled |
| `/me/events/{id}` | DELETE | Delete event when session cancelled |

### Effort: 2–3 days

---

## Phase 5: Teams Presence / Instructor Availability

**API:** `GET /communications/presences/{id}` and subscription via change notifications  
**Docs:** https://learn.microsoft.com/en-us/graph/api/resources/presence  
**Permission:** `Presence.Read.All` (application) or delegated

### What it enables

- Show a green/red/yellow dot next to instructor names in the UI (Available, Busy, In a Meeting, Offline)
- Student portal: "Your instructor is online now — ask a question" indicator
- Admin dashboard: see which instructors are currently teaching (In a Meeting → likely in a live session)

### Implementation

| Step | Description |
|------|-------------|
| Backend | `graph.presence.ts` — `getPresence(userId)` and `getPresencesForUsers(userIds[])` |
| API | `GET /api/presence?userIds=...` returns `{ userId, availability, activity }` |
| UI | Small presence dot component, used in instructor cards, batch detail, mentorship page |
| Subscription | Webhook subscription for real-time updates (optional v2) |

### Limitations

- Only works for users with Teams license + presence enabled
- Max 650 users per bulk query
- Subscription max 1 hour expiry, needs renewal

### Effort: 3–4 days

---

## Phase 6: SharePoint / OneDrive Course Materials Storage

**API:** `PUT /me/drive/root:/{path}:/content` (small files) or `createUploadSession` (large files)  
**Docs:** https://learn.microsoft.com/en-us/graph/api/driveitem-put-content  
**Permission:** `Files.ReadWrite` (delegated)

### What it enables

Instead of uploading course materials (PDFs, slides, videos) to the LMS server's local filesystem, store them in SharePoint/OneDrive:
- Better storage limits (1TB+ per user)
- Students can open files directly in Office Online
- Version history, co-authoring for instructors
- No need to manage file storage infrastructure

### Implementation

| Step | Description |
|------|-------------|
| Backend | `graph.files.ts` — `uploadFile(userId, folderPath, fileName, buffer)`, `getFileUrl(userId, itemId)` |
| DB | Add `fileProvider` enum to `Material` model: `LOCAL \| ONEDRIVE \| SHAREPOINT` |
| Upload | When admin uploads course material, async upload to OneDrive then save the share link |
| Migration | Option to migrate existing local files to OneDrive |

### Effort: 5–7 days

---

## Phase 7: Viva Learning Content Sync (High Impact)

**API:** Employee Learning API (`/employeeExperience/learningProviders/...`)  
**Docs:** https://learn.microsoft.com/en-us/graph/api/resources/viva-learning-api-overview  
**Permissions:** `LearningContent.ReadWrite.All`, `LearningAssignedCourse.ReadWrite.All` (application)

### What it enables

Push your LMS courses and learner records into **Microsoft Viva Learning** — the learning hub inside Microsoft Teams. Students can discover, assign, and track LMS courses without leaving Teams.

### Graph resources

| Resource | Purpose |
|----------|---------|
| `learningProvider` | Register the LMS as a content provider in Viva Learning |
| `learningContent` | Push course metadata (title, description, thumbnail, duration, URL) |
| `learningCourseActivity` (assigned) | Sync assignments — "Student X was assigned Course Y with due date Z" |
| `learningCourseActivity` (self-initiated) | Track completions — "Student X completed Course Y on this date" |

### Implementation Phases

**Phase A — Content Catalog (1 week)**

| Step | Description |
|------|-------------|
| Register provider | `POST /employeeExperience/learningProviders` — returns `registrationId` |
| Seed content | `PATCH /employeeExperience/learningProviders/{id}/learningContents/{externalId}` — push all published courses |
| Sync job | Recurring job that pushes new/updated courses to Viva Learning |

**Phase B — Learner Records (1 week)**

| Step | Description |
|------|-------------|
| Assignments | When admin assigns course to batch → `POST .../learningCourseActivities` with `@odata.type: learningAssignment` |
| Completions | When student completes all sessions → `POST .../learningCourseActivities` with status `completed` |
| Progress | Update `completionPercentage` as student progresses through course modules |

### Permissions required

All application-level (admin consent):
- `LearningContent.ReadWrite.All`
- `LearningAssignedCourse.ReadWrite.All`
- `LearningSelfInitiatedCourse.ReadWrite.All`

### Effort: 2–3 weeks

---

## Phase 8: Azure AD User Provisioning (Directory Sync)

**API:** `GET /users`, `GET /groups`, `GET /groups/{id}/members`  
**Docs:** https://learn.microsoft.com/en-us/graph/api/user-list  
**Permissions:** `User.Read.All`, `Group.Read.All` (application)

### What it enables

- Admin clicks "Sync from Azure AD" → imports users from the organization's directory
- Auto-create LMS accounts for users with specific group membership (e.g., "LMS Students" group)
- Map Azure AD groups to LMS batches/courses
- Keep user profile data in sync (name, email, photo)

### Implementation

| Step | Description |
|------|-------------|
| DB | Add `azureId` and `lastSyncedAt` to `User` model |
| Backend | `graph.directory.ts` — list users, list group members, get user profile |
| API | `POST /api/admin/directory/sync` — dry-run and execute modes |
| UI | Admin panel: mapping table (Azure AD Group ↔ LMS Batch/Role), sync with progress bar |

### Important considerations

- Only works for organizations using Azure AD (not personal accounts)
- Requires `MS_TENANT_ID` to be set (not `common`)
- App-only permissions require admin consent

### Effort: 5–7 days

---

## Phase 9: Teams Chat Notifications

**API:** `GET /users/{id}/teamwork/installedApps` + App catalog management (Complex) OR simple webhook-incoming  
**Alternative approach:** Use **Incoming Webhook** in Teams channel (no Graph API, simpler)

### Approach A — Incoming Webhook (Recommended)

- Create a webhook URL per batch channel
- LMS posts rich adaptive cards to the channel when:
  - A session starts in 15 minutes
  - A new recording is available
  - An assignment is posted
- No special permissions, just stores the webhook URL

### Approach B — Graph API Bot (Advanced)

- Register a bot in Azure AD
- Install bot in tenant Teams
- Send proactive messages to users/channels
- Requires `TeamsAppInstallation.ReadWriteForUser.All`

### Effort: 2–3 days (webhook) or 2 weeks (bot)

---

## Phase 10: Education API — Microsoft Teams Assignments Sync

**API:** Education API (`/education/classes/{id}/assignments`)  
**Docs:** https://learn.microsoft.com/en-us/graph/api/resources/education-overview  
**Permissions:** `EduAssignments.ReadWrite.All` (application)

### What it enables

Two-way sync between LMS assignments and Microsoft Teams for Education assignments:
- Create assignment in LMS → appears in Teams Class Notebook
- Student submits in Teams → status reflected in LMS
- Grades synced back to Teams

### Requirements

- Microsoft 365 Education license
- School Data Sync (SDS) configured for classes/rosters
- Maps LMS `Batch` → Teams `educationClass`

### Effort: 3–4 weeks

---

## Feature Comparison Matrix

| # | Feature | Effort | User Impact | Graph Calls | New Permissions |
|---|---------|--------|-------------|-------------|-----------------|
| 1 | Fix silent fallback | 1–2d | High (fixes broken feature) | 0 | None |
| 2 | Attendance reports | 3–5d | High (auto attendance) | `GET .../attendanceReports` | `OnlineMeetingArtifact.Read.All` |
| 3 | Outlook notifications | 4–6d | Medium (email) | `POST /me/sendMail` | `Mail.Send` |
| 4 | Two-way calendar | 2–3d | Medium | `POST /me/events`, PATCH, DELETE | `Calendars.ReadWrite` (exists) |
| 5 | Presence | 3–4d | Low-Medium | `GET /communications/presences` | `Presence.Read.All` |
| 6 | SharePoint files | 5–7d | Medium (file storage) | `PUT /me/drive/...`, upload session | `Files.ReadWrite` |
| 7 | Viva Learning | 2–3w | Very High | Employee Learning API | Multiple app permissions |
| 8 | AD user sync | 5–7d | High (onboarding) | `GET /users`, `/groups` | `User.Read.All`, `Group.Read.All` |
| 9 | Teams notifications | 2d–2w | Medium | Incoming webhook or bot | None (webhook) or high (bot) |
| 10 | Education API | 3–4w | High (education only) | `/education/classes` | `EduAssignments.ReadWrite.All` |

---

## Priority Recommendation

Based on the current state of the codebase (broken fallback, unlinked MS accounts, manual recording sync), the recommended order is:

1. **Phase 1** — Fix the silent fallback (blocker for any other feature)
2. **Phase 4** — Wire up `createCalendarEvent()` in session creation (already coded, just need to call it)
3. **Phase 2** — Attendance reports (high-value, moderate effort)
4. **Phase 3** — Outlook notifications (widen notification channels)
5. **Phase 6** — SharePoint files (reduce local storage dependency)
6. **Phase 8** — AD provisioning (scale user management)
7. **Phase 7** — Viva Learning (enterprise distribution)
8. **Phase 5** — Presence (nice-to-have)
9. **Phase 9** — Teams notifications (complement to email)
10. **Phase 10** — Education API (only if education-licensed)

---

## Appendix: Graph API Permission Summary

| Permission | Type | Phases |
|------------|------|--------|
| `OnlineMeetings.ReadWrite` | Delegated | 1, 2 (existing) |
| `Calendars.ReadWrite` | Delegated | 4 (existing) |
| `User.Read` | Delegated | Auth, 8 (existing) |
| `offline_access` | Delegated | Auth (existing) |
| `OnlineMeetingRecording.Read.All` | Delegated | Recording sync (missing from scopes) |
| `OnlineMeetingArtifact.Read.All` | Delegated | 2 |
| `Mail.Send` | Delegated | 3 |
| `Files.ReadWrite` | Delegated | 6 |
| `Presence.Read.All` | Application/Delegated | 5 |
| `User.Read.All` | Application | 8 |
| `Group.Read.All` | Application | 8 |
| `LearningContent.ReadWrite.All` | Application | 7 |
| `LearningAssignedCourse.ReadWrite.All` | Application | 7 |
| `LearningSelfInitiatedCourse.ReadWrite.All` | Application | 7 |
| `EduAssignments.ReadWrite.All` | Application | 10 |

---

## Related Documentation

- [MICROSOFT_GRAPH.md](../MICROSOFT_GRAPH.md) — Technical overview of current Graph integration
- `apps/api/src/modules/graph/` — Graph module source code
- `apps/api/prisma/schema.prisma` — Database models
