# Marvel Slice

Dynamic education/lMS website built with React + Supabase. Features a DB-driven front end with a full admin dashboard for content management — no auth required (simple email/password admin login).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router v6 |
| **State / Server** | @tanstack/react-query v5 |
| **Styling** | Tailwind CSS v4 |
| **UI Animation** | Framer Motion |
| **Icons** | React Icons (Feather) |
| **UI Library** | Headless UI |
| **Backend** | Supabase (PostgreSQL + Storage + REST API) |
| **Linting** | Oxlint |
| **Deployment** | Vercel (SPA with rewrites) |

---

## Project Structure

```
src/
├── main.jsx                    # Entry point — QueryClientProvider
├── App.jsx                     # Router: public /* + admin /*
├── index.css                   # Tailwind v4 imports + custom theme tokens
├── lib/
│   └── supabaseClient.js       # Supabase client (VITE_SUPABASE_URL/ANON_KEY)
├── hooks/
│   ├── useSupabase.js          # All site queries: nav, courses, home sections, etc.
│   └── useBlog.js              # Blog queries: posts, categories, tags, recent
├── components/
│   ├── layout/
│   │   ├── TopBar.jsx          # Contact bar above header (phone, email, social)
│   │   ├── Header.jsx          # Sticky header with nav + mobile menu
│   │   ├── NavDropdown.jsx     # Dropdown + mobile nav for Header
│   │   └── Footer.jsx          # Footer with nav tree (uses Header.topNav)
│   ├── home/
│   │   ├── Hero.jsx            # Hero section: heading, CTA, checklist, video
│   │   ├── KeyHighlights.jsx   # Icon grid of highlights
│   │   ├── CourseTabsNav.jsx   # Tab navigation for course detail sections
│   │   ├── CourseOverview.jsx  # Q&A accordion overview
│   │   ├── ProjectsSection.jsx # Project cards grid
│   │   ├── CertificationSection.jsx  # Cert info with recognized companies
│   │   ├── PromoBanner.jsx     # Callout banner
│   │   ├── AlumniCompanies.jsx # Logo grid of hiring partners
│   │   ├── FAQSection.jsx      # Accordion FAQ
│   │   └── RelatedCourses.jsx  # Latest courses grid (newest first)
│   └── ui/
│       ├── Button.jsx          # Unified Button: variants, sizes, shapes
│       ├── Card.jsx            # Reusable card wrapper
│       ├── Tabs.jsx            # Tab component
│       └── AccordionItem.jsx   # Expandable accordion (FiPlus/FiMinus icon)
├── pages/
│   ├── Home.jsx                # Home page — drives sections from DB or fallback
│   ├── Courses.jsx             # Course listing — grouped by nav category, filter pills
│   ├── CourseDetail.jsx        # Single course — hero, video, stats, checklist, sections
│   ├── Blog.jsx                # Blog listing + single post view
│   └── NavPage.jsx             # Dynamic pages: About, Contact, Career + course grids
└── admin/
    ├── Admin.jsx               # Admin router — AuthProvider, ProtectedRoute
    ├── context/
    │   └── AuthContext.jsx     # Admin auth (email/password, SHA-256, localStorage)
    ├── layout/
    │   ├── AdminLayout.jsx     # Shell: sidebar + header (user dropdown + logout)
    │   └── Sidebar.jsx         # Collapsible nav sections with active state
    ├── components/
    │   └── ImageUploader.jsx   # Inline upload to Supabase Storage 'pages' bucket
    └── pages/
        ├── Login.jsx           # Admin login form with show/hide password
        ├── Dashboard.jsx       # Stats cards, recent courses, quick links
        ├── SiteSettings.jsx    # Logo, contact info, social links
        ├── NavMenuManager.jsx  # Tree nav editor with drag-like reorder
        ├── CoursesList.jsx     # Table of all courses with publish/draft toggles
        ├── CourseEditor.jsx    # 10-tab course editor (details, highlights, FAQs, etc.)
        ├── PromoBannerManager.jsx  # Banner heading/text/CTA editor
        ├── AlumniCompaniesManager.jsx  # Logo + name list
        ├── TagsManager.jsx     # CRUD for tags shared by courses + blog
        ├── FooterManager.jsx   # Footer column/link editor
        ├── MediaLibrary.jsx    # Image uploads with list view
        ├── AdminUsersManager.jsx   # Create/edit/delete admin accounts
        ├── NavPageEditor.jsx   # Content sections editor with course picker
        ├── HomePageEditor.jsx  # Home sections editor
        ├── BlogManager.jsx     # Blog posts table
        ├── BlogPostEditor.jsx  # Post editor with tag picker chips
        └── BlogCategoriesManager.jsx  # Category CRUD
```

