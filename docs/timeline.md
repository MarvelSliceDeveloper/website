# LMS Portal — Revised Implementation Plan & Timeline

**11 Phases · 17 Weeks · ~4.5 Months**

> Note: This timeline has been updated to reflect the single-organisation, cohort/batch-based model with Admin-driven live sessions.

| # | Phase | Weeks | Duration |
|---|---|---|---|
| 1 | Foundation & Setup | 1 | 1 week |
| 2 | Authentication | 2–3 | 2 weeks |
| 3 | Batch & Enrollment Management | 3–4 | 2 weeks |
| 4 | Azure AD + Graph API Setup | 4–5 | 2 weeks |
| 5 | Calendar Sync + UI | 5–6 | 2 weeks |
| 6 | Live Sessions (Admin-driven) | 7–8 | 2 weeks |
| 7 | Recordings | 9–10 | 2 weeks |
| 8 | LMS Core (Courses, Progress, Dashboard) | 11–12 | 2 weeks |
| 9 | Payments (Razorpay) | 13 | 1 week |
| 10 | Quizzes + Certificates | 14–15 | 2 weeks |
| 11 | Admin Panel + Launch | 16–17 | 2 weeks |

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

### Phase 3 — Batch & Enrollment Management (Week 3–4)
- Batch CRUD (create batch, link to course, assign instructor, set dates)
- Admin: enrollment request review (approve → assign to batch / reject)
- Instructor: view assigned batches and student lists
- Student: view batch sessions and materials after approval

### Phase 4 — Azure AD + Graph API Setup (Week 4–5)
- Register multi-tenant Azure AD app
- Configure permissions: `Calendars.Read`, `OnlineMeetings.ReadWrite`, `OnlineMeetingRecording.Read.All`, `CallRecords.Read.All`
- Build Graph API client module using Admin's stored token
- Test MS token exchange end-to-end

### Phase 5 — Calendar Sync + UI (Week 5–6)
- Poll `GET /me/calendarView` to fetch events into CalendarEvent table
- Calendar UI with monthly/weekly view
- Live Now badge logic
- Optional: Graph webhook for real-time sync (production)

### Phase 6 — Live Sessions / Admin-driven (Week 7–8)
- Admin session form → `POST /me/onlineMeetings` → stored against batch
- Join URL displayed to all students in the batch
- Graph webhook for Teams-created meetings (createdFrom: TEAMS)
- ngrok setup for local webhook testing

### Phase 7 — Recordings (Week 9–10)
- Bull job triggers 30 min after session ends
- Fetch call records + SharePoint signed URL
- Store in Recording table; re-fetch on every play
- Video player with HLS/signed URL streaming
- Watched-seconds progress tracking

### Phase 8 — LMS Core (Week 11–12)
- Course CRUD (create, edit, publish, archive)
- Module and lesson management
- Student dashboard (batches, progress bars, upcoming sessions)
- Landing page with course catalogue

### Phase 9 — Payments (Week 13)
- `POST /payments/create-order` → Razorpay order
- Frontend Razorpay checkout widget
- Webhook → HMAC verify → create EnrollmentRequest (PENDING)
- Admin approval → batch assignment → course access granted

### Phase 10 — Quizzes + Certificates (Week 14–15)
- Quiz builder per module (MCQ + short answer)
- Auto-grading and score recording
- Auto-issue PDF certificate on 100% course completion
- Certificate verification page (public URL)

### Phase 11 — Admin Panel + Launch (Week 16–17)
- Full admin dashboard: all courses, batches, users, payments
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
| 3 | Week 3 | — | Week 4 | — | 🔄 Pending |
| 4 | Week 4 | — | Week 5 | — | 🔄 Pending |
| 5 | Week 5 | — | Week 6 | — | 🔄 Pending |
| 6 | Week 7 | — | Week 8 | — | 🔄 Pending |
| 7 | Week 9 | — | Week 10 | — | 🔄 Pending |
| 8 | Week 11 | — | Week 12 | — | 🔄 Pending |
| 9 | Week 13 | — | Week 13 | — | 🔄 Pending |
| 10 | Week 14 | — | Week 15 | — | 🔄 Pending |
| 11 | Week 16 | — | Week 17 | — | 🔄 Pending |
