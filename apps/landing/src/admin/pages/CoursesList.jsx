import { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import {
  FiBookOpen,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiChevronDown,
  FiArrowLeft,
  FiX,
  FiCheckSquare,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";
import useConfirm from "../hooks/useConfirm";

export default function CoursesList() {
  const location = useLocation();
  const [confirm, confirmDialog] = useConfirm();
  const [courses, setCourses] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [catL1, setCatL1] = useState("All");
  const [catL2, setCatL2] = useState("All");

  useEffect(() => {
    setCatL1("All");
    setCatL2("All");
  }, [activeCategory]);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const [coursesRes, navRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("nav_items").select("id, parent_id, parent_label, label"),
    ]);
    if (!coursesRes.error) setCourses(coursesRes.data || []);
    if (!navRes.error) setNavItems(navRes.data || []);
    setLoading(false);
  }

  function getRootSection(navItemId) {
    if (!navItemId || navItems.length === 0) return "Uncategorized";
    let current = navItems.find((n) => n.id === navItemId);
    if (!current) return "Uncategorized";
    while (current.parent_id) {
      const parent = navItems.find((n) => n.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current.parent_label || "Uncategorized";
  }

  function getStatusLabel(status) {
    return status === "Inactive" || status === "Unpublished" ? "Draft" : status;
  }

  function statusBadge(status) {
    const s = getStatusLabel(status);
    const variant =
      s === "Active" ? "active" : s === "Coming Soon" ? "coming_soon" : "draft";
    return <Badge variant={variant}>{s || "Draft"}</Badge>;
  }

  async function handleDelete(id, title) {
    if (!(await confirm(`Delete "${title}"? This cannot be undone.`))) return;
    await supabase.from("courses").delete().eq("id", id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }

  const filteredCourses = courses.filter((c) => {
    // 1. Category
    if (activeCategory && getRootSection(c.nav_item_id) !== activeCategory) {
      return false;
    }

    // 2. Status
    if (statusFilter !== "All" && getStatusLabel(c.status) !== statusFilter)
      return false;

    // 3. Search
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      if (
        !(c.title || "").toLowerCase().includes(q) &&
        !(c.slug || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    // 4. L1 filter
    if (catL1 !== "All") {
      let currentId = c.nav_item_id;
      let hasCat1 = false;
      while (currentId) {
        if (currentId === catL1) {
          hasCat1 = true;
          break;
        }
        const parent = navItems.find((n) => n.id === currentId);
        if (!parent) break;
        currentId = parent.parent_id;
      }
      if (!hasCat1) return false;
    }

    // 5. L2 filter
    if (catL2 !== "All") {
      let currentId = c.nav_item_id;
      let hasCat2 = false;
      while (currentId) {
        if (currentId === catL2) {
          hasCat2 = true;
          break;
        }
        const parent = navItems.find((n) => n.id === currentId);
        if (!parent) break;
        currentId = parent.parent_id;
      }
      if (!hasCat2) return false;
    }

    return true;
  });

  const l1Options = activeCategory
    ? navItems.filter((p) => p.parent_label === activeCategory && !p.parent_id)
    : [];
  const l2Options =
    catL1 !== "All" ? navItems.filter((p) => p.parent_id === catL1) : [];

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeCategory, statusFilter, catL1, catL2, activeSearch, selectionMode]);

  const isAllSelected =
    filteredCourses.length > 0 &&
    filteredCourses.every((c) => selectedIds.includes(c.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCourses.map((c) => c.id));
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !(await confirm(
        `Delete ${count} selected course${count > 1 ? "s" : ""}? This cannot be undone.`,
      ))
    )
      return;

    await supabase.from("courses").delete().in("id", selectedIds);
    setCourses((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setSelectionMode(false);
  }

  const columns = [
    ...(selectionMode
      ? [
          {
            header: (
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-admin-600 focus:ring-admin-500 cursor-pointer"
                title="Select All"
              />
            ),
            className: "w-10 text-center",
            cell: (row) => (
              <input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={() => toggleSelectOne(row.id)}
                className="w-4 h-4 rounded border-gray-300 text-admin-600 focus:ring-admin-500 cursor-pointer"
              />
            ),
          },
        ]
      : []),
    {
      header: "SL NO",
      className: "w-16",
      cell: (row, index) => (
        <span className="text-sm text-neutral-900 font-medium">
          {index + 1}
        </span>
      ),
    },
    {
      header: "Title",
      cell: (row) => (
        <Link
          to={`/admin/courses/${row.id}?return=${encodeURIComponent(location.pathname + location.search)}`}
          className="text-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
        >
          {row.title?.trim() || "Untitled"}
        </Link>
      ),
    },
    {
      header: "Slug",
      className: "hidden sm:table-cell",
      cell: (row) => (
        <span className="text-sm text-neutral-400">/{row.slug}</span>
      ),
    },
    {
      header: "Status",
      cell: (row) => statusBadge(row.status),
    },
    {
      header: "Actions",
      className: "w-24 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/admin/courses/${row.id}?return=${encodeURIComponent(location.pathname + location.search)}`}
            className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors"
            title="Edit"
          >
            <FiEdit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(row.id, row.title)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      backTo="/admin"
      title={activeCategory ? `${activeCategory} Courses` : "Courses"}
      subtitle={`${courses.length} course${courses.length !== 1 ? "s" : ""} total`}
      actions={
        courses.length > 0 ? (
          <div className="flex items-center gap-2">
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-admin-200 bg-white text-neutral-700 hover:bg-slate-50 hover:border-neutral-300 transition-all shadow-xs cursor-pointer"
              >
                <FiCheckSquare className="w-4 h-4 text-admin-600" />
                Select to Delete
              </button>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <FiCheckSquare className="w-3.5 h-3.5 text-admin-600" />
                  {isAllSelected ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null
      }
    >
      {courses.length > 0 && (
        <div className="bg-white border border-admin-200 p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
            <div className="w-full">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setActiveSearch(search.trim())
                    }
                    placeholder="Search title or slug..."
                    className="w-full pl-9 pr-8 h-9 border border-admin-200 text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setActiveSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="Clear search"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setActiveSearch(search.trim())}
                  className="h-9 px-4 bg-admin-600 text-white text-sm font-medium rounded-lg hover:bg-admin-700 transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="flex items-end gap-3 w-full">
              <div className="flex-1">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              {l1Options.length > 0 && (
                <div className="flex-1">
                  <div className="relative">
                    <select
                      value={catL1}
                      onChange={(e) => {
                        setCatL1(e.target.value);
                        setCatL2("All");
                      }}
                      className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all truncate"
                    >
                      <option value="All">All Topics</option>
                      {l1Options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {l2Options.length > 0 && (
                <div className="flex-1">
                  <div className="relative">
                    <select
                      value={catL2}
                      onChange={(e) => setCatL2(e.target.value)}
                      className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all truncate"
                    >
                      <option value="All">All Subtopics</option>
                      {l2Options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiBookOpen}
            title={
              activeCategory
                ? `No courses in ${activeCategory}`
                : "No courses yet"
            }
            description="Get started by creating your first course."
            action={{
              to: `/admin/courses/wizard${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ""}`,
              label: "Create your first course",
            }}
          />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiSearch}
            title="No courses match your filters"
            description="Try adjusting your search or filter criteria."
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCourses}
          searchable={false}
        />
      )}
      {confirmDialog}
    </PageShell>
  );
}
