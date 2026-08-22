# Admin Security & Platform Features Implementation

## Priority Order
1. **Maintenance Mode** — Quick win, single toggle to take platform offline
2. **Session Security** — Active session list, force logout, 2FA toggle
3. **Backup Restore** — Upload and restore from pg_dump
4. **Alerting** — Health check webhook notifications

## Files Changed

### Prisma Schema
- `apps/api/prisma/schema.prisma` — Add `AdminSession`, `NotificationWebhook` models; add `twoFactorEnabled` to User

### Backend
- `apps/api/src/modules/admin/maintenance/` — Maintenance mode routes + middleware
- `apps/api/src/modules/admin/sessions/` — Session management routes
- `apps/api/src/modules/admin/backups/` — Backup restore routes
- `apps/api/src/modules/admin/health/` — Alerting notification routes
- `apps/api/src/middleware/maintenance.middleware.ts` — Maintenance mode check

### Frontend
- `apps/web/src/app/admin/settings/page.tsx` — Add security tab (sessions, 2FA)
- `apps/web/src/app/admin/settings/maintenance/page.tsx` — Maintenance mode page
- `apps/web/src/app/admin/users/[id]/page.tsx` — User detail
- `apps/web/src/app/admin/settings/backups/page.tsx` — Backup restore page
- `apps/web/src/app/admin/settings/notifications/page.tsx` — Alerting webhooks
- `apps/web/src/app/admin/health/page.tsx` — Add alert config

### Tests
- `apps/api/src/__tests__/routes/maintenance.test.ts`
- `apps/api/src/__tests__/routes/sessions.test.ts`
- `apps/api/src/__tests__/routes/backups.test.ts`
- `apps/api/src/__tests__/routes/alerting.test.ts`

## Auth
- All new admin routes require `requireAuth` + `requireRole([ADMIN, SUPER_ADMIN])`
- Maintenance mode check middleware runs before route handlers
- Session management uses JWT sessionId claim + AdminSession table
