# MarvelSlice LMS — Frontend Design Guide

This document catalogs and outlines the frontend design system, user interfaces, navigation architectures, and styling patterns used across the MarvelSlice LMS client application (`apps/web`).

---

## 1. Design System & Style Tokens

The visual style is a premium, modern dark-themed interface (default) with an optional light-theme mode. It features neon/vibrant glow highlights, clean card borders, glassmorphic surfaces, and detailed micro-animations.

### A. Theme Colors (`globals.css`)

The application maps variables using custom CSS tokens for smooth toggling between **Dark Mode** (default) and **Light Mode** (`data-theme="light"`).

| Token Name       | Dark Mode Value (Default)       | Light Mode Value             | Purpose                                |
| :--------------- | :------------------------------ | :--------------------------- | :------------------------------------- |
| `--background`   | `#0b1020` (Deep Blue-Black)     | `#f4f7ff` (Ice Blue)         | App background canvas                  |
| `--foreground`   | `#e6e9f5` (Cool Off-White)      | `#1a2238` (Deep Blue-Gray)   | Core text color                        |
| `--card`         | `#131a2c` (Navy-Gray Panel)     | `#ffffff` (Pure White)       | Containers and cards                   |
| `--card-hover`   | `#18213a` (Brighter Navy-Gray)  | `#eef3ff` (Soft Blue-Gray)   | Hover states for cards/buttons         |
| `--border`       | `#27314f` (Muted Slate Border)  | `#d7deef` (Light Gray-Blue)  | Layout dividers and borders            |
| `--border-hover` | `#36436b` (Accent Slate Border) | `#bcc7e2` (Deeper Gray-Blue) | Focused borders on hover               |
| `--primary`      | `#6d7dff` (Periwinkle Blue)     | `#4459f3` (Vibrant Blue)     | Primary actions and callouts           |
| `--accent`       | `#25c0e8` (Electric Cyan)       | `#0ca3cf` (Vibrant Cyan)     | Highlighting specific badges/terms     |
| `--success`      | `#2fbf71` (Emerald Green)       | `#1f9c5b` (Deep Green)       | Success status, approvals, completions |
| `--warning`      | `#f5ad42` (Amber Orange)        | `#d68b1d` (Dark Gold)        | Warnings and pending states            |
| `--danger`       | `#f05d7d` (Vibrant Rose)        | `#d54b70` (Deep Crimson)     | Errors, delete/destructive actions     |
| `--muted`        | `#8b93ae` (Slate Gray)          | `#5a678a` (Muted Gray)       | Subtitle text, inactive tabs           |
| `--radius`       | `14px`                          | `14px`                       | Standardized border-radius             |

### B. Background Gradients & Aura

The body background features a rich, multi-layered radial gradient aura overlaying the core background color:

- **Top Right Glow**: `radial-gradient(80rem 40rem at 100% -10%, rgba(109, 125, 255, 0.14), transparent 60%)` — cast by the primary color.
- **Bottom Left Glow**: `radial-gradient(70rem 36rem at -10% 100%, rgba(37, 192, 232, 0.1), transparent 60%)` — cast by the cyan accent.

### C. Glassmorphism Card Pattern (`.glass-card`)

Cards are styled using semi-transparent gradients combined with hardware-accelerated background blur filters:

- **Dark Mode**: `linear-gradient(180deg, rgba(19, 26, 44, 0.9), rgba(19, 26, 44, 0.72))` backdrop blurred via `backdrop-filter: blur(14px)`.
- **Light Mode**: `linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(236, 242, 255, 0.9))` backdrop.
- **Hover Interaction**: Cards smoothly lift (`translateY(-1px)`) and borders transitions to `--border-hover` with subtle back-lighting shadows.

### D. Typography (`layout.tsx`)

- **Display Fonts**: **Sora** (`--font-display`): A distinctive geometric sans-serif used on headings, statistics, and brand headers for a premium tech aesthetic. Headings utilize tight tracking (`letter-spacing: -0.01em`).
- **Body Fonts**: **DM Sans** (`--font-body`): A highly readable, clean sans-serif optimized for body copy, descriptions, and forms.

