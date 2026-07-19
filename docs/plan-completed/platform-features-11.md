# LMS Platform Features Implementation Plan

## Overview

11 features to implement across backend API, database schema, and frontend admin UI. Estimated ~120-150 hours total work.

---

## Phase 0: Database Schema Changes (Foundation)

All new features depend on these Prisma model additions.

### 0.1 AuditLog Model (for #6 Per-user audit trail)

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  entityType  String   // User, Course, Batch, etc.
  entityId    String?
  details     Json?    // Before/after diff, metadata
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}
```

### 0.2 Category Model (for #8 Tag/Category management)

```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  courses     Course[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  courses     Course[]
  createdAt   DateTime @default(now())

  @@index([name])
}
```

Course model changes:

- `category String?` → `categoryId String?` + `category Category? @relation(fields: [categoryId], references: [id])`
- `tags Json?` → keep as Json (array of tag IDs) OR add join table `CourseTag`

### 0.3 Certificate Enhancement (for #9 Certificate management)

```prisma
model Certificate {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  courseId         String
  course          Course   @relation(fields: [courseId], references: [id])
  certificateNumber String @unique @default(cuid())
  pdfUrl          String?
  issuedAt        DateTime @default(now())
  claimedAt       DateTime?
  status          CertificateStatus @default(ISSUED)

  @@unique([userId, courseId])
}

