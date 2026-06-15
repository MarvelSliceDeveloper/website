# Platform API Documentation

This document consolidates all REST API endpoints for the LMS platform.

<!-- Source: auth-api.md -->
## Authentication API Documentation

This document outlines the REST API endpoints created during Phase 2 for the authentication module.

### Base URL
`/api/auth`

---

### 1. Register User
Creates a new user via email and password within a specific tenant.

**Endpoint:** `POST /register`  
**Auth Required:** No  

#### Request Body (JSON)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Success Response (201 Created)
Returns tokens in the JSON response and sets an HTTP-only `accessToken` cookie.
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "userId": "uuid-1234",
    "role": "STUDENT",
    "email": "john@example.com"
  }
}
```

#### Error Responses
- **400 Bad Request:** Validation errors (e.g., weak password, invalid email).
- **400 Bad Request:** "Email already registered".

---

### 2. Login User
Authenticates a user and issues JWT tokens.

**Endpoint:** `POST /login`  
**Auth Required:** No  

#### Request Body (JSON)
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Success Response (200 OK)
Returns tokens in the JSON response and sets an HTTP-only `accessToken` cookie.
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "userId": "uuid-1234",
    "role": "STUDENT",
    "email": "john@example.com"
  }
}
```

#### Error Responses
- **401 Unauthorized:** "Invalid credentials".

---

### 3. Logout User
Clears the HTTP-only access token cookie.

**Endpoint:** `POST /logout`  
**Auth Required:** No  

#### Success Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

---

### Security Features Implemented

1. **Password Hashing**: Passwords are mathematically hashed using `bcryptjs` with 12 salt rounds before hitting the database.
2. **HTTP-Only Cookies**: JWTs are securely attached to cookies (`secure`, `samesite=strict`) so that frontend JS cannot be exploited to steal them.
3. **Role-Based Access Control**: `requireRole([UserRole.ADMIN])` middleware was created to effortlessly protect API endpoints.
4. **Token Encryption Module**: An `AES-256-GCM` encryption helper (`apps/api/src/utils/encryption.ts`) safely encrypts Microsoft Access/Refresh tokens before placing them into the Postgres DB.

---

### 4. Microsoft OAuth Login (Phase 4)
Redirects the administrator to the Microsoft Azure AD login page to link their account.

**Endpoint:** `GET /azure-ad/login`  
**Auth Required:** Yes (ADMIN)

#### Success Response (302 Redirect)
Redirects to `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...`

---

### 5. Microsoft OAuth Callback (Phase 4)
Handles the callback from Microsoft Azure AD, exchanges the authorization code for tokens, encrypts them, and saves them on the administrator's profile.

**Endpoint:** `GET /azure-ad/callback`  
**Auth Required:** No (Authorized via state validation)

#### Query Parameters
- `code`: The authorization code from Microsoft
- `state`: Encrypted LMS userId parameter

#### Success Response (302 Redirect)
Redirects the administrator back to their dashboard (`/admin/dashboard`).


---

<!-- Source: courses-admin-api.md -->
## Admin Courses API Documentation

Base URL: `/api/admin/courses`

### Upload Course Thumbnail
Uploads a thumbnail image for a course and stores it locally.

**Endpoint:** `POST /:id/thumbnail`
**Auth Required:** Yes (ADMIN)

**Content-Type:** `multipart/form-data`

**Form Data**
| Field | Type | Required | Description |
|------|------|----------|-------------|
| `thumbnail` | file | Yes | JPG, PNG, or WebP image (max 5 MB) |

**Success Response (200 OK)**
```json
{
  "thumbnailUrl": "http://localhost:4000/uploads/courses/uuid.jpg"
}
```

**Notes**
- Files are stored locally in `apps/api/uploads/courses`.
- Uploaded files are served from `/uploads`.

### Publish Course
Validates the publish checklist and publishes the course.

**Endpoint:** `POST /:id/publish`
**Auth Required:** Yes (ADMIN)

**Success Response (200 OK)**
```json
{
  "message": "Course published",
  "published": true,
  "checklist": [
    { "item": "Course has a title", "passed": true }
  ]
}
```

**Error Response (422 Unprocessable Entity)**
```json
{
  "error": "Course does not meet publish requirements",
  "checklist": [
    { "item": "Course has a title", "passed": false }
  ]
}
```


---

<!-- Source: calendar-api.md -->
## Calendar & Graph API Endpoints

This document describes the REST API endpoints for the Calendar Sync (Phase 5) and Microsoft Graph integration (Phase 4).

> **Full Graph integration guide:** See [MICROSOFT_GRAPH.md](./MICROSOFT_GRAPH.md) for Teams meeting creation, calendar sync, recording pipeline, webhooks, Azure AD setup, and troubleshooting.

