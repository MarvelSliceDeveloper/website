# Phase 3 — Multi-Tenancy (CANCELLED)

> [!IMPORTANT]
> This phase has been **CANCELLED**.
> The project has pivoted from a B2B Multi-Tenant SaaS to a **Centralized Content Marketplace** (similar to Udemy).
> Data isolation at the tenant level is no longer required as all users and courses exist within a single platform context.

> ⏱️ **Original Duration**: Weeks 4–5 (2 weeks)  
> 📌 **Status**: Cancelled / Not Applicable  
> 🔗 **Depends on**: Phase 2

---

## 🎯 Objective (Original)

Implement complete multi-tenant architecture with full data isolation, tenant-aware routing, and an onboarding flow for new organisations.

---

## ✅ Tasks

### 3.1 — Routing Strategy Decision

- [ ] **Choose approach**: Subdomain vs Path-based routing
  - **Subdomain** (`acme.yourlms.com`): Requires wildcard DNS + wildcard SSL
  - **Path-based** (`yourlms.com/acme`): Simpler to start, easier local dev
  - **Recommended**: Start with path-based, migrate to subdomain later
- [ ] Implement chosen routing in Next.js App Router:
  - Path-based: `/(tenant)/[tenantSlug]/...`
  - Subdomain: Custom middleware to extract subdomain → resolve tenant
- [ ] Configure tenant slug validation (alphanumeric, lowercase, 3-30 chars)
- [ ] Reserve slugs: `admin`, `api`, `auth`, `www`, `app`, `dashboard`

### 3.2 — Tenant Resolver Middleware

- [ ] Create backend middleware: `tenantResolver`
  - Extract tenant from URL path or subdomain
  - Query database for tenant by slug
  - Attach `req.tenant` (id, slug, name, plan, config)
  - Return 404 if tenant not found
  - Cache tenant lookups in Redis (TTL: 5 min)
- [ ] Create frontend utility: `useTenant()` hook
  - Extract tenant slug from URL params
  - Fetch tenant config on mount
  - Provide tenant context to all child components
- [ ] Create `TenantProvider` context component

### 3.3 — Data Isolation

- [ ] **Application-level isolation**:
  - Add `tenantId` filter to ALL database queries (Prisma middleware)
  - Create Prisma middleware that automatically injects `tenantId` on:
    - `create` — adds `tenantId` from context
    - `findMany` / `findFirst` — adds `WHERE tenantId = ...`
    - `update` / `delete` — adds `WHERE tenantId = ...`
  - Ensure no query can ever access data from another tenant
- [ ] **🆕 Database-level isolation (Row-Level Security)**:
  - Create PostgreSQL RLS policies on all tenant-scoped tables
  - Set `current_setting('app.tenant_id')` on each connection
  - RLS as safety net — if application middleware fails, DB blocks cross-tenant access
  ```sql
  ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON "Course"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```
- [ ] Write a test that proves a query for Tenant A cannot return Tenant B data
- [ ] Audit all existing queries (from Phase 1–2) to ensure tenant scoping

### 3.4 — Tenant Onboarding Flow

- [ ] Create Super Admin endpoint: `POST /api/tenants`
  - Accepts: name, slug, adminEmail, plan
  - Creates Tenant record
  - Creates Admin user for the new tenant
  - Sends welcome email to admin (with login credentials)
- [ ] Create self-service onboarding (optional, for public sign-up):
  - `POST /api/tenants/register`
  - Creates tenant + admin account
  - Starts on free plan
  - Sends verification email
- [ ] Create onboarding wizard frontend:
  - Step 1: Organisation name + slug
  - Step 2: Admin account details
  - Step 3: Plan selection (free/pro/enterprise)
  - Step 4: Confirmation + redirect to dashboard

### 3.5 — Tenant Configuration

- [ ] Create `TenantConfig` table or JSON column on Tenant:
  - `brandColor` — primary theme color
  - `logo` — URL to logo image
  - `customDomain` — custom domain mapping (future)
  - `features` — feature flags per tenant (e.g., quizzes enabled, forums enabled)
  - `maxUsers` — user limit per plan
  - `maxCourses` — course limit per plan
- [ ] Create API endpoint: `PATCH /api/tenants/:id/config` (admin only)
- [ ] Apply tenant branding on frontend (CSS custom properties from config)

### 3.6 — 🆕 Tenant-Aware Super Admin Views

- [ ] Super Admin can list all tenants: `GET /api/admin/tenants`
- [ ] Super Admin can switch tenant context (impersonate)
- [ ] Super Admin can disable/enable a tenant
- [ ] Super Admin can view cross-tenant statistics

### 3.7 — 🆕 Tenant Plan Limits Enforcement

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
| Tenant routing (path or subdomain) | `/acme/dashboard` resolves to correct tenant |
| Tenant resolver middleware | `req.tenant` populated on all requests |
| Data isolation (app level) | Prisma middleware injects tenantId |
| Data isolation (DB level) | RLS policies block cross-tenant access |
| Tenant onboarding | New org can be created and admin can log in |
| Tenant config | Branding applied per tenant |
| Plan limits | Free plan enforces user/course limits |

---

## 🧪 Tests to Write

- [ ] Unit: Tenant slug validation accepts/rejects correctly
- [ ] Unit: Prisma middleware injects tenantId on create
- [ ] Unit: Prisma middleware filters by tenantId on find
- [ ] Integration: Creating a course in Tenant A is invisible to Tenant B
- [ ] Integration: RLS blocks direct SQL that omits tenantId
- [ ] Integration: Tenant onboarding creates tenant + admin user
- [ ] Integration: Plan limits reject over-capacity requests
- [ ] E2E: Full onboarding flow → admin dashboard

