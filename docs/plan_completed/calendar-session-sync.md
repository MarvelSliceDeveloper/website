# Plan: Calendar ↔ Sessions Sync Fixes

## Status
✅ Plan Completed — all fixes A–E implemented.

---

## Fix A — Admin calendar uses wrong field name

**File:** `apps/web/src/app/admin/calendar/page.tsx:67`

**Problem:** Code reads `s.endDateTime` but API returns `endedAt`. Every event falls back to `start + 1hr`.

**Change:** `s.endDateTime` → `s.endedAt`

---

## Fix B — Session title not synced to CalendarEvent on update

**File:** `apps/api/src/modules/sessions/session.service.ts:241-259`

**Problem:** `updateSession` only syncs `startAt`/`endAt` to CalendarEvent. Title changes and LiveSession's own `endedAt` are missed.

**Changes:**
1. Add `data.title` to `updateData` (LiveSession title update)
2. Add `data.endDateTime` → `endedAt` to `updateData` (LiveSession end sync)
3. Sync title + dates to CalendarEvent whenever they change

---

## Fix C — Instructor soft-cancel leaves stale CalendarEvent

**File:** `apps/api/src/modules/sessions/session.service.ts:295-298`

**Problem:** Instructor cancel sets `endedAt = new Date()` on LiveSession but never removes the CalendarEvent.

**Change:** Add `calendarEvent.deleteMany({ where: { sessionId } })` before the LiveSession update.

---

## Fix D — `endedAt` has dual conflicting meaning

**File:** `apps/api/prisma/schema.prisma:158` + `session.service.ts`

**Problem:** `endedAt` is used for both scheduled end time (on create) and cancel timestamp (on cancel). These overwrite each other.

**Change:** Add `scheduledEndAt DateTime` field to LiveSession. On create: set both `scheduledEndAt` and `endedAt` to `endDateTime`. On update: update both when `endDateTime` changes. On cancel: only set `endedAt`.

---

## Fix E — `/student/calendar` sidebar link 404s

**File:** `apps/web/src/components/Sidebar.tsx:34`

**Problem:** Sidebar links to `/student/calendar` but no page exists. Student calendar is rendered via SPA view stack on `/student`.

**Change:** Use `?view=calendar` query param. On `/student` page mount, check query param and auto-navigate to Calendar view. Sidebar link becomes `"/student?view=calendar"`.