### Base URLs
- Calendar: `/api/calendar`
- Webhooks: `/api/webhooks`

---

### Calendar Endpoints

#### 1. Get Calendar Events
Fetches calendar events from the local database within a date range.

**Endpoint:** `GET /api/calendar/events`  
**Auth Required:** Yes (JWT)

##### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | string (ISO 8601) | Yes | Start of the date range |
| `end` | string (ISO 8601) | Yes | End of the date range |

##### Success Response (200 OK)
```json
{
  "events": [
    {
      "id": "uuid",
      "msEventId": "AAMkAG...",
      "title": "Live Coding Session",
      "startAt": "2026-05-10T10:00:00.000Z",
      "endAt": "2026-05-10T11:00:00.000Z",
      "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
      "sessionId": "uuid-or-null",
      "session": {
        "id": "uuid",
        "courseId": "uuid",
        "joinUrl": "...",
        "scheduledAt": "...",
        "endedAt": null
      }
    }
  ]
}
```

##### Error Responses
- **400 Bad Request:** `start` and `end` query parameters are required.
- **401 Unauthorized:** Authentication required.

---

#### 2. Get Today's Events
Fetches all events for the current day with live status computed.

**Endpoint:** `GET /api/calendar/events/today`  
**Auth Required:** Yes (JWT)

##### Success Response (200 OK)
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Morning Lecture",
      "startAt": "2026-05-09T09:00:00.000Z",
      "endAt": "2026-05-09T10:00:00.000Z",
      "isLive": true,
      "session": { ... }
    }
  ]
}
```

---

#### 3. Get Live Sessions
Fetches only currently active (live) sessions. Uses a 15-minute buffer after the scheduled end time to account for sessions that run over.

**Endpoint:** `GET /api/calendar/live`  
**Auth Required:** Yes (JWT)

##### Success Response (200 OK)
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Live Workshop",
      "startAt": "2026-05-09T14:00:00.000Z",
      "endAt": "2026-05-09T15:00:00.000Z",
      "joinUrl": "https://teams.microsoft.com/...",
      "session": { ... }
    }
  ]
}
```

---

#### 4. Sync Calendar (Manual Trigger)
Manually triggers a Microsoft Calendar sync for the authenticated user. Pulls events from Microsoft Graph and upserts them into the local database.

**Endpoint:** `POST /api/calendar/sync`  
**Auth Required:** Yes (JWT)  
**Requires:** User must have a linked Microsoft account.

##### Request Body (JSON, optional)
```json
{
  "startDate": "2026-05-01T00:00:00.000Z",
  "endDate": "2026-06-01T00:00:00.000Z"
}
```
If omitted, syncs from now to 30 days ahead.

##### Success Response (200 OK)
```json
{
  "message": "Calendar sync completed",
  "created": 5,
  "updated": 2,
  "total": 7
}
```

##### Error Responses
- **400 Bad Request:** Microsoft account not linked.
- **401 Unauthorized:** Authentication required.

---

### Webhook Endpoints

#### 5. Microsoft Graph Calendar Webhook
Handles incoming change notifications from Microsoft Graph when a user's calendar changes. This endpoint is called directly by Microsoft, not by our frontend.

**Endpoint:** `POST /api/webhooks/calendar`  
**Auth Required:** No (security via `clientState` validation)

##### Validation Request (from Microsoft)
When a subscription is first created, Microsoft sends a GET/POST with a `validationToken` query parameter. The endpoint must echo it back as plain text.

**Query Parameter:** `validationToken=<token>`  
**Response:** `200 OK` with `text/plain` body containing the token.

##### Change Notification (from Microsoft)
```json
{
  "value": [
    {
      "subscriptionId": "uuid",
      "changeType": "created",
      "resource": "users/{msUserId}/events",
      "clientState": "secretClientValue"
    }
  ]
}
```

**Response:** `202 Accepted` (must respond within 3 seconds)

---

### Graph Module (Internal)

The following modules are internal and not exposed as REST endpoints. They are used by the calendar service and other backend modules.

| Module | Purpose |
|--------|---------|
| `graph.client.ts` | Authenticated Graph API client with retry logic (429, 503), token auto-refresh |
| `graph.auth.ts` | Token acquisition: delegated (per-user) and application (daemon) flows |
| `graph.calendar.ts` | `getCalendarView()`, `createCalendarEvent()` |
| `graph.meetings.ts` | `createOnlineMeeting()`, `getOnlineMeeting()` |
| `graph.recordings.ts` | `getCallRecords()`, `getMeetingRecordings()`, `getRecordingContent()` |
| `graph.subscriptions.ts` | `createSubscription()`, `renewSubscription()`, `deleteSubscription()` |
| `graph.users.ts` | `getMsUserProfile()` |