---

## 2. Top-Level UI Components & Layouts (Headers & Navigation)

The header section is designed to establish context, handle global interactions (theme, notifications, session control), and support accessible page navigation.

### A. Student Portal Header (`StudentPortalShell.tsx`)

The student portal is a header-centric workspace that adapts dynamically to the current portal view stack:

```
[ Back ] [Logo] [Breadcrumbs: Home / Courses / Next] ... [Theme Toggle] [Bell (Badge)] [Avatar V]
```

1. **Dynamic Back Button**: Retractable (`IconArrowLeft`) with state-controlled display (`showBack` prop). It smoothly transitions opacity and bounds to keep spacing clean when hidden.
2. **Brand Branding**: Centered or left-aligned Logo combining an icon (`IconSchool` wrapped in a gradient box `bg-linear-to-br from-primary to-violet-600`) and modern bold text (`MarvelSlice LMS`).
3. **Responsive Breadcrumb Path**: Tracks the view stack. Intermediary breadcrumbs function as buttons allowing students to jump backward seamlessly. Labels are safely capped using CSS truncation (`max-w-30 truncate`) to prevent wrap breakage on tablet screens.
4. **Light/Dark Toggle**: A standard button that dynamically updates the `data-theme` attribute on the document root element and saves the value inside `localStorage`.
5. **Real-time Notifications Bell**:
   - Includes a red notification badge (`bg-danger`) with text formatted for double digits (caps overflow at `9+`).
   - Polls the API every 30 seconds for new messages or state changes.
   - Triggers a dropdown box featuring the five latest items, quick actions to mark individual notifications as read (`IconEye`), a bulk "Mark all read" option, and a CTA link to the standalone notifications inbox page.
6. **User Account Menu**:
   - Displays a clean monogram avatar circle using a gradient container.
   - Expanding the dropdown reveals the user's full name, email, quick settings link (`IconSettings`), and a red-themed Sign Out option (`IconLogout`).

### B. Admin & Instructor Header (`Header.tsx`)

Admins and instructors share a layout header linked with a sidebar:

- **Context Display**: Features a header label ("LMS Workspace") and a responsive greeting block ("Welcome back").
- **Notification Dropdown**: Follows the same visual layout as the Student bell.
- **Global Accessors**: Inline Settings button, Light/Dark toggler, and collapsible sidebar trigger synchronization.

### C. Collapsible Navigation Sidebars (`AdminSidebar.tsx`, `InstructorSidebar.tsx`)

For multi-route dashboards, sidebars provide role-based route groupings:

- **Flexible Sizing**: Collapses from `w-64` (fully expanded showing text and submenus) to `w-16` (icon-only bar) using CSS transition interpolation.
- **Collapsible Nav Groups (`NavGroup`)**: High-level groups (Overview, Growth) contain expandable accordions for route parameters (e.g. Courses, Batches, Sessions). If a sub-route matches the current path, the group auto-expands using dynamic hooks.
- **Visual States**: Active states use an subtle periwinkle outline (`border-primary/15`), a translucent background tint (`bg-primary/10`), and a highlight color (`text-primary-hover`). A tiny colored dot (`h-1.5 w-1.5 rounded-full`) emphasizes the active child node.
- **Footer Metadata**: Renders a card listing the profile initials and email. Below it, a high-contrast sign-out button is positioned to serve as the bottom anchor.

---

## 3. Bottom-Level UI Components & Layouts (Footers & Data Control)

Since the portal behaves like a dashboard application, traditional page footers are replaced with floating pagination elements and structured data tables.

### A. Pagination Controller (`PaginationBar.tsx`)

A bottom bar that aligns page-filtering operations across the user interface.

```
Showing 1 to 10 of 42 entries                              [ Previous ] [ 1 ] [ Next ]
```

- **Index Counts**: Placed on the left, displaying entries (e.g. "Showing 1 to 10 of 42 entries") using soft text (`text-muted-foreground`).
- **Navigation Controls**: Positioned on the right:
  - **Previous / Next buttons**: Interactive secondary buttons that apply `opacity-50` and disable cursor pointer triggers when reaching terminal pages.
  - **Page Number Display**: Placed centrally inside a clean card indicator.

