# LMS Student Portal — Single-Page Design Specification

> **Design Philosophy:** No sidebar. No route-based navigation. One root shell.  
> Every section opens **inside the same page** like a view stack — and a `← Back` button returns to the previous view.  
> Inspired by Intellipath's clean card-driven, section-expanding UX pattern.

---

## 0 — Core Navigation Principle

```
[ HOME DASHBOARD ]
       ↓ tap a card / button
[ SECTION VIEW ]  ←── Back button returns here
       ↓ tap a row / item
[ DETAIL VIEW ]   ←── Back button returns to SECTION VIEW
```

- **No sidebar.** No persistent left nav.
- **One URL** (`/student`) — all views are rendered in-place via React state (`activeView`, `viewStack`).
- **Back button** appears in the top-left whenever you're deeper than the home view.
- **Breadcrumb trail** (subtle, text-only) sits below the back button so users always know where they are.

---

## 1 — Global Shell (Always Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back (hidden on Home)    LMS Portal Logo       🔔  Avatar   │
│  Breadcrumb: Home > Courses > Python Batch Jan 2025             │
└─────────────────────────────────────────────────────────────────┘
```

### Header Bar

| Element | Behaviour |
|---|---|
| **← Back** | Pops the view stack. Hidden on Home. Shows on every nested view. |
| **Logo / Title** | Tapping the logo from any view always returns to Home. |
| **Notification Bell** | Opens a slide-in notification drawer (no page change). |
| **Avatar** | Opens a dropdown: Profile, Settings, Sign Out. |

### Breadcrumb

- Displayed as: `Home  /  Courses  /  Python Batch Jan 2025`
- Each segment is tappable (deep jump).
- Hidden when on the Home view.

---

## 2 — Home Dashboard View (Root)

This is the first screen after login. It **replaces** the sidebar-based layout entirely.

### 2.1 — Greeting Header

```
Good morning, Arjun 👋
Here's everything in one place.
```

- Dynamic greeting based on time of day.
- Subtitle is always fixed.

---

### 2.2 — Stats Strip (4 Cards Horizontal)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  📚           │ │  ✅           │ │  📹           │ │  🎓           │
│  ENROLLED     │ │  COMPLETED   │ │  LIVE TODAY  │ │  CERTIFICATES│
│  12 Courses   │ │  8 Courses   │ │  2 Sessions  │ │  3 Earned    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

- Each card is **tappable** → navigates to that section (Courses, Completed, Live Sessions, Certificates).
- Cards use subtle gradient backgrounds; no flat colors.
- Numbers animate up on load (count-up effect).

---

### 2.3 — Section Grid (2×N Card Grid)

All sections of the portal are reachable from here. No sidebar needed.

```
┌──────────────────────┐  ┌──────────────────────┐
│  📖  My Courses       │  │  📹  Live Sessions    │
│  12 enrolled          │  │  2 live today         │
│  3 in progress        │  │  Next: 3:00 PM        │
│  [Tap to explore →]   │  │  [Join / View →]      │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  🗓️  My Calendar      │  │  🎓  My Certificates  │
│  2 events today       │  │  3 earned             │
│  Next: Python Q&A     │  │  1 in progress        │
│  [View Calendar →]    │  │  [Download / View →]  │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  🧑‍🏫  1-on-1 Mentorship│  │  🔴  Recordings       │
│  0 open requests      │  │  14 available         │
│  [Request Session →]  │  │  Last: Python Day 3   │
│                       │  │  [Watch →]            │
└──────────────────────┘  └──────────────────────┘
```

- **6 section cards** in a responsive 2-column grid (1-col on mobile).
- Each card has: icon, title, live stat, CTA button or arrow.
- Cards with live/active state (e.g. Live Sessions) get a pulsing red dot badge.

---

### 2.4 — Today's Schedule Strip

```
TODAY  ·  Monday, 5 May 2025                           0 events
─────────────────────────────────────────────────────────────────
  📹  No live sessions scheduled today.
  🎫  No mentorship requests open.
─────────────────────────────────────────────────────────────────
  [ View Full Calendar → ]