#### Error Handling
All Graph API errors are mapped to user-friendly messages:

| Graph Error Code | Friendly Message |
|-----------------|-----------------|
| `InvalidAuthenticationToken` | Your Microsoft session has expired. Please sign in again. |
| `ResourceNotFound` | The requested Microsoft resource could not be found. |
| `ErrorAccessDenied` | You do not have permission to perform this action. |
| `MailboxNotEnabledForRESTAPI` | Your Microsoft account mailbox is not enabled for the REST API. |
| `AuthenticationError` | Microsoft authentication failed. Please re-link your Microsoft account. |

#### Retry Strategy
| HTTP Status | Action | Max Retries |
|-------------|--------|------------|
| 401 | Refresh token, retry | 3 |
| 429 | Wait `Retry-After` header (or exponential backoff), retry | 3 |
| 503/504 | Exponential backoff, retry | 3 |
| Other | Throw immediately | 0 |


---

<!-- Source: recordings-api.md -->
## Recordings API Documentation

This document describes the REST API endpoints for Recording management and Progress tracking (Phase 7).

### Base URL
`/api/recordings`

---

### 1. List Recordings for a Course
Fetches all synced recordings for a specific course. Requires the user to be enrolled or the instructor.

**Endpoint:** `GET /api/recordings`  
**Auth Required:** Yes (JWT)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `courseId` | string (UUID) | Yes | Filter by course |

#### Success Response (200 OK)
```json
{
  "recordings": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "sharePointUrl": "...",
      "duration": 3600,
      "syncedAt": "2026-05-15T12:00:00Z",
      "session": {
        "id": "uuid",
        "scheduledAt": "...",
        "module": { "title": "Basics" }
      },
      "progress": [
        { "watchedSeconds": 1200, "completedAt": null }
      ]
    }
  ]
}
```

---

### 2. Get Recording Details
Fetches a single recording with full related data.

**Endpoint:** `GET /api/recordings/:id`  
**Auth Required:** Yes (JWT)

#### Success Response (200 OK)
```json
{
  "recording": {
    "id": "uuid",
    "teamsRecordingId": "...",
    "sharePointUrl": "...",
    "duration": 3600,
    "viewCount": 42,
    "session": { ... },
    "progress": [ ... ]
  }
}
```

---

### 3. Get Playback URL
Fetches a fresh, signed SharePoint download URL for the recording. Signed URLs expire in 1 hour.

**Endpoint:** `GET /api/recordings/:id/url`  
**Auth Required:** Yes (JWT)

#### Success Response (200 OK)
```json
{
  "url": "https://tenant.sharepoint.com/...&tempauth=...",
  "expiresAt": "2026-05-15T13:00:00Z"
}
```

---

### 4. Update Progress
Tracks the user's watch progress for a recording.

**Endpoint:** `POST /api/recordings/progress`  
**Auth Required:** Yes (JWT)

#### Request Body (JSON)
```json
{
  "recordingId": "uuid",
  "watchedSeconds": 1500
}
```

#### Success Response (200 OK)
```json
{
  "progress": {
    "id": "uuid",
    "userId": "uuid",
    "recordingId": "uuid",
    "watchedSeconds": 1500,
    "completedAt": "2026-05-15T14:00:00Z" // If threshold reached
  }
}
```
**Note:** Completion is automatically triggered at 90% watch threshold.

---

### 5. Manual Sync (Admin/Instructor Only)
Manually triggers a sync for a specific session's recording.

**Endpoint:** `POST /api/recordings/:sessionId/sync`  
**Auth Required:** Yes (JWT)  
**Role Required:** INSTRUCTOR or ADMIN

#### Success Response (200 OK)
```json
{
  "message": "Recording synced successfully",
  "recording": { ... }
}
```

#### Error Responses
- **404 Not Found:** Recording not available in Microsoft Teams yet.


---

<!-- Source: sessions-api.md -->
## Live Sessions API Documentation

This document describes the REST API endpoints for Live Sessions management (Phase 6).

### Base URL
`/api/sessions`

---

### 1. Create Session
Creates a new live session by scheduling a Microsoft Teams meeting via Graph API.

**Endpoint:** `POST /api/sessions`  
**Auth Required:** Yes (JWT)  
**Role Required:** INSTRUCTOR or ADMIN

#### Request Body (JSON)
```json
{
  "courseId": "uuid",
  "moduleId": "uuid",
  "title": "Introduction to TypeScript",
  "startDateTime": "2026-05-15T10:00:00.000Z",
  "endDateTime": "2026-05-15T11:00:00.000Z"
}
```

