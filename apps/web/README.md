# LMS Web Application

This Next.js 14 application uses the **App Router** and serves as the unified frontend for Students, Instructors, and Admins.

## Directory Structure

```text
/app
  /(auth)                           → Login, Registration, MS Callback pages
  /(tenant)/[tenantSlug]            → Student-facing LMS (Courses, Dashboard)
  /(instructor)/[tenantSlug]/panel  → Instructor Dashboard (Create courses, schedule sessions)
  /(admin)/dashboard                → Super Admin Global Dashboard
/components
  /ui                               → shadcn/ui components
  /layout                           → Navbars, Sidebars, Footers
  /shared                           → Reusable components across roles
/lib
  /api.ts                           → Axios instance & API calls
  /auth.ts                          → NextAuth configuration
  /msal.ts                          → Microsoft Authentication Library setup
/hooks                              → Custom React hooks (e.g. useTenant, useUser)
```

## Styling
We use **Tailwind CSS** mapped to standard design tokens. Do not use raw colors (e.g., `text-red-500`); instead, use semantic tokens (e.g., `text-destructive`).

## Data Fetching
This app leverages Server Components by default. Fetch data directly in `page.tsx` or `layout.tsx` when possible. Pass data down to interactive Client Components (marked with `"use client"`).

Client-side requests to `/api/*` are rewritten by Next.js to the backend API defined by `NEXT_PUBLIC_API_URL` and default to `http://localhost:4000` in local development.

## Authentication
The login form calls `POST /api/auth/login` on the API server and relies on the HTTP-only auth cookie. Run the API and seed demo users with `pnpm prisma:seed` before signing in.