```

- Inline, not a separate page.
- Shows today's live sessions + mentorship slots in a compact list.
- "View Full Calendar →" opens the Calendar section view.

---

### 2.5 — Continue Learning Strip

```
CONTINUE LEARNING
─────────────────────────────────────────────────────────────────
  [Thumbnail]  Python for Data Science — Batch Jan 2025
               Day 5 Recording · 62% watched
               ████████░░░░  Resume →

  [Thumbnail]  React Full Stack — Batch Feb 2025
               Day 2 Recording · 10% watched
               ██░░░░░░░░░░  Resume →
─────────────────────────────────────────────────────────────────
```

- Shows last 2 in-progress recordings.
- Each row taps into the Recording Player view.
- Progress bar is filled based on `watched_seconds / total_seconds`.

---

## 3 — Section Views (Opened From Home Cards)

Each section replaces the main content area. Header shows `← Back` and breadcrumb.

---

### 3.1 — My Courses Section View

**Breadcrumb:** `Home / Courses`

```
MY COURSES                                      [ Browse Catalogue ]
─────────────────────────────────────────────────────────────────
Filter: [ All ] [ In Progress ] [ Completed ] [ Pending Approval ]
─────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────┐
  │  [Thumbnail]  Python for Data Science                    │
  │               Batch: Jan 2025  ·  Instructor: Ravi K.    │
  │               Progress: ████████░░░░  62%                │
  │               Status: ACTIVE                  [Open →]  │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  [Thumbnail]  React Full Stack                           │
  │               Batch: Feb 2025  ·  Instructor: Priya M.   │
  │               Progress: ██░░░░░░░░░░  10%                │
  │               Status: ACTIVE                  [Open →]  │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  [Thumbnail]  Node.js Backend                            │
  │               Batch: —  ·  Pending Admin Approval        │
  │               Status: ⏳ PENDING              [—]       │
  └──────────────────────────────────────────────────────────┘
```

**Tapping [Open →]** → opens **Batch Detail View** (next level).

---

### 3.2 — Batch Detail View

**Breadcrumb:** `Home / Courses / Python for Data Science`

```
PYTHON FOR DATA SCIENCE — BATCH JAN 2025
─────────────────────────────────────────────────────────────────
Instructor: Ravi Kumar  ·  Start: 15 Jan 2025  ·  End: 30 Mar 2025

Tab Row:  [ Sessions ]  [ Recordings ]  [ Progress ]  [ Materials ]
─────────────────────────────────────────────────────────────────

── Sessions Tab ──────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────┐
  │  🔴 LIVE NOW                                             │
  │  Day 12 — Python Pandas Deep Dive                        │
  │  Started 10 min ago  ·  Instructor: Ravi K.              │
  │                                     [ Join Session → ]  │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  📅 UPCOMING                                             │
  │  Day 13 — Matplotlib & Visualisation                     │
  │  Tomorrow · 3:00 PM – 5:00 PM                            │
  │                                     [ Add to Calendar ] │
  └──────────────────────────────────────────────────────────┘

── Recordings Tab ────────────────────────────────────────────────

  Day 11 — NumPy Arrays   ·  2h 15m  ·  Watched: 100%  ✅  [▶ Watch]
  Day 10 — Pandas Intro   ·  1h 50m  ·  Watched: 62%   ──  [▶ Resume]
  Day 9  — File Handling  ·  2h 00m  ·  Watched: 0%    ──  [▶ Watch]

── Progress Tab ──────────────────────────────────────────────────

  Overall Completion: ██████████░░  62%
  
  Module 1 — Python Basics          ████████████  100% ✅
  Module 2 — Data Structures        ████████░░░░   67%
  Module 3 — File & IO              ████░░░░░░░░   33%
  Module 4 — Pandas & NumPy         ░░░░░░░░░░░░    0%
  Module 5 — Visualisation          ░░░░░░░░░░░░    0%