#### Success Response (201 Created)
```json
{
  "session": {
    "id": "uuid",
    "courseId": "uuid",
    "moduleId": "uuid",
    "teamsMeetingId": "MSTeams-meeting-id",
    "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
    "scheduledAt": "2026-05-15T10:00:00.000Z",
    "createdFrom": "LMS"
  }
}
```

#### Error Responses
- **400 Bad Request:** Validation errors (Zod).
- **403 Forbidden:** User is not the instructor for this course.
- **409 Conflict:** A session is already scheduled during this time.
- **401 Unauthorized:** Authentication required.

---

### 2. List Sessions
Lists sessions with optional filters.

**Endpoint:** `GET /api/sessions`  
**Auth Required:** Yes (JWT)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `courseId` | string (UUID) | No | Filter by course |
| `status` | string | No | `scheduled`, `live`, `completed`, or `cancelled` |

#### Success Response (200 OK)
```json
{
  "sessions": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "scheduledAt": "2026-05-15T10:00:00.000Z",
      "createdFrom": "LMS",
      "course": { "id": "uuid", "title": "TypeScript Mastery" },
      "module": { "id": "uuid", "title": "Basics" },
      "recording": null
    }
  ]
}
```

---

### 3. Get Session Details
Fetches a single session with full related data.

**Endpoint:** `GET /api/sessions/:id`  
**Auth Required:** Yes (JWT)

#### Success Response (200 OK)
```json
{
  "session": {
    "id": "uuid",
    "teamsMeetingId": "...",
    "joinUrl": "https://teams.microsoft.com/...",
    "scheduledAt": "...",
    "endedAt": null,
    "createdFrom": "LMS",
    "course": { "id": "...", "title": "...", "instructorId": "..." },
    "module": { "id": "...", "title": "..." },
    "recording": null,
    "calendarEvents": [...]
  }
}
```

#### Error Responses
- **404 Not Found:** Session not found.

---

### 4. Update Session
Updates the schedule of a session. Only the course instructor can do this.

**Endpoint:** `PATCH /api/sessions/:id`  
**Auth Required:** Yes (JWT)  
**Role Required:** INSTRUCTOR or ADMIN

#### Request Body (JSON)
```json
{
  "title": "Updated Title",
  "startDateTime": "2026-05-16T10:00:00.000Z",
  "endDateTime": "2026-05-16T11:00:00.000Z"
}
```
All fields are optional.

#### Success Response (200 OK)
```json
{
  "session": { ... }
}
```

#### Error Responses
- **403 Forbidden:** Only the instructor can update this session.
- **404 Not Found:** Session not found.

---

### 5. Cancel Session
Cancels a session by setting `endedAt` to the current time (soft delete). Only the course instructor can cancel.

**Endpoint:** `DELETE /api/sessions/:id`  
**Auth Required:** Yes (JWT)  
**Role Required:** INSTRUCTOR or ADMIN

#### Success Response (200 OK)
```json
{
  "message": "Session cancelled",
  "session": { ... }
}
```

#### Error Responses
- **403 Forbidden:** Only the instructor can cancel this session.
- **404 Not Found:** Session not found.

---

### 6. Get Session Attendance
Fetches attendance records for a specific session.

**Endpoint:** `GET /api/sessions/:id/attendance`  
**Auth Required:** Yes (JWT)  
**Role Required:** INSTRUCTOR or ADMIN

#### Success Response (200 OK)
```json
{
  "attendance": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "userId": "uuid",
      "joinedAt": "2026-05-15T10:02:00.000Z",
      "leftAt": "2026-05-15T10:58:00.000Z"
    }
  ]
}
```

---

### Webhook: Teams-Created Meetings

#### POST /api/webhooks/events
Handles Microsoft Graph webhook notifications when meetings are created, updated, or deleted directly in Teams.

**Auth Required:** No (security via `clientState` validation)

**Behavior:**
- `created`: Fetches the event details from Graph API. If it's a Teams online meeting, creates a `LiveSession` with `createdFrom: 'TEAMS'` and a `CalendarEvent`.
- `updated`: Updates the existing session's schedule and calendar event.
- `deleted`: Marks the linked `LiveSession` as ended and removes the `CalendarEvent`.

**Idempotency:** Uses `teamsMeetingId` as a unique key — will not create duplicate sessions.

**Validation Request:** Echoes back the `validationToken` query parameter as plain text (required by Microsoft on subscription creation).


---

<!-- Source: phase-03-student-ui.md -->
## Phase 3 Student UI API Contract

This appendix maps the student dashboard screens to the request helper in `apps/web/src/lib/api.ts` and the backend endpoints already mounted in the API server.

### Request Layer

- Base URL: `NEXT_PUBLIC_API_URL` or `http://localhost:4000`
- Browser requests include cookies via `credentials: "include"`
- JSON is the default payload format for `POST` and `PATCH`
- Non-2xx responses are normalized into thrown `Error` values in the web client

