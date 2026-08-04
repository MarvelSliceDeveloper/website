# Super Admin Architecture Plan

## Overview

Introduce a **SUPER_ADMIN** role to solve the single-Teams-license problem. The super admin links **one** Microsoft account, and all Teams meetings (sessions, mentorship) are created using that account's tokens. The super admin also manages platform-level API keys, system settings, and has access to a centralized activity log dashboard.

---

## Current Problems

1. **Teams license conflict** (`apps/api/src/modules/auth/auth.controller.ts:114`): Only `ADMIN` role can link Microsoft accounts. Each admin needs their own Teams license.
2. **No super admin role**: `Role` enum has only `STUDENT | INSTRUCTOR | ADMIN` (`apps/api/prisma/schema.prisma:10-14`).
3. **No API key management**: No model, routes, or UI for API keys.
4. **No system settings DB**: Platform config is entirely env-var based — no `Settings` model.
5. **No central log viewer**: `GraphApiLog` exists in DB but there's no UI to browse/filter it.

---

## 1. Database Changes

### 1.1 Role Enum — Add SUPER_ADMIN

**File:** `apps/api/prisma/schema.prisma`

```prisma
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
  SUPER_ADMIN
}
```

### 1.2 SystemSetting Model

```prisma
model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  type        String   @default("string") // string | boolean | number | json
  description String?
  updatedAt   DateTime @updatedAt
}
```

Predefined settings:

- `super_admin_id` — auto-set when a SUPER_ADMIN exists
- `platform_name` — display name for the LMS
- `default_session_duration_minutes` — default meeting length
- `max_students_per_batch` — global hard cap

