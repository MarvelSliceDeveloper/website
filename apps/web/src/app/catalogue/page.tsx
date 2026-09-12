"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/query";
import {
  IconSearch,
  IconX,
  IconLayoutGrid,
  IconList,
  IconChevronLeft,
  IconChevronRight,
  IconCode,
  IconChartBar,
  IconDeviceDesktop,
  IconCpu,
  IconCloud,
  IconShield,
  IconWorld,
  IconLayersLinked,
  IconListCheck,
  IconPalette,
  IconCoin,
  IconSpeakerphone,
  IconBook,
} from "@tabler/icons-react";
import { CourseCard } from "./_components/CourseCard";
import { PackageCard } from "./_components/PackageCard";
import { CatalogueListItem, type UnifiedCatalogueItem } from "./_components/CatalogueListItem";
import CourseSkeleton from "./_components/CourseSkeleton";
import PublicFooter from "@/components/PublicFooter";
import BrandLogo from "@/components/BrandLogo";

const PER_PAGE = 6;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "web-development": IconCode,
  "data-science": IconChartBar,
  "programming": IconCode,
  "mobile-development": IconDeviceDesktop,
  "machine-learning-ai": IconCpu,
  "devops-cloud": IconCloud,
  "cybersecurity": IconShield,
  "networking": IconWorld,
  "database-design": IconLayersLinked,
  "software-testing": IconListCheck,
  "design-ui-ux": IconPalette,
  "business-finance": IconCoin,
  "marketing": IconSpeakerphone,
};

const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "Web Development", slug: "web-development" },
  { id: "cat-2", name: "Programming", slug: "programming" },
  { id: "cat-3", name: "Data Science", slug: "data-science" },
  { id: "cat-4", name: "Machine Learning & AI", slug: "machine-learning-ai" },
  { id: "cat-5", name: "DevOps & Cloud", slug: "devops-cloud" },
  { id: "cat-6", name: "Cybersecurity", slug: "cybersecurity" },
  { id: "cat-7", name: "Database Design", slug: "database-design" },
  { id: "cat-8", name: "Mobile Development", slug: "mobile-development" },
  { id: "cat-9", name: "Software Testing", slug: "software-testing" },
];

