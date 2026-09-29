import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import {
  FiDownload, FiBookOpen, FiCheck, FiClock, FiUsers,
  FiAward, FiBriefcase, FiMail, FiPhone, FiGlobe, FiLayers,
  FiZap, FiCode, FiDatabase, FiTarget,
} from 'react-icons/fi';
import { LOCAL_SYLLABUS } from '../../data/localSyllabus';
import {
  toolsForTitle, rolesFor,
  projectsFor, outcomesFor, normalizeModuleCount,
} from '../../lib/brochureExpand';

/**
 * Admin-only brochure designer + preview + normal-PDF download.
 *
 * Route: /admin/courses/brochure-designer (behind ProtectedRoute in Admin.jsx,
 * so only signed-in admins can open it — never linked from the public site).
 *
 * Data source (verified against marvelslice.com):
 *   1. Live Supabase `courses` + relations (highlights, modules, projects,
 *      certifications, faqs, course_tabs) — same data that powers /courses/:slug.
 *   2. Offline fallback: parsed *.docx syllabi from
 *      /home/lethin/Downloads/courses-sylabus (see src/data/localSyllabus.js).
 *
 * Download = normal browser PDF: a clean print window with only the
 * brochure markup + stylesheets, so all sections paginate onto A4 pages
 * with exact brand colors (in-place window.print() as fallback).
 */

const BRAND = {
  orange: '#f59e0b',
  orangeDark: '#d97706',
  blue: '#175cdd',
  navy: '#0C1028',
  deepNavy: '#1B3A6B',
  green: '#74a916',
  purple: '#7c3aed',
  sky: '#eff6ff',
};

const SECTIONS = [
  { id: 'cover', label: '1. Cover' },
  { id: 'about', label: '2. About + Highlights' },
  { id: 'apply', label: '3. Who Can Apply' },
  { id: 'path', label: '4. Learning Path' },
  { id: 'curriculum', label: '5. Curriculum' },
  { id: 'skills', label: '6. Skills + Projects' },
  { id: 'career', label: '7. Careers' },
  { id: 'contact', label: '8. Contact' },
  { id: 'courses', label: '9. Our Courses' },
];

function asList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
}

function labelOf(h) {
  if (!h) return '';
  if (typeof h === 'string') return h;
  return h.label || h.title || h.text || '';
}

