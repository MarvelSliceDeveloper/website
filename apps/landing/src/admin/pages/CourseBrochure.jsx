import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import {
  FiDownload, FiLoader, FiCheck, FiSearch, FiX, FiFileText, FiBook,
  FiRefreshCw, FiChevronLeft, FiChevronRight, FiCpu, FiCheckSquare, FiSquare
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { generate12PageCourseBrochurePDF } from '../../lib/brochurePDFGenerator';

function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }
  if (typeof val === 'object') return Object.values(val);
  return [];
}

/**
 * On-demand full course data enrichment
 */
async function getFullCourseData(course) {
  if (!course || !course.id) return course;

  const id = course.id;
  const [
    highlightsRes,
    overviewFaqsRes,
    overviewHighlightsRes,
    modulesRes,
    checklistRes,
  ] = await Promise.allSettled([
    supabase.from('highlights').select('*').eq('course_id', id).order('sort_order', { ascending: true }),
    supabase.from('overview_faqs').select('*').eq('course_id', id).order('sort_order', { ascending: true }),
    supabase.from('overview_highlights').select('*').eq('course_id', id).order('sort_order', { ascending: true }),
    supabase.from('modules').select('*').eq('course_id', id).order('sort_order', { ascending: true }),
    supabase.from('checklist_items').select('*').eq('course_id', id).order('sort_order', { ascending: true }),
  ]);

  return {
    ...course,
    highlights: highlightsRes.status === 'fulfilled' && highlightsRes.value.data ? highlightsRes.value.data : (course.highlights || []),
    overview_faqs: overviewFaqsRes.status === 'fulfilled' && overviewFaqsRes.value.data ? overviewFaqsRes.value.data : (course.overview_faqs || []),
    overview_highlights: overviewHighlightsRes.status === 'fulfilled' && overviewHighlightsRes.value.data ? overviewHighlightsRes.value.data : (course.overview_highlights || []),
    modules: modulesRes.status === 'fulfilled' && modulesRes.value.data ? modulesRes.value.data : (course.modules || []),
    checklist_items: checklistRes.status === 'fulfilled' && checklistRes.value.data ? checklistRes.value.data : (course.checklist_items || []),
  };
}

