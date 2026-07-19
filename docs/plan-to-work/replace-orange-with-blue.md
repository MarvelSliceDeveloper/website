# Plan: Replace Orange with Indigo Blue + White Backgrounds

## Status: COMPLETED

## What Was Done

### 1. Global CSS Variables (globals.css)

- `--primary: #f97316` → `#4F46E5` (indigo-600) across all 4 theme blocks
- `--primary-hover: #fb923c` → `#6366F1` (indigo-500) across all 4 theme blocks
- `.btn-primary` gradient end: `#ea580c` → `#4338CA` (indigo-700)
- Admin `.btn-danger:hover` background: `#fef1e0` → `#eef2ff` (indigo-50)

### 2. Component Color Classes

- `StudentPortalShell.tsx`: "Slice" logo text `text-orange-500` → `text-indigo-500`
- `StudentStatTiles.tsx`: success gradient `from-amber-500 to-orange-600` → `from-blue-500 to-indigo-600`
- `HomeView.tsx`: Mentorship action tile orange classes → indigo equivalents
- `calendar/page.tsx`: `#f97316` → `#4F46E5` in course colors

### 3. What Was NOT Changed (intentionally)

- **StatCard.tsx orange variant**: Uses `--warning` (amber), not `--primary` (orange) — semantic, not brand
- **Dashboard variant: "orange"**: Same — maps to warning color, not brand
- **Icons**: All 98 Tabler icons are MIT open-source — no changes needed
- **Backgrounds**: Already white everywhere (`--background: #ffffff`)
- **Email templates**: Already use indigo (`#4f46e5`)

## Files Modified

1. `apps/web/src/app/globals.css` — 9 lines (CSS variables + gradient)
2. `apps/web/src/components/StudentPortalShell.tsx` — 1 line
3. `apps/web/src/components/student/StudentStatTiles.tsx` — 1 line
4. `apps/web/src/app/student/_views/HomeView.tsx` — 2 lines
5. `apps/web/src/app/admin/calendar/page.tsx` — 1 line

## Cascading Changes (automatic)

All `border-t-primary` spinners (6 loading.tsx files, Spinner component, inline spinners) now render in indigo instead of orange — no code changes needed.