function chunk(arr, size) {
  const list = arr || [];
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function fetchFullCourse(id) {
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
  if (!course) return null;
  const [hi, mods, projs, certs, faqs, tabs, checklist] = await Promise.allSettled([
    supabase.from('highlights').select('*').eq('course_id', id).order('sort_order'),
    supabase.from('modules').select('*').eq('course_id', id).order('sort_order'),
    supabase.from('projects').select('*').eq('course_id', id).order('sort_order').limit(10),
    supabase.from('certifications').select('*').eq('course_id', id).limit(4),
    supabase.from('faqs').select('*').eq('course_id', id).order('sort_order').limit(8),
    supabase.from('course_tabs').select('*').eq('course_id', id).order('sort_order').limit(6),
    supabase.from('checklist_items').select('*').eq('course_id', id).order('sort_order'),
  ]);
  const val = (r) => (r.status === 'fulfilled' ? (r.value.data || []) : []);
  return {
    ...course,
    highlights: val(hi),
    modules: val(mods),
    projects: val(projs),
    certifications: val(certs),
    faqs: val(faqs),
    course_tabs: val(tabs),
    checklist_items: val(checklist),
  };
}

function skillsForCourse(course, modules) {
  const fromCerts = asList(course?.certifications?.[0]?.skills_earned);
  if (fromCerts.length) return fromCerts.slice(0, 12);
  const uniq = [];
  const seen = new Set();
  modules.forEach((m) => {
    (m.topics || []).forEach((t) => {
      const key = String(t).split(' ').slice(0, 2).join(' ').toLowerCase();
      if (!seen.has(key) && t.length > 3 && t.length < 42) {
        seen.add(key);
        uniq.push(t);
      }
    });
  });
  return uniq.slice(0, 12);
}

function toolsForCourse(course) {
  const techs = (course?.projects || []).flatMap((p) => asList(p.technologies));
  const base = ['Git & GitHub', 'VS Code', 'Postman', 'Linux Basics', 'Docker Basics'];
  const merged = [...new Set([...techs, ...base])];
  return merged.slice(0, 12);
}

function prettyTitleFromFile(file) {
  const base = String(file || '').replace(/\.docx$/i, '');
  const key = base.toLowerCase();
  const MAP = [
    [/aiml/, 'AI & Machine Learning'],
    [/generative\s*ai/, 'Generative AI'],
    [/data\s*science/, 'Data Science'],
    [/angular/, 'Angular Development'],
    [/front.?end/, 'Front-End Development'],
    [/html.*css|css.*html/, 'HTML & CSS Development'],
    [/java.*full.?stack|full.?stack.*java/, 'Java Full Stack Development'],
    [/python.*full.?stack|full.?stack.*python/, 'Python Full Stack Development'],
    [/node/, 'Node.js Development'],
    [/php/, 'PHP Development'],
    [/python/, 'Python Development'],
    [/react/, 'React JS Development'],
    [/\bux\b|ui.?ux/, 'UI/UX Design'],
    [/wordpress/, 'WordPress Development'],
  ];
  for (const [re, name] of MAP) {
    if (re.test(key)) return name;
  }
  return base
    .replace(/[_(]+1\)?/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Offline fallback: synthesize a course object from a local docx syllabus
 *  so the brochure preview + PDF work even when Supabase has no courses. */
function synthesizeLocalCourse(localDoc) {
  if (!localDoc) return null;
  const title = prettyTitleFromFile(localDoc.file);
  return {
    id: `local:${localDoc.file}`,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    subtitle: `${title} — complete career program with hands-on projects`,
    description: `${title} at Marvel Slice takes you from fundamentals to job-ready projects with mentor-led training, live labs and portfolio building.`,
    duration: 'Flexible duration',
    mode: 'Online / Classroom',
    category: 'Software Learning',
    highlights: [],
    modules: [],
    projects: [],
    certifications: [],
    faqs: [],
    course_tabs: [],
    checklist_items: [],
    _local: true,
  };
}

export default function BrochureDesigner() {
  // Static-first: the 14 offline syllabi ARE the course list — each gets its
  // own preview page + download. Live Supabase data only enriches when found.
  const [siteSettings, setSiteSettings] = useState(null);
  const [live, setLive] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [syllabusKey, setSyllabusKey] = useState(
    () => LOCAL_SYLLABUS[0]?.file || '',
  );

  // Best-effort site settings (contact block). Never blocks preview.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*').maybeSingle();
        if (!cancelled && data) setSiteSettings(data);
      } catch { /* offline defaults apply */ }
      try {
        const { data, error } = await supabase.from('courses').select('id').limit(1);
        if (!cancelled && !error) setLiveCount(Array.isArray(data) ? data.length : null);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Best-effort live enrichment: match Supabase course by slug/title.
  // Preview renders from the offline docx regardless — this never gates it.
  useEffect(() => {
    const doc = LOCAL_SYLLABUS.find((s) => s.file === syllabusKey);
    if (!doc) { setLive(null); return; }
    const slug = prettyTitleFromFile(doc.file).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let cancelled = false;
    (async () => {
      setEnriching(true);
      try {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .or(`slug.eq.${slug},slug.ilike.%${slug.split('-')[0]}%`)
          .limit(1)
          .maybeSingle();
        if (!cancelled && data?.id) {
          const fullData = await fetchFullCourse(data.id);
          if (!cancelled) setLive(fullData || data);
        } else if (!cancelled) {
          setLive(null);
        }
      } catch {
        if (!cancelled) setLive(null);
      } finally {
        if (!cancelled) setEnriching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [syllabusKey]);

  const localDoc = useMemo(
    () => LOCAL_SYLLABUS.find((s) => s.file === syllabusKey) || null,
    [syllabusKey],
  );

  // Effective course: live Supabase record enriches when found; otherwise
  // the selected offline docx alone drives the preview + PDF.
  const effectiveCourse = useMemo(() => {
    if (!live) return synthesizeLocalCourse(localDoc);
    const local = synthesizeLocalCourse(localDoc);
    return {
      ...local,
      ...live,
      title: live.title || local?.title,
      subtitle: live.subtitle || local?.subtitle,
      description: live.description || local?.description,
      duration: live.duration || local?.duration,
      mode: live.mode || local?.mode,
      category: live.category || local?.category,
    };
  }, [live, localDoc]);

  // Curriculum: live DB modules win; otherwise local docx modules.
  // Count is normalized to full pages (exactly 12 or 16 modules).
  const curriculum = useMemo(() => {
    const dbMods = asList(live?.modules)
      .map((m, i) => ({
        label: `Module ${i + 1}`,
        title: m.title || m.name || `Part ${i + 1}`,
        topics: asList(m.topics || m.lessons || m.content).slice(0, 10),
      }))
      .filter((m) => m.topics.length || m.title);
    if (dbMods.length >= 2) return normalizeModuleCount(dbMods);
    if (localDoc) {
      return normalizeModuleCount(localDoc.modules
        .filter((m) => m.no > 0)
        .map((m, i) => ({ label: `Module ${i + 1}`, title: m.title, topics: m.topics.slice(0, 10) })));
    }
    return normalizeModuleCount(dbMods);
  }, [live, localDoc]);

  const highlights = useMemo(() => {
    const h = asList(effectiveCourse?.highlights).map(labelOf).filter(Boolean);
    if (h.length) return h.slice(0, 10);
    return [
      'Hands-on live training with real-world projects',
      '1:1 mentorship and doubt-clearing support',
      'Career guidance, resume review & mock interviews',
      'Flexible online / classroom batches with LMS access',
    ];
  }, [effectiveCourse]);

  const contact = {
    phone: siteSettings?.contact_phone || '+91 63809 57390 / +91 80882 18609',
    email: siteSettings?.contact_email || 'sales@marvelslice.com',
    website: siteSettings?.social_links?.website || siteSettings?.website || 'www.marvelslice.com',
    address: siteSettings?.address || 'Marvel Slice — Institute for Software Learning, Chennai, Tamil Nadu, India',
  };

  const title = effectiveCourse?.title || 'Professional Course';
  const duration = effectiveCourse?.duration || 'Flexible duration';
  const mode = effectiveCourse?.mode || 'Online / Classroom';
  const category = effectiveCourse?.category || 'Software Learning';

  const skills = useMemo(() => skillsForCourse(effectiveCourse, curriculum), [effectiveCourse, curriculum]);
  const tools = useMemo(() => toolsForTitle(title, toolsForCourse(effectiveCourse)), [title, effectiveCourse]);
  const projects = useMemo(() => asList(effectiveCourse?.projects), [effectiveCourse]);
  const expandedProjects = useMemo(() => {
    if (projects.length) {
      return projects.slice(0, 4).map((p, i) => ({
        level: ['Beginner', 'Intermediate', 'Advanced'][Math.min(2, Math.floor((i / Math.max(1, projects.length)) * 3))],
        title: p.title || 'Project',
        desc: p.description || 'Build and deploy a portfolio-ready application.',
        tech: asList(p.technologies).join(', '),
      }));
    }
    return projectsFor(title, curriculum);
  }, [projects, title, curriculum]);
  const roles = useMemo(() => rolesFor(title), [title]);
  const outcomes = useMemo(() => outcomesFor(title, curriculum), [title, curriculum]);
  const totalTopics = useMemo(
    () => curriculum.reduce((n, m) => n + (m.topics || []).length, 0),
    [curriculum],
  );
  const canPreview = Boolean(effectiveCourse && curriculum.length);

  function handlePrint() {
    const node = document.getElementById('brochure-print-root');
    const pdfTitle = `Marvel Slice — ${title} Brochure`;
    // Primary: open a clean print window with ONLY the brochure markup +
    // all current stylesheets, so every section paginates onto normal A4
    // pages with exact brand colors (no admin shell, no clipping).
    try {
      const win = window.open('', '_blank', 'width=1100,height=850');
      if (win && node) {
        const styles = Array.from(
          document.querySelectorAll('style, link[rel="stylesheet"]'),
        )
          .map((el) => el.outerHTML)
          .join('\n');
        win.document.write(
          `<!doctype html><html><head><title>${pdfTitle}</title>${styles}<style>` +
            `@page{size:A4;margin:0}` +
            `html,body{background:#fff !important;margin:0 !important;padding:0 !important}` +
            `body{font-family:Montserrat,Arial,sans-serif;margin:0 !important;padding:0 !important}` +
            `*{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }` +
            `#brochure-print-root{width:210mm !important;max-width:210mm !important;margin:0 !important;padding:0 !important}` +
            `#brochure-print-root.space-y-4 > * + *{margin-top:0 !important}` +
            `.brochure-page{box-shadow:none !important;border:none !important;border-radius:0 !important;` +
            `width:210mm !important;max-width:210mm !important;min-height:296mm !important;` +
            `margin:0 !important;padding:11mm 10mm !important;` +
            `background-size:210mm 297mm !important;background-position:top center !important;background-repeat:no-repeat !important;` +
            `break-before:page;break-inside:avoid-page}` +
            `.brochure-page:first-child{break-before:auto}` +
            `.brochure-page-cover{min-height:296mm !important;padding:64mm 10mm 10mm !important}` +
            `.brochure-page-inner{padding:42mm 10mm 12mm !important}` +
            `.brochure-page.allow-break{break-inside:auto;box-decoration-break:clone;-webkit-box-decoration-break:clone}` +
            `#brochure-print-root .allow-break li{break-inside:avoid-page}` +
            `#brochure-print-root #bro-curriculum div[class*="grid"] > div,` +
            `#brochure-print-root #bro-projects div[class*="grid"] > div,` +
            `#brochure-print-root #bro-career div[class*="space-y"] > div,` +
            `          #brochure-print-root #bro-career div[class*="grid"] > div{break-inside:avoid-page}
          #brochure-print-root #bro-skills div[class*="sm:grid-cols-2"]{break-inside:avoid-page}` +
            `.brochure-page:not(.allow-break){overflow:hidden !important}` +
            `</style></head><body>${node.outerHTML}` +
            `<script>window.onload=function(){setTimeout(function(){window.print()},450)};` +
            `window.onafterprint=function(){window.close()}</script></body></html>`,
        );
        win.document.close();
        return;
      }
    } catch { /* fall through to in-place print */ }
    // Fallback: in-place print (fixed CSS below keeps all pages flowing).
    document.title = pdfTitle;
    window.print();
  }

  return (
    <PageShell
      backTo="/admin/courses/brochure"
      title="Brochure Designer"
      subtitle="Admin-only static preview — 14 courses, 10 designs each, expanded to up to 15 A4 pages. Pick a course, preview it, download a normal PDF."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!canPreview}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}
          >
            <FiDownload className="w-4 h-4" /> Download {title} PDF
          </button>
        </div>
      }
    >
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        /* Real template backgrounds (A4-ratio JPGs). Screen: natural aspect,
           top-aligned so art never stretches. Print CSS below sizes them exact. */
        #brochure-print-root .brochure-page-cover { background-image: url(/brochure/bg-cover.jpg); background-size: cover; background-position: top center; background-repeat: no-repeat; }
        #brochure-print-root .brochure-page-inner { background-image: url(/brochure/bg-inner.jpg); background-size: cover; background-position: top center; background-repeat: no-repeat; }
        /* Screen preview: clear the baked header/logo zones (print CSS below sets exact mm) */
        #brochure-print-root .brochure-page-inner { padding-top: 12%; }
        @media print {
          @page { size: A4; margin: 0; }
          html, body, #root { height: auto !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
          aside, header { display: none !important; }
          div.h-screen { height: auto !important; overflow: visible !important; }
          main { overflow: visible !important; height: auto !important; padding: 0 !important; }
          .no-print { display: none !important; }
          #brochure-print-root {
            width: 210mm !important; max-width: 210mm !important;
            margin: 0 !important; padding: 0 !important;
          }
          #brochure-print-root.space-y-4 > * + * { margin-top: 0 !important; }
          .brochure-page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 210mm !important; max-width: 210mm !important;
            min-height: 296mm !important;
            margin: 0 !important;
            padding: 11mm 10mm !important;
            background-size: 210mm 297mm !important;
            background-position: top center !important;
            background-repeat: no-repeat !important;
            break-before: page;
            break-inside: avoid-page;
          }
          .brochure-page:first-child { break-before: auto; }
          .brochure-page-cover { min-height: 296mm !important; padding: 64mm 10mm 10mm !important; }
          .brochure-page-inner { padding: 42mm 10mm 12mm !important; }
          .brochure-page.allow-break { break-inside: auto; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
          #brochure-print-root .allow-break li { break-inside: avoid-page; }
          #brochure-print-root #bro-curriculum div[class*="grid"] > div,
          #brochure-print-root #bro-projects div[class*="grid"] > div,
          #brochure-print-root #bro-career div[class*="space-y"] > div,
          #brochure-print-root #bro-career div[class*="grid"] > div { break-inside: avoid-page; }
          .brochure-page:not(.allow-break) { overflow: hidden !important; }
        }
      `}</style>

      {/* ── Course picker: 14 static courses, each with own preview + download ── */}
      <div className="no-print bg-white border border-admin-200 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <label className="block lg:col-span-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Course — pick one of {LOCAL_SYLLABUS.length} to preview &amp; download
          </span>
          <select
            value={syllabusKey}
            onChange={(e) => setSyllabusKey(e.target.value)}
            className="w-full h-10 px-3 border border-admin-200 rounded-lg bg-white text-sm font-medium"
          >
            {LOCAL_SYLLABUS.map((s) => (
              <option key={s.file} value={s.file}>
                {prettyTitleFromFile(s.file)} — {s.modules.filter((m) => m.no > 0).length} modules, {s.totalTopics} topics
              </option>
            ))}
          </select>
          <span className="block mt-1 text-[11px] font-medium text-slate-500">
            {live
              ? 'Live marvelslice.com record found — enriching this preview.'
              : `Static syllabus${liveCount !== null ? ` (live site reachable${liveCount ? '' : ', no matching course row yet'})` : ''} · preview + PDF work offline.`}
            {enriching ? ' Checking live site…' : ''}
          </span>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!canPreview}
            className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}
          >
            <FiDownload className="w-4 h-4" /> Preview &amp; Download PDF
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 lg:col-span-3">
          <FiBookOpen className="w-4 h-4 shrink-0 text-brand-orange" />
          <p>
            Curriculum: <strong className="text-slate-800">{curriculum.length} modules</strong> ·{' '}
            {asList(live?.modules).length >= 2 ? 'live DB modules' : `static docx — ${localDoc?.file || ''}`} ·{' '}
            {canPreview ? 'ready to print' : 'select a course'}
          </p>
        </div>
      </div>

      {/* ── Section navigator (screen only) ── */}
      <div className="no-print flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#bro-${s.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-admin-200 bg-white hover:bg-slate-50"
          >
            {s.label}
          </a>
        ))}
      </div>

      {canPreview ? (
        <div id="brochure-print-root" className="space-y-4">
          {/* ══ 1. COVER — front-page design (Learn WEB DEVELOPMENT style) ══ */}
          <section id="bro-cover" className="brochure-page brochure-page-cover relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative p-5 sm:p-7" style={{ paddingTop: '24%' }}>
              <p className="text-base text-slate-800">Learn</p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: BRAND.blue }}>
                {title.toUpperCase()}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
                Build Real Projects &nbsp;|&nbsp; Gain Practical Skills &nbsp;|&nbsp; Start Your Career
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {[`Duration: ${duration}`, `Mode: ${mode}`, category].map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full border bg-white"
                    style={{ borderColor: BRAND.blue, color: BRAND.blue }}
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  {[
                    { icon: FiCode, c: BRAND.blue, t: 'PRACTICAL TRAINING', d: highlights[0] || 'Hands-on labs and live coding' },
                    { icon: FiUsers, c: BRAND.purple, t: 'EXPERT MENTORSHIP', d: highlights[1] || '1:1 guidance from engineers' },
                    { icon: FiAward, c: BRAND.green, t: 'CAREER OUTCOMES', d: highlights[2] || 'Resume, mock interviews & referrals' },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="flex items-center gap-3 rounded-xl p-2 text-white shadow-md"
                      style={{ background: f.c }}
                    >
                      <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                        <f.icon className="w-5 h-5" style={{ color: f.c }} />
                      </span>
                      <span>
                        <span className="block text-xs font-extrabold tracking-wide">{f.t}</span>
                        <span className="block text-xs opacity-90">{f.d}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: FiLayers, t: 'Hands-on Learning', c: BRAND.blue },
                  { icon: FiZap, t: 'Real World Projects', c: BRAND.purple },
                  { icon: FiUsers, t: 'Expert Guidance', c: BRAND.orange },
                  { icon: FiTarget, t: 'Career Support', c: BRAND.green },
                ].map((b) => (
                  <div key={b.t} className="text-center">
                    <span
                      className="mx-auto w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: '#eff6ff' }}
                    >
                      <b.icon className="w-5 h-5" style={{ color: b.c }} />
                    </span>
                    <p className="mt-1 text-[11px] font-bold text-slate-700">{b.t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 p-2.5 bg-white/80">
                <p className="text-xs font-extrabold" style={{ color: BRAND.deepNavy }}>What&apos;s inside this brochure</p>
                <ol className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-600">
                  {SECTIONS.slice(1).map((s, i) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ background: BRAND.orange }}
                      >
                        {i + 1}
                      </span>
                      {s.label.replace(/^\d+\.\s*/, '')} {s.id === 'curriculum' ? `(${curriculum.length} modules)` : ''}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-2 text-sm font-bold italic" style={{ color: BRAND.deepNavy }}>
                Turn Your Ideas Into Real Websites and Applications
              </p>
            </div>
          </section>

          {/* ══ 2. ABOUT + HIGHLIGHTS ══ */}
          <section id="bro-about" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              About <span style={{ color: BRAND.orange }}>Program</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {effectiveCourse.description || `${title} at Marvel Slice takes you from fundamentals to job-ready projects with mentor-led training.`}
            </p>
            {effectiveCourse.subtitle && <p className="mt-2 text-sm font-semibold text-slate-800">{effectiveCourse.subtitle}</p>}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl p-3" style={{ background: BRAND.sky }}>
              {[
                ['Learning Format', 'Mentor-led + self-paced'],
                ['Duration', duration],
                ['Mode', mode],
                ['Certification', 'Marvel Slice'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] font-bold text-slate-800">{k}</p>
                  <p className="text-xs text-slate-500">{v}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              Key <span style={{ color: BRAND.orange }}>Highlights</span>
            </h3>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-slate-700">
                  <FiCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.orange }} /> {h}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              What You Will <span style={{ color: BRAND.orange }}>Achieve</span>
            </h3>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
              {outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRAND.green }} />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          {/* ══ 3. WHO CAN APPLY + APPLICATION PROCESS (light theme) ══ */}
          <section id="bro-apply" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Who Can <span style={{ color: BRAND.orange }}>Apply?</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
              {[
                'Students & freshers starting a software career from basics',
                'Working professionals switching into development roles',
                'Junior developers upskilling with structured projects',
                'Career restarters refreshing skills with mentor support',
                'Freelancers building client-ready project portfolios',
                `Anyone ready to complete ${curriculum.length} modules with daily practice`,
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5 rounded-xl border border-orange-100 bg-white/90 p-3 shadow-sm">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0" style={{ background: BRAND.orange }}>
                    <FiCheck className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[13px] font-medium leading-relaxed text-slate-700">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-extrabold text-slate-900">
                Application <span style={{ color: BRAND.orange }}>Process</span>
              </h3>
              <div className="mt-3 space-y-2">
                {[
                  ['1', 'SUBMIT APPLICATION', 'Tell us about yourself, your background and why you want to join.'],
                  ['2', 'COUNSELLING & BATCH ALLOTMENT', 'Speak with a counsellor to map the curriculum to your goals.'],
                  ['3', 'ENROLL & START LEARNING', 'Complete enrollment, get LMS access and join orientation.'],
                ].map(([n, t, d]) => (
                  <div key={n} className="flex items-center gap-4 rounded-xl border p-3" style={{ borderColor: '#fde68a' }}>
                    <span
                      className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center shrink-0"
                      style={{ background: BRAND.orange }}
                    >
                      {n}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-slate-900">{t}</span>
                      <span className="block text-xs text-slate-500">{d}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 4. LEARNING PATH ══ */}
          <section id="bro-path" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Learning <span style={{ color: BRAND.orange }}>Path</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <ol className="mt-3">
              {[
                ['Enroll & Orientation', 'Complete admission, get LMS access and meet your mentor.'],
                ['Foundations First', 'Start from zero — setup, basics and first hands-on labs.'],
                ['Core Concepts', 'The heart of the course with daily practice and exercises.'],
                ['Tools of the Trade', 'Master the professional tools used in real jobs.'],
                ['Mentor Check-ins', '1:1 doubt-clearing so you never stay stuck.'],
                ['Guided Mini Projects', 'Mentor-reviewed builds that lock in every stage.'],
                ['Advanced Topics', 'Deeper concepts taught with real scenarios and datasets.'],
                ['Project', 'End-to-end portfolio-grade build, deployed live.'],
                ['Deployment & Portfolio', 'Ship your work publicly with clean documentation.'],
                ['Resume & LinkedIn', 'Profiles rewritten around the projects you shipped.'],
                ['Mock Interviews', 'Practice rounds with the most-asked questions.'],
                ['Certification & Referrals', 'Earn your certificate and get referred to hiring partners.'],
              ].map(([t, d], i, arr) => (
                <li key={t} className={`relative flex gap-3 pb-3 last:pb-0 ${i % 2 ? 'rounded-xl bg-slate-50/80 px-2 -mx-2' : ''}`}>
                  <span className="flex flex-col items-center">
                    <span
                      className="w-7 h-7 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center shrink-0"
                      style={{ background: i % 3 === 0 ? BRAND.blue : i % 3 === 1 ? BRAND.orange : BRAND.green }}
                    >
                      {i + 1}
                    </span>
                    {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-slate-200" />}
                  </span>
                  <span className="pb-1">
                    <span className="block text-[15px] font-bold text-slate-900">{t}</span>
                    <span className="block text-[13px] leading-relaxed text-slate-500">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* ══ 5. CURRICULUM — 4 modules per page, short points only ══ */}
          {chunk(curriculum, 4).map((group, gi) => (
            <section key={gi} id={gi === 0 ? 'bro-curriculum' : `bro-curriculum-${gi + 1}`} className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              {gi === 0 ? (
                <>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Program <span style={{ color: BRAND.orange }}>Curriculum</span>
                  </h2>
                  <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
                  <p className="mt-2 text-xs text-slate-500">
                    Reference: {localDoc?.file || 'course syllabus'} · {curriculum.length} modules · {totalTopics} topics · every topic taught with live examples + exercises
                  </p>
                </>
              ) : (
                <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: BRAND.orange }}>
                  &nbsp;
                </p>
              )}
              <div className="mt-3 grid sm:grid-cols-2 gap-4">
                {group.map((m, i) => (
                  <div key={`${m.label}-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs font-extrabold" style={{ color: BRAND.orange }}>{m.label}</p>
                    <p className="text-[15px] font-bold text-slate-900">{m.title}</p>
                    <ul className="mt-1 space-y-1">
                      {(m.topics || []).map((t) => (
                        <li key={t} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRAND.blue }} />
                          <span className="font-medium text-slate-700">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* ══ 6. SKILLS + PROJECTS (one page) ══ */}
          <section id="bro-skills" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">Skills to <span style={{ color: BRAND.orange }}>Master</span></h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ background: BRAND.blue }}>
                  {s}
                </span>
              ))}
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Tools to <span style={{ color: BRAND.orange }}>Master</span></h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-3 flex flex-wrap gap-2">
              {tools.map((t) => (
                <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: BRAND.green, color: '#3f6212' }}>
                  {t}
                </span>
              ))}
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
              Course <span style={{ color: BRAND.orange }}>Projects</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-2 text-xs text-slate-500">Every project is reviewed by mentors and deployable to your portfolio.</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {expandedProjects.slice(0, 4).map((p) => (
                <div key={p.title} className="rounded-xl border border-slate-200 p-3.5">
                  <span
                    className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white mb-1.5"
                    style={{ background: p.level === 'Beginner' ? BRAND.green : p.level === 'Intermediate' ? BRAND.blue : BRAND.purple }}
                  >
                    {p.level}
                  </span>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FiBriefcase className="w-4 h-4 shrink-0" style={{ color: BRAND.orange }} /> {p.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                  {p.tech && <p className="mt-1.5 text-[11px] font-semibold text-slate-500">Stack: {p.tech}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* ══ 8. CAREERS (top job roles + services heading, one page) ══ */}
          <section id="bro-career" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Top <span style={{ color: BRAND.orange }}>Job Roles</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-3 space-y-2">
              {roles.map(([role, salary, desc], i) => (
                <div key={role} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span
                    className="w-8 h-8 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0"
                    style={{ background: BRAND.deepNavy }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-slate-900">{role}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: '#ecfdf5', color: '#15803d' }}>
                    {salary}
                  </span>
                </div>
              ))}
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-slate-900">
              Career <span style={{ color: BRAND.orange }}>Services</span>
            </h3>
            <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {[
                [FiTarget, 'Career-oriented Sessions', 'Role roadmaps and guidance from industry mentors.'],
                [FiUsers, '1:1 Mentoring', 'Personal guidance at every step of your transition.'],
                [FiCode, 'Mock Interviews', 'Practice with the most-asked questions by employers.'],
                [FiBriefcase, 'Job Referrals', 'Profile shortlisting with hiring partners on completion.'],
                [FiAward, 'Resume + LinkedIn Review', 'ATS-friendly resume and profile that attract recruiters.'],
                [FiZap, 'Hackathons & Job Fairs', 'Team builds and regular hiring events.'],
              ].map(([Icon, t, d]) => (
                <div key={t} className="flex gap-2.5">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fff7ed' }}>
                    <Icon className="w-4 h-4" style={{ color: BRAND.orange }} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{t}</span>
                    <span className="block text-xs text-slate-500">{d}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 8. CONTACT (content only, no bg image) ══ */}
          <section id="bro-contact" className="brochure-page relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="p-5 sm:p-7 text-white" style={{ background: BRAND.navy }}>
              <h2 className="text-2xl font-extrabold">
                Contact <span style={{ color: BRAND.orange }}>Us</span>
              </h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <p className="flex items-center gap-2"><FiPhone className="w-4 h-4" style={{ color: BRAND.orange }} /> {contact.phone}</p>
                <p className="flex items-center gap-2"><FiMail className="w-4 h-4" style={{ color: BRAND.orange }} /> {contact.email}</p>
                <p className="flex items-center gap-2"><FiGlobe className="w-4 h-4" style={{ color: BRAND.orange }} /> {contact.website}</p>
                <p className="flex items-center gap-2"><FiClock className="w-4 h-4" style={{ color: BRAND.orange }} /> Mon–Sat · 9 AM – 7 PM</p>
              </div>
              <p className="mt-3 text-xs opacity-80">{contact.address}</p>
            </div>
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                <strong className="text-slate-800">Marvel Slice</strong> · Institute for Software Learning · {contact.website}
              </p>
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: BRAND.green }}>
                <FiDatabase className="inline w-3 h-3 mr-1" /> {title} · {curriculum.length} modules · {totalTopics} topics
              </span>
            </div>
          </section>

          {/* ══ 10. EXPLORE OUR COURSES (all 14, image-style rows) ══ */}
          <section id="bro-courses" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Explore Our <span style={{ color: BRAND.orange }}>Courses</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-2 text-xs text-slate-500">One brochure per course — pick any title from the dropdown above to preview &amp; download it.</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {LOCAL_SYLLABUS.map((s, i) => {
                const mods = s.modules.filter((m) => m.no > 0);
                const isCurrent = s.file === syllabusKey;
                return (
                  <div key={s.file} className="flex items-center gap-3 rounded-lg border-l-4 border border-slate-100 bg-slate-50/80 py-2 pl-3 pr-4" style={{ borderLeftColor: BRAND.blue }}>
                    <span className="w-9 h-9 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0" style={{ background: isCurrent ? BRAND.orange : BRAND.blue }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold" style={{ color: BRAND.blue }}>
                        {prettyTitleFromFile(s.file)}
                        {isCurrent && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: BRAND.orange }}>· Current</span>}
                      </span>
                      <span className="block text-xs text-slate-500">{mods.length} modules | {s.totalTopics} topics</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-admin-200 bg-white p-10 text-center text-sm text-slate-500">
          Select a course above to preview its brochure.
        </div>
      )}
    </PageShell>
  );
}
