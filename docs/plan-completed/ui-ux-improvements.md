# UI/UX Improvements Plan

## Task: Comprehensive UI/UX Improvements

### Date: 2026-07-13

### Changes Made:

1. **Student Dashboard Stat Tiles**
   - Updated gradient colors to use orange, green, and blue (medium intensity)
   - Files: `apps/web/src/components/student/StudentStatTiles.tsx`

2. **Back Button → Previous Button**
   - Changed "Back" to "Previous" in student portal header
   - File: `apps/web/src/components/StudentPortalShell.tsx`

3. **Admin Dashboard "Create" → "Add"**
   - Changed "Create Course" to "Add Course" in admin dashboard quick actions
   - Changed button text from "Create Course" to "Add Course"
   - Files: `apps/web/src/app/admin/dashboard/page.tsx`, `apps/web/src/app/admin/courses/new/page.tsx`

4. **User Display Icon Only**
   - Removed name from user avatar dropdown, showing only icon
   - File: `apps/web/src/components/StudentPortalShell.tsx`

5. **Quick Access Colors**
   - Improved color intensity from light to medium (5% → 8% opacity)
   - Updated heading color from slate to foreground
   - File: `apps/web/src/app/student/_views/HomeView.tsx`

6. **Thumbnail Hash Colors**
   - Added hash-based color generation for course thumbnails without images
   - Generates unique colors based on course title
   - File: `apps/web/src/app/student/_views/BrowseCatalogueView.tsx`

7. **Student Header White (Not Transparent)**
   - Changed header background from transparent/blur to solid card background
   - File: `apps/web/src/components/StudentPortalShell.tsx`

8. **Price Removal**
   - Removed price from:
     - BrowseCatalogueView (student portal)
     - CourseDetailView (student portal)
     - Catalogue page (public)
     - Admin courses page (table column)
     - Admin new course form (price field)
   - Files: Multiple files as listed

9. **Sidebar Sub-menu Lines**
   - Added border lines to differentiate sub-menu items
   - File: `apps/web/src/components/Sidebar.tsx`

10. **Color Intensity Updates**
    - Changed light colors to medium intensity throughout
    - Updated stat tiles gradients to use medium colors
    - Updated quick access card colors

11. **Round Edges**
    - Changed flat square corners to rounded-2xl throughout
    - Updated DataTable, StatCard, Admin Dashboard components
    - Files: Multiple component files

### Notes:

- All changes follow existing project conventions
- Color palette maintained consistent (orange, green, blue)
- No breaking changes to functionality
- Pagination already existed in DataTable component
