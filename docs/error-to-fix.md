# Errors to Fix

Pre-existing lint issues across the codebase. Not introduced by recent changes. Fix as part of a general code quality pass.

**Last scanned:** `pnpm --filter @lms/web lint` — 140 problems (7 errors, 133 warnings)

---

## Errors (7)

### `react/no-unescaped-entities` — 4 errors

All in `apps/web/src/app/admin/i18n/page.tsx:299`.

Raw `"` characters in JSX. Fix: use `&quot;`, `&ldquo;`, or `&rdquo;`.

### `react-hooks/purity` — 2 errors

`apps/web/src/app/admin/sessions/[sessionId]/page.tsx:168, 237`

`Date.now()` called during render body. Fix: move to `useState` initializer or `useMemo`.

### `react-hooks/preserve-manual-memoization` — 1 error

`apps/web/src/app/admin/packages/[id]/page.tsx:244`

React Compiler skipped memoizing `handleCopyLink` — deps specify `[pkg?.slug]` but inferred dependency is `pkg` (whole object). Fix: align dependency array.

---

## Warnings (133)

### `react-hooks/set-state-in-effect` — 53 warnings

Pattern: `useEffect` calls an async fetch that sets state synchronously. Affects nearly every admin page. The fix is to restructure data fetching (e.g. `use` for React 19, or move initial state out of effect).

**Admin pages (40):**

| File                                                                     | Line          |
| ------------------------------------------------------------------------ | ------------- |
| `src/app/admin/announcements/page.tsx`                                   | 40            |
| `src/app/admin/approvals/page.tsx`                                       | 43            |
| `src/app/admin/assignment-templates/page.tsx`                            | 38            |
| `src/app/admin/audit-logs/page.tsx`                                      | 76            |
| `src/app/admin/batches/[id]/page.tsx`                                    | 101, 106      |
| `src/app/admin/cache/page.tsx`                                           | 39            |
| `src/app/admin/calendar/page.tsx`                                        | 72            |
| `src/app/admin/categories/page.tsx`                                      | 48            |
| `src/app/admin/certificates/page.tsx`                                    | 55            |
| `src/app/admin/consent-logs/page.tsx`                                    | 39            |
| `src/app/admin/courses/[id]/_components/ModuleStudyMaterialsSection.tsx` | 102, 116      |
| `src/app/admin/courses/[id]/_components/RecordingsTab.tsx`               | 25            |
| `src/app/admin/courses/[id]/_components/SessionsTab.tsx`                 | 28            |
| `src/app/admin/courses/[id]/page.tsx`                                    | 72            |
| `src/app/admin/email-templates/page.tsx`                                 | 48            |
| `src/app/admin/enrollments/page.tsx`                                     | 82, 88        |
| `src/app/admin/health/page.tsx`                                          | 174           |
| `src/app/admin/i18n/page.tsx`                                            | 46            |
| `src/app/admin/logs/page.tsx`                                            | 53            |
| `src/app/admin/logs/stats/page.tsx`                                      | 33            |
| `src/app/admin/packages/[id]/page.tsx`                                   | 152, 158      |
| `src/app/admin/packages/enrollments/page.tsx`                            | 99, 105       |
| `src/app/admin/packages/page.tsx`                                        | 65            |
| `src/app/admin/payments/page.tsx`                                        | 89            |
| `src/app/admin/quiz-templates/page.tsx`                                  | 50            |
| `src/app/admin/reports/page.tsx`                                         | 345           |
| `src/app/admin/sessions/[sessionId]/page.tsx`                            | 100, 107      |
| `src/app/admin/settings/api-keys/page.tsx`                               | 41            |
| `src/app/admin/settings/permissions/page.tsx`                            | 59            |
| `src/app/admin/settings/system/page.tsx`                                 | 42            |
| `src/app/admin/static-pages/page.tsx`                                    | 51            |
| `src/app/admin/tags/page.tsx`                                            | 43            |
| `src/app/admin/trash/page.tsx`                                           | 37            |
| `src/app/admin/users/login-history/page.tsx`                             | 39            |
| `src/app/admin/users/page.tsx`                                           | 189, 212, 359 |

