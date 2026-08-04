# Super Admin Architecture Plan v2

## 1. Overview

Introduce a **SUPER_ADMIN** role with full platform control. Only SUPER_ADMIN links a Microsoft/Teams account — all admins/instructors create live sessions through that single delegated account. SUPER_ADMIN manages users, permissions, settings, logs, announcements, and can restore deleted entities.

Quizzes and assignments are **predefined templates** managed via a library — admins select from these templates during course creation rather than building them per-course.

---

## 2. Role Hierarchy (Hybrid RBAC)

```
SUPER_ADMIN (top)
  ├── Full CRUD on everything
  ├── Can create/delete/suspend/restore any user
  ├── Toggles granular permissions for ADMIN and INSTRUCTOR roles
  ├── Manages system settings, API keys, logs, announcements
  └── Only role that can link Microsoft/Teams account
      ↓
ADMIN
  ├── Course CRUD (create, maintain, update)
  ├── Create student accounts (future: bulk CSV/automation)
  ├── View + schedule live sessions, assign mentors
  ├── Direct messaging with instructors
  ├── Support ticket management
  ├── Mentorship assignment
  ├── Batch creation + student assignment
  ├── Enrollment verification
  └── Permissions togglable by SUPER_ADMIN
      ↓
INSTRUCTOR
  ├── Join + conduct live sessions
  ├── Evaluate student assignments (grades, feedback)
  ├── Answer student mentorship queries
  ├── Direct communication with batch students
  └── Permissions togglable by SUPER_ADMIN
      ↓
STUDENT
  └── Learn, submit assignments, take quizzes
```

### Permissions Panel

SUPER_ADMIN has a UI at `/admin/settings/permissions` listing all permission flags for ADMIN and INSTRUCTOR, each as a toggle switch:

| Permission          | Default ADMIN | Default INSTRUCTOR |
| ------------------- | ------------- | ------------------ |
| `course.create`     | ✅            | ❌                 |
| `course.edit`       | ✅            | ❌                 |
| `course.delete`     | ❌            | ❌                 |
| `course.view.all`   | ✅            | ❌                 |
| `batch.create`      | ✅            | ❌                 |
| `batch.edit`        | ✅            | ❌                 |
| `batch.delete`      | ❌            | ❌                 |
| `session.create`    | ✅            | ❌                 |
| `session.edit`      | ✅            | ❌                 |
| `session.delete`    | ❌            | ❌                 |
| `student.create`    | ✅            | ❌                 |
| `enrollment.manage` | ✅            | ❌                 |
| `assignment.create` | ❌            | ✅                 |
| `assignment.grade`  | ❌            | ✅                 |
| `mentorship.answer` | ❌            | ✅                 |

Permission overrides stored in `PermissionOverride` model, checked by middleware.

---

## 3. Core Principle — Microsoft Account Delegation

Only SUPER_ADMIN can link a Microsoft/Teams account. All Graph API calls for Teams meetings, calendar sync, and recordings use the super admin's tokens via a `getSuperAdminId()` utility.

- `azureAdLogin` and `azureAdCallback` check `user.role !== 'SUPER_ADMIN'` instead of `user.role !== 'ADMIN'`
- Regular ADMIN users see a notice on the Microsoft page: _"Microsoft account is managed by the Super Admin"_
- Consent changes logged in `ConsentLog`

### Affected Services

| Service                | Current                            | Change                                   |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| `session.service.ts`   | `createOnlineMeeting(userId, ...)` | `createOnlineMeeting(superAdminId, ...)` |
| `ticket.service.ts`    | mentor session using admin's ID    | Use `superAdminId` for Teams meeting     |
| `recording.service.ts` | `syncRecordingsForSession(userId)` | Use `superAdminId`                       |
| `calendar.service.ts`  | `syncCalendarForUser(userId)`      | Use `superAdminId`                       |

---

## 4. Database Schema — Full Specification

### 4.1 Role Enum Update

**File:** `apps/api/prisma/schema.prisma`

```prisma
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
  SUPER_ADMIN
}
```

### 4.2 New Models