---

## Routes

### Public (`/`)

| Route | Component | Description |
|---|---|---|
| `/` | `Home` | Home page with DB-driven sections |
| `/about` | `NavPage` | About page |
| `/blog` | `Blog` | Blog listing with category/tag/search |
| `/blog/:slug` | `Blog` | Single blog post |
| `/contact` | `NavPage` | Contact page |
| `/career` | `NavPage` | Career page |
| `/courses` | `Courses` | Course listing grouped by nav category |
| `/courses/category/:categorySlug` | `Courses` | Courses filtered by category |
| `/courses/:slug` | `CourseDetail` | Single course page with video |
| `/:slug` | `NavPage` | Dynamic catch all for nav items |

### Admin (`/admin/*`)

| Route | Page |
|---|---|
| `/admin` | Dashboard |
| `/admin/login` | Login form |
| `/admin/site-settings` | Site Settings |
| `/admin/nav-menu` | Navigation Menu Manager |
| `/admin/courses` | Courses List |
| `/admin/courses/:id` | Course Editor (10 tabs) |
| `/admin/promo-banner` | Promo Banner Manager |
| `/admin/alumni` | Alumni Companies Manager |
| `/admin/tags` | Tags Manager |
| `/admin/footer` | Footer Manager |
| `/admin/media` | Media Library |
| `/admin/admin-users` | Admin Users Manager |
| `/admin/nav-pages/:id` | Nav Page Editor (sections + linked courses) |
| `/admin/home-page` | Home Page Editor |
| `/admin/pages/:slug` | Redirect to nav page editor |
| `/admin/blog` | Blog Manager |
| `/admin/blog/:id` | Blog Post Editor |
| `/admin/blog/categories` | Blog Categories Manager |

---

## Database Schema (22 tables)

### Content Management
| Table | Purpose |
|---|---|
| `site_settings` | Logo, contact info, social links (singleton row) |
| `nav_items` | Navigation tree: top-level items and children via `parent_id` + `parent_label` |
| `nav_pages` | Page content per nav item (heading, sections JSON, hero image) |

### Courses
| Table | Purpose |
|---|---|
| `courses` | Course metadata, slug, video URL, checklist, nav_item_id FK, stats |
| `highlights` | Per-course icon + label cards |
| `overview_faqs` | Per-course Q&A with list items |
| `course_fees` | Per-course pricing plans with feature list |
| `projects` | Per-course project titles + descriptions |
| `certifications` | Per-course cert details (1:1 with course) |
| `faqs` | Per-course general FAQs |
| `course_tabs` | Per-course tab labels + content (rich text JSON) |
| `course_tags` | M2M: courses ↔ tags |
| `related_courses` | Curated cross-links between courses |

### Blog
| Table | Purpose |
|---|---|
| `blog_categories` | Category name + slug |
| `blog_posts` | Posts with slug, excerpt, content, author, publish state, featured |
| `blog_post_tags` | M2M: posts ↔ tags |

### Shared
| Table | Purpose |
|---|---|
| `tags` | Tags shared across courses and blog posts |

