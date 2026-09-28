import jsPDF from 'jspdf';
import { generateAIBrochureData } from './brochureAIService';

/**
 * Professional brochure template (Intellipaat-style density + Marvel Slice branding).
 *
 * Flow:
 *   1. Cover hero (dark band, title, stats strip, highlights, contents)
 *   2. About Program + Key Highlights (2-column)
 *   3. Who Can Apply (dark band) + Application Process steps
 *   4. Related Programs (5 manually picked courses)
 *   5. Program Curriculum (dense 2-column, Modules renumbered 1..N)
 *   6. Skills & Tools strip + Contact Us + Marvel Villas parent-company story
 *   7. Related Programs (last page, skipped when nothing picked)
 *
 * Options:
 *   {
 *     docSections?: [{ title: string, lines: string[] }],
 *     otherCourses?: [{ title: string, duration?: string, mode?: string }]
 *   }
 */

// Palette: Marvel navy + professional orange accent (reference-style)
const NAVY = [11, 43, 104];
const HERO = [8, 20, 60];
const ROYAL = [37, 99, 235];
const ORANGE = [234, 88, 12];
const SKY_SOFT = [239, 246, 255];
const CARD_BG = [248, 250, 252];
const INK = [15, 23, 42];
const BODY = [51, 65, 85];
const MUTED = [100, 116, 139];
const BORDER = [226, 232, 240];
const WHITE = [255, 255, 255];
const LIGHT_TEXT = [203, 213, 225];

function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/₹/g, 'INR ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Split a doc-original title into its own label ("Module 4") + topic ("SQL"). */
function splitDocTitle(t) {
  const m = sanitize(t).match(/^(module|chapter|unit|section)\s*(\d+)\s*[:.\-–—]?\s*(.+)?$/i);
  if (m) {
    const word = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    return { label: `${word} ${m[2]}`, title: (m[3] || '').trim() || sanitize(t) };
  }
  return null;
}

