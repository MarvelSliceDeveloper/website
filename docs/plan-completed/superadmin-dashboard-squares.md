# Plan: Super Admin Dashboard — User Distribution Squares & Stat Card Consistency

## Issues Identified

### 1. User Distribution Box Not Square

The four role cards (Super Admins / Admins / Instructors / Students) inside the User Distribution box use `rounded-2xl` + colored gradient backgrounds + colored borders (`card.bg`, `card.border`), which clashes with the flat square styling applied elsewhere on the dashboard.

**Fix:** Convert inner cards to flat square boxes (`border border-border bg-card`, no rounding, no gradient), keeping only the role-colored icon and value text.

### 2. Activity Logs Stat Card Looks Different From The Rest

The "Activity Logs (30d)" card passes `variant: "purple"` to `StatCard`, but the `purple` variant maps to **accent/teal** colors in `StatCard.tsx` (`border-accent/30`, `from-accent/15`) — every other superadmin stat card is indigo/red/orange/green, so this card is the visual outlier.

**Root cause:** Misnamed variant + superadmin stat cards still use the rounded-gradient `StatCard` component while the Admin dashboard (same file) already uses inline flat square cards.

**Fix:** Replace `StatCard` usage in `SuperAdminDashboard` with the same inline flat square card pattern used by `AdminDashboard` (lines 553-579). All cards become uniform — the Activity Logs card no longer stands out.

## Files to Modify

1. `apps/web/src/app/admin/dashboard/page.tsx`:
   - `saCards` — drop `variant` field (no longer needed)
   - System Stats grid — inline flat square cards replacing `<StatCard>`
   - `userCards` — drop `bg`/`border` gradient fields
   - User Distribution grid — flat square cards, keep role color accents
   - Remove unused `StatCard` import
