# Mentorship Feature Documentation

> One-on-One Mentorship System for LMS Portal

---

## Overview

The Mentorship feature allows students to request personalized 1-on-1 sessions with instructors/mentors. Admin users can review requests, assign mentors, and schedule sessions which appear on the student's calendar.

---

## Flow Diagram

```
Student Dashboard
    → Clicks "Request 1-on-1 Session"
    → Fills form (topic, description, preferred date/time)
    → Submit request
    ↓
Admin Dashboard (Mentorship Management)
    → Sees new "OPEN" ticket
    → Assigns mentor from available instructors/admins
    → Schedules session (date/time + Teams URL)
    → Ticket status: SCHEDULED
    ↓
Student Calendar
    → Scheduled mentorship appears on calendar
    → Student can join via Teams link
    ↓
Admin
    → Marks session as COMPLETED after it ends
```

---

## Database Schema

### TicketStatus Enum
```prisma
enum TicketStatus {
  OPEN       // New request, pending admin review
  ASSIGNED   // Mentor assigned, not yet scheduled
  SCHEDULED  // Session scheduled with date/time
  COMPLETED  // Session completed
  CANCELLED  // Request cancelled
}
```

### MentorshipTicket Model
```prisma
model MentorshipTicket {
  id            String       @id @default(cuid())
  studentId     String
  mentorId      String?      // Assigned by admin
  title         String       // Topic/subject
  description   String       // Detailed request
  preferredDate DateTime?    // Student's preference
  preferredTime String?      // Student's preference
  scheduledAt   DateTime?    // Final scheduled time
  joinUrl       String?      // Teams meeting URL
  teamsMeetingId String?     // Microsoft Teams ID
  status        TicketStatus @default(OPEN)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  resolvedAt    DateTime?    // When completed/cancelled
  
  student       User         @relation("TicketStudent", fields: [studentId], references: [id])
  mentor        User?        @relation("TicketMentor", fields: [mentorId], references: [id])
}
```

---

## API Endpoints

### Student Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/mentorship/tickets` | Create new mentorship request | Student |
| GET | `/api/mentorship/tickets/my` | List my mentorship tickets | Student |

### Admin Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/mentorship/tickets` | List all tickets (with filters) | Admin |
| GET | `/api/mentorship/tickets/:id` | Get single ticket details | Admin |
| PATCH | `/api/mentorship/tickets/:id/assign` | Assign mentor to ticket | Admin |
| PATCH | `/api/mentorship/tickets/:id/schedule` | Schedule session | Admin |
| PATCH | `/api/mentorship/tickets/:id/complete` | Mark as completed | Admin |
| PATCH | `/api/mentorship/tickets/:id/cancel` | Cancel ticket | Admin |
| GET | `/api/mentorship/mentors` | List available mentors | Admin |
| GET | `/api/mentorship/stats` | Get mentorship statistics | Admin |

### Request/Response Examples

#### Create Ticket (Student)
```http
POST /api/mentorship/tickets
Content-Type: application/json

{
  "title": "Need help with React Hooks",
  "description": "I'm struggling to understand useEffect and useContext. Need guidance on best practices.",
  "preferredDate": "2025-01-20T00:00:00Z",
  "preferredTime": "afternoon"
}

Response:
{
  "success": true,
  "message": "Mentorship request submitted successfully",
  "ticket": {
    "id": "...",
    "title": "Need help with React Hooks",
    "status": "OPEN",
    "createdAt": "..."
  }
}
```

#### Assign Mentor (Admin)
```http
PATCH /api/mentorship/tickets/:id/assign
Content-Type: application/json

{
  "mentorId": "instructor_user_id"
}
```

#### Schedule Session (Admin)
```http
PATCH /api/mentorship/tickets/:id/schedule
Content-Type: application/json

{
  "scheduledAt": "2025-01-20T14:00:00Z",
  "joinUrl": "https://teams.microsoft.com/l/meetup-join/..."
}
```

---

## Frontend Components

### Student Components

| Component | Location | Description |
|-------------|----------|-------------|
| `MentorshipRequestModal` | `components/mentorship/MentorshipRequestModal.tsx` | Modal form for creating requests |
| `MentorshipTickets` | `components/mentorship/MentorshipTickets.tsx` | List of student's tickets |
| `MentorshipPage` | `app/(student)/mentorship/page.tsx` | Main mentorship page |

### Admin Components

| Component | Location | Description |
|-------------|----------|-------------|
| `AdminMentorshipPage` | `app/(admin)/mentorship/page.tsx` | Admin management panel |
| `TicketManageModal` | Inside admin page | Modal for managing individual tickets |

### Updated Components

| Component | Changes |
|-----------|---------|
| `Sidebar` | Added "1-on-1 Mentorship" navigation link |
| `Dashboard` | Added mentorship CTA section |
| `Calendar` | Integrated mentorship sessions into calendar view |

---

## UI Screens

### Student Mentorship Page

**Route:** `/student/mentorship`  
**File:** `apps/web/src/app/student/mentorship/page.tsx`

**Features:**
- Stats cards (Total, Pending, Scheduled, Completed requests)
- "Request Session" button opening modal
- List of all mentorship requests with status badges
- "How It Works" section (4-step process)
- Ticket detail modal showing:
  - Topic and description
  - Assigned mentor info
  - Scheduled session with join button
  - Preferred date/time

### Admin Mentorship Page

**Route:** `/admin/mentorship`  
**File:** `apps/web/src/app/admin/mentorship/page.tsx`

**Features:**
- Statistics dashboard (Total, Open, Assigned, Scheduled, Completed)
- Filter tabs (All, Pending, Assigned, Scheduled, Completed)
- Data table with columns:
  - Student name & email
  - Topic & description preview
  - Status badge
  - Assigned mentor
  - Submission date
  - Manage button