```

---

### 3.3 — Recording Player View

**Breadcrumb:** `Home / Courses / Python for Data Science / Day 10 Recording`

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   [ VIDEO PLAYER AREA ]                         │
│              SharePoint Signed URL Stream                       │
│                                                                 │
│  ──────────────────────────────────  62%                        │
│  ◀◀  ▶  ▶▶   0:45:12 / 1:13:00     🔊  ⛶                      │
└─────────────────────────────────────────────────────────────────┘

Day 10 — Pandas Introduction
Recorded: 28 Jan 2025  ·  Duration: 1h 13m

── Next Up ───────────────────────────────────────────────────────
  Day 11 — NumPy Arrays   2h 15m   [▶ Play Next]
  Day 9  — File Handling  2h 00m   [▶ Watch]
```

- Player re-fetches fresh SharePoint signed URL on every play.
- Watched-seconds auto-saved every 10 seconds to API.
- "Next Up" list loads the other recordings in the same batch.

---

### 3.4 — Live Sessions Section View

**Breadcrumb:** `Home / Live Sessions`

```
LIVE SESSIONS
─────────────────────────────────────────────────────────────────
Filter:  [ Live Now 🔴 ]  [ Upcoming ]  [ Past ]
─────────────────────────────────────────────────────────────────

── 🔴 Live Now ───────────────────────────────────────────────────

  Python for Data Science — Day 12
  Instructor: Ravi Kumar  ·  Started 15 min ago
  Batch: Jan 2025                         [ Join on Teams → ]

── Upcoming ──────────────────────────────────────────────────────

  React Full Stack — Day 3
  Instructor: Priya Mehta
  Tomorrow · 3:00 PM – 5:00 PM             [ Add to Calendar ]

  Python for Data Science — Day 13
  Instructor: Ravi Kumar
  5 May 2025 · 4:00 PM – 6:00 PM           [ Add to Calendar ]

── Past (No Recording Yet) ───────────────────────────────────────

  Day 11 — NumPy  ·  27 Jan  ·  Recording syncing in ~20 min  ⏳
```

---

### 3.5 — Calendar Section View

**Breadcrumb:** `Home / Calendar`

```
CALENDAR                                         May 2025   ◀  ▶
─────────────────────────────────────────────────────────────────

  Mon  Tue  Wed  Thu  Fri  Sat  Sun
   —    —    1    2    3    4    5
                                 🔴
   6    7    8    9   10   11   12
        📅
  13   14   15   16   17   18   19
  ...

── Events This Week ──────────────────────────────────────────────

  🔴  Mon 5 May  ·  10:00 AM  ·  Python Day 12 (LIVE)     [Join]
  📅  Thu 8 May  ·  3:00 PM   ·  React Day 3               [View]
  📅  Fri 9 May  ·  4:00 PM   ·  Python Day 13             [View]
```

- Calendar is synced from Microsoft Calendar via Graph API.
- 🔴 = Live Now indicator (pulsing dot).
- Tapping an event opens a mini detail card (no new view — inline expand).

---

### 3.6 — 1-on-1 Mentorship Section View

**Breadcrumb:** `Home / Mentorship`

```
1-ON-1 MENTORSHIP
─────────────────────────────────────────────────────────────────
Need focused help? Request a private session with your instructor.

[ + Request New Session ]
─────────────────────────────────────────────────────────────────

── Open Requests ─────────────────────────────────────────────────

  No open or assigned tickets.

── Past Sessions ─────────────────────────────────────────────────

  🟢  Resolved  ·  Python Doubt — List Comprehensions
      Instructor: Ravi Kumar  ·  Closed: 20 Jan 2025   [View Notes]

  🟢  Resolved  ·  React Hooks confusion
      Instructor: Priya Mehta  ·  Closed: 3 Feb 2025   [View Notes]
```

**[+ Request New Session] opens an inline form:**

```
  Course:      [ Python for Data Science ▼ ]
  Topic:       [ Type your blocker or question… ]
  Preferred timing (optional):  [ Date picker ]

                                    [ Submit Request ]
```

---

### 3.7 — Certificates Section View

**Breadcrumb:** `Home / Certificates`

