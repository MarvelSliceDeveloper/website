import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import {
  FiDownload, FiBookOpen, FiCheck, FiClock, FiUsers,
  FiAward, FiBriefcase, FiMail, FiPhone, FiGlobe, FiLayers,
  FiZap, FiCode, FiDatabase, FiTarget,
  FiVideo, FiTerminal, FiHeadphones, FiPlayCircle, FiSend, FiMessageCircle,
  FiTool,
} from 'react-icons/fi';
import { LOCAL_SYLLABUS } from '../../data/localSyllabus';
import {
  toolsForTitle, rolesFor,
  projectsFor, outcomesFor, normalizeModuleCount,
  keyHighlightsFor, pedagogyFor,
  moduleDescriptionFor, moduleHandsOnLabFor,
  moduleToolsFor, moduleTakeawayFor,
  isProjectModule,
  programDimensionsFor, targetAudienceDetailedFor, prerequisitesFor,
  durationForCourse, extractToolsFromSyllabus,
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
  { id: 'about', label: '2. About' },
  { id: 'pedagogy', label: '3. Highlights & Pedagogy' },
  { id: 'apply', label: '4. Who Can Apply' },
  { id: 'path', label: '5. Learning Path' },
  { id: 'curriculum', label: '6. Curriculum' },
  { id: 'skills', label: '7. Skills + Projects' },
  { id: 'career', label: '8. Careers & Contact' },
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

function toolsForCourse(course, modules = []) {
  const fromSyllabus = extractToolsFromSyllabus(modules);
  if (fromSyllabus.length) return fromSyllabus.slice(0, 12);
  const techs = (course?.projects || []).flatMap((p) => asList(p.technologies));
  if (techs.length) return techs.slice(0, 12);
  return toolsForTitle(course?.title || '', [], modules);
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
  const [dbSiteCourses, setDbSiteCourses] = useState([]);
  const [enriching, setEnriching] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [syllabusKey, setSyllabusKey] = useState(
    () => LOCAL_SYLLABUS[0]?.file || '',
  );

  // Generate scannable QR code for https://marvelslice.com
  useEffect(() => {
    let active = true;
    QRCode.toDataURL('https://marvelslice.com', {
      margin: 1,
      width: 256,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Best-effort site settings & published courses. Never blocks preview.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*').maybeSingle();
        if (!cancelled && data) setSiteSettings(data);
      } catch { /* offline defaults apply */ }
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, duration, is_published')
          .eq('is_published', true)
          .order('title');
        if (!cancelled && !error) {
          setLiveCount(Array.isArray(data) ? data.length : null);
          if (Array.isArray(data) && data.length > 0) setDbSiteCourses(data);
        }
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
  // Standalone project modules are excluded as projects have a dedicated section.
  const curriculum = useMemo(() => {
    const dbMods = asList(live?.modules)
      .map((m, i) => ({
        label: `Module ${i + 1}`,
        title: m.title || m.name || `Part ${i + 1}`,
        topics: asList(m.topics || m.lessons || m.content).slice(0, 10),
      }))
      .filter((m) => (m.topics.length || m.title) && !isProjectModule(m));
    if (dbMods.length >= 2) return normalizeModuleCount(dbMods);
    if (localDoc) {
      return normalizeModuleCount(localDoc.modules
        .filter((m) => m.no > 0 && !isProjectModule(m))
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

  const siteCatalogCourses = useMemo(() => {
    function cleanTitleKey(t = '') {
      return t.toLowerCase().replace(/\b(course|masterclass|program|training)\b/gi, '').replace(/[^a-z0-9]/g, '').trim();
    }
    const list = [];
    const seen = new Set();

    if (dbSiteCourses && dbSiteCourses.length > 0) {
      dbSiteCourses.forEach((c) => {
        const key = cleanTitleKey(c.title || '');
        if (c.title && !seen.has(key)) {
          seen.add(key);
          list.push({
            title: c.title,
            duration: c.duration || durationForCourse(c.title),
          });
        }
      });
    }

    LOCAL_SYLLABUS.forEach((s) => {
      const pTitle = prettyTitleFromFile(s.file);
      const key = cleanTitleKey(pTitle);
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          title: pTitle,
          duration: durationForCourse(pTitle),
        });
      }
    });

    return list.slice(0, 14);
  }, [dbSiteCourses]);

  const contact = {
    phone: siteSettings?.contact_phone || '+91 63809 57390 / +91 80882 18609',
    email: siteSettings?.contact_email && siteSettings?.contact_email !== 'sales@marvelslice.com' ? siteSettings.contact_email : 'hr@marvelslice.com',
    website: siteSettings?.social_links?.website || siteSettings?.website || 'www.marvelslice.com',
    address: siteSettings?.address || 'Marvel Slice — Institute for Software Learning, Chennai, Tamil Nadu, India',
  };

  const title = effectiveCourse?.title || 'Professional Course';
  const duration = effectiveCourse?.duration || 'Flexible duration';
  const mode = effectiveCourse?.mode || 'Online / Classroom';
  const category = effectiveCourse?.category || 'Software Learning';

  const skills = useMemo(() => skillsForCourse(effectiveCourse, curriculum), [effectiveCourse, curriculum]);
  const tools = useMemo(() => toolsForCourse(effectiveCourse, curriculum), [effectiveCourse, curriculum]);
  const projects = useMemo(() => asList(effectiveCourse?.projects), [effectiveCourse]);
  const expandedProjects = useMemo(() => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Advanced'];
    if (projects.length) {
      return projects.slice(0, 4).map((p, i) => ({
        level: levels[i] || 'Advanced',
        title: p.title || 'Project',
        desc: p.description || 'Build and deploy a portfolio-ready application.',
        tech: asList(p.technologies).join(', '),
      }));
    }
    return projectsFor(title, localDoc?.modules || live?.modules || curriculum);
  }, [projects, title, curriculum, localDoc, live]);
  const roles = useMemo(() => rolesFor(title), [title]);
  const outcomes = useMemo(() => outcomesFor(title, curriculum), [title, curriculum]);
  const detailedHighlights = useMemo(() => {
    if (Array.isArray(live?.keyHighlights) && live.keyHighlights.length) {
      return live.keyHighlights;
    }
    return keyHighlightsFor(title, duration, curriculum);
  }, [live, title, duration, curriculum]);

  const pedagogy = useMemo(() => {
    if (Array.isArray(live?.pedagogy) && live.pedagogy.length >= 4) {
      return live.pedagogy;
    }
    return pedagogyFor(title);
  }, [live, title]);

  const programDimensions = useMemo(() => programDimensionsFor(title), [title]);
  const targetAudience = useMemo(
    () => targetAudienceDetailedFor(title, curriculum.length),
    [title, curriculum.length],
  );
  const prerequisites = useMemo(() => prerequisitesFor(title), [title]);

  const pedagogyIconMap = {
    instructor: FiVideo,
    hackathons: FiTerminal,
    support: FiHeadphones,
    networking: FiUsers,
    self_paced: FiPlayCircle,
    gamified: FiAward,
    projects: FiSend,
    mentorship: FiMessageCircle,
  };

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
            `#brochure-print-root #bro-pedagogy div[class*="grid"] > div,` +
            `#brochure-print-root #bro-curriculum div[class*="grid"] > div,` +
            `#brochure-print-root #bro-projects div[class*="grid"] > div,` +
            `#brochure-print-root #bro-career div[class*="space-y"] > div,` +
            `#brochure-print-root #bro-career div[class*="grid"] > div{break-inside:avoid-page}` +
            `#brochure-print-root #bro-skills div[class*="sm:grid-cols-2"]{break-inside:avoid-page}` +
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
          #brochure-print-root #bro-pedagogy div[class*="grid"] > div,
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

          {/* ══ 2. ABOUT PROGRAM ══ */}
          <section id="bro-about" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              About <span style={{ color: BRAND.orange }}>Program</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />

            {/* 1. Deep Executive Summary / Institutional Rationale */}
            <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600">
              {effectiveCourse.description || `${title} at Marvel Slice is an intensive, industry-aligned career accelerator engineered to bridge the divide between theoretical fundamentals and real-world production engineering.`}
              {' '}
              {effectiveCourse.subtitle || `Designed in collaboration with engineering leaders, the curriculum immerses learners in production-grade architectures, test-driven methodologies, and enterprise workflows, graduating candidates ready to excel in competitive technical environments.`}
            </p>

            {/* 2. Program Key Specifications Strip (4-column Card) */}
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl p-3 border border-slate-200" style={{ background: BRAND.sky }}>
              {[
                { k: 'LEARNING FORMAT', v1: 'Mentor-led Live', v2: 'Interactive Sessions' },
                { k: 'DURATION & PACE', v1: duration, v2: 'Daily Practice Drills' },
                { k: 'DELIVERY MODE', v1: mode, v2: 'Hands-on Code Labs' },
                { k: 'CREDENTIALS', v1: 'Industry Certified', v2: 'Marvel Slice Verified' },
              ].map(({ k, v1, v2 }) => (
                <div key={k} className="border-l first:border-l-0 pl-3 border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">{k}</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{v1}</p>
                  <p className="text-[11px] text-slate-500">{v2}</p>
                </div>
              ))}
            </div>

            {/* 3. Core Program Pillars / Architecture (3 structured cards) */}
            <div className="mt-4">
              <h3 className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 mb-2">
                Program Architecture & Focus Pillars
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {programDimensions.slice(0, 3).map((p, idx) => {
                  const colors = [BRAND.blue, BRAND.purple, BRAND.green];
                  const col = colors[idx] || BRAND.blue;
                  return (
                    <div
                      key={p.title}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: col }} />
                      <div>
                        <span className="text-[10px] font-extrabold tracking-wider" style={{ color: col }}>
                          PILLAR 0{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">{p.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. What You Will Achieve (8 Outcome Cards in 2 cols x 4 rows) */}
            <div className="mt-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                What You Will <span style={{ color: BRAND.orange }}>Achieve</span>
              </h3>
              <div className="mt-2.5 grid sm:grid-cols-2 gap-2">
                {outcomes.slice(0, 8).map((o, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
                    <span
                      className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: '#10b981' }}
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-medium text-slate-700 leading-snug">{o}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 3. KEY HIGHLIGHTS & PROGRAM PEDAGOGY ══ */}
          <section id="bro-pedagogy" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            {/* Top Section: Key Highlights */}
            <h2 className="text-2xl font-extrabold text-slate-900">
              Key <span style={{ color: BRAND.orange }}>Highlights</span>
            </h2>
            <div className="mt-1.5 h-1 w-14 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {detailedHighlights.slice(0, 20).map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-normal">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: BRAND.orange }}
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                  </span>
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-slate-100" />

            {/* Bottom Section: Program Pedagogy */}
            <h2 className="text-2xl font-extrabold text-slate-900">
              Program <span style={{ color: BRAND.orange }}>Pedagogy</span>
            </h2>
            <div className="mt-1.5 h-1 w-14 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                {pedagogy.slice(0, 4).map((p, idx) => {
                  const IconComp = pedagogyIconMap[p.key] || FiLayers;
                  return (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span
                        className="w-11 h-11 rounded-xl border-2 border-amber-500 bg-white flex items-center justify-center shrink-0"
                        style={{ color: BRAND.orange }}
                      >
                        <IconComp className="w-5 h-5 text-amber-500" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{p.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                {pedagogy.slice(4, 8).map((p, idx) => {
                  const IconComp = pedagogyIconMap[p.key] || FiLayers;
                  return (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span
                        className="w-11 h-11 rounded-xl border-2 border-amber-500 bg-white flex items-center justify-center shrink-0"
                        style={{ color: BRAND.orange }}
                      >
                        <IconComp className="w-5 h-5 text-amber-500" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{p.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ══ 4. WHO CAN APPLY + ONBOARDING JOURNEY ══ */}
          <section id="bro-apply" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Who Can <span style={{ color: BRAND.orange }}>Apply?</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-2 text-xs text-slate-600">
              Open to passionate learners and professionals across diverse academic, analytical, and technical backgrounds.
            </p>

            {/* 1. Target Audience Profiles (6 structured cards, 2 columns) */}
            <div className="mt-3.5 grid sm:grid-cols-2 gap-2.5">
              {targetAudience.slice(0, 6).map((aud) => (
                <div key={aud.title} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/20 p-2.5">
                  <span
                    className="w-5 h-5 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: BRAND.orange }}
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{aud.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{aud.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Prerequisites & Technical Eligibility Banner (3 columns) */}
            <div className="mt-3.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: BRAND.blue }} />
              <p className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: BRAND.blue }}>
                ELIGIBILITY & TECHNICAL PREREQUISITES
              </p>
              <div className="mt-2 grid sm:grid-cols-3 gap-3">
                <div className="border-l first:border-l-0 pl-2.5 border-blue-100">
                  <p className="text-[11px] font-bold text-slate-900">Academic Eligibility</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Any degree / diploma (BE, BTech, BSc, BCA, BCom, or equivalent stream).
                  </p>
                </div>
                <div className="border-l pl-2.5 border-blue-100">
                  <p className="text-[11px] font-bold text-slate-900">Prior Coding Background</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {prerequisites[2] || 'Zero prior programming required — starts from absolute fundamentals.'}
                  </p>
                </div>
                <div className="border-l pl-2.5 border-blue-100">
                  <p className="text-[11px] font-bold text-slate-900">System & Hardware Setup</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Laptop/PC with 8GB RAM, modern web browser, and broadband internet.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Application & Onboarding Journey (4 full-width cards) */}
            <div className="mt-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Application & <span style={{ color: BRAND.orange }}>Onboarding Journey</span>
              </h3>
              <div className="mt-2.5 space-y-2">
                {[
                  ['01', 'SUBMIT APPLICATION & PROFILE REVIEW', 'Submit your academic details and career aspirations through our admissions form for instant evaluation.'],
                  ['02', '1:1 CAREER COUNSELLING & ROADMAP', 'Connect with an engineering career advisor to review syllabus fit, batch timings, and learning milestones.'],
                  ['03', 'ENROLLMENT & LMS ONBOARDING', 'Confirm your batch seat, receive your Marvel Slice student portal login credentials, and join the cohort community.'],
                  ['04', 'ORIENTATION & MENTOR MATCH', 'Attend the live orientation session, configure your developer tooling, and start Module 1 with dedicated mentor support.'],
                ].map(([num, st, sd]) => (
                  <div key={num} className="flex items-center gap-3.5 rounded-xl border border-amber-200 bg-white p-2.5 shadow-xs">
                    <span
                      className="w-7 h-7 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0"
                      style={{ background: BRAND.orange }}
                    >
                      {num}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{st}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{sd}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 4. LEARNING PATH ══ */}
          <section id="bro-path" className="brochure-page brochure-page-inner relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-0">
            <img src="/brochure/path-default.png" alt="Learning Path — From Registration to a Successful Career" className="w-full h-full object-contain" />
          </section>

          {/* ══ 6. CURRICULUM — 2 modules per page, 2 columns with short description & hands-on lab ══ */}
          {chunk(curriculum, 2).map((group, gi) => (
            <section key={gi} id={gi === 0 ? 'bro-curriculum' : `bro-curriculum-${gi + 1}`} className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              {gi === 0 ? (
                <>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Program <span style={{ color: BRAND.orange }}>Curriculum</span>
                  </h2>
                  <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
                  <p className="mt-2 text-xs text-slate-500">
                    Comprehensive Practical Syllabus · Part {gi + 1} of {Math.ceil(curriculum.length / 2)} · {curriculum.length} modules total
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Program <span style={{ color: BRAND.orange }}>Curriculum (contd.)</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">Part {gi + 1} of {Math.ceil(curriculum.length / 2)}</span>
                </div>
              )}
              <div className="mt-4 grid sm:grid-cols-2 gap-5">
                {group.map((m, i) => {
                  const cleanTitle = (m.title || `Module ${m.label || i + 1}`)
                    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
                    .replace(/^[—–-]\s*/, '')
                    .trim() || `Core Module`;
                  const rawTopics = (m.topics || []).map((t) =>
                    String(t || '')
                      .replace(/^[-•*◦▪]\s*/, '')
                      .replace(/^(?:module|chapter|unit|part)\s*\d+[:\-.]?\s*/i, '')
                      .replace(/^L\d+\s*[-–]\s*/i, '')
                      .trim()
                  ).filter((t) => t && t.toLowerCase() !== cleanTitle.toLowerCase());
                  const topicList = [...new Set(rawTopics)].slice(0, 9);

                  return (
                    <div key={`${m.label}-${i}`} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-xs">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold text-white mb-2" style={{ background: BRAND.orange }}>
                          {m.label}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{cleanTitle}</h3>
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                          {moduleDescriptionFor(m, title)}
                        </p>
                        <ul className="mt-3 space-y-2.5 border-t border-slate-200/80 pt-2.5">
                          {topicList.map((t) => (
                            <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 py-0.5">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRAND.blue }} />
                              <span className="font-medium text-slate-700">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 space-y-2">
                        {/* Tools & Environment */}
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tools &amp; Environment</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {moduleToolsFor(m).map((tl) => (
                              <span key={tl} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                {tl}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Key Competency */}
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5 border-l-4 border-l-amber-500">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Key Competency Gained</p>
                          <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">{moduleTakeawayFor(m)}</p>
                        </div>

                        {/* Technical Drill & Practical Lab */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs border-l-4 border-l-blue-600">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Technical Drill &amp; Practical Lab</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{moduleHandsOnLabFor(m)}</p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-slate-600">PRACTICE FOCUS:</span>
                            <span>Hands-on coding exercises, syntax drills &amp; mentor validation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* ══ 7. TECHNOLOGIES & TOOLS + PROJECTS (1 PAGE) ══ */}
          <section id="bro-skills" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <FiTool className="w-6 h-6 text-blue-600" />
              Technologies &amp; Tools <span style={{ color: BRAND.orange }}>You Will Master</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <div className="mt-4 flex flex-wrap gap-2.5">
              {[...new Set([...tools, ...skills])].slice(0, 12).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold shadow-xs hover:bg-blue-100/70 transition-all"
                >
                  <FiTool className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{t}</span>
                </span>
              ))}
            </div>

            <div className="my-5 border-t border-slate-100" />

            <h2 className="text-2xl font-extrabold text-slate-900">
              Course <span style={{ color: BRAND.orange }}>Projects</span>
            </h2>
            <div className="mt-2 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-1.5 text-xs text-slate-500">Industry-grade portfolio applications built step-by-step from beginner to advanced.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {expandedProjects.slice(0, 4).map((p, idx) => {
                const borderColors = [
                  'border-l-emerald-500',
                  'border-l-blue-600',
                  'border-l-purple-600',
                  'border-l-amber-500',
                ];
                const badgeBgs = [
                  BRAND.green,
                  BRAND.blue,
                  BRAND.purple,
                  BRAND.orange,
                ];
                return (
                  <div
                    key={p.title + idx}
                    className={`rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs border-l-4 ${borderColors[idx] || 'border-l-blue-600'} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                          style={{ background: badgeBgs[idx] || BRAND.blue }}
                        >
                          {p.level}
                        </span>
                        <span className="text-xs font-bold text-slate-400">0{idx + 1}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {p.title}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                    </div>
                    {p.tech && (
                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">STACK:</span>
                        <span className="font-semibold text-blue-700">{p.tech}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══ 8. CAREERS & CONTACT US (Roles, Services, Modern Contact Cards, Company Slogan) ══ */}
          <section id="bro-career" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            {/* 1. Career Roles & Opportunities */}
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <FiBriefcase className="w-6 h-6 text-emerald-600" />
              Career Roles &amp; <span style={{ color: BRAND.orange }}>Opportunities</span>
            </h2>
            <div className="mt-1.5 h-1 w-16 rounded" style={{ background: BRAND.orange }} />

            <div className="mt-3.5 flex flex-wrap gap-2">
              {roles.slice(0, 8).map(([role]) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold shadow-xs"
                >
                  <FiBriefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{role}</span>
                </span>
              ))}
            </div>

            {/* 2. Career Services & Placement Assistance */}
            <div className="mt-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Career Services &amp; <span style={{ color: BRAND.orange }}>Placement Assistance</span>
              </h3>
              <div className="mt-2.5 grid sm:grid-cols-2 gap-2">
                {[
                  [FiTarget, 'Career Roadmaps & Strategy', '1:1 technical career planning aligned to your profile.'],
                  [FiCode, 'Technical Mock Interviews', 'Practice with FAANG & enterprise interview drills.'],
                  [FiAward, 'Resume & LinkedIn Makeover', 'ATS-compliant resume & recruiter-ready profile.'],
                  [FiBriefcase, 'Direct Hiring Referrals', 'Priority shortlisting across 150+ verified hiring partners.'],
                  [FiUsers, '1:1 Mentor Guidance', 'Personal doubt-clearing & transition counseling.'],
                  [FiZap, 'Hackathons & Hiring Days', 'Live collaborative team builds to demonstrate skills.'],
                ].map(([Icon, t, d]) => (
                  <div key={t} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fff7ed' }}>
                      <Icon className="w-4 h-4" style={{ color: BRAND.orange }} />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{t}</span>
                      <span className="block text-[11px] text-slate-500 leading-snug">{d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Contact Us & Admissions (Redesigned with Brand Colors - No Black!) */}
            <div className="mt-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Contact <span style={{ color: BRAND.orange }}>Us &amp; Admissions Support</span>
              </h3>
              <div className="mt-2.5 grid sm:grid-cols-2 gap-2.5">
                {/* Helpline */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: BRAND.orange }} />
                  <p className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: BRAND.orangeDark }}>
                    ADMISSIONS HELPLINE
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5" style={{ color: BRAND.orange }} />
                    {contact.phone}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mon–Sat · 9:00 AM – 7:00 PM IST</p>
                </div>

                {/* Email */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: BRAND.blue }} />
                  <p className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: BRAND.blue }}>
                    STUDENT SUPPORT &amp; INQUIRIES
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5" style={{ color: BRAND.blue }} />
                    {contact.email}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Prompt admissions response within 24 hrs</p>
                </div>

                {/* Campus */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: BRAND.green }} />
                  <p className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-700">
                    CAMPUS &amp; HEADQUARTERS
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    Marvel Slice — Institute for Software Learning
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Chennai, Tamil Nadu, India</p>
                </div>

                {/* Online LMS */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: BRAND.purple }} />
                  <p className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: BRAND.purple }}>
                    STUDENT PORTAL &amp; SYLLABUS
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FiGlobe className="w-3.5 h-3.5" style={{ color: BRAND.purple }} />
                    {contact.website}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">24/7 Digital LMS · Interactive Code Labs</p>
                </div>
              </div>
            </div>

            {/* 4. Company Slogan Banner (At the end of Contact section) */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ background: BRAND.blue }} />
              <p className="text-[10px] font-extrabold tracking-wider uppercase text-blue-600">
                OUR CORE PHILOSOPHY &amp; PROMISE
              </p>
              <p className="mt-1 text-sm font-bold italic text-slate-900">
                &ldquo;Education should create opportunities; skills should create confidence.&rdquo;
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Marvel Slice — Institute for Software Learning · Industry Mentorship &amp; Engineering Excellence
              </p>
            </div>
          </section>

          {/* ══ 9. EXPLORE OUR COURSES (14 Programs in 2 Columns with Matching Design Colors) ══ */}
          <section id="bro-courses" className="brochure-page brochure-page-inner allow-break relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Explore Our <span style={{ color: BRAND.orange }}>Courses</span>
            </h2>
            <div className="mt-1.5 h-1 w-16 rounded" style={{ background: BRAND.orange }} />
            <p className="mt-2 text-xs text-slate-500">
              One brochure per course — contact our academic counsellors to receive the comprehensive curriculum for any program.
            </p>

            <div className="mt-3.5 grid sm:grid-cols-2 gap-2.5">
              {siteCatalogCourses.map((c, i) => {
                const isCurrent = c.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(c.title.toLowerCase());

                return (
                  <div
                    key={c.title}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-shadow ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-xs"
                      style={{ background: BRAND.orange }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`block text-xs font-bold truncate ${isCurrent ? 'text-amber-800' : 'text-slate-900'}`}>
                          {c.title}
                        </span>
                        {isCurrent && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0"
                            style={{ background: '#fef3c7', color: BRAND.orangeDark }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-amber-700">Duration:</span> {c.duration}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Admissions & Syllabus Inquiries Section — Clean Unboxed Layout */}
            <div className="mt-4 pt-3">
              <p className="text-base font-bold text-slate-900 text-center">
                Admissions &amp; Syllabus Inquiries:
              </p>
              <div className="mt-2 mx-auto w-3/5 border-t border-slate-200" />

              <div className="mt-3.5 flex items-start gap-5">
                {/* Left: Contact Info */}
                <div className="flex-1 space-y-4">
                  {/* Top: Phone Left & Email Right */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                      <FiPhone className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Enquiry</span>
                        <span className="text-sm font-bold text-slate-800">
                          +91 63809 57390 / +91 80882 18609
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <FiMail className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                        <a href="mailto:hr@marvelslice.com" className="text-sm font-bold text-slate-800 hover:text-amber-700">
                          hr@marvelslice.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Below Center: Website */}
                  <div className="flex items-center gap-2.5 justify-center">
                    <FiGlobe className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</span>
                      <a href="https://marvelslice.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-700 hover:underline">
                        www.marvelslice.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Corner: QR Code */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code - marvelslice.com" className="w-20 h-20" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                        QR Code
                      </div>
                    )}
                  </div>
                  <span className="mt-0.5 text-[10px] font-bold text-amber-600 tracking-wider">SCAN FOR SITE</span>
                </div>
              </div>
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
