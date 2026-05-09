# Phase 4 — Azure AD & Graph API Setup

> ⏱️ **Duration**: Weeks 5–7 (3 weeks)  
> 📌 **Status**: 🔄 In Progress  
> 🔗 **Depends on**: Phase 2  
> ⚠️ **Extended from original 2 weeks → 3 weeks** (Azure AD debugging + admin consent flows take longer than expected)

---

## 🎯 Objective

Register a multi-platform Azure AD application, configure all required Graph API permissions, build a reusable Graph client module, and verify end-to-end token exchange works.

---

## ✅ Tasks

### 4.1 — Azure AD App Registration

- [ ] Register a **single multi-platform** app in Azure Portal
  - App type: Web application
  - Supported account types: "Accounts in any organizational directory" (multi-platform)
  - Redirect URI: `https://yourlms.com/api/auth/callback/azure-ad` (production) + `http://localhost:3000/api/auth/callback/azure-ad` (dev)
- [ ] Generate client secret and store securely
- [ ] Store in environment variables:
  ```env
  MS_CLIENT_ID=<application-id>
  MS_CLIENT_SECRET=<client-secret>
  MS_platform_ID=common  # "common" for multi-platform
  MS_REDIRECT_URI=http://localhost:3000/api/auth/callback/azure-ad
  ```
- [ ] Document the exact steps for app registration (with screenshots) for future reference

### 4.2 — API Permissions Configuration

- [ ] Configure **delegated permissions** (on behalf of user):
  - `Calendars.Read` — read user's calendar events
  - `Calendars.ReadWrite` — create calendar events
  - `OnlineMeetings.ReadWrite` — create/manage Teams meetings
  - `OnlineMeetingRecording.Read.All` — access meeting recordings
  - `User.Read` — read user's profile
  - `offline_access` — get refresh tokens
- [ ] Configure **application permissions** (daemon/background jobs):
  - `Calendars.Read` — for background calendar sync
  - `CallRecords.Read.All` — for recording sync job
  - `OnlineMeetingRecording.Read.All` — for recording fetch
- [ ] Document which permissions require **admin consent** and how to grant it
- [ ] Create an admin consent URL for platform admins:
  ```
  https://login.microsoftonline.com/common/adminconsent
    ?client_id=<app-id>
    &redirect_uri=<redirect-uri>
    &scope=https://graph.microsoft.com/.default
  ```

### 4.3 — Graph API Client Module

- [ ] Create `/src/modules/graph/graph.client.ts`:
  - Authenticated Graph client factory
  - Accepts user's access token (for delegated) or app token (for daemon)
  - Auto-inject `Authorization: Bearer <token>` header
  - Handle token expiry — attempt refresh, throw if both fail
- [ ] Create token acquisition utilities:
  - `getTokenForUser(userId)` — decrypt stored token, check expiry, refresh if needed
  - `getAppToken()` — client credentials flow for background jobs
- [ ] Implement **retry logic** with exponential backoff:
  - Retry on 429 (rate limited) — respect `Retry-After` header
  - Retry on 503 (service unavailable) — max 3 retries
  - Do NOT retry on 401 (re-authenticate instead)
  - Do NOT retry on 400 (bad request — log and fail)
- [ ] **🆕 Implement Graph API error mapping**:
  - Map Graph error codes to user-friendly messages
  - Log raw error for debugging, show friendly message to user

### 4.4 — Graph Sub-Modules

- [ ] `graph.meetings.ts`:
  - `createOnlineMeeting(userId, data)` — POST `/me/onlineMeetings`
  - `getOnlineMeeting(userId, meetingId)` — GET `/me/onlineMeetings/{id}`
- [ ] `graph.calendar.ts`:
  - `getCalendarView(userId, start, end)` — GET `/me/calendarView`
  - `createCalendarEvent(userId, data)` — POST `/me/events`
- [ ] `graph.recordings.ts`:
  - `getCallRecords(start, end)` — GET `/communications/callRecords`
  - `getRecordingUrl(callId)` — fetch SharePoint signed URL
- [ ] `graph.subscriptions.ts`:
  - `createSubscription(resource, notificationUrl, expiry)` — POST `/subscriptions`
  - `renewSubscription(subscriptionId, expiry)` — PATCH `/subscriptions/{id}`
  - `deleteSubscription(subscriptionId)` — DELETE `/subscriptions/{id}`
- [ ] **🆕 `graph.users.ts`**:
  - `getMsUserProfile(userId)` — GET `/me` (for syncing profile info)

### 4.5 — End-to-End Token Exchange Verification

- [ ] Test the full OAuth flow manually:
  1. User signs in with MS → get auth code
  2. Exchange code for access + refresh token
  3. Encrypt and store tokens
  4. Use access token to call `GET /me` (Graph API)
  5. Verify user profile data is returned
- [ ] Test token refresh:
  1. Wait for access token to expire (or mock expiry)
  2. Background job refreshes token
  3. Verify new token works for Graph API calls
- [ ] Test with multiple platforms:
  1. User from platform A authenticates
  2. User from platform B authenticates
  3. Verify isolated token storage

### 4.6 — 🆕 Admin Consent Flow UI

- [ ] Create admin consent page for platform admins:
  - Explain what permissions are needed and why
  - "Grant Permissions" button redirects to MS admin consent URL
  - Callback page confirms consent was granted
- [ ] Track consent status per platform in DB
- [ ] Show banner on dashboard if consent not yet granted

### 4.7 — 🆕 Graph API Rate Limit Strategy

- [ ] Document MS Graph rate limits:
  - Per-app: ~2000 requests per second (varies by API)
  - Per-user: ~10000 requests per 10 minutes
- [ ] Implement request queuing for bulk operations
- [ ] Add telemetry: track Graph API call counts per platform
- [ ] Set up alerts if approaching rate limits

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Azure AD app registered | App visible in Azure Portal |
| Permissions configured | All required permissions listed and granted |
| Graph client module | Can make authenticated API calls |
| Token exchange works | `GET /me` returns user profile |
| Token refresh works | Expired tokens refreshed automatically |
| Retry logic | 429 responses handled with backoff |
| Admin consent flow | platform admin can grant permissions |
| Graph sub-modules | All 5 sub-modules created and exported |

---

## 🧪 Tests to Write

- [ ] Unit: Graph client adds Authorization header
- [ ] Unit: Retry logic backs off on 429
- [ ] Unit: Token decryption returns valid token
- [ ] Unit: Error mapping produces correct user messages
- [ ] Integration: OAuth code exchange returns tokens (mock MS endpoint with MSW)
- [ ] Integration: Token refresh updates stored tokens
- [ ] Integration: Graph API call with expired token triggers refresh
- [ ] E2E: Full MS sign-in → Graph API call → profile returned

---

## ⚠️ Common Pitfalls

> [!WARNING]
> - **Admin consent can take up to 24 hours** to propagate across MS services
> - **Delegated vs Application permissions** behave differently — test both paths
> - **Token caching matters** — don't hit MS token endpoint on every API call
> - **Multi-platform apps need `common` authority**, not a specific platform ID

