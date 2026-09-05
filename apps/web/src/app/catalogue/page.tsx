"use client";
import { useState } from "react";
import { useApiQuery } from "@/lib/query";
import { IconSearch, IconX } from "@tabler/icons-react";
import { CourseCard } from "./_components/CourseCard";
import CourseSkeleton from "./_components/CourseSkeleton";
import { CataloguePageClient } from "./_components/CataloguePageClient";
import { api } from "@/lib/api";
import PublicFooter from "@/components/PublicFooter";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

const PER_PAGE = 6;

export default function CataloguePage() {
  const [tab, setTab] = useState<"courses" | "packages">("courses");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const coursesQuery = useApiQuery<{ courses: any[]; total: number }>(
    ["catalogue", "courses", category, search, page],
    "/api/courses/catalogue",
    {
      ...(category ? { category } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      page: String(page),
      limit: String(PER_PAGE),
    },
    { enabled: tab === "courses" }
  );

  // packages are still fetched via TanStack for tab
  const packagesQuery = useApiQuery<{ packages: any[] }>(
    ["catalogue", "packages"],
    "/api/packages/public",
    undefined,
    { enabled: tab === "packages" } as any
  );

  const total = coursesQuery.data?.total || 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <BrandLogo size="md" />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Course Catalogue</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              {tab === "courses"
                ? "Explore courses — landing-style grid with real catalogue data."
                : "Choose a package and start your learning journey today."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border mb-6">
            <button
              onClick={() => setTab("courses")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                tab === "courses" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setTab("packages")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                tab === "packages" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              Packages
            </button>
          </div>

          {tab === "courses" ? (
            <>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                  <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search courses..."
                    className="field pl-10 pr-8"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <IconX size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => {
                      setCategory("");
                      setPage(1);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${category === "" ? "bg-primary text-white border-primary" : "border-border bg-card"}`}
                  >
                    All
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {coursesQuery.isPending ? "Loading..." : `${total} ${total === 1 ? "course" : "courses"}`}
              </p>

              {coursesQuery.isPending ? (
                <CourseSkeleton count={PER_PAGE} />
              ) : (coursesQuery.data?.courses?.length || 0) === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center text-center py-16">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/70 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Coming Soon</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">No Courses Available</h3>
                  <p className="text-sm text-muted-foreground max-w-md">No catalogue courses match your filters. Try another category or clear search.</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coursesQuery.data!.courses.map((c: any) => (
                      <CourseCard key={c.id} course={c} bannerSize="lg" />
                    ))}
                  </div>
                  {lastPage > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-8">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-white disabled:opacity-30"
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-full text-sm font-bold ${p === page ? "bg-primary text-white" : "border border-border bg-white"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={page >= lastPage}
                        onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-white disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : packagesQuery.isPending ? (
            <CourseSkeleton count={3} />
          ) : (
            <CataloguePageClient packages={packagesQuery.data?.packages || []} />
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