```
MY CERTIFICATES
─────────────────────────────────────────────────────────────────

── Earned ────────────────────────────────────────────────────────

  🎓  Python for Data Science — Batch Oct 2024
      Issued: 15 Dec 2024
      Verify URL: lms.portal/verify/abc123
      [ Download PDF ]  [ Share ]

  🎓  JavaScript Foundations — Batch Aug 2024
      Issued: 30 Sep 2024
      [ Download PDF ]  [ Share ]

── In Progress ───────────────────────────────────────────────────

  📖  React Full Stack — Batch Feb 2025
      Completion: ██░░░░░░░░░░  10%
      Certificate unlocks at 100%

  📖  Python for Data Science — Batch Jan 2025
      Completion: ██████████░░  62%
      Certificate unlocks at 100%
```

---

## 4 — Browse Course Catalogue View

Accessible from Home header button **[Browse Courses]** or from the Courses section.

**Breadcrumb:** `Home / Browse Courses`

```
COURSE CATALOGUE
─────────────────────────────────────────────────────────────────
Search: [ 🔍 Search courses… ]

Filter by: [ All ]  [ Programming ]  [ Data ]  [ Design ]  [ DevOps ]

─────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────┐
  │  [Thumbnail]  Python for Data Science                    │
  │               12 weeks  ·  Admin: Ravi K.  ·  ₹4,999    │
  │               Next Batch: Feb 2025                       │
  │                                        [ Enroll Now → ] │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  [Thumbnail]  React Full Stack                           │
  │               10 weeks  ·  Instructor: Priya M. ·  ₹3,999│
  │               ✅ Already Enrolled                        │
  │                                        [ Open →]        │
  └──────────────────────────────────────────────────────────┘
```

**[Enroll Now →]** opens **Course Detail View**.

---

### 4.1 — Course Detail View

**Breadcrumb:** `Home / Browse Courses / Node.js Backend`

```
NODE.JS BACKEND DEVELOPMENT
─────────────────────────────────────────────────────────────────
Duration: 10 weeks  ·  Level: Intermediate  ·  Price: ₹4,499
Next Batch: 1 Mar 2025  ·  Instructor: Kiran S.
─────────────────────────────────────────────────────────────────

What you'll learn:
  ✅  REST API design with Express
  ✅  PostgreSQL with Prisma ORM
  ✅  Authentication (JWT, OAuth)
  ✅  Deployment on AWS EC2

Curriculum:
  Module 1 — Node.js Foundations (4 sessions)
  Module 2 — Express & Routing (3 sessions)
  Module 3 — Database & Prisma (4 sessions)
  Module 4 — Auth & Security (3 sessions)
  Module 5 — Deployment (2 sessions)

─────────────────────────────────────────────────────────────────

  [ Enroll & Pay ₹4,499 via Razorpay ]

  ⚠️  Payment creates a pending request. Admin reviews and assigns
      you to the next available batch. You'll be notified by email.
```

---

## 5 — View Stack State Machine

```
HOME
 ├── COURSES
 │    └── BATCH_DETAIL (batchId)
 │         ├── RECORDING_PLAYER (sessionId)
 │         └── SESSION_DETAIL (sessionId)
 ├── LIVE_SESSIONS
 ├── CALENDAR
 ├── MENTORSHIP
 │    └── MENTORSHIP_TICKET (ticketId)
 ├── CERTIFICATES
 └── BROWSE_CATALOGUE
      └── COURSE_DETAIL (courseId)
```

### State Variables (React)

```typescript
type ViewName =
  | "HOME"
  | "COURSES"
  | "BATCH_DETAIL"
  | "RECORDING_PLAYER"
  | "LIVE_SESSIONS"
  | "CALENDAR"
  | "MENTORSHIP"
  | "CERTIFICATES"
  | "BROWSE_CATALOGUE"
  | "COURSE_DETAIL";

interface ViewState {
  view: ViewName;
  params?: {
    batchId?: string;
    sessionId?: string;
    courseId?: string;
    ticketId?: string;
  };
}

// Stack-based navigation
const [viewStack, setViewStack] = useState<ViewState[]>([{ view: "HOME" }]);
const currentView = viewStack[viewStack.length - 1];

function navigate(next: ViewState) {
  setViewStack(prev => [...prev, next]);
}

function goBack() {
  setViewStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
}
```

