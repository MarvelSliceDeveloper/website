# Critical Fixes — Batch 1

## Priority Order

### P0 — Security (hardcoded secrets)

1. Remove JWT_SECRET fallback from `auth.middleware.ts`, `auth.service.ts`
2. Remove CSRF_SECRET fallback from `app.ts`
3. Remove webhook client state fallback from `events-webhook.controller.ts`, `webhook.controller.ts`
4. Fix static encryption salt in `encryption.ts`

### P1 — Business Logic Bugs

5. Fix `getOverdueAssignments` — actually filter by dueDate < now
6. Fix batch capacity — count only APPROVED enrollments
7. Fix calendar events query — use proper overlap range
8. Fix session overlap — don't block past sessions

### P2 — Race Conditions

9. Wrap session+calendar event creation in transaction
10. Wrap module/lesson reorder in transaction
11. Wrap batch addStudents in transaction

### P3 — Error Handling & Validation

12. Replace `console.error` with pino logger in all controllers
13. Extract `parseVideoUrl` to shared utility
14. Remove dead code

### P4 — Authorization

15. Add batch ownership check to `removeStudent`
16. Add admin demotion safeguard