### B. Data Grid Tables (`StudentTable.tsx`)

A clean table structure for batches, sessions, certificates, and grades:

- **Header Style**: Uses a slightly darker backdrop (`bg-card-hover`) with bold, uppercase columns (`text-xs font-semibold uppercase tracking-[0.12em] text-muted`).
- **Row Interactions**: Features border split lines (`divide-y divide-border/60`) and highlights rows on hover with a smooth ease-in transition (`hover:bg-card-hover/50`).
- **Custom cell rendering**: Cells take custom React component injectors, facilitating badges, avatars, or progress loaders inside row fields.

---

## 4. Key Page & View Design Patterns

### A. Two-Column Split Login Screen (`login/page.tsx`)

The sign-in interface is split into two panels for desktop viewports:

- **Left Panel (Aesthetic Illustration)**: Displays the application name and a welcome message, highlighted by a dark gradient overlay. Seed credentials are shown in clean panels to simplify development testing.
- **Right Panel (Form Input)**:
  - Form layout with fields (`.field`) using dark inputs with border hover states.
  - Floating password toggle button (`IconEye`/`IconEyeOff`) positioned inside the input wrapper to show/hide plaintext passwords.
  - Large primary action button (`btn-primary`) that updates to a loading indicator during authorization.

### B. Single-Page View Stack (`student/page.tsx`)

Rather than relying on server-side redirects, the Student portal uses a view stack (`ViewState[]`).

- **Animated Transition Wrapper**: Views are wrapped with animators (`key={viewStack.map(v => v.view).join("-")}`) so that shifting pages triggers a CSS slide-in from the right (`sp-view-enter`).
- **Parallel Loading Skeletons**: Lazy fetches load data panels asynchronously. Standard skeleton boxes fade in and out (`animate-pulse`) to prevent layout shift during loading.

### C. Count-Up Stat Tiles (`StudentStatTiles.tsx`)

Visual key indicators (enrolled count, live sessions today, completed courses) are presented in grid tiles:

- **Count-Up Animation (`useCountUp`)**: Numbers animate from `0` to their final value over an 800ms duration with cubic easing (`1 - Math.pow(1 - progress, 3)`), making the dashboard feel dynamic.
- **Interactive Hover Effect**: Hovering lifts the tile (`translateY(-4px)`) and fades in a custom gradient backdrop (`opacity-100`).
- **Action Indicator**: An arrow icon (`IconArrowRight`) glides into view from the top right on hover, guiding the user's eye to clickable tiles.

### B. Announcement Notice Bar (`StudentTopNoticeBar.tsx`)

A top-bar announcement banner used to draw attention to live events:

- **Vibrant Styling**: Uses a bright gradient banner (`from-blue-600 to-blue-500`) with high-contrast text.
- **Action Callouts**: Prominently displays a white call-to-action button (e.g., "Join Now").
- **State Persistence**: The close button hides the banner and saves the state to `localStorage` so the user is not prompted with the same notice on subsequent visits.

### E. Status Badges (`StatusBadge.tsx`)

Badges use soft, pastel background tints with high-contrast border and text highlights:

- **PENDING**: Translucent amber background with amber text (`bg-warning/10 text-warning border-warning/20`).
- **APPROVED / COMPLETED**: Soft green styling.
- **REJECTED / CLOSED**: Soft crimson styling.
- **LIVE**: Pulsing danger red badge styling.

---

## 5. Animations & Interaction Patterns

1. **Pulse Animation (`pulse-live`)**: Pulsates scale (`scale(1.25)`) and opacity (`0.55`) on live indicators to draw attention to active events.
2. **Slide-in (`sp-slide-in`)**: Translates routes `24px` on the X-axis and fades them in to create a responsive, fluid feel during navigation.
3. **Staggered Fade-Up (`sp-fade-up`)**: Applies a stagger delay to child lists or grids, sliding them up `12px` to make lists load gracefully.
4. **Scrollbars**: Replaces default browser scrollbars with custom thin, rounded scrollbar thumbs that blend with the borders.