- Ticket management modal:
  - Step 1: Assign mentor from dropdown
  - Step 2: Schedule with date/time picker + Teams URL
  - Scheduled session info display
  - Complete/Cancel buttons

---

## Calendar Integration

Scheduled mentorship sessions appear on the student's calendar:

- **Color coding**: Green (`bg-success`) for mentorship sessions
- **Label**: Shows "1-on-1: [Topic]"
- **Join button**: Available when session is live
- **Mentor info**: Shows assigned mentor name

Implementation in `CalendarPage`:
```typescript
// Fetch both live sessions and mentorship tickets
const [sessionsRes, ticketsRes] = await Promise.all([
  fetch("/api/sessions"),
  fetch("/api/mentorship/tickets/my"),
]);

// Filter SCHEDULED tickets and add to calendar events
tickets
  .filter((t) => t.status === "SCHEDULED" && t.scheduledAt)
  .forEach((ticket) => {
    calendarEvents.push({
      id: `mentorship-${ticket.id}`,
      title: `1-on-1: ${ticket.title}`,
      color: "bg-success/20 border-success/30 text-success",
      type: "mentorship",
      // ...
    });
  });
```

---

## Workflow States

```
┌─────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  OPEN   │────→│ ASSIGNED  │────→│ SCHEDULED │────→│ COMPLETED │
│ (New)   │     │(Mentor    │     │(Time set) │     │ (Done)    │
│         │     │ assigned) │     │           │     │           │
└────┬────┘     └───────────┘     └─────┬─────┘     └───────────┘
     │                                  │
     │           ┌─────────────┐        │
     └──────────→│  CANCELLED  │←───────┘
                 │  (Closed)   │
                 └─────────────┘
```

---

## Permissions

| Action | Role Required |
|--------|---------------|
| Create ticket | STUDENT |
| View own tickets | STUDENT |
| View all tickets | ADMIN |
| Assign mentor | ADMIN |
| Schedule session | ADMIN |
| Complete/Cancel | ADMIN |
| View mentor list | ADMIN |

---

## Routing Structure

The mentorship feature uses Next.js 14+ App Router with named folders (no route groups):

```
app/
├── student/                    # Student section
│   ├── layout.tsx              # Student sidebar + header
│   ├── mentorship/
│   │   └── page.tsx            # /student/mentorship
│   ├── dashboard/
│   │   └── page.tsx            # /student/dashboard
│   └── calendar/
│       └── page.tsx            # /student/calendar
│
├── admin/                      # Admin section
│   ├── layout.tsx              # Admin sidebar + header
│   └── mentorship/
│       └── page.tsx            # /admin/mentorship
│
└── (instructor)/               # Optional: instructor section (route group)
```

**Note:** Folders without parentheses are used directly as URL segments:
- Student routes: `/student/mentorship`, `/student/dashboard`, `/student/calendar`
- Admin routes: `/admin/mentorship`

This avoids the "two parallel pages that resolve to the same path" error that occurs when using route groups like `(student)` and `(admin)` that don't contribute to the URL path.

---

## Build Configuration

### Font Loading (Turbopack)

The Inter font is configured in `layout.tsx` with `display: 'swap'` and fallbacks to prevent build failures when Google Fonts CDN is unavailable:

```typescript
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
```

### Turbopack Workspace Root

The workspace root is explicitly set in `next.config.ts`:

```typescript
turbopack: {
  root: "../../",
},
```

---

## Dependencies Status

All frontend dependencies are installed and ready.

### Check Installation

```bash
# From project root
pnpm install

# Or install from specific app
cd apps/web && npm install
```

### Key Dependencies

| Package | Version | Status |
|---------|---------|--------|
| next | 16.2.6 | ✓ Installed |
| react | 19.2.4 | ✓ Installed |
| tailwindcss | ^4 | ✓ Installed |
| @tailwindcss/postcss | ^4 | ✓ Installed |

### Workspace Dependencies

The project uses pnpm workspaces with local packages:
- `@lms/types` - Shared TypeScript types
- `@lms/config` - Shared configuration
- `@lms/utils` - Shared utilities

---

## Accessing Admin Pages

### How to Access

**Admin URL:** `http://localhost:3000/admin/mentorship`

### Requirements

1. **User with ADMIN role** - The user must have `role = ADMIN` in the database
2. **Authenticated session** - Must be logged in

### Creating an Admin User

```bash
# Using Prisma Studio (interactive)
cd apps/api && npx prisma studio

# Or direct SQL update
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Admin Navigation

The admin panel uses a separate sidebar (`AdminSidebar`) with admin-specific links:
- Dashboard: `/admin/dashboard`
- Mentorship: `/admin/mentorship`
- Courses: `/admin/courses`
- Users: `/admin/users`
- Batches: `/admin/batches`
- Live Sessions: `/admin/sessions`

### Student Navigation

Student routes are now prefixed with `/student/`:
- Dashboard: `/student/dashboard`
- Mentorship: `/student/mentorship`
- Calendar: `/student/calendar`
- etc.

---

## Future Enhancements

1. **Email Notifications**: Notify admin on new request, notify student on assignment/schedule
2. **Rescheduling**: Allow students to request reschedule
3. **Mentor Notes**: Add notes/feedback after session
4. **Recurring Sessions**: Option for weekly/bi-weekly recurring mentorship
5. **Mentor Ratings**: Student rating system for completed sessions
6. **Calendar Sync**: Add to Google/Outlook calendar via ICS

---

*Last updated: May 2026*
