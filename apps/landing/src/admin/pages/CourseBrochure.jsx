import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import {
  FiDownload, FiLoader, FiCheck, FiSearch, FiFileText,
  FiRefreshCw, FiCpu, FiCheckSquare, FiSquare, FiBook
} from 'react-icons/fi';
import { generateModernCourseBrochurePDF } from '../../lib/brochureModernTemplate';
import { extractDocFileText, condenseDocToOneLiners } from '../../lib/brochureAIService';

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

  // Step 1: doc upload (AI condensed to 1-line bullets, max 25 pages)
  const [docSections, setDocSections] = useState([]);
  const [docFileName, setDocFileName] = useState('');
  const [docProcessing, setDocProcessing] = useState(false);
  const [docError, setDocError] = useState('');

  // Step 2: course selection - one main course + 5 other courses (manual)
  const [downloadCourseId, setDownloadCourseId] = useState('');
  const [otherCourseIds, setOtherCourseIds] = useState(new Set());
  const [otherSearch, setOtherSearch] = useState('');

  // Step 3: single download
  const [downloading, setDownloading] = useState(false);

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

  // Default the main course to the first available one
  useEffect(() => {
    if (!downloadCourseId && softwareCourses.length > 0) {
      setDownloadCourseId(softwareCourses[0].id);
    }
  }, [softwareCourses, downloadCourseId]);

  const downloadCourse = useMemo(
    () => softwareCourses.find(c => c.id === downloadCourseId) || null,
    [softwareCourses, downloadCourseId]
  );

  const otherCoursesPicked = useMemo(
    () => softwareCourses.filter(c => otherCourseIds.has(c.id) && c.id !== downloadCourseId),
    [softwareCourses, otherCourseIds, downloadCourseId]
  );

  function toggleOtherCourse(id) {
    setOtherCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  function buildBrochureOptions() {
    const others = otherCoursesPicked
      .slice(0, 5)
      .map((c) => ({ title: c.title, duration: c.duration, mode: c.mode }));
    return { docSections, otherCourses: others };
  }

  async function handleDocFile(file) {
    if (!file) return;
    setDocProcessing(true);
    setDocError('');
    try {
      const raw = await extractDocFileText(file);
      if (!raw || !raw.trim()) throw new Error('No readable text found in file.');
      const sections = await condenseDocToOneLiners(raw, downloadCourse?.title || '');
      if (!sections.length) throw new Error('AI could not condense this file.');
      setDocSections(sections);
      setDocFileName(file.name);
    } catch (err) {
      console.error('Doc condense error:', err);
      setDocError(err.message || 'Failed to process doc file.');
    } finally {
      setDocProcessing(false);
    }
  }

  // Single unified download: Cover > Intro > 5 courses > Doc pages > Company page
  async function handleDownloadBrochure() {
    if (!downloadCourse) {
      alert('Please select a course first.');
      return;
    }
    setDownloading(true);
    try {
      const fullCourse = await getFullCourseData(downloadCourse);
      await generateModernCourseBrochurePDF(fullCourse, siteSettings, buildBrochureOptions());
    } catch (err) {
      console.error('Error generating brochure PDF:', err);
      alert('Failed to generate brochure PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <PageShell
      backTo="/admin"
      title="Software Course Brochures"
      subtitle="Upload a doc, select courses, download the official PDF brochure"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-admin-200">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading software courses &amp; AI brochures...</p>
        </div>
      ) : softwareCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-admin-200 shadow-xs">
          <FiBook className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-900 mb-1">No Software Courses Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            There are no software courses registered under Marvel Slice Academy.
          </p>
        </div>
      ) : (
        <>
          {/* Steps 1 + 2 */}
          <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Create brochure in 3 steps</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Flow: Cover &gt; About + Highlights &gt; Who Can Apply &gt; Curriculum (2-column modules) &gt; Contact + Parent company &gt; Related courses (last page).
              Total brochure capped at 30 pages.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Step 1: Doc upload */}
              <div className="border border-admin-100 rounded-lg p-3.5 bg-slate-50/50">
                <p className="text-xs font-bold text-neutral-800 mb-1">1. Upload course doc (.docx / .pdf / .txt)</p>
                <p className="text-[11px] text-neutral-500 mb-2.5">AI condenses verbose paras into detailed lines (~20 words), packed 2-column like a professional brochure.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="h-9 px-4 inline-flex items-center gap-1.5 bg-white border border-admin-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-slate-100 cursor-pointer">
                    <FiFileText className="w-4 h-4 text-brand-orange" />
                    {docProcessing ? 'Processing...' : docFileName || 'Choose doc file'}
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      className="hidden"
                      disabled={docProcessing}
                      onChange={(e) => handleDocFile(e.target.files?.[0])}
                    />
                  </label>
                  {docSections.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setDocSections([]); setDocFileName(''); setDocError(''); }}
                      className="h-9 px-3 text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {docProcessing && (
                  <p className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1.5">
                    <FiLoader className="w-3.5 h-3.5 animate-spin" /> Extracting + AI condensing...
                  </p>
                )}
                {docError && <p className="text-[11px] text-red-600 mt-2 font-medium">{docError}</p>}
                {docSections.length > 0 && !docProcessing && (
                  <div className="mt-2.5 text-[11px] text-neutral-600">
                    <p className="font-bold text-emerald-700 flex items-center gap-1">
                      <FiCheck className="w-3.5 h-3.5" /> {docSections.length} pages ready from {docFileName}
                    </p>
                    <ul className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                      {docSections.map((s, i) => (
                        <li key={i} className="truncate">• {s.title} ({s.lines.length} lines)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Step 2: Select courses */}
              <div className="border border-admin-100 rounded-lg p-3.5 bg-slate-50/50">
                <p className="text-xs font-bold text-neutral-800 mb-1">2. Select courses</p>
                <p className="text-[11px] text-neutral-500 mb-2.5">
                  Main course goes on the cover. 5 others appear on the last page after company details. ({otherCourseIds.size}/5 selected)
                </p>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Main course (cover)</label>
                <select
                  value={downloadCourseId}
                  onChange={(e) => setDownloadCourseId(e.target.value)}
                  className="w-full h-9 px-3 border border-admin-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all cursor-pointer mb-2.5"
                >
                  {softwareCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.duration || 'Flexible'} • {c.mode || 'Online'})
                    </option>
                  ))}
                </select>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">5 other courses (page 3)</label>
                <div className="relative mb-2">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={otherSearch}
                    onChange={(e) => setOtherSearch(e.target.value)}
                    placeholder="Search to pick..."
                    className="w-full h-8 pl-8 pr-3 border border-admin-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-1 focus:ring-admin-500"
                  />
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-admin-100 bg-white border border-admin-100 rounded-lg">
                  {softwareCourses
                    .filter((c) => c.id !== downloadCourseId)
                    .filter((c) => !otherSearch || (c.title || '').toLowerCase().includes(otherSearch.toLowerCase()))
                    .slice(0, 30)
                    .map((c) => {
                      const checked = otherCourseIds.has(c.id);
                      const full = otherCourseIds.size >= 5 && !checked;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={full}
                          onClick={() => toggleOtherCourse(c.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-50 disabled:opacity-40 cursor-pointer ${checked ? 'bg-orange-50/60 font-bold' : ''}`}
                        >
                          {checked ? <FiCheckSquare className="w-3.5 h-3.5 text-brand-orange shrink-0" /> : <FiSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                          <span className="truncate">{c.title}</span>
                        </button>
                      );
                    })}
                </div>
                {otherCourseIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setOtherCourseIds(new Set())}
                    className="mt-1.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Download */}
          <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">3. Download brochure</h3>
              <p className="text-xs text-neutral-500">
                {downloadCourse ? (
                  <>
                    <span className="font-bold text-neutral-800">{downloadCourse.title}</span>
                    {' '}• {docSections.length > 0 ? `${docSections.length} doc pages` : 'no doc uploaded (uses course modules)'} • {otherCoursesPicked.length} other course{otherCoursesPicked.length === 1 ? '' : 's'} • company page included
                  </>
                ) : 'Select a main course above to enable download.'}
              </p>
              {docSections.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1 font-medium">Tip: upload the course doc in step 1 for full syllabus pages.</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadBrochure}
              disabled={!downloadCourse || downloading || docProcessing}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
              title="Generate and download the complete brochure PDF"
            >
              {downloading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  <span>Download Brochure PDF</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}
