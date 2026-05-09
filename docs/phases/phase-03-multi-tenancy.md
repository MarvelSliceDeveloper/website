# Phase 3 — Multi-Tenancy (CANCELLED)

> [!IMPORTANT]
> This phase has been **CANCELLED**.
> The project has pivoted from a B2B Multi-platform SaaS to a **Centralized Content Marketplace** (similar to Udemy).
> Data isolation at the platform level is no longer required as all users and courses exist within a single platform context.

> ⏱️ **Original Duration**: Weeks 4–5 (2 weeks)  
> 📌 **Status**: Cancelled / Not Applicable  
> 🔗 **Depends on**: Phase 2

---

## 🎯 Objective (Original)

Implement complete multi-platform architecture with full data isolation, platform-aware routing, and an onboarding flow for new organisations.

---

## ✅ Tasks

### 3.1 — Routing Strategy Decision

- [ ] **Choose approach**: Subdomain vs Path-based routing
  - **Subdomain** (`acme.yourlms.com`): Requires wildcard DNS + wildcard SSL
  - **Path-based** (`yourlms.com/acme`): Simpler to start, easier local dev
  - **Recommended**: Start with path-based, migrate to subdomain later
- [ ] Implement chosen routing in Next.js App Router:
  - Path-based: `/...`
  - Subdomain: Custom middleware to extract subdomain → resolve platform
- [ ] Configure platform slug validation (alphanumeric, lowercase, 3-30 chars)
- [ ] Reserve slugs: `admin`, `api`, `auth`, `www`, `app`, `dashboard`

### 3.2 — platform Resolver Middleware

- [ ] Create backend middleware: `platformResolver`
  - Extract platform from URL path or subdomain
  - Query database for platform by slug
  - Attach `req.platform` (id, slug, name, plan, config)
  - Return 404 if platform not found
  - Cache platform lookups in Redis (TTL: 5 min)
- [ ] Create frontend utility: `useplatform()` hook
  - Extract platform slug from URL params
  - Fetch platform config on mount
  - Provide platform context to all child components
- [ ] Create `platformProvider` context component

### 3.3 — Data Isolation

- [ ] **Application-level isolation**:
  - Add `` filter to ALL database queries (Prisma middleware)
  - Create Prisma middleware that automatically injects `` on:
    - `create` — adds `` from context
    - `findMany` / `findFirst` — adds `WHERE  = ...`
    - `update` / `delete` — adds `WHERE  = ...`
  - Ensure no query can ever access data from another platform
- [ ] **🆕 Database-level isolation (Row-Level Security)**:
  - Create PostgreSQL RLS policies on all platform-scoped tables
  - Set `current_setting('app.platform_id')` on each connection
  - RLS as safety net — if application middleware fails, DB blocks cross-platform access
  ```sql
  ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY platform_isolation ON "Course"
    USING (platform_id = current_setting('app.platform_id')::uuid);
  ```
- [ ] Write a test that proves a query for platform A cannot return platform B data
- [ ] Audit all existing queries (from Phase 1–2) to ensure platform scoping

### 3.4 — platform Onboarding Flow

- [ ] Create Super Admin endpoint: `POST /api/platforms`
  - Accepts: name, slug, adminEmail, plan
  - Creates platform record
  - Creates Admin user for the new platform
  - Sends welcome email to admin (with login credentials)
- [ ] Create self-service onboarding (optional, for public sign-up):
  - `POST /api/platforms/register`
  - Creates platform + admin account
  - Starts on free plan
  - Sends verification email
- [ ] Create onboarding wizard frontend:
  - Step 1: Organisation name + slug
  - Step 2: Admin account details
  - Step 3: Plan selection (free/pro/enterprise)
  - Step 4: Confirmation + redirect to dashboard

### 3.5 — platform Configuration

- [ ] Create `platformConfig` table or JSON column on platform:
  - `brandColor` — primary theme color
  - `logo` — URL to logo image
  - `customDomain` — custom domain mapping (future)
  - `features` — feature flags per platform (e.g., quizzes enabled, forums enabled)
  - `maxUsers` — user limit per plan
  - `maxCourses` — course limit per plan
- [ ] Create API endpoint: `PATCH /api/platforms/:id/config` (admin only)
- [ ] Apply platform branding on frontend (CSS custom properties from config)

### 3.6 — 🆕 platform-Aware Super Admin Views

- [ ] Super Admin can list all platforms: `GET /api/admin/platforms`
- [ ] Super Admin can switch platform context (impersonate)
- [ ] Super Admin can disable/enable a platform
- [ ] Super Admin can view cross-platform statistics

### 3.7 — 🆕 platform Plan Limits Enforcement

- [ ] Create middleware that checks plan limits before operations:
  - Free plan: max 3 courses, 50 users
  - Pro plan: max 50 courses, 500 users
  - Enterprise: unlimited
- [ ] Return 402 (Payment Required) when limit is reached
- [ ] Show upgrade prompt on frontend when approaching limits

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| platform routing (path or subdomain) | `/acme/dashboard` resolves to correct platform |
| platform resolver middleware | `req.platform` populated on all requests |
| Data isolation (app level) | Prisma middleware injects  |
| Data isolation (DB level) | RLS policies block cross-platform access |
| platform onboarding | New org can be created and admin can log in |
| platform config | Branding applied per platform |
| Plan limits | Free plan enforces user/course limits |

---

## 🧪 Tests to Write

- [ ] Unit: platform slug validation accepts/rejects correctly
- [ ] Unit: Prisma middleware injects  on create
- [ ] Unit: Prisma middleware filters by  on find
- [ ] Integration: Creating a course in platform A is invisible to platform B
- [ ] Integration: RLS blocks direct SQL that omits 
- [ ] Integration: platform onboarding creates platform + admin user
- [ ] Integration: Plan limits reject over-capacity requests
- [ ] E2E: Full onboarding flow → admin dashboard

