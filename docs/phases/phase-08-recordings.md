# Phase 8 — Recordings & Video

> ⏱️ **Duration**: Weeks 11–12 (2 weeks)  
> 📌 **Status**: 🔄 In Progress  
> 🔗 **Depends on**: Phase 6

---

## 🎯 Objective

Automatically sync session recordings from Teams/SharePoint after sessions end, build a video player with progress tracking, and store watch history per user.

---

## ✅ Tasks

### 7.1 — Recording Sync Backend

- [ ] Create recording sync service:
  - `syncRecordingsForSession(sessionId)`
  - Wait for recordings to become available (they appear 20-60 min after session end)
  - Call Graph API: `GET /communications/callRecords?$filter=startDateTime ge '...'`
  - Match call records to sessions using `teamsMeetingId`
  - Fetch SharePoint recording URL
  - Store in `Recording` table:
    - `sessionId`, `teamsRecordingId`, `sharePointUrl`, `duration`, `syncedAt`
- [ ] Create Bull job: `recordingSync.job.ts`
  - Triggers 30 minutes after session `endedAt`
  - Retry every 15 minutes if recording not yet available (max 4 retries = 1 hour total)
  - On success: mark session as having recording
  - On final failure: log error, notify admin
  - **🆕 Idempotency**: Skip if recording already synced for this session
- [ ] Create API endpoints:
  - `GET /api/recordings?courseId=...` — list recordings for a course
  - `GET /api/recordings/:id` — recording details
  - `GET /api/recordings/:id/url` — fetch fresh SharePoint signed URL
- [ ] **🆕 Manual recording trigger**:
  - `POST /api/recordings/:sessionId/sync` — admin/instructor can manually trigger sync
  - Useful when auto-sync fails

### 7.2 — SharePoint URL Handling

> [!CAUTION]
> SharePoint signed URLs expire in ~1 hour. **NEVER** cache or store them permanently.

- [ ] Implement on-demand URL fetching:
  - When student clicks play → API fetches fresh signed URL from Graph
  - Return URL with `expiresAt` timestamp
  - Frontend starts playback with fresh URL
- [ ] Handle URL fetch failures:
  - Graph API down → show "Recording temporarily unavailable, try again"
  - Recording deleted from SharePoint → show "Recording no longer available"
  - User's MS token expired → prompt re-authentication
- [ ] **🆕 URL pre-fetching**:
  - When loading recording page, pre-fetch URL so playback starts instantly
  - Cache URL in Redis with TTL = 50 minutes (buffer before 1-hour expiry)

### 7.3 — Video Player Page

- [ ] Build recording player page: `/learn/[sessionId]`
- [ ] Video player component:
  - Use **video.js** or **Plyr** for the player
  - HLS/DASH streaming support (if SharePoint provides progressive download, use native `<video>`)
  - Controls: play/pause, seek, volume, playback speed (0.5x – 2x), fullscreen
  - Skip forward/backward 10 seconds buttons
  - Keyboard shortcuts: space (play/pause), arrow keys (seek), F (fullscreen)
- [ ] Sidebar curriculum navigation:
  - Show all modules and sessions for the course
  - Highlight current recording
  - Show completion status per recording (✓ completed, ◐ in progress, ○ not started)
  - Click to navigate to different recording
- [ ] Session info display:
  - Title, instructor, date, duration
  - Course and module context
  - **🆕 Related materials** (if any attachments exist — future feature)

### 7.4 — Progress Tracking

- [ ] Track watch progress:
  - Frontend sends progress update every 15 seconds (debounced)
  - `POST /api/progress` with `{ recordingId, watchedSeconds }`
  - Store in `Progress` table
  - Mark recording as completed when `watchedSeconds >= duration * 0.9` (90% threshold)
- [ ] Resume playback:
  - On page load, fetch last `watchedSeconds` for this recording
  - Seek video to that position
  - Show "Resume from X:XX" prompt
- [ ] API endpoints:
  - `POST /api/progress` — update watch progress
  - `GET /api/progress?courseId=...` — get progress for all recordings in a course
  - `GET /api/progress/:recordingId` — get progress for specific recording
- [ ] **🆕 Anti-cheat measures**:
  - Don't count progress if tab is not visible (Page Visibility API)
  - Don't count progress if video is muted and minimized (optional, configurable)
  - Rate-limit progress updates (max 1 per 10 seconds)

### 7.5 — Recording List Pages

- [ ] Instructor recordings page: `/(instructor)/panel/recordings`
  - List all recordings across instructor's courses
  - Show: session title, course, date, duration, view count
  - Sort by: date, views, course
  - Filter by: course, date range
- [ ] Student recording access:
  - Only show recordings for enrolled courses
  - Progress indicator on each recording
  - "Continue Watching" section on dashboard (most recently watched)

### 7.6 — 🆕 Recording Metadata & Search

- [ ] Store additional metadata per recording:
  - `viewCount` — increment on each play
  - `averageWatchTime` — average seconds watched across users
  - `title` — editable by instructor (default: session title)
  - `description` — optional notes added by instructor
- [ ] Allow instructors to edit recording metadata:
  - `PATCH /api/recordings/:id` — update title, description
- [ ] **Course recordings search**: Filter recordings by title/description within a course

### 7.7 — 🆕 Download Option (Optional)

- [ ] Allow instructors to enable/disable download per course
- [ ] If enabled, provide a "Download" button that fetches a fresh SharePoint URL
- [ ] Track downloads for analytics

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Recording sync job | Recordings appear in DB ~30 min after session |
| Fresh SharePoint URL fetching | Playback works with non-expired URL |
| Video player page | Student can watch recordings with controls |
| Sidebar curriculum nav | Student can navigate between recordings |
| Progress tracking | Watch position saved and resumed |
| 90% completion detection | Recording marked complete at 90% watched |
| Instructor recordings page | Instructor sees all recordings |
| Recording metadata editing | Instructor can update title/description |

---

## 🧪 Tests to Write

- [ ] Unit: Recording sync matches call records to sessions
- [ ] Unit: Progress completion threshold (90%) logic
- [ ] Unit: Anti-cheat logic (tab visibility check)
- [ ] Integration: Sync job fetches and stores recording
- [ ] Integration: Fresh URL endpoint returns valid SharePoint URL
- [ ] Integration: Progress update saves to database
- [ ] Integration: Resume position returned correctly
- [ ] E2E: Student opens recording → plays → pauses → resumes later at same point
- [ ] E2E: Instructor views recordings list with metadata

