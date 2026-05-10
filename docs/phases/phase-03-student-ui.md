# Phase 3 — Student User Interface & Dashboard

> ⏱️ **Duration**: Weeks 4–5 (2 weeks)  
> 📌 **Status**: Pending  
> 🔗 **Depends on**: Phase 2

---

## 🎯 Objective

Build the core Student User Interface and Dashboard, which will serve as the primary entry point for students. This phase prioritizes the student experience, allowing them to track their progress, view upcoming sessions, access pre-recorded videos, and request 1-on-1 mentorship.

---

## ✅ Tasks

### 3.1 — Student Dashboard Base

- [ ] Build the Student Dashboard layout (Sidebar, Header, Main Content Area)
- [ ] Implement responsive design for mobile and desktop views
- [ ] Create basic routing structure under `/(student)`
- [ ] Integrate authentication state to display user profile and logout options

### 3.2 — Progression Tracking

- [ ] Design and implement the **Progression Bar** component
- [ ] Connect the progression bar to mock or actual progress data (watched seconds, completed assignments)
- [ ] Display course completion status visually on the dashboard

### 3.3 — 1-on-1 Mentorship Requests

- [ ] Add a "Request 1-on-1 Session" button to the Student Dashboard
- [ ] Build a modal or form for students to provide details about their mentorship request
- [ ] Implement the backend logic to generate a "Ticket" (or notification/email) sent to Admins
- [ ] Admin notification system: Ensure Admins receive an email or dashboard alert when a new request is made
- [ ] Admin assignment flow: Allow Admin to assign a Mentor/Instructor to the request

### 3.4 — Course Catalogue & Batch Display

- [ ] Build the Course Catalogue (Landing/Browse page)
- [ ] Implement the Course Detail page with an "Enroll" Call to Action (CTA)
- [ ] On the Dashboard, display the student's currently enrolled batches
- [ ] For each batch, display upcoming live sessions and available materials (pre-recorded videos, assignments)

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Student Dashboard | Fully responsive layout with navigation |
| Progression Bar | Accurately reflects student completion status |
| 1-on-1 Request Flow | Student can submit request, Admin receives ticket |
| Course & Batch Display | Catalogue and enrolled batches are visible |

---

## 🧪 Tests to Write

- [ ] Unit: Progression bar calculates completion percentage correctly
- [ ] Unit: 1-on-1 request form validates input properly
- [ ] Integration: Submitting a 1-on-1 request creates a notification/ticket for Admins
- [ ] E2E: Student can navigate from dashboard to course details and see their batches
