# Catalogue Landing Copy + isCatalog Auto-Flow — Design Spec

Date: 2026-09-05
Status: Approved for planning (no code yet)
Owner: LMS Web + API
Decisions from brainstorming: landing course grid, public catalogue, no rating/learner_count column, course-level pay with details capture, package flow preserved.

## 1. Goal

Replace the current package-only `/catalogue` with a **landing-identical, public course catalogue** (max copy of `apps/landing/src/pages/Courses.jsx` + `CourseDetail.jsx` + `CourseHero.jsx` + `CourseCard.jsx`) while keeping the existing package catalogue available. Creating a course asks `isCatalog?`; if `true` price-required course appears in the public catalogue and can be bought directly; if `false` it is only sellable inside a package (existing flow).

## 2. Non-goals

- No `rating / learner_count / review_count` columns (explicit no). Cards show duration/modules, not social proof.
- No replacement of Razorpay/package intern flows.
- No migration of landing Supabase data; LMS remains the source of truth.
- No SEO / ISR overhaul beyond `revalidate:60` already used.

## 3. Data Model

### 3.1 Prisma changes (`apps/api/prisma/schema.prisma:155`)

```prisma
model Course {
  // ...existing
  isCatalog Boolean @default(false)
  price     Int?    // paise, null = enquire only. required if isCatalog=true && status=PUBLISHED
  // indexes
  @@index([isCatalog, status])
  @@index([status, categoryId])
}

model Payment {
  packageId String? // make nullable (was required)
  courseId  String? // new
  // exactly one of packageId/courseId must be set — enforced in service layer
  package   CoursePackage? @relation(fields: [packageId], references: [id])
  course    Course?        @relation(fields: [courseId], references: [id])
  @@index([courseId])
  @@index([userId])
}

model CourseEnrollment { // new, for single-course purchase
  id        String           @id @default(cuid())
  userId    String
  courseId  String
  batchId   String?          // assignment after approval or auto-batch
  paymentId String?  @unique
  status    EnrollmentStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])
  batch     Batch?   @relation(fields: [batchId], references: [id])
  payment   Payment? @relation(fields: [paymentId], references: [id])
  @@index([userId, status])
  @@index([courseId])
}
```

- Existing `CoursePackage` / `PackageEnrollment` / `Batch` unchanged.
- Backfill: `isCatalog=false` for all existing rows.

### 3.2 Mapping landing fields -> LMS

| Landing `courses` | LMS source | Notes |
|---|---|---|
| `title, slug, description` | `Course.title/slug/description` | direct |
| `hero_image_url` | `Course.coverImageUrl ?? thumbnailUrl` | fallback |
| `duration` | `Course.durationMinutes` formatted `${Math.ceil(m/60)}h` | new display only |
| `mode` | omit or `Batch.name` | not stored |
| `status` | `Course.status` | `DRAFT` -> Coming Soon |
| `category / nav_item_id` | `Course.categoryId -> Category.slug` + `CourseTag -> Tag` | replaces `nav_items` tree |
| `video_url` | first `Lesson.videoUrl` in course | for hero |
| `checklist_items` | `Course.learningObjectives Json` | |
| `highlights / projects / certifications / course_tabs / faqs` | optional, empty -> static fallback | not required v1 |

## 4. API

### 4.1 Public catalogue (no auth, CSRF-exempt like `/api/packages/public`)

- `GET /api/courses/catalogue` query: `category?`, `tag?`, `search?`, `page?`, `limit?` (via `paginate()` utils). Where `{ isCatalog:true, status:PUBLISHED, deletedAt:null, categoryId?:, tags? }`. Select minimal for card; order `publishedAt desc`. Returns `{ courses[], total, page, limit }`.
- `GET /api/courses/catalogue/:slug` — full detail for detail page: course + `category`, `tags`, `modules {_count:{lessons,quizzes,assignments}}`, `totalLessons/totalQuizzes` computed, `batches:{id,name,startDate}` for nextBatch. 404 if not catalog or not published.
- `POST /api/courses/catalogue/:id/checkout` body `{ name, email, phone }` creates Razorpay order (`payment.service.ts` pattern) with `courseId`; on verify `POST /api/courses/catalogue/:id/verify` creates `Payment{courseId, status:PAID}` + `CourseEnrollment{PENDING|APPROVED}` + captures user details (creates guest user if not exists, same as package guest flow, `mustChangePassword` email). Reuses `RazorpayCheckoutWidget` logic.

Existing `GET /api/packages/public` stays for packages tab.

### 4.2 Admin

- `POST /api/admin/courses` body adds `isCatalog?: boolean, price?: number` (paise, validated: if isCatalog && status PUBLISHED then price required >0 else optional).
- `PUT /api/admin/courses/:id` same.
- `GET /api/admin/courses?isCatalog=` filter for list.

## 5. Web — `apps/web`

### 5.1 Global

- TanStack verified: `apps/web/src/app/providers.tsx:26 QueryClient(staleTime:60s)` + `apps/web/src/lib/query.ts:17 useApiQuery`. All new data uses `useApiQuery` (no RSC fetch). SSR `catalogue/page.tsx` becomes `"use client"`.

### 5.2 `/catalogue` (public course grid — max copy)

Clone landing fidelity:

- New components `apps/web/src/app/catalogue/_components/`:
  - `CourseCard.tsx` from `apps/landing/src/components/ui/CourseCard.jsx:9` (banner `h-48 lg`, `prefetchQuery` on hover via `useQueryClient`, `FiBookOpen` fallback, duration/mode pills — omit rating).
  - `CourseSkeleton.tsx`, `TabBar`, `Reveal`, `HeroBackground` as needed.