### Student-Facing Endpoints

| Screen | Method | Endpoint | Purpose |
|---|---|---|---|
| Login | POST | `/api/auth/login` | Authenticate student and set session cookie |
| Dashboard live widget | GET | `/api/calendar/live` | Load current live sessions |
| Dashboard today widget | GET | `/api/calendar/events/today` | Load today’s events |
| Course live sessions | GET | `/api/sessions?courseId=...` | Load sessions for one course |
| Recorded videos list | GET | `/api/recordings?courseId=...` | Load synced recordings |
| Recorded playback URL | GET | `/api/recordings/:id/url` | Refresh signed playback link |
| Video progress tracking | POST | `/api/recordings/progress` | Persist watch progress |
| Mentorship list | GET | `/api/mentorship/tickets/my` | Load student mentorship tickets |
| Mentorship create | POST | `/api/mentorship/tickets` | Submit a new mentorship request |
| Calendar sync | POST | `/api/calendar/sync` | Refresh Microsoft calendar data |
| Enrolled courses | GET | `/api/courses/enrolled` | Load student's enrolled courses and status |
| Course catalogue | GET | `/api/courses/catalogue` | Load student's browseable catalogue courses |

### Example Requests

```ts
await api.post('/api/mentorship/tickets', {
  title: 'Need help with model evaluation',
  description: 'I want help choosing and interpreting metrics for my classification project.',
  preferredDate: '2026-05-20',
  preferredTime: 'evening',
});
```

```ts
await api.post('/api/recordings/progress', {
  recordingId: 'uuid',
  watchedSeconds: 1500,
});
```

### Response Expectations

- `200` or `201` for successful reads and creates
- `400` for validation errors
- `401` when the auth cookie is missing or invalid
- `403` when the user is authenticated but not allowed to perform the action
- `404` when the resource does not exist


---

## Full API Route Map (All Endpoints)

This section lists every REST endpoint in the platform organized by module. All endpoints are prefixed with the API base URL (`http://localhost:4000` by default).

### Legend
| Column | Meaning |
|--------|---------|
| Method | HTTP verb |
| Path | Full URL path (relative to base URL) |
| Auth | Authentication & role requirements |
| Description | What the endpoint does |

---

### 1. Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT + sets cookie |
| POST | `/api/auth/logout` | None | Clears auth cookie |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/auth/azure-ad/login` | JWT (ADMIN) | Redirect to Microsoft OAuth |
| GET | `/api/auth/azure-ad/callback` | None | Microsoft OAuth callback |

---

### 2. Calendar — `/api/calendar`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/calendar/events?start=&end=` | JWT | List calendar events in date range |
| GET | `/api/calendar/events/today` | JWT | Get today's events with live status |
| GET | `/api/calendar/live` | JWT | Get currently live sessions |
| POST | `/api/calendar/sync` | JWT | Manually trigger Microsoft calendar sync |

---

### 3. Sessions — `/api/sessions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sessions/` | JWT (INSTRUCTOR/ADMIN) | Create session + Teams meeting |
| GET | `/api/sessions/` | JWT | List sessions (filters: `courseId`, `status`) |
| GET | `/api/sessions/:id` | JWT | Get session details |
| PATCH | `/api/sessions/:id` | JWT (INSTRUCTOR/ADMIN) | Update session schedule |
| DELETE | `/api/sessions/:id` | JWT (INSTRUCTOR/ADMIN) | Cancel session (soft delete) |

---

### 4. Recordings — `/api/recordings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/recordings/?courseId=` | JWT | List recordings for a course |
| GET | `/api/recordings/:id` | JWT | Get recording details |
| GET | `/api/recordings/:id/url` | JWT | Get signed playback URL |
| POST | `/api/recordings/progress` | JWT | Update watch progress |
| POST | `/api/recordings/:sessionId/sync` | JWT (INSTRUCTOR/ADMIN) | Manually sync recording |

---

### 5. Mentorship — `/api/mentorship`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/mentorship/tickets` | JWT (STUDENT) | Create mentorship ticket |
| GET | `/api/mentorship/tickets/my` | JWT (STUDENT) | List my tickets |
| GET | `/api/mentorship/tickets` | JWT (ADMIN) | List all tickets |
| GET | `/api/mentorship/tickets/:id` | JWT | Get ticket details |
| GET | `/api/mentorship/mentors` | JWT (ADMIN) | List available mentors |
| GET | `/api/mentorship/stats` | JWT (ADMIN) | Get mentorship stats |
| PATCH | `/api/mentorship/tickets/:id/assign` | JWT (ADMIN) | Assign mentor to ticket |
| PATCH | `/api/mentorship/tickets/:id/schedule` | JWT (ADMIN) | Schedule mentorship session |
| PATCH | `/api/mentorship/tickets/:id/complete` | JWT (ADMIN) | Complete ticket |
| PATCH | `/api/mentorship/tickets/:id/cancel` | JWT (ADMIN) | Cancel ticket |

