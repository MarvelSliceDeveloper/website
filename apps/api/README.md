# LMS API Server

This Express backend powers the LMS project. It uses Prisma for PostgreSQL database access and follows a highly modular domain-driven architecture.

## Directory Structure

```text
/prisma
  schema.prisma      → Central database schema
  seed.ts            → Database seeding script
/src
  /modules           → Domain-specific logic (e.g., users, courses, calendar)
    /[moduleName]
      *.routes.ts    → Express Router definitions
      *.controller.ts→ Request/Response handling
      *.service.ts   → Core business logic & database queries
  /middleware        → Global middleware (auth, rate-limit, error handler)
  /jobs              → Bull queue background job processors
  /utils             → Backend-specific helpers
  index.ts           → Entry point and server configuration
```

## Adding a New Module
1. Create a folder in `/src/modules/` (e.g., `analytics`).
2. Create `analytics.routes.ts`, `analytics.controller.ts`, and `analytics.service.ts`.
3. Export the router and import it in `/src/index.ts`.
4. Mount it using `app.use('/api/analytics', analyticsRouter)`.

## Database Schema Updates
1. Modify `prisma/schema.prisma`.
2. Run `pnpm prisma:migrate` from the project root to generate and apply the migration.
3. The Prisma Client will automatically regenerate across the workspace.