### Site Features
| Table | Purpose |
|---|---|
| `home_sections` | DB-driven home page section content (key: hero, highlights, etc.) |
| `promo_banners` | Callout banner with heading, subtext, CTA |
| `alumni_companies` | Partner/hiring company logos |
| `newsletter_subscribers` | Email addresses from newsletter signups |

### Admin
| Table | Purpose |
|---|---|
| `admin_profiles` | Admin accounts: email, SHA-256 password hash, role (admin/editor/manager) |

### Indexes
All FK columns indexed. `blog_posts` has a composite index on `(is_published, published_at desc)`. Trigger auto updates `updated_at` on `site_settings`, `nav_pages`, `home_sections`, `blog_posts`.

---

## Key Architecture Decisions

### 1. Navigation System
Top-level nav items are **hardcoded** in `Header.jsx` (9 items: Home, About, Software Learning, Competitive Exam, Services, Training, Career, Blog, Contact). Child items are fetched from the `nav_items` table using `useNavChildren(label)`. Only items with a `parent_label` matching the hardcoded label are returned, supporting a 3-level tree.

### 2. Home Page
Entirely DB-driven via `home_sections` table. Each row has a `section_key` (hero, highlights, overview, projects, certification, faqs, tabs) mapped to a component. **If no sections exist**, falls back to the first published course with all its related data (highlights, FAQs, etc.).

### 3. Course Listing
Single page at `/courses`. Groups courses by `nav_item_id` into category sections with filter pill buttons. Supports `?category=` query param and `/courses/category/:slug` route. Uses `useSearchParams` to keep filter state in the URL without full navigation.

### 4. Course Detail
Modernized 5 column grid hero with:
- Autoplay **muted YouTube video** with mute-toggle button and 4-second hint overlay
- Stats bar below hero (Level, Duration, Students, Rating)
- "What You'll Learn" checklist in white cards on gray background
- Reuses `KeyHighlights` and `CourseOverview` components
- Related courses via curated links, tag-based matches, or fallback to latest

YouTube URL parsing supports: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, and `/shorts/` patterns.

### 5. Blog System
- Dual route: `/blog` (listing) and `/blog/:slug` (single post)
- Category pills filter via `onChange` callbacks
- Tag filtering via `useSearchParams` (`?tag=` URL param)
- `useBlogPost` does **not** filter by `is_published` — drafts are viewable by direct URL
- Newsletter subscription inserts into `newsletter_subscribers`
- Sidebar: recent posts, newsletter form, popular tags

### 6. NavPage (Dynamic Pages)
Fetches nav item by path, then queries for linked courses (direct via `nav_item_id` and children via `parent_id`). Renders sections (text/image/cards/features/cta types) plus course cards. No more "Page Not Found" for nav items with courses.

### 7. Footer
Built from the `topNav` array exported by `Header.jsx`. Nav items without a `path` (Software Learning, Competitive Exam, Services, Training) become columns; children fetched from DB via `useNavChildren`. Nav items with paths (Home, About, etc.) become a "Quick Links" column. Contact info from `site_settings`.

### 8. Unified Button
Single `Button` component with:
- **Variants**: primary, primary-lg, secondary, accent, outline, outline-white, ghost, ghost-red, ghost-blue, link, link-add, pill, pill-active, pill-orange
- **Sizes**: xs, sm, md, lg, xl
- **Shapes**: pill (full round), md (rounded-lg), sm (rounded-md), square (rounded-lg)
- **Renders as**: `<button>`, `<Link>` (if `to` prop), or `<a>` (if `href` prop)
- **Aliases**: `orange` → primary, `outlineWhite` → outline-white, `purple` → accent

### 9. Admin Auth
- Login page at `/admin/login` (no registration)
- Password hashed client-side with **SHA-256** (Web Crypto API)
- Matched against `password_hash` in `admin_profiles`
- Session persisted in `localStorage`
- `AuthContext` provides `user`, `login`, `logout`, and `loading` state
- `ProtectedRoute` wraps all admin pages (except login)
- User dropdown in header shows avatar initial, name, email, role, and Sign Out

