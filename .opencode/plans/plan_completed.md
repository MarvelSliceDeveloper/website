# Admin Dashboard & Reports Plan

## Goal
Add 4 charts to the admin dashboard and create a separate Reports page with all charts + extras.

## Backend: Dashboard API Endpoint

### New files
- `apps/api/src/modules/dashboard/dashboard.controller.ts`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`

### Endpoint: `GET /api/admin/dashboard/stats`
Returns aggregated data:
- `studentsPerCourse` — `enrollmentRequest` grouped by `courseId` with `APPROVED` status
- `enrollmentTrend` — `enrollmentRequest.appliedAt` grouped by month (cumulative)
- `batchDistribution` — `batch` grouped by `status`
- `revenueTrend` — `payment` where `status='paid'`, summed by month
- `userRoleDistribution` — `user` grouped by `role`
- `recentEnrollments` — last 10 with user/course info
- `topCourses` — top 5 courses by enrollment count

### Modified file
- `apps/api/src/index.ts` — mount dashboard router

## Frontend: Admin Dashboard

### Install
- `recharts` in apps/web

### Modified file
- `apps/web/src/app/admin/dashboard/page.tsx` — add 4 chart widgets in 2x2 grid

### Charts on Dashboard
1. **Bar Chart** — Students per Course
2. **Area Chart** — Enrollment Growth Over Time (cumulative)
3. **Donut Chart** — Batch Status Distribution
4. **Bar Chart** — Monthly Revenue Trend

## Frontend: Reports Page

### New file
- `apps/web/src/app/admin/reports/page.tsx`

All dashboard charts (larger) + additional:
- **Pie Chart** — User Role Distribution
- **Horizontal Bar** — Top Courses by Enrollment

## Sidebar Navigation

### Modified file
- `apps/web/src/components/AdminSidebar.tsx` — add Reports nav item under Overview

## Files Summary
| File | Action |
|------|--------|
| `apps/api/src/modules/dashboard/dashboard.controller.ts` | Create |
| `apps/api/src/modules/dashboard/dashboard.routes.ts` | Create |
| `apps/api/src/index.ts` | Edit |
| `apps/web/package.json` | Edit (add recharts) |
| `apps/web/src/app/admin/dashboard/page.tsx` | Edit |
| `apps/web/src/app/admin/reports/page.tsx` | Create |
| `apps/web/src/components/AdminSidebar.tsx` | Edit |
