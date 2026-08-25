# Plan: Login History — User Name Display & Logout Timestamp

## Issues Identified

### 1. User ID Shown Instead of User Name

The login history table (`apps/web/src/app/admin/users/login-history/page.tsx`) displayed the raw truncated `userId` (`slice(0, 12)...`) because the API returned only the `LoginLog` records without the related user.

**Fix:** Include the `user` relation (id, name, email) in the Prisma query; display `user.name` + `user.email` in the table.

**Files:**

- `apps/api/src/modules/logs/login-history.routes.ts` — added `include: { user: { select: { id, name, email } } }`
- `apps/web/src/app/admin/users/login-history/page.tsx` — column header "User ID" → "User"; cell renders name + email

### 2. Logout Timestamp Not Recorded

The logout handler (`auth.controller.ts`) only cleared the cookie and returned 200 — it never updated the matching `LoginLog.logoutAt`, so the "Logout At" column always showed "—".

**Root cause:** The `POST /api/auth/logout` route had no `requireAuth` middleware, so `req.user` was unavailable and the controller had no way to know which login session to close.

**Fix:**

- `apps/api/src/modules/auth/auth.routes.ts` — added `requireAuth` to the logout route
- `apps/api/src/modules/auth/auth.controller.ts` — logout handler now runs `prisma.loginLog.updateMany({ where: { userId, logoutAt: null }, data: { logoutAt: new Date() } })` before clearing the cookie (fire-and-forget, mirrors the login logging pattern)

## Files Modified

1. `apps/api/src/modules/logs/login-history.routes.ts` — include user relation
2. `apps/api/src/modules/auth/auth.routes.ts` — `requireAuth` on logout
3. `apps/api/src/modules/auth/auth.controller.ts` — record `logoutAt` on logout
4. `apps/web/src/app/admin/users/login-history/page.tsx` — show user name + email

## Notes

- `updateMany` targets the user's latest still-open session (`logoutAt: null`) — safe even if multiple browser sessions exist (all open sessions get stamped, which is the desired behavior).
- Logout timestamp update is fire-and-forget (`.catch` logs errors only), matching the existing login-logging pattern so logout never fails due to a DB hiccup.