---

## 6 — Visual Design System

### Color Palette

```
Background:     #0D0F14   (deep navy black)
Surface:        #161A23   (card background)
Surface Raised: #1E2230   (hover / active surface)
Border:         #2A2F3E   (subtle dividers)
Primary:        #6366F1   (indigo — CTAs, active states)
Primary Glow:   rgba(99, 102, 241, 0.15)
Success:        #22C55E   (green — completed, approved)
Live / Error:   #EF4444   (red — live sessions, errors)
Warning:        #F59E0B   (amber — pending states)
Text Primary:   #F1F5F9   (near white)
Text Secondary: #94A3B8   (muted slate)
Text Muted:     #4B5563   (placeholders)
```

### Typography

```
Display / Headings:  'Clash Display' or 'Cal Sans'
Body / UI:           'DM Sans' or 'Geist'
Monospace / Badges:  'JetBrains Mono' (for IDs, codes)
```

### Card Anatomy

```
┌─ Surface (#161A23) ────────────────────────────────────┐
│  1px border: #2A2F3E                                   │
│  border-radius: 16px                                   │
│  padding: 20px 24px                                    │
│  box-shadow: 0 4px 24px rgba(0,0,0,0.3)                │
│                                                        │
│  On hover:                                             │
│  background: #1E2230                                   │
│  border-color: #6366F1 (subtle)                        │
│  transform: translateY(-2px)                           │
└────────────────────────────────────────────────────────┘
```

### Back Button

```
← Back

- Position: top-left of content area (not fixed, flows with layout)
- Font: DM Sans Medium, 14px
- Color: #94A3B8 (muted)
- Hover: #F1F5F9 + left arrow shifts -2px
- Only renders when viewStack.length > 1
```

### Section Label Style

```
LIVE SESSIONS

- ALL CAPS
- Letter-spacing: 0.12em
- Font size: 11px
- Color: #6366F1 (primary)
- Used as eyebrow text above every section heading
```

---

## 7 — Mobile Layout Notes

| Element | Mobile Behaviour |
|---|---|
| Stats Strip | 2×2 grid (2 per row) |
| Section Grid | 1-column stacked |
| Back Button | Full width tap zone (48px height) |
| Header | Logo centred; Back left; Avatar right |
| Player | Full-width; controls stack vertically |
| Calendar | Week view default (not month) |
| Tabs (Batch Detail) | Horizontally scrollable |

---

## 8 — API Endpoints Used Per View

| View | Endpoints |
|---|---|
| Home Dashboard | `GET /courses/enrolled`, `GET /calendar/live`, `GET /mentorship/tickets/my`, `GET /certificates/my` |
| Courses Section | `GET /courses/enrolled?status=all` |
| Batch Detail | `GET /batch/:id/sessions`, `GET /batch/:id/recordings`, `GET /progress/:batchId` |
| Recording Player | `GET /recordings/:id/signed-url`, `POST /progress/watched` |
| Live Sessions | `GET /sessions/live`, `GET /sessions/upcoming` |
| Calendar | `GET /calendar/events` |
| Mentorship | `GET /mentorship/tickets/my`, `POST /mentorship/tickets` |
| Certificates | `GET /certificates/my` |
| Browse Catalogue | `GET /courses/catalogue` |
| Course Detail + Enroll | `GET /courses/:id`, `POST /payments/create-order` |

---

## 9 — Empty States

Each section has a friendly empty state when no data exists:

```
Courses:       "You haven't enrolled in any courses yet.  [Browse Catalogue →]"
Live Sessions: "No live sessions scheduled today. Check back later."
Recordings:    "No recordings available yet for this batch."
Mentorship:    "No open requests. Need help? [Request a Session →]"
Certificates:  "Complete a course to earn your first certificate. 🎓"
Calendar:      "No sessions this week. [Browse Courses →]"
```