- Page layout (`Courses.jsx:712-750`): left `aside w-[280px] hidden lg:flex` sticky category tree (`Category` + `Tag` via `useApiQuery(["categories"])`), top `parents` header `Find Your Courses related to {Category}`, toolbar `search + viewMode grid/list` (`FiGrid/FiList`), `Pagination` PER_PAGE=6 (landing) or 9 for web, `Stagger` grid `sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Mobile `MobileCatList` + `mobileCategorySections` 1-by-1 grouped view copied verbatim (landing:739-991).
- State: `search`, `selectedCategory` slug, `page`, `viewMode` synced to `useSearchParams` like landing `selectCategory/setPage`.
- Empty state: amber `Coming Soon` pill + `No Courses Available` (landing:862).
- Top tabs: `Courses | Packages` — Courses default; Packages renders existing `CataloguePageClient`/`PackageCard` grid so "both thing" requirement met.

### 5.3 `/catalogue/[slug]` (public course detail — max copy `CourseDetail.jsx`)

- File `apps/web/src/app/catalogue/[slug]/page.tsx` -> client wrapper `CatalogueCourseDetailClient` that `useApiQuery(["catalogue","course",slug], "/api/courses/catalogue/:slug")`.
- Sections in order (landing): `CourseHero` (12-col, `VideoVisual` youtube embed via `getYoutubeEmbedUrl` + `videoPlaying` state, `cta_left/right` -> `Enroll Now / Talk to Advisor`), `OverviewSection` (Key Highlights from `learningObjectives`), `CourseTabs` (`TabBar` + `AccordionQA`), `CourseCTA`, `ProjectsSection`/`CertificationSection` (fallback static `HIGHLIGHTS` if empty), `RelatedCoursesWithId` (same category), `FAQSection` (static `FAQS` fallback), sticky right `RazorpayCheckoutWidget` (adapted for `course.price`, shows `Enroll Now` if price else `Enquire Now` opening `ContactForm` modal that posts to `course_enquiries`-like endpoint or LMS `POST /api/courses/catalogue/:id/enquiry`).
- Public header `Header` with Back + Share reused from `PackageDetailClient:431`.
- Loading = centered spinner (`border-brand-orange`), 404 = `Package not found` pattern.

### 5.4 Admin course builder `apps/web/src/app/admin/courses/[id]/page.tsx:52`

- Add to `form` state: `isCatalog: boolean`, `price: string` (rupees input -> paise).
- `CourseDetailsTab` adds `Switch` "Catalogue course? Show on /catalogue" + conditional `price` field with helper "Leave empty for enquiry-only". `saveMutation` sends `isCatalog, price: price? Math.round(parseFloat(price)*100): null`.
- Publish checklist adds rule: if `isCatalog && !price` warn but allow publish as enquiry.

## 6. Checkout & details flow (student views -> pay -> we get details)

1. Visitor browses `/catalogue` (public, no login).
2. Clicks card -> `/catalogue/<slug>` sees hero, curriculum, FAQ, price.
3. Clicks `Enroll Now` (if `price`) -> modal collects `name,email,phone` -> `POST /api/courses/catalogue/:id/checkout` returns `razorpayOrderId`.
4. Razorpay widget -> `POST .../verify { razorpayPaymentId, signature }` -> creates `Payment` + `CourseEnrollment` + guest user (`generateDummyPassword` + `sendWelcomeEmail` like `payment.service.ts`) if not logged in, returns enrollment.
5. If `isCatalog=false` course, never appears in catalogue; only purchasable via `/catalogue/packages/:slug` -> existing `POST /api/payments/create-order` package flow.

## 7. What mock/static is removed

- `PackageDetailClient HIGHLIGHTS/FEATURES/INTERN_FEATURES/INTERN_DELIVERABLES/FAQS` -> `learningObjectives/modules/tags` real; static kept as fallback only.
- `BrowseCatalogueView ALL_TAGS` -> `Category/Tag` API.
- `CatalogueCourse` interface ad-hoc -> `Course` + `Category`/`Tag` types; `CourseCard` rating removed.
- `catalogue/page.tsx` RSC `fetch` -> `useApiQuery` TanStack.

## 8. Testing & rollout

- `pnpm typecheck && pnpm lint && pnpm test:all` pre-merge.
- Manual: (a) admin creates course isCatalog=false -> not in catalogue, in package yes; (b) isCatalog=true -> appears in catalogue grid + detail, search/category filter works, pagination 6; (c) public detail pay creates payment + enrollment + guest welcome email; (d) package pay unchanged.
- Migration dry-run on branch DB.

## 9. Risks

- Making `Payment.packageId` nullable requires service guards.
- Guest user duplication — reuse existing `createGuestUser` dedup by email.
- Category tree depth — v1 flat `Category.slug` filter only, no landing multi-parent `PARENTS` complexity.

## 10. Files to touch (implementation plan will expand)

`apps/api/prisma/schema.prisma`, `apps/api/src/modules/courses/**`, `apps/api/src/modules/payments/payment.service.ts`, `apps/api/src/modules/packages/**` (no break), `apps/web/src/app/catalogue/**`, `apps/web/src/app/catalogue/[slug]/**`, `apps/web/src/app/admin/courses/**`, `apps/web/src/lib/api-types.ts`, `apps/web/src/components/ui/*` (Reused reveal/tab).

---

Spec self-review: no TBD/TODO left, indexes defined, public auth stated, package flow preservation explicit.
