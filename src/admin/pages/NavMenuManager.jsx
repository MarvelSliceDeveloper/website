import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabaseClient";
import Card from "../components/ui/Card";
import {
  FiPlus, FiCheck, FiFolder, FiFile, FiEdit3, FiTrash2,
  FiChevronDown, FiChevronRight, FiArrowLeft, FiBookOpen, FiSearch
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/ui/PageShell";
import useConfirm from '../hooks/useConfirm';
import { toast } from '../components/Toast';

const PAGE_SIZE = 10;
const MAX_DEPTH = 2;

function formatTimestamp() {
  return new Date().toISOString();
}

export default function NavMenuManager() {
  const [confirm, confirmDialog] = useConfirm();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionLabel = searchParams.get("section") || "Software Learning";

  const activeTab = searchParams.get("tab") === "add" ? "add" : "view";

  // --- Core Data ---
  const [dbItems, setDbItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Search & Filters ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // --- Form State ---
  const [editing, setEditing] = useState(null);
  const [lockedParent, setLockedParent] = useState(null);
  const [form, setForm] = useState({ label: "", path: "", status: "on", parent_id: null });
  const [parentOpen, setParentOpen] = useState(false);
  const pathAuto = useRef(true);

  // --- Table State ---
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});


  // --- Drill-Down Navigation ---
  const [drillStack, setDrillStack] = useState([]);

  // --- Course Link UI ---
  const [courseLinkOpen, setCourseLinkOpen] = useState(false);

  // =============================================
  // DATA FETCHING
  // =============================================

  const goToTab = useCallback((tab, extraParams = {}) => {
    const next = Object.fromEntries(searchParams);
    setSearchParams({ ...next, section: sectionLabel, tab, ...extraParams }, { replace: true });
  }, [searchParams, setSearchParams, sectionLabel]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [navRes, courseRes] = await Promise.all([
      supabase.from("nav_items").select("*").order("sort_order"),
      supabase.from("courses").select("id, title, slug, nav_item_id").order("title"),
    ]);
    if (navRes.data) setDbItems(navRes.data);
    if (courseRes.data) setCourses(courseRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!searchParams.get("section")) {
      setSearchParams({ section: "Software Learning", tab: "view" }, { replace: true });
    }
  }, []);

  // Reset everything when section changes
  useEffect(() => {
    setPage(1);
    setExpanded({});
    setDrillStack([]);
    setCourseLinkOpen(false);
    setSearchQuery("");
    setActiveSearch("");
    setStatusFilter("all");
    cancelForm();
  }, [sectionLabel]);

  // =============================================
  // AUTH CHECK
  // =============================================

  if (currentUser?.role !== "admin" && currentUser?.role !== "manager" && currentUser?.role !== "master_admin") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-admin-200 bg-white p-6 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-neutral-500">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // =============================================
  // HELPERS
  // =============================================

  function slugify(text) {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  function getSectionItems(label) {
    return dbItems.filter((item) => item.parent_label === label && !item.parent_id);
  }

  function getChildItems(pid) {
    return dbItems.filter((item) => String(item.parent_id) === String(pid));
  }

  function getAllSectionItems(label) {
    const result = [];
    function walk(items, depth) {
      for (const item of items) {
        result.push({ ...item, _depth: depth });
        if (depth < MAX_DEPTH) walk(getChildItems(item.id), depth + 1);
      }
    }
    walk(getSectionItems(label), 0);
    return result;
  }

  function getParentChainItems(itemId) {
    const chain = [];
    let current = dbItems.find(i => i.id === itemId);
    while (current) {
      chain.unshift(current);
      current = current.parent_id ? dbItems.find(i => i.id === current.parent_id) : null;
    }
    return chain;
  }

  function getParentChainLabels(itemId) {
    return getParentChainItems(itemId).map(i => i.label);
  }

  function countAllDescendants(parentId) {
    let count = 0;
    const children = getChildItems(parentId);
    for (const child of children) {
      count += 1 + countAllDescendants(child.id);
    }
    return count;
  }

  // =============================================
  // DRILL-DOWN NAVIGATION
  // =============================================

  function drillInto(itemId) {
    setDrillStack(prev => [...prev, itemId]);
    setPage(1);
    setExpanded({});
    setCourseLinkOpen(false);
  }

  function drillTo(index) {
    if (index < 0) {
      setDrillStack([]);
    } else {
      setDrillStack(prev => prev.slice(0, index + 1));
    }
    setPage(1);
    setExpanded({});
    setCourseLinkOpen(false);
  }

  // =============================================
  // FORM HANDLERS
  // =============================================

  function handleLabelChange(value) {
    setForm((prev) => {
      const next = { ...prev, label: value };
      if (pathAuto.current) {
        const slug = slugify(value);
        next.path = value ? `/courses/${slugify(sectionLabel)}/${slug}` : '';
      }
      return next;
    });
  }

  function handlePathChange(value) {
    pathAuto.current = false;
    setForm((prev) => ({ ...prev, path: value }));
  }

  function openAdd(parentItem = null) {
    setEditing(null);
    setLockedParent(parentItem);
    setParentOpen(false);
    pathAuto.current = true;
    setForm({ label: "", path: "", status: "on", parent_id: parentItem?.id || null });
    goToTab("add");
  }

  function openEdit(item, e) {
    if (e) e.stopPropagation();
    setEditing(item);
    setLockedParent(null);
    setParentOpen(false);
    pathAuto.current = false;
    setForm({ label: item.label, path: item.path || "", status: item.is_active !== false ? "on" : "off", parent_id: null });
    goToTab("add");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.label.trim()) return;

    const now = formatTimestamp();
    let savedId;

    if (editing) {
      await supabase.from("nav_items").update({
        label: form.label, path: form.path || null, is_active: form.status === "on",
      }).eq("id", editing.id);
      savedId = editing.id;
      toast({ type: "success", message: "Nav item updated" });
    } else {
      const { data } = await supabase.from("nav_items").insert({
        label: form.label, path: form.path || null,
        parent_label: form.parent_id ? null : sectionLabel,
        parent_id: form.parent_id || null,
        is_active: form.status === "on", sort_order: 0, created_at: now,
      }).select("id").single();
      savedId = data?.id;
      toast({ type: "success", message: "Nav item added" });
    }

    queryClient.invalidateQueries({ queryKey: ['topNavItems'] });
    cancelForm();
    await fetchData();

    // Auto-expand parent chain and highlight
    if (savedId) {
      const parentItem = form.parent_id ? dbItems.find(i => i.id === form.parent_id) : null;
      if (parentItem) {
        setExpanded(p => ({ ...p, [parentItem.id]: true }));
      }
    }
    setPage(1);
    goToTab("view");
  }

  async function handleDelete(item, e) {
    if (e) e.stopPropagation();
    const totalSubs = countAllDescendants(item.id);
    const subText = totalSubs > 0 ? ` and its ${totalSubs} sub-item${totalSubs > 1 ? 's' : ''}` : '';
    if (!(await confirm(`Delete "${item.label}"${subText}?`))) return;
    
    await supabase.from("nav_items").delete().eq("id", item.id);
    queryClient.invalidateQueries({ queryKey: ['topNavItems'] });
    toast({ type: "success", message: `"${item.label}" deleted` });

    if (drillStack.includes(item.id)) {
      const idx = drillStack.indexOf(item.id);
      drillTo(idx - 1);
    }
    fetchData();
  }

  function cancelForm() {
    setEditing(null);
    setLockedParent(null);
    setParentOpen(false);
    pathAuto.current = true;
    setForm({ label: "", path: "", status: "on", parent_id: null });
  }

  // =============================================
  // COURSE LINKING
  // =============================================

  async function toggleCourseLink(courseId, navItemId) {
    const course = courses.find(c => c.id === courseId);
    const newNavItemId = course.nav_item_id === navItemId ? null : navItemId;
    await supabase.from('courses').update({ nav_item_id: newNavItemId }).eq('id', courseId);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, nav_item_id: newNavItemId } : c));
    toast({ type: "success", message: newNavItemId ? "Course linked" : "Course unlinked" });
  }

  // =============================================
  // COMPUTED VALUES & FILTERING
  // =============================================

  const currentParentId = drillStack.length > 0 ? drillStack[drillStack.length - 1] : null;
  const currentParent = currentParentId ? dbItems.find(i => i.id === currentParentId) : null;
  const currentLevel = drillStack.length;
  
  const baseItems = currentParentId
    ? getChildItems(currentParentId)
    : getSectionItems(sectionLabel);

  // Apply search and status filters
  const filteredItems = useMemo(() => {
    let result = baseItems;
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase();
      result = result.filter(item => 
        (item.label && item.label.toLowerCase().includes(q)) || 
        (item.path && item.path.toLowerCase().includes(q))
      );
    }
    if (statusFilter === "active") {
      result = result.filter(item => item.is_active !== false);
    } else if (statusFilter === "inactive") {
      result = result.filter(item => item.is_active === false);
    }
    return result;
  }, [baseItems, activeSearch, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeSearch, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  const drillBreadcrumbs = drillStack
    .map(id => dbItems.find(i => i.id === id))
    .filter(Boolean);

  // =============================================
  // LOADING
  // =============================================

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  // If drilled into a deleted item, reset
  if (currentParentId && !currentParent) {
    setDrillStack([]);
    return null;
  }

  // =============================================
  // SUB-COMPONENTS
  // =============================================

  function ContentBreadcrumbs() {
    if (drillStack.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 flex-wrap px-1 mb-4">
        <button
          onClick={() => drillTo(-1)}
          className="flex items-center gap-1.5 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors font-bold"
          title="Back to top level"
        >
          <FiArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => drillTo(-1)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          {sectionLabel}
        </button>
        {drillBreadcrumbs.map((item, idx) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <FiChevronRight className="w-3 h-3 text-gray-300" />
            {idx === drillBreadcrumbs.length - 1 ? (
              <span className="text-xs font-semibold text-gray-900">{item.label}</span>
            ) : (
              <button
                onClick={() => drillTo(idx)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {item.label}
              </button>
            )}
          </span>
        ))}
      </div>
    );
  }

  function ParentInfoCard() {
    if (!currentParent) return null;
    const parentLinked = courses.filter(c => c.nav_item_id === currentParent.id);

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FiFolder className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="truncate">{currentParent.label}</span>
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
              {currentParent.path && (
                <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{currentParent.path}</span>
              )}
              <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${
                currentParent.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {currentParent.is_active !== false ? 'Active' : 'Inactive'}
              </span>
              <span>{baseItems.length} child{baseItems.length !== 1 ? 'ren' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentLevel < MAX_DEPTH && (
              <button onClick={() => openAdd(currentParent)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm" title="Add child">
                <FiPlus className="w-3.5 h-3.5" /> Add Child
              </button>
            )}
            <button onClick={(e) => openEdit(currentParent, e)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
              <FiEdit3 className="w-3.5 h-3.5" /> Edit Parent
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiBookOpen className="w-3.5 h-3.5" />
              Linked Courses ({parentLinked.length})
            </h4>
            <button
              onClick={() => setCourseLinkOpen(!courseLinkOpen)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors border border-blue-200 bg-white px-2 py-1 rounded"
            >
              {courseLinkOpen ? 'Close Links' : 'Manage Links'}
            </button>
          </div>

          {parentLinked.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {parentLinked.map(c => (
                <Link key={c.id} to={`/admin/courses/${c.id}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-700 bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <FiBookOpen className="w-3 h-3 text-blue-500" />
                  {c.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No courses currently linked.</p>
          )}

          {courseLinkOpen && (
            <div className="mt-3 border border-gray-200 rounded-lg bg-white shadow-sm max-h-56 overflow-y-auto admin-scrollbar">
              {courses.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">No courses available.</p>
              ) : (
                courses.map(c => {
                  const isLinked = c.nav_item_id === currentParent.id;
                  const linkedElsewhere = c.nav_item_id && c.nav_item_id !== currentParent.id;
                  const otherItem = linkedElsewhere ? dbItems.find(n => n.id === c.nav_item_id) : null;
                  return (
                    <label key={c.id}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                        linkedElsewhere ? 'text-gray-400 cursor-not-allowed bg-gray-50/50' : 'hover:bg-blue-50/30 cursor-pointer'
                      }`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isLinked ? 'bg-blue-600 border-blue-600' : linkedElsewhere ? 'border-gray-200 bg-gray-100' : 'border-gray-300 bg-white'
                      }`}>
                        {isLinked && <FiCheck className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" checked={isLinked} disabled={linkedElsewhere}
                        onChange={() => { if (!linkedElsewhere) toggleCourseLink(c.id, currentParent.id); }}
                        className="sr-only" />
                      <span className="truncate flex-1 font-medium">{c.title}</span>
                      {linkedElsewhere && (
                        <span className="text-[10px] text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
                          Linked to: {otherItem?.label || 'Other'}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function NavTable({ items, level = 0, parentLabel = '' }) {
    return items.map((item, idx) => {
      const actualDepth = currentLevel + level;
      const subs = actualDepth < MAX_DEPTH ? getChildItems(item.id) : [];
      const open = expanded[item.id];
      const slNo = level === 0 ? (page - 1) * PAGE_SIZE + idx + 1 : idx + 1;
      const labelPrefix = level > 0 ? `${parentLabel}.${slNo}` : `${slNo}`;
      const hasSubs = subs.length > 0;
      const itemLinkedCourses = courses.filter(c => c.nav_item_id === item.id);

      return (
        <div key={item.id}>
          <div
            onClick={() => {
              if (hasSubs) setExpanded(open ? {} : { [item.id]: true });
            }}
            className={`group grid grid-cols-12 gap-3 px-6 py-3.5 items-center transition-all hover:bg-gray-50 ${
              level > 0 ? 'bg-gray-50/30 border-t border-gray-100' : 'bg-white'
            } ${hasSubs ? 'cursor-pointer' : ''}`}
            style={{ paddingLeft: `${24 + level * 28}px` }}
          >
            <div className="col-span-1 text-xs text-gray-400 font-mono">{labelPrefix}</div>

            <div className="col-span-3 flex items-center gap-2.5 min-w-0">
              {hasSubs ? (
                <button onClick={(e) => { e.stopPropagation(); setExpanded(open ? {} : { [item.id]: true }); }}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none">
                  {open ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : <span className="w-5" />}
              {level > 0 ? (
                <FiFile className="w-4 h-4 text-gray-300 shrink-0" />
              ) : hasSubs ? (
                <FiFolder className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <FiFile className="w-4 h-4 text-gray-300 shrink-0" />
              )}
              <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                {item.label}
              </span>
              {itemLinkedCourses.length > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium" title={`${itemLinkedCourses.length} linked courses`}>
                  <FiBookOpen className="w-2.5 h-2.5" />{itemLinkedCourses.length}
                </span>
              )}
            </div>

            <div className="col-span-4 truncate">
              {item.path ? (
                <span className="text-xs text-gray-500 font-mono truncate block bg-gray-50 px-2 py-1 rounded inline-block">{item.path}</span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>

            <div className="col-span-1">
              {hasSubs ? (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {subs.length} sub{subs.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>

            <div className="col-span-1">
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                item.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {item.is_active !== false ? 'On' : 'Off'}
              </span>
            </div>

            <div className="col-span-2 flex items-center justify-end gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); drillInto(item.id); }}
                className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Manage">
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(item, e); }}
                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {open && hasSubs && (
            <NavTable items={subs} level={level + 1} parentLabel={labelPrefix} />
          )}
        </div>
      );
    });
  }

  return (
    <PageShell title="Navigation Menu" subtitle={currentParent ? `${sectionLabel} ▸ ${drillBreadcrumbs.map(b => b.label).join(' ▸ ')}` : `Manage navigation items — ${sectionLabel}`}>
      <div className="space-y-5">

        {/* ---- ADD / EDIT FORM ---- */}
        {activeTab === "add" && (
          <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editing
                  ? `Edit Item: ${editing.label}`
                  : lockedParent
                    ? `Add Sub-item under ${getParentChainLabels(lockedParent.id).join(' ▸ ')}`
                    : currentParent
                      ? `Add Item under ${currentParent.label}`
                      : `Add Top-level Item in ${sectionLabel}`}
              </h3>
              <label className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm w-fit">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.status === "on" ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.status === "on" ? "translate-x-5" : ""}`} />
                  <input type="checkbox" checked={form.status === "on"} onChange={(e) => setForm(p => ({ ...p, status: e.target.checked ? "on" : "off" }))} className="sr-only" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Active</span>
              </label>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label <span className="text-red-500">*</span></label>
                  <input value={form.label} onChange={(e) => handleLabelChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow"
                    placeholder="e.g. Web Development" autoFocus />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent</label>
                  {lockedParent ? (
                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed truncate">
                      {getParentChainLabels(lockedParent.id).join(' ▸ ')}
                    </div>
                  ) : (
                    <div className="relative">
                      <button type="button" onClick={() => setParentOpen(!parentOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                        <span className={form.parent_id ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                          {form.parent_id
                            ? dbItems.find(i => i.id === form.parent_id)?.label || '...'
                            : '— None (Top Level) —'}
                        </span>
                        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${parentOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {parentOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto admin-scrollbar">
                          <button type="button" onClick={() => { setForm(p => ({ ...p, parent_id: null })); setParentOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${!form.parent_id ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                            — None (Top Level) —
                          </button>
                          {getAllSectionItems(sectionLabel).map((p) => (
                            <button key={p.id} type="button" onClick={() => { setForm(prev => ({ ...prev, parent_id: p.id })); setParentOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm ${form.parent_id === p.id ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600' : 'text-gray-700 hover:bg-gray-50'} border-t border-gray-50`}
                              style={{ paddingLeft: `${16 + p._depth * 24}px` }}>
                              {p._depth > 0 && <span className="text-gray-300 mr-2">&#8627;</span>}{p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Path</label>
                  <input value={form.path} onChange={(e) => handlePathChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono text-xs transition-shadow"
                    placeholder="/auto-generated" />
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center pt-2 border-t border-gray-100">
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:-translate-y-0.5">
                  <FiCheck className="w-4 h-4" /> Submit
                </button>
                <button type="button" onClick={() => { cancelForm(); goToTab("view"); }}
                  className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all hover:-translate-y-0.5">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ---- VIEW MODE ---- */}
        {activeTab === "view" && (
          <>
            <ContentBreadcrumbs />
            <ParentInfoCard />

            {/* Filter Bar — outside the table container */}
            <div className="bg-white border border-admin-200 p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search items by label or path..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchQuery)}
                      className="w-full pl-9 pr-3 h-9 border border-admin-200 text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
                    />
                  </div>
                  <button onClick={() => { setActiveSearch(searchQuery); setPage(1); }} className="h-9 px-4 bg-admin-600 text-white text-sm font-medium rounded-lg hover:bg-admin-700 transition-colors shrink-0">
                    Search
                  </button>
                </div>
              </div>
              <div className="flex items-end gap-3 w-full">
              <div className="flex-1">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                </div>
              </div>
              </div>
              </div>
            </div>

            <div className="border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">

              {filteredItems.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFolder className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-base font-medium text-gray-900 mb-1">No items found</p>
                  <p className="text-sm text-gray-500">
                    {activeSearch || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters." 
                      : (currentParent ? `No children added under "${currentParent.label}" yet.` : 'Get started by adding a new navigation item.')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-blue-600 border-b border-gray-200 text-xs font-bold text-white uppercase tracking-wider">
                    <div className="col-span-1">SL NO</div>
                    <div className="col-span-3">LABEL</div>
                    <div className="col-span-4">PATH</div>
                    <div className="col-span-1">SUBS</div>
                    <div className="col-span-1">STATUS</div>
                    <div className="col-span-2 text-right">ACTIONS</div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <NavTable items={paginatedItems} level={0} />
                  </div>
                </>
              )}
            </div>

            {/* Pagination — outside the table container */}
            {filteredItems.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-500">Page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages}</span></span>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pn => pn === 1 || pn === totalPages || Math.abs(pn - page) <= 1)
                    .reduce((acc, pn, idx, arr) => {
                      if (idx > 0 && pn - arr[idx - 1] > 1) acc.push('...');
                      acc.push(pn);
                      return acc;
                    }, [])
                    .map((pn, i) =>
                      pn === '...'
                        ? <span key={`e${i}`} className="w-8 h-8 text-sm text-gray-500 flex items-center justify-center">...</span>
                        : <button key={pn} onClick={() => setPage(pn)}
                            className={`w-8 h-8 text-sm font-bold rounded-lg transition-all shadow-sm ${page === pn ? 'bg-blue-600 text-white border-transparent' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>{pn}</button>
                    )}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}
