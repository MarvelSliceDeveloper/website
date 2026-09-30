import jsPDFRaw from 'jspdf';
const jsPDF = jsPDFRaw?.jsPDF || jsPDFRaw?.default || jsPDFRaw;
import QRCode from 'qrcode';
import { supabase } from './supabaseClient.js';
import { LOCAL_SYLLABUS } from '../data/localSyllabus.js';
import { generateAIBrochureData } from './brochureAIService.js';
import {
  toolsForTitle, rolesFor,
  projectsFor, outcomesFor, DEFAULT_PATH_STEPS, normalizeModuleCount,
  keyHighlightsFor, pedagogyFor,
  moduleDescriptionFor, moduleHandsOnLabFor,
  moduleToolsFor, moduleTakeawayFor,
  isProjectModule,
  programDimensionsFor, targetAudienceDetailedFor, prerequisitesFor,
  prettyTitleFromFile, durationForCourse,
  extractToolsFromSyllabus, extractDurationFromDoc,
} from './brochureExpand.js';

/**
 * Brochure-menu PDF engine (matches the admin Brochure Designer look).
 *
 * Flow (doc in → designed PDF out):
 *   1. Uploaded doc (docx/pdf/txt) is AI-condensed into curriculum sections
 *      via condenseDocToOneLiners() — original headings kept, 6-10 rich
 *      lines each. Without an AI key the deterministic local splitter is used.
 *   2. Highlights / outcomes / projects are AI-polished when a key is
 *      configured (AI Settings → AI Config), otherwise syllabus-grounded
 *      local content from brochureExpand.js is used — output never blocks.
 *   3. Pages render full-bleed on the real template backgrounds:
 *      public/brochure/bg-cover.jpg (page 1) and bg-inner.jpg (rest),
 *      with content aligned clear of the baked header/logo zones.
 *
 * Pages: Cover > About+Highlights+Outcomes+Prereqs > Who Can Apply+Steps >
 *   12-step Learning Path > Curriculum (2 modules/page, one-by-one rows) >
 *   Skills+Tools > Projects > Careers+Services > Contact (content only) >
 *   Other Courses (titles only, skipped when none picked).
 */