---

## 10 — Animations & Transitions

| Transition | Style |
|---|---|
| View push (navigate forward) | Slide in from right (300ms ease-out) |
| View pop (back button) | Slide out to right (250ms ease-in) |
| Card hover | `translateY(-2px)` + border glow (150ms) |
| Stats count-up | 800ms ease-out on page load |
| Live Session badge | Pulsing red dot (CSS keyframe, 2s loop) |
| Section entry | Staggered fade-up (50ms delay per card) |
| Tab switch | Underline slides horizontally (200ms) |

---

## 11 — Future Enhancements (Planned Additions)

> ⚠️ **This portal is designed to grow.** The single-page view-stack architecture makes it easy to plug in new sections, cards, and views without restructuring anything. Every future feature just becomes a new card on the Home grid or a new tab inside an existing section view.

---

### 11.1 — Home Dashboard Additions

| Future Card | What It Does |
|---|---|
| **🏆 Leaderboard** | Shows student rank within their batch by progress %, quiz scores, and attendance |
| **📣 Announcements** | Admin broadcasts (batch-level or platform-wide) shown as a dismissible banner or card |
| **🔥 Streak Tracker** | Daily learning streak — how many consecutive days the student engaged with content |
| **💬 Discussion Forum** | Course-level Q&A board; card shows unread thread count |
| **🎯 Learning Goals** | Student sets weekly goals (e.g. "Watch 3 recordings"), tracked with a mini progress ring |
| **📊 My Analytics** | Personal learning stats — time spent, quiz averages, session attendance rate |
| **🛒 Browse & Purchase** | Quick-access card to browse new courses and trigger Razorpay enrollment |
| **📝 Assignments** | Future assignment submissions with due date countdown |

---

### 11.2 — Courses / Batch Detail — Future Tabs

The tab row inside Batch Detail (`Sessions · Recordings · Progress · Materials`) will expand:

| Future Tab | What It Adds |
|---|---|
| **Quizzes** | Per-module quiz list — attempt, view score, retake (if allowed) |
| **Assignments** | Submit files / text answers; view instructor feedback and grades |
| **Notes** | Student personal notes per recording (timestamped, searchable) |
| **Discussion** | Thread-based Q&A scoped to this batch only |
| **Peers** | See fellow batch-mates (name + avatar only, no contact info) |
| **Resources** | PDFs, slides, code repos shared by instructor for this batch |
| **Attendance** | Student's own attendance record per session |

---

### 11.3 — Recording Player — Future Features

| Feature | Description |
|---|---|
| **Chapter Markers** | Instructor-set timestamps that appear on the scrubber (e.g. "00:12 — List Comprehensions") |
| **Playback Speed** | 0.75× / 1× / 1.25× / 1.5× / 2× speed toggle |
| **Subtitles / Captions** | Auto-generated transcript displayed as captions during playback |
| **Bookmark** | Student can bookmark a timestamp; saved under their profile |
| **In-video Quiz** | Quiz question pops up at a specific timestamp — must answer to continue |
| **Note at Timestamp** | Student types a note at current playback time; saved to Notes tab |
| **Download (Offline)** | Allow download for offline viewing within a set expiry window |

---

### 11.4 — Mentorship — Future Additions

| Feature | Description |
|---|---|
| **Mentor Profiles** | Each instructor/mentor has a public profile page showing expertise and availability |
| **Scheduling Calendar** | Student picks a time slot from the mentor's available calendar (Google Calendar / MS Calendar integration) |
| **Group Mentorship** | Admin creates a group doubt-clearing session; students join via a shared link |
| **Chat** | Async text chat inside a mentorship ticket (before / after the session) |
| **Session Notes** | Mentor writes structured notes after the session; student can view and download |
| **Rating & Feedback** | Student rates the session (1–5 stars + optional comment) |

---

### 11.5 — Notifications & Communication