enum CertificateStatus {
  ISSUED
  CLAIMED
  REVOKED
}
```

### 0.4 StaticPage Model (for #25 CMS/Static Pages)

```prisma
model StaticPage {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   // Rich HTML/Markdown
  isPublished Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 0.5 EmailTemplate Model (for #4 Email template management)

```prisma
model EmailTemplate {
  id          String   @id @default(cuid())
  name        String   @unique // e.g. "welcome", "reset-password"
  subject     String
  body        String   // HTML/React Email template source
  variables   Json?    // Available template variables
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
}
```

---

## Phase 1: Quick Wins (Features #1, #8, #9, #11, #25)

### Feature #1: Health Page Enhancement

**Files:** `apps/web/src/app/admin/health/page.tsx`
**Changes:**

- Add YouTube API status check (verify YOUTUBE_API_KEY exists)
- Add Razorpay key check (verify RAZORPAY_KEY_ID exists)
- Add Microsoft Graph status (already fixed to use /api/auth/azure-ad/status)
- Show more server metrics: Node.js version, CPU usage, disk space (if available)

### Feature #8: Tag/Category Management

**Backend:**

- `apps/api/src/modules/admin/categories/` - CRUD controller, service, routes
- `apps/api/src/modules/admin/tags/` - CRUD controller, service, routes
- Register routes in `app.ts`

**Frontend:**

- `apps/web/src/app/admin/categories/page.tsx` - Category list + create/edit/delete
- `apps/web/src/app/admin/tags/page.tsx` - Tag list + create/edit/delete
- Update course forms to use category dropdown + tag multi-select from DB

**Sidebar:** Add "Content" group with Categories + Tags

### Feature #9: Certificate Management UI

**Backend:**

- Extend `apps/api/src/modules/certificates/` with admin endpoints:
  - `GET /api/admin/certificates` - List all issued certificates
  - `GET /api/admin/certificates/:id` - Certificate details
  - `POST /api/admin/certificates/:id/revoke` - Revoke certificate
  - `GET /api/admin/certificates/stats` - Certificate statistics

**Frontend:**

- `apps/web/src/app/admin/certificates/page.tsx` - Certificate list with filters
- `apps/web/src/app/admin/certificates/[id]/page.tsx` - Certificate detail
- Show: user, course, issue date, status, certificate number

**Sidebar:** Add under Courses or as standalone item

### Feature #11: Cache Management

**Backend:**

- `apps/api/src/modules/admin/cache/` - Cache management endpoints
- `GET /api/admin/cache/stats` - Redis connection status, memory usage
- `POST /api/admin/cache/flush` - Clear Redis cache (super admin only)
- `POST /api/admin/cache/flush/:pattern` - Clear specific cache pattern

**Frontend:**

- `apps/web/src/app/admin/cache/page.tsx` - Cache status + flush buttons
- Show: connected status, memory used, keys count, flush button

**Note:** Redis is currently not used in the API (no Redis client code). This feature will need to add a Redis client first OR show "Redis not configured" status.

### Feature #25: CMS / Static Pages

**Backend:**

- `apps/api/src/modules/admin/static-pages/` - CRUD controller, service, routes
- `GET/POST/PUT/DELETE /api/admin/static-pages`

**Frontend:**

- `apps/web/src/app/admin/static-pages/page.tsx` - Page list
- `apps/web/src/app/admin/static-pages/new/page.tsx` - Create page (rich text editor)
- `apps/web/src/app/admin/static-pages/[id]/page.tsx` - Edit page

**Sidebar:** Add under Settings or as standalone

---

## Phase 2: Medium Features (Features #3, #4, #6, #14, #17)

### Feature #3: Bulk User Operations

**Backend:**

- `POST /api/admin/users/import` - CSV upload + parse (multer for file upload)
- `POST /api/admin/users/bulk-role` - Bulk role change
- `POST /api/admin/users/bulk-enroll` - Bulk enrollment
- `POST /api/admin/users/bulk-email` - Bulk email notification
- CSV parsing with `csv-parse` or manual parsing

**Frontend:**

- `apps/web/src/app/admin/users/import/page.tsx` - CSV upload with preview
- `apps/web/src/app/admin/users/page.tsx` - Add bulk actions (select checkboxes)
- Bulk action toolbar: Change Role, Enroll in Course/Batch, Send Email, Export CSV
- CSV upload: drag-drop zone, column mapping, preview table, import button

**Dependencies:** Need to add `csv-parse` or `papaparse` dependency

### Feature #4: Email Template Management

**Backend:**

- `apps/api/src/modules/admin/email-templates/` - CRUD endpoints
- `GET /api/admin/email-templates` - List templates
- `GET /api/admin/email-templates/:id` - Template detail
- `PUT /api/admin/email-templates/:id` - Update template
- `POST /api/admin/email-templates/:id/preview` - Preview with sample data
- `POST /api/admin/email-templates/:id/test` - Send test email

**Frontend:**

- `apps/web/src/app/admin/email-templates/page.tsx` - Template list
- `apps/web/src/app/admin/email-templates/[id]/page.tsx` - Template editor
- Use CodeMirror or Monaco editor for HTML/React Email editing
- Variable insertion helper ({{userName}}, {{courseTitle}}, etc.)
- Preview button showing rendered email

**Sidebar:** Add under Settings

### Feature #6: Per-User Audit Trail

**Backend:**

- `apps/api/src/modules/admin/audit-logs/` - Audit log endpoints
- `GET /api/admin/audit-logs` - List all audit logs (with filters)
- `GET /api/admin/audit-logs/user/:userId` - User-specific audit trail
- `POST /api/admin/audit-logs` - Create audit log entry (internal use)

**Frontend:**

- `apps/web/src/app/admin/audit-logs/page.tsx` - Full audit log viewer
- `apps/web/src/app/admin/users/[id]/audit/page.tsx` - Per-user audit trail
- On user detail page, add "Activity" tab showing all their actions
- Filters: action type, entity type, date range, user

**Integration:** Wrap key API mutations with audit logging middleware

### Feature #14: Branding / Theme Customization

**Backend:**

- Extend `SystemSetting` model or add `BrandingConfig` model
- `GET /api/admin/branding` - Get current branding config
- `PUT /api/admin/branding` - Update branding
- `POST /api/admin/branding/logo` - Upload logo (multer)
- `POST /api/admin/branding/favicon` - Upload favicon

**Frontend:**

- `apps/web/src/app/admin/branding/page.tsx` - Branding editor
- Color picker for primary, secondary, accent colors
- Logo upload with preview
- Favicon upload
- Custom CSS textarea
- Live preview panel showing how changes look
- White-label domain configuration (text field)

**Sidebar:** Add under Settings

### Feature #17: i18n Management

**Backend:**

- `GET /api/admin/i18n/locales` - List available locales
- `GET /api/admin/i18n/:locale` - Get translation file
- `PUT /api/admin/i18n/:locale` - Update translation file
- `POST /api/admin/i18n/:locale/import` - Import translation file

**Frontend:**

- `apps/web/src/app/admin/i18n/page.tsx` - Locale management
- Show all locales with key count, completion percentage
- Translation editor: side-by-side source/target
- Key search/filter
- Export/import translation files

**Sidebar:** Add under Settings

---

## Phase 3: Heavy Features (Features #5)

### Feature #5: Payment / Revenue Dashboard

**Backend:**

- `GET /api/admin/payments/dashboard` - Aggregated stats (revenue by period, enrollment counts)
- `GET /api/admin/payments/revenue` - Already exists, extend with more metrics
- `GET /api/admin/payments/failures` - Payment failure analysis
- `GET /api/admin/payments/refunds` - Refund tracking
- `GET /api/admin/payments/export` - CSV export of payment data

**Frontend:**

- `apps/web/src/app/admin/payments/page.tsx` - Revenue dashboard
- Revenue by period (daily/weekly/monthly) chart
- Revenue by course/package breakdown
- Payment success/failure rate
- Recent transactions table
- Refund tracking
- Razorpay reconciliation view
- Export to CSV button

**Charts:** Use Recharts (already in project dependencies)

---

## Implementation Order

| #         | Feature                                                                          | Priority   | Est. Hours  | Depends On |
| --------- | -------------------------------------------------------------------------------- | ---------- | ----------- | ---------- |
| 0         | Schema changes (AuditLog, Category, Tag, Certificate, StaticPage, EmailTemplate) | Foundation | 3-4h        | None       |
| 1         | Health page enhancement                                                          | Quick      | 1h          | None       |
| 8         | Tag/Category management                                                          | Quick      | 4-5h        | Schema     |
| 9         | Certificate management UI                                                        | Quick      | 3-4h        | Schema     |
| 11        | Cache management                                                                 | Quick      | 2-3h        | None       |
| 25        | CMS/Static pages                                                                 | Quick      | 3-4h        | Schema     |
| 6         | Per-user audit trail                                                             | Medium     | 5-6h        | Schema     |
| 3         | Bulk user operations                                                             | Medium     | 6-8h        | None       |
| 4         | Email template management                                                        | Medium     | 5-6h        | Schema     |
| 14        | Branding customization                                                           | Medium     | 4-5h        | None       |
| 17        | i18n management                                                                  | Medium     | 4-5h        | None       |
| 5         | Payment/revenue dashboard                                                        | Heavy      | 8-10h       | None       |
| **Total** |                                                                                  |            | **~50-60h** |            |

---

## Sidebar Updates

New navigation items to add:

### Super Admin section additions:

- **Content** (group)
  - Categories → `/admin/categories`
  - Tags → `/admin/tags`
- **System** (group)
  - Cache → `/admin/cache`
  - Email Templates → `/admin/email-templates`
  - Branding → `/admin/branding`
  - i18n → `/admin/i18n`
- **Content Management**
  - Static Pages → `/admin/static-pages`

### Admin section additions:

- **Users** (add sub-items)
  - Import Users → `/admin/users/import`
  - Audit Logs → `/admin/audit-logs`
- **Certificates** → `/admin/certificates`
- **Payments** → `/admin/payments` (enhanced revenue dashboard)

---

## Key Dependencies to Add

| Package                    | Purpose                           | Feature |
| -------------------------- | --------------------------------- | ------- |
| `csv-parse` or `papaparse` | CSV parsing for bulk import       | #3      |
| `ioredis`                  | Redis client for cache management | #11     |
| `@codemirror/lang-html`    | HTML editor for email templates   | #4      |

---

## Notes

- Redis is NOT currently used in the API — cache management (#11) will need to add Redis client first
- Category/Tag are free-text fields on Course currently — migration needed
- Certificate model exists but is minimal — needs enhancement
- Email templates are React Email components — management UI needs to handle JSX/HTML
- i18n has only 51 English keys — will need to expand significantly
