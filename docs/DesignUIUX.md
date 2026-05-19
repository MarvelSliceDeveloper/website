# UI/UX Redesign Notes (Core Flow)

## Scope Completed
- Shared visual system (colors, typography mapping, controls, spacing helpers)
- Shared shell components:
  - `Header`
  - `Sidebar` (student)
  - `AdminSidebar` (admin)
  - Student/Admin layout content container alignment
- Core pages:
  - `/login`
  - `/student/dashboard`
  - `/admin/mentorship`

## What Changed
- Rebuilt the visual foundation in `globals.css` with a cleaner dark theme, stronger contrast, consistent radius, and reusable primitives (`.field`, `.panel`, improved `.btn-*`, improved `.glass-card`).
- Fixed font variable mapping to match `layout.tsx` (`--font-body`, `--font-display`) for consistent typography.
- Updated root body classes to use valid theme tokens (`bg-background`, `text-foreground`, `font-sans`).
- Standardized spacing and max-width containers to improve alignment across screen sizes.
- Redesigned login experience with a clear two-panel desktop layout and cleaner mobile fallback.
- Improved dashboard hierarchy (header, stats, upcoming sessions, mentorship CTA, progress blocks).
- Improved admin mentorship UX with cleaner controls, better filter affordance, and responsive table behavior.

## Design Principles Applied
- Consistent spacing scale and section rhythm
- Better visual hierarchy with labels + titles + supportive copy
- Desktop-first shell with predictable content width and responsive degradation
- Clearer interactive states for buttons, tabs, inputs, and focus outlines

## Student Portal Updates (Single-Page)
- Added reusable student components under `apps/web/src/components/student/`:
  - `StudentTopNoticeBar`
  - `StudentStatTiles`
  - `StudentSectionTabs`
  - `OverdueAssignmentsPanel`
  - `StudentTable`
  - `PaginationBar`
- Updated `StudentPortalShell` with a persistent top notice strip and theme switcher (sun/moon).
- Added light-theme token overrides in `globals.css` using `data-theme="light"`.
- Refactored student home to use reusable stat tiles + section tabs + overdue assignments panel.
- Added production-real tab gating so non-API-backed areas (notifications/messages/support) are hidden from the section tabs.
- Upgraded recording player to a two-pane layout:
  - left: player, metadata, actions
  - right: module accordion with active recording and per-item progress bars
- Reused `StudentTable` + `PaginationBar` in batch recordings list (`BatchDetailView`) to standardize tabular UI and pagination behavior.
- Added explicit module-to-recording mapping fields (`moduleId`, `sessionId`) in student batch recording data contract.
- Updated recording grouping logic to map recordings by exact `moduleId` instead of index/chunk-based fallback.
- Backend recordings batch list now includes explicit mapping metadata (`sessionId`, `moduleId`, `moduleTitle`) for deterministic UI grouping.