**Student pages (7):**

| File                                            | Line          |
| ----------------------------------------------- | ------------- |
| `src/app/student/_views/CourseContentView.tsx`  | 390, 401, 414 |
| `src/app/student/_views/_comps/QuizContent.tsx` | 185           |
| `src/app/student/_views/_comps/VideoPlayer.tsx` | 75            |
| `src/app/student/page.tsx`                      | 632           |
| `src/app/student/settings/page.tsx`             | 154           |

**Shared components (3):**

| File                                    | Line |
| --------------------------------------- | ---- |
| `src/components/Header.tsx`             | 84   |
| `src/components/StudentPortalShell.tsx` | 100  |
| `src/hooks/useUnreadCounts.ts`          | 47   |

---

### `@typescript-eslint/no-unused-vars` — 50 warnings

Unused imports, variables, function definitions, and catch block parameters.

**Unused icon imports:**

| File                                                       | Line  | Unused                                                                  |
| ---------------------------------------------------------- | ----- | ----------------------------------------------------------------------- |
| `src/app/admin/courses/[id]/_components/ContentTab.tsx`    | 6     | `IconGripVertical`                                                      |
| `src/app/admin/courses/[id]/_components/PracticalCard.tsx` | 11    | `IconX`                                                                 |
| `src/app/admin/packages/[id]/page.tsx`                     | 17    | `IconX`                                                                 |
| `src/app/instructor/courses/page.tsx`                      | 4     | `Link`                                                                  |
| `src/app/instructor/sessions/page.tsx`                     | 16-20 | `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` |
| `src/app/student/_views/AssignmentOverdueView.tsx`         | 7     | `IconAlertCircle`                                                       |
| `src/components/student/StudentStatTiles.tsx`              | 7     | `IconTrendingDown`                                                      |

**Unused function definitions / fetch calls:**

| File                                                      | Line    | Unused                           |
| --------------------------------------------------------- | ------- | -------------------------------- |
| `src/app/admin/batches/[id]/page.tsx`                     | 133     | `handleRemoveStudent`            |
| `src/app/admin/inbox/messages/page.tsx`                   | 33      | `fetchConversations`             |
| `src/app/admin/inbox/page.tsx`                            | 35      | `fetch`                          |
| `src/app/instructor/inbox/page.tsx`                       | 94, 225 | `fetch`, `fetchConversations`    |
| `src/app/instructor/support/_comps/SupportTicketList.tsx` | 26      | `fetchTickets`                   |
| `src/app/student/inbox/page.tsx`                          | 26      | `fetchNotifications`             |
| `src/app/student/support/page.tsx`                        | 6, 377  | `EmptyState`, `renderTicketCard` |

**Unused variables / state:**

| File                                                                     | Line     | Unused                                                   |
| ------------------------------------------------------------------------ | -------- | -------------------------------------------------------- |
| `src/app/admin/courses/[id]/_components/ModuleCard.tsx`                  | 22, 145  | `ContentOrderItem`, `resourceOverIdx`                    |
| `src/app/admin/courses/[id]/_components/ModuleStudyMaterialsSection.tsx` | 94       | `selectedLesson`                                         |
| `src/app/admin/i18n/page.tsx`                                            | 20       | `enKeys`                                                 |
| `src/app/admin/packages/[id]/page.tsx`                                   | 220      | `_`                                                      |
| `src/app/admin/packages/enrollments/page.tsx`                            | 133      | `_`                                                      |
| `src/app/admin/reports/page.tsx`                                         | 99, 292  | `ChartDatum`, `PAGE_MARGIN`                              |
| `src/app/admin/sessions/[sessionId]/page.tsx`                            | 73, 171  | `router`, `isPast`                                       |
| `src/app/admin/settings/permissions/page.tsx`                            | 36       | `overrides`                                              |
| `src/app/admin/users/import/page.tsx`                                    | 21       | `csvText`                                                |
| `src/app/catalogue/_hooks/useRazorpayPayment.ts`                         | 163      | `_pkgPrice`                                              |
| `src/app/instructor/sessions/page.tsx`                                   | 85-88    | `batches`, `modules`, `loadingBatches`, `loadingModules` |
| `src/app/student/_views/CourseContentView.tsx`                           | 120, 238 | `goBack`, `selectModule`                                 |
| `src/app/student/_views/HomeView.tsx`                                    | 74       | `firstBatchId`                                           |
| `src/app/student/_views/QuizOverdueView.tsx`                             | 76       | `navigate`                                               |
| `src/app/student/_views/_comps/AssignmentContent.tsx`                    | 21       | `onBack`                                                 |