// ---------- palette ----------
const NAVY = [12, 16, 40];
const BLUE = [23, 92, 221];
const ORANGE = [245, 158, 11];
const GREEN = [116, 169, 22];
const PURPLE = [124, 58, 247];
const INK = [15, 23, 42];
const BODY = [51, 65, 85];
const MUTED = [100, 116, 139];
const WHITE = [255, 255, 255];
const CARD = [248, 251, 255];
const BORDER = [226, 232, 240];
const SKY = [239, 246, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 10;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const COVER_TOP = 64;   // baked cover header ends ~60mm
const INNER_TOP = 42;   // baked inner logo zone ends ~40mm
const BODY_BOTTOM = 230; // template bottom decals start ~236mm

function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[•◦▪]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function asList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Fetch a same-origin image to data URL for jsPDF (null when unavailable). */
async function loadImageDataUrl(url) {
  try {
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const relPath = url.startsWith('/') ? url.slice(1) : url;
        const fullPath = path.join(process.cwd(), 'public', relPath);
        if (fs.existsSync(fullPath)) {
          const buf = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase().slice(1) || 'png';
          const mime = ext === 'jpg' ? 'jpeg' : ext;
          return `data:image/${mime};base64,${buf.toString('base64')}`;
        }
      } catch { /* ignore Node fs error */ }
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateModernCourseBrochurePDF(course, siteSettings = {}, options = {}) {
  const data = await generateAIBrochureData(course, siteSettings);
  // Background: template images by default, plain white on opt-out,
  // custom uploads when provided (per-slot fallback to default template art).
  const bgStyle = options.bgStyle === 'plain' ? 'plain' : 'template';
  const [coverImg, innerImg, defaultPathImg] = await Promise.all([
    bgStyle === 'plain' ? null : (options.customCoverBg || loadImageDataUrl('/brochure/bg-default.png')),
    bgStyle === 'plain' ? null : (options.customInnerBg || loadImageDataUrl('/brochure/bg-default.png')),
    loadImageDataUrl('/brochure/path-default.png'),
  ]);

  // Curriculum priority: uploaded AI-condensed doc > live DB modules.
  // Standalone project modules are excluded — projects belong exclusively in Course Projects.
  const rawSections = Array.isArray(options.docSections)
    ? options.docSections.filter((s) => s && (s.title || (s.lines || []).length))
    : [];
  let modules = rawSections.slice(0, 30).map((s, i) => {
    const rawT = sanitize(s.title || '');
    const cleanT = rawT
      .replace(/^#+\s*/, '')
      .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
      .replace(/^[—–-]\s*/, '')
      .trim();
    const title = cleanT || `Core Module ${i + 1}`;
    const rawTopics = (s.lines || []).map((l) =>
      sanitize(l)
        .replace(/^[-•*◦▪]\s*/, '')
        .replace(/^(?:module|chapter|unit|part)\s*\d+[:\-.]?\s*/i, '')
        .replace(/^L\d+\s*[-–]\s*/i, '')
        .trim()
    ).filter((t) => t && t.toLowerCase() !== title.toLowerCase());
    return {
      label: `Module ${i + 1}`,
      title,
      topics: [...new Set(rawTopics)].slice(0, 14),
    };
  }).filter((m) => (m.topics.length || m.title) && !isProjectModule(m));

  if (modules.length < 2) {
    const dbMods = asList(data.modules).map((m, i) => {
      const rawT = sanitize(m.title || m.name || '');
      const cleanT = rawT
        .replace(/^#+\s*/, '')
        .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
        .replace(/^[—–-]\s*/, '')
        .trim();
      const title = cleanT || `Core Module ${i + 1}`;
      const rawTopics = asList(m.topics || m.lessons || m.content).map((l) =>
        sanitize(l)
          .replace(/^[-•*◦▪]\s*/, '')
          .replace(/^(?:module|chapter|unit|part)\s*\d+[:\-.]?\s*/i, '')
          .replace(/^L\d+\s*[-–]\s*/i, '')
          .trim()
      ).filter((t) => t && t.toLowerCase() !== title.toLowerCase());
      return {
        label: `Module ${i + 1}`,
        title,
        topics: [...new Set(rawTopics)].slice(0, 14),
      };
    }).filter((m) => (m.topics.length || m.title) && !isProjectModule(m));
    if (dbMods.length >= 2) modules = dbMods;
  }
  // Clamp to full curriculum pages (even count: 6 to 16 modules, topics kept).
  modules = normalizeModuleCount(modules);

  // ─── Site Courses Catalog (Dynamic from DB / Site Syllabus - Never Hardcoded) ───
  function cleanTitleKey(t = '') {
    return t.toLowerCase().replace(/\b(course|masterclass|program|training)\b/gi, '').replace(/[^a-z0-9]/g, '').trim();
  }

  let catalogCourses = [];
  const seenCatalog = new Set();

  // 1. Caller passed otherCourses or data.allCourses
  const incomingCourses = Array.isArray(options.otherCourses) && options.otherCourses.length > 0
    ? options.otherCourses
    : (Array.isArray(data.allCourses) && data.allCourses.length > 0 ? data.allCourses : []);

  if (incomingCourses.length > 0) {
    incomingCourses.forEach((c) => {
      const cTitle = sanitize(c.title || c.name || '');
      const key = cleanTitleKey(cTitle);
      if (cTitle && !seenCatalog.has(key)) {
        seenCatalog.add(key);
        catalogCourses.push({
          title: cTitle,
          duration: sanitize(c.duration || durationForCourse(cTitle)),
        });
      }
    });
  }

  // 2. Query live Supabase DB courses if online
  if (catalogCourses.length < 14) {
    try {
      const { data: dbCourses } = await supabase
        .from('courses')
        .select('id, title, duration, is_published')
        .eq('is_published', true)
        .order('title');
      if (dbCourses && dbCourses.length > 0) {
        dbCourses.forEach((c) => {
          const cTitle = sanitize(c.title || '');
          const key = cleanTitleKey(cTitle);
          if (cTitle && !seenCatalog.has(key)) {
            seenCatalog.add(key);
            catalogCourses.push({
              title: cTitle,
              duration: sanitize(c.duration || durationForCourse(cTitle)),
            });
          }
        });
      }
    } catch {
      // offline / supabase error
    }
  }

  // 3. Supplement with full site syllabus from LOCAL_SYLLABUS
  if (catalogCourses.length < 14) {
    LOCAL_SYLLABUS.forEach((s) => {
      const pTitle = prettyTitleFromFile(s.file);
      const key = cleanTitleKey(pTitle);
      if (!seenCatalog.has(key)) {
        seenCatalog.add(key);
        catalogCourses.push({
          title: pTitle,
          duration: durationForCourse(pTitle),
        });
      }
    });
  }

  // Keep a balanced 2-column count (up to 14)
  if (catalogCourses.length > 14) {
    catalogCourses = catalogCourses.slice(0, 14);
  }

  const otherCourses = catalogCourses;

  // Full-page image replacements (no headings/overlay — image only).
  const coverImage = options.coverImage || null;
  const pathImage = options.pathImage || defaultPathImg;

  // Learning path comes from the user (menu step 3); defaults fill the gap.
  const pathSteps = (Array.isArray(options.pathSteps) ? options.pathSteps : [])
    .map((s) => Array.isArray(s)
      ? [sanitize(s[0]), sanitize(s[1])]
      : [sanitize(s?.title), sanitize(s?.desc)])
    .filter(([t]) => t)
    .slice(0, 15);
  if (!pathSteps.length) DEFAULT_PATH_STEPS.forEach(([t, d]) => pathSteps.push([t, d]));

  const contact = data.meta.contact || {};
  const phone = sanitize(contact.phone || siteSettings?.contact_phone || '+91 63809 57390');
  const email = sanitize(contact.email && contact.email !== 'sales@marvelslice.com' ? contact.email : 'hr@marvelslice.com');
  const website = sanitize(contact.website || 'www.marvelslice.com');
  const address = sanitize(contact.address || siteSettings?.address || 'Marvel Slice — Institute for Software Learning, Chennai, Tamil Nadu, India');

  const title = sanitize(data.meta.title || course?.title || 'Professional Course');
  const verifiedDocDuration = options.docDuration || (options.docSections && options.docSections.duration) || extractDurationFromDoc(course?.rawText || course?.description || '', options.docFileName || '', title);
  const duration = sanitize(verifiedDocDuration || course?.duration || data.meta?.duration || durationForCourse(title));
  const mode = sanitize(data.meta.mode || course?.mode || 'Online / Classroom');
  const category = sanitize(data.meta.category || course?.category || 'Software Learning');

  const highlights = [
    ...(asList(data.overview?.keyHighlights).map(sanitize).filter(Boolean)),
    ...(asList(data.outcomes?.bulletPoints).map(sanitize).filter(Boolean)),
  ].slice(0, 6);
  if (!highlights.length) {
    highlights.push(
      'Hands-on live training with real-world projects',
      '1:1 mentorship and doubt-clearing support',
      'Career guidance, resume review & mock interviews',
      'Flexible online / classroom batches with LMS access',
    );
  }
  const outcomes = outcomesFor(title, modules.map((m) => ({ title: m.title, topics: m.topics })));
  const roles = rolesFor(title);
  const projectLevels = ['Beginner', 'Intermediate', 'Advanced', 'Advanced'];
  const projects = (asList(data.capstones?.projects).length
    ? asList(data.capstones.projects).slice(0, 4).map((p, i) => ({
      level: projectLevels[i] || 'Advanced',
      title: sanitize(p.title) || 'Project',
      desc: sanitize((p.paragraphs || [])[0] || p.description) || 'Build and deploy a portfolio-ready application.',
      tech: sanitize(p.techStack || p.tech || ''),
    }))
    : projectsFor(title, modules)).slice(0, 4);

  // Extract tools strictly from the syllabus modules / document (no hallucinated tools)
  const docTools = options.docTools || (options.docSections && options.docSections.tools) || [];
  const extractedTools = extractToolsFromSyllabus(modules, options.rawText || '');
  const finalTools = docTools.length ? docTools : (extractedTools.length ? extractedTools : toolsForTitle(title, (course?.projects || []).flatMap((p) => asList(p.technologies)), modules));
  const tools = finalTools.slice(0, 12);

  const skillSource = (data.techMatrix?.categories || []).flatMap((c) => c.items || []).map(sanitize).filter(Boolean);
  const skills = (skillSource.length ? skillSource : modules.flatMap((m) => m.topics).filter((t) => t.length > 3 && t.length < 42)).slice(0, 12);

  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.setLineHeightFactor(1.36);
  let cursorY = 0;

  const setFill = (c) => pdf.setFillColor(c[0], c[1], c[2]);
  const setText = (c) => pdf.setTextColor(c[0], c[1], c[2]);
  const setStroke = (c) => pdf.setDrawColor(c[0], c[1], c[2]);

  function paintBg(img) {
    if (bgStyle === 'template' && img) {
      try {
        const fmt = typeof img === 'string' && img.includes('image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(img, fmt, 0, 0, PAGE_W, PAGE_H);
        return;
      } catch { /* fall through to plain */ }
    }
    setFill(WHITE);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  }

  function newInnerPage() {
    pdf.addPage();
    paintBg(innerImg);
    cursorY = INNER_TOP;
  }

  function newPlainPage() {
    pdf.addPage();
    setFill(WHITE);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
    cursorY = 16;
  }

  function need(h, bottom = BODY_BOTTOM) {
    if (cursorY + h > bottom) {
      newInnerPage();
      return true;
    }
    return false;
  }

  function heading(main, accent) {
    need(24);
    cursorY += 2;
    pdf.setFontSize(17);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(main, MARGIN_X, cursorY + 5);
    const w = pdf.getTextWidth(`${main} `);
    setText(ORANGE);
    pdf.text(accent, MARGIN_X + w, cursorY + 5);
    cursorY += 11;
    setFill(ORANGE);
    pdf.rect(MARGIN_X, cursorY, 16, 1.4, 'F');
    cursorY += 7;
  }

  function para(text, size = 10) {
    const clean = sanitize(text);
    if (!clean) return;
    pdf.setFontSize(size);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const lines = pdf.splitTextToSize(clean, CONTENT_W);
    const lineH = size * 0.3528 * 1.36;
    need(lines.length * lineH + 3);
    pdf.text(lines, MARGIN_X, cursorY);
    cursorY += lines.length * lineH + 4.5;
  }

  function checkBullet(text, size = 10, maxW = CONTENT_W, x = MARGIN_X) {
    const clean = sanitize(text);
    if (!clean) return;
    pdf.setFontSize(size);
    pdf.setFont('Helvetica', 'normal');
    const lines = pdf.splitTextToSize(clean, maxW - 9);
    const lineH = size * 0.3528 * 1.36;
    need(lines.length * lineH + 3);
    setFill(ORANGE);
    pdf.circle(x + 2.6, cursorY - 1.2, 2.5, 'F');
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(size - 2.5);
    setText(WHITE);
    pdf.text('v', x + 2.6, cursorY + 0.1, { align: 'center' });
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(size);
    setText(BODY);
    pdf.text(lines, x + 9, cursorY);
    cursorY += lines.length * lineH + 3.2;
  }

  // ================= COVER (uploaded full-page image replaces everything) =================
  if (coverImage) {
    try {
      pdf.addImage(coverImage, 'JPEG', 0, 0, PAGE_W, PAGE_H);
    } catch {
      paintBg(coverImg);
    }
  } else {
  paintBg(coverImg);
  cursorY = COVER_TOP;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'normal');
  setText(BODY);
  pdf.text('Learn', MARGIN_X, cursorY);
  cursorY += 9;
  pdf.setFontSize(26);
  pdf.setFont('Helvetica', 'bold');
  setText(BLUE);
  const titleLines = pdf.splitTextToSize(title.toUpperCase(), CONTENT_W).slice(0, 3);
  pdf.text(titleLines, MARGIN_X, cursorY);
  cursorY += titleLines.length * 9.6 + 3;
  pdf.setFontSize(9.5);
  pdf.setFont('Helvetica', 'normal');
  setText(MUTED);
  pdf.text('Build Real Projects   |   Gain Practical Skills   |   Start Your Career', MARGIN_X, cursorY);
  cursorY += 8;
  // pills
  pdf.setFontSize(8);
  pdf.setFont('Helvetica', 'bold');
  let px = MARGIN_X;
  [`Duration: ${duration}`, `Mode: ${mode}`, category].forEach((p) => {
    const w = Math.min(pdf.getTextWidth(p) + 10, CONTENT_W);
    if (px + w > PAGE_W - MARGIN_X) { px = MARGIN_X; cursorY += 10; }
    setFill(WHITE);
    setStroke(BLUE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(px, cursorY, w, 7.5, 2, 2, 'FD');
    setText(BLUE);
    pdf.text(p, px + 5, cursorY + 5.2);
    px += w + 3;
  });
  cursorY += 13;
  // 3 feature bars
  const feats = [highlights[0] || 'Hands-on labs and live coding', highlights[1] || '1:1 guidance from engineers', highlights[2] || 'Resume, mock interviews & referrals'];
  const barColors = [BLUE, PURPLE, GREEN];
  const barTitles = ['PRACTICAL TRAINING', 'EXPERT MENTORSHIP', 'CAREER OUTCOMES'];
  feats.forEach((f, i) => {
    const fl = pdf.splitTextToSize(f, CONTENT_W - 30).slice(0, 1);
    const ch = 11.5;
    setFill(barColors[i % 3]);
    pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, ch, 2.5, 2.5, 'F');
    setFill(WHITE);
    pdf.circle(MARGIN_X + 9, cursorY + ch / 2, 4.5, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'bold');
    setText(barColors[i % 3]);
    pdf.text(barTitles[i % 3][0], MARGIN_X + 9, cursorY + ch / 2 + 2.8, { align: 'center' });
    pdf.setFontSize(8.2);
    setText(WHITE);
    pdf.text(barTitles[i % 3], MARGIN_X + 17, cursorY + 4.8);
    pdf.setFontSize(7.2);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(fl[0] || '', MARGIN_X + 17, cursorY + 8.8);
    cursorY += ch + 2.5;
  });
  cursorY += 1.5;
  // 4 badges
  const badges = ['Hands-on\nLearning', 'Real World\nProjects', 'Expert\nGuidance', 'Career\nSupport'];
  const badgeCols = [BLUE, PURPLE, ORANGE, GREEN];
  const bw = CONTENT_W / 4;
  badges.forEach((b, i) => {
    const cx = MARGIN_X + bw * i + bw / 2;
    setFill(SKY);
    pdf.circle(cx, cursorY + 6, 6.5, 'F');
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(badgeCols[i]);
    pdf.text(String(i + 1), cx, cursorY + 8.8, { align: 'center' });
    pdf.setFontSize(7.2);
    const bl = b.split('\n');
    setText(INK);
    pdf.text(bl[0], cx, cursorY + 16.5, { align: 'center' });
    pdf.text(bl[1], cx, cursorY + 20.0, { align: 'center' });
  });
  cursorY += 23.5;
  // TOC box
  const toc = ['About Program', 'Key Highlights & Pedagogy', 'Who Can Apply', 'Learning Path', `Curriculum (${modules.length} modules)`, 'Skills + Projects', 'Careers & Contact', `Explore Our Courses (${catalogCourses.length})`];
  const tocH = 10 + Math.ceil(toc.length / 2) * 5.8;
  setFill(WHITE);
  setStroke(BORDER);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, tocH, 2.5, 2.5, 'FD');
  pdf.setFontSize(8.5);
  pdf.setFont('Helvetica', 'bold');
  setText(NAVY);
  pdf.text("What's Inside This Brochure", MARGIN_X + 6, cursorY + 6.5);
  toc.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = MARGIN_X + 6 + col * (CONTENT_W / 2);
    const ty = cursorY + 12.5 + row * 5.8;
    setFill(ORANGE);
    pdf.circle(tx + 2.5, ty - 1.0, 2.0, 'F');
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(i + 1), tx + 2.5, ty + 0.1, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(sanitize(t), tx + 7.5, ty);
  });
  cursorY += tocH + 4.5;
  pdf.setFontSize(10.0);
  pdf.setFont('Helvetica', 'bolditalic');
  setText(NAVY);
  pdf.text('Turn Your Ideas Into Real Websites and Applications', MARGIN_X, cursorY + 2.5);
  } // end designed cover (skipped when a full-page cover image is used)

  // ================= ABOUT =================
  newInnerPage();
  heading('About ', 'Program');

  // 1. Deep Executive Summary / Institutional Rationale
  const aboutLead = sanitize(
    data.meta.description || course?.description ||
    `${title} at Marvel Slice is an intensive, industry-aligned career accelerator engineered to bridge the divide between theoretical fundamentals and real-world production engineering.`
  );
  const aboutSub = sanitize(
    data.meta.subtitle || course?.subtitle ||
    `Designed in collaboration with engineering leaders, the curriculum immerses learners in production-grade architectures, test-driven methodologies, and enterprise workflows, graduating candidates ready to excel in competitive technical environments.`
  );

  pdf.setFontSize(8.2);
  pdf.setFont('Helvetica', 'normal');
  setText(BODY);
  const leadLines = pdf.splitTextToSize(`${aboutLead} ${aboutSub}`, CONTENT_W).slice(0, 4);
  pdf.text(leadLines, MARGIN_X, cursorY);
  cursorY += leadLines.length * 4.3 + 3.5;

  // 2. Program Key Specifications Strip (4-column Card)
  const metaCardH = 17;
  setFill(SKY);
  setStroke(BORDER);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, metaCardH, 2.5, 2.5, 'FD');

  const infoCols = [
    ['LEARNING FORMAT', 'Mentor-led Live', 'Interactive Sessions'],
    ['DURATION & PACE', duration, 'Daily Practice Drills'],
    ['DELIVERY MODE', mode, 'Hands-on Code Labs'],
    ['CREDENTIALS', 'Industry Certified', 'Marvel Slice Verified'],
  ];
  const iw = CONTENT_W / 4;
  infoCols.forEach(([lbl, v1, v2], i) => {
    const ix = MARGIN_X + iw * i + 4;
    if (i > 0) {
      setStroke(BORDER);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN_X + iw * i, cursorY + 2.5, MARGIN_X + iw * i, cursorY + metaCardH - 2.5);
    }
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'bold');
    setText(MUTED);
    pdf.text(lbl, ix, cursorY + 5.2);

    pdf.setFontSize(8.2);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(pdf.splitTextToSize(v1, iw - 7)[0] || '', ix, cursorY + 10);

    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(pdf.splitTextToSize(v2, iw - 7)[0] || '', ix, cursorY + 14);
  });
  cursorY += metaCardH + 4;

  // 3. Core Program Pillars / Architecture (3 structured cards across 190mm)
  const pillars = programDimensionsFor(title);
  const pilColGap = 5;
  const pilCardW = (CONTENT_W - 2 * pilColGap) / 3;
  const pilCardH = 31;
  const pillarColors = [BLUE, PURPLE, GREEN];

  pillars.slice(0, 3).forEach((p, idx) => {
    const px = MARGIN_X + idx * (pilCardW + pilColGap);
    const pColor = pillarColors[idx] || BLUE;

    setFill(CARD);
    setStroke(BORDER);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(px, cursorY, pilCardW, pilCardH, 2.5, 2.5, 'FD');

    // Colored top accent stripe
    setFill(pColor);
    pdf.roundedRect(px, cursorY, pilCardW, 1.8, 1, 1, 'F');

    // Pillar step badge
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'bold');
    setText(pColor);
    pdf.text(`PILLAR 0${idx + 1}`, px + 3.5, cursorY + 6.5);

    // Pillar title
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    const pTitleLines = pdf.splitTextToSize(sanitize(p.title), pilCardW - 7).slice(0, 2);
    pdf.text(pTitleLines, px + 3.5, cursorY + 11.5);

    // Pillar description
    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const pDescLines = pdf.splitTextToSize(sanitize(p.desc), pilCardW - 7).slice(0, 3);
    pdf.text(pDescLines, px + 3.5, cursorY + 16.5);
  });
  cursorY += pilCardH + 5;

  // 4. What You Will Achieve (Heading + 8 Outcome Cards in 2 cols x 4 rows)
  pdf.setFontSize(12.5);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('What You Will', MARGIN_X, cursorY + 3.5);
  const reachW = pdf.getTextWidth('What You Will') + 2.8;
  setText(ORANGE);
  pdf.text('Achieve', MARGIN_X + reachW, cursorY + 3.5);
  cursorY += 8.5;

  const outColGap = 5;
  const outCardW = (CONTENT_W - outColGap) / 2;
  const outCardH = 17.0;
  const outRowGap = 2.4;
  const deepOutcomes = outcomes.slice(0, 8);

  deepOutcomes.forEach((o, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const ox = MARGIN_X + colIdx * (outCardW + outColGap);
    const oy = cursorY + rowIdx * (outCardH + outRowGap);

    setFill(WHITE);
    setStroke(BORDER);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(ox, oy, outCardW, outCardH, 2, 2, 'FD');

    // Emerald checkmark icon circle
    setFill([16, 185, 129]);
    pdf.circle(ox + 5.5, oy + outCardH / 2, 3.0, 'F');
    setStroke(WHITE);
    pdf.setLineWidth(0.45);
    pdf.line(ox + 4.2, oy + outCardH / 2, ox + 5.1, oy + outCardH / 2 + 1.1);
    pdf.line(ox + 5.1, oy + outCardH / 2 + 1.1, ox + 6.8, oy + outCardH / 2 - 1.1);

    // Outcome text
    pdf.setFontSize(7.4);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const oLines = pdf.splitTextToSize(sanitize(o), outCardW - 14).slice(0, 3);
    const lineSpacing = 7.4 * 0.3528 * 1.36;
    const textStartY = oy + (outCardH - (oLines.length - 1) * lineSpacing) / 2 + 0.8;
    pdf.text(oLines, ox + 11.5, textStartY);
  });
  cursorY += 4 * (outCardH + outRowGap) + 3;

  // ================= KEY HIGHLIGHTS & PROGRAM PEDAGOGY =================
  newInnerPage();
  // 1. Key Highlights Header
  heading('Key ', 'Highlights');

  const keyHL = (Array.isArray(data.keyHighlights) && data.keyHighlights.length
    ? data.keyHighlights
    : keyHighlightsFor(title, duration, modules)).slice(0, 20);

  const halfHL = Math.ceil(keyHL.length / 2);
  const colWHL = (CONTENT_W - 8) / 2;
  const colXL = MARGIN_X;
  const colXR = MARGIN_X + colWHL + 8;
  const hlLeft = keyHL.slice(0, halfHL);
  const hlRight = keyHL.slice(halfHL);

  // Synchronized row-by-row rendering for 100% horizontal alignment
  pdf.setFontSize(8.0);
  for (let r = 0; r < halfHL; r++) {
    const itemL = hlLeft[r];
    const itemR = hlRight[r];
    const cleanL = sanitize(itemL || '');
    const cleanR = sanitize(itemR || '');

    const linesL = cleanL ? pdf.splitTextToSize(cleanL, colWHL - 9) : [];
    const linesR = cleanR ? pdf.splitTextToSize(cleanR, colWHL - 9) : [];
    const maxLines = Math.max(linesL.length || 1, linesR.length || 1);
    const rowH = Math.max(6.2, maxLines * 4.2 + 1.8);

    if (cleanL) {
      setFill(ORANGE);
      pdf.circle(colXL + 2.5, cursorY + 2.5, 2.2, 'F');
      setStroke(WHITE);
      pdf.setLineWidth(0.45);
      pdf.line(colXL + 1.6, cursorY + 2.5, colXL + 2.3, cursorY + 3.3);
      pdf.line(colXL + 2.3, cursorY + 3.3, colXL + 3.5, cursorY + 1.6);

      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(linesL, colXL + 7.2, cursorY + 3.4);
    }

    if (cleanR) {
      setFill(ORANGE);
      pdf.circle(colXR + 2.5, cursorY + 2.5, 2.2, 'F');
      setStroke(WHITE);
      pdf.setLineWidth(0.45);
      pdf.line(colXR + 1.6, cursorY + 2.5, colXR + 2.3, cursorY + 3.3);
      pdf.line(colXR + 2.3, cursorY + 3.3, colXR + 3.5, cursorY + 1.6);

      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(linesR, colXR + 7.2, cursorY + 3.4);
    }

    cursorY += rowH;
  }

  cursorY += 5;

  // 2. Program Pedagogy Header
  heading('Program ', 'Pedagogy');

  const pedList = (Array.isArray(data.pedagogy) && data.pedagogy.length >= 4
    ? data.pedagogy
    : pedagogyFor(title)).slice(0, 8);

  function drawPedagogyIcon(key, x, y) {
    // Orange rounded icon box
    setFill(WHITE);
    setStroke(ORANGE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, 12, 12, 2.5, 2.5, 'FD');

    setStroke(ORANGE);
    setFill(ORANGE);
    pdf.setLineWidth(0.5);
    const k = String(key || '').toLowerCase();
    if (k.includes('instructor') || k.includes('train')) {
      // Computer monitor
      pdf.roundedRect(x + 2.4, y + 2.4, 7.2, 5.0, 0.6, 0.6, 'S');
      pdf.line(x + 6.0, y + 7.4, x + 6.0, y + 9.4);
      pdf.line(x + 4.2, y + 9.4, x + 7.8, y + 9.4);
    } else if (k.includes('hack') || k.includes('code')) {
      // </> brackets
      pdf.setFontSize(6.5);
      pdf.setFont('Helvetica', 'bold');
      setText(ORANGE);
      pdf.text('</>', x + 6.0, y + 7.8, { align: 'center' });
    } else if (k.includes('support') || k.includes('team') || k.includes('management')) {
      // Target / Bullseye
      pdf.circle(x + 6.0, y + 6.0, 3.4, 'S');
      pdf.circle(x + 6.0, y + 6.0, 1.4, 'F');
    } else if (k.includes('network') || k.includes('peer') || k.includes('group')) {
      // Connected nodes
      pdf.circle(x + 3.8, y + 7.8, 1.5, 'F');
      pdf.circle(x + 8.2, y + 4.2, 1.5, 'F');
      pdf.line(x + 3.8, y + 7.8, x + 8.2, y + 4.2);
    } else if (k.includes('video') || k.includes('self')) {
      // Play triangle
      pdf.triangle(x + 4.5, y + 3.4, x + 4.5, y + 8.6, x + 8.6, y + 6.0, 'F');
    } else if (k.includes('gamified') || k.includes('game') || k.includes('quiz')) {
      // Target ring with filled center
      pdf.circle(x + 6.0, y + 6.0, 3.5, 'S');
      pdf.circle(x + 6.0, y + 6.0, 1.8, 'F');
    } else if (k.includes('project') || k.includes('exercise')) {
      // Diamond
      pdf.line(x + 6.0, y + 2.5, x + 9.2, y + 6.0);
      pdf.line(x + 9.2, y + 6.0, x + 6.0, y + 9.5);
      pdf.line(x + 6.0, y + 9.5, x + 2.8, y + 6.0);
      pdf.line(x + 2.8, y + 6.0, x + 6.0, y + 2.5);
    } else if (k.includes('mentor') || k.includes('1:1') || k.includes('person')) {
      // Person / mentor
      pdf.circle(x + 6.0, y + 4.0, 1.5, 'F');
      pdf.line(x + 3.5, y + 8.5, x + 8.5, y + 8.5);
      pdf.line(x + 6.0, y + 6.0, x + 6.0, y + 8.5);
    } else {
      pdf.rect(x + 3.0, y + 3.0, 6.0, 4.0, 'S');
      pdf.line(x + 4.0, y + 8.5, x + 8.0, y + 8.5);
    }
  }

  // 2 columns in line (4 rows × 2 columns = 8 cards, perfectly matching reference design)
  const gapP = 8;
  const pCardW = (CONTENT_W - gapP) / 2; // (190 - 8) / 2 = 91mm
  const pCardH = 19.5;
  const pedRowGap = 3.2;
  const startYPed = cursorY;

  const leftCards = pedList.slice(0, 4);
  const rightCards = pedList.slice(4, 8);

  for (let r = 0; r < 4; r++) {
    const rowY = startYPed + r * (pCardH + pedRowGap);
    const pLeft = leftCards[r];
    const pRight = rightCards[r];
    const pair = [pLeft, pRight];

    pair.forEach((p, cIdx) => {
      if (!p) return;
      const cardX = MARGIN_X + cIdx * (pCardW + gapP);
      const pTitle = sanitize(p.title || 'Learning Pillar');
      const pDesc = sanitize(p.desc || p.description || '');

      // Subtle Outer Card Box
      setFill(WHITE);
      setStroke(BORDER);
      pdf.setLineWidth(0.35);
      pdf.roundedRect(cardX, rowY, pCardW, pCardH, 2.5, 2.5, 'FD');

      // Orange Vector Icon Box on left
      drawPedagogyIcon(p.key || pTitle, cardX + 3.5, rowY + 3.75);

      // Title
      pdf.setFontSize(8.8);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      const titleLines = pdf.splitTextToSize(pTitle, pCardW - 20).slice(0, 2);
      pdf.text(titleLines, cardX + 18.0, rowY + 6.8);

      // Description
      pdf.setFontSize(7.2);
      pdf.setFont('Helvetica', 'normal');
      setText(MUTED);
      const descLines = pdf.splitTextToSize(pDesc, pCardW - 20).slice(0, 2);
      pdf.text(descLines, cardX + 18.0, rowY + 12.6);
    });
  }

  cursorY = startYPed + 4 * (pCardH + pedRowGap) + 4;

  // ================= WHO CAN APPLY + ONBOARDING JOURNEY =================
  newInnerPage();
  heading('Who Can ', 'Apply?');

  pdf.setFontSize(8.5);
  pdf.setFont('Helvetica', 'normal');
  setText(BODY);
  pdf.text('Open to passionate learners and professionals across diverse academic, analytical, and technical backgrounds.', MARGIN_X, cursorY);
  cursorY += 5.5;

  // 1. 6 Target Audience Profile Cards (2 cols x 3 rows)
  const audienceList = targetAudienceDetailedFor(title, modules.length);
  const audColGap = 5;
  const audCardW = (CONTENT_W - audColGap) / 2;
  const audCardH = 18.5;
  const audRowGap = 2.4;

  audienceList.slice(0, 6).forEach((aud, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const ax = MARGIN_X + colIdx * (audCardW + audColGap);
    const ay = cursorY + rowIdx * (audCardH + audRowGap);

    setFill(CARD);
    setStroke([254, 215, 170]); // amber-200
    pdf.setLineWidth(0.35);
    pdf.roundedRect(ax, ay, audCardW, audCardH, 2, 2, 'FD');

    // Left amber checkmark badge
    setFill(ORANGE);
    pdf.circle(ax + 5.5, ay + 5.8, 2.8, 'F');
    setStroke(WHITE);
    pdf.setLineWidth(0.45);
    pdf.line(ax + 4.3, ay + 5.8, ax + 5.1, ay + 6.9);
    pdf.line(ax + 5.1, ay + 6.9, ax + 6.7, ay + 4.8);

    // Persona title
    pdf.setFontSize(7.8);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(sanitize(aud.title), ax + 11, ay + 5.8);

    // Persona description
    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'normal');
    setText(MUTED);
    const audLines = pdf.splitTextToSize(sanitize(aud.desc), audCardW - 14).slice(0, 2);
    pdf.text(audLines, ax + 11, ay + 10.4);
  });
  cursorY += 3 * (audCardH + audRowGap) + 3.5;

  // 2. Prerequisites & Technical Eligibility Banner (3 columns)
  const prereqH = 20;
  setFill(SKY);
  setStroke([191, 219, 254]); // blue-200
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, prereqH, 2.5, 2.5, 'FD');

  // Blue left accent bar
  setFill(BLUE);
  pdf.roundedRect(MARGIN_X, cursorY, 2.5, prereqH, 1, 1, 'F');

  // Banner Header Tag
  pdf.setFontSize(6.8);
  pdf.setFont('Helvetica', 'bold');
  setText(BLUE);
  pdf.text('ELIGIBILITY & TECHNICAL PREREQUISITES', MARGIN_X + 6, cursorY + 5.0);

  const prereqItems = prerequisitesFor(title);
  const prereqCols = [
    {
      label: 'Academic Eligibility',
      val: 'Any degree / diploma (BE, BTech, BSc, BCA, BCom, or equivalent stream).',
    },
    {
      label: 'Prior Coding Background',
      val: prereqItems[2] || 'Zero prior programming required — starts from absolute fundamentals.',
    },
    {
      label: 'System & Hardware Setup',
      val: 'Laptop/PC with 8GB RAM, modern web browser, and broadband internet.',
    },
  ];

  const pw = (CONTENT_W - 8) / 3;
  prereqCols.forEach((pc, pi) => {
    const px = MARGIN_X + 6 + pi * pw;
    if (pi > 0) {
      setStroke([226, 232, 240]);
      pdf.setLineWidth(0.3);
      pdf.line(px - 3, cursorY + 7.0, px - 3, cursorY + prereqH - 2);
    }
    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(pc.label, px, cursorY + 10.2);

    pdf.setFontSize(6.3);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const pLines = pdf.splitTextToSize(pc.val, pw - 6).slice(0, 2);
    pdf.text(pLines, px, cursorY + 14.5);
  });
  cursorY += prereqH + 4;

  // 3. Application & Onboarding Journey (4 full-width cards)
  pdf.setFontSize(12);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Application &', MARGIN_X, cursorY + 3);
  const appW = pdf.getTextWidth('Application &') + 2.8;
  setText(ORANGE);
  pdf.text('Onboarding Journey', MARGIN_X + appW, cursorY + 3);
  cursorY += 8;

  const journeySteps = [
    ['01', 'SUBMIT APPLICATION & PROFILE REVIEW', 'Submit your academic details and career aspirations through our admissions form for instant evaluation.'],
    ['02', '1:1 CAREER COUNSELLING & ROADMAP', 'Connect with an engineering career advisor to review syllabus fit, batch timings, and learning milestones.'],
    ['03', 'ENROLLMENT & LMS ONBOARDING', 'Confirm your batch seat, receive your Marvel Slice student portal login credentials, and join the cohort community.'],
    ['04', 'ORIENTATION & MENTOR MATCH', 'Attend the live orientation session, configure your developer tooling, and start Module 1 with dedicated mentor support.'],
  ];

  const stepCardH = 13.5;
  const stepRowGap = 2.4;

  journeySteps.forEach(([num, st, sd], idx) => {
    const sy = cursorY + idx * (stepCardH + stepRowGap);

    setFill(WHITE);
    setStroke([254, 215, 170]); // amber-200
    pdf.setLineWidth(0.35);
    pdf.roundedRect(MARGIN_X, sy, CONTENT_W, stepCardH, 2, 2, 'FD');

    // Step number pill
    setFill(ORANGE);
    pdf.circle(MARGIN_X + 7, sy + stepCardH / 2, 4.0, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(num, MARGIN_X + 7, sy + stepCardH / 2 + 1.2, { align: 'center' });

    // Step title
    pdf.setFontSize(7.8);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(st, MARGIN_X + 14.5, sy + 5.2);

    // Step description
    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const sdLine = pdf.splitTextToSize(sd, CONTENT_W - 18)[0] || '';
    pdf.text(sdLine, MARGIN_X + 14.5, sy + 10.2);
  });
  cursorY += 4 * (stepCardH + stepRowGap) + 3;

  // ================= LEARNING PATH (uploaded or default image replaces the steps page) =================
  if (pathImage) {
    pdf.addPage();
    try {
      const fmt = typeof pathImage === 'string' && pathImage.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(pathImage, fmt, 0, 0, PAGE_W, PAGE_H);
    } catch {
      paintBg(innerImg);
    }
  } else {
  newInnerPage();
  heading('Learning ', 'Path');

  const cols = [BLUE, ORANGE, GREEN];
  const totalSteps = pathSteps.length;
  // Calculate exact step height so all steps fit on this single page without overflow
  const availableH = 218 - cursorY;
  const stepH = Math.min(13.8, availableH / Math.max(totalSteps, 1));

  pathSteps.forEach(([t, d], i) => {
    const stepY = cursorY + i * stepH;
    const col = cols[i % 3];

    // Step Number Circle Badge
    setFill(col);
    pdf.circle(MARGIN_X + 4.5, stepY + 4.2, 3.2, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(i + 1), MARGIN_X + 4.5, stepY + 5.4, { align: 'center' });

    // Step Title
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(sanitize(t), MARGIN_X + 11.5, stepY + 3.8);

    // Step Description (1 clean line with proper spacing)
    pdf.setFontSize(7.2);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const dl = pdf.splitTextToSize(sanitize(d), CONTENT_W - 14).slice(0, 1);
    pdf.text(dl[0] || '', MARGIN_X + 11.5, stepY + 8.4);

    // Timeline connector line to next step
    if (i < totalSteps - 1) {
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.line(MARGIN_X + 4.5, stepY + 8.4, MARGIN_X + 4.5, stepY + stepH + 0.5);
    }
  });

  cursorY += totalSteps * stepH + 4;
  } // end steps path (skipped when a full-page path image is used)

  // ================= CURRICULUM (2 modules/page, 2 columns with short description & hands-on lab) =================
  const perPage = 2;
  const gapC = 8;
  const colWC = (CONTENT_W - gapC) / 2; // (190 - 8) / 2 = 91mm

  for (let g = 0; g * perPage < Math.max(modules.length, 1); g += 1) {
    newInnerPage();
    const pageNum = g + 1;
    const totalPages = Math.ceil(modules.length / perPage);
    heading('Program ', 'Curriculum');
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'normal');
    setText(MUTED);
    pdf.text(`Comprehensive Practical Syllabus  •  Part ${pageNum} of ${totalPages}`, MARGIN_X, cursorY);
    cursorY += 7;

    const pair = modules.slice(g * perPage, g * perPage + perPage);
    const startY = cursorY;
    const m0 = pair[0];
    const m1 = pair[1];

    // Compute synchronized title & description heights across both columns
    const cleanTitle0 = m0
      ? sanitize(m0.title || '')
          .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
          .replace(/^[—–-]\s*/, '')
          .trim() || 'Core Engineering'
      : '';
    const cleanTitle1 = m1
      ? sanitize(m1.title || '')
          .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
          .replace(/^[—–-]\s*/, '')
          .trim() || 'Core Engineering'
      : '';

    const desc0 = m0 ? moduleDescriptionFor(m0, title) : '';
    const desc1 = m1 ? moduleDescriptionFor(m1, title) : '';

    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    const titleLines0 = cleanTitle0 ? pdf.splitTextToSize(cleanTitle0, colWC).slice(0, 2) : [];
    const titleLines1 = cleanTitle1 ? pdf.splitTextToSize(cleanTitle1, colWC).slice(0, 2) : [];
    const maxTitleLines = Math.max(titleLines0.length || 1, titleLines1.length || 1);
    const titleH = maxTitleLines * 5.4 + 2.0;

    pdf.setFontSize(8.0);
    pdf.setFont('Helvetica', 'normal');
    const descLines0 = desc0 ? pdf.splitTextToSize(sanitize(desc0), colWC).slice(0, 3) : [];
    const descLines1 = desc1 ? pdf.splitTextToSize(sanitize(desc1), colWC).slice(0, 3) : [];
    const maxDescLines = Math.max(descLines0.length || 1, descLines1.length || 1);
    const descH = maxDescLines * 4.2 + 2.5;

    const dividerY = startY + 8.5 + titleH + descH;
    const topicsStartY = dividerY + 5.0;

    // Anchor positions for lower cards (ensuring uniform horizontal alignment and zero blank voids)
    const toolsY = 153;
    const toolsH = 13.5;
    const compY = 169.5;
    const compH = 14.5;
    const labY = 187;
    const labH = 35; // Ends at 222mm, leaving safe 8mm clearance before 230mm BODY_BOTTOM

    pair.forEach((m, k) => {
      const colX = MARGIN_X + k * (colWC + gapC);
      const cleanTitle = k === 0 ? cleanTitle0 : cleanTitle1;
      const titleLines = k === 0 ? titleLines0 : titleLines1;
      const descLines = k === 0 ? descLines0 : descLines1;

      // 1. Module Label Badge
      setFill(ORANGE);
      pdf.roundedRect(colX, startY, 26, 6, 1.8, 1.8, 'F');
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(String(m.label || `Module ${g * 2 + k + 1}`).toUpperCase(), colX + 13, startY + 4.3, { align: 'center' });

      // 2. Module Title
      pdf.setFontSize(11);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      pdf.text(titleLines, colX, startY + 8.5 + 4.0);

      // 3. Short Description
      pdf.setFontSize(8.0);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(descLines, colX, startY + 8.5 + titleH + 3.0);

      // 4. Synchronized Subtle Divider
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.line(colX, dividerY, colX + colWC, dividerY);

      // 5. Module Topics (clean & deduplicated, strictly non-colliding)
      const rawTopics = (m.topics || []).map((t) =>
        sanitize(t)
          .replace(/^[-•*◦▪]\s*/, '')
          .replace(/^(?:module|chapter|unit|part)\s*\d+[:\-.]?\s*/i, '')
          .replace(/^L\d+\s*[-–]\s*/i, '')
          .trim()
      ).filter((t) => t && t.toLowerCase() !== cleanTitle.toLowerCase());
      const topicList = [...new Set(rawTopics)].slice(0, 8);

      const availableTopicsH = toolsY - topicsStartY - 8;
      const baseSpacing = Math.min(10.0, Math.max(7.0, availableTopicsH / Math.max(topicList.length, 1)));
      let curY = topicsStartY;

      pdf.setFontSize(8.2);
      topicList.forEach((t) => {
        const bl = pdf.splitTextToSize(sanitize(t), colWC - 7).slice(0, 2);
        const extraH = (bl.length - 1) * 3.8;
        if (curY + baseSpacing + extraH > toolsY - 2) return;

        setFill(BLUE);
        pdf.circle(colX + 2, curY + 2.0, 1.1, 'F');
        pdf.setFont('Helvetica', 'normal');
        setText(BODY);
        pdf.text(bl, colX + 6.0, curY + 3.2);
        curY += baseSpacing + extraH;
      });

      // 6. Tools & Environment Card (Y = 153mm, H = 13.5mm)
      setFill(CARD);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(colX, toolsY, colWC, toolsH, 2, 2, 'FD');

      pdf.setFontSize(6.8);
      pdf.setFont('Helvetica', 'bold');
      setText(MUTED);
      pdf.text('TOOLS & ENVIRONMENT', colX + 4.5, toolsY + 4.2);

      const tools = moduleToolsFor(m, finalTools);
      let tagX = colX + 4.5;
      pdf.setFontSize(7.0);
      pdf.setFont('Helvetica', 'bold');
      tools.forEach((tl) => {
        const tw = pdf.getTextWidth(tl) + 4.5;
        if (tagX + tw <= colX + colWC - 3) {
          setFill([239, 246, 255]);
          setStroke([191, 219, 254]);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(tagX, toolsY + 5.8, tw, 5.2, 1.2, 1.2, 'FD');
          setText(BLUE);
          pdf.text(tl, tagX + 2.25, toolsY + 9.5);
          tagX += tw + 2.0;
        }
      });

      // 7. Key Competency Card (Y = 169.5mm, H = 14.5mm)
      setFill(CARD);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(colX, compY, colWC, compH, 2, 2, 'FD');
      setFill(ORANGE);
      pdf.roundedRect(colX, compY, 2.5, compH, 1, 1, 'F');

      pdf.setFontSize(6.8);
      pdf.setFont('Helvetica', 'bold');
      setText(ORANGE);
      pdf.text('KEY COMPETENCY GAINED', colX + 5.5, compY + 4.2);

      const takeaway = moduleTakeawayFor(m);
      pdf.setFontSize(7.2);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      const takeLines = pdf.splitTextToSize(sanitize(takeaway), colWC - 8).slice(0, 2);
      pdf.text(takeLines, colX + 5.5, compY + 8.8);

      // 8. Technical Drill & Practical Lab Card (Y = 187mm, H = 35mm)
      setFill(CARD);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(colX, labY, colWC, labH, 2, 2, 'FD');
      setFill(BLUE);
      pdf.roundedRect(colX, labY, 2.5, labH, 1, 1, 'F');

      pdf.setFontSize(7.2);
      pdf.setFont('Helvetica', 'bold');
      setText(BLUE);
      pdf.text('TECHNICAL DRILL & PRACTICAL LAB', colX + 5.5, labY + 5.2);

      pdf.setFontSize(7.4);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      const labText = moduleHandsOnLabFor(m);
      const labLines = pdf.splitTextToSize(sanitize(labText), colWC - 9).slice(0, 4);
      pdf.text(labLines, colX + 5.5, labY + 10.8);

      // Deliverable sub-bar
      setStroke([226, 232, 240]);
      pdf.setLineWidth(0.3);
      pdf.line(colX + 5.5, labY + 27.0, colX + colWC - 4, labY + 27.0);

      pdf.setFontSize(6.6);
      pdf.setFont('Helvetica', 'bold');
      setText(MUTED);
      pdf.text('PRACTICE FOCUS:', colX + 5.5, labY + 31.5);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text('Hands-on coding exercises, syntax drills & mentor validation.', colX + 28.5, labY + 31.5);
    });
  }
  if (!modules.length) {
    newInnerPage();
    heading('Program ', 'Curriculum');
    para('Detailed module-wise syllabus is shared during counselling — every topic is taught with live examples and exercises.');
  }

  // Helper: Vector wrench icon
  function drawWrenchIcon(x, y) {
    setStroke([29, 78, 216]);
    setFill([29, 78, 216]);
    pdf.setLineWidth(0.4);
    pdf.circle(x + 1.2, y - 0.2, 1.0, 'S');
    pdf.line(x + 1.7, y + 0.3, x + 3.2, y + 1.8);
  }

  // Helper: Vector briefcase icon
  function drawBriefcaseIcon(x, y) {
    setStroke([4, 120, 87]);
    setFill([4, 120, 87]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y - 1.0, 3.4, 2.5, 0.4, 0.4, 'S');
    pdf.rect(x + 0.9, y - 1.8, 1.6, 0.8, 'S');
    pdf.line(x, y + 0.2, x + 3.4, y + 0.2);
  }

  // Helper: Vector globe / web icon
  function drawGlobeIcon(x, y, color = BLUE) {
    setStroke(color);
    pdf.setLineWidth(0.35);
    pdf.circle(x + 2.5, y + 2.5, 2.3, 'S');
    pdf.line(x + 0.2, y + 2.5, x + 4.8, y + 2.5); // Equator
    pdf.line(x + 2.5, y + 0.2, x + 2.5, y + 4.8); // Prime meridian
    pdf.ellipse(x + 2.5, y + 2.5, 1.2, 2.3, 'S'); // Curved meridian
  }

  // Helper: Vector envelope / email icon
  function drawEmailIcon(x, y, color = ORANGE) {
    setStroke(color);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x + 0.2, y + 0.7, 4.8, 3.6, 0.4, 0.4, 'S');
    pdf.line(x + 0.2, y + 0.7, x + 2.6, y + 2.6);
    pdf.line(x + 2.6, y + 2.6, x + 5.0, y + 0.7);
  }

  // Helper: Vector phone icon
  function drawPhoneIcon(x, y, color = [4, 120, 87]) {
    setStroke(color);
    setFill(color);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x + 0.8, y + 0.3, 3.4, 4.8, 0.6, 0.6, 'S');
    pdf.line(x + 1.8, y + 0.9, x + 3.2, y + 0.9);
    pdf.circle(x + 2.5, y + 4.3, 0.35, 'F');
  }

  // ================= TECHNOLOGIES, TOOLS & COURSE PROJECTS (1 PAGE) =================
  newInnerPage();

  // 1. TECHNOLOGIES & TOOLS (Section 1 - Top)
  drawWrenchIcon(MARGIN_X + 2, cursorY + 3.5);
  pdf.setFontSize(14);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Technologies & Tools You Will Master', MARGIN_X + 7, cursorY + 5);
  cursorY += 9;
  setFill(BLUE);
  pdf.rect(MARGIN_X, cursorY, 20, 1.2, 'F');
  cursorY += 6;

  let sx = MARGIN_X;
  let sy = cursorY;
  const allTools = [...new Set([...tools, ...skills])].slice(0, 12);
  allTools.forEach((t) => {
    const clean = sanitize(t);
    if (!clean) return;
    pdf.setFontSize(8.0);
    pdf.setFont('Helvetica', 'bold');
    const wText = pdf.getTextWidth(clean);
    const pillW = Math.min(wText + 12, CONTENT_W);
    if (sx + pillW > PAGE_W - MARGIN_X) {
      sx = MARGIN_X;
      sy += 8.2;
    }

    setFill([239, 246, 255]);   // soft light blue
    setStroke([191, 219, 254]); // blue-200 border
    pdf.setLineWidth(0.35);
    pdf.roundedRect(sx, sy, pillW, 6.8, 3.4, 3.4, 'FD');

    drawWrenchIcon(sx + 2.4, sy + 3.4);

    setText([29, 78, 216]);     // blue-700
    pdf.text(clean, sx + 7.2, sy + 4.8);
    sx += pillW + 2.8;
  });
  cursorY = sy + 12.5;

  // Subtle separator between Technologies and Projects
  setStroke(BORDER);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN_X, cursorY, MARGIN_X + CONTENT_W, cursorY);
  cursorY += 6.0;

  // 2. COURSE PROJECTS (Section 2 - 4 Projects: 1 Beginner, 1 Intermediate, 2 Advanced)
  pdf.setFontSize(14);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Course ', MARGIN_X, cursorY + 4);
  const wCourse = pdf.getTextWidth('Course ');
  setText(ORANGE);
  pdf.text('Projects', MARGIN_X + wCourse, cursorY + 4);
  cursorY += 8;
  setFill(ORANGE);
  pdf.rect(MARGIN_X, cursorY, 20, 1.2, 'F');
  cursorY += 4.5;

  pdf.setFontSize(7.8);
  pdf.setFont('Helvetica', 'normal');
  setText(MUTED);
  pdf.text('Industry-grade portfolio applications built step-by-step from beginner to advanced.', MARGIN_X, cursorY);
  cursorY += 5.5;

  const cardGap = 6;
  const cardW = (CONTENT_W - cardGap) / 2; // (190 - 6) / 2 = 92mm
  const cardH = 58;
  const rowGap = 5;
  const gridStartY = cursorY;

  const projList = projects.slice(0, 4);
  const levelStyles = [
    { level: 'BEGINNER', color: GREEN, badgeW: 24 },
    { level: 'INTERMEDIATE', color: BLUE, badgeW: 28 },
    { level: 'ADVANCED', color: PURPLE, badgeW: 24 },
    { level: 'ADVANCED', color: ORANGE, badgeW: 24 },
  ];

  projList.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = MARGIN_X + col * (cardW + cardGap);
    const rowY = gridStartY + row * (cardH + rowGap);
    const style = levelStyles[idx] || { level: String(p.level || 'PROJECT').toUpperCase(), color: BLUE, badgeW: 24 };

    // Card background
    setFill(CARD);
    setStroke(BORDER);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, rowY, cardW, cardH, 2.5, 2.5, 'FD');

    // Left accent strip
    setFill(style.color);
    pdf.roundedRect(x, rowY, 2.5, cardH, 1, 1, 'F');

    // Level badge
    setFill(style.color);
    pdf.roundedRect(x + 5.5, rowY + 4.5, style.badgeW, 5.2, 1.5, 1.5, 'F');
    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(style.level, x + 5.5 + style.badgeW / 2, rowY + 8.2, { align: 'center' });

    // Project Number Tag
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'bold');
    setText(MUTED);
    pdf.text(`0${idx + 1}`, x + cardW - 5.5, rowY + 8.5, { align: 'right' });

    // Project Title
    pdf.setFontSize(9.5);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    const titleLines = pdf.splitTextToSize(sanitize(p.title), cardW - 12).slice(0, 2);
    pdf.text(titleLines, x + 5.5, rowY + 14.5);

    // Project Description
    pdf.setFontSize(7.4);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const descLines = pdf.splitTextToSize(sanitize(p.desc), cardW - 12).slice(0, 3);
    pdf.text(descLines, x + 5.5, rowY + 25.5);

    // Divider for Tech Stack
    setStroke([226, 232, 240]);
    pdf.setLineWidth(0.3);
    pdf.line(x + 5.5, rowY + 45.0, x + cardW - 5.5, rowY + 45.0);

    // Stack line
    pdf.setFontSize(6.6);
    pdf.setFont('Helvetica', 'bold');
    setText(MUTED);
    pdf.text('STACK:', x + 5.5, rowY + 50.5);

    pdf.setFontSize(6.8);
    pdf.setFont('Helvetica', 'normal');
    setText(BLUE);
    const techStr = (p.tech || 'Core Stack • APIs • Deployment').replace(/,\s*$/, '');
    pdf.text(pdf.splitTextToSize(sanitize(techStr), cardW - 24).slice(0, 1), x + 18.5, rowY + 50.5);
  });

  cursorY = gridStartY + 2 * cardH + rowGap + 5;

  // ================= CAREERS & CONTACT US =================
  newInnerPage();

  // 1. Career Roles & Opportunities Heading & Icon
  setStroke([16, 185, 129]); // emerald
  setFill([16, 185, 129]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(MARGIN_X, cursorY + 1.2, 4.5, 3.4, 0.5, 0.5, 'S');
  pdf.rect(MARGIN_X + 1.2, cursorY + 0.2, 2.1, 1.0, 'S');
  pdf.line(MARGIN_X, cursorY + 2.8, MARGIN_X + 4.5, cursorY + 2.8);

  pdf.setFontSize(15);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Career Roles &', MARGIN_X + 6.5, cursorY + 4.5);
  const crW = pdf.getTextWidth('Career Roles &') + 2.5;
  setText(ORANGE);
  pdf.text('Opportunities', MARGIN_X + 6.5 + crW, cursorY + 4.5);
  cursorY += 8.5;
  setFill(ORANGE);
  pdf.rect(MARGIN_X, cursorY, 16, 1.2, 'F');
  cursorY += 5.5;

  // Career Roles pills (soft light green with briefcase icon)
  let rx = MARGIN_X;
  let ry = cursorY;
  const pillH = 7.0;
  roles.slice(0, 6).forEach(([role]) => {
    const clean = sanitize(role);
    if (!clean) return;
    pdf.setFontSize(7.8);
    pdf.setFont('Helvetica', 'bold');
    const wText = pdf.getTextWidth(clean);
    const pillW = Math.min(wText + 12, CONTENT_W);
    if (rx + pillW > PAGE_W - MARGIN_X) {
      rx = MARGIN_X;
      ry += pillH + 2.2;
    }

    setFill([236, 253, 245]);   // soft light green
    setStroke([167, 243, 208]); // emerald-200 border
    pdf.setLineWidth(0.35);
    pdf.roundedRect(rx, ry, pillW, pillH, 3.5, 3.5, 'FD');

    drawBriefcaseIcon(rx + 2.5, ry + 3.5);

    setText([4, 120, 87]);      // emerald-700
    pdf.text(clean, rx + 7.5, ry + 4.9);
    rx += pillW + 3.0;
  });
  cursorY = ry + pillH + 4.5;

  // 2. Career Services & Placement Assistance (2 columns x 3 rows)
  pdf.setFontSize(11);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Career Services &', MARGIN_X, cursorY + 3.2);
  const csW = pdf.getTextWidth('Career Services &') + 2.5;
  setText(ORANGE);
  pdf.text('Placement Assistance', MARGIN_X + csW, cursorY + 3.2);
  cursorY += 7.0;

  const careerServices = [
    ['Career Roadmaps & Strategy', '1:1 technical career planning aligned to your profile.'],
    ['Technical Mock Interviews', 'Practice with FAANG & enterprise interview drills.'],
    ['Resume & LinkedIn Makeover', 'ATS-compliant resume & recruiter-ready profile.'],
    ['Direct Hiring Referrals', 'Priority shortlisting across 150+ verified hiring partners.'],
    ['1:1 Mentor Guidance', 'Personal doubt-clearing & transition counseling.'],
    ['Hackathons & Hiring Days', 'Live collaborative team builds to demonstrate skills.'],
  ];

  const servColGap = 5;
  const servCardW = (CONTENT_W - servColGap) / 2;
  const servCardH = 10.5;
  const servRowGap = 2.0;

  careerServices.forEach(([t, d], i) => {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const sx = MARGIN_X + colIdx * (servCardW + servColGap);
    const sy = cursorY + rowIdx * (servCardH + servRowGap);

    setFill(CARD);
    setStroke([226, 232, 240]);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(sx, sy, servCardW, servCardH, 2, 2, 'FD');

    // Left amber square accent
    setFill(ORANGE);
    pdf.roundedRect(sx + 3.5, sy + 3.6, 3.2, 3.2, 0.8, 0.8, 'F');

    // Title
    pdf.setFontSize(7.6);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(sanitize(t), sx + 9.5, sy + 4.5);

    // Description
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(sanitize(d), sx + 9.5, sy + 8.5);
  });
  cursorY += 3 * (servCardH + servRowGap) + 4.0;

  // 3. Contact Us & Admissions (Vibrant Brand Colors - No Black!)
  pdf.setFontSize(12);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Contact', MARGIN_X, cursorY + 3.2);
  const conW = pdf.getTextWidth('Contact') + 2.5;
  setText(ORANGE);
  pdf.text('Us & Admissions Support', MARGIN_X + conW, cursorY + 3.2);
  cursorY += 7.0;

  const contactCards = [
    {
      label: 'ADMISSIONS HELPLINE',
      primary: phone,
      secondary: '+91 80882 18609 • Mon-Sat 9AM-7PM',
      stripe: ORANGE,
      bg: [255, 251, 235], // amber-50
      border: [254, 215, 170], // amber-200
      tagColor: ORANGE,
    },
    {
      label: 'STUDENT SUPPORT & INQUIRIES',
      primary: email,
      secondary: 'Prompt admissions response within 24 hrs',
      stripe: BLUE,
      bg: [239, 246, 255], // sky-50
      border: [191, 219, 254], // blue-200
      tagColor: BLUE,
    },
    {
      label: 'CAMPUS & LEARNING CENTER',
      primary: 'Marvel Slice - Institute for Software Learning',
      secondary: 'Chennai, Tamil Nadu, India',
      stripe: GREEN,
      bg: [236, 253, 245], // emerald-50
      border: [167, 243, 208], // emerald-200
      tagColor: [4, 120, 87],
    },
    {
      label: 'ONLINE LEARNING LMS & PORTAL',
      primary: website,
      secondary: '24/7 Digital LMS • Live Sprints & Sandbox',
      stripe: PURPLE,
      bg: [250, 245, 255], // purple-50
      border: [233, 213, 255], // purple-200
      tagColor: PURPLE,
    },
  ];

  const conColGap = 5;
  const conCardW = (CONTENT_W - conColGap) / 2;
  const conCardH = 15.5;
  const conRowGap = 2.4;

  contactCards.forEach((c, i) => {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const cx = MARGIN_X + colIdx * (conCardW + conColGap);
    const cy = cursorY + rowIdx * (conCardH + conRowGap);

    setFill(c.bg);
    setStroke(c.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(cx, cy, conCardW, conCardH, 2.2, 2.2, 'FD');

    // Left vertical color stripe
    setFill(c.stripe);
    pdf.roundedRect(cx, cy, 2.2, conCardH, 1, 1, 'F');

    // Label
    pdf.setFontSize(6.2);
    pdf.setFont('Helvetica', 'bold');
    setText(c.tagColor);
    pdf.text(c.label, cx + 5.5, cy + 4.5);

    // Primary
    pdf.setFontSize(7.6);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(pdf.splitTextToSize(sanitize(c.primary), conCardW - 8)[0] || '', cx + 5.5, cy + 9.0);

    // Secondary
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(pdf.splitTextToSize(sanitize(c.secondary), conCardW - 8)[0] || '', cx + 5.5, cy + 13.0);
  });
  cursorY += 2 * (conCardH + conRowGap) + 4.0;

  // 4. Company Slogan Banner (At the very end of Contact section)
  const sloganH = 19.0;
  setFill(SKY);
  setStroke([191, 219, 254]); // blue-200
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, sloganH, 2.5, 2.5, 'FD');

  // Left accent bar
  setFill(BLUE);
  pdf.roundedRect(MARGIN_X, cursorY, 2.5, sloganH, 1, 1, 'F');

  pdf.setFontSize(6.2);
  pdf.setFont('Helvetica', 'bold');
  setText(BLUE);
  pdf.text('OUR CORE PHILOSOPHY & PROMISE', MARGIN_X + 6, cursorY + 4.8);

  pdf.setFontSize(10.0);
  pdf.setFont('Helvetica', 'bolditalic');
  setText(NAVY);
  pdf.text('"Education should create opportunities; skills should create confidence."', MARGIN_X + 6, cursorY + 10.8);

  pdf.setFontSize(6.8);
  pdf.setFont('Helvetica', 'normal');
  setText(MUTED);
  pdf.text('Marvel Slice — Institute for Software Learning • Industry Mentorship & Engineering Excellence', MARGIN_X + 6, cursorY + 15.5);
  cursorY += sloganH + 4;

  // ================= 14 PROGRAMS CATALOG (2-column matching design colors) =================
  newInnerPage();
  heading('Explore Our ', 'Courses');

  pdf.setFontSize(8.2);
  pdf.setFont('Helvetica', 'normal');
  setText(BODY);
  pdf.text('One brochure per course — contact our academic counsellors to receive the comprehensive curriculum for any program.', MARGIN_X, cursorY);
  cursorY += 5.5;

  const catColGap = 5;
  const catCardW = (CONTENT_W - catColGap) / 2;
  const catCardH = 15.0;
  const catRowGap = 2.6;

  catalogCourses.forEach((c, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const cx = MARGIN_X + colIdx * (catCardW + catColGap);
    const cy = cursorY + rowIdx * (catCardH + catRowGap);
    const isCurrent = c.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(c.title.toLowerCase());

    if (isCurrent) {
      setFill([255, 251, 235]); // amber-50
      setStroke(ORANGE);
      pdf.setLineWidth(0.6);
    } else {
      setFill(WHITE);
      setStroke([226, 232, 240]);
      pdf.setLineWidth(0.35);
    }
    pdf.roundedRect(cx, cy, catCardW, catCardH, 2.2, 2.2, 'FD');

    // Number circle badge - ALL ORANGE (no multiple colors)
    setFill(ORANGE);
    pdf.circle(cx + 6.2, cy + catCardH / 2, 3.8, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(idx + 1).padStart(2, '0'), cx + 6.2, cy + catCardH / 2 + 1.2, { align: 'center' });

    // Course title (only course name, duration removed)
    pdf.setFontSize(8.2);
    pdf.setFont('Helvetica', 'bold');
    if (isCurrent) {
      setText(ORANGE);
      pdf.text(pdf.splitTextToSize(c.title, catCardW - 25)[0] || '', cx + 13.0, cy + 8.8);
      // Current tag
      pdf.setFontSize(5.8);
      pdf.setFont('Helvetica', 'bold');
      setText(ORANGE);
      pdf.text('CURRENT', cx + catCardW - 13, cy + 8.8, { align: 'right' });
    } else {
      setText(INK);
      pdf.text(pdf.splitTextToSize(c.title, catCardW - 16)[0] || '', cx + 13.0, cy + 8.8);
    }
  });

  const numRows = Math.ceil(catalogCourses.length / 2);
  cursorY += numRows * (catCardH + catRowGap) + 4.0;

  // Bottom admissions section with scannable QR code, website, email & phone (Unboxed Layout)
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL('https://marvelslice.com', {
      margin: 1,
      width: 256,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  } catch { /* ignore fallback */ }

  const contactStartY = cursorY + 1.5;

  // Heading: "Admissions & Syllabus Inquiries:" — centered
  pdf.setFontSize(11);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  const headingText = 'Admissions & Syllabus Inquiries:';
  const headingW = pdf.getTextWidth(headingText);
  pdf.text(headingText, MARGIN_X + (CONTENT_W - headingW) / 2, contactStartY + 4.5);

  // Subtle divider below heading
  setStroke([226, 232, 240]);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN_X + 15, contactStartY + 7.5, MARGIN_X + CONTENT_W - 15, contactStartY + 7.5);

  // Far Right Corner: Scannable QR Code (pointing to marvelslice.com)
  const qrSize = 26.0;
  const qrBoxX = MARGIN_X + CONTENT_W - qrSize;
  const qrBoxY = contactStartY + 10.0;

  setFill(WHITE);
  setStroke([226, 232, 240]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(qrBoxX, qrBoxY, qrSize, qrSize, 1.5, 1.5, 'FD');

  if (qrDataUrl) {
    try {
      pdf.addImage(qrDataUrl, 'PNG', qrBoxX + 1.0, qrBoxY + 1.0, qrSize - 2.0, qrSize - 2.0);
      pdf.link(qrBoxX, qrBoxY, qrSize, qrSize, { url: 'https://marvelslice.com' });
    } catch { /* ignore */ }
  }

  // QR Label below
  pdf.setFontSize(6);
  pdf.setFont('Helvetica', 'bold');
  setText(ORANGE);
  pdf.text('SCAN FOR SITE', qrBoxX + qrSize / 2, qrBoxY + qrSize + 3.5, { align: 'center' });

  // Contact area left of QR (from MARGIN_X to qrBoxX - 8)
  const contactAreaW = qrBoxX - MARGIN_X - 8;

  // Larger icon helpers (7mm bounding box)
  function drawGlobeIconLg(x, y, color) {
    setStroke(color);
    pdf.setLineWidth(0.45);
    pdf.circle(x + 3.5, y + 3.5, 3.2, 'S');
    pdf.line(x + 0.3, y + 3.5, x + 6.7, y + 3.5);
    pdf.line(x + 3.5, y + 0.3, x + 3.5, y + 6.7);
    pdf.ellipse(x + 3.5, y + 3.5, 1.7, 3.2, 'S');
  }
  function drawPhoneIconLg(x, y, color) {
    setStroke(color);
    setFill(color);
    pdf.setLineWidth(0.45);
    pdf.roundedRect(x + 1.0, y + 0.3, 5.0, 6.8, 0.8, 0.8, 'S');
    pdf.line(x + 2.4, y + 1.2, x + 4.6, y + 1.2);
    pdf.circle(x + 3.5, y + 6.0, 0.5, 'F');
  }
  function drawEmailIconLg(x, y, color) {
    setStroke(color);
    pdf.setLineWidth(0.45);
    pdf.roundedRect(x + 0.2, y + 0.8, 6.8, 5.2, 0.5, 0.5, 'S');
    pdf.line(x + 0.2, y + 0.8, x + 3.6, y + 3.6);
    pdf.line(x + 3.6, y + 3.6, x + 7.0, y + 0.8);
  }

  // Row 1: Left — Phone | Right — Email
  const row1Y = contactStartY + 11.0;

  // Left: Phone icon + "Course Enquiry" heading + phone numbers
  const phoneX = MARGIN_X + 2.0;
  drawPhoneIconLg(phoneX, row1Y, [4, 120, 87]);

  pdf.setFontSize(6.5);
  pdf.setFont('Helvetica', 'bold');
  setText(MUTED);
  pdf.text('Course Enquiry', phoneX + 10, row1Y + 2.5);

  pdf.setFontSize(9.5);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('+91 63809 57390  /  +91 80882 18609', phoneX + 10, row1Y + 6.5);

  // Right: Email icon + "Email" heading + email address
  const emailX = MARGIN_X + contactAreaW / 2 + 8.0;
  drawEmailIconLg(emailX, row1Y, ORANGE);

  pdf.setFontSize(6.5);
  pdf.setFont('Helvetica', 'bold');
  setText(MUTED);
  pdf.text('Email', emailX + 10, row1Y + 2.5);

  pdf.setFontSize(9.5);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('hr@marvelslice.com', emailX + 10, row1Y + 6.5);
  pdf.link(emailX + 10, row1Y + 1.0, 36, 7, { url: 'mailto:hr@marvelslice.com' });

  // Row 2: Center — Globe icon + "Website" heading + www.marvelslice.com
  const webRowY = contactStartY + 23.0;
  const webCenterX = MARGIN_X + contactAreaW / 2 - 22;
  drawGlobeIconLg(webCenterX, webRowY, BLUE);

  pdf.setFontSize(6.5);
  pdf.setFont('Helvetica', 'bold');
  setText(MUTED);
  pdf.text('Website', webCenterX + 10, webRowY + 2.5);

  pdf.setFontSize(10);
  pdf.setFont('Helvetica', 'bold');
  setText(BLUE);
  pdf.text('www.marvelslice.com', webCenterX + 10, webRowY + 6.5);
  pdf.link(webCenterX + 10, webRowY + 1.0, 42, 7, { url: 'https://marvelslice.com' });

  const raw = title || 'Course';
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  pdf.save(`Marvel_Slice_${clean}_Brochure.pdf`);
  return pdf;
}
