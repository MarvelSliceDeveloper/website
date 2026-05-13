# Phase 3 — Student Dashboard: Detailed UI/UX Plan
> Reference: Intellipaat · Duration: Weeks 4–5 · Status: Pending

---

## 🗂️ Table of Contents
1. [Overall Layout & Navigation](#1-overall-layout--navigation)
2. [Dashboard Home Page](#2-dashboard-home-page)
3. [Course Card — Collapsed & Expanded States](#3-course-card--collapsed--expanded-states)
4. [Live Classes Section](#4-live-classes-section)
5. [Recorded Video Sessions Section](#5-recorded-video-sessions-section)
6. [Quizzes Section](#6-quizzes-section)
7. [Assignments Section](#7-assignments-section)
8. [1-on-1 Mentorship Section](#8-1-on-1-mentorship-section)
9. [Progress & Progression Tracking](#9-progress--progression-tracking)
10. [Course Catalogue Page](#10-course-catalogue-page)
11. [Routing Structure](#11-routing-structure)
12. [API Layer & Request Contracts](#12-api-layer--request-contracts)
13. [Revised Tasks Breakdown](#13-revised-tasks-breakdown)

---

## 1. Overall Layout & Navigation

### Shell Layout (Sidebar + Header + Main Content)

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER  [Logo]  [Search]  [🔔 Notifications]  [Avatar ▼]      │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                      │
│ SIDEBAR  │            MAIN CONTENT AREA                        │
│          │                                                      │
│ • Home   │                                                      │
│ • My     │                                                      │
│   Courses│                                                      │
│ • Live   │                                                      │
│   Classes│                                                      │
│ • Videos │                                                      │
│ • Quizzes│                                                      │
│ • Assign-│                                                      │
│   ments  │                                                      │
│ • Mentor │                                                      │
│ • Profile│                                                      │
│          │                                                      │
└──────────┴─────────────────────────────────────────────────────┘
```

### Sidebar Details
- **Width**: 240px desktop · Collapsible to 64px icon-only · Full-screen drawer on mobile
- **Active item**: Left-border accent (brand color) + slightly tinted background
- **Items**:
  - 🏠 Home
  - 📚 My Courses *(badge showing enrolled count)*
  - 🎥 Live Classes *(badge: "2 Today")*
  - 🎬 Recorded Videos
  - 🧠 Quizzes *(badge: "3 Pending")*
  - 📝 Assignments *(badge: pending count)*
  - 🤝 1-on-1 Mentorship
  - 👤 My Profile
- **Bottom**: Dark mode toggle + Logout button

### Header Details
- **Left**: Hamburger (mobile) + Logo
- **Center**: Search bar ("Search courses, videos, quizzes…")
- **Right**: Notification bell (red dot for unread) + Avatar with dropdown (Profile, Settings, Logout)

### Current Implementation Baseline
- Web app routes live under `apps/web/src/app/student/` and use the `/student/*` URL space.
- Shared request helper lives in `apps/web/src/lib/api.ts`.
- The current API surface already supports mentorship, sessions, recordings, auth, and calendar sync.
- Phase 3 should wire student pages to existing endpoints first, then extend the API only where the backend does not yet expose a required resource.

### Responsive Behavior
| Breakpoint | Sidebar | Content |
|---|---|---|
| Desktop (≥1024px) | 240px fixed left | Remaining width |
| Tablet (768–1023px) | 64px icon-only | Full width |
| Mobile (<768px) | Hidden, drawer via hamburger | Full width |

---

## 2. Dashboard Home Page

### Layout — 3 Zones stacked vertically

```
┌─────────────────────────────────────────────────────────┐
│  👋 Welcome back, Arjun!                                │
│  [Overall Progress Bar — 62% complete across courses]   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔴 LIVE NOW / UPCOMING TODAY                           │
│  [Live class card] [Live class card]                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📚 MY ENROLLED COURSES                                 │
│  [Course Card] [Course Card] [Course Card]  → View All  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📋 PENDING ACTION ITEMS                                │
│  [Assignment due card] [Quiz due card] [Mentorship card]│
└─────────────────────────────────────────────────────────┘
```

### Welcome Banner
- Full-width card with subtle gradient (brand color, light)
- Shows: Student name, avatar, enrollment count, streak ("🔥 7-day learning streak")
- **Overall Progression Bar** at the bottom of the banner — a thin horizontal bar showing aggregate completion % across all enrolled courses

---

## 3. Course Card — Collapsed & Expanded States

### Collapsed Card (shown on Dashboard / My Courses grid)

```
┌────────────────────────────────────┐
│  [Course Thumbnail Image]          │
│                                    │
│  Data Science Bootcamp             │
│  Batch: DS-2025-B · Starts May 18  │
│                                    │
│  ████████░░░░░░  62% complete      │
│                                    │
│  [🎥 Videos]  [🧠 Quiz]  [📝 Task] │
│                          [Continue →]│
└────────────────────────────────────┘
```

**Card fields:**
- Thumbnail (course banner image or auto-generated color block with initials)
- Course name (bold, 16px)
- Batch name + next session date
- Mini progress bar (colored fill)
- Quick-access icon pills: Videos · Quizzes · Assignments
- `Continue` CTA button → goes to Course Detail page

---

### Course Detail Page (when card is clicked / tapped)

**Route**: `/student/courses/[courseId]`

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to My Courses                                    │
│  [Course Banner Image / Color Block]                     │
│  Data Science Bootcamp — Batch DS-2025-B                 │
│  Instructor: Dr. Priya Mehta   · 48 hours total          │
│  ████████████░░░░  68% completed                         │
└──────────────────────────────────────────────────────────┘

TAB BAR:
[📅 Live Classes] [🎬 Recorded Videos] [🧠 Quizzes] [📝 Assignments] [📌 Materials]

──── TAB CONTENT BELOW ────
```

The tab bar is the primary navigation **within** a course. Each tab is its own full section (detailed below).

---

## 4. Live Classes Section

**Route**: `/student/courses/[courseId]/live` · Also accessible from sidebar "Live Classes"

### What it looks like

```
┌───────────────────────────────────────────────────────────────┐
│  📅 LIVE CLASSES — Data Science Bootcamp                      │
│                                                               │
│  ── LIVE NOW ──────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔴 LIVE    Python for ML — Session 12                │   │
│  │  Dr. Priya Mehta  ·  Started 20 min ago  ·  48 joined│   │
│  │  [▶ JOIN NOW]                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ── UPCOMING ──────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟡 Tomorrow, 7:00 PM IST                             │   │
│  │  Data Wrangling with Pandas — Session 13             │   │
│  │  Dr. Priya Mehta  ·  90 min  ·  Zoom/Google Meet     │   │
│  │  [🔔 Add Reminder]  [📅 Add to Calendar]             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔵 Sat 24 May, 10:00 AM IST                          │   │
│  │  Model Evaluation & Metrics — Session 14             │   │
│  │  ...                                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ── PAST SESSIONS ─────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ✅  Session 11 — Feature Engineering  (May 10)       │   │
│  │  Recording available  [▶ Watch Recording]            │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Card Details per Live Session

| Field | Description |
|---|---|
| Status badge | 🔴 LIVE · 🟡 Upcoming · ✅ Completed · ❌ Missed |
| Session title | e.g. "Python for ML — Session 12" |
| Date & time | Formatted in user's local timezone (IST shown, converts automatically) |
| Duration | "90 min estimated" |
| Instructor | Name + avatar thumbnail |
| Attendee count | "48 joined" (live only) |
| Join button | `JOIN NOW` (active only when live, greyed out otherwise with countdown timer) |
| Reminder button | Sets browser/app notification |
| Calendar button | Generates .ics / opens Google Calendar |
| Recording link | Shown on completed sessions → links to Recorded Videos section |

### Sidebar "Live Classes" global view
Same layout but aggregated across **all enrolled courses**, with a course label on each card.

---

## 5. Recorded Video Sessions Section

**Route**: `/student/courses/[courseId]/videos`

### What it looks like

```
┌───────────────────────────────────────────────────────────────┐
│  🎬 RECORDED VIDEOS — Data Science Bootcamp                   │
│  [🔍 Search videos]  [Filter: All ▼]  [Sort: Latest ▼]       │
│                                                               │
│  ── MODULE 1: Python Fundamentals ──────────────────────────  │
│  Progress: ████████████░░░  80%                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [▶ Thumbnail]  Intro to Python & Setup               │     │
│  │                Duration: 42 min  ·  ✅ Watched       │     │
│  │                Last watched: 2 days ago              │     │
│  └─────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [▶ Thumbnail]  Variables, Loops & Functions          │     │
│  │                Duration: 56 min  ·  🟡 In Progress   │     │
│  │                ████████░░░░  Watched: 32/56 min      │     │
│  │                [▶ Resume at 32:14]                   │     │
│  └─────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ [▶ Thumbnail]  OOP in Python                         │     │
│  │                Duration: 48 min  ·  🔒 Not started   │     │
│  │                [▶ Start Now]                         │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── MODULE 2: Data Manipulation ────────────────────────────  │
│  ...                                                          │
└───────────────────────────────────────────────────────────────┘
```

### Video Card Details

| Field | Description |
|---|---|
| Thumbnail | Auto-generated from video or a course-branded placeholder |
| Title | Video/session title |
| Duration | Total length (e.g. "56 min") |
| Status badge | ✅ Watched · 🟡 In Progress · 🔒 Not Started |
| Per-video progress bar | Only shown for "In Progress" videos |
| Resume / Start button | "Resume at MM:SS" or "Start Now" |
| Date | "Added: May 10" for recording of live session |

### Video Player Page

**Route**: `/student/courses/[courseId]/videos/[videoId]`

```
┌───────────────────────────────────────────────────────────────┐
│  ← Back to Videos                                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  │           [VIDEO PLAYER EMBED]                      │     │
│  │                                                     │     │
│  └─────────────────────────────────────────────────────┘     │
│  OOP in Python — Session 3                                   │
│  Dr. Priya Mehta · 48 min · Added May 10                     │
│                                                               │
│  [← Prev Video]                        [Next Video →]        │
│                                                               │
│  📄 RESOURCES FOR THIS SESSION                               │
│  · Slides.pdf  [⬇ Download]                                  │
│  · Code Examples.zip  [⬇ Download]                           │
│                                                               │
│  📝 NOTES (personal scratchpad)                              │
│  [Textarea for student notes — auto-saved]                   │
└───────────────────────────────────────────────────────────────┘
```

**Progression is tracked automatically**: Every 30 seconds of watched video updates the progress counter in the database. Completing >85% of a video marks it ✅.

---

## 6. Quizzes Section

**Route**: `/student/courses/[courseId]/quizzes`

### What it looks like

```
┌───────────────────────────────────────────────────────────────┐
│  🧠 QUIZZES — Data Science Bootcamp                          │
│                                                               │
│  ── PENDING / DUE ─────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🔴 Due: Tomorrow 11:59 PM                           │     │
│  │  Quiz 4 — Pandas DataFrames  ·  15 Questions        │     │
│  │  Time limit: 30 min  ·  Attempts left: 2            │     │
│  │  [▶ Start Quiz]                                     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── UPCOMING ──────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🔵 Opens: May 25                                    │     │
│  │  Quiz 5 — NumPy & Arrays  ·  20 Questions           │     │
│  │  Time limit: 45 min  ·  [🔒 Locked until May 25]    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── COMPLETED ─────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ ✅ Quiz 3 — Python Loops  ·  Scored: 88/100          │     │
│  │  Completed: May 8 · Rank in batch: 4th              │     │
│  │  [📊 View Results & Explanations]                   │     │
│  └─────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

### Quiz Card Details

| Field | Description |
|---|---|
| Due date badge | 🔴 urgent (< 24h) · 🟡 upcoming · 🔵 future-locked |
| Quiz title | e.g. "Quiz 4 — Pandas DataFrames" |
| Question count | "15 Questions" |
| Time limit | "30 min" |
| Attempts left | "2 attempts remaining" |
| CTA | "Start Quiz" · "Resume" (if interrupted) · "View Results" |
| Score | Shows on completed quizzes |
| Batch rank | "4th in your batch" — shows after completion |

### Quiz Taking Flow (in-app)

**Route**: `/student/courses/[courseId]/quizzes/[quizId]/take`

```
┌──────────────────────────────────────────────────────────────┐
│  Quiz 4 — Pandas DataFrames           ⏱ 28:43 remaining      │
│  Question 7 of 15  ████████░░░░░░ 47%                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Which method is used to drop null values in a DataFrame?   │
│                                                              │
│  ○  A. df.remove_null()                                     │
│  ○  B. df.dropna()                                          │
│  ○  C. df.fillna(None)                                      │
│  ○  D. df.strip()                                           │
│                                                              │
│  [← Previous]         [Flag for Review ⚑]    [Next →]       │
│                                                              │
│  [Submit Quiz]  ← disabled until all answered or time up    │
└──────────────────────────────────────────────────────────────┘
```

**Post-Quiz Results Page**:
- Score breakdown (correct / incorrect / skipped)
- Time taken
- Question-by-question review with correct answers + explanations
- Comparison to batch average

---

## 7. Assignments Section

**Route**: `/student/courses/[courseId]/assignments`

### What it looks like

```
┌───────────────────────────────────────────────────────────────┐
│  📝 ASSIGNMENTS — Data Science Bootcamp                      │
│                                                               │
│  ── PENDING SUBMISSION ────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🔴 Due: May 20, 11:59 PM  (2 days left)             │     │
│  │  Assignment 3 — EDA on Real Dataset                 │     │
│  │  Format: Jupyter Notebook (.ipynb)  ·  Max: 10 MB   │     │
│  │  Status: Not submitted                              │     │
│  │                                                     │     │
│  │  📎 [Attach File]  or drag & drop here              │     │
│  │  [Submit Assignment]                                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── SUBMITTED / UNDER REVIEW ──────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🕐 Assignment 2 — Python OOP Mini-Project           │     │
│  │  Submitted: May 12 at 9:30 PM  ·  Under review      │     │
│  │  [📄 View Submission]                               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ── GRADED ────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ ✅ Assignment 1 — Python Basics                     │     │
│  │  Grade: 92/100  ·  Graded by: Dr. Mehta             │     │
│  │  Feedback: "Excellent work on loops, minor issues   │     │
│  │             in exception handling."                 │     │
│  │  [📄 View Submission]  [💬 Reply to Feedback]       │     │
│  └─────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

### Assignment Card Details

| Field | Description |
|---|---|
| Due date | Color-coded: 🔴 < 24h · 🟡 2-3 days · 🔵 future |
| Title | Assignment name |
| Format / size limit | "Jupyter Notebook, max 10 MB" |
| Status badge | Not submitted · Submitted · Under review · Graded · Late |
| File uploader | Drag-and-drop + click-to-attach, with file type validation |
| Grade display | Shown after grading, with score and instructor feedback |
| Feedback thread | Student can reply to instructor feedback inline |

### Assignment Detail Page

**Route**: `/student/courses/[courseId]/assignments/[assignmentId]`

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Assignments                                       │
│ Assignment 3 — EDA on Real Dataset                          │
│ Due: May 20, 11:59 PM IST · 2 days remaining               │
│                                                              │
│ INSTRUCTIONS                                                 │
│ [Full assignment description, rubric, reference links]      │
│                                                              │
│ SUBMISSION                                                   │
│ ┌──────────────────────────────────────────────────────┐    │
│ │  📁 Drag and drop your file here                    │    │
│ │     or  [Browse Files]                              │    │
│ │  Accepted: .ipynb, .py, .pdf  ·  Max 10 MB          │    │
│ └──────────────────────────────────────────────────────┘    │
│ [Optional note to instructor...]                            │
│ [Submit Assignment]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. 1-on-1 Mentorship Section

**Route**: `/student/mentorship`

### What it looks like

```
┌───────────────────────────────────────────────────────────────┐
│  🤝 1-ON-1 MENTORSHIP                                        │
│                                                               │
│  ── YOUR REQUESTS ─────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ 🕐 Ticket #1042  ·  Created: May 10                 │     │
│  │  Topic: "Confused about cross-validation"           │     │
│  │  Status: Waiting for mentor assignment              │     │
│  └─────────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ ✅ Ticket #1038  ·  Completed: May 5                │     │
│  │  Mentor: Karan S.  ·  Duration: 45 min              │     │
│  │  [⭐ Rate Session]  [📄 View Notes]                  │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  [+ Request a New 1-on-1 Session]                            │
└───────────────────────────────────────────────────────────────┘
```

### Request Modal / Form

Triggered by "Request a New 1-on-1 Session" button:

```
┌──────────────────────────────────────────────────────────────┐
│  Request a 1-on-1 Session                            [✕]    │
│                                                              │
│  Course *                                                    │
│  [Data Science Bootcamp ▼]                                  │
│                                                              │
│  Topic / Subject *                                           │
│  [e.g. "Help understanding gradient descent"]               │
│                                                              │
│  Describe your difficulty *                                  │
│  [Multiline textarea — min 50 characters]                   │
│                                                              │
│  Preferred time slot                                         │
│  [Date picker]  [Time picker]                               │
│                                                              │
│  Session type                                                │
│  ○ Video Call   ○ Chat-based   ○ No preference              │
│                                                              │
│  Urgency                                                     │
│  ○ Low (within a week)  ○ Medium (2-3 days)  ○ High (ASAP)  │
│                                                              │
│  [Cancel]                     [Submit Request →]             │
└──────────────────────────────────────────────────────────────┘
```

**On Submit**:
1. Ticket is created in DB
2. Admin receives email + dashboard notification: "New 1-on-1 request: [topic]"
3. Admin assigns a mentor
4. Student receives notification: "Mentor assigned: Karan S. — Session scheduled for May 15"
5. Ticket status updates to "Scheduled"

### Request Status Flow

```
Submitted → Pending Admin Review → Mentor Assigned → Session Scheduled → Completed → Rated
```

---

## 9. Progress & Progression Tracking

### Overall Progression Bar (Dashboard Header)

- Thin bar (height: 8px) spanning the welcome banner
- Shows aggregate completion across all enrolled courses
- Tooltip on hover: "62% — 3 of 5 courses have active progress"
- Color transitions: grey (0%) → orange (1-50%) → green (51-100%)

### Per-Course Progress Bar (Course Cards & Course Detail)

Calculation:

```
course_completion = (
  (videos_watched_seconds / total_video_seconds) * 0.40 +
  (quizzes_passed / total_quizzes)               * 0.30 +
  (assignments_submitted / total_assignments)    * 0.30
) * 100
```

- Displayed as a colored bar + percentage label
- Visible on: collapsed course card, course detail header, sidebar badge

### Activity Streak Widget (Dashboard)

```
┌────────────────────────────────┐
│ 🔥 7-Day Learning Streak        │
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun│
│  ●    ●    ●    ●    ●    ●    ○  │
│  (filled = active day)           │
└────────────────────────────────┘
```

---

## 10. Course Catalogue Page

**Route**: `/student/catalogue`

### What it looks like

```
┌────────────────────────────────────────────────────────────┐
│  🗂️ COURSE CATALOGUE                                        │
│  [🔍 Search]  [Category ▼]  [Duration ▼]  [Level ▼]        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ [Thumbnail]  │  │ [Thumbnail]  │  │ [Thumbnail]  │     │
│  │ Data Science │  │ Full Stack   │  │ ML Engineer  │     │
│  │ Bootcamp     │  │ Dev          │  │ Track        │     │
│  │ 7 Months     │  │ 6 Months     │  │ 9 Months     │     │
│  │ Next: May 18 │  │ Next: Jun 1  │  │ Next: May 25 │     │
│  │ ★ 4.8 (230)  │  │ ★ 4.6 (180)  │  │ ★ 4.9 (95)   │     │
│  │ [View Course]│  │ [View Course]│  │ [View Course]│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Course Detail (Catalogue) Page

**Route**: `/student/catalogue/[courseId]`

```
┌──────────────────────────────────────────────────────────────┐
│  [Full Banner Image]                                        │
│  Data Science Bootcamp                          [ENROLL →]  │
│  ★ 4.8 · 230 reviews · 1,200+ enrolled · 7 Months         │
│                                                              │
│  WHAT YOU'LL LEARN                                          │
│  · Python for Data Science  · Machine Learning Algorithms  │
│  · Deep Learning  · Model Deployment                       │
│                                                              │
│  CURRICULUM (Expandable accordion)                          │
│  > Module 1: Python Fundamentals  (5 videos, 1 quiz)       │
│  > Module 2: Data Manipulation    (4 videos, 2 quizzes)    │
│  ...                                                         │
│                                                              │
│  INSTRUCTORS                                                │
│  [Dr. Priya Mehta — Photo, Bio]                            │
│                                                              │
│  UPCOMING BATCH                                             │
│  Starts: May 18, 2025  ·  Duration: 7 Months               │
│  [ENROLL NOW]                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Routing Structure

```
apps/web/src/app/student/
│
├── dashboard/              → Home (overview, enrolled courses, upcoming sessions)
│
├── courses/
│   ├── index               → My Courses (grid of enrolled course cards)
│   └── [courseId]/
│       ├── index           → Course Detail (tabs: Live / Videos / Quizzes / Assignments)
│       ├── live/           → Live Classes tab
│       ├── videos/
│       │   ├── index       → Video list
│       │   └── [videoId]/  → Video player page
│       ├── quizzes/
│       │   ├── index       → Quiz list
│       │   └── [quizId]/
│       │       ├── take/   → Quiz taking interface
│       │       └── results/→ Quiz results & review
│       └── assignments/
│           ├── index       → Assignment list
│           └── [assignmentId]/ → Assignment detail & submission
│
├── mentorship/
│   ├── index               → My mentorship requests
│   └── request/            → New request form
│
├── catalogue/
│   ├── index               → Course catalogue
│   └── [courseId]/         → Public course detail + enroll CTA
│
└── profile/                → Student profile & settings
```

### Route Notes
- The implementation uses standard App Router folders, not route groups, so the actual URLs are `/student/...`.
- Keep the sidebar destinations aligned with the real URL paths to avoid 404s and duplicated navigation state.
- If a future route group is introduced, update this section and the API request examples together.

---

## 12. API Layer & Request Contracts

### Request Layer
- `apps/web/src/lib/api.ts` is the single browser request helper.
- It reads `NEXT_PUBLIC_API_URL` and defaults to `http://localhost:4000`.
- All requests send `credentials: "include"` so the HTTP-only auth cookie is sent automatically.
- The helper always sets `Content-Type: application/json` and throws a normalized `Error` for non-2xx responses.

### API Contract for Phase 3 Screens

| Screen | Method | Endpoint | Purpose | Notes |
|---|---|---|---|---|
| Login | POST | `/api/auth/login` | Authenticate and set the access cookie | Already implemented |
| Dashboard live cards | GET | `/api/calendar/live` | Show current live sessions | Already implemented |
| Dashboard today view | GET | `/api/calendar/events/today` | Show today's events and reminders | Already implemented |
| My enrolled recordings | GET | `/api/recordings?courseId=...` | List recordings for a course | Already implemented |
| Playback URL | GET | `/api/recordings/:id/url` | Fetch a fresh playback URL | Already implemented |
| Watch progress | POST | `/api/recordings/progress` | Persist watch progress every 30s | Already implemented |
| Course live sessions | GET | `/api/sessions?courseId=...` | Show scheduled sessions for the course | Already implemented |
| Student mentorship list | GET | `/api/mentorship/tickets/my` | Show the student’s mentorship requests | Already implemented |
| Create mentorship ticket | POST | `/api/mentorship/tickets` | Submit a new 1-on-1 request | Already implemented |
| Calendar sync | POST | `/api/calendar/sync` | Refresh Microsoft calendar events | Already implemented |

### Request Examples

#### 1. Create Mentorship Request
```ts
await api.post('/api/mentorship/tickets', {
  title: 'Need help with cross-validation',
  description: 'I want to understand how to choose the right validation strategy for my dataset.',
  preferredDate: '2026-05-20',
  preferredTime: 'afternoon',
});
```

#### 2. Load Student Mentorship Tickets
```ts
const data = await api.get<{ tickets?: Ticket[] }>('/api/mentorship/tickets/my');
```

#### 3. Track Recording Progress
```ts
await api.post('/api/recordings/progress', {
  recordingId: 'uuid',
  watchedSeconds: 1500,
});
```

#### 4. Load Live Sessions
```ts
const sessions = await api.get<{ sessions?: any[] }>('/api/calendar/live');
```

### Error Handling Standard
- `400`: validation errors from Zod or bad request payloads
- `401`: missing or invalid auth cookie
- `403`: authenticated but not permitted
- `404`: resource not found
- `500`: unexpected server error

---

## 13. Revised Tasks Breakdown

### 3.1 — Student Dashboard Base
- [ ] Build shell layout (Sidebar + Header + Main Content Area)
- [ ] Implement responsive design (mobile drawer, tablet icon sidebar, desktop full sidebar)
- [ ] Create routing structure under `/(student)` per Section 11
- [ ] Integrate auth state: show student name, avatar, logout option

### 3.2 — Progression Tracking
- [ ] Build `<ProgressBar>` component (per-course and overall)
- [ ] Implement progress calculation formula (40% video · 30% quiz · 30% assignment)
- [ ] Track video watch time (update DB every 30s of playback)
- [ ] Display course completion % on all course cards
- [ ] Build activity streak widget

### 3.3 — Live Classes Section
- [ ] Build `LiveClassCard` component with status badges (LIVE / Upcoming / Past)
- [ ] Implement countdown timer on upcoming sessions
- [ ] "Add Reminder" (browser notification) + "Add to Calendar" (.ics) buttons
- [ ] Show attendee count live
- [ ] Link completed sessions to their recordings

### 3.4 — Recorded Videos Section
- [ ] Build video list with module grouping accordion
- [ ] Video card with status (Watched / In Progress / Not Started)
- [ ] Per-video progress bar and "Resume at MM:SS" functionality
- [ ] Video player page with adjacent resource downloads and personal notes field
- [ ] Progress auto-tracking every 30s of playback

### 3.5 — Quizzes Section
- [ ] Build quiz list with due date badges and status groupings
- [ ] Timed quiz-taking interface (countdown timer, question navigation, flag-for-review)
- [ ] Post-quiz results page with per-question breakdown and explanations
- [ ] Unit test: completion % calculated correctly

### 3.6 — Assignments Section
- [ ] Build assignment list with status groupings
- [ ] Assignment detail page with full instructions and file uploader (drag-and-drop)
- [ ] File type + size validation on upload
- [ ] Display grade + instructor feedback on graded assignments
- [ ] Reply to feedback thread

### 3.7 — 1-on-1 Mentorship
- [ ] "Request Session" button and modal form with full validation
- [ ] Ticket creation in DB on submit
- [ ] Admin email + dashboard notification on new ticket
- [ ] Admin assignment flow (assign mentor to ticket)
- [ ] Status timeline display on student side
- [ ] Session rating after completion

### 3.8 — Course Catalogue
- [ ] Build catalogue browse page with search + filter
- [ ] Course detail (public) page with curriculum accordion
- [ ] "Enroll" CTA — triggers enrollment flow

---

## 📦 Updated Deliverables

| Deliverable | Verification |
|---|---|
| Student Dashboard Home | Responsive, shows live sessions, enrolled courses, pending items |
| Course Detail (tabbed) | Live / Videos / Quizzes / Assignments tabs all functional |
| Live Classes | Status badges, join link, reminders, calendar, past recordings linked |
| Recorded Videos | Module grouping, per-video progress, resume functionality, notes |
| Quizzes | Timed flow, results, per-question review |
| Assignments | Submission upload, grading display, feedback thread |
| Progression Bar | Formula-based, updates in real time as student completes content |
| 1-on-1 Request Flow | Form → ticket → admin notification → mentor assignment → status shown |
| Course Catalogue | Browse, search, filter, enroll CTA |

---

## 🧪 Updated Test Plan

| Type | Test |
|---|---|
| Unit | `calculateCourseProgress(videos, quizzes, assignments)` returns correct % |
| Unit | Video progress updates every 30s and marks complete at >85% |
| Unit | Quiz timer counts down accurately and auto-submits on expiry |
| Unit | Assignment form validates file type, size, and required fields |
| Unit | 1-on-1 request form validates all required fields |
| Integration | Submitting quiz saves score and triggers notification |
| Integration | Submitting assignment uploads file and notifies instructor |
| Integration | 1-on-1 request creates DB ticket and sends admin notification |
| E2E | Student logs in → views dashboard → enrolls in course → watches video → takes quiz → submits assignment |
| E2E | Student requests 1-on-1 → admin assigns mentor → student sees status update |