**Unused catch block parameters:**

| File                                                           | Line   | Unused  |
| -------------------------------------------------------------- | ------ | ------- |
| `src/app/admin/courses/[id]/_components/AddAssignmentForm.tsx` | 49     | `error` |
| `src/app/admin/courses/[id]/_components/AssignmentCard.tsx`    | 70, 83 | `error` |

---

### `@next/next/no-img-element` — 15 warnings

Using `<img>` instead of `next/image`. Most are in auth pages and sidebars.

| File                                                              | Line     |
| ----------------------------------------------------------------- | -------- |
| `src/app/admin/branding/page.tsx`                                 | 264, 308 |
| `src/app/admin/courses/[id]/page.tsx`                             | 197      |
| `src/app/catalogue/[slug]/_components/PackageDetailClient.tsx`    | 134      |
| `src/app/catalogue/[slug]/_components/RazorpayCheckoutWidget.tsx` | 80       |
| `src/app/forgot-password/page.tsx`                                | 45       |
| `src/app/login/page.tsx`                                          | 168, 244 |
| `src/app/reset-password/page.tsx`                                 | 216      |
| `src/app/set-password/page.tsx`                                   | 127, 204 |
| `src/components/AdminSidebar.tsx`                                 | 586      |
| `src/components/BrandLogo.tsx`                                    | 24       |
| `src/components/InstructorSidebar.tsx`                            | 355      |
| `src/components/StudentPortalShell.tsx`                           | 180      |

---

### `react-hooks/exhaustive-deps` — 15 warnings

Missing dependency in `useEffect`. Always the same pattern: fetch function not in dep array.

| File                                           | Line     | Missing dep              |
| ---------------------------------------------- | -------- | ------------------------ |
| `src/app/admin/audit-logs/page.tsx`            | 77       | `fetchLogs`              |
| `src/app/admin/certificates/page.tsx`          | 56       | `fetchData`              |
| `src/app/admin/consent-logs/page.tsx`          | 40       | `fetchLogs`              |
| `src/app/admin/courses/page.tsx`               | 104      | `fetchCourses`           |
| `src/app/admin/enrollments/page.tsx`           | 83       | `fetchEnrollments`       |
| `src/app/admin/mentorship/page.tsx`            | 102      | `fetchData`              |
| `src/app/admin/packages/[id]/page.tsx`         | 153      | `fetchPackage`           |
| `src/app/admin/packages/enrollments/page.tsx`  | 100      | `fetchEnrollments`       |
| `src/app/admin/packages/page.tsx`              | 66       | `fetchPackages`          |
| `src/app/admin/sessions/[sessionId]/page.tsx`  | 101      | `fetchSession`           |
| `src/app/admin/users/login-history/page.tsx`   | 40       | `fetchLogs`              |
| `src/app/admin/users/page.tsx`                 | 173, 232 | `fetchUsers`, `editUser` |
| `src/app/instructor/dashboard/page.tsx`        | 178      | `router`                 |
| `src/app/student/_views/CourseContentView.tsx` | 410      | `expandedModules`        |
