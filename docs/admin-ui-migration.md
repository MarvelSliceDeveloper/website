# Admin UI Migration — Tailwind → Flat/Light Bootstrap-Like

## Goal

Redesign admin pages from dark glassmorphism → flat light classic admin template look (AdminLTE / CoreUI style) while keeping Tailwind v4 (no Bootstrap).

## Approach

- **CSS variable overrides** scoped via `[data-section="admin"]` — handles 80% of visual change
- **Radix UI** for form controls (`<select>` replacement) and dropdown menus
- **No Bootstrap** — all changes use existing Tailwind + new CSS classes

---

## Completed (Session 1)

### Phase 0 — CSS Foundation

- [x] Added `[data-section="admin"]` scope to `globals.css` with flat/light CSS variable overrides
- [x] Replaced `.glass-card` with solid `.card` (white bg, `1px solid #e3e6ea`, subtle shadow)
- [x] Replaced `.btn-primary/secondary/danger` with flat versions (no gradients, no transforms, no box-shadow)
- [x] Replaced `.field` with flat white input styling
- [x] Overrode header backdrop blur → solid, removed radial gradients from admin body
- [x] Overrode modal backdrop blur → solid `bg-black/40`
- [x] Added `.panel` and striped table styles

### Phase 1 — Layout Shell

- [x] **`AdminShell.tsx`** — Wrapped in `<div data-section="admin">`
- [x] **`AdminSidebar.tsx`** — Flat sidebar: `rounded-none` nav items, left border accent for active state, compact logo area, flat profile section
- [x] **`Header.tsx`** — Solid white bar, compact (h-12), flat icon buttons (no card borders), flat notification dropdown
- [x] **`AppShell.tsx`** — Removed `max-w-7xl` constraint, reduced padding for data density

### Phase 2 — Radix Components

- [x] Installed `@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`, `clsx`, `tailwind-merge`
- [x] Created `lib/ui/utils.ts` — `cn()` utility
- [x] Created `components/ui/select.tsx` — Radix Select with admin-flat styling
- [x] Created `components/ui/dropdown-menu.tsx` — Radix DropdownMenu

### Phase 3 — Shared Components

- [x] **`DataTable.tsx`** — Striped rows, compact padding, flat card wrapper
- [x] **`FormModal.tsx`** — Solid backdrop, removed scale animation, flat card
- [x] **`ConfirmModal.tsx`** — Same + flat icon container
- [x] **`StatCard.tsx`** — Flat colored icon squares (blue/green/orange/red/purple), removed gradient prop, replaced `glass-card` with `border border-border bg-card`
- [x] **`LoadingSkeleton.tsx`** — Flat pulse placeholders
- [x] **`AdminPageHeader.tsx`** — Minor adjustments

### Phase 4 — Pilot Page

- [x] **`Users page`** — Replaced native `<select>` with Radix `<Select>`, flat avatar backgrounds, flat role badges

### Cleanup

- [x] Removed unused imports
- [x] Lint passes (only pre-existing errors remain)

---

## Completed (Session 2 — Charts + Select Migration + Gradient Cleanup)

### Phase 5 — ApexCharts Migration

- [x] Installed `apexcharts` + `react-apexcharts` (replaces `recharts`)
- [x] **`dashboard/page.tsx`** — Full rewrite: Bar, Area (gradient fill), Donut, and Bar charts using ApexCharts. Removed `CustomTooltip`, SVG `<defs>`, recharts imports. Replaced gradient backgrounds with flat `bg-primary`/`bg-*-100` classes. Fixed StatCard props to use `variant` instead of ignored `gradient`.
- [x] **`reports/page.tsx`** — Full rewrite: 6 charts (Bar, Area, Donut ×2, Horizontal Bar, Bar revenue). Removed `CustomTooltip`, SVG `<defs>`, `glass-card` → `border border-border bg-card`. ApexCharts handles tooltips, gradients, and legends natively.

### Phase 6 — Native `<select>` → Radix `<Select>` (all 11 replaced)

