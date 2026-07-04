# Plan: Live Session Logic Fixes

## Status

✅ Plan Completed — all 15 issues identified and fixed.

---

## Fix #1 — `endedAt` set to `scheduledEndAt` at session creation (CRITICAL)

**Files:** `apps/api/src/modules/sessions/session.service.ts:103`

**Problem:** `endedAt` was set to `new Date(endDateTime)` immediately at session creation, conflating "scheduled end" with "actual end". This caused cascading issues with status filtering, recording sync, and cancellation detection.

**Change:** Set `endedAt: null` at creation. Session hasn't ended yet. Only set `endedAt` when explicitly cancelled/ended.

---

## Fix #2 — `instructorId` computed but never stored (CRITICAL)

**Files:** `apps/api/src/modules/sessions/session.service.ts:90-106`

**Problem:** `finalInstructorId` was computed from `instructorOverride` / `batch.instructorId` but never included in the `prisma.liveSession.create()` data. The `instructorOverride` feature and the `@relation("SessionInstructor")` were completely non-functional.

**Change:** Added `instructorId: finalInstructorId` to the `create()` data.

---

## Fix #3 — LiveSession model missing `title` field (CRITICAL)

**Files:**

- `apps/api/prisma/schema.prisma:155`
- `apps/web/src/app/student/page.tsx:153`
- `apps/web/src/app/admin/sessions/page.tsx:13`

**Problem:** The `LiveSession` Prisma model had no `title` column. The `CreateSessionSchema` required a `title`, and it was used in CalendarEvent + Teams meeting subject, but never stored on the session itself. The frontend had to reconstruct titles from module/batch names. Also, the frontend used `endDateTime` in API response mappings but Prisma returns `scheduledEndAt`.

**Changes:**

1. Added `title String` to the `LiveSession` Prisma model
2. Store `title` in `sessionService.createSession()` and `createSessionFromTeams()`
3. Frontend `student/page.tsx`: use `s.scheduledEndAt` instead of `s.endDateTime` in API mapping
4. Frontend `admin/sessions/page.tsx`: use `scheduledEndAt` instead of `endDateTime` in Session type and filters

---

## Fix #4 — Overlap detection is incomplete (HIGH)

**Files:** `apps/api/src/modules/sessions/session.service.ts:48-57`

**Problem:** The old query only found sessions whose `scheduledAt` fell within the new session's window, missing overlaps where the existing session starts before the new one but ends after it starts.

**Change:** Replaced with proper standard overlap formula:

```
existing scheduledAt < new end AND existing scheduledEndAt > new start
```

---

## Fix #5 — Teams webhook sessions had zero duration (HIGH)

**Files:**

- `apps/api/src/modules/sessions/session.service.ts:330-341`
- `apps/api/src/modules/sessions/events-webhook.controller.ts:106`

**Problem:** `createSessionFromTeams` set `scheduledEndAt` equal to `scheduledAt` (zero duration). The events webhook had the end time available from Graph API but wasn't passing it through.

**Changes:**

1. Added `scheduledEndAt?: Date` parameter to `createSessionFromTeams`
2. Events webhook now extracts and passes `event.end.dateTime + 'Z'` as `scheduledEndAt`

---

## Fix #6 — Recording sync job finds too many sessions (HIGH)

**Files:** `apps/api/src/jobs/recording-sync.job.ts:24-27`