```prisma
// === SYSTEM SETTINGS (key-value store) ===
model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  type        String   @default("string") // string | boolean | number | json
  description String?
  updatedAt   DateTime @updatedAt
}

// Predefined keys:
//   super_admin_id              → auto-set when SUPER_ADMIN exists
//   platform_name               → display name
//   default_session_duration    → minutes
//   max_students_per_batch      → global cap
//   session_timeout_admin       → minutes
//   session_timeout_instructor  → minutes
//   session_timeout_student     → minutes

// === API KEYS ===
model ApiKey {
  id          String   @id @default(cuid())
  key         String   @unique       // hashed
  name        String
  description String?
  permissions Json     @default("[]")
  lastUsedAt  DateTime?
  active      Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
}

// === LOGIN HISTORY ===
model LoginLog {
  id         String   @id @default(cuid())
  userId     String
  ip         String?
  userAgent  String?
  deviceInfo String?
  loginAt    DateTime @default(now())
  logoutAt   DateTime?
}

// === PERMISSION OVERRIDES (hybrid RBAC) ===
model PermissionOverride {
  id         String @id @default(cuid())
  role       Role
  permission String
  allowed    Boolean @default(true)
  @@unique([role, permission])
}

// === BROADCAST ANNOUNCEMENTS ===
model Announcement {
  id          String   @id @default(cuid())
  title       String
  body        String
  createdBy   String
  targetRole  Role              // ADMIN | INSTRUCTOR
  createdAt   DateTime @default(now())
  readBy      Json     @default("[]") // userId[]
}

// === CONSENT LOGS ===
model ConsentLog {
  id        String   @id @default(cuid())
  userId    String
  type      String              // MICROSOFT | DATA_PROCESSING
  action    String              // GRANTED | REVOKED | UPDATED
  details   Json?
  createdAt DateTime @default(now())
}
```

### 4.3 Quiz & Assignment Template Models

Quizzes and assignments are **predefined templates**. Admins create reusable templates in a library, then attach them to courses.

```prisma
// === QUIZ TEMPLATE (reusable, predefined) ===
model QuizTemplate {
  id          String              @id @default(cuid())
  title       String
  description String?
  category    String?
  questions   QuizTemplateQuestion[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model QuizTemplateQuestion {
  id             String              @id @default(cuid())
  quizTemplateId String
  text           String
  marks          Int                 @default(1)
  orderIndex     Int                 @default(0)
  options        QuizTemplateOption[]
  quizTemplate   QuizTemplate        @relation(fields: [quizTemplateId], references: [id])
}

model QuizTemplateOption {
  id         String               @id @default(cuid())
  questionId String
  optionText String
  isCorrect  Boolean             @default(false)
  question   QuizTemplateQuestion @relation(fields: [questionId], references: [id])
}

// === ASSIGNMENT TEMPLATE (reusable, predefined) ===
model AssignmentTemplate {
  id             String   @id @default(cuid())
  title          String
  description    String
  type           String   @default("QUIZ")   // QUIZ | FILE_UPLOAD
  questionPdfUrl String?
  maxPoints      Int      @default(100)
  category       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// === COURSE ↔ TEMPLATE JOIN TABLES ===
model CourseQuizTemplate {
  id             String       @id @default(cuid())
  courseId       String
  quizTemplateId String
  dueDate        DateTime?
  maxPoints      Int          @default(100)
  course         Course       @relation(fields: [courseId], references: [id])
  quizTemplate   QuizTemplate @relation(fields: [quizTemplateId], references: [id])
  @@unique([courseId, quizTemplateId])
}

model CourseAssignmentTemplate {
  id                  String              @id @default(cuid())
  courseId            String
  assignmentTemplateId String
  dueDate             DateTime?
  maxPoints           Int                 @default(100)
  course              Course              @relation(fields: [courseId], references: [id])
  assignmentTemplate  AssignmentTemplate  @relation(fields: [assignmentTemplateId], references: [id])
  @@unique([courseId, assignmentTemplateId])
}
```

### 4.4 Soft-Delete Columns

Add to these models: `deletedAt DateTime?`, `deletedBy String?`, `restoredAt DateTime?`, `restoredBy String?`