---

### 6. Admin Courses — `/api/admin/courses`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/courses/` | JWT (ADMIN/INSTRUCTOR) | List courses |
| POST | `/api/admin/courses/` | JWT (ADMIN/INSTRUCTOR) | Create course |
| GET | `/api/admin/courses/:id` | JWT (ADMIN/INSTRUCTOR) | Get course details |
| PUT | `/api/admin/courses/:id` | JWT (ADMIN/INSTRUCTOR) | Update course |
| DELETE | `/api/admin/courses/:id` | JWT (ADMIN/INSTRUCTOR) | Delete course |
| POST | `/api/admin/courses/:id/thumbnail` | JWT (ADMIN/INSTRUCTOR) | Upload thumbnail (multipart) |
| POST | `/api/admin/courses/:id/publish` | JWT (ADMIN/INSTRUCTOR) | Publish course |
| POST | `/api/admin/courses/:id/unpublish` | JWT (ADMIN/INSTRUCTOR) | Unpublish course |
| POST | `/api/admin/courses/:id/modules` | JWT (ADMIN/INSTRUCTOR) | Add module |
| PATCH | `/api/admin/courses/:id/modules/reorder` | JWT (ADMIN/INSTRUCTOR) | Reorder modules |
| PUT | `/api/admin/courses/modules/:id` | JWT (ADMIN/INSTRUCTOR) | Update module |
| DELETE | `/api/admin/courses/modules/:id` | JWT (ADMIN/INSTRUCTOR) | Delete module |
| POST | `/api/admin/courses/:courseId/modules/:id/resources` | JWT (ADMIN/INSTRUCTOR) | Upload module resource (multipart) |
| DELETE | `/api/admin/courses/modules/:id/resources/:resourceId` | JWT (ADMIN/INSTRUCTOR) | Delete module resource |

---

### 7. Admin Batches — `/api/admin/batches`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/batches/` | JWT (ADMIN/INSTRUCTOR) | List batches |
| POST | `/api/admin/batches/` | JWT (ADMIN) | Create batch |
| GET | `/api/admin/batches/:id` | JWT (ADMIN/INSTRUCTOR) | Get batch details |
| PUT | `/api/admin/batches/:id` | JWT (ADMIN) | Update batch |
| DELETE | `/api/admin/batches/:id` | JWT (ADMIN) | Delete batch |
| GET | `/api/admin/batches/instructors` | JWT (ADMIN/INSTRUCTOR) | List instructors |
| GET | `/api/admin/batches/courses` | JWT (ADMIN/INSTRUCTOR) | List courses for batch assignment |
| GET | `/api/admin/batches/:id/students` | JWT (ADMIN/INSTRUCTOR) | List students in batch |
| POST | `/api/admin/batches/:id/students` | JWT (ADMIN) | Add students to batch |
| DELETE | `/api/admin/batches/:id/students/:uid` | JWT (ADMIN) | Remove student from batch |

---

### 8. Student Batches — `/api/batches`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/batches/:id` | JWT | Get batch details (student view) |

---

### 9. Student Courses — `/api/courses`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/courses/enrolled` | JWT | List enrolled courses with progress |
| GET | `/api/courses/catalogue` | JWT | Browse published courses |
| POST | `/api/courses/enroll` | JWT | Submit enrollment request |
| GET | `/api/courses/:courseId/content` | JWT | Get course content (enrolled only) |

---

### 10. Student Portal — `/api/student`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/student/assignments/overdue` | JWT (STUDENT) | List overdue assignments |
| GET | `/api/student/continue-learning` | JWT (STUDENT) | Get continue-learning suggestions |

---

### 11. Assignments — `/api/assignments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/assignments/` | JWT (ADMIN/INSTRUCTOR) | Create assignment |
| POST | `/api/assignments/upload-pdf` | JWT (ADMIN/INSTRUCTOR) | Upload question PDF (multipart, field: `questionPdf`) |
| GET | `/api/assignments/` | JWT | List assignments |
| GET | `/api/assignments/:id/questions` | JWT | Get assignment questions |
| POST | `/api/assignments/:id/submit/mcq` | JWT (STUDENT) | Submit MCQ answers |
| POST | `/api/assignments/:id/submit/file` | JWT (STUDENT) | Submit file answer (multipart) |
| GET | `/api/assignments/submissions/:submissionId/result` | JWT | Get submission result |
| GET | `/api/assignments/:id/submissions` | JWT (ADMIN/INSTRUCTOR) | List all submissions for assignment |
| POST | `/api/assignments/submissions/:submissionId/grade` | JWT (ADMIN/INSTRUCTOR) | Grade a submission |

