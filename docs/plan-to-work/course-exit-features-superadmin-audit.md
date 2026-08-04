# Plan: Course Display, Exit Features, Live Classes & Super Admin Updates

## Audit Summary

Conducted a full audit across 4 areas: student dashboard course display, exit/completion features, live classes, and super admin pages.

---

## PHASE 1: Critical Bug Fixes (Immediate)

### 1.1 HomeView Thumbnail Rendering Bug (HIGH)

**File:** `apps/web/src/app/student/_views/HomeView.tsx`
**Issue:** Course thumbnails are rendered as `{c.thumbnail}` (plain text) inside `<div>`. When the backend sends a URL, users see raw URL text instead of an image.
**Fix:** Adopt the same `<Image>` pattern from `CoursesView.tsx` — check if value starts with `/` or `http`, render `<Image>` if so, otherwise render emoji fallback.

### 1.2 Certificate Route Mismatch (HIGH)

**File:** `apps/web/src/app/student/certificates/page.tsx`
**Issue:** Frontend calls `GET /api/certificates/my` but backend route is `GET /api/certificates/`. Certificates page will 404.
**Fix:** Change frontend to call `GET /api/certificates/` or add `/my` route to backend.

### 1.3 Certificate `earned` Field Missing (HIGH)

**File:** `apps/web/src/app/student/page.tsx`
**Issue:** `certs.certificates` from API lacks `earned` field, but frontend filters by `c.earned`. Dashboard `certificatesCount` is always 0.
**Fix:** Add `earned: true` to each certificate in the API response, or change frontend to count issued certificates differently.

### 1.4 Attendance Not Logged from CourseContentView (MEDIUM)

**File:** `apps/web/src/app/student/_views/CourseContentView.tsx`
**Issue:** The "Join" button for live sessions in the sidebar is a plain `<a href>` — does NOT call `POST /api/attendance/:sessionId/join`. Students joining from sidebar bypass attendance tracking.
**Fix:** Change the `<a>` to a `<button>` that calls the attendance API first, then opens the join URL.

### 1.5 Recording Duration Always 0 (MEDIUM)

**File:** `apps/api/src/modules/recordings/recording.service.ts`
**Issue:** `duration: 0` is hardcoded. The 90% completion threshold check requires `duration > 0`, so recordings never auto-complete.
**Fix:** Fetch duration from Graph API metadata (`msRecording.audioVideoMetadata`) or set it during sync.

### 1.6 "Add to Calendar" Button Dead (LOW)

**Files:** `LiveSessionsView.tsx`, `BatchDetailView.tsx`
**Issue:** Button renders with no onClick handler.
**Fix:** Generate `.ics` file download or use `webcal://` link.

---

## PHASE 2: HomeView Course Display Improvements

### 2.1 Fix All Three Course Display Locations in HomeView

- "Continue where you left" section
- "My Enrolled Courses" list
- "Completed courses" list
  All need proper `<Image>` rendering with fallback.

### 2.2 Use IconBook as Course Icon Fallback

When no thumbnail URL is available, show `IconBook` (or `IconBooks`) in a styled gradient container instead of just an emoji. This looks more professional.

### 2.3 Unify Emoji Fallback

Standardize on `📚` across all views (currently HomeView uses `📖`, CoursesView uses `📚`).

---

## PHASE 3: Admin Health Page

### 3.1 Create `/admin/health/page.tsx`

Dedicated system health page showing:

- API server status (uptime, version, Node.js version)
- Database connection (Postgres status, response time)
- Redis connection status
- Microsoft Graph integration status
- Razorpay integration status
- YouTube API status
- Disk usage / memory
- Recent error rate (from logs)
- Service dependency status cards

### 3.2 Add to Super Admin Sidebar

Add "Health" navigation item under the super admin section.

---

## PHASE 4: Super Admin Updates

### 4.1 Add Missing Sidebar Items

- Health page link
- Potentially: email template management, feature flags, system maintenance

### 4.2 Improve Super Admin Dashboard

- Add more system metrics
- Better quick actions

---

## Files to Modify

### Phase 1 (Critical Fixes):

1. `apps/web/src/app/student/_views/HomeView.tsx` — thumbnail rendering
2. `apps/web/src/app/student/certificates/page.tsx` — route fix
3. `apps/web/src/app/student/page.tsx` — earned field fix
4. `apps/web/src/app/student/_views/CourseContentView.tsx` — attendance logging
5. `apps/api/src/modules/recordings/recording.service.ts` — duration fix
6. `apps/web/src/app/student/_views/LiveSessionsView.tsx` — calendar button
7. `apps/web/src/app/student/_views/BatchDetailView.tsx` — calendar button

### Phase 2 (Display):

8. `apps/web/src/app/student/_views/HomeView.tsx` — icon fallbacks

### Phase 3 (Health):

9. `apps/web/src/app/admin/health/page.tsx` — new file
10. `apps/web/src/components/AdminSidebar.tsx` — add nav item

### Phase 4 (Super Admin):

11. `apps/web/src/app/admin/super-admin/page.tsx` — improvements
