import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import {
  FiDownload, FiLoader, FiCheck, FiSearch, FiFileText,
  FiRefreshCw, FiCpu, FiCheckSquare, FiSquare, FiBook,
  FiArrowLeft, FiArrowRight, FiImage,
} from 'react-icons/fi';
import { generateModernCourseBrochurePDF } from '../../lib/brochureTemplateV2';
import { extractDocFileText, condenseDocToOneLiners } from '../../lib/brochureAIService';
import { DEFAULT_PATH_STEPS } from '../../lib/brochureExpand';

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

const WIZARD_STEPS = ['Upload doc + Images', 'Courses & Background', 'Learning Path & Download'];

export default function CourseBrochure() {
  const [courses, setCourses] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wizard page: 1 = upload, 2 = courses + background, 3 = learning path + download
  const [step, setStep] = useState(1);

  // Step 1: doc upload (AI condensed, falls back to local splitter)
  // + 2 background images (cover art + inner art, defaults = template art)
  const [docSections, setDocSections] = useState([]);
  const [docFileName, setDocFileName] = useState('');
  const [docProcessing, setDocProcessing] = useState(false);
  const [docError, setDocError] = useState('');
  const [pageImage, setPageImage] = useState(null);
  const [pageImageName, setPageImageName] = useState('');
  const [pathImage, setPathImage] = useState(null);
  const [pathImageName, setPathImageName] = useState('');

  // Step 2: course selection + background choice
  const [downloadCourseId, setDownloadCourseId] = useState('');
  const [otherCourseIds, setOtherCourseIds] = useState(new Set());
  const [otherSearch, setOtherSearch] = useState('');
  const [bgStyle, setBgStyle] = useState('template'); // 'template' | 'plain' | 'custom'
  const [customCoverBg, setCustomCoverBg] = useState(null);
  const [customCoverBgName, setCustomCoverBgName] = useState('');
  const [customInnerBg, setCustomInnerBg] = useState(null);
  const [customInnerBgName, setCustomInnerBgName] = useState('');

  // Step 3: learning path is auto-shown (from uploaded doc, else defaults)
  const autoPathSteps = useMemo(() => {
    if (docSections.length) {
      return docSections.slice(0, 15).map((s) => [
        String(s.title || '').trim(),
        String((s.lines || [])[0] || '').trim(),
      ]).filter(([t]) => t);
    }
    return DEFAULT_PATH_STEPS;
  }, [docSections]);

  // Step 3: single merged download
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
      else if (next.size < 13) next.add(id);
      return next;
    });
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error('Could not read image file.'));
      fr.readAsDataURL(file);
    });
  }

  async function handleBgFile(which, file) {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      if (which === 'page') { setPageImage(dataUrl); setPageImageName(file.name); }
      else { setPathImage(dataUrl); setPathImageName(file.name); }
    } catch (err) {
      console.error('BG image error:', err);
      alert('Could not read that image. Try a JPG or PNG file.');
    }
  }

  async function handleCustomBg(which, file) {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      if (which === 'cover') { setCustomCoverBg(dataUrl); setCustomCoverBgName(file.name); }
      else { setCustomInnerBg(dataUrl); setCustomInnerBgName(file.name); }
    } catch (err) {
      console.error('BG image error:', err);
      alert('Could not read that image. Try a JPG or PNG file.');
    }
  }

  function buildBrochureOptions() {
    const others = otherCoursesPicked
      .slice(0, 13)
      .map((c) => ({ title: c.title, duration: c.duration, mode: c.mode }));
    return { docSections, otherCourses: others, bgStyle, pathSteps: autoPathSteps, coverImage: pageImage, pathImage, customCoverBg, customInnerBg };
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

  // Merged download: doc syllabus + courses + background + user path steps
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
      subtitle="Upload a doc, pick courses & background, set the learning path, then merge & download"
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
          {/* Wizard progress */}
          <div className="flex items-center gap-2 bg-white border border-admin-200 rounded-xl px-4 py-3 shadow-xs">
            {WIZARD_STEPS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => setStep(n)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${active ? 'bg-brand-orange text-white shadow-xs' : done ? 'text-emerald-700 bg-emerald-50' : 'text-neutral-500 hover:bg-slate-100'}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-white/25' : done ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                      {done ? <FiCheck className="w-3 h-3" /> : n}
                    </span>
                    {label}
                  </button>
                  {n < WIZARD_STEPS.length && <span className="hidden sm:block flex-1 h-px bg-admin-200" />}
                </div>
              );
            })}
          </div>

          {/* ── PAGE 1: upload only ── */}
          {step === 1 && (
            <div className="bg-white border border-admin-200 rounded-xl p-6 sm:p-10 shadow-xs text-center max-w-2xl mx-auto">
              <span className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mb-4">
                <FiFileText className="w-7 h-7" />
              </span>
              <h3 className="text-base font-extrabold text-neutral-900">Upload your course document</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-5">.docx / .pdf / .txt — AI condenses it into brochure-ready syllabus sections.</p>
              <label className="inline-flex h-11 px-8 items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-sm font-bold cursor-pointer shadow-xs transition-all">
                <FiFileText className="w-4 h-4" />
                {docProcessing ? 'Processing...' : docFileName || 'Choose doc file'}
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  disabled={docProcessing}
                  onChange={(e) => handleDocFile(e.target.files?.[0])}
                />
              </label>
              {docProcessing && (
                <p className="text-[11px] text-neutral-500 mt-3 flex items-center justify-center gap-1.5">
                  <FiLoader className="w-3.5 h-3.5 animate-spin" /> Extracting + AI condensing...
                </p>
              )}
              {docError && <p className="text-[11px] text-red-600 mt-3 font-medium">{docError}</p>}
              {docSections.length > 0 && !docProcessing && (
                <div className="mt-4 text-left text-[11px] text-neutral-600 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
                  <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <FiCheck className="w-3.5 h-3.5" /> {docSections.length} sections ready from {docFileName}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 max-h-28 overflow-y-auto">
                    {docSections.map((s, i) => (
                      <li key={i} className="truncate">• {s.title} ({s.lines.length} lines)</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => { setDocSections([]); setDocFileName(''); setDocError(''); }}
                    className="mt-2 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                  >
                    Remove file
                  </button>
                </div>
              )}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  { label: 'Image 1 — full first page (replaces cover, no headings)', img: pageImage, name: pageImageName, set: 'page' },
                  { label: 'Image 2 — full path page (replaces learning path)', img: pathImage, name: pathImageName, set: 'path' },
                ].map((b) => (
                  <div key={b.set} className="rounded-xl border border-admin-200 overflow-hidden bg-white">
                    {b.img ? (
                      <img src={b.img} alt={b.label} className="w-full h-44 object-cover object-top" />
                    ) : (
                      <span className="flex flex-col items-center justify-center gap-1.5 w-full h-44 bg-slate-50 text-neutral-400">
                        <FiImage className="w-7 h-7" />
                        <span className="text-[11px] font-medium px-4 text-center">No image — designed page will be used</span>
                      </span>
                    )}
                    <div className="p-3">
                      <p className="text-[11px] font-bold text-neutral-700">{b.label}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{b.name || 'Not uploaded'}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="inline-flex h-8 px-3 items-center gap-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-neutral-700 cursor-pointer">
                          <FiImage className="w-3.5 h-3.5" /> Upload image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleBgFile(b.set, e.target.files?.[0])}
                          />
                        </label>
                        {b.img && (
                          <button
                            type="button"
                            onClick={() => (b.set === 'page' ? (setPageImage(null), setPageImageName('')) : (setPathImage(null), setPathImageName('')))}
                            className="h-8 px-3 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={docProcessing}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-admin-800 hover:bg-admin-900 text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continue <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── PAGE 2: courses + background ── */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 shadow-xs">
                <p className="text-xs font-bold text-neutral-800 mb-1">Main course (cover)</p>
                <select
                  value={downloadCourseId}
                  onChange={(e) => setDownloadCourseId(e.target.value)}
                  className="w-full h-10 px-3 border border-admin-200 rounded-lg bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all cursor-pointer mb-3"
                >
                  {softwareCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.duration || 'Flexible'} • {c.mode || 'Online'})
                    </option>
                  ))}
                </select>
                <p className="text-xs font-bold text-neutral-800 mb-1">Other courses (last page, {otherCourseIds.size}/13)</p>
                <div className="relative mb-2">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={otherSearch}
                    onChange={(e) => setOtherSearch(e.target.value)}
                    placeholder="Search to pick..."
                    className="w-full h-9 pl-8 pr-3 border border-admin-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-1 focus:ring-admin-500"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-admin-100 bg-white border border-admin-100 rounded-lg">
                  {softwareCourses
                    .filter((c) => c.id !== downloadCourseId)
                    .filter((c) => !otherSearch || (c.title || '').toLowerCase().includes(otherSearch.toLowerCase()))
                    .slice(0, 30)
                    .map((c) => {
                      const checked = otherCourseIds.has(c.id);
                      const full = otherCourseIds.size >= 13 && !checked;
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
              </div>

              <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 shadow-xs">
                <p className="text-xs font-bold text-neutral-800 mb-1">Background (optional — change anytime)</p>
                <p className="text-[11px] text-neutral-500 mb-3">Template art is used on every page by default. Pick plain white, or upload your own backgrounds.</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBgStyle('template')}
                    className={`rounded-xl border-2 overflow-hidden text-left transition-all cursor-pointer ${bgStyle === 'template' ? 'border-brand-orange shadow-md' : 'border-admin-200 hover:border-admin-300'}`}
                  >
                    <img src="/brochure/bg-inner.jpg" alt="Template background" className="w-full h-20 object-cover object-top" />
                    <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-800">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${bgStyle === 'template' ? 'border-brand-orange' : 'border-slate-300'}`}>
                        {bgStyle === 'template' && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                      </span>
                      Template BG
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgStyle('plain')}
                    className={`rounded-xl border-2 overflow-hidden text-left transition-all cursor-pointer ${bgStyle === 'plain' ? 'border-brand-orange shadow-md' : 'border-admin-200 hover:border-admin-300'}`}
                  >
                    <span className="block w-full h-20 bg-white border-b border-admin-100" />
                    <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-800">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${bgStyle === 'plain' ? 'border-brand-orange' : 'border-slate-300'}`}>
                        {bgStyle === 'plain' && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                      </span>
                      Plain White
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgStyle('custom')}
                    className={`rounded-xl border-2 overflow-hidden text-left transition-all cursor-pointer ${bgStyle === 'custom' ? 'border-brand-orange shadow-md' : 'border-admin-200 hover:border-admin-300'}`}
                  >
                    <span className="flex items-center justify-center w-full h-20 bg-slate-50 border-b border-admin-100 text-neutral-400">
                      <FiImage className="w-6 h-6" />
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-800">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${bgStyle === 'custom' ? 'border-brand-orange' : 'border-slate-300'}`}>
                        {bgStyle === 'custom' && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                      </span>
                      Upload BG
                    </span>
                  </button>
                </div>
                {bgStyle === 'custom' && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Cover background', img: customCoverBg, name: customCoverBgName, which: 'cover' },
                      { label: 'Inner pages background', img: customInnerBg, name: customInnerBgName, which: 'inner' },
                    ].map((b) => (
                      <div key={b.which} className="rounded-xl border border-admin-100 overflow-hidden">
                        {b.img ? (
                          <img src={b.img} alt={b.label} className="w-full h-24 object-cover object-top" />
                        ) : (
                          <span className="flex items-center justify-center w-full h-24 bg-slate-50 text-neutral-400 text-[11px] font-medium">
                            No image — template art will be used
                          </span>
                        )}
                        <div className="flex items-center gap-2 p-2.5">
                          <label className="inline-flex h-8 px-3 items-center gap-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-neutral-700 cursor-pointer">
                            <FiImage className="w-3.5 h-3.5" /> {b.img ? 'Change' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCustomBg(b.which, e.target.files?.[0])}
                            />
                          </label>
                          <span className="text-[11px] text-neutral-500 truncate">{b.name || b.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-admin-200 bg-white text-neutral-700 text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-admin-800 hover:bg-admin-900 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  Continue <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── PAGE 3: learning path preview (auto) + merge & download ── */}
          {step === 3 && (
            <>
              <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 shadow-xs">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-neutral-900">Learning path — as it will print</h3>
                  <p className="text-[11px] text-neutral-500">
                    {pathImage
                      ? 'Your uploaded Image 2 replaces this page in full.'
                      : docSections.length > 0
                        ? 'Built automatically from your uploaded doc headings.'
                        : 'Default path shown — upload a doc in step 1 to derive it from your syllabus.'}
                  </p>
                </div>
                {pathImage ? (
                  <img src={pathImage} alt="Learning path page" className="w-full max-h-80 object-cover object-top rounded-xl border border-admin-100" />
                ) : (
                <ol className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {autoPathSteps.map(([t, d], i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl border border-admin-100 bg-slate-50/60 px-3 py-2">
                      <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-neutral-900">{t}</span>
                        {d ? <span className="block text-[11px] text-neutral-500">{d}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
                )}
              </div>

              <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-neutral-900 mb-1">Merge &amp; download</h3>
                  <p className="text-xs text-neutral-500">
                    {downloadCourse ? (
                      <>
                        <span className="font-bold text-neutral-800">{downloadCourse.title}</span>
                        {' '}• {docSections.length > 0 ? `${docSections.length} doc sections` : 'course modules'} • {otherCoursesPicked.length} other course{otherCoursesPicked.length === 1 ? '' : 's'} • {bgStyle === 'template' ? 'template BG' : bgStyle === 'plain' ? 'plain white' : `custom BG (${[customCoverBg, customInnerBg].filter(Boolean).length}/2 uploaded)`} • {pathImage ? 'custom path image' : `${autoPathSteps.length} path steps`}{pageImage ? ' • custom cover' : ''}
                      </>
                    ) : 'Select a main course in step 2 to enable download.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-admin-200 bg-white text-neutral-700 text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <FiArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBrochure}
                    disabled={!downloadCourse || downloading || docProcessing}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                    title="Merge everything and download the complete brochure PDF"
                  >
                    {downloading ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        <span>Merging...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload className="w-4 h-4" />
                        <span>Merge &amp; Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