**Problem:** The query used `OR: [endedAt: { not: null }, scheduledAt: { lte: cutoffTime }]`. Since `endedAt` was always set (Fix #1), every session matched the first condition, causing the job to attempt recording sync for future sessions.

**Change:** Changed to `OR: [endedAt: { not: null }, scheduledEndAt: { lte: cutoffTime }]`. Now only sessions that were explicitly ended OR whose scheduled end was at least 90 minutes ago are eligible.

---

## Fix #7 — `isSessionLive` doesn't consider `endedAt` (MEDIUM)

**Files:** `apps/api/src/modules/calendar/calendar.service.ts:23-27`

**Problem:** The function only checked `startAt` and `endAt` from CalendarEvent. A cancelled session (with `endedAt` set) would still appear as "live" within the time window.

**Change:** Added optional `sessionEndedAt?: Date | null` parameter. If non-null, the session is immediately considered not live.

---

## Fix #8 — `getLiveSessions` queries CalendarEvent, not LiveSession (MEDIUM)

**Files:** `apps/api/src/modules/calendar/calendar.service.ts:156-181`

**Problem:** Queried CalendarEvent with start/end filters and re-filtered with `isSessionLive`. This could return events without actual LiveSessions and missed cancellation state.

**Change:** Rewrote to query `LiveSession` directly with:

- `scheduledAt <= now`
- `endedAt = null`
- `scheduledEndAt + buffer >= now`

Includes batch, module, and calendarEvent in the response.

---

## Fix #9 — `updateSession` resets `endedAt` when changing end time (MEDIUM)

**Files:** `apps/api/src/modules/sessions/session.service.ts:246-248`

**Problem:** Changing `endDateTime` also set `endedAt` to the new end time, conflating scheduled end with actual end.

**Change:** Removed `endedAt` from the update data when only `endDateTime` changes.

---

## Fix #9b — Events webhook update path also set `endedAt` incorrectly (MEDIUM)

**File:** `apps/api/src/modules/sessions/events-webhook.controller.ts:119-127`

**Problem:** When a Teams event was updated via webhook, the handler set `endedAt` to the event's end time — same bug as Fix #1/#9 but in the webhook code path.

**Change:** Changed to update `scheduledEndAt` instead of `endedAt`. Kept the `handleEventDeleted` path (which correctly sets `endedAt: new Date()` when a meeting is actually deleted in Teams).

---

## Fix #10 — Frontend records attendance before actual join (MEDIUM)

**Note:** This was reviewed and determined to be an **intentional design choice**. The Attendance model comment states: "logged when a student clicks 'Join Now'". No change needed.

---

## Fix #11 — `useComputedStatus` hook has no `endDateTime` fallback (LOW)

**Files:** `apps/web/src/lib/use-session-status.ts:11`

**Problem:** If `endDateTime` was `undefined`, `new Date(undefined)` returned `NaN`, and the session silently defaulted to "UPCOMING".

**Change:** Added the same fallback logic as `LiveSessionsView.getComputedStatus()` — if no valid end time, assume 1-hour duration from start.

---

## Fix #12 — No validation that `startDateTime < endDateTime` (LOW)

**Files:** `apps/api/src/modules/sessions/session.service.ts:16-17`

**Problem:** Zod schema allowed creating sessions that end before they start.

**Change:** Added `.refine()` to `CreateSessionSchema` validating `startDateTime` is before `endDateTime`.

---

## Fix #13 — `listSessions` has no pagination (LOW)

**Files:**

- `apps/api/src/modules/sessions/session.service.ts:129-207`
- `apps/api/src/modules/sessions/session.controller.ts:43-48`

**Problem:** All sessions returned at once — no `skip`/`take`.

**Change:** Added optional `page` and `limit` query parameters with defaults (page=1, limit=50). Implemented Prisma `skip` and `take`.

---

## Fix #14 — `createdFrom` comment outdated (LOW)

**Files:** `apps/api/prisma/schema.prisma:160`

**Problem:** Schema comment said `// LMS, TEAMS` but code also uses `'LMS_CUSTOM'`.

**Change:** Updated to `// LMS, LMS_CUSTOM, TEAMS`.

---

## Fix #15 — Notification fires before ownership check in `cancelSession` (LOW)

**Files:** `apps/api/src/modules/sessions/session.service.ts:286-308`

**Problem:** `notifySessionCancelled` was called at line 286, before the instructor ownership check at line 299. A non-owner instructor could trigger the notification before the error was thrown.

**Change:** Moved the notification call after the authorization check. Also added `.catch()` handler so notification failure doesn't block cancellation.

---

## Verification

- ✅ API typecheck passes (only pre-existing `InputJsonValue` error in notification.service.ts)
- ✅ Web typecheck passes (no errors)
- ✅ Prisma generates successfully with updated schema
- ✅ All 15 issues addressed (14 fixed, 1 confirmed as intentional design)