| Feature | Description |
|---|---|
| **In-app Notification Centre** | Full list of all notifications with read/unread state and filters |
| **Push Notifications** | Browser push or mobile push for: live session starting, recording available, admin approval, new assignment |
| **Email Digest** | Weekly summary email — upcoming sessions, pending quizzes, new recordings |
| **WhatsApp / SMS Alerts** | Optional opt-in for session reminders via WhatsApp Business API or SMS |

---

### 11.6 — Profile & Settings — Future View

A new section card on the Home grid:

```
MY PROFILE & SETTINGS
─────────────────────────────────────────────────────────────
  [ Profile Photo ]   Arjun Kumar
                      student@example.com
                      Joined: Jan 2025

  Tabs: [ Profile ]  [ Account ]  [ Notifications ]  [ Linked Accounts ]

── Profile Tab ──────────────────────────────────────────────
  Display Name, Bio, Profile Photo upload

── Account Tab ──────────────────────────────────────────────
  Change password, Email preferences, Delete account

── Notifications Tab ─────────────────────────────────────────
  Toggle: Live session reminders  ✅
  Toggle: Recording available     ✅
  Toggle: Mentorship responses    ✅
  Toggle: Email digest            ❌
  Toggle: WhatsApp alerts         ❌

── Linked Accounts ───────────────────────────────────────────
  Microsoft Account: [ Link for Calendar sync ]
```

---

### 11.7 — Gamification Layer (Phase 2+)

| Feature | Description |
|---|---|
| **XP Points** | Earn XP for: watching a recording, completing a quiz, attending live, requesting mentorship |
| **Badges** | Unlock milestone badges: "First Recording Watched", "5-Day Streak", "100% Module Complete" |
| **Batch Leaderboard** | Rank students within a batch by XP; visible to all batch-mates |
| **Levels** | Student level (Beginner → Intermediate → Advanced → Expert) based on cumulative XP |
| **Certificate Showcase** | Public shareable certificate page with LinkedIn share button |

---

### 11.8 — AI / Smart Features (Phase 3+)

| Feature | Description |
|---|---|
| **AI Search** | Natural language search across all recordings ("find the part where recursion was explained") |
| **Smart Recap** | Auto-generated 3-bullet summary of each recording using AI transcription |
| **Doubt Bot** | AI chatbot trained on course content to answer common student questions before escalating to mentor |
| **Personalised Recommendations** | "Based on your progress, we recommend starting Module 4 next" |
| **Quiz Auto-Generation** | AI generates practice MCQs from recording transcript for student self-test |

---

### 11.9 — How to Add a New Section (Developer Guide)

Since the portal is a single-page view stack, adding any future section takes 4 steps:

```
1. Add a new ViewName to the ViewName type union
   e.g. "LEADERBOARD" | "ASSIGNMENTS" | "FORUM"

2. Add a new card to the Home Dashboard Section Grid (Section 2.3)
   with title, icon, live stat, and a navigate() call on tap.

3. Create the Section View component
   It receives (params, navigate, goBack) as props.
   It renders its own content area with the Back button and breadcrumb.

4. Register the view in the root render switch
   case "LEADERBOARD": return <LeaderboardView ... />
```

No routing changes. No sidebar changes. No layout restructuring.
The shell stays the same — only the content area swaps.

---

### 11.10 — Versioning Plan

| Version | Focus |
|---|---|
| **v1.0 — Current** | Dashboard, Courses, Live Sessions, Calendar, Mentorship, Certificates, Browse Catalogue |
| **v1.1** | Quizzes tab, Assignments tab, In-app Notification Centre, Profile & Settings view |
| **v1.2** | Recording chapter markers, playback speed, bookmarks, batch peer list |
| **v1.3** | Discussion forums, group mentorship, mentor profiles with scheduling |
| **v2.0** | Gamification (XP, badges, leaderboard), streak tracker, learning goals |
| **v3.0** | AI search, smart recap, doubt bot, quiz auto-generation |

---

*LMS Portal · Student Portal Single-Page Design Spec · Version 1.0*
*Reference: LMS_Revised_Architecture.md · Inspired by Intellipath UX patterns*
*Designed to scale — new features plug in without restructuring the shell.*