export default function CataloguePage() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Fetch single published catalog courses
  const coursesQuery = useApiQuery<{
    courses: any[];
    total: number;
    categories?: { id: string; name: string; slug: string; description?: string; courseCount: number }[];
  }>(
    ["catalogue", "courses", category, search, page],
    "/api/courses/catalogue",
    {
      ...(category ? { category } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      page: String(page),
      limit: String(PER_PAGE),
    }
  );

  // Fetch active packages
  const packagesQuery = useApiQuery<{ packages: any[] }>(
    ["catalogue", "packages"],
    "/api/packages/public",
    undefined
  );

  // Sidebar categories are fetched unfiltered (no category/search) so the
  // left list + the "All Categories" count always show the full catalogue
  // instead of shrinking to the current selection.
  const categoriesQuery = useApiQuery<{
    total: number;
    categories?: { id: string; name: string; slug: string; description?: string; courseCount: number }[];
  }>(
    ["catalogue", "categories"],
    "/api/courses/catalogue",
    { page: "1", limit: "1" }
  );

  const rawCourses = coursesQuery.data?.courses || [];
  const rawPackages = packagesQuery.data?.packages || [];

  // Unified items
  const courseItems: (UnifiedCatalogueItem & { raw: any })[] = useMemo(() => {
    return rawCourses.map((c: any) => ({
      id: c.id,
      type: "course" as const,
      title: c.title,
      slug: c.slug,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl || null,
      coverImageUrl: c.coverImageUrl || null,
      duration: c.duration || null,
      category: c.categoryRelation?.name || null,
      price: c.price != null ? c.price : null,
      modulesCount: c._count?.modules ?? 0,
      raw: c,
    }));
  }, [rawCourses]);

  const packageItems: (UnifiedCatalogueItem & { raw: any })[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawPackages
      .filter((p: any) => {
        if (q) {
          const inTitle = (p.name || "").toLowerCase().includes(q);
          const inDesc = (p.description || "").toLowerCase().includes(q);
          const inCourse = (p.courses || []).some((pc: any) =>
            (pc.course?.title || "").toLowerCase().includes(q)
          );
          if (!inTitle && !inDesc && !inCourse) return false;
        }
        if (category) {
          const inCat = (p.courses || []).some(
            (pc: any) =>
              pc.course?.categoryRelation?.slug === category ||
              pc.course?.categoryId === category
          );
          if (!inCat) return false;
        }
        return true;
      })
      .map((p: any) => ({
        id: p.id,
        type: "package" as const,
        title: p.name,
        slug: p.slug,
        description: p.description,
        thumbnailUrl: p.courses?.[0]?.course?.thumbnailUrl || null,
        coverImageUrl: null,
        duration: p.totalLessons ? `${p.totalLessons} lessons` : null,
        category: p.isInternship ? "Internship" : "Package",
        price: p.price != null ? p.price : null,
        courseCount: p.courses?.length || 0,
        lessonsCount: p.totalLessons || 0,
        quizzesCount: p.totalQuizzes || 0,
        isInternship: p.isInternship,
        batchesCount: p.batches?.length || 0,
        raw: p,
      }));
  }, [rawPackages, search, category]);

  // Combine categories
  const categoriesList = useMemo(() => {
    const fromApi = categoriesQuery.data?.categories;
    if (fromApi && fromApi.length > 0) {
      return fromApi;
    }
    return DEFAULT_CATEGORIES.map((def) => ({
      ...def,
      courseCount: 0,
    }));
  }, [categoriesQuery.data?.categories]);

  const totalCourses = coursesQuery.data?.total || 0;
  const allCoursesTotal = categoriesQuery.data?.total ?? totalCourses;
  const totalPackages = packageItems.length;

  // Active items for display: combine packages and single courses
  const displayedItems = useMemo(() => {
    return [...packageItems, ...courseItems];
  }, [courseItems, packageItems]);

  const totalDisplayedItems = totalCourses + totalPackages;

  const lastPage = Math.max(1, Math.ceil(totalDisplayedItems / PER_PAGE));

  const currentCategoryName = useMemo(() => {
    if (!category) return null;
    const found = categoriesList.find((c) => c.slug === category);
    return found?.name || category;
  }, [category, categoriesList]);

  const handleResetFilters = useCallback(() => {
    setCategory("");
    setSearch("");
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const isLoading = coursesQuery.isPending || packagesQuery.isPending;

  // Pagination array builder
  const paginationPages = useMemo(() => {
    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(lastPage - 1, page + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (page < lastPage - 2) pages.push("...");
    pages.push(lastPage);
    return pages;
  }, [page, lastPage]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <BrandLogo size="md" />
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full min-h-0 bg-white">
        {/* Left Sidebar (Desktop, 280px) */}
        <aside
          className="w-[280px] shrink-0 hidden lg:flex lg:flex-col bg-[#f8fafc] border-r border-slate-200 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto"
          aria-label="Course categories"
        >
          {/* Top Category Header (Static, matching landing page) */}
          <div className="px-0 pt-0">
            <div className="py-3 text-sm font-bold text-center bg-[#f59e0b] text-white shadow-xs select-none">
              Software Learning
            </div>
          </div>

          {/* Category Tree */}
          <nav className="p-3 overflow-y-auto flex-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs space-y-1">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-2 border cursor-pointer ${
                  category === ""
                    ? "bg-blue-50/80 border-blue-200 text-blue-700 font-semibold shadow-2xs"
                    : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0 flex-1">
                  <IconLayoutGrid
                    size={18}
                    className={category === "" ? "text-blue-600" : "text-slate-400"}
                  />
                  <span className="truncate">All Categories</span>
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                    category === ""
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-400 bg-slate-100"
                  }`}
                >
                    {allCoursesTotal}
                </span>
              </button>

              {/* Categories */}
              {categoriesList.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] || IconBook;
                const isActive = category === cat.slug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => {
                      setCategory(cat.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-2 border cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 border-blue-200 text-blue-700 font-semibold shadow-2xs"
                        : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon
                        size={18}
                        className={isActive ? "text-blue-600" : "text-slate-400"}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-slate-400 bg-slate-100"
                      }`}
                    >
                      {cat.courseCount ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 max-w-[1600px] w-full pt-4 lg:pt-6 pr-4 sm:pr-6 lg:pr-10 pl-4 sm:pl-6 lg:pl-8 pb-12">
          {/* Desktop Heading */}
          <div className="hidden lg:block mb-6 text-left">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1B365D] tracking-tight mb-1">
              Find Your Courses related to {currentCategoryName || "Software Learning"}
            </h1>
            {currentCategoryName && (
              <p className="text-lg lg:text-xl font-bold text-slate-600">
                {currentCategoryName}
              </p>
            )}
          </div>

          {/* Mobile Heading */}
          <div className="lg:hidden mb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1B365D] tracking-tight">
              Course Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Explore our courses and career programs
            </p>
          </div>

          {/* Mobile Category Chips */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 mb-5 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                category === ""
                  ? "bg-primary text-white border-primary"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              All
            </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    setCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                    category === cat.slug
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          {/* Toolbar row: Count, Search input & View Mode toggle */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 w-full flex-wrap sm:flex-nowrap">
            {/* Item Count */}
            <p className="text-sm font-semibold text-slate-600 shrink-0">
              <span className="font-extrabold text-slate-900">{totalDisplayedItems}</span>{" "}
              {totalDisplayedItems === 1 ? "item" : "items"}
            </p>

            {/* Right: Search & View Mode Toggle */}
            <div className="flex items-center gap-3 ml-auto shrink-0 max-w-full">
              {/* Search Input */}
              <div className="relative w-44 sm:w-60 md:w-68 max-w-[260px]">
                <IconSearch
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-7 py-2 rounded-full border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  aria-label="Search courses"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle (Grid/List) */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-1 shrink-0 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-amber-500 shadow-2xs font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="Grid view"
                >
                  <IconLayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-amber-500 shadow-2xs font-bold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="List view"
                >
                  <IconList size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Display */}
          {isLoading ? (
            <CourseSkeleton count={PER_PAGE} />
          ) : displayedItems.length === 0 ? (
            /* Empty State */
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-4 mx-auto max-w-md my-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/70 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Coming Soon</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 text-center">
                {search ? `No results match "${search}"` : "No Courses Available"}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed text-center">
                {search
                  ? "No courses or packages match your search criteria. Please try a different query or select another category."
                  : "There are currently no courses listed under this category. Please select another category to view available programs."}
              </p>
              {(category || search) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Explore All Courses</span>
                  <IconChevronRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Grid or List (Single) View */}
              {viewMode === "grid" ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedItems.map((item) =>
                    item.type === "package" ? (
                      <PackageCard key={`pkg-${item.id}`} pkg={item.raw} bannerSize="lg" />
                    ) : (
                      <CourseCard key={`course-${item.id}`} course={item.raw} bannerSize="lg" />
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {displayedItems.map((item) => (
                    <CatalogueListItem key={`item-${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              )}

              {/* Numbered Pagination (matching landing page styling) */}
              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8 sm:mt-12 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page <= 1}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border border-slate-200 bg-white"
                    aria-label="Previous page"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  {paginationPages.map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPage(p as number);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          p === page
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white"
                        }`}
                        aria-label={`Page ${p}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(lastPage, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page >= lastPage}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border border-slate-200 bg-white"
                    aria-label="Next page"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