| Model        | Description             |
| ------------ | ----------------------- |
| `User`       | Soft-delete users       |
| `Course`     | Soft-delete courses     |
| `Batch`      | Soft-delete batches     |
| `Session`    | Soft-delete sessions    |
| `Assignment` | Soft-delete assignments |

### 4.5 User Model Additions

```prisma
model User {
  // ... existing fields ...
  isSuspended       Boolean  @default(false)
  suspendedAt       DateTime?
  suspendedBy       String?
  rateLimitPerMin   Int      @default(60)       // reserved for future Redis
  sessionTimeoutMin Int     @default(480)      // 8 hours default
  // ... rest of existing fields ...
}
```

---

## 5. Auth & Middleware Changes

### 5.1 Shared Types

**File:** `packages/types/src/index.ts`

```typescript
export enum UserRole {
  STUDENT = "STUDENT",
  INSTRUCTOR = "INSTRUCTOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}
```

### 5.2 Auth Middleware — Role Inheritance

**File:** `apps/api/src/middleware/auth.middleware.ts`

Update `requireRole` so `SUPER_ADMIN` automatically passes checks for `[ADMIN]` roles:

```typescript
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === Role.SUPER_ADMIN && roles.includes(Role.ADMIN)) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
```

New middleware for super-admin-only endpoints:

```typescript
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: "Super Admin only" });
  }
  next();
};
```

### 5.3 Auth Controller — OAuth Restricted to SUPER_ADMIN

**File:** `apps/api/src/modules/auth/auth.controller.ts`

- `azureAdLogin`: Change `user.role !== 'ADMIN'` → `user.role !== 'SUPER_ADMIN'`
- `azureAdCallback`: Same change

### 5.4 Login Logging

Create a `LoginLog` entry on every successful login:

```typescript
await prisma.loginLog.create({
  data: {
    userId: user.id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    deviceInfo: req.headers["sec-ch-ua-platform"] || null,
  },
});
```

### 5.5 Session Timeout Enforcement

After JWT verification, check token age against user's `sessionTimeoutMin`:

```typescript
const timeoutMin = req.user.sessionTimeoutMin ?? 480;
const tokenAge = (Date.now() - decoded.iat! * 1000) / 60000;
if (tokenAge > timeoutMin) {
  return res.status(401).json({ error: "Session expired" });
}
```

---

## 6. API Endpoints

### 6.1 User Management (SUPER_ADMIN)

| Method   | Endpoint                         | Description                        |
| -------- | -------------------------------- | ---------------------------------- |
| `GET`    | `/api/admin/users/pending`       | List instructors awaiting approval |
| `PUT`    | `/api/admin/users/:id/approve`   | Approve pending instructor         |
| `PUT`    | `/api/admin/users/:id/suspend`   | Suspend user                       |
| `PUT`    | `/api/admin/users/:id/unsuspend` | Unsuspend user                     |
| `POST`   | `/api/admin/users/create-admin`  | Create new admin                   |
| `DELETE` | `/api/admin/users/:id`           | Soft-delete user                   |
| `PUT`    | `/api/admin/users/:id/restore`   | Restore soft-deleted user          |

**Instructor approval flow:**

1. ADMIN creates an instructor account (role=INSTRUCTOR)
2. Account created with `isSuspended: true` (pending)
3. SUPER_ADMIN sees request at `/admin/users/pending`
4. SUPER_ADMIN approves → `isSuspended: false`
5. Notification sent to the new instructor via announcements

### 6.2 Permissions (SUPER_ADMIN)

| Method | Endpoint                 | Description                   |
| ------ | ------------------------ | ----------------------------- |
| `GET`  | `/api/admin/permissions` | List all permission overrides |
| `PUT`  | `/api/admin/permissions` | Batch update overrides        |

### 6.3 Activity Logs (SUPER_ADMIN + ADMIN)

| Method | Endpoint                | Description                                                                  |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| `GET`  | `/api/admin/logs`       | Query `GraphApiLog` (filters: page, limit, userId, action, status, from, to) |
| `GET`  | `/api/admin/logs/stats` | Aggregated stats (error rate, failure count, top errors)                     |

Page polls `/api/admin/logs?since={timestamp}` every 10 seconds for live updates.

