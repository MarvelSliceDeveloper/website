import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams, Link } from "react-router-dom";
import {
  FiBookOpen,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiClock,
  FiMonitor,
  FiCode,
  FiCpu,
  FiBarChart2,
  FiCloud,
  FiShield,
  FiAward,
  FiUsers,
  FiZap,
  FiGlobe,
} from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import CourseCard from "../components/ui/CourseCard";
import CourseSkeleton from "../components/ui/CourseSkeleton";
import { Stagger, StaggerItem } from "../components/ui/Reveal";

const PER_PAGE = 6;

// Fixed top-level parents — these are the only two groups that should
// ever appear in the SL/CE segmented control and drive the sidebar tree.
// Do NOT derive this dynamically from nav_items; that caused every
// category (Web Development, UPSC, Cybersecurity, etc.) to be treated
// as a top-level parent and rendered as one long horizontal chip strip.
const PARENTS = [
  {
    label: "Software Learning",
    slug: "software-learning",
    displayLabel: "Software",
  },
  {
    label: "Competitive Exam",
    slug: "competitive-exam",
    displayLabel: "Competitive",
  },
];

const CATEGORY_ICONS = {
  "Web Development": FiCode,
  "AI & Machine Learning": FiCpu,
  "Data Science & Analytics": FiBarChart2,
  "Cloud Computing & DevOps": FiCloud,
  Cybersecurity: FiShield,
  UPSC: FiAward,
  SSC: FiUsers,
  Banking: FiZap,
  Railway: FiGlobe,
  Defence: FiShield,
};

const DEFAULT_ICON = FiBookOpen;

