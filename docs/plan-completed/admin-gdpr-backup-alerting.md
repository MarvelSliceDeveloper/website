# Admin Features: GDPR, Backup Restore, Alerting Webhooks

## Plan
1. **GDPR** — Export user data (profile, enrollments, certificates, submissions, quiz attempts, notifications) as JSON; anonymize user (blank name, prefix email, clear password, suspend)
2. **Backup Restore** — pg_dump trigger + download; pg_restore via file upload; file cleanup
3. **Alerting Webhooks** — CRUD for NotificationWebhook model; test endpoint; health check service integration
4. **Frontend pages** — GDPR view under /admin/gdpr; Backup under /admin/settings/backup; Webhooks under /admin/settings/webhooks
5. **Sidebar** — Add GDPR, Backup, Webhooks to Super Admin sidebar
6. **Tests** — Unit/integration tests for all 3 features
7. **Changelog** — Update docs/changelog.md

## Key Details
- All routes use requireAuth + requireRole([ADMIN, SUPER_ADMIN])
- Backup uses pg_dump/pg_restore via child_process (Super Admin only)
- Webhook test fires POST to URL with sample payload
- GDPR anonymize is destructive — logs action via audit
