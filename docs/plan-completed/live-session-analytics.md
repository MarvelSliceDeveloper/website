# Plan: Live Session Analytics — COMPLETED (2026-07-31)

## Goal

Show per-session and cross-session engagement data: how many students joined, how long they stayed, peak concurrency, and attendance rate — for a single session and across multiple sessions (batch/course view).

## Status: Done

All implementation steps below were completed. Deviations from the original plan are noted inline.

## What Was Implemented

### 1. Schema changes (`apps/api/prisma/schema.prisma`)

```prisma
model Attendance {
  id               String    @id @default(cuid())
  userId           String
  sessionId        String
  joinedAt         DateTime  @default(now())
  leftAt           DateTime?
  durationSeconds  Int?
  rejoinCount      Int       @default(0)   // new — disconnect/reconnect counter
  lastSeenAt       DateTime?               // new — heartbeat timestamp (in-memory fallback store)
  qualified        Boolean   @default(false) // new — met attendance policy
}
```

Applied via `prisma db push` (repo convention, no migration files). DB confirmed in sync.

### 2. Presence service (`apps/api/src/services/presence.service.ts`)

- **Deviation:** Redis presence store (`ioredis` + `SET ... EX 90` + `SCARD`) was **NOT** added — constraint: no new dependencies. Implemented the in-memory `Map<string, number>` (userId → lastSeen timestamp) fallback only. Redis swap documented for later.
- `markPresent(sessionId, userId)`, `liveCount(sessionId)` (Map entries younger than 90s), `getAllPresent(sessionId)` (for peak tracking)
- Graceful: never throws — presence failures must not break the join/leave flow

### 3. Attendance service upgrades (`apps/api/src/modules/attendance/attendance.service.ts`)

- **`joinSession`**: existing open record (no `leftAt`) → idempotent no-op; closed record → reopen + `rejoinCount += 1`; else create. Also `markPresent()`
- **`leaveSession`**: recompute `durationSeconds` from `joinedAt`→`leftAt` (full window, not per-visit), set `qualified` per policy (≥50% of actual session duration; uses `endedAt` when session ended early), delete presence key
- **`heartbeat(userId, sessionId)`** — new: update `lastSeenAt` + `markPresent()`
- **`getSessionStats`** — new: `{ uniqueAttendees, liveNow, peakConcurrent, avgDurationSeconds, qualifiedCount, lateJoins, earlyLeaves, attendanceRate, totalWatchMinutes }` (attendanceRate = qualifiedCount / batch enrollment count)
- **`listForSession`** — ordered attendee list with user info

### 4. API endpoints (`apps/api/src/modules/attendance/attendance.routes.ts`)

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| `POST` | `/api/attendance/:sessionId/join` | user | join (existing) |
| `POST` | `/api/attendance/:sessionId/leave` | user | leave (existing) |
| `POST` | `/api/attendance/:sessionId/heartbeat` | user | presence ping (called every ~45s from session page) |
| `GET` | `/api/attendance/:sessionId/stats` | ADMIN/INSTRUCTOR | session engagement stats |
| `GET` | `/api/attendance/:sessionId` | ADMIN/INSTRUCTOR | attendee list |

**Deviation:** the planned `GET /api/admin/sessions/stats?batchId&courseId&from&to` cross-session endpoint was not added as a separate route. Cross-session aggregates ride on `GET /api/sessions` (see `listSessions` below), which the admin list page consumes directly.

### 5. Sessions service (`apps/api/src/modules/sessions/session.service.ts`)

- `listSessions` now returns per-session `_count.attendance` + `attendance._avg.durationSeconds`
- Prisma v5 does **not** support relation-level `_avg` inside `include` → computed via a separate `attendance.groupBy({ by: ["sessionId"], _avg: { durationSeconds: true } })` query joined by a `Map` (see code comment in `session.service.ts`)

### 6. Reconcile job (`apps/api/src/jobs/reconcile-attendance.job.ts`)

- Finds sessions ended > 30 min ago with still-open attendance rows; closes them (`leftAt = endedAt`, computes duration + qualified)
- Started in `apps/api/src/index.ts`

### 7. Frontend

- **`apps/web/src/hooks/use-live-session-presence.ts`** (new) — `useLiveSessionPresence()` returns `{ start, stop }`; pings `/api/attendance/:id/heartbeat` every 45s while a session is active; interval auto-cleared on unmount; fire-and-forget (failed pings never surface)
- **Student join sites** — hook wired into all 4: `LiveSessionsView`, `HomeView`, `CourseContentView`, `BatchDetailView` (`start` called after a successful join)
- **Admin list** (`apps/web/src/app/admin/sessions/page.tsx`) — Attendees + Avg Duration columns from `_count.attendance` / `attendance._avg.durationSeconds`
- **Admin detail** (`apps/web/src/app/admin/sessions/[sessionId]/page.tsx`) — stats tiles (Unique Attendees, Live Now, Peak Concurrent, Avg Duration, Attendance Rate, Qualified Count) + attendance table with `durationSeconds`, qualified badge, `rejoinCount`

### 8. Bug fix (assignment review, per user request)

- `apps/api/src/modules/admin/assignments/review.routes.ts` — `fileUrl: item.fileUrl` → `fileUrl: item.answerFileUrl` (schema field is `answerFileUrl`; the old mapping always returned `undefined`). Verified via curl.

## Verification

- `prisma db push` — database already in sync
- Unit tests — **15/15 pass** (`apps/api/src/__tests__/services/attendance.service.test.ts`): join 404/403/idempotent/reopen+`rejoinCount`, leave 400/qualified thresholds/`endedAt`, heartbeat, stats aggregation, list ordering
- Typecheck — all changed files clean (pre-existing errors in unrelated files: certificate test files, `admin/instructors/page.tsx`, `RichEditor.tsx`, etc.)
- Build — API `tsup` build passes (exit 0); web `next build` blocked by the same pre-existing type errors (none in changed files)
- LSP diagnostics — zero findings on all changed files
- Manual curl E2E — session created; student join → heartbeat → leave → rejoin (`rejoinCount` 1); stats endpoint returned correct aggregates; `GET /api/sessions` returned `_count.attendance` + `attendance._avg.durationSeconds`; review queue returned populated `fileUrl`. All test data cleaned up afterward.

## Notes

- LMS presence ≠ Teams presence (Teams live participant counts not exposed via Graph in real time)
- `peakConcurrent` is approximated from the in-memory presence map peak observed during the session — acceptable for single-instance; revisit with Redis
- Out of scope (future): `AttendanceEvent` log table, MS Graph participant report sync, `SessionStat` snapshot table, Redis presence store