async function loadLogoDataUrl(url) {
  if (!url || typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          w: img.naturalWidth || img.width,
          h: img.naturalHeight || img.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateModernCourseBrochurePDF(course, siteSettings = {}, options = {}) {
  const data = await generateAIBrochureData(course, siteSettings);
  const logoInfo = await loadLogoDataUrl(siteSettings?.logo_url);

  // Doc-original headings kept verbatim (never AI-invented); more lines per section
  const rawSections = Array.isArray(options.docSections)
    ? options.docSections.filter((s) => s && (s.title || (s.lines || []).length))
    : [];
  const docSections = rawSections.slice(0, 25).map((s) => ({
    title: sanitize(s.title) || 'Course Topic',
    lines: (s.lines || []).map(sanitize).filter(Boolean).slice(0, 9),
  })).filter((s) => s.lines.length);

  const otherCourses = Array.isArray(options.otherCourses)
    ? options.otherCourses.slice(0, 5)
    : [];

  const contact = data.meta.contact || {};
  const phone = sanitize(contact.phone || siteSettings?.contact_phone || '+91 63809 57390');
  const email = sanitize(contact.email || siteSettings?.contact_email || 'sales@marvelslice.com');
  const website = sanitize(contact.website || 'www.marvelslice.com');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2; // 182
  const bottomLimit = pageH - 52;      // body text stays in white zone above navy footer wave

  let cursorY = 30;

  const setFill = (rgb) => pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setStroke = (rgb) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb) => pdf.setTextColor(rgb[0], rgb[1], rgb[2]);

  function drawLogo(x, y, maxW = 30, h = 13) {
    if (logoInfo?.dataUrl) {
      try {
        const w = Math.min(maxW, (logoInfo.w / logoInfo.h) * h);
        pdf.addImage(logoInfo.dataUrl, 'PNG', x, y, w, h);
      } catch { /* ignore */ }
    }
  }

  // Image-2 style blue wave background on every page:
  // soft blobs top-right, pale wave band mid-left, deep navy wave footer.
  function drawWavePage(withLogo = true) {
    // top-right soft blobs
    setFill(SKY_SOFT);
    pdf.circle(pageW - 8, 14, 50, 'F');
    setFill([219, 234, 254]);
    pdf.circle(pageW + 8, 30, 36, 'F');
    // mid-left pale wave band (dark text stays readable on it)
    setFill([219, 234, 254]);
    pdf.ellipse(28, 128, 72, 26, 'F');
    setFill(WHITE);
    pdf.ellipse(122, 152, 92, 26, 'F');
    // lower light wave
    setFill(SKY_SOFT);
    pdf.ellipse(172, 256, 95, 22, 'F');
    // deep navy footer wave
    setFill(NAVY);
    pdf.rect(0, 262, pageW, 35, 'F');
    pdf.ellipse(58, pageH + 8, 112, 40, 'F');
    setFill(ROYAL);
    pdf.ellipse(168, pageH + 14, 105, 30, 'F');
    // deco dots
    setFill([147, 197, 253]);
    pdf.circle(188, 62, 3, 'F');
    pdf.circle(192, 72, 2, 'F');
    pdf.circle(190, 236, 5, 'F');
    pdf.circle(182, 242, 2, 'F');
    if (withLogo) drawLogo(margin, 10, 32, 15);
  }

  // ---- small vector icons (jsPDF has no icon font, so we draw glyphs) ----
  // dotted texture helper + diamond sparkles for cover design
  function drawDots(x0, y0, cols, rows, gap, color) {
    setFill(color);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pdf.circle(x0 + c * gap, y0 + r * gap, 0.6, 'F');
      }
    }
  }

  function diamond(cx, cy, s, color) {
    setFill(color);
    pdf.triangle(cx - s, cy, cx + s, cy, cx, cy - s, 'F');
    pdf.triangle(cx - s, cy, cx + s, cy, cx, cy + s, 'F');
  }

  // decorative vector art column beside the cover chevron cards:
  // dark code window + browser mock + purple code chip
  function drawCoverArt(x, y, w) {
    const codeH = 30;
    setFill(HERO);
    pdf.roundedRect(x, y, w, codeH, 2, 2, 'F');
    const dotCols = [[248, 113, 113], [250, 204, 21], [34, 197, 94]];
    dotCols.forEach((c, i) => {
      setFill(c);
      pdf.circle(x + 4.5 + i * 4, y + 4, 1.1, 'F');
    });
    const codeCols = [[34, 197, 94], [34, 211, 238], [168, 85, 247], [250, 204, 21], [96, 165, 250]];
    const widths = [0.72, 0.5, 0.62, 0.45, 0.58];
    codeCols.forEach((c, i) => {
      setFill(c);
      pdf.rect(x + 4, y + 9 + i * 4, (w - 8) * widths[i], 1.6, 'F');
    });
    const by = y + codeH + 3;
    const bh = 26;
    setFill(WHITE);
    setStroke(BORDER);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, by, w, bh, 2, 2, 'FD');
    setFill(ROYAL);
    pdf.roundedRect(x + 2, by + 2, w - 4, 5, 1, 1, 'F');
    setFill(SKY_SOFT);
    pdf.rect(x + 3, by + 9, 9, 9, 'F');
    setFill(ROYAL);
    pdf.triangle(x + 4, by + 16.5, x + 11, by + 16.5, x + 7.5, by + 11.5, 'F');
    setFill([203, 213, 225]);
    pdf.rect(x + 14, by + 9, w - 17, 1.6, 'F');
    pdf.rect(x + 14, by + 12.5, w - 20, 1.6, 'F');
    pdf.rect(x + 14, by + 16, w - 22, 1.6, 'F');
    setFill([147, 51, 234]);
    pdf.roundedRect(x, by + bh + 3, w, 10, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text('</>', x + w / 2, by + bh + 10, { align: 'center' });
  }

  function drawBadgeIcon(kind, cx, cy) {
    const s = 4;
    if (kind === 0) { // laptop - hands-on learning
      setFill(ROYAL);
      pdf.roundedRect(cx - s, cy - s * 0.65, s * 2, s * 1.3, 0.6, 0.6, 'F');
      setFill([239, 246, 255]);
      pdf.rect(cx - s + 1.2, cy - s * 0.65 + 1.2, s * 2 - 2.4, s * 1.3 - 3, 'F');
      setFill(ROYAL);
      pdf.rect(cx - s * 1.25, cy + s * 0.65, s * 2.5, 1.1, 'F');
    } else if (kind === 1) { // gear - real world projects
      setFill([147, 51, 234]);
      pdf.circle(cx, cy, s * 0.95, 'F');
      setStroke(WHITE);
      pdf.setLineWidth(0.9);
      pdf.line(cx - s * 0.95, cy, cx + s * 0.95, cy);
      pdf.line(cx, cy - s * 0.95, cx, cy + s * 0.95);
      pdf.line(cx - s * 0.65, cy - s * 0.65, cx + s * 0.65, cy + s * 0.65);
      pdf.line(cx - s * 0.65, cy + s * 0.65, cx + s * 0.65, cy - s * 0.65);
      setFill(WHITE);
      pdf.circle(cx, cy, s * 0.34, 'F');
    } else if (kind === 2) { // people - expert guidance
      setFill([245, 158, 11]);
      pdf.circle(cx - s * 0.42, cy - s * 0.28, s * 0.3, 'F');
      pdf.circle(cx + s * 0.42, cy - s * 0.28, s * 0.3, 'F');
      pdf.ellipse(cx, cy + s * 0.52, s * 0.78, s * 0.42, 'F');
      setFill(WHITE);
      pdf.circle(cx, cy - s * 0.42, s * 0.3, 'F');
    } else { // bar chart - career support
      setFill([34, 197, 94]);
      const bw2 = s * 0.42;
      [[-1, 0.7], [0, 1.1], [1, 1.5]].forEach(([off, h]) => {
        pdf.rect(cx + off * (bw2 + 1) - bw2 / 2, cy + s * 0.75 - s * h * 0.5, bw2, s * h * 0.5, 'F');
      });
    }
  }

  function drawCardIcon(kind, cx, cy, color) {
    if (kind === 0) { // code brackets
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      setText(color);
      pdf.text('</>', cx, cy + 3, { align: 'center' });
    } else if (kind === 1) { // server stack
      setFill(color);
      for (let r = 0; r < 3; r++) {
        pdf.roundedRect(cx - 4.5, cy - 5 + r * 3.6, 9, 2.8, 0.8, 0.8, 'F');
      }
      setFill(WHITE);
      for (let r = 0; r < 3; r++) {
        pdf.circle(cx - 2.8, cy - 3.6 + r * 3.6, 0.6, 'F');
      }
    } else { // cube
      const p = 5;
      const hex = [
        [cx, cy - p], [cx + p * 0.87, cy - p * 0.5], [cx + p * 0.87, cy + p * 0.5],
        [cx, cy + p], [cx - p * 0.87, cy + p * 0.5], [cx - p * 0.87, cy - p * 0.5],
      ];
      setStroke(color);
      pdf.setLineWidth(1.1);
      hex.forEach((pt, idx) => {
        const next = hex[(idx + 1) % hex.length];
        pdf.line(pt[0], pt[1], next[0], next[1]);
      });
      pdf.line(cx, cy - p, cx, cy);
      pdf.line(cx + p * 0.87, cy - p * 0.5, cx, cy);
      pdf.line(cx - p * 0.87, cy - p * 0.5, cx, cy);
    }
  }

  function newContentPage() {
    pdf.addPage();
    drawWavePage(true);
    cursorY = 32;
  }

  function checkSpace(needed = 15) {
    if (cursorY + needed > bottomLimit) newContentPage();
  }

  // Professional section heading: dark title + orange accent bar
  function addSectionHeading(title, accentWord = '') {
    checkSpace(22);
    cursorY += 4;
    pdf.setFontSize(15);
    pdf.setFont('Helvetica', 'bold');
    if (accentWord && sanitize(title).endsWith(sanitize(accentWord))) {
      const base = sanitize(title).slice(0, -sanitize(accentWord).length).trim();
      setText(INK);
      pdf.text(base, margin, cursorY + 4);
      const baseW = pdf.getTextWidth(base + ' ');
      setText(ORANGE);
      pdf.text(sanitize(accentWord), margin + baseW, cursorY + 4);
    } else {
      setText(INK);
      pdf.text(sanitize(title), margin, cursorY + 4);
    }
    cursorY += 9;
    setFill(ORANGE);
    pdf.rect(margin, cursorY, 34, 1.4, 'F');
    cursorY += 6;
  }

  function addBodyParagraph(text, size = 9.5) {
    const clean = sanitize(text);
    if (!clean) return;
    pdf.setFontSize(size);
    pdf.setFont('Helvetica', 'normal');
    setText(BODY);
    const lines = pdf.splitTextToSize(clean, contentW);
    const requiredH = lines.length * (size * 0.48) + 2;
    checkSpace(requiredH);
    pdf.text(lines, margin, cursorY);
    cursorY += lines.length * (size * 0.48) + 4;
  }

  // Orange check bullet, ~20-word lines that wrap to fill width
  function addCheckBullet(line, maxW = contentW, x = margin, size = 9.5) {
    const clean = sanitize(line);
    if (!clean) return 0;
    pdf.setFontSize(size);
    pdf.setFont('Helvetica', 'normal');
    const lines = pdf.splitTextToSize(clean, maxW - 8);
    const lh = size * 0.48;
    const h = lines.length * lh + 2.5;
    checkSpace(h);
    setFill(ORANGE);
    pdf.circle(x + 2.5, cursorY - 1.2, 2.4, 'F');
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(size - 2.5);
    setText(WHITE);
    pdf.text('v', x + 2.5, cursorY + 0.1, { align: 'center' });
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(size);
    setText(BODY);
    pdf.text(lines, x + 8, cursorY);
    cursorY += lines.length * lh + 2.5;
    return h;
  }

  // ================= PAGE 1 : COVER (flyer style on wave background) =================
  function renderCover() {
    drawWavePage(false);
    drawLogo(margin, 10, 40, 19);

    // handwritten-style note top-right (like reference flyer)
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'bolditalic');
    setText(NAVY);
    pdf.text('From', pageW - margin - 32, 24);
    pdf.text('Basics to', pageW - margin - 32, 29);
    pdf.text('Real Projects', pageW - margin - 32, 34);

    cursorY = 48;
    pdf.setFontSize(13);
    pdf.setFont('Helvetica', 'normal');
    setText(INK);
    pdf.text('Learn', margin, cursorY);
    cursorY += 9;

    const title = sanitize(data.meta.title || course?.title || 'PROFESSIONAL COURSE');
    pdf.setFontSize(25);
    pdf.setFont('Helvetica', 'bold');
    setText(NAVY);
    const titleLines = pdf.splitTextToSize(title.toUpperCase(), contentW).slice(0, 3);
    pdf.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * 9.5 + 3;

    // dotted texture + sparkles around the title zone
    drawDots(pageW - 62, 44, 7, 3, 4, [191, 219, 254]);
    diamond(margin + contentW - 26, 50, 2.2, ORANGE);
    diamond(margin + contentW - 40, 60, 1.6, ROYAL);

    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'normal');
    setText(MUTED);
    pdf.text('Build Real Projects   |   Gain Practical Skills   |   Start Your Career', margin, cursorY);
    cursorY += 7;

    // generic pills (Duration / Mode / Category - no tech-specific badges)
    const pills = [
      `Duration: ${sanitize(data.meta.duration || course?.duration || 'Flexible')}`,
      `Mode: ${sanitize(data.meta.mode || course?.mode || 'Online / Offline')}`,
      sanitize(data.meta.category || course?.category || 'Career Program'),
    ];
    let px = margin;
    pills.forEach((p) => {
      const w = Math.min(pdf.getTextWidth(p) + 10, contentW);
      setFill(WHITE);
      setStroke(ROYAL);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(px, cursorY, w, 7.5, 2, 2, 'FD');
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(ROYAL);
      pdf.text(p, px + 5, cursorY + 5.2);
      px += w + 4;
      if (px > pageW - margin - 30) {
        px = margin;
        cursorY += 10;
      }
    });
    cursorY += 12;

    // 3 chevron feature cards (kept clear of the page edge) + vector art column
    const feats = [
      ...(data.overview?.keyHighlights || []),
      ...(data.outcomes?.bulletPoints || []),
    ].map(sanitize).filter(Boolean).slice(0, 3);
    const cardColors = [ROYAL, [147, 51, 234], [30, 64, 175]];
    const cardTitles = ['PRACTICAL TRAINING', 'EXPERT MENTORSHIP', 'CAREER OUTCOMES'];
    const cardsY = cursorY;
    feats.forEach((f, i) => {
      const ch = 20;
      const x0 = margin + 40;
      const cw = contentW - 50; // right edge 186, arrow tip 194 - safely inside the page
      setFill(cardColors[i % 3]);
      pdf.roundedRect(x0, cursorY, cw, ch, 3, 3, 'F');
      pdf.triangle(
        x0 + cw, cursorY,
        x0 + cw + 8, cursorY + ch / 2,
        x0 + cw, cursorY + ch,
        'F',
      );
      setFill(WHITE);
      pdf.circle(x0 + 10, cursorY + ch / 2, 8, 'F');
      drawCardIcon(i % 3, x0 + 10, cursorY + ch / 2, cardColors[i % 3]);
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(cardTitles[i % 3], x0 + 22, cursorY + 8);
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'normal');
      const fl = pdf.splitTextToSize(f, cw - 28).slice(0, 2);
      pdf.text(fl, x0 + 22, cursorY + 13.5);
      cursorY += ch + 4;
    });
    drawCoverArt(margin, cardsY, 36);
    cursorY += 2;

    // 4 bottom badges row with drawn icons (reference flyer style)
    const badges = ['Hands-on\nLearning', 'Real World\nProjects', 'Expert\nGuidance', 'Career\nSupport'];
    const bw = contentW / 4;
    badges.forEach((b, i) => {
      const cx = margin + bw * i + bw / 2;
      setFill(SKY_SOFT);
      pdf.circle(cx, cursorY + 8, 9, 'F');
      drawBadgeIcon(i % 4, cx, cursorY + 8);
      pdf.setFontSize(7);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      const bl = b.split('\n');
      pdf.text(bl[0], cx, cursorY + 22, { align: 'center' });
      pdf.text(bl[1], cx, cursorY + 26, { align: 'center' });
    });
    cursorY += 30;

    // "What's inside" box fills the remaining cover space
    const toc = [
      'About the Program & Key Highlights',
      `Who Can Apply & Application Process`,
      `Program Curriculum (${docSections.length} modules)`,
      'Skills, Tools & Contact Details',
      `Related Programs (${otherCourses.length} handpicked courses)`,
    ];
    const tocH = 12 + toc.length * 7;
    if (cursorY + tocH < 252) {
      setFill(WHITE);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, cursorY, contentW, tocH, 2.5, 2.5, 'FD');
      setFill(NAVY);
      pdf.roundedRect(margin, cursorY, 2.5, tocH, 1, 1, 'F');
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      setText(NAVY);
      pdf.text("What's Inside This Brochure", margin + 7, cursorY + 7.5);
      toc.forEach((t, i) => {
        const ry = cursorY + 13 + i * 7;
        setFill(ORANGE);
        pdf.circle(margin + 10, ry - 1.2, 2.4, 'F');
        pdf.setFontSize(7);
        pdf.setFont('Helvetica', 'bold');
        setText(WHITE);
        pdf.text(String(i + 1), margin + 10, ry + 0.1, { align: 'center' });
        pdf.setFontSize(8.5);
        pdf.setFont('Helvetica', 'normal');
        setText(BODY);
        pdf.text(sanitize(t), margin + 16, ry);
      });
      cursorY += tocH + 2;
    }

    // CTA line in white over the navy footer wave
    pdf.setFontSize(10.5);
    pdf.setFont('Helvetica', 'bolditalic');
    setText(WHITE);
    const cta = sanitize(course?.subtitle || data.meta.subtitle) || 'Turn Your Ideas Into Real Skills and Career Growth';
    pdf.text(pdf.splitTextToSize(cta, 120).slice(0, 2), margin + 6, 268);
  }

  // ================= ABOUT + HIGHLIGHTS (2-col) =================
  function renderAbout() {
    newContentPage();
    addSectionHeading('About Program', 'Program');
    addBodyParagraph(data.meta.description || course?.description || '');

    pdf.setFontSize(12.5);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    checkSpace(12);
    pdf.text('Key Highlights', margin, cursorY + 4);
    cursorY += 10;

    const points = [
      ...(data.overview?.keyHighlights || []),
      ...(data.outcomes?.bulletPoints || []),
    ].map(sanitize).filter(Boolean).slice(0, 10);

    // two columns of check bullets
    const gap = 8;
    const colW = (contentW - gap) / 2;
    const half = Math.ceil(points.length / 2);
    const cols = [points.slice(0, half), points.slice(half)];
    const startY = cursorY;
    let maxEnd = startY;
    cols.forEach((colPoints, ci) => {
      const x = margin + ci * (colW + gap);
      cursorY = startY;
      colPoints.forEach((p) => addCheckBullet(p, colW, x, 9));
      maxEnd = Math.max(maxEnd, cursorY);
    });
    cursorY = maxEnd + 4;
  }

  // ================= WHO CAN APPLY (dark band) + APPLICATION STEPS =================
  function renderApplyAndSteps() {
    const profiles = (data.audience?.targetProfiles || []).map((p) =>
      sanitize(typeof p === 'string' ? p : `${p.title || ''}: ${p.desc || ''}`)
    ).filter(Boolean).slice(0, 6);
    const list = profiles.length >= 3 ? profiles : [
      'College students & freshers seeking core software jobs with structured coding practice.',
      'Working professionals from non-IT backgrounds switching into technology roles with mentored roadmaps.',
      'Junior developers, QA engineers & support analysts upskilling into Full Stack, Cloud & DevOps positions.',
      'Candidates restarting after a career gap with refreshed skills, live projects & placement drives.',
    ];

    // measure band
    pdf.setFontSize(9.5);
    const rowHs = list.map((t) => pdf.splitTextToSize(t, contentW - 12).length * 4.6 + 3.5);
    const bandH = rowHs.reduce((a, b) => a + b, 0) + 30;
    checkSpace(bandH + 6);

    const bandY = cursorY - 2;
    setFill(HERO);
    pdf.roundedRect(margin, bandY, contentW, bandH, 3, 3, 'F');
    pdf.setFontSize(15);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text('Who Can ', margin, bandY + 14);
    const w1 = pdf.getTextWidth('Who Can ');
    setText(ORANGE);
    pdf.text('Apply?', margin + w1, bandY + 14);

    let ry = bandY + 22;
    list.forEach((t) => {
      pdf.setFontSize(9.5);
      const lines = pdf.splitTextToSize(t, contentW - 12);
      setFill(ORANGE);
      pdf.circle(margin + 3, ry - 1.2, 2.6, 'F');
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text('v', margin + 3, ry + 0.2, { align: 'center' });
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'normal');
      setText(WHITE);
      pdf.text(lines, margin + 10, ry);
      ry += lines.length * 4.6 + 3.5;
    });
    cursorY = bandY + bandH + 6;

    // Application process steps
    const steps = (data.admissions?.steps || []).map((s) =>
      typeof s === 'string' ? { title: s, desc: '' } : { title: s.step || s.title || '', desc: s.desc || s.description || '' }
    ).filter((s) => s.title).slice(0, 3);
    const finalSteps = steps.length === 3 ? steps : [
      { title: 'Submit Application', desc: 'Tell us about yourself, your background and why you want to join the program.' },
      { title: 'Counselling & Batch Allotment', desc: 'Speak with a career counsellor to map the curriculum to your goals and timelines.' },
      { title: 'Enroll & Start Learning', desc: 'Complete enrollment, get LMS access with preparatory material and join orientation.' },
    ];

    checkSpace(20);
    pdf.setFontSize(12.5);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text('Application Process', margin, cursorY + 4);
    cursorY += 12;
    finalSteps.forEach((s, i) => {
      const desc = sanitize(s.desc);
      pdf.setFontSize(9.5);
      const dl = desc ? pdf.splitTextToSize(desc, contentW - 22) : [];
      const sh = 14 + dl.length * 4.6;
      checkSpace(sh + 3);
      setFill(CARD_BG);
      setStroke(ORANGE);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, cursorY, contentW, sh, 2.5, 2.5, 'FD');
      setFill(ORANGE);
      pdf.circle(margin + 10, cursorY + sh / 2, 6, 'F');
      pdf.setFontSize(11);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(String(i + 1), margin + 10, cursorY + sh / 2 + 3.5, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      pdf.text(sanitize(s.title).toUpperCase(), margin + 20, cursorY + 7);
      if (dl.length) {
        pdf.setFontSize(9);
        pdf.setFont('Helvetica', 'normal');
        setText(BODY);
        pdf.text(dl, margin + 20, cursorY + 12.5);
      }
      cursorY += sh + 3.5;
    });
    cursorY += 2;
  }

  // ================= RELATED PROGRAMS (last page - skipped when nothing picked) =================
  function renderOtherCourses() {
    if (!otherCourses.length) return; // empty section would leave a near-blank last page
    const need = 34 + Math.min(otherCourses.length, 5) * 23;
    if (cursorY + need > bottomLimit) newContentPage();
    addSectionHeading('Related Programs', 'Programs');
    otherCourses.forEach((c, i) => {
      const ch = 19;
      checkSpace(ch + 3);
      setFill(CARD_BG);
      setStroke(BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, cursorY, contentW, ch, 2.5, 2.5, 'FD');
      setFill(NAVY);
      pdf.roundedRect(margin, cursorY, 2.5, ch, 1, 1, 'F');
      setFill(NAVY);
      pdf.circle(margin + 11, cursorY + ch / 2, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'bold');
      setText(WHITE);
      pdf.text(String(i + 1).padStart(2, '0'), margin + 11, cursorY + ch / 2 + 2.5, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      setText(NAVY);
      pdf.text(sanitize(c.title || `Course ${i + 1}`), margin + 20, cursorY + 8);
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      pdf.text(sanitize(`${c.duration || 'Flexible'}  |  ${c.mode || 'Online / Offline'}`), margin + 20, cursorY + 14);
      cursorY += ch + 3.5;
    });
    cursorY += 2;
  }

  // ================= CURRICULUM (dense 2-column, reference-style) =================
  function renderCurriculum() {
    const sections = docSections.length ? docSections : (data.modules || []).map((m, i) => ({
      title: sanitize(m.title) || `Part ${i + 1}`,
      lines: (m.topics || []).map((t) => sanitize(typeof t === 'string' ? t : t?.title || t?.name || '')).filter(Boolean).slice(0, 8),
    })).filter((s) => s.lines.length);
    if (!sections.length) return;

    const gap = 8;
    const colW = (contentW - gap) / 2;
    const colX = [margin, margin + colW + gap];

    function startCurrPage(first) {
      newContentPage();
      addSectionHeading(first ? 'Program Curriculum' : 'Program Curriculum (contd.)', 'Curriculum');
      return [cursorY, cursorY];
    }

    let y;
    // Continue on the current page when room remains (kills half-blank pages);
    // otherwise start fresh. Contd. pages below always start fresh.
    if (cursorY > 100) {
      newContentPage();
    }
    addSectionHeading('Program Curriculum', 'Curriculum');
    y = [cursorY, cursorY];
    let modNo = 0;

    function blockHeight(sec) {
      pdf.setFontSize(10);
      const tl = pdf.splitTextToSize(sec.title, colW - 2).slice(0, 2);
      let h = 6 + tl.length * 5;
      pdf.setFontSize(9);
      sec.lines.forEach((l) => {
        h += pdf.splitTextToSize(l, colW - 6).slice(0, 3).length * 4.4 + 1.8;
      });
      return h + 5;
    }

    function drawBlock(sec, col, topY) {
      modNo += 1;
      let yy = topY;
      // Doc-original numbered headings ("Module 4: SQL") keep their own label;
      // plain-topic headings get the sequential label.
      const parts = splitDocTitle(sec.title);
      const label = parts ? parts.label : `Module ${modNo}`;
      const showTitle = parts ? parts.title : sec.title;
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      setText(ORANGE);
      pdf.text(label, colX[col], yy);
      yy += 5.5;
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      const tl = pdf.splitTextToSize(showTitle, colW - 2).slice(0, 2);
      pdf.text(tl, colX[col], yy);
      yy += tl.length * 5 + 1;
      pdf.setFontSize(9);
      sec.lines.forEach((l) => {
        const bl = pdf.splitTextToSize(l, colW - 6).slice(0, 3);
        setFill(ROYAL);
        pdf.circle(colX[col] + 1.5, yy - 1.2, 1.3, 'F');
        pdf.setFont('Helvetica', 'normal');
        setText(BODY);
        pdf.text(bl, colX[col] + 5.5, yy);
        yy += bl.length * 4.4 + 1.8;
      });
      return yy + 4;
    }

    sections.forEach((sec) => {
      const h = blockHeight(sec);
      let col = y[0] <= y[1] ? 0 : 1;
      if (Math.min(y[0], y[1]) + h > bottomLimit) {
        y = startCurrPage(false);
        col = 0;
      } else if (y[col] + h > bottomLimit) {
        col = col === 0 ? 1 : 0;
        if (y[col] + h > bottomLimit) {
          y = startCurrPage(false);
          col = 0;
        }
      }
      y[col] = drawBlock(sec, col, y[col]);
    });
    cursorY = Math.max(y[0], y[1]) + 4;

    // Skills & tools strip (fills leftover space, reference-style)
    const skills = (data.techMatrix?.categories || [])
      .flatMap((c) => c.items || [])
      .map(sanitize).filter(Boolean).slice(0, 28);
    if (skills.length) {
      checkSpace(26);
      setFill(SKY_SOFT);
      pdf.roundedRect(margin, cursorY, contentW, 4, 1, 1, 'F');
      cursorY += 9;
      pdf.setFontSize(11);
      pdf.setFont('Helvetica', 'bold');
      setText(INK);
      pdf.text('Skills & Tools You Will Master', margin, cursorY);
      cursorY += 6;
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      const sl = pdf.splitTextToSize(skills.join('  •  '), contentW);
      checkSpace(sl.length * 4.4 + 2);
      pdf.text(sl, margin, cursorY);
      cursorY += sl.length * 4.4 + 4;
    }
  }

  // ================= CONTACT (flows onto current page when room remains) =================
  function renderCompanyPage() {
    if (cursorY > 110) newContentPage();
    pdf.setFontSize(16);
    pdf.setFont('Helvetica', 'bold');
    setText(INK);
    pdf.text('Contact ', margin, cursorY + 4);
    const cw = pdf.getTextWidth('Contact ');
    setText(ORANGE);
    pdf.text('Us', margin + cw, cursorY + 4);
    cursorY += 12;

    const addr = sanitize(contact.address || siteSettings?.address || '');
    const rows = [
      { label: 'Visit Us', value: addr || 'Contact our admissions team for the centre address.' },
      { label: 'Call Us', value: `Phone: ${phone}` },
      { label: 'Email Us', value: `Email: ${email}` },
      { label: 'Website', value: website },
    ];
    rows.forEach((r) => {
      pdf.setFontSize(11);
      pdf.setFont('Helvetica', 'bold');
      setText(NAVY);
      checkSpace(14);
      pdf.text(r.label, margin, cursorY);
      cursorY += 5.5;
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'normal');
      setText(BODY);
      const vl = pdf.splitTextToSize(r.value, contentW);
      checkSpace(vl.length * 4.6 + 2);
      pdf.text(vl, margin, cursorY);
      cursorY += vl.length * 4.6 + 5;
    });

    // navy CTA card
    const ch = 30;
    checkSpace(ch + 4);
    setFill(NAVY);
    pdf.roundedRect(margin, cursorY, contentW, ch, 3, 3, 'F');
    drawLogo(margin + 6, cursorY + 4, 26, 11);
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    setText(WHITE);
    pdf.text('Marvel Slice - Institute for Software Learning', margin + 38, cursorY + 12);
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'normal');
    setText(LIGHT_TEXT);
    pdf.text('Talk to our counsellor today to pick the right batch and EMI plan for your goals.', margin + 38, cursorY + 19, { maxWidth: contentW - 44 });
    cursorY += ch + 8;

    // Parent company: Marvel Villas journey
    addSectionHeading('Our Parent Company', 'Company');
    pdf.setFontSize(11);
    pdf.setFont('Helvetica', 'bold');
    setText(NAVY);
    checkSpace(10);
    pdf.text('Journey Behind Marvel Villas  (Est. 2025)', margin, cursorY);
    cursorY += 6;
    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'bold');
    setText(ORANGE);
    pdf.text('marvelvillas.com', margin, cursorY);
    cursorY += 6;
    addBodyParagraph(
      'Marvel Villas, established in 2025 by our beloved founder Er. Sundareswara Nathan (EEE), is the parent company of Marvel Slice. ' +
      'After years as an astrology and vastu consultant for construction clients, and later as an operations manager at a corporate firm in Bangalore, ' +
      'he left his job in 2020 to build his own house - where a painter, Mr. Raja, spotted his hidden talent for planning and executing home construction.'
    );
    addBodyParagraph(
      'After completing 7 projects and gaining five years of knowledge alongside civil and electrical engineers and architects, ' +
      'he founded Marvel Villas in 2025. Its very first project is currently under construction near Pondicherry. ' +
      'A researcher in astrology and vastu for over 13 years, he guides people with astrological ideas explained through psychological insight and scientific reasoning.'
    );
  }

  // ---- execute flow (Related Programs is the last page, after company data) ----
  renderCover();
  renderAbout();
  renderApplyAndSteps();
  renderCurriculum();
  renderCompanyPage();
  renderOtherCourses();

  // Footer contact text on every page (sits on the navy footer wave)
  const total = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    const fy = pageH - 11;
    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'normal');
    setText(LIGHT_TEXT);
    pdf.text(`${phone}      ${email}`, margin, fy + 7);
    pdf.text(website, pageW - margin, fy + 7, { align: 'right' });
    pdf.setFontSize(6.5);
    setText([180, 200, 235]);
    if (i > 1) pdf.text(`Page - ${i}`, pageW - margin, fy - 3, { align: 'right' });
  }

  const raw = course?.title || 'Course';
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  pdf.save(`Marvel_Slice_${clean}_Brochure.pdf`);
  return pdf;
}