### 6.4 Login History (SUPER_ADMIN)

| Method | Endpoint                           | Description                              |
| ------ | ---------------------------------- | ---------------------------------------- |
| `GET`  | `/api/admin/login-history`         | All login logs with pagination + filters |
| `GET`  | `/api/admin/login-history/:userId` | Login history for specific user          |

### 6.5 System Settings (SUPER_ADMIN)

| Method | Endpoint                   | Description       |
| ------ | -------------------------- | ----------------- |
| `GET`  | `/api/admin/settings`      | List all settings |
| `PUT`  | `/api/admin/settings/:key` | Update a setting  |

### 6.6 API Keys (SUPER_ADMIN)

| Method   | Endpoint                  | Description                     |
| -------- | ------------------------- | ------------------------------- |
| `GET`    | `/api/admin/api-keys`     | List (masked: `sk_XXXX...XXXX`) |
| `POST`   | `/api/admin/api-keys`     | Create (returns plaintext once) |
| `DELETE` | `/api/admin/api-keys/:id` | Revoke                          |

### 6.7 Trash / Restore (SUPER_ADMIN)

| Method | Endpoint                             | Description                    |
| ------ | ------------------------------------ | ------------------------------ |
| `GET`  | `/api/admin/trash`                   | List all soft-deleted entities |
| `POST` | `/api/admin/trash/:type/:id/restore` | Restore entity                 |

Supported types: `user`, `course`, `batch`, `session`, `assignment`

### 6.8 Announcements (SUPER_ADMIN)

| Method | Endpoint                            | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| `POST` | `/api/admin/announcements`          | Send announcement to role    |
| `GET`  | `/api/admin/announcements`          | List announcements           |
| `PUT`  | `/api/admin/announcements/:id/read` | Mark as read by current user |

### 6.9 Consent Logs (SUPER_ADMIN)

| Method | Endpoint                  | Description           |
| ------ | ------------------------- | --------------------- |
| `GET`  | `/api/admin/consent-logs` | Query consent history |

### 6.10 Dashboard Analytics (SUPER_ADMIN)

| Method | Endpoint                      | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| `GET`  | `/api/admin/analytics/errors` | Error rate, failure count, top errors by endpoint |

### 6.11 Quiz Template Library (ADMIN + SUPER_ADMIN)

| Method   | Endpoint                        | Description                     |
| -------- | ------------------------------- | ------------------------------- |
| `GET`    | `/api/admin/quiz-templates`     | List all templates              |
| `POST`   | `/api/admin/quiz-templates`     | Create with questions + options |
| `GET`    | `/api/admin/quiz-templates/:id` | Get detail                      |
| `PUT`    | `/api/admin/quiz-templates/:id` | Update                          |
| `DELETE` | `/api/admin/quiz-templates/:id` | Delete                          |

### 6.12 Assignment Template Library (ADMIN + SUPER_ADMIN)

| Method   | Endpoint                              | Description                |
| -------- | ------------------------------------- | -------------------------- |
| `GET`    | `/api/admin/assignment-templates`     | List all                   |
| `POST`   | `/api/admin/assignment-templates`     | Create (with optional PDF) |
| `GET`    | `/api/admin/assignment-templates/:id` | Get detail                 |
| `PUT`    | `/api/admin/assignment-templates/:id` | Update                     |
| `DELETE` | `/api/admin/assignment-templates/:id` | Delete                     |

### 6.13 Course — Attach Templates (ADMIN + SUPER_ADMIN)

| Method   | Endpoint                                                  | Description                    |
| -------- | --------------------------------------------------------- | ------------------------------ |
| `POST`   | `/api/admin/courses/:id/quiz-templates`                   | Attach quiz template to course |
| `DELETE` | `/api/admin/courses/:id/quiz-templates/:templateId`       | Detach                         |
| `POST`   | `/api/admin/courses/:id/assignment-templates`             | Attach assignment template     |
| `DELETE` | `/api/admin/courses/:id/assignment-templates/:templateId` | Detach                         |

---

## 7. Web UI Pages

### 7.1 AdminSidebar — Role-Conditional Nav Items

**File:** `apps/web/src/components/AdminSidebar.tsx`

