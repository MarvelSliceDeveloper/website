# Super Admin Implementation Tracker

> Tracks progress of the super-admin architecture across 6 phases.
> Each phase is marked `✅ COMPLETED`, `🔄 IN PROGRESS`, or `⬜ PENDING` as work progresses.

---

## Phase 1: Foundation ✅ COMPLETED

**Goal:** Prisma schema, shared types, auth middleware, seed, `getSuperAdminId()` utility.

| Task | Status |
|------|--------|
| Add `SUPER_ADMIN` to `Role` enum + `UserRole` shared type | ✅ DONE |
| Add new Prisma models (SystemSetting, ApiKey, LoginLog, PermissionOverride, Announcement, ConsentLog, Quiz/Assignment templates) | ✅ DONE |
| Add `isSuspended` / soft-delete columns to existing models | ✅ DONE |
| Create `getSuperAdminId()` utility | ✅ DONE |
| Update auth middleware (SUPER_ADMIN inherits ADMIN, +requireSuperAdmin) | ✅ DONE |
| Restrict OAuth to SUPER_ADMIN only | ✅ DONE |
| Add superadmin seed user + default system settings | ✅ DONE |

**Conflicts / Issues:**
- **Prisma relations on join tables:** `CourseQuizTemplate` and `CourseAssignmentTemplate` needed inverse relation fields on `Course`, `QuizTemplate`, and `AssignmentTemplate` models. Added `quizTemplates CourseQuizTemplate[]` / `assignmentTemplates CourseAssignmentTemplate[]` on `Course`, `courses CourseQuizTemplate[]` on `QuizTemplate`, and `courses CourseAssignmentTemplate[]` on `AssignmentTemplate`.
- **EPERM file lock on Windows (prisma generate):** `query_engine-windows.dll.node` was locked by another process. Resolved by killing the port 4000 process and re-running. Non-blocking — just a Windows file-locking quirk.

---

## Phase 2: Core SA API ⬜ PENDING

**Goal:** User management, RBAC, system settings, API keys, quiz/assignment template APIs.

| Task | Status |
|------|--------|
| User management endpoints (pending instructors, suspend/unsuspend, create-admin, soft-delete/restore) | ⬜ PENDING |
| Permission override API + middleware | ⬜ PENDING |
| System settings CRUD API | ⬜ PENDING |
| API keys CRUD API | ⬜ PENDING |
| Quiz template library API | ⬜ PENDING |
| Assignment template library API | ⬜ PENDING |
| Course ↔ template attachment API | ⬜ PENDING |

**Conflicts / Issues:** (none yet)

---

## Phase 3: Logging ⬜ PENDING

**Goal:** Activity logs, login history, analytics errors, consent logs.

| Task | Status |
|------|--------|
| Activity log query API with filters + polling | ⬜ PENDING |
| Login history API | ⬜ PENDING |
| Analytics / error stats API | ⬜ PENDING |
| Consent logs API | ⬜ PENDING |

**Conflicts / Issues:** (none yet)

---

## Phase 4: Operations ✅ COMPLETED

**Goal:** Soft-delete + trash/restore, session timeout enforcement, Microsoft page rewrite, sidebar nav.

| Task | Status |
|------|--------|
| Trash / restore API (all entity types) | ✅ DONE |
| Session timeout enforcement in JWT middleware | ✅ DONE |
| AdminSidebar role-conditional nav items | ✅ DONE |
| AdminShell user role fetch + pass to sidebar | ✅ DONE |
| Microsoft page: SUPER_ADMIN sees link UI, ADMIN sees notice | ✅ DONE |

**Conflicts / Issues:**
- **Session timeout enforcement:** The plan's sample code used `req.user.sessionTimeoutMin` which isn't in the JWT payload. Added `sessionTimeoutMin` to the JWT payload in `auth.service.ts` `generateTokens()` and to the `AuthRequest.user` interface. The check is now done synchronously after JWT decode, with the `iat` claim.
- **Sidebar `overviewItems` → `sidebarItems`:** Renamed to avoid confusion and make items computed based on `userRole` prop. The old `overviewItems` static array was replaced with a computed `sidebarItems` array inside the component.

---

## Phase 5: UI Pages ⬜ PENDING

**Goal:** Build all 13+ new pages, course attachment UI.

| Task | Status |
|------|--------|
| `/admin/logs` page with 10s polling | ⬜ PENDING |
| `/admin/logs/stats` error charts | ⬜ PENDING |
| `/admin/settings/system` key-value editor | ⬜ PENDING |
| `/admin/settings/api-keys` list/create/revoke | ⬜ PENDING |
| `/admin/settings/permissions` toggle matrix | ⬜ PENDING |
| `/admin/users/login-history` browser | ⬜ PENDING |
| `/admin/trash` tabbed entity browser with restore | ⬜ PENDING |
| `/admin/announcements` create + history | ⬜ PENDING |
| `/admin/consent-logs` history table | ⬜ PENDING |
| `/admin/quiz-templates` library grid + editor | ⬜ PENDING |
| `/admin/assignment-templates` library grid + editor | ⬜ PENDING |
| Course new/edit: quiz/assignment attachment steps | ⬜ PENDING |

**Conflicts / Issues:** (none yet)

---

## Phase 6: Service Updates ✅ COMPLETED

**Goal:** Update session/ticket/recording/calendar services to use `superAdminId`.

| Task | Status |
|------|--------|
| `session.service.ts` — use `superAdminId` for `createOnlineMeeting` | ✅ DONE |
| `ticket.service.ts` — use `superAdminId` for mentorship session creation | ✅ SKIPPED (no Graph calls in ticket service) |
| `recording.service.ts` — use `superAdminId` for `syncRecordingsForSession` + `getPlaybackUrl` | ✅ DONE |
| `calendar.service.ts` — use `superAdminId` for `syncCalendarForUser` | ✅ DONE |

**Conflicts / Issues:**
- **ticket.service.ts**: After code review, this file has no Graph API calls — it only performs DB operations. The mentorship session scheduling logic uses `session.service.ts` internally, which already got the superAdminId update. No changes needed.
- **Fallback logic**: All updated services fall back to the original `userId` / `createdBy` if `getSuperAdminId()` returns null (no super admin with linked MS account exists), ensuring backward compatibility.
