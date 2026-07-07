# Plan: Student Dashboard Bugfixes + UI Improvements

## Scope
- Fix critical bugs in student dashboard pages
- Consolidate duplicate components
- Improve modal accessibility
- Create shared Spinner component

## Critical Bugs Found

### 1. `loadingBatch` dead state in `page.tsx:528-540`
`loadingBatch` is declared but never set to `true` in the fetchBatch useEffect. The LoadingView works only because `!batch` check passes, but state is unused.

### 2. `handleMentorshipSubmit` triggers full-page loading (`page.tsx:557`)
Sets `setIsLoading(true)` which shows full-portal spinner instead of scoped loading.

### 3. `fetchBatch` failure silently hangs (`page.tsx:532-536`)
If API fails, returns null silently. User stays on LoadingView forever with no error.

### 4. `supportTimeAgo` impure render in `HomeView.tsx:207-216`
`Date.now()` called during render. Violates purity rules.

## Improvements

### 5. Consolidate duplicate StatusBadge (Badge.tsx + shared/StatusBadge.tsx)
### 6. Consolidate duplicate EmptyState (shared/ + admin/)
### 7. Fix FormModal/ConfirmModal accessibility (Escape key, aria attributes)
### 8. Create shared Spinner component
### 9. Fix `window.location.href` → useRouter in instructor dashboard