export default function CourseBrochure() {
  const [courses, setCourses] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Download states
  const [downloadingId, setDownloadingId] = useState(null);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // Filters & Selection
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [coursesRes, navRes, settingsRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('nav_items').select('id, label, parent_label, parent_id').order('sort_order'),
        supabase.from('site_settings').select('*').maybeSingle(),
      ]);

      setCourses(coursesRes.data || []);
      setNavItems(navRes.data || []);
      setSiteSettings(settingsRes.data || null);
    } catch (err) {
      console.error('Failed to load courses for brochure:', err);
    } finally {
      setLoading(false);
    }
  }

  function getRootSection(navItemId) {
    if (!navItemId || navItems.length === 0) return 'Software Learning';
    let current = navItems.find(n => n.id === navItemId);
    if (!current) return 'Software Learning';
    while (current.parent_id) {
      const parent = navItems.find(n => n.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current.parent_label || current.label || 'Software Learning';
  }

  function getSubcategory(navItemId) {
    if (!navItemId || navItems.length === 0) return 'Software Development';
    const item = navItems.find(n => n.id === navItemId);
    if (!item) return 'Software Development';
    return item.label || item.parent_label || 'Software Development';
  }

  // Filter only Software Learning courses
  const softwareCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return courses.filter(c => {
      if (!c.nav_item_id) return true;
      const root = getRootSection(c.nav_item_id);
      if (root === 'Competitive Exam' || root === 'Banking' || root === 'Services') {
        return false;
      }
      return true;
    });
  }, [courses, navItems]);

  // Unique subcategories for filter dropdown
  const availableSubcategories = useMemo(() => {
    const set = new Set();
    softwareCourses.forEach(c => {
      const sub = getSubcategory(c.nav_item_id);
      if (sub) set.add(sub);
    });
    return Array.from(set).sort();
  }, [softwareCourses, navItems]);

  // Filtered dataset for the table
  const filteredCourses = useMemo(() => {
    return softwareCourses.filter(course => {
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const titleMatch = (course.title || '').toLowerCase().includes(q);
        const slugMatch = (course.slug || '').toLowerCase().includes(q);
        const descMatch = (course.description || '').toLowerCase().includes(q);
        if (!titleMatch && !slugMatch && !descMatch) return false;
      }
      if (subCategoryFilter !== 'All') {
        const sub = getSubcategory(course.nav_item_id);
        if (sub !== subCategoryFilter) return false;
      }
      if (statusFilter !== 'All') {
        const status = course.status || 'Active';
        if (status !== statusFilter) return false;
      }
      return true;
    });
  }, [softwareCourses, activeSearch, subCategoryFilter, statusFilter, navItems]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, page, pageSize]);

  // Selection handlers
  function toggleSelectAll() {
    if (selectedIds.size === filteredCourses.length && filteredCourses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCourses.map(c => c.id)));
    }
  }

  function toggleCourseSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Single Course Download with 12-Page AI Generator
  async function handleSingleDownload(course) {
    setDownloadingId(course.id);
    try {
      const fullCourse = await getFullCourseData(course);
      await generate12PageCourseBrochurePDF(fullCourse, siteSettings);
    } catch (err) {
      console.error('Error generating brochure PDF:', err);
      alert('Failed to generate brochure PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  }

  // Batch Download selected courses
  async function handleBatchDownloadSelected() {
    const target = softwareCourses.filter(c => selectedIds.has(c.id));
    if (target.length === 0) {
      setOpenModal(true);
      return;
    }
    setBatchDownloading(true);
    try {
      for (const c of target) {
        const fullCourse = await getFullCourseData(c);
        await generate12PageCourseBrochurePDF(fullCourse, siteSettings);
      }
    } catch (err) {
      console.error('Batch download error:', err);
      alert('Failed to generate brochure PDFs: ' + (err.message || 'Unknown error'));
    } finally {
      setBatchDownloading(false);
    }
  }

  const hasActiveFilters = activeSearch !== '' || subCategoryFilter !== 'All' || statusFilter !== 'All';

  function clearFilters() {
    setSearch('');
    setActiveSearch('');
    setSubCategoryFilter('All');
    setStatusFilter('All');
    setPage(1);
  }

  return (
    <PageShell
      backTo="/admin"
      title="Software Course Brochures"
      subtitle="Download official PDF brochures with Marvel Slice Institute branding & structured curriculum"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchDownloadSelected}
            disabled={loading || batchDownloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-admin-600 hover:bg-admin-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {batchDownloading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Generating PDFs...</span>
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                <span>
                  {selectedIds.size > 0
                    ? `Batch Download PDF (${selectedIds.size})`
                    : 'Batch Download PDF'}
                </span>
              </>
            )}
          </button>

          <Link
            to="/admin/ai-settings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-admin-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-slate-50 transition-all shadow-xs"
            title="Configure AI API keys, models & auto-routing"
          >
            <FiCpu className="w-4 h-4 text-purple-600" />
            <span>AI Config</span>
          </Link>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-admin-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh courses"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      {/* Top Search & Filter Bar (Submissions Style) */}
      <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setActiveSearch(search);
                    setPage(1);
                  }
                }}
                placeholder="Search software courses by title, slug or topic..."
                className="w-full h-9 pl-9 pr-8 border border-admin-200 rounded-lg bg-white text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setActiveSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSearch(search);
                setPage(1);
              }}
              className="h-9 px-4 bg-admin-600 text-white text-xs font-semibold rounded-lg hover:bg-admin-700 transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Subcategory & Status Dropdown Filters */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-3 justify-start md:justify-end">
            {/* Subcategory Filter */}
            <div className="min-w-[170px] flex-1 sm:flex-initial">
              <select
                value={subCategoryFilter}
                onChange={e => {
                  setSubCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 border border-admin-200 rounded-lg bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all cursor-pointer"
              >
                <option value="All">All Subcategories ({availableSubcategories.length})</option>
                {availableSubcategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[130px] flex-1 sm:flex-initial">
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 border border-admin-200 rounded-lg bg-white text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Coming Soon">Coming Soon</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-admin-200">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading software courses &amp; AI brochures...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-admin-200 shadow-xs">
          <FiBook className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-900 mb-1">No Software Courses Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? 'No courses match your active search or filters. Try clearing the filters.'
              : 'There are no software courses registered under Marvel Slice Academy.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-admin-600 text-white text-xs font-semibold rounded-lg hover:bg-admin-700"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-admin-200 rounded-xl shadow-xs overflow-hidden">
          {/* Header Action Bar */}
          <div className="px-5 py-3.5 border-b border-admin-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedIds.size === filteredCourses.length && filteredCourses.length > 0
                    ? 'bg-admin-600 border-admin-600 text-white'
                    : selectedIds.size > 0
                    ? 'bg-admin-100 border-admin-400 text-admin-700'
                    : 'border-admin-300 bg-white'
                }`}>
                  {selectedIds.size === filteredCourses.length && filteredCourses.length > 0 ? (
                    <FiCheck className="w-3 h-3 stroke-[3]" />
                  ) : selectedIds.size > 0 ? (
                    <div className="w-1.5 h-1.5 bg-admin-700 rounded-xs" />
                  ) : null}
                </div>
                <span>Select All ({filteredCourses.length})</span>
              </button>

              {selectedIds.size > 0 && (
                <span className="text-xs font-bold text-admin-600 bg-admin-50 px-2.5 py-0.5 rounded-full border border-admin-200">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            <span className="text-xs text-neutral-400 font-medium">
              Showing {Math.min((page - 1) * pageSize + 1, filteredCourses.length)} - {Math.min(page * pageSize, filteredCourses.length)} of {filteredCourses.length}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-admin-100 bg-white text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">#</th>
                  <th className="py-3.5 px-4">Software Course</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Subcategory</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Duration &amp; Mode</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Brochure PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-100 text-sm">
                {paginatedCourses.map((course) => {
                  const isSelected = selectedIds.has(course.id);
                  const subCategory = getSubcategory(course.nav_item_id);
                  const isDownloading = downloadingId === course.id;

                  return (
                    <tr
                      key={course.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCourseSelect(course.id)}
                          className="p-1 rounded cursor-pointer"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-brand-orange border-brand-orange text-white'
                              : 'border-admin-300 bg-white hover:border-admin-400'
                          }`}>
                            {isSelected && <FiCheck className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      </td>

                      {/* Course Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
                            <FiBook className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-sm">{course.title}</p>
                            <p className="text-xs text-neutral-400 truncate max-w-xs">{course.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subcategory */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-100">
                          {subCategory}
                        </span>
                      </td>

                      {/* Duration & Mode */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-neutral-600 text-xs font-medium">
                        {course.duration || '3 months'} • {course.mode || 'Online'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-xs">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          course.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {course.status || 'Active'}
                        </span>
                      </td>

                      {/* Action: Download Button */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleSingleDownload(course)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                          title="Generate and download official course brochure PDF"
                        >
                          {isDownloading ? (
                            <>
                              <FiLoader className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <FiDownload className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-3.5 border-t border-admin-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-admin-200 rounded-md bg-white text-xs text-neutral-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md border border-admin-200 bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                if (totalPages > 7) {
                  if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="px-1 text-xs text-neutral-400">...</span>;
                    }
                    return null;
                  }
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      p === page
                        ? 'bg-admin-600 text-white'
                        : 'bg-white border border-admin-200 text-neutral-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-admin-200 bg-white text-neutral-600 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Download Selection Modal */}
      {openModal && (
        <BatchSelectionModal
          courses={softwareCourses}
          navItems={navItems}
          siteSettings={siteSettings}
          getSubcategory={getSubcategory}
          onClose={() => setOpenModal(false)}
        />
      )}
    </PageShell>
  );
}

function BatchSelectionModal({ courses, siteSettings, getSubcategory, onClose }) {
  const [selected, setSelected] = useState(new Set(courses.map(c => c.id)));
  const [modalSearch, setModalSearch] = useState('');
  const [modalCat, setModalCat] = useState('All');
  const [generating, setGenerating] = useState(false);

  const subCategories = useMemo(() => {
    const s = new Set();
    courses.forEach(c => {
      const sub = getSubcategory(c.nav_item_id);
      if (sub) s.add(sub);
    });
    return Array.from(s).sort();
  }, [courses, getSubcategory]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (modalCat !== 'All' && getSubcategory(c.nav_item_id) !== modalCat) return false;
      if (modalSearch) {
        const q = modalSearch.toLowerCase();
        return (c.title || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [courses, modalSearch, modalCat, getSubcategory]);

  function toggleCourse(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  }

  async function handleGenerate() {
    const target = courses.filter(c => selected.has(c.id));
    if (target.length === 0) {
      alert('Please select at least one course.');
      return;
    }
    setGenerating(true);
    try {
      for (const c of target) {
        const fullCourse = await getFullCourseData(c);
        await generate12PageCourseBrochurePDF(fullCourse, siteSettings);
      }
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-admin-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-admin-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <HiSparkles className="w-5 h-5 text-brand-orange" />
              Batch Download 12-Page Brochures
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select which software courses you want to generate individual 12-page brochures for
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-admin-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              placeholder="Search courses in modal..."
              className="w-full h-8 pl-8 pr-3 border border-admin-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-admin-500"
            />
          </div>

          <select
            value={modalCat}
            onChange={e => setModalCat(e.target.value)}
            className="h-8 px-2.5 border border-admin-200 rounded-lg text-xs bg-white text-neutral-700 cursor-pointer"
          >
            <option value="All">All Subcategories</option>
            {subCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-semibold text-admin-600 hover:underline cursor-pointer"
          >
            {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Scrollable Course List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-admin-100">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-neutral-400 font-medium">No courses match your filter.</p>
          ) : (
            filtered.map(c => {
              const isChecked = selected.has(c.id);
              const sub = getSubcategory(c.nav_item_id);

              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourse(c.id)}
                  className={`py-3 px-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isChecked ? 'bg-orange-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'border-admin-300 bg-white'
                    }`}>
                      {isChecked && <FiCheck className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{c.title}</p>
                      <p className="text-[11px] text-neutral-500">{sub} • {c.duration || '3 months'}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-100 shrink-0">
                    {c.status || 'Active'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-admin-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-700">
            {selected.size} of {courses.length} courses selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="px-4 py-2 border border-admin-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {generating ? (
                <>
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDFs...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download Selected PDFs ({selected.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
