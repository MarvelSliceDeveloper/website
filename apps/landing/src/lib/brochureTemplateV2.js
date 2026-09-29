import jsPDF from 'jspdf';
import { generateAIBrochureData } from './brochureAIService';
import {
  toolsForTitle, rolesFor,
  projectsFor, outcomesFor, DEFAULT_PATH_STEPS,
} from './brochureExpand';

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
  // Background: template JPGs by default, plain white on opt-out,
  // custom uploads when provided (per-slot fallback to template art).
  const bgStyle = options.bgStyle === 'plain' ? 'plain' : 'template';
  const [coverImg, innerImg] = await Promise.all([
    bgStyle === 'plain' ? null : (options.customCoverBg || loadImageDataUrl('/brochure/bg-cover.jpg')),
    bgStyle === 'plain' ? null : (options.customInnerBg || loadImageDataUrl('/brochure/bg-inner.jpg')),
  ]);

  // Curriculum priority: uploaded AI-condensed doc > live DB modules.
  const rawSections = Array.isArray(options.docSections)
    ? options.docSections.filter((s) => s && (s.title || (s.lines || []).length))
    : [];
  let modules = rawSections.slice(0, 30).map((s, i) => ({
    label: `Module ${i + 1}`,
    title: sanitize(s.title) || `Part ${i + 1}`,
    topics: (s.lines || []).map(sanitize).filter(Boolean).slice(0, 14),
  })).filter((m) => m.topics.length || m.title);
  if (modules.length < 2) {
    const dbMods = asList(data.modules).map((m, i) => ({
      label: `Module ${i + 1}`,
      title: sanitize(m.title || m.name) || `Part ${i + 1}`,
      topics: asList(m.topics || m.lessons || m.content).map(sanitize).filter(Boolean).slice(0, 14),
    })).filter((m) => m.topics.length || m.title);
    if (dbMods.length >= 2) modules = dbMods;
  }

  const otherCourses = Array.isArray(options.otherCourses)
    ? options.otherCourses.slice(0, 13)
    : [];

  // Full-page image replacements (no headings/overlay — image only).
  const coverImage = options.coverImage || null;
  const pathImage = options.pathImage || null;

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
  const email = sanitize(contact.email || siteSettings?.contact_email || 'sales@marvelslice.com');
  const website = sanitize(contact.website || 'www.marvelslice.com');
  const address = sanitize(contact.address || siteSettings?.address || 'Marvel Slice — Institute for Software Learning, Chennai, Tamil Nadu, India');

  const title = sanitize(data.meta.title || course?.title || 'Professional Course');
  const duration = sanitize(data.meta.duration || course?.duration || 'Flexible duration');
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
  const projects = (asList(data.capstones?.projects).length
    ? asList(data.capstones.projects).slice(0, 6).map((p) => ({
      level: 'Advanced',
      title: sanitize(p.title) || 'Project',
      desc: sanitize((p.paragraphs || [])[0] || p.description) || 'Build and deploy a portfolio-ready application.',
      tech: sanitize(p.techStack || p.tech || ''),
    }))
    : projectsFor(title, modules.map((m) => ({ title: m.title, topics: m.topics })))).slice(0, 4);
  const skillSource = (data.techMatrix?.categories || []).flatMap((c) => c.items || []).map(sanitize).filter(Boolean);
  const skills = (skillSource.length ? skillSource : modules.flatMap((m) => m.topics).filter((t) => t.length > 3 && t.length < 42)).slice(0, 12);
  const tools = toolsForTitle(title, (course?.projects || []).flatMap((p) => asList(p.technologies)));

  const pdf = new jsPDF('p', 'mm', 'a4');
  let cursorY = 0;

  const setFill = (c) => pdf.setFillColor(c[0], c[1], c[2]);
  const setText = (c) => pdf.setTextColor(c[0], c[1], c[2]);
  const setStroke = (c) => pdf.setDrawColor(c[0], c[1], c[2]);

  function paintBg(img) {
    if (bgStyle === 'template' && img) {
      try {
        pdf.addImage(img, 'JPEG', 0, 0, PAGE_W, PAGE_H);
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
    need(lines.length * size * 0.46 + 3);
    pdf.text(lines, MARGIN_X, cursorY);
    cursorY += lines.length * size * 0.46 + 4;
  }

  function checkBullet(text, size = 10, maxW = CONTENT_W, x = MARGIN_X) {
    const clean = sanitize(text);
    if (!clean) return;
    pdf.setFontSize(size);
    pdf.setFont('Helvetica', 'normal');
    const lines = pdf.splitTextToSize(clean, maxW - 9);
    need(lines.length * size * 0.46 + 3);
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
    cursorY += lines.length * size * 0.46 + 2.5;
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
    const fl = pdf.splitTextToSize(f, CONTENT_W - 34).slice(0, 2);
    const ch = 13 + fl.length * 4.4;
    setFill(barColors[i % 3]);
    pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, ch, 3, 3, 'F');
    setFill(WHITE);
    pdf.circle(MARGIN_X + 11, cursorY + ch / 2, 8, 'F');
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    setText(barColors[i % 3]);
    pdf.text(barTitles[i % 3][0], MARGIN_X + 11, cursorY + ch / 2 + 3.5, { align: 'center' });
    pdf.setFontSize(10);
    setText(WHITE);
    pdf.text(barTitles[i % 3], MARGIN_X + 23, cursorY + 8);
    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(fl, MARGIN_X + 23, cursorY + 13.5);
    cursorY += ch + 4;
  });
  // 4 badges
  const badges = ['Hands-on\nLearning', 'Real World\nProjects', 'Expert\nGuidance', 'Career\nSupport'];
  const badgeCols = [BLUE, PURPLE, ORANGE, GREEN];
  const bw = CONTENT_W / 4;
  badges.forEach((b, i) => {
    const cx = MARGIN_X + bw * i + bw / 2;
    setFill(SKY);
    pdf.circle(cx, cursorY + 8, 9, 'F');
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    setText(badgeCols[i]);
    pdf.text(String(i + 1), cx, cursorY + 11.5, { align: 'center' });
    pdf.setFontSize(7.5);
    const bl = b.split('\n');
    setText(INK);
    pdf.text(bl[0], cx, cursorY + 22, { align: 'center' });
    pdf.text(bl[1], cx, cursorY + 26, { align: 'center' });
  });
  cursorY += 30;
  // TOC box
  const toc = ['About + Highlights', 'Who Can Apply', 'Learning Path', `Curriculum (${modules.length} modules)`, 'Skills + Tools', 'Projects + Careers', 'Contact', `Our Courses (${otherCourses.length + 1})`];
  const tocH = 13 + Math.ceil(toc.length / 2) * 7;
  setFill(WHITE);
  setStroke(BORDER);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, tocH, 2.5, 2.5, 'FD');
  pdf.setFontSize(9.5);
  pdf.setFont('Helvetica', 'bold');
  setText(NAVY);
  pdf.text("What's Inside This Brochure", MARGIN_X + 7, cursorY + 8);
  toc.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = MARGIN_X + 7 + col * (CONTENT_W / 2);
    const ty = cursorY + 15 + row * 7;
    setFill(ORANGE);
    pdf.circle(tx + 3, ty - 1.2, 2.4, 'F');
    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(i + 1), tx + 3, ty + 0.1, { align: 'center' });
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(sanitize(t), tx + 9, ty);
  });
  cursorY += tocH + 4;
  pdf.setFontSize(10.5);
  pdf.setFont('Helvetica', 'bolditalic');
  setText(NAVY);
  pdf.text('Turn Your Ideas Into Real Websites and Applications', MARGIN_X, Math.min(cursorY + 4, 226));
  } // end designed cover (skipped when a full-page cover image is used)

  // ================= ABOUT =================
  newInnerPage();
  heading('About ', 'Program');
  para(data.meta.description || course?.description || `${title} at Marvel Slice takes you from fundamentals to job-ready projects with mentor-led training.`);
  if (data.meta.subtitle || course?.subtitle) para(data.meta.subtitle || course?.subtitle, 10);
  // info strip
  need(24);
  setFill(SKY);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, 18, 2, 2, 'F');
  pdf.setFontSize(8.5);
  const infoCols = [['Learning Format', 'Mentor-led + self-paced'], ['Duration', duration], ['Mode', mode], ['Certification', 'Marvel Slice']];
  const iw = CONTENT_W / 4;
  infoCols.forEach(([k, v], i) => {
    const ix = MARGIN_X + iw * i + 4;
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text(k, ix, cursorY + 7);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(pdf.splitTextToSize(v, iw - 8)[0] || '', ix, cursorY + 12.5);
  });
  cursorY += 23;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  need(12);
  pdf.text('Key Highlights', MARGIN_X, cursorY + 4);
  cursorY += 10;
  highlights.slice(0, 6).forEach((h) => checkBullet(h, 9.5));
  cursorY += 2;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  need(12);
  pdf.text('What You Will Achieve', MARGIN_X, cursorY + 4);
  cursorY += 10;
  outcomes.slice(0, 8).forEach((o) => checkBullet(o, 9));
  cursorY += 4;

  // ================= WHO CAN APPLY + STEPS =================
  newInnerPage();
  heading('Who Can ', 'Apply?');
  const applicants = [
    'Students & freshers starting a software career from basics',
    'Working professionals switching into development roles',
    'Junior developers upskilling with structured projects',
    'Career restarters refreshing skills with mentor support',
    'Freelancers building client-ready project portfolios',
    `Anyone ready to complete ${modules.length} modules with daily practice`,
  ];
  const gapA = 6;
  const colWA = (CONTENT_W - gapA) / 2;
  const startYA = cursorY;
  let endYA = startYA;
  [applicants.slice(0, 3), applicants.slice(3)].forEach((col, ci) => {
    cursorY = startYA;
    col.forEach((t) => {
      pdf.setFontSize(9.5);
      const lines = pdf.splitTextToSize(sanitize(t), colWA - 10);
      const h = 12 + lines.length * 4.4;
      checkBullet(t, 9.5, colWA, MARGIN_X + ci * (colWA + gapA));
      void h;
    });
    endYA = Math.max(endYA, cursorY);
  });
  cursorY = endYA + 5;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  need(12);
  pdf.text('Application Process', MARGIN_X, cursorY + 4);
  cursorY += 11;
  [
    ['1', 'SUBMIT APPLICATION', 'Tell us about yourself, your background and why you want to join.'],
    ['2', 'COUNSELLING & BATCH ALLOTMENT', 'Speak with a counsellor to map the curriculum to your goals.'],
    ['3', 'ENROLL & START LEARNING', 'Complete enrollment, get LMS access and join orientation.'],
  ].forEach(([n, t, d]) => {
    pdf.setFontSize(9);
    const dl = pdf.splitTextToSize(sanitize(d), CONTENT_W - 24);
    const sh = 13 + dl.length * 4.4;
    need(sh + 3);
    setFill(CARD);
    setStroke(ORANGE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, sh, 2.5, 2.5, 'FD');
    setFill(ORANGE);
    pdf.circle(MARGIN_X + 10, cursorY + sh / 2, 6, 'F');
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(n, MARGIN_X + 10, cursorY + sh / 2 + 3.5, { align: 'center' });
    pdf.setFontSize(10);
    setText(INK);
    pdf.text(sanitize(t), MARGIN_X + 20, cursorY + 7);
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(dl, MARGIN_X + 20, cursorY + 12.5);
    cursorY += sh + 3.5;
  });
  cursorY += 2;

  // ================= LEARNING PATH (uploaded image replaces the steps page) =================
  if (pathImage) {
    pdf.addPage();
    try {
      pdf.addImage(pathImage, 'JPEG', 0, 0, PAGE_W, PAGE_H);
    } catch {
      paintBg(innerImg);
    }
  } else {
  newInnerPage();
  heading('Learning ', 'Path');
  pathSteps.forEach(([t, d], i) => {
    const cols = [BLUE, ORANGE, GREEN];
    need(17);
    setFill(cols[i % 3]);
    pdf.circle(MARGIN_X + 4, cursorY + 3, 4.2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(i + 1), MARGIN_X + 4, cursorY + 6, { align: 'center' });
    pdf.setFontSize(10.5);
    setText(INK);
    pdf.text(sanitize(t), MARGIN_X + 12, cursorY + 4);
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const dl = pdf.splitTextToSize(sanitize(d), CONTENT_W - 14).slice(0, 2);
    pdf.text(dl, MARGIN_X + 12, cursorY + 9.5);
    const stepH = 10 + dl.length * 4.4;
    cursorY += stepH;
    if (i < pathSteps.length - 1) {
      setStroke(BORDER);
      pdf.setLineWidth(0.6);
      pdf.line(MARGIN_X + 4, cursorY - stepH + 12, MARGIN_X + 4, cursorY + 1.5);
    }
  });
  } // end steps path (skipped when a full-page path image is used)

  // ================= CURRICULUM (4 modules/page, 2x2, short points) =================
  const currBottom = BODY_BOTTOM;
  const perPage = 4;
  const gapC = 6;
  const colWC = (CONTENT_W - gapC) / 2;
  function currBlockHeight(m) {
    pdf.setFontSize(12);
    const tl = pdf.splitTextToSize(m.title, colWC - 2).slice(0, 2).length;
    pdf.setFontSize(9.5);
    let h = 8 + tl * 5.6;
    m.topics.forEach((t) => {
      h += pdf.splitTextToSize(sanitize(t), colWC - 6).slice(0, 2).length * 4.4 + 1.6;
    });
    return h + 4;
  }
  function drawCurrBlock(m, x, y) {
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(ORANGE);
    pdf.text(m.label, x, y);
    let yy = y + 5.5;
    pdf.setFontSize(12);
    setText(INK);
    const tl = pdf.splitTextToSize(m.title, colWC - 2).slice(0, 2);
    pdf.text(tl, x, yy);
    yy += tl.length * 5.6 + 1.5;
    pdf.setFontSize(9.5);
    m.topics.forEach((t) => {
      const bl = pdf.splitTextToSize(sanitize(t), colWC - 6).slice(0, 2);
      setFill(BLUE);
      pdf.circle(x + 1.5, yy - 1.2, 1.3, 'F');
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(bl, x + 6, yy);
      yy += bl.length * 4.4 + 1.6;
    });
    return yy;
  }
  for (let g = 0; g * perPage < Math.max(modules.length, 1); g += 1) {
    newInnerPage();
    if (g === 0) {
      heading('Program ', 'Curriculum');
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'normal');
      setText(MUTED);
      pdf.text(`Reference: ${modules.length} modules - short points, taught with live examples + exercises`, MARGIN_X, cursorY);
      cursorY += 7;
    }
    const group = modules.slice(g * perPage, g * perPage + perPage);
    // two columns: rows of 2, each row sized to the taller block
    for (let r = 0; r < group.length; r += 2) {
      const row = group.slice(r, r + 2);
      const rowH = Math.max(...row.map(currBlockHeight));
      if (cursorY + rowH > currBottom) newInnerPage();
      const startY = cursorY;
      let maxY = startY;
      row.forEach((m, k) => {
        const x = MARGIN_X + k * (colWC + gapC);
        maxY = Math.max(maxY, drawCurrBlock(m, x, startY));
      });
      cursorY = maxY + 5;
    }
  }
  if (!modules.length) {
    newInnerPage();
    heading('Program ', 'Curriculum');
    para('Detailed module-wise syllabus is shared during counselling — every topic is taught with live examples and exercises.');
  }

  // ================= SKILLS + TOOLS =================
  newInnerPage();
  heading('Skills to ', 'Master');
  pdf.setFontSize(9.5);
  pdf.setFont('Helvetica', 'normal');
  let sx = MARGIN_X;
  let sy = cursorY;
  const drawPill = (text, fill, tcolor, outline) => {
    const w = Math.min(pdf.getTextWidth(text) + 9, CONTENT_W);
    if (sx + w > PAGE_W - MARGIN_X) { sx = MARGIN_X; sy += 9; }
    if (sy > BODY_BOTTOM) { newInnerPage(); heading('Skills to ', 'Master (contd.)'); sy = cursorY; }
    if (outline) {
      setFill(WHITE);
      setStroke(fill);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(sx, sy, w, 7.5, 3, 3, 'FD');
    } else {
      setFill(fill);
      pdf.roundedRect(sx, sy, w, 7.5, 3, 3, 'F');
    }
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'bold');
    setText(tcolor);
    pdf.text(text, sx + 4.5, sy + 5.2);
    sx += w + 3;
  };
  skills.forEach((s) => drawPill(sanitize(s), BLUE, WHITE, false));
  cursorY = sy + 13;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  need(12);
  pdf.text('Tools to Master', MARGIN_X, cursorY + 4);
  cursorY += 10;
  sx = MARGIN_X;
  sy = cursorY;
  tools.forEach((t) => drawPill(sanitize(t), GREEN, INK, true));
  cursorY = sy + 10;

  // ================= PROJECTS + CAREERS (one page: projects first, then jobs) =================
  newInnerPage();
  heading('Course ', 'Projects');
  para('Every project is reviewed by mentors and deployable to your portfolio.');
  const levelCols = { Beginner: GREEN, Intermediate: BLUE, Advanced: PURPLE };
  const cardW = (CONTENT_W - 6) / 2;
  const cardH = 58;
  const projList = projects.slice(0, 4);
  for (let r = 0; r < projList.length; r += 2) {
    need(cardH + 4);
    projList.slice(r, r + 2).forEach((p, k) => {
      const x = MARGIN_X + k * (cardW + 6);
      setFill(CARD);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(x, cursorY, cardW, cardH, 2.5, 2.5, 'FD');
      setFill(levelCols[p.level] || BLUE);
      pdf.roundedRect(x + 4, cursorY + 4, 26, 6, 2, 2, 'F');
      pdf.setFontSize(7);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(String(p.level || '').toUpperCase(), x + 17, cursorY + 8.5, { align: 'center' });
      pdf.setFontSize(10);
      setText(INK);
      pdf.text(pdf.splitTextToSize(sanitize(p.title), cardW - 10).slice(0, 2), x + 4, cursorY + 17);
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(pdf.splitTextToSize(sanitize(p.desc), cardW - 10).slice(0, 4), x + 4, cursorY + 28);
      if (p.tech) {
        pdf.setFontSize(7.5);
        setText(MUTED);
        pdf.text(pdf.splitTextToSize(`Stack: ${sanitize(p.tech)}`, cardW - 10).slice(0, 1), x + 4, cursorY + cardH - 4);
      }
    });
    cursorY += cardH + 4;
  }
  cursorY += 2;
  pdf.setFontSize(13);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  need(12);
  pdf.text('Top Job Roles', MARGIN_X, cursorY + 4);
  cursorY += 10;
  roles.forEach(([role, salary, desc], i) => {
    const dl = pdf.splitTextToSize(sanitize(desc), CONTENT_W - 52).slice(0, 2);
    need(17 + dl.length * 4.4);
    setFill(NAVY);
    pdf.circle(MARGIN_X + 6, cursorY + 7, 5, 'F');
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text(String(i + 1), MARGIN_X + 6, cursorY + 10, { align: 'center' });
    pdf.setFontSize(10.5);
    setText(INK);
    pdf.text(sanitize(role), MARGIN_X + 14, cursorY + 6);
    pdf.setFontSize(8.5);
    setText(GREEN);
    const sw = pdf.getTextWidth(sanitize(salary)) + 8;
    setFill([236, 253, 245]);
    pdf.roundedRect(PAGE_W - MARGIN_X - sw, cursorY + 1, sw, 7, 3, 3, 'F');
    pdf.text(sanitize(salary), PAGE_W - MARGIN_X - sw / 2, cursorY + 6, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    pdf.text(dl, MARGIN_X + 14, cursorY + 11.5);
    cursorY += 12 + dl.length * 4.4;
  });
  cursorY += 2;

  // ================= CONTACT (content only, plain) =================
  newPlainPage();
  pdf.setFontSize(17);
  pdf.setFont('Helvetica', 'bold');
  setText(INK);
  pdf.text('Contact ', MARGIN_X, cursorY + 5);
  setText(ORANGE);
  pdf.text('Us', MARGIN_X + pdf.getTextWidth('Contact '), cursorY + 5);
  cursorY += 14;
  setFill(NAVY);
  pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, 52, 3, 3, 'F');
  pdf.setFontSize(10);
  setText(WHITE);
  const crows = [`Phone: ${phone}`, `Email: ${email}`, `Website: ${website}`, `${address}`];
  crows.forEach((r, i) => {
    const rl = pdf.splitTextToSize(sanitize(r), CONTENT_W - 12).slice(0, 2);
    pdf.text(rl, MARGIN_X + 6, cursorY + 11 + i * 11);
  });
  cursorY += 60;
  pdf.setFontSize(12);
  pdf.setFont('Helvetica', 'bold');
  setText(NAVY);
  pdf.text('Marvel Slice - Institute for Software Learning', MARGIN_X, cursorY);
  cursorY += 7;
  para('Talk to our counsellor today to pick the right batch and plan for your goals.');
  para(`${website}  |  ${email}`);

  // ================= OTHER COURSES (all rows, image-style numbered list) =================
  {
    const rows = [
      { title, duration, mode, current: true },
      ...otherCourses.map((c) => ({ title: c.title, duration: c.duration, mode: c.mode, current: false })),
    ];
    newInnerPage();
    heading('Explore Our ', 'Courses');
    para('One brochure per course — ask our counsellor for any title below.');
    rows.forEach((c, i) => {
      need(15);
      setFill(CARD);
      pdf.roundedRect(MARGIN_X, cursorY, CONTENT_W, 12, 2, 2, 'F');
      setFill(NAVY);
      pdf.rect(MARGIN_X, cursorY + 1, 2.5, 10, 'F');
      setFill(c.current ? ORANGE : NAVY);
      pdf.circle(MARGIN_X + 11, cursorY + 6, 4.8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(String(i + 1).padStart(2, '0'), MARGIN_X + 11, cursorY + 8.5, { align: 'center' });
      pdf.setFontSize(10.5);
      setText(NAVY);
      pdf.text(sanitize(c.title || `Course ${i + 1}`), MARGIN_X + 19, cursorY + 6);
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(sanitize(`${c.duration || 'Flexible'} | ${c.mode || 'Online / Classroom'}`), MARGIN_X + 19, cursorY + 10.5);
      cursorY += 15;
    });
  }

  const raw = title || 'Course';
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  pdf.save(`Marvel_Slice_${clean}_Brochure.pdf`);
  return pdf;
}