Additional nav items visible only when `user.role === 'SUPER_ADMIN'`:

```
Overview (group)
  ├── Dashboard
  ├── Inbox
  ├── Courses
  ├── Users
  ├── Activity Logs          ← NEW
  ├── Login History          ← NEW
  ├── Trash                  ← NEW
  ├── Announcements          ← NEW
  └── ...
Settings (sub-menu)
  ├── General                ← existing
  ├── System Settings        ← NEW
  ├── API Keys               ← NEW
  ├── Permissions            ← NEW
  └── Consent Logs           ← NEW
```

Requires a `userRole` prop from `AdminShell` (which fetches user data on mount).

### 7.2 New Pages

| Route                              | Feature                                      | Access              |
| ---------------------------------- | -------------------------------------------- | ------------------- |
| `/admin/logs`                      | Activity log table with 10s polling          | SUPER_ADMIN + ADMIN |
| `/admin/logs/stats`                | Error rate charts (ApexCharts)               | SUPER_ADMIN         |
| `/admin/settings/system`           | System settings key-value editor             | SUPER_ADMIN         |
| `/admin/settings/api-keys`         | API key list + create + revoke               | SUPER_ADMIN         |
| `/admin/settings/permissions`      | Permission toggle matrix                     | SUPER_ADMIN         |
| `/admin/users/login-history`       | Login log browser with filters               | SUPER_ADMIN         |
| `/admin/trash`                     | Tabbed trash by entity type, restore buttons | SUPER_ADMIN         |
| `/admin/announcements`             | Create + history                             | SUPER_ADMIN         |
| `/admin/consent-logs`              | Consent history table                        | SUPER_ADMIN         |
| `/admin/quiz-templates`            | Quiz template library grid                   | ADMIN + SUPER_ADMIN |
| `/admin/quiz-templates/[id]`       | Quiz template editor                         | ADMIN + SUPER_ADMIN |
| `/admin/assignment-templates`      | Assignment template library grid             | ADMIN + SUPER_ADMIN |
| `/admin/assignment-templates/[id]` | Assignment template editor                   | ADMIN + SUPER_ADMIN |

### 7.3 Modified Pages

| Page                  | Change                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `/admin/microsoft`    | SUPER_ADMIN sees Link/Re-link UI; ADMIN sees "Managed by Super Admin" notice                |
| `/admin/settings`     | SUPER_ADMIN sees sub-nav (system, api-keys, permissions); ADMIN sees only existing settings |
| `/admin/courses/[id]` | Add quiz/assignment attachment section showing attached templates with due dates            |
| `AdminShell`          | Fetch current user + role, pass `userRole` to `AdminSidebar`                                |

---

## 8. Quiz & Assignment — Predefined Template Flow

1. **ADMIN creates a template** in Quiz Template Library or Assignment Template Library
2. **ADMIN creates a course** → on the "Content" step, searches templates and attaches them
3. **Attaching** creates a `CourseQuizTemplate` or `CourseAssignmentTemplate` join record with due date and max points
4. **Student enrollment** → course's attached templates appear as pending assignments on student dashboard
5. **Quiz attempt** → student takes inline → auto-graded using template's answers
6. **Assignment submission** → student uploads file → instructor grades manually

---

## 9. Soft-Delete & Restore Flow

1. **Delete:** API sets `deletedAt = now()`, `deletedBy = userId`. Entity excluded from normal queries via `where: { deletedAt: null }` filter.
2. **Query trash:** `GET /api/admin/trash` returns all soft-deleted entities across types.
3. **Restore:** API sets `deletedAt = null`, `deletedBy = null`, `restoredAt = now()`, `restoredBy = userId`.

---

## 10. Seed Data

**File:** `apps/api/prisma/seed.ts`

```typescript
await upsertUser({
  email: "superadmin@lms.local",
  password: "superadmin123",
  name: "Super Admin",
  role: "SUPER_ADMIN",
});
```

Default system settings:

```
platform_name              → "Marvel Slice LMS"
default_session_duration   → 60
max_students_per_batch     → 100
session_timeout_admin      → 480
session_timeout_instructor → 480
session_timeout_student    → 480
```

