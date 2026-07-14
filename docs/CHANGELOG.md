# Changelog

## 2026-07-13 - UI/UX Improvements

### Added
- Pagination support in DataTable component (already existed)
- Hash-based color generation for course thumbnails without images
- Lines to differentiate sidebar sub-menu items

### Changed
- Student dashboard stat tiles: Updated gradients to orange, green, and blue (medium intensity)
- "Back" button renamed to "Previous" in student portal header
- "Create Course" renamed to "Add Course" in admin dashboard and course creation page
- User avatar dropdown: Shows only icon (removed name display)
- Quick Access section: Improved color intensity from light to medium
- Student dashboard header: Changed from transparent/blur to solid white background
- All flat square corners changed to round-2xl edges
- Color palette updated from light to medium intensity throughout

### Removed
- Price display removed from:
  - BrowseCatalogueView (student portal)
  - CourseDetailView (student portal)
  - Course Catalogue page (public)
  - Admin courses management table
  - Admin new course creation form

### Files Modified
- `apps/web/src/components/student/StudentStatTiles.tsx`
- `apps/web/src/components/StudentPortalShell.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/admin/DataTable.tsx`
- `apps/web/src/components/admin/StatCard.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/admin/courses/page.tsx`
- `apps/web/src/app/admin/courses/new/page.tsx`
- `apps/web/src/app/student/_views/HomeView.tsx`
- `apps/web/src/app/student/_views/BrowseCatalogueView.tsx`
- `apps/web/src/app/student/_views/CourseDetailView.tsx`
- `apps/web/src/app/catalogue/page.tsx`
