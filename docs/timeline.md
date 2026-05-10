# LMS Portal — Revised Implementation Plan & Timeline

**12 Phases · 18 Weeks · ~4.5 Months**

> Note: This timeline has been updated to prioritize the Student UI, manual payments, and 1-on-1 mentorship.

| # | Phase | Weeks | Duration |
|---|---|---|---|
| 1 | Foundation & Setup | 1 | 1 week |
| 2 | Authentication | 2–3 | 2 weeks |
| 3 | Student User Interface & Dashboard | 4-5 | 2 weeks |
| 4 | Batch & Enrollment Management | 6–7 | 2 weeks |
| 5 | Azure AD + Graph API Setup | 8–9 | 2 weeks |
| 6 | Calendar Sync + UI | 10–11 | 2 weeks |
| 7 | Live Sessions (Admin-driven) | 12–13 | 2 weeks |
| 8 | Recordings & Pre-recorded Video | 14 | 1 week |
| 9 | LMS Core (Courses, Progress, Assignments) | 15 | 1 week |
| 10 | Payments (Manual / Optional Razorpay) | 16 | 1 week |
| 11 | Quizzes + Certificates | 17 | 1 week |
| 12 | Admin Panel + Launch | 18 | 1 week |

---

## Phase Detail

### Phase 1 — Foundation & Setup (Week 1)
- Initialise Turborepo + pnpm monorepo
- Create shared types package (User, Course, Batch, Session…)
- Set up Prisma with full PostgreSQL schema
- Zod env validation, ESLint, Prettier, Husky
- Docker Compose for local dev (Postgres + Redis)

### Phase 2 — Authentication (Week 2–3)
- Email/password for students (bcrypt + JWT)
- Microsoft OAuth via MSAL.js + NextAuth for Admins & Instructors
- AES-256 token encryption in DB
- Role-based middleware (STUDENT / INSTRUCTOR / ADMIN)
- Token refresh background job

### Phase 3 — Student User Interface & Dashboard (Week 4–5)
- Build the core Student UI dashboard
- Integrate progression bar to track student progress
- 1-on-1 Mentorship Request feature (create ticket/email admin for assignment)
- Course catalogue and batch display

### Phase 4 — Batch & Enrollment Management (Week 6–7)
- Batch CRUD (create batch, link to course, assign instructor, set dates)
- Admin: enrollment request review (approve → assign to batch / reject)
- Instructor: view assigned batches and student lists
- Student: view batch sessions and materials after approval

### Phase 5 — Azure AD + Graph API Setup (Week 8–9)
- Register multi-tenant Azure AD app
- Configure permissions: `Calendars.Read`, `OnlineMeetings.ReadWrite`, `OnlineMeetingRecording.Read.All`, `CallRecords.Read.All`
- Build Graph API client module using Admin's stored token
- Test MS token exchange end-to-end

### Phase 6 — Calendar Sync + UI (Week 10–11)
- Poll `GET /me/calendarView` to fetch events into CalendarEvent table
- Calendar UI with monthly/weekly view
- Live Now badge logic
- Optional: Graph webhook for real-time sync (production)

### Phase 7 — Live Sessions / Admin-driven (Week 12–13)
- Admin session form → `POST /me/onlineMeetings` → stored against batch
- Join URL displayed to all students in the batch
- Graph webhook for Teams-created meetings (createdFrom: TEAMS)
- ngrok setup for local webhook testing

### Phase 8 — Recordings & Pre-recorded Video (Week 14)
- Pre-recorded video playback implementation
- Teams Recording sync (30 min after session ends)
- Store in Recording table; re-fetch on every play
- Video player with HLS/signed URL streaming

### Phase 9 — LMS Core (Courses, Progress, Assignments) (Week 15)
- Course CRUD (create, edit, publish, archive)
- Module, lesson, and assignment management
- Watched-seconds progress tracking update
- Assignment submission features

### Phase 10 — Payments (Manual / Optional Razorpay) (Week 16)
- Manual enrollment approval workflow
- Payment verification handled by admin manually
- Razorpay setup (optional/deferred)

### Phase 11 — Quizzes + Certificates (Week 17)
- Quiz builder per module (MCQ + short answer)
- Auto-grading and score recording
- Auto-issue PDF certificate on 100% course completion
- Certificate verification page (public URL)

### Phase 12 — Admin Panel + Launch (Week 18)
- Full admin dashboard: all courses, batches, users, ticket assignments
- Production deploy: Vercel (web) + EC2 (API) + Supabase (DB)
- DNS, SSL, monitoring (Sentry, Upstash)
- Load testing and security hardening
- Go live!

---

## Key Milestones

| Milestone | Target | Description |
|---|---|---|
| **Auth + Batch Shell Live** | End of Week 4 | Users can register/login, admins can create batches and assign instructors |
| **MS Calendar Integrated** | End of Week 6 | Calendar page shows MS Calendar events with Live Now badge |
| **Live Sessions + Recordings End-to-End** | End of Week 10 | Admin schedules Teams meeting for a batch; students join live; recordings auto-sync |
| **Full LMS Core Working** | End of Week 12 | Courses, modules, batches, enrollment approval, progress tracking all functional |
| **Payments Live** | End of Week 13 | Students pay → pending → admin approves → batch access granted |
| **Production Launch** | End of Week 17 | Full platform deployed; admin panels live; monitored and hardened |

---

## Progress Tracking

| Phase | Planned Start | Actual Start | Planned End | Actual End | Status |
|-------|-------------|-------------|------------|-----------|--------|
| 1 | Week 1 | Week 1 | Week 1 | Week 1 | ✅ Completed |
| 2 | Week 2 | Week 2 | Week 3 | Week 3 | ✅ Completed |
| 3 | Week 4 | — | Week 5 | — | 🔄 Pending |
| 4 | Week 6 | — | Week 7 | — | 🔄 Pending |
| 5 | Week 8 | — | Week 9 | — | 🔄 Pending |
| 6 | Week 10 | — | Week 11 | — | 🔄 Pending |
| 7 | Week 12 | — | Week 13 | — | 🔄 Pending |
| 8 | Week 14 | — | Week 14 | — | 🔄 Pending |
| 9 | Week 15 | — | Week 15 | — | 🔄 Pending |
| 10 | Week 16 | — | Week 16 | — | 🔄 Pending |
| 11 | Week 17 | — | Week 17 | — | 🔄 Pending |
| 12 | Week 18 | — | Week 18 | — | 🔄 Pending |