---

## 11. Implementation Phases

| Phase                  | Duration | Deliverables                                                                      |
| ---------------------- | -------- | --------------------------------------------------------------------------------- |
| **1: Foundation**      | ~2 days  | Prisma schema, shared types, auth middleware, seed, `getSuperAdminId()`           |
| **2: Core SA API**     | ~5 days  | User management, RBAC, system settings, API keys, quiz/assignment template APIs   |
| **3: Logging**         | ~4 days  | Activity logs + 10s polling, login history, analytics errors, consent logs        |
| **4: Operations**      | ~4 days  | Soft-delete + trash/restore, session timeout, Microsoft page rewrite, sidebar nav |
| **5: UI Pages**        | ~6 days  | All 13 new pages, in-app notification bell, course attachment UI                  |
| **6: Service Updates** | ~2 days  | Update session/ticket/recording/calendar services to use `superAdminId`           |

**Total estimate:** ~23 days

---

## 12. Files to Create

```
API:
  apps/api/src/utils/super-admin.ts
  apps/api/src/modules/super-admin/super-admin.routes.ts
  apps/api/src/modules/super-admin/super-admin.controller.ts
  apps/api/src/modules/api-keys/api-key.controller.ts
  apps/api/src/modules/api-keys/api-key.service.ts
  apps/api/src/modules/api-keys/api-key.routes.ts
  apps/api/src/modules/settings/setting.controller.ts
  apps/api/src/modules/settings/setting.service.ts
  apps/api/src/modules/settings/setting.routes.ts
  apps/api/src/modules/logs/log.controller.ts
  apps/api/src/modules/logs/log.service.ts
  apps/api/src/modules/logs/log.routes.ts
  apps/api/src/modules/permissions/permission.controller.ts
  apps/api/src/modules/permissions/permission.service.ts
  apps/api/src/modules/permissions/permission.routes.ts
  apps/api/src/modules/quiz-templates/quiz-template.controller.ts
  apps/api/src/modules/quiz-templates/quiz-template.service.ts
  apps/api/src/modules/quiz-templates/quiz-template.routes.ts
  apps/api/src/modules/assignment-templates/assignment-template.controller.ts
  apps/api/src/modules/assignment-templates/assignment-template.service.ts
  apps/api/src/modules/assignment-templates/assignment-template.routes.ts

Web:
  apps/web/src/app/admin/logs/page.tsx
  apps/web/src/app/admin/logs/stats/page.tsx
  apps/web/src/app/admin/settings/system/page.tsx
  apps/web/src/app/admin/settings/api-keys/page.tsx
  apps/web/src/app/admin/settings/permissions/page.tsx
  apps/web/src/app/admin/users/login-history/page.tsx
  apps/web/src/app/admin/trash/page.tsx
  apps/web/src/app/admin/announcements/page.tsx
  apps/web/src/app/admin/consent-logs/page.tsx
  apps/web/src/app/admin/quiz-templates/page.tsx
  apps/web/src/app/admin/quiz-templates/[id]/page.tsx
  apps/web/src/app/admin/assignment-templates/page.tsx
  apps/web/src/app/admin/assignment-templates/[id]/page.tsx
  apps/web/src/app/admin/courses/new/steps/attach-quizzes.tsx
  apps/web/src/app/admin/courses/new/steps/attach-assignments.tsx
```

## 13. Files to Modify

```
API:
  apps/api/prisma/schema.prisma
  apps/api/prisma/seed.ts
  apps/api/src/middleware/auth.middleware.ts
  apps/api/src/modules/auth/auth.controller.ts
  apps/api/src/modules/sessions/session.service.ts
  apps/api/src/modules/tickets/ticket.service.ts
  apps/api/src/modules/recordings/recording.service.ts
  apps/api/src/modules/calendar/calendar.service.ts
  packages/types/src/index.ts

Web:
  apps/web/src/components/AdminSidebar.tsx
  apps/web/src/components/AdminShell.tsx
  apps/web/src/app/admin/microsoft/page.tsx
  apps/web/src/app/admin/settings/page.tsx
  apps/web/src/app/admin/courses/[id]/page.tsx
```