---

### 12. Attendance — `/api/attendance`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/attendance/:sessionId/join` | JWT | Join session (mark attendance) |
| GET | `/api/attendance/:sessionId` | JWT (ADMIN/INSTRUCTOR) | Get session attendance records |

---

### 13. Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/` | JWT | List my notifications |
| PATCH | `/api/notifications/:id/read` | JWT | Mark notification as read |
| POST | `/api/notifications/read-all` | JWT | Mark all notifications as read |

---

### 14. Admin Enrollments — `/api/admin/enrollments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/enrollments/` | JWT (ADMIN) | List enrollment requests (with filters) |
| PATCH | `/api/admin/enrollments/:id/approve` | JWT (ADMIN) | Approve enrollment + assign batch |
| PATCH | `/api/admin/enrollments/:id/reject` | JWT (ADMIN) | Reject enrollment |

---

### 15. Admin Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/` | JWT (ADMIN) | List all users |
| POST | `/api/users/` | JWT (ADMIN) | Create user |

---

### 16. Admin Dashboard — `/api/admin/dashboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard/stats` | JWT (ADMIN) | Get dashboard statistics |

---

### 17. Webhooks (Unauthenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/calendar` | None | Microsoft Graph calendar change notifications |
| POST | `/api/webhooks/events` | None | Microsoft Teams meeting webhook events |

---

### 18. System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check — returns `{ status: "ok", timestamp }` |

---