### 10. Admin User Management
- Create users with email, full name, role dropdown (admin/editor/manager), password
- Password show/hide toggle
- UUID generated client-side (`uuidv4()` fallback)
- Duplicate email detection (PostgreSQL 23505 code)
- Delete with confirmation dialog

### 11. Slug Conflict Resolution
When saving blog posts, if the generated slug already exists, auto-appends `-1`, `-2`, etc. until unique.

### 12. Tag Management
Tags are shared between courses and blog posts via M2M junction tables (`course_tags`, `blog_post_tags`). Blog post editor uses toggle chips for fast selection. Save strategy: delete all then re-insert.

### 13. Image Uploads
`ImageUploader` component uploads to Supabase Storage `pages` bucket. All admin editors with image fields use this inline uploader. Requires a `pages` bucket with public read policy.

### 14. Scroll Restoration
`ScrollToTop` component in `App.jsx` scrolls to window top on every route change.

---

## Admin Panel Pages

### Dashboard
6 stat cards (Courses, Nav Items, FAQs, Alumni Partners, Tags, Promo Banners) with live counts. Quick create links, content management section cards, and recent courses list with publish/draft badges.

### Course Editor (10 tabs)
1. Basic Info (title, slug, description, subtitle, rating, learners)
2. Media (hero image, thumbnail, video URL)
3. Checklist Items
4. Highlights (icon + label pairs)
5. Overview Q&A (question, answer, list items)
6. Course Fees (plan, features, price, currency)
7. Projects
8. Certification
9. FAQs
10. Related Courses (curated cross-links)

### Blog Post Editor
Title, slug (auto-generated), excerpt, content, image, category dropdown, author, featured checkbox, publish toggle + date. Tag picker with searchable toggle chips. Supports multiple selected tags via `blog_post_tags` M2M.

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project

### Installation
```bash
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Database
Run `schema.sql` in Supabase SQL Editor (creates all 22 tables with `IF NOT EXISTS`). Then run seed data if desired. For existing projects with an `admin_profiles` table linked to `auth.users`:
```sql
alter table admin_profiles drop constraint if exists admin_profiles_id_fkey;
alter table admin_profiles alter column id set default gen_random_uuid();
alter table admin_profiles add column if not exists email text;
alter table admin_profiles add column if not exists password_hash text;
alter table admin_profiles add column if not exists created_at timestamptz default now();
alter table admin_profiles alter column email set not null;
alter table admin_profiles alter column password_hash set not null;
alter table admin_profiles alter column full_name set not null;
alter table admin_profiles drop constraint if exists admin_profiles_role_check;
alter table admin_profiles add constraint admin_profiles_role_check check (role in ('master_admin', 'admin', 'editor', 'manager'));
alter table admin_profiles add constraint admin_profiles_email_key unique (email);
```

### First Admin User
```sql
-- password: admin123 (SHA-256 hash)
insert into admin_profiles (id, email, full_name, role, password_hash)
values (gen_random_uuid(), 'admin@marvelslice.com', 'Admin', 'admin',
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
```

### Storage Bucket
```sql
insert into storage.buckets (id, name, public) values ('pages', 'pages', true);
create policy "Public access pages" on storage.objects for all using (bucket_id = 'pages');
```

### Vercel Deploy
```bash
# Push to GitHub, import on Vercel
# Set env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# No framework config needed — vercel.json provides SPA rewrites
```

---

## Environment Variables
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Security Notes
- Admin panel is **open access** — no RLS, no Supabase Auth
- Simple email/password login hashed client-side with SHA-256
- Session stored in `localStorage` (not httpOnly cookies)
- Intended for internal/admin use behind a VPN or basic auth in production
