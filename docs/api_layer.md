# API Layer Documentation (`apps/api`)

## Scope
- Actual API folder in this repo is `apps/api` (not root-level `api`).
- Stack: Express + Prisma + Zod + JWT cookies.

## Main Flow (Where code is)
- API bootstrap/server wiring: `apps/api/src/index.ts`
  - Env load, middleware, CORS, static uploads, route mounting, health check, global error handler.
- Auth and role guard: `apps/api/src/middleware/auth.middleware.ts`
- DB client singleton: `apps/api/src/utils/prisma.ts`
- Domain modules: `apps/api/src/modules/*`
  - Each module is split into:
    - `*.routes.ts` (endpoint registration)
    - `*.controller.ts` (request/response and status mapping)
    - `*.service.ts` (business logic and Prisma operations)
- Schema and data model: `apps/api/prisma/schema.prisma`

## Route-to-Code Map (examples)
- `/api/auth/*` → `modules/auth/auth.routes.ts` → `auth.controller.ts` → `auth.service.ts`
- `/api/sessions/*` → `modules/sessions/session.routes.ts` → `session.controller.ts` → `session.service.ts`
- `/api/admin/courses/*` → `modules/courses/course.routes.ts` → `course.controller.ts` → `course.service.ts`

## Current Limitations
1. **Default JWT fallback secret exists** (`auth.middleware.ts`, `auth.service.ts`) if env not set; risky for production.
2. **Global rate limiter applied after route mounts** in `index.ts`; may not protect earlier middleware/handlers as intended.
3. **Error contract is inconsistent** (string messages vs Zod error arrays), requiring defensive frontend parsing.
4. **Permission checks are partly duplicated** (middleware + service-level checks), increasing drift risk.
5. **Session overlap logic is simplified** in `session.service.ts` and may not catch all edge overlaps.
6. **Graph/Teams fallback generates placeholder URL**; good for dev but can mask integration failure if not monitored.

## How to Modify Safely
1. Identify module by endpoint in `src/index.ts` and corresponding `*.routes.ts`.
2. Add/modify request validation in `*.service.ts` Zod schemas first.
3. Keep controller responsibility limited to parse/call service/return status mapping.
4. Keep DB/business rule changes in service layer only.
5. If auth/roles change, update both middleware usage in routes and any service ownership checks.
6. If response shape changes, document in `docs/API.md` and update web calls in `apps/web/src/lib/api.ts` consumers.

## API Change Checklist
- [ ] Route path and HTTP method updated in `*.routes.ts`
- [ ] Input schema updated (Zod) and validated
- [ ] Service logic updated with Prisma-safe query
- [ ] Controller status codes and error payloads mapped
- [ ] Auth/role guards verified (`requireAuth`, `requireRole`)
- [ ] Affected frontend callers reviewed
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` run and checked

## Error Prevention (What to do)
- Enforce required env values (`JWT_SECRET`, `DATABASE_URL`, `WEB_URL`) in deployment.
- Standardize error response format (`{ error: string, details?: unknown }`) across controllers.
- Keep all external integrations (Graph/webhooks) wrapped with explicit fallback logging and alerting.
- Use idempotency checks for webhook-created entities (already done in session creation from Teams).
- Prefer explicit 4xx mappings for known validation/permission/not-found cases; reserve 500 for unknown failures.

## Baseline Validation Notes (before this doc update)
- `pnpm lint` failed: `apps/api` lint script needs `eslint` available in API package context.
- `pnpm build` failed for web due to blocked Google Font fetch in this environment.
- `pnpm test` failed because no API test files were discovered (Vitest exits with code 1).