### 19. Static Files

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/uploads/*` | None | Serve uploaded files (thumbnails, resources, PDFs) |

---

### 20. Certificates — `/api/certificates` ⚠️

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| None | *(router has no registered routes)* | — | Controller & service exist but endpoints are not wired |

> **Note:** The certificate router is mounted at `/api/certificates` but contains zero route definitions. The `certificate.controller.ts` and `certificate.service.ts` are fully implemented but unreachable via API.

---

### Postman/Insomnia Route Summary

Below is every route grouped by module for quick reference when setting up test collections:

```
AUTH
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me
  GET    /api/auth/azure-ad/login
  GET    /api/auth/azure-ad/callback

CALENDAR
  GET    /api/calendar/events?start=&end=
  GET    /api/calendar/events/today
  GET    /api/calendar/live
  POST   /api/calendar/sync

SESSIONS
  POST   /api/sessions/
  GET    /api/sessions/
  GET    /api/sessions/:id
  PATCH  /api/sessions/:id
  DELETE /api/sessions/:id

RECORDINGS
  GET    /api/recordings/?courseId=
  GET    /api/recordings/:id
  GET    /api/recordings/:id/url
  POST   /api/recordings/progress
  POST   /api/recordings/:sessionId/sync

MENTORSHIP
  POST   /api/mentorship/tickets
  GET    /api/mentorship/tickets/my
  GET    /api/mentorship/tickets
  GET    /api/mentorship/tickets/:id
  GET    /api/mentorship/mentors
  GET    /api/mentorship/stats
  PATCH  /api/mentorship/tickets/:id/assign
  PATCH  /api/mentorship/tickets/:id/schedule
  PATCH  /api/mentorship/tickets/:id/complete
  PATCH  /api/mentorship/tickets/:id/cancel

ADMIN COURSES
  GET    /api/admin/courses/
  POST   /api/admin/courses/
  GET    /api/admin/courses/:id
  PUT    /api/admin/courses/:id
  DELETE /api/admin/courses/:id
  POST   /api/admin/courses/:id/thumbnail
  POST   /api/admin/courses/:id/publish
  POST   /api/admin/courses/:id/unpublish
  POST   /api/admin/courses/:id/modules
  PATCH  /api/admin/courses/:id/modules/reorder
  PUT    /api/admin/courses/modules/:id
  DELETE /api/admin/courses/modules/:id
  POST   /api/admin/courses/:courseId/modules/:id/resources
  DELETE /api/admin/courses/modules/:id/resources/:resourceId

ADMIN BATCHES
  GET    /api/admin/batches/
  POST   /api/admin/batches/
  GET    /api/admin/batches/:id
  PUT    /api/admin/batches/:id
  DELETE /api/admin/batches/:id
  GET    /api/admin/batches/instructors
  GET    /api/admin/batches/courses
  GET    /api/admin/batches/:id/students
  POST   /api/admin/batches/:id/students
  DELETE /api/admin/batches/:id/students/:uid

STUDENT BATCHES
  GET    /api/batches/:id

STUDENT COURSES
  GET    /api/courses/enrolled
  GET    /api/courses/catalogue
  POST   /api/courses/enroll
  GET    /api/courses/:courseId/content

STUDENT PORTAL
  GET    /api/student/assignments/overdue
  GET    /api/student/continue-learning

ASSIGNMENTS
  POST   /api/assignments/
  POST   /api/assignments/upload-pdf
  GET    /api/assignments/
  GET    /api/assignments/:id/questions
  POST   /api/assignments/:id/submit/mcq
  POST   /api/assignments/:id/submit/file
  GET    /api/assignments/submissions/:submissionId/result
  GET    /api/assignments/:id/submissions
  POST   /api/assignments/submissions/:submissionId/grade

ATTENDANCE
  POST   /api/attendance/:sessionId/join
  GET    /api/attendance/:sessionId

NOTIFICATIONS
  GET    /api/notifications/
  PATCH  /api/notifications/:id/read
  POST   /api/notifications/read-all

ADMIN ENROLLMENTS
  GET    /api/admin/enrollments/
  PATCH  /api/admin/enrollments/:id/approve
  PATCH  /api/admin/enrollments/:id/reject

ADMIN USERS
  GET    /api/users/
  POST   /api/users/

ADMIN DASHBOARD
  GET    /api/admin/dashboard/stats

WEBHOOKS
  POST   /api/webhooks/calendar
  POST   /api/webhooks/events

SYSTEM
  GET    /health

STATIC
  GET    /uploads/*

CERTIFICATES ⚠️ (not wired)
  <empty>
```

---

## Platform API Testing Guide (Postman / Insomnia)

This section explains how to set up an API testing environment (like Postman or Insomnia) to test the LMS platform endpoints without needing a custom frontend.

### 1. Environment Setup
To test effectively, you should create a new **Environment** in Postman and define the following variables. This allows you to chain requests without manually copying and pasting IDs.

| Variable | Description | Initial Value |
|---|---|---|
| `baseUrl` | The base URL of your API (e.g., `http://localhost:4000`). | `http://localhost:4000` |
| `accessToken` | The JWT token received from login. | *Leave blank initially* |
| `courseId` | A Course ID for creating sessions or getting recordings. | *Leave blank initially* |
| `moduleId` | A Module ID for scheduling sessions. | *Leave blank initially* |
| `sessionId` | A Session ID returned from the Create Session endpoint. | *Leave blank initially* |
| `recordingId` | A Recording ID returned from the List Recordings endpoint. | *Leave blank initially* |

---

### 2. Authentication Flow

Most endpoints are secured via JWT. You must authenticate first.

#### Step 2.1: Register a Test Student/User
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```

#### Step 2.2: Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```
- **Action:** Copy the `accessToken` from the JSON response and save it as your `accessToken` environment variable.

---

### 3. Global Authorization Setup
For all the requests below, configure your Postman authorization settings:
- **Type:** Bearer Token
- **Token:** `{{accessToken}}`

---

### 4. Testing Calendar Endpoints

#### Get Calendar Events
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/calendar/events?start=2026-05-01T00:00:00.000Z&end=2026-06-01T00:00:00.000Z`
- *Note:* Adjust dates to fall within your testing timeframe.

#### Get Live Sessions (Currently Active)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/calendar/live`

---

### 5. Testing Live Sessions Endpoints
*(Requires `courseId` and `moduleId` to be set in your environment if you already have them in your DB)*

#### Create Session
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/sessions`
- **Body (JSON):**
  ```json
  {
    "courseId": "{{courseId}}",
    "moduleId": "{{moduleId}}",
    "title": "Postman Test Session",
    "startDateTime": "2026-05-15T10:00:00.000Z",
    "endDateTime": "2026-05-15T11:00:00.000Z"
  }
  ```
- **Action:** When this returns a 201 Created, copy `session.id` to your `sessionId` environment variable.

#### Get Session Details
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/sessions/{{sessionId}}`

#### Cancel Session
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/sessions/{{sessionId}}`

---

### 6. Testing Recordings Endpoints
*(These endpoints return data only if your session has synced recordings)*

#### List Course Recordings
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/recordings?courseId={{courseId}}`
- **Action:** Copy `recordings[0].id` to your `recordingId` environment variable.

#### Get Playback URL
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/recordings/{{recordingId}}/url`

#### Update Watch Progress
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/recordings/progress`
- **Body (JSON):**
  ```json
  {
    "recordingId": "{{recordingId}}",
    "watchedSeconds": 60
  }
  ```

---

### Important Note on Microsoft Graph
Standard authentication (Step 2) works locally. However, if your test user isn't linked to a Microsoft Account, hitting endpoints that interact directly with Azure (like `POST /api/calendar/sync` or creating MS Teams sessions via `POST /api/sessions`) will return authorization errors. To test those, you must go through the frontend OAuth flow first to link the account.