| File                                                       | Count | Status |
| ---------------------------------------------------------- | ----- | ------ |
| `sessions/new/page.tsx`                                    | 4     | [x]    |
| `batches/new/page.tsx`                                     | 2     | [x]    |
| `notifications/send/page.tsx`                              | 1     | [x]    |
| `enrollments/page.tsx`                                     | 1     | [x]    |
| `mentorship/page.tsx`                                      | 1     | [x]    |
| `calendar/page.tsx`                                        | 1     | [x]    |
| `courses/[id]/_components/ModuleStudyMaterialsSection.tsx` | 1     | [x]    |

### Phase 7 — Gradient Cleanup (all resolved)

| File                             | Changes                                                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard/page.tsx`             | Greeting banner: `bg-linear-to-r` → `bg-card`, avatar `bg-linear-to-br`→ `bg-primary`, quick action icons `bg-gradient-to-br from-*-to-*` → flat `bg-*-100 text-*-600` |
| `settings/page.tsx` (line 532)   | Avatar `bg-linear-to-br from-primary to-violet-600` → `bg-primary`                                                                                                     |
| `courses/page.tsx` (line 186)    | Thumbnail `bg-gradient-to-br from-primary/30 to-accent/20` → `bg-primary/15`                                                                                           |
| `mentorship/page.tsx` (line 323) | Local `StatCard` `bg-gradient-to-r from-*-to-*` → flat `bg-*` accent bars                                                                                              |
| `enrollments/page.tsx`           | Avatar `bg-linear-to-br from-primary/30 to-accent/20` → `bg-primary/15`                                                                                                |

---

---

## Completed (Session 3 — Instructor Theme)

### Phase 8 — Instructor Shell & Sidebar

- [x] **`InstructorShell.tsx`** — Wrapped in `<div data-section="admin">` so CSS variable overrides apply
- [x] **`InstructorSidebar.tsx`** — Profile avatar: `bg-violet-500/20 text-violet-400` → `bg-primary/15 text-primary`

### Phase 9 — Instructor Select Migration (7 native → Radix)

| File                                           | Count                                           | Status |
| ---------------------------------------------- | ----------------------------------------------- | ------ |
| `sessions/page.tsx`                            | 3 (course, batch, module in create modal)       | [x]    |
| `assignments/CreateAssignmentModal.tsx`        | 1 (batch)                                       | [x]    |
| `assignments/InstructorAssignmentsContent.tsx` | 1 (batch)                                       | [x]    |
| `assignments/AssignmentCreateForm.tsx`         | 1 (disabled batch → replaced with text display) | [x]    |
| `assignments/AssignmentsPageContent.tsx`       | 1 (batch filter)                                | [x]    |

### Phase 10 — Instructor Gradient Cleanup (all resolved)

| File                           | Changes                                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard/page.tsx`           | Greeting banner `bg-linear-to-r`→`bg-card`, avatar `bg-linear-to-br`→`bg-primary`, stat icons `bg-gradient-to-br from-*-to-*`→flat `bg-*-100 text-*-600`, session icon gradient→flat `bg-primary/15 text-primary` |
| `settings/page.tsx` (line 534) | Avatar `bg-linear-to-br from-primary to-violet-600`→`bg-primary`                                                                                                                                                  |
| `sessions/page.tsx`            | Header `text-violet-400`→`text-primary-hover`                                                                                                                                                                     |

### Phase 11 — Glass-card → Flat card (instructor pages)

- All `glass-card` references in instructor pages render correctly via CSS overrides; major pages (dashboard, settings, sessions) explicitly updated to `border border-border bg-card`

---

## Remaining

### Bulk audit pages

- `courses/new/page.tsx` — form page
- `courses/[id]/page.tsx` — 1508 lines, course designer
- `batches/[id]/page.tsx` — batch detail
- `inbox/*/page.tsx` — 4 files

### Stretch

- Add `<DropdownMenu>` for action columns in DataTable pages (replacing inline Edit/Delete buttons)
- Remove dark mode toggle from admin header (spec says light-only admin)
- Verify student portal is unaffected