const nodeSlug = (node) =>
  node.path ? node.path.replace(/.*\//, "") : node.label.toLowerCase().replace(/\s+/g, "-");

function MobileCatList({ parentTree, activeCategory, countFor, onSelectParent, onSelectChild }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
      {parentTree.map((parentNode) => {
        const parentSlug = nodeSlug(parentNode);
        const Icon = CATEGORY_ICONS[parentNode.label] || DEFAULT_ICON;
        const isParentActive = activeCategory === parentSlug;
        const hasChildren = parentNode.children.length > 0;
        const open =
          expanded === parentNode.id ||
          isParentActive ||
          parentNode.children.some((c) => nodeSlug(c) === activeCategory);
        return (
          <div key={parentNode.id}>
            <button
              onClick={() => {
                onSelectParent(parentNode, parentSlug);
                if (hasChildren) setExpanded(open ? null : parentNode.id);
              }}
              className={`w-full text-left pl-[9px] pr-3 py-2.5 text-xs sm:text-sm transition-all duration-200 ease-out cursor-pointer flex items-center justify-between gap-2 overflow-hidden border-l-[3px] ${
                isParentActive
                  ? "border-brand-blue text-brand-blue font-semibold"
                  : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-gray-900"
              }`}
              aria-label={`${parentNode.label} (${parentNode.totalCount} courses)`}
            >
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${isParentActive ? "text-brand-blue" : "text-gray-400"}`} />
                </span>
                <span className="truncate min-w-0 max-w-full">{parentNode.label}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-medium tabular-nums leading-none px-1.5 py-0.5 rounded-full ${
                  isParentActive ? "bg-brand-blue/15 text-brand-blue" : "text-gray-400"
                }`}>
                  {parentNode.totalCount}
                </span>
                {hasChildren && (
                  <FiChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${open ? "rotate-90" : ""} ${
                    isParentActive ? "text-brand-blue" : "text-gray-400"
                  }`} />
                )}
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                {hasChildren && (
                  <div className="border-t border-gray-100 ml-[22px] pl-[13px]">
                    {parentNode.children.map((child) => {
                      const childSlug = nodeSlug(child);
                      const ChildIcon = CATEGORY_ICONS[child.label] || DEFAULT_ICON;
                      const isChildActive = activeCategory === childSlug;
                      return (
                        <button
                          key={child.id}
                          onClick={() => onSelectChild(child, childSlug)}
                          className={`w-full text-left pl-[9px] pr-3 py-2 text-xs transition-all duration-200 ease-out cursor-pointer flex items-center justify-between gap-2 overflow-hidden border-l-[3px] ${
                            isChildActive
                              ? "border-brand-blue text-brand-blue font-semibold"
                              : "border-transparent text-gray-500 hover:border-brand-blue/50 hover:text-gray-900"
                          }`}
                          aria-label={`${child.label} (${countFor(child.id)} courses)`}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
                              <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? "text-brand-blue" : "text-gray-400"}`} />
                            </span>
                            <span className="truncate min-w-0 max-w-full">{child.label}</span>
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 tabular-nums leading-none shrink-0">
                            {countFor(child.id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pagination({ page, total, onPage }) {
  const last = Math.ceil(total / PER_PAGE);
  if (last <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        <FiChevronLeft className="w-4 h-4" />
      </button>
      {(() => {
        const pages = [];
        if (last <= 7) {
          for (let i = 1; i <= last; i++) pages.push(i);
        } else {
          pages.push(1);
          if (page > 3) pages.push('...');
          for (let i = Math.max(2, page - 1); i <= Math.min(last - 1, page + 1); i++) pages.push(i);
          if (page < last - 2) pages.push('...');
          pages.push(last);
        }
        return pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-all cursor-pointer ${
                p === page
                  ? "bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        );
      })()}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= last}
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Next page"
      >
        <FiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function CourseListItem({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex items-center gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-orange/30 hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-200"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-brand-orange/15 to-brand-orange/5 flex items-center justify-center">
        {course.hero_image_url ? (
          <img
            src={course.hero_image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <FiBookOpen className="w-7 h-7 text-brand-orange/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-dark-navy text-sm sm:text-base truncate group-hover:text-brand-orange transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {course.duration && (
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5" />
              {course.duration}
            </span>
          )}
          {course.mode && (
            <span className="flex items-center gap-1">
              <FiMonitor className="w-3.5 h-3.5" />
              {course.mode}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-brand-orange shrink-0">View Course &rarr;</span>
    </Link>
  );
}

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userExpanded, setUserExpanded] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const parentParam = searchParams.get("parent") || PARENTS[0].slug;
  const activeCategory = searchParams.get("category") || categorySlug || null;
  const listOnly = searchParams.get("view") === "list";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const setPage = useCallback(
    (p) => {
      const next = new URLSearchParams(searchParams);
      if (p <= 1) next.delete("page");
      else next.set("page", String(p));
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const selectParent = useCallback(
    (slug) => {
      setSearch("");
      setPage(1);
      setSearchParams({ parent: slug });
    },
    [setPage, setSearchParams],
  );

  const selectCategory = useCallback(
    (slug) => {
      setSearch("");
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      next.set("category", slug);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const selectParentCategory = useCallback(
    (parentSlug, catSlug) => {
      setSearch("");
      const next = new URLSearchParams();
      next.set("parent", parentSlug);
      next.set("category", catSlug);
      setSearchParams(next);
    },
    [setSearchParams],
  );

  const { data: courses, isLoading } = useQuery({
    queryKey: ["allCourses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("*, nav_item_id")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    staleTime: 0,
  });

  const { data: navItems, isLoading: navLoading } = useQuery({
    queryKey: ["courseNavCategories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nav_items")
        .select("id, label, path, parent_label, parent_id")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    staleTime: 0,
  });

  const courseMap = useMemo(() => {
    if (!courses || !navItems) return {};
    const map = {};
    courses.forEach((c) => {
      if (c.nav_item_id) {
        if (!map[c.nav_item_id]) map[c.nav_item_id] = [];
        map[c.nav_item_id].push(c);
      }
    });
    const byNav = {};
    navItems.forEach((ni) => {
      byNav[ni.id] = map[ni.id] || [];
    });
    return byNav;
  }, [courses, navItems]);

  // Fixed, not derived from navItems — see PARENTS comment above.
  const parents = PARENTS;

  function countFor(id) {
    return courseMap[id]?.length || 0;
  }

  const tree = useMemo(() => {
    if (!navItems || !parents.length) return {};
    const byParent = {};
    parents.forEach((p) => {
      byParent[p.label] = [];
    });
    navItems.forEach((ni) => {
      if (ni.parent_label && byParent[ni.parent_label]) {
        byParent[ni.parent_label].push(ni);
      }
    });
    const expand = (items) =>
      items.map((p) => {
        const children = navItems.filter((c) => c.parent_id === p.id);
        const childCount = children.reduce((sum, c) => sum + countFor(c.id), 0);
        return {
          ...p,
          children,
          totalCount: countFor(p.id) + childCount,
        };
      });
    const result = {};
    parents.forEach((p) => {
      result[p.slug] = expand(byParent[p.label]);
    });
    return result;
  }, [navItems, parents, courseMap]);

  const currentTree = tree[parentParam] || [];

  const activeNavId = useMemo(() => {
    if (!activeCategory || !navItems) return null;
    const found = navItems.find((ni) => {
      const slug = ni.path
        ? ni.path.replace(/.*\//, "")
        : ni.label.toLowerCase().replace(/\s+/g, "-");
      return slug === activeCategory;
    });
    return found?.id || null;
  }, [activeCategory, navItems]);

  const isActiveOrChild = useCallback((parentNode, activeId) => {
    if (!activeId) return false;
    if (parentNode.id === activeId) return true;
    return parentNode.children?.some((c) => c.id === activeId);
  }, []);

  const shouldExpand = useCallback(
    (parentNode) => {
      if (hasUserInteracted) return userExpanded === parentNode.id;
      return isActiveOrChild(parentNode, activeNavId);
    },
    [hasUserInteracted, userExpanded, activeNavId, isActiveOrChild],
  );

  useEffect(() => {
    if (!parentParam || activeNavId || !navItems || !currentTree.length) return;
    const first = currentTree[0]?.children?.[0];
    if (!first) return;
    const slug = first.path
      ? first.path.replace(/.*\//, "")
      : first.label.toLowerCase().replace(/\s+/g, "-");
    const next = new URLSearchParams();
    next.set("parent", parentParam);
    next.set("category", slug);
    setSearchParams(next, { replace: true });
  }, [parentParam, activeNavId, navItems, currentTree, setSearchParams]);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!parentParam || !navItems || !currentTree.length) return;
    if (!searchParams.get("category") && currentTree.length > 0) {
      const first = currentTree[0]?.children?.[0] || currentTree[0];
      if (first) {
        const slug = first.path
          ? first.path.replace(/.*\//, "")
          : first.label.toLowerCase().replace(/\s+/g, "-");
        const next = new URLSearchParams();
        next.set("parent", parentParam);
        next.set("category", slug);
        setSearchParams(next, { replace: true });
      }
    }
  }, [parentParam, navItems, currentTree, searchParams, setSearchParams]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (activeNavId) {
      const byId = courseMap[activeNavId];
      if (byId && byId.length > 0) return byId;
    }
    return [];
  }, [courses, courseMap, activeNavId]);

  const searchedCourses = useMemo(() => {
    if (!search) return filteredCourses;
    const q = search.toLowerCase();
    return filteredCourses.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.slug || "").toLowerCase().includes(q),
    );
  }, [filteredCourses, search]);

  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return searchedCourses.slice(start, start + PER_PAGE);
  }, [searchedCourses, page]);

  const totalItems = searchedCourses.length;

  function toggleParent(id) {
    setHasUserInteracted(true);
    setUserExpanded((prev) => (prev === id ? null : id));
  }

  if (isLoading || navLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="w-48 h-8 bg-gray-200 rounded-lg mb-8 animate-pulse" />
        <CourseSkeleton count={6} />
      </div>
    );
  }

  const sidebarNode = (parentNode) => {
    const Icon = CATEGORY_ICONS[parentNode.label] || DEFAULT_ICON;
    const parentSlug = parentNode.path
      ? parentNode.path.replace(/.*\//, "")
      : parentNode.label.toLowerCase().replace(/\s+/g, "-");
    const isParentActive = activeCategory === parentSlug;
    const expanded = shouldExpand(parentNode);
    const hasChildren = parentNode.children.length > 0;

    return (
      <div key={parentNode.id} className="mb-0.5 border-b border-gray-100 last:border-b-0">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleParent(parentNode.id);
              const firstChild = parentNode.children[0];
              if (firstChild) {
                const childSlug = firstChild.path
                  ? firstChild.path.replace(/.*\//, "")
                  : firstChild.label.toLowerCase().replace(/\s+/g, "-");
                selectCategory(childSlug);
              }
            } else {
              selectCategory(parentSlug);
            }
          }}
          className={`w-full text-left pl-[9px] pr-3 py-2.5 rounded-r-xl text-sm transition-all duration-200 ease-out cursor-pointer flex items-center justify-between gap-2 overflow-hidden border-l-[3px] ${
            isParentActive
              ? "border-brand-blue text-brand-blue font-semibold"
              : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-gray-900"
          }`}
          aria-expanded={hasChildren ? expanded : undefined}
          aria-label={`${parentNode.label} (${parentNode.totalCount} courses)`}
        >
          <span className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
              <Icon
                className={`w-[18px] h-[18px] ${isParentActive ? "text-brand-blue" : "text-gray-400"}`}
              />
            </span>
            <span className="truncate min-w-0 max-w-full">
              {parentNode.label}
            </span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs font-medium tabular-nums leading-none px-1.5 py-0.5 rounded-full ${
                isParentActive
                  ? "bg-brand-blue/15 text-brand-blue"
                  : "text-gray-400"
              }`}
            >
              {parentNode.totalCount}
            </span>
            {hasChildren && (
              <FiChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${expanded ? "rotate-90" : ""} ${
                  isParentActive ? "text-brand-blue" : "text-gray-400"
                }`}
              />
            )}
          </span>
        </button>
        <div
          className={`grid transition-all duration-200 ease-out ${
            expanded
              ? "grid-rows-[1fr] opacity-100 mt-0.5"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            {hasChildren && (
              <div className="ml-[22px] pl-[13px]">
                {parentNode.children.map((child) => {
                  const ChildIcon = CATEGORY_ICONS[child.label] || DEFAULT_ICON;
                  const childSlug = child.path
                    ? child.path.replace(/.*\//, "")
                    : child.label.toLowerCase().replace(/\s+/g, "-");
                  const isChildActive = activeCategory === childSlug;
                  return (
                    <button
                      key={child.id}
                      onClick={() => selectCategory(childSlug)}
                      className={`w-full text-left pl-[9px] pr-3 py-2 text-sm transition-all duration-200 ease-out cursor-pointer flex items-center justify-between gap-2 overflow-hidden border-l-[3px] ${
                        isChildActive
                          ? "border-brand-blue text-brand-blue font-semibold"
                          : "border-transparent text-gray-500 hover:border-brand-blue/50 hover:text-gray-900"
                      }`}
                      aria-label={`${child.label} (${countFor(child.id)} courses)`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-[14px] h-[14px] flex items-center justify-center shrink-0">
                          <ChildIcon
                            className={`w-[14px] h-[14px] ${isChildActive ? "text-brand-blue" : "text-gray-400"}`}
                          />
                        </span>
                        <span className="truncate min-w-0 max-w-full">
                          {child.label}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-gray-400 tabular-nums leading-none shrink-0">
                        {countFor(child.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      <div className="flex w-full min-h-screen">
        {/* Left Sidebar — hidden in list-only mode */}
        {!listOnly && (
          <aside
            className="w-[270px] shrink-0 hidden lg:flex lg:flex-col bg-[#f1f3f6] border-r border-gray-200 overflow-y-auto sticky top-0"
            aria-label="Course categories"
          >
            {/* Toggle at top — flush with header */}
            <div className="px-0 pt-0">
              <div className="flex border-b border-gray-200 overflow-hidden">
                {parents.map((p) => {
                  const active = parentParam === p.slug;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => selectParent(p.slug)}
                      className={`flex-1 py-3 text-sm font-medium text-center transition-all cursor-pointer ${
                        active
                          ? "bg-[#f59e0b] text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                          : "bg-[#EEEEEE] text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {p.displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Category tree */}
            <nav className="px-3 pt-3 pb-4 overflow-y-auto flex-1">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {currentTree.map(sidebarNode)}
              </div>
            </nav>
          </aside>
        )}

        {/* Right content — scrollable */}
        <div
          className={`flex-1 min-w-0 bg-white ${
            listOnly
              ? "max-w-[1400px] mx-auto pt-6"
              : "max-w-[1600px] pt-0 lg:pt-6"
          }`}
        >
          {/* Mobile sidebar — persistent PC toggle + narrow filter dropdown + guide */}
          {!listOnly && (
            <div className="lg:hidden mb-0">
              <div className="flex border border-gray-200">
                {parents.map((p) => {
                  const activeParent = parentParam === p.slug;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => selectParent(p.slug)}
                      className={`flex-1 py-3 text-xs sm:text-sm font-medium text-center transition-all cursor-pointer ${
                        activeParent
                          ? "bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                          : "bg-[#EEEEEE] text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {p.displayLabel}
                    </button>
                  );
                })}
              </div>

              <div className="px-4 sm:px-6 pt-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-2/3 sm:w-1/2 shrink-0">
                    {mobileOpen && (
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                      />
                    )}
                    <button
                      onClick={() => setMobileOpen((o) => !o)}
                      className={`relative z-30 w-full flex items-center justify-between gap-2 pl-3.5 pr-3 py-2.5 rounded-full border-2 text-sm transition-all duration-200 cursor-pointer bg-white ${
                        mobileOpen
                          ? "border-brand-blue/40 text-dark-navy"
                          : "border-gray-300 text-dark-navy hover:border-brand-blue/30"
                      }`}
                      aria-expanded={mobileOpen}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FiFilter
                          className={`w-4 h-4 shrink-0 ${mobileOpen ? "text-brand-blue" : "text-gray-400"}`}
                        />
                        <span className="truncate min-w-0 max-w-full text-left">
                          {activeNavId
                            ? navItems?.find((n) => n.id === activeNavId)?.label
                            : "Select category"}
                        </span>
                      </span>
                      <FiChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                          mobileOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {mobileOpen && (
                      <div className="absolute left-0 right-0 z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                          {currentTree.length === 0 ? (
                            <div className="px-2 py-4 text-center text-xs text-gray-400">
                              No categories yet
                            </div>
                          ) : (
                            <MobileCatList
                              parentTree={currentTree}
                              activeCategory={activeCategory}
                              countFor={countFor}
                              onSelectParent={(parentNode, parentSlug) => {
                                if (parentNode.children.length === 0) {
                                  selectParentCategory(parentParam, parentSlug);
                                  setMobileOpen(false);
                                }
                              }}
                              onSelectChild={(child, childSlug) => {
                                selectParentCategory(parentParam, childSlug);
                                setMobileOpen(false);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="flex-1 min-w-0 text-xs sm:text-sm text-gray-500 leading-relaxed pt-2">
                    Tap to filter courses.
                  </p>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-1 mt-6">
                  Find Your Courses related to{" "}
                  {parents.find((p) => p.slug === parentParam)?.label ||
                    "Software Learning"}
                </h1>
                {activeNavId && (
                  <p className="text-lg sm:text-xl font-semibold text-[#175CDD]">
                    {navItems?.find((n) => n.id === activeNavId)?.label || ""}
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            className={`${
              listOnly
                ? "max-w-[1280px] mx-auto px-4 sm:px-6 py-6"
                : "pr-4 sm:pr-6 lg:pr-8 pl-4 sm:pl-6 lg:pl-10 pb-16"
            }`}
          >
            {/* List-only header */}
            {listOnly && (
              <div className="mb-6">
                <Link
                  to={`/courses?parent=${parentParam}`}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-orange transition-colors mb-3"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Back
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-dark-navy">
                  {navItems?.find((n) => n.id === activeNavId)?.label ||
                    "Courses"}
                </h1>
              </div>
            )}

            {/* Sidebar-mode header */}
            {!listOnly && (
              <div className="hidden lg:block mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-1">
                  Find Your Courses related to{" "}
                  {parents.find((p) => p.slug === parentParam)?.label || "Software Learning"}
                </h1>
                {activeNavId && (
                  <p className="text-lg sm:text-xl font-semibold text-[#175CDD]">
                    {navItems?.find((n) => n.id === activeNavId)?.label || ""}
                  </p>
                )}
              </div>
            )}

            {/* Toolbar row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-dark-navy">
                  {totalItems}
                </span>{" "}
                {totalItems === 1 ? "course" : "courses"}
              </p>
              <div className="flex items-center gap-3 ml-auto">
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-56 lg:w-64">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border-2 border-gray-300 text-sm text-dark-navy bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/30 transition-all"
                    aria-label="Search courses"
                  />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white text-brand-orange shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="Grid view"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white text-brand-orange shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="List view"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {searchedCourses.length === 0 ? (
              <div className="text-center py-20">
                {search ? (
                  <>
                    <FiSearch className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No courses match &quot;{search}&quot;
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
                      <FiClock className="w-7 h-7 text-brand-orange" />
                    </div>
                    <p className="text-lg font-semibold text-dark-navy mb-1">
                      Coming soon
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      We&apos;re working on courses in this category. Check back
                      soon.
                    </p>
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-full hover:bg-brand-orange/90 transition-colors"
                    >
                      <FiGrid className="w-4 h-4" />
                      Browse all courses
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <Stagger
                    key={`${activeNavId || "all"}-${search}-${page}`}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {paginatedCourses.map((course) => (
                      <StaggerItem key={course.id}>
                        <CourseCard
                          course={course}
                          bannerSize="lg"
                          showViewLink
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                ) : (
                  <div className="space-y-3">
                    {paginatedCourses.map((course) => (
                      <CourseListItem key={course.id} course={course} />
                    ))}
                  </div>
                )}
                {!listOnly && (
                  <Pagination page={page} total={totalItems} onPage={setPage} />
                )}
                {listOnly && totalItems > 0 && (
                  <div className="flex justify-end mt-8">
                    <Link
                      to={`/courses?parent=${parentParam}`}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Explore more courses
                      <FiChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
