# Batch & User Creation Fixes

## Critical Bugs Found

### BUG 1: Packages not visible in users page (ROOT CAUSE)

**File:** `apps/web/src/app/admin/users/page.tsx:145`

```ts
api.get<any[]>("/api/admin/packages")
  .then((res) => {
    const active = (Array.isArray(res) ? res : []).filter(...)
```

**Problem:** `GET /api/admin/packages` returns `{ packages: [...] }` (wrapped object), but the frontend treats `res` as an array. `Array.isArray(res)` is always `false`, so the active packages array is always empty.
**Fix:** Parse `res.packages` instead of treating `res` as an array.

### BUG 2: Batch creation form doesn't support packageId

**File:** `apps/web/src/app/admin/batches/new/page.tsx`
**Problem:** The form only has Course + Instructor dropdowns. No Package selector. The backend `CreateBatchSchema` accepts `packageId` but the UI never sends it.
**Fix:** Add Package selector as first field. When a package is selected, show only courses from that package (instead of all courses).

### BUG 3: "Pending" badge is instructor-only

**File:** `apps/web/src/app/admin/users/page.tsx:336-340`

```tsx
{
  user.role === "INSTRUCTOR" && user.isSuspended && (
    <span className="...">Pending</span>
  );
}
```

**Problem:** The user says to remove this. It's the instructor approval pending indicator, not package-related.

## Changes Required

### 1. Fix packages API response parsing (users page)

**File:** `apps/web/src/app/admin/users/page.tsx:143-153`

- Change `api.get<any[]>("/api/admin/packages")` to `api.get<{ packages: any[] }>("/api/admin/packages")`
- Parse `res.packages` instead of `res`

### 2. Remove "Pending" indicator (users page)

**File:** `apps/web/src/app/admin/users/page.tsx:336-340`

- Remove the instructor "Pending" badge entirely

### 3. Rework batch creation form — Package-first flow

**File:** `apps/web/src/app/admin/batches/new/page.tsx`

- Add Package selector (fetch from `GET /api/admin/packages` → `res.packages`)
- When package is selected, fetch courses from that package (use `GET /api/admin/packages/:id` → includes `courses`)
- Show Course dropdown (filtered to package courses) + Instructor dropdown
- Send `packageId` along with `courseId` in the POST body
- Update description text: "A batch is a cohort of students taking a course in a package together."

### 4. Verify user creation form works end-to-end

**File:** `apps/web/src/app/admin/users/page.tsx`

- After fixing bug #1, the packages will load in the create-user modal
- When a package is selected, `GET /api/admin/batches/by-package/:packageId` fetches courses + available batches
- Per-course batch dropdowns already work — just need the packages to actually load
- Add package name to course/batch labels for clarity (e.g. "Python Basics → Batch A")

### 5. Add package info to batch list page cards

**File:** `apps/web/src/app/admin/batches/page.tsx`

- Show package name (if batch has a `package`) on the batch card

## Missing Workflows Identified

- No student-facing package browse/enrollment page (admin-only enrollment flow — this is expected per the call-based workflow)
- Package detail page approval flow fetches batches per-course in a loop instead of using `getBatchesByPackage` endpoint (N+1 calls, but functional)

## Verification

1. Create a batch with a package selected → verify `packageId` is saved
2. Create a student with a package → verify package displays in users table
3. Verify package filter chips show on users page when STUDENT role is selected
