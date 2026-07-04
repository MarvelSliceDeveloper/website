# Complexity Analysis & Improvement Plan

## Top Issues & How to Solve Them

---

### 1. Mentorship & Support — Near-Complete Duplication ★★★★★

**Problem**: `MentorshipTicket` and `SupportTicket` are separate Prisma models with identical CRUD lifecycles. The API controllers, services, and frontend pages are 80% copy-paste.

**Files**: `mentorship.service.ts` (286 lines), `support.service.ts` (144 lines), plus 3 frontend pages each.

**Plan**:

1. ~~**Prisma level**: Add a `type` discriminator...~~ _(deferred — service-level unification done instead)_
2. ✅ **API level**: Unified `ticket.service.ts` + `ticket.controller.ts` + `ticket.routes.ts` at `/api/tickets`. Single shared CRUD with type-aware dispatch to MentorshipTicket/SupportTicket models. Thin specialization layers remain in mentorship/support wrappers.
3. ✅ **Frontend level**: Student + Instructor support pages now use shared `EmptyState`, `StatusBadge`, `Skeleton`, `timeAgo` from shared libs, and call unified `/api/tickets` endpoints.

**Estimated savings**: ~200 API lines (service unification) + ~100 frontend lines (shared components).

---

### 2. Frontend Utility Duplication ★★★★★

**Problem**: Core utilities are copy-pasted across 4-8 files each.

| Pattern                                       | Files     | Status                                                                                              |
| --------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `timeAgo()`                                   | 8 files   | ✅ Extracted to `apps/web/src/lib/time-ago.ts`. All inbox pages now use it.                         |
| `NotificationItem` interface                  | 4 files   | ✅ Moved to `apps/web/src/lib/notifications.tsx`. All inbox pages import it.                        |
| `SupportTicket` / `SupportMessage` interfaces | 3 files   | ❌ Still duplicated. Move to `@lms/types`.                                                          |
| `NOTIF_ICONS` record                          | 4 files   | ✅ Unified in `apps/web/src/lib/notifications.tsx` as `<NotificationIcon>`. All inbox pages use it. |
| `STATUS_CONFIG` objects                       | 6 files   | ✅ Created shared `StatusBadge` component. Used in both support pages.                              |
| `Empty state` (icon + text)                   | 12+ files | ✅ Created shared `<EmptyState>`. Used in both support pages.                                       |
| `Loading skeleton`                            | 10+ files | ✅ Created shared `<Skeleton>`. Used in both support pages.                                         |

**Plan**:

- ✅ `timeAgo` → `apps/web/src/lib/time-ago.ts`
- ❌ Shared interfaces → `@lms/types` _(pending)_
- ✅ Shared components in `apps/web/src/components/shared/` — `EmptyState.tsx`, `Skeleton.tsx`, `StatusBadge.tsx`, `PageHeader.tsx`

---

### 3. God Files — 10 Files Over 500 Lines ★★★★☆

| File                              | Lines      | Plan                                                                                                                                                          |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instructor/assignments/page.tsx` | 1,027 → 14 | Split into `_comps/types.ts`, `AssignmentsList.tsx`, `QuizBuilder.tsx`, `AssignmentCreateForm.tsx`, `SubmissionReviewPanel.tsx`, `AssignmentsPageContent.tsx` |
| `CourseContentView.tsx`           | 940 → ~650 | Split: `_comps/types.ts`, `VideoPlayer.tsx`, `LessonSidebar.tsx`, `SessionSidebar.tsx`                                                                        |
| `notification.service.ts`         | 577        | Pending: extract per-event notification builders                                                                                                              |
| `VideoPlayer.tsx`                 | 548        | Pending: extract Controls, ProgressBar, PlaybackRateSelector, FullscreenToggle                                                                                |

**Plan**: Split each file by UI concern. Each extracted component gets its own file in a `_components/` directory. The parent file becomes a thin orchestration layer.

---

### 4. API Route Inconsistencies ★★★☆☆

**Problem**: Admin routes are scattered — some use `/api/admin/*` prefix, others mix admin + regular routes in the same file with inline role checks. 19+ route mounts in `index.ts` with no grouping.

**Plan**:

```typescript
const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireRole([UserRole.ADMIN]));
adminRouter.use("/courses", courseRouter);
adminRouter.use("/batches", batchRouter);
adminRouter.use("/enrollments", enrollmentRouter);
adminRouter.use("/dashboard", dashboardRouter);
// ... etc
app.use("/api/admin", adminRouter);

// Student/instructor role-agnostic routes
app.use("/api/courses", studentCourseRouter);
app.use("/api/batches", studentBatchRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/support", supportRouter);
```

This eliminates duplicate `requireRole` calls and makes the auth boundary clear.

---

### 5. Shell/Layout Duplication ★★★☆☆

**Problem**: `AdminShell`, `InstructorShell`, `StudentShell` are 90% identical — same layout, same Header, same sidebar collapse logic, same `STORAGE_KEY`. Only the sidebar component changes.

**Plan**:

- ✅ Created `AppShell.tsx` with render-prop sidebar + inboxHref
- ✅ `AdminShell`, `InstructorShell`, `StudentShell` now thin wrappers around `AppShell`
- All 3 shells cut from ~30 lines each to ~10 lines each

---

### 6. Mock Data in Production ★★★☆☆

**Problem**: `student-mock-data.ts` (797 lines) and `instructor-mock-data.ts` (453 lines) are imported by views and shipped in production builds.

**Plan**: Gate behind `process.env.NODE_ENV === 'development'` or remove entirely now that the API is functional.

---

### 7. Prisma Schema Cleanup ★★☆☆☆

**Problem**:

- Unused `AssignmentSubmissionStatus` enum
- Enums duplicated with `@lms/types`
- `msAccessToken`/`msRefreshToken` on User (noise for most queries)

**Plan**: Remove unused enum, consolidate enum source of truth, extract Microsoft tokens to separate model.

---

## Prioritization

| Priority | Item                          | Effort | Impact     | Status                                                                                     |
| -------- | ----------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------ |
| P0       | Dispatch shared utilities     | Small  | High       | ✅ `timeAgo`, `EmptyState`, `Skeleton`, `StatusBadge`, `PageHeader` done                   |
| P0       | Split god files               | Medium | High       | ✅ assignments + CourseContentView done; notification.service + VideoPlayer next           |
| P1       | Unify Ticket system (backend) | Large  | Highest    | ✅ Service + controller + routes created at `/api/tickets`. Support pages use unified API. |
| P1       | Unify admin route middleware  | Small  | Medium     | ❌ Not started                                                                             |
| P2       | Unify Shell components        | Medium | Medium     | ✅ `AppShell` created. 3 shells are thin wrappers.                                         |
| P2       | Remove mock data from prod    | Small  | Low-Medium | ❌ Not started                                                                             |
| P3       | Prisma schema cleanup         | Small  | Low        | ❌ Not started                                                                             |