### 1.3 ApiKey Model

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  key         String   @unique // hashed
  name        String
  description String?
  permissions Json     @default("[]") // string[]
  lastUsedAt  DateTime?
  active      Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
}
```

### 1.4 Seed Update

**File:** `apps/api/prisma/seed.ts`

- Add a SUPER_ADMIN user: `superadmin@lms.local` / `superadmin123`
- Optionally upgrade the existing `admin@lms.local` seed user

---

## 2. Auth Changes

### 2.1 Middleware — SUPER_ADMIN Inherits ADMIN Access

**File:** `apps/api/src/middleware/auth.middleware.ts`

Modify `requireRole` so `SUPER_ADMIN` automatically passes checks for `[ADMIN]` roles too — avoids having to add `SUPER_ADMIN` to every existing route guard.

### 2.2 Microsoft OAuth — SUPER_ADMIN Only

**File:** `apps/api/src/modules/auth/auth.controller.ts`

- `azureAdLogin` (line 114): Change `user.role !== 'ADMIN'` to `user.role !== 'SUPER_ADMIN'`
- `azureAdCallback` (line 168): Same check

### 2.3 JWT Payload

Ensure `SUPER_ADMIN` role is included in the JWT token payload (already uses `UserRole` enum from `@lms/types`, so just adding value there will flow through).

---

## 3. Graph/Teams — Single Account Delegation

### 3.1 Super Admin Utility

**New file:** `apps/api/src/utils/super-admin.ts`

```typescript
export function getSuperAdminId(): Promise<string | null>;
```

Queries `User` with role `SUPER_ADMIN` that has `msAccessToken` set. Cache result briefly (e.g., 5 min in-memory).

### 3.2 Session Creation

**File:** `apps/api/src/modules/sessions/session.service.ts`

- Line 74: Change `createOnlineMeeting(userId, ...)` → `createOnlineMeeting(superAdminId, ...)`
- The `createdBy` field still records the actual admin who initiated the session

### 3.3 Mentorship Session Scheduling

**File:** `apps/api/src/modules/tickets/ticket.service.ts`

- Update the `scheduleSession()` method to use `superAdminId` for Teams meeting creation

### 3.4 Calendar Operations

**File:** `apps/api/src/modules/calendar/calendar.service.ts`

- Calendar sync (fetching events from Microsoft) should use super admin ID

### 3.5 Recordings

**File:** `apps/api/src/modules/recordings/recording.service.ts`

- `syncRecordingsForSession()` should use super admin ID instead of the original creator's ID

### 3.6 Webhooks (Events)

**File:** `apps/api/src/modules/sessions/events-webhook.controller.ts`

- Already uses `getAppToken()` for subscription validation — no change needed
- Calendar webhook watches the super admin's calendar only (this is the desired behaviour)

### 3.7 Graph Client

**New file:** N/A (modify callers)

The `GraphClient` itself stays the same — it just needs to be called with the super admin's `userId` instead of the calling admin's `userId`.

---

## 4. API — New Endpoints

### 4.1 API Keys

| Method   | Endpoint                  | Auth        | Description                                 |
| -------- | ------------------------- | ----------- | ------------------------------------------- |
| `GET`    | `/api/admin/api-keys`     | SUPER_ADMIN | List all API keys (key is masked)           |
| `POST`   | `/api/admin/api-keys`     | SUPER_ADMIN | Create new API key (returns plaintext once) |
| `DELETE` | `/api/admin/api-keys/:id` | SUPER_ADMIN | Revoke/delete an API key                    |

**New file:** `apps/api/src/modules/api-keys/` — controller, service, routes

### 4.2 System Settings

| Method | Endpoint                   | Auth        | Description            |
| ------ | -------------------------- | ----------- | ---------------------- |
| `GET`  | `/api/admin/settings`      | SUPER_ADMIN | List all settings      |
| `PUT`  | `/api/admin/settings/:key` | SUPER_ADMIN | Update a setting value |

**New file:** `apps/api/src/modules/settings/` — controller, service, routes

### 4.3 Activity Logs

| Method | Endpoint                | Auth                | Description                                                   |
| ------ | ----------------------- | ------------------- | ------------------------------------------------------------- |
| `GET`  | `/api/admin/logs`       | SUPER_ADMIN + ADMIN | Query GraphApiLog with filters (date, action, status, userId) |
| `GET`  | `/api/admin/logs/stats` | SUPER_ADMIN         | Aggregated stats (error rate, failure count, top errors)      |

**New file:** `apps/api/src/modules/logs/` — controller, service, routes

---

## 5. Web UI — New/Modified Pages

### 5.1 System Settings Page

**New route:** `/admin/settings/system`

- Key-value editor for `SystemSetting` entries
- Only visible to `SUPER_ADMIN`
- Sections: General, Sessions, Limits

### 5.2 API Keys Page

**New route:** `/admin/settings/api-keys`

- List, create, revoke API keys
- Show masked keys, last used date
- Only visible to `SUPER_ADMIN`

### 5.3 Activity Logs Page

**New route:** `/admin/logs`

- Browseable table with filters (date range, action type, status code, user)
- Error highlighting (red rows for failed requests)
- Aggregated stats at the top
- Visible to `SUPER_ADMIN` and `ADMIN`

### 5.4 Modified Microsoft Page

**File:** `apps/web/src/app/admin/microsoft/page.tsx`

- Super admin sees the current "Link/Re-link" UI
- Regular admins see a notice: "Microsoft account is managed by the Super Admin"
- Graph logs on this page should show all logs (not just the current user's)

### 5.5 Sidebar Changes

**File:** `apps/web/src/components/AdminSidebar.tsx`

- Add "Activity Logs" as a nav item (under Reports or as a top-level item)
- Add "System Settings" and "API Keys" under the Settings dropdown
- These extra items only render for `SUPER_ADMIN`

---

## 6. Migration & Seed

### 6.1 Migration

- `prisma db push --force-reset` handles schema changes (as per project convention — see AGENTS.md)
- Seed script creates the `SUPER_ADMIN` user

### 6.2 Data Migration Notes

- Existing admins keep their `ADMIN` role unchanged
- Existing `msAccessToken`/`msRefreshToken` on non-super-admin users are left in DB but ignored (no Graph calls use them anymore)
- Optionally: add a cleanup step to clear MS tokens from non-super-admin users

---

## 7. Future Considerations

- **Rate limiting on API keys** — implement per-key rate limits later
- **Audit log** — track who created/revoked API keys, who changed settings
- **Granular permissions** — if needed later, extend `ApiKey.permissions` with scoped access
- **App-only auth fallback** — for recordings, consider always using app-only auth (already partially implemented)

---

## Files to Create/Modify

### New Files

- `apps/api/src/utils/super-admin.ts` — getSuperAdminId helper
- `apps/api/src/modules/api-keys/api-key.controller.ts`
- `apps/api/src/modules/api-keys/api-key.service.ts`
- `apps/api/src/modules/api-keys/api-key.routes.ts`
- `apps/api/src/modules/settings/setting.controller.ts`
- `apps/api/src/modules/settings/setting.service.ts`
- `apps/api/src/modules/settings/setting.routes.ts`
- `apps/api/src/modules/logs/log.controller.ts`
- `apps/api/src/modules/logs/log.service.ts`
- `apps/api/src/modules/logs/log.routes.ts`
- `apps/web/src/app/admin/settings/system/page.tsx`
- `apps/web/src/app/admin/settings/api-keys/page.tsx`
- `apps/web/src/app/admin/logs/page.tsx`
- `packages/types/src/super-admin.ts` — if additional types needed

### Modified Files

- `apps/api/prisma/schema.prisma` — Role enum, new models
- `apps/api/prisma/seed.ts` — SUPER_ADMIN seed
- `apps/api/src/middleware/auth.middleware.ts` — SUPER_ADMIN inheritance
- `apps/api/src/modules/auth/auth.controller.ts` — OAuth restrictions
- `apps/api/src/modules/sessions/session.service.ts` — use superAdminId
- `apps/api/src/modules/tickets/ticket.service.ts` — use superAdminId
- `apps/api/src/modules/recordings/recording.service.ts` — use superAdminId
- `apps/api/src/modules/calendar/calendar.service.ts` — use superAdminId
- `apps/api/src/modules/graph/graph.meetings.ts` — update if needed
- `apps/web/src/components/AdminSidebar.tsx` — new nav items
- `apps/web/src/app/admin/microsoft/page.tsx` — non-admin notice
- `apps/web/src/app/admin/settings/page.tsx` — super admin sub-nav
