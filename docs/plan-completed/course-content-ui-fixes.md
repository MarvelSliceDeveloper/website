# Plan: Course Content & Course View UI Fixes

## Issues Identified

### 1. Search Icon Text Overlap

All search inputs use `IconSearch` (size 15-16) at `left-3` (12px) with `field pl-9` (36px left padding). The math should work (9px gap), but the `.field` class's default `padding: 0.62rem 0.75rem` may conflict. Fix: increase `pl-9` → `pl-10` (40px) for more breathing room across all student search inputs.

**Files:** `CoursesView.tsx`, `HomeView.tsx`, `BrowseCatalogueView.tsx`, `notes/page.tsx`

### 2. Hover Color on Course Content Sidebar

Sidebar items use `hover:bg-muted/30` which is a gray hover — not very visible. The active items use type-specific colors (primary/amber/blue/emerald). Recommend changing inactive hover to `hover:bg-primary/8` for a subtle indigo tint that matches the new brand.

**File:** `CourseContentView.tsx` (lines 640, 694, 734, 783)

### 3. Video Icon Not Great

`IconPlayerPlay` (small play button) is used for lessons. Replace with `IconVideo` for lessons (matches video content semantics) and keep `IconPlayerPlay` only for recordings/playback states.

**File:** `CourseContentView.tsx` sidebar lesson items

### 4. Study Material — Add "Study Material" Label on Top

The study material header already exists in `CourseContentView.tsx` (lines 499-513) with "Study Material" label. But `StudyMaterialContent.tsx` also renders its own duplicate `IconFile` + name header. Remove the duplicate from `StudyMaterialContent.tsx` since the parent already shows it.

**File:** `StudyMaterialContent.tsx`

### 5. Download Option for Study Material (Udemy-style)

Add a download button in the study material header card (same row as the file name) that opens the resource URL in a new tab for download. Uses `IconDownload` from Tabler.

**File:** `CourseContentView.tsx` (lines 499-513, the study material header)

---

## Files to Modify

1. `apps/web/src/app/student/_views/CoursesView.tsx` — search `pl-9` → `pl-10`
2. `apps/web/src/app/student/_views/HomeView.tsx` — search `pl-9` → `pl-10`
3. `apps/web/src/app/student/_views/BrowseCatalogueView.tsx` — search `pl-9` → `pl-10`
4. `apps/web/src/app/student/notes/page.tsx` — search `pl-9` → `pl-10`
5. `apps/web/src/app/student/_views/CourseContentView.tsx` — hover color, video icon, download button
6. `apps/web/src/app/student/_views/_comps/StudyMaterialContent.tsx` — remove duplicate header
