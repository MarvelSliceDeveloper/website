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
Redirects the user to the Microsoft Azure AD login page.

**Endpoint:** `GET /azure-ad/login`  
**Auth Required:** No

#### Success Response (302 Redirect)
Redirects to `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...`

---

### 5. Microsoft OAuth Callback (Phase 4)
Handles the callback from Microsoft Azure AD, exchanges the code for tokens, encrypts the tokens, and creates or updates the user profile.

**Endpoint:** `GET /azure-ad/callback`  
**Auth Required:** No

#### Query Parameters
- `code`: The authorization code from Microsoft
- `state`: Optional CSRF token

#### Success Response (302 Redirect)
Sets JWT access token in HTTP-only cookies and redirects to the frontend dashboard.


---

<!-- Source: calendar-api.md -->
## Calendar & Graph API Endpoints

This document describes the REST API endpoints for the Calendar Sync (Phase 5) and Microsoft Graph integration (Phase 4).

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

