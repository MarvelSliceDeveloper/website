# Microsoft Graph API Integration

This document describes how the LMS uses **Microsoft Graph** for Teams meetings, calendar sync, recordings, and webhooks.

**Source code:** `apps/api/src/modules/graph/`

The web app never calls Graph directly. It uses LMS REST endpoints (`POST /api/sessions`, `GET /api/calendar/events`, etc.), and the API calls Graph on the backend.

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Creating Teams meetings (LMS → Teams)](#creating-teams-meetings-lms--teams)
4. [Calendar sync](#calendar-sync)
5. [Recording sync](#recording-sync)
6. [Webhooks (Teams → LMS)](#webhooks-teams--lms)
7. [Graph API endpoint reference](#graph-api-endpoint-reference)
8. [LMS REST API mapping](#lms-rest-api-mapping)
9. [Azure AD app registration](#azure-ad-app-registration)
10. [Environment variables](#environment-variables)
11. [Database fields](#database-fields)
12. [Known gaps and limitations](#known-gaps-and-limitations)
13. [Troubleshooting](#troubleshooting)

---

## Architecture overview

```
┌─────────────────┐     REST      ┌──────────────────┐     fetch      ┌─────────────────────────┐
│  Next.js Web    │ ────────────► │  Express API     │ ─────────────► │  graph.microsoft.com    │
│  (instructor/   │               │  modules/graph/  │                │  /v1.0                  │
│   admin UI)     │               │  session.service │                └─────────────────────────┘
└─────────────────┘               │  calendar.service│
                                  │  recording.service│
                                  └──────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  PostgreSQL      │
                                  │  LiveSession     │
                                  │  CalendarEvent   │
                                  │  Recording       │
                                  │  User (MS tokens)│
                                  └──────────────────┘
```

### Module layout

| File | Responsibility |
|------|----------------|
| `graph.client.ts` | HTTP client to `https://graph.microsoft.com/v1.0` with retries (401 refresh, 429/503 backoff) |
| `graph.auth.ts` | Delegated user tokens + application (`client_credentials`) tokens |
| `graph.meetings.ts` | Create/read Teams online meetings |
| `graph.calendar.ts` | Read calendar view, create Outlook events (create is unused in flows) |
| `graph.recordings.ts` | List meeting recordings, resolve playback URLs |
| `graph.subscriptions.ts` | Create/renew/delete Graph change subscriptions |
| `graph.users.ts` | Fetch `/me` profile (defined, not wired to routes yet) |

There is **no Microsoft Graph SDK** in this project — all calls use native `fetch`.

---

## Authentication

Graph supports two auth modes in this codebase.

### 1. Delegated (per-user)

Used for: creating meetings, calendar sync, recordings, fetching event details in webhooks.

- Tokens are stored on the `User` row: `msAccessToken`, `msRefreshToken`, `msUserId`
- Tokens are encrypted at rest with **AES-256-GCM** (`apps/api/src/utils/encryption.ts`)
- `GraphClient({ userId })` loads the user's access token
- On **401**, the client automatically calls `refreshMsTokenForUser()` and retries (up to 3 times)

**Token refresh endpoint:**

```
POST https://login.microsoftonline.com/common/oauth2/v2.0/token
```

**Scopes requested on refresh** (`graph.auth.ts`):

```
openid profile email offline_access Calendars.ReadWrite OnlineMeetings.ReadWrite User.Read
```

### 2. Application (daemon / client credentials)

Used for: Graph subscriptions (`createSubscription`, `renewSubscription`, `deleteSubscription`) and call-record helpers.

- `GraphClient({ useAppToken: true })` calls `getAppToken()`
- Token URL: `https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token`
- Scope: `https://graph.microsoft.com/.default`

### OAuth linking requirement

For delegated flows to work, the instructor/admin who schedules sessions must have a **linked Microsoft account** (tokens on their `User` record).

Token refresh is implemented, but the full Azure AD login/callback flow to initially obtain tokens may need to be completed separately. Without linked tokens, Graph calls fail and session creation falls back to placeholder URLs (see below).

---

## Creating Teams meetings (LMS → Teams)

### User flow

1. Instructor or admin opens **Sessions** in the web app
2. UI calls `POST /api/sessions`
3. `sessionService.createSession()` runs

### Request body (LMS)

```json
{
  "batchId": "cuid",
  "moduleId": "cuid (optional)",
  "title": "Week 3 — Live Class",
  "startDateTime": "2026-06-15T10:00:00.000Z",
  "endDateTime": "2026-06-15T11:30:00.000Z",
  "customJoinUrl": "optional — skip Graph if provided",
  "instructorOverride": "optional user id"
}
```

### Graph call (when `customJoinUrl` is empty)

**Function:** `createOnlineMeeting(userId, data)` in `graph.meetings.ts`

**Graph endpoint:**

```
POST https://graph.microsoft.com/v1.0/me/onlineMeetings
```

**Payload sent to Graph:**

```json
{
  "subject": "{batch.name} — {title}",
  "startDateTime": "2026-06-15T10:00:00.000Z",
  "endDateTime": "2026-06-15T11:30:00.000Z"
}
```

**Response fields used:**

| Graph field | Stored as |
|-------------|-----------|
| `id` | `LiveSession.teamsMeetingId` |
| `joinWebUrl` | `LiveSession.joinUrl` |

### What gets saved locally

| Table | Notes |
|-------|-------|
| `LiveSession` | `createdFrom: 'LMS'` (or `'LMS_CUSTOM'` if manual URL) |
| `CalendarEvent` | Synthetic `msEventId: lms-session-{sessionId}` — **not** a real Outlook event ID |

LMS-created sessions use the **onlineMeetings** API only. They do **not** create a corresponding Outlook calendar event via `POST /me/events`.

### Fallback behavior

If Graph fails (no linked account, permissions, network, etc.), `session.service.ts` catches the error and creates a **placeholder** meeting:

```
joinUrl:  https://teams.microsoft.com/l/meetup-join/fallback-{timestamp}
teamsMeetingId: fallback-{timestamp}
```

This allows local development without Azure, but recordings and real Teams joins will not work for those sessions.

### Required Azure permissions (delegated)

| Permission | Purpose |
|------------|---------|
| `OnlineMeetings.ReadWrite` | Create Teams meetings |
| `Calendars.ReadWrite` | Calendar sync (separate flow) |
| `User.Read` | User identity |
| `offline_access` | Refresh tokens |

---

## Calendar sync

### Manual sync

**LMS endpoint:** `POST /api/calendar/sync`

**Graph call:**

```
GET https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={iso}&endDateTime={iso}
```

**Function:** `getCalendarView()` → `syncCalendarForUser()` in `calendar.service.ts`

### Sync logic

1. Pull events from the user's Microsoft calendar for the date range (default: now → +30 days)
2. For each event, read `onlineMeeting.joinUrl` if present
3. Try to match an existing `LiveSession` by `joinUrl`
4. Upsert `CalendarEvent` rows keyed by `msEventId` (real Outlook event ID)

### Read endpoints (local DB only — no Graph call)

| LMS endpoint | Description |
|--------------|-------------|
| `GET /api/calendar/events?start=&end=` | Events in date range |
| `GET /api/calendar/events/today` | Today's events |
| `GET /api/calendar/live` | Sessions currently live (15-min end buffer) |

### Unused helper

`createCalendarEvent()` → `POST /me/events` is implemented but **not called** by any application flow today.

---

## Recording sync

### Background job

**File:** `apps/api/src/jobs/recording-sync.job.ts`

- Starts when the API boots (`index.ts` → `recordingSyncJob.start()`)
- Runs immediately, then every **5 minutes**
- Finds sessions that ended (or started 90+ minutes ago) with no `Recording` row yet
- Calls `recordingService.syncRecordingsForSession()` for each

### Manual sync

**LMS endpoint:** `POST /api/recordings/:sessionId/sync`

### Graph calls

**List recordings:**

```
GET https://graph.microsoft.com/v1.0/me/onlineMeetings/{teamsMeetingId}/recordings
```

**Function:** `getMeetingRecordings(instructorId, meetingId)`

Uses the **batch instructor's** delegated token (meeting organizer).

**Playback URL:**

```
GET https://graph.microsoft.com/v1.0/me/onlineMeetings/{meetingId}/recordings/{recordingId}/content
```

**Function:** `getRecordingContent()` — follows the **302 redirect** and returns the `Location` header URL.

**LMS endpoint:** `GET /api/recordings/:id/url`

### What gets stored

| Field | Source |
|-------|--------|
| `Recording.teamsRecordingId` | Graph recording `id` |
| `Recording.sharePointUrl` | Graph recording `webUrl` |
| `Recording.duration` | `0` initially (not always in metadata) |

### Recording permissions note

Code comments reference `OnlineMeetingRecording.Read.All`, but the refresh-token scope list in `graph.auth.ts` does **not** include it yet. Recording access may require adding that delegated permission in Azure AD and updating the refresh scopes.

### Unused call-record helpers

These use **application** permissions and are **not integrated** into any flow:

| Function | Graph endpoint |
|----------|----------------|
| `getCallRecords()` | `GET /communications/callRecords?$filter=...` |
| `getCallRecordSessions()` | `GET /communications/callRecords/{id}/sessions` |

Requires: `CallRecords.Read.All` (application, admin consent).

---

## Webhooks (Teams → LMS)

Graph can push change notifications when calendar events change. The LMS exposes two webhook endpoints.

### Subscription setup (manual today)

`graph.subscriptions.ts` provides:

```typescript
createSubscription(resource, notificationUrl, expirationDateTime, clientState?)
// POST /subscriptions — uses application token
```

**No code currently calls `createSubscription` on startup.** Subscriptions must be created manually (Azure portal, script, or future job) for webhooks to fire.

Example subscription resource paths:

| Resource | Webhook |
|----------|---------|
| `/users/{msUserId}/events` | `POST {API_URL}/api/webhooks/events` |
| `/users/{msUserId}/events` | `POST {API_URL}/api/webhooks/calendar` |

`notificationUrl` must be **publicly reachable** (use ngrok or similar in local dev).

### Validation handshake

On subscription creation, Microsoft sends:

```
POST /api/webhooks/events?validationToken={token}
```

The handler must respond with the token as **plain text** (`200 OK`).

### A. Calendar webhook

**Endpoint:** `POST /api/webhooks/calendar`  
**File:** `calendar/webhook.controller.ts`

| Step | Action |
|------|--------|
| Validate `clientState` | Must match `MS_WEBHOOK_CLIENT_STATE` |
| Resolve user | Lookup `User` by `msUserId` from resource path |
| Re-sync | `syncCalendarForUser()` for next 30 days |

Does **not** create `LiveSession` rows — only refreshes `CalendarEvent` data.

### B. Events webhook (Teams-created meetings)

**Endpoint:** `POST /api/webhooks/events`  
**File:** `sessions/events-webhook.controller.ts`

| `changeType` | Action |
|--------------|--------|
| `created` / `updated` | `GET /me/events/{eventId}` — if Teams online meeting, create or update `LiveSession` |
| `deleted` | Mark linked session `endedAt`, delete `CalendarEvent` |

**Teams → LMS session creation:**

1. Fetch full event from Graph
2. Require `isOnlineMeeting` and `onlineMeeting.joinUrl`
3. If session exists (by `teamsMeetingId` or `joinUrl`) → update schedule
4. If new: find instructor's first `Batch` + first `Module` → `createSessionFromTeams()` with `createdFrom: 'TEAMS'`
5. If no batch: upsert `CalendarEvent` only (no `LiveSession`)

### Webhook security

Both controllers validate:

```
notification.clientState === process.env.MS_WEBHOOK_CLIENT_STATE
```

Default if unset: `secretClientValue` (change this in production).

---

## Graph API endpoint reference

| Graph path | Method | Auth | Used by | Status |
|------------|--------|------|---------|--------|
| `/me/onlineMeetings` | POST | Delegated | `createOnlineMeeting` | **Active** |
| `/me/onlineMeetings/{id}` | GET | Delegated | `getOnlineMeeting` | Defined, unused |
| `/me/calendarView` | GET | Delegated | `getCalendarView` | **Active** |
| `/me/events` | POST | Delegated | `createCalendarEvent` | Defined, unused |
| `/me/events/{id}` | GET | Delegated | `events-webhook.controller` | **Active** |
| `/me/onlineMeetings/{id}/recordings` | GET | Delegated | `getMeetingRecordings` | **Active** |
| `/me/onlineMeetings/{id}/recordings/{id}/content` | GET | Delegated | `getRecordingContent` | **Active** |
| `/me` | GET | Delegated | `getMsUserProfile` | Defined, unused |
| `/communications/callRecords` | GET | Application | `getCallRecords` | Defined, unused |
| `/communications/callRecords/{id}/sessions` | GET | Application | `getCallRecordSessions` | Defined, unused |
| `/subscriptions` | POST | Application | `createSubscription` | Defined, no caller |
| `/subscriptions/{id}` | PATCH | Application | `renewSubscription` | Defined, no caller |
| `/subscriptions/{id}` | DELETE | Application | `deleteSubscription` | Defined, no caller |

### Error handling

`GraphClient` maps common Graph errors to friendly messages:

| Graph code | User-facing message |
|------------|---------------------|
| `InvalidAuthenticationToken` | Microsoft session expired — sign in again |
| `ResourceNotFound` | Resource not found |
| `ErrorAccessDenied` | No permission for Teams/Calendar action |
| `MailboxNotEnabledForRESTAPI` | Mailbox not enabled for REST API |
| `AuthenticationError` | Re-link Microsoft account |

---

## LMS REST API mapping

| Feature | LMS endpoint | Graph involved |
|---------|--------------|----------------|
| Schedule session + Teams meeting | `POST /api/sessions` | `POST /me/onlineMeetings` |
| List sessions | `GET /api/sessions` | No |
| Sync calendar | `POST /api/calendar/sync` | `GET /me/calendarView` |
| View calendar | `GET /api/calendar/events` | No (local DB) |
| Sync recording | `POST /api/recordings/:sessionId/sync` | `GET .../recordings` |
| Playback URL | `GET /api/recordings/:id/url` | `GET .../recordings/{id}/content` |
| Calendar webhook | `POST /api/webhooks/calendar` | Triggers calendar sync |
| Teams events webhook | `POST /api/webhooks/events` | `GET /me/events/{id}` |

---

## Azure AD app registration

### Steps (summary)

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Set redirect URI (e.g. `http://localhost:3000/api/auth/callback/azure-ad`)
3. Create a **client secret** under **Certificates & secrets**
4. Under **API permissions**, add:

**Delegated permissions (required for core flows):**

| Permission | Used for |
|------------|----------|
| `OnlineMeetings.ReadWrite` | Create Teams meetings |
| `Calendars.ReadWrite` | Calendar sync |
| `User.Read` | Profile / identity |
| `offline_access` | Refresh tokens |
| `OnlineMeetingRecording.Read.All` | Recording list/playback (recommended — add to scopes) |

**Application permissions (optional / future):**

| Permission | Used for |
|------------|----------|
| `CallRecords.Read.All` | Call-record based recording discovery (unused) |
| `Subscription` scopes for webhooks | Change notifications |

5. Grant **admin consent** for the tenant (especially application permissions)
6. Copy **Application (client) ID**, **Directory (tenant) ID**, and **client secret** into `.env`

### Who must link Microsoft?

The user who **creates** the session (`POST /api/sessions`) must have valid MS tokens — Graph creates the meeting as `/me/onlineMeetings` (that user's identity).

For **recordings**, the **batch instructor's** token is used.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MS_CLIENT_ID` | Yes (for Graph) | Azure AD application (client) ID |
| `MS_CLIENT_SECRET` | Yes (for Graph) | Azure AD client secret |
| `MS_TENANT_ID` | No | Tenant ID (default: `common`) |
| `MS_REDIRECT_URI` | Yes (for token refresh) | OAuth redirect URI |
| `TOKEN_ENCRYPTION_KEY` | Yes | Min 32 chars — encrypts MS tokens in DB |
| `MS_WEBHOOK_CLIENT_STATE` | Recommended | Secret validated on webhook notifications (default: `secretClientValue`) |
| `API_URL` | Yes (for webhooks) | Public API base URL for subscription `notificationUrl` |

Example `.env` block:

```env
MS_CLIENT_ID=your-client-id
MS_CLIENT_SECRET=your-client-secret
MS_TENANT_ID=common
MS_REDIRECT_URI=http://localhost:3000/api/auth/callback/azure-ad
TOKEN_ENCRYPTION_KEY=your_32_byte_encryption_key_here
MS_WEBHOOK_CLIENT_STATE=your-random-webhook-secret
API_URL=http://localhost:4000
```

---

## Database fields

| Model | Field | Purpose |
|-------|-------|---------|
| `User` | `msUserId` | Microsoft user ID (webhook user lookup) |
| `User` | `msAccessToken` | Encrypted delegated access token |
| `User` | `msRefreshToken` | Encrypted refresh token |
| `LiveSession` | `teamsMeetingId` | Graph online meeting ID |
| `LiveSession` | `joinUrl` | Teams join link |
| `LiveSession` | `createdFrom` | `LMS`, `LMS_CUSTOM`, or `TEAMS` |
| `CalendarEvent` | `msEventId` | Outlook event ID (or synthetic for LMS-created) |
| `Recording` | `teamsRecordingId` | Graph recording ID |
| `Recording` | `sharePointUrl` | SharePoint/OneDrive link from Graph |

---

## Known gaps and limitations

1. **No Graph SDK** — all integration is raw `fetch` via `GraphClient`
2. **OAuth login flow** — token storage/refresh exists; ensure users can complete initial Microsoft linking
3. **Webhook subscriptions not auto-created** — `createSubscription()` has no startup caller
4. **Recording scope** — `OnlineMeetingRecording.Read.All` may be needed but is not in refresh scopes yet
5. **LMS sessions don't create Outlook events** — only `onlineMeetings` API; local calendar rows use synthetic IDs
6. **Graph failure fallback** — placeholder Teams URLs can hide integration issues in development
7. **Call-record recording path** — implemented but not wired to the sync job
8. **Teams webhook batch assignment** — uses instructor's **first** batch and **first** module when auto-creating sessions

---

## Troubleshooting

### Sessions create fallback URLs instead of real Teams links

- Confirm the scheduling user has `msAccessToken` and `msRefreshToken` on their `User` row
- Verify Azure AD permissions include `OnlineMeetings.ReadWrite` with admin consent
- Check API logs for `[GraphAPI] Error ...` messages

### `POST /api/calendar/sync` fails

- User must have a linked Microsoft account
- Mailbox must support REST API (`MailboxNotEnabledForRESTAPI` otherwise)
- Requires `Calendars.ReadWrite` delegated permission

### Recordings never appear

- Teams meeting must have cloud recording enabled by the organizer
- Recording processing can take 15–60+ minutes after the meeting ends
- Background job polls every 5 minutes for sessions ended or 90+ minutes past `scheduledAt`
- Confirm instructor has recording permissions; consider adding `OnlineMeetingRecording.Read.All`
- Sessions with `teamsMeetingId` starting with `fallback-` or `custom-` will never have real recordings

### Webhooks not firing

- Subscriptions must be created and renewed (max ~3 days for many resource types)
- `notificationUrl` must be HTTPS and publicly accessible
- `MS_WEBHOOK_CLIENT_STATE` must match the value used when creating the subscription
- User's `msUserId` must exist in the database for the webhook to map notifications

### 401 / token errors

- Graph client retries once with a refreshed token on 401
- If refresh fails, user must re-link their Microsoft account
- Ensure `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, and `MS_REDIRECT_URI` match the Azure app registration

---

## Related documentation

- [API.md](./API.md) — REST endpoint reference (calendar, sessions, recordings, webhooks)
- [SYSTEM_GUIDE.md](./SYSTEM_GUIDE.md) — High-level LMS workflows
- [api_layer.md](./api_layer.md) — API architecture notes
