import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { generateAIBrochureData } from './brochureAIService';

// Consistent Color Palette inspired by the reference design
const COLOR_PRIMARY_NAVY = [11, 43, 104];     // #0B2B68 - Deep Brand Blue
const COLOR_ROYAL_BLUE   = [24, 76, 173];    // #184CAD - Vibrant Royal Blue
const COLOR_ACCENT_GOLD  = [255, 183, 3];     // #FFB703 - Golden Yellow / Orange Accent
const COLOR_BRAND_ORANGE = [234, 88, 12];     // #EA580C - Marvel Vibrant Orange
const COLOR_SUCCESS_GREEN= [34, 197, 94];     // #22C55E - Checkmark Green
const COLOR_LIGHT_BG     = [248, 250, 252];   // #F8FAFC - Card Background
const COLOR_BLUE_TINT    = [239, 246, 255];   // #EFF6FF - Soft Blue Container
const COLOR_GOLD_TINT    = [254, 243, 199];   // #FEF3C7 - Soft Gold Container
const COLOR_BORDER       = [226, 232, 240];   // #E2E8F0 - Clean Border
const COLOR_TEXT_DARK    = [15, 23, 42];      // #0F172A - Heading Dark Navy
const COLOR_TEXT_BODY    = [51, 65, 85];      // #334155 - Body Text Slate
const COLOR_TEXT_MUTED   = [100, 116, 139];   // #64748B - Notes Muted
const COLOR_WATERMARK    = [244, 247, 252];   // #F4F7FC - Subtle Background Watermark
const COLOR_WHITE        = [255, 255, 255];

/**
 * Strips non-ASCII / problematic Unicode characters (like Rupee symbol ₹ or emojis)
 * that corrupt font metrics in standard jsPDF WinAnsi / Latin-1 fonts.
 */
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

/**
 * Converts image URL into Base64 DataURL
 */
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

/**
 * Generates an extensive, highly structured, beautifully styled course brochure PDF
 * based on the reference design template and triggers browser download.
 */
export async function generate12PageCourseBrochurePDF(course, siteSettings = {}) {
  const data = await generateAIBrochureData(course, siteSettings);
  const logoInfo = await loadLogoDataUrl(siteSettings?.logo_url);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2; // 178mm
  const bottomLimit = pageH - 22;      // 275mm

  let cursorY = 32;

  function setFill(rgb) { pdf.setFillColor(rgb[0], rgb[1], rgb[2]); }
  function setStroke(rgb) { pdf.setDrawColor(rgb[0], rgb[1], rgb[2]); }
  function setText(rgb) { pdf.setTextColor(rgb[0], rgb[1], rgb[2]); }

  // Draw Background Watermark on current page
  function drawWatermark() {
    pdf.saveGraphicsState();
    setText(COLOR_WATERMARK);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(38);
    pdf.text('MARVEL SLICE', 105, 140, { align: 'center', angle: 45 });
    pdf.setFontSize(12);
    pdf.text('INSTITUTE FOR SOFTWARE LEARNING', 105, 158, { align: 'center', angle: 45 });
    pdf.restoreGraphicsState();
  }

  // Draw Top Decorative Corner Tag
  function drawCornerTag() {
    setFill(COLOR_ACCENT_GOLD);
    pdf.triangle(0, 0, 22, 0, 0, 22, 'F');
  }

  // Draw Page Header on pages 2+
  function drawPageHeader() {
    drawWatermark();
    drawCornerTag();

    const headerY = 10;
    let textStartX = margin;

    // Draw Logo on left corner
    if (logoInfo?.dataUrl) {
      try {
        const logoH = 10;
        const logoW = Math.min(24, (logoInfo.w / logoInfo.h) * logoH);
        pdf.addImage(logoInfo.dataUrl, 'PNG', margin, headerY, logoW, logoH);
        textStartX = margin + logoW + 4;
      } catch {
        drawEmblemLogo(headerY);
        textStartX = margin + 17;
      }
    } else {
      drawEmblemLogo(headerY);
      textStartX = margin + 17;
    }

    // Left Title Block
    pdf.setFontSize(13);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    pdf.text('Marvel Slice', textStartX, headerY + 4.5);

    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_BRAND_ORANGE);
    pdf.text('INSTITUTE FOR SOFTWARE LEARNING AND COMPETITIVE EXAMS', textStartX, headerY + 8.5);

    // Right Contact Block
    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    pdf.text('Phone: +91 63809 57390 / +91 80882 18609', pageW - margin, headerY + 4.5, { align: 'right' });

    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_BRAND_ORANGE);
    pdf.text('Email: sales@marvelslice.com', pageW - margin, headerY + 8.5, { align: 'right' });

    // Single Consistent Accent Divider Line
    const lineY = headerY + 12;
    setStroke(COLOR_ACCENT_GOLD);
    pdf.setLineWidth(0.8);
    pdf.line(margin, lineY, pageW - margin, lineY);
  }

  function drawEmblemLogo(y) {
    setFill(COLOR_PRIMARY_NAVY);
    pdf.roundedRect(margin, y, 13, 9.5, 1.5, 1.5, 'F');
    pdf.setFontSize(6.5);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_WHITE);
    pdf.text('MS', margin + 6.5, y + 6.2, { align: 'center' });
  }

  function checkSpace(neededMm = 15) {
    if (cursorY + neededMm > bottomLimit) {
      pdf.addPage();
      drawPageHeader();
      cursorY = 28;
    }
  }

  // Section Heading with gold accent bar
  function addSectionHeading(title, subtitle = '') {
    checkSpace(24);
    cursorY += 4;

    setFill(COLOR_PRIMARY_NAVY);
    pdf.rect(margin, cursorY - 1, 3.5, 9, 'F');

    pdf.setFontSize(13);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    pdf.text(sanitize(title), margin + 6, cursorY + 5.5);

    cursorY += 10;

    if (subtitle) {
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_ROYAL_BLUE);
      pdf.text(sanitize(subtitle), margin + 6, cursorY);
      cursorY += 5;
    }

    setStroke(COLOR_ACCENT_GOLD);
    pdf.setLineWidth(0.6);
    pdf.line(margin, cursorY, margin + 40, cursorY);
    cursorY += 5;
  }

  // Subheading with clean vertical marker
  function addSubHeading(title) {
    checkSpace(14);
    cursorY += 3;

    setFill(COLOR_ACCENT_GOLD);
    pdf.rect(margin, cursorY - 3.2, 2.5, 4.5, 'F');

    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    pdf.text(sanitize(title), margin + 5, cursorY);
    cursorY += 5.5;
  }

  // Paragraph formatting with standard line height
  function addParagraph(text, isMuted = false) {
    if (!text) return;
    const cleanStr = sanitize(text);
    if (!cleanStr) return;

    pdf.setFontSize(8.5);
    pdf.setFont('Helvetica', 'normal');
    setText(isMuted ? COLOR_TEXT_MUTED : COLOR_TEXT_BODY);

    const lines = pdf.splitTextToSize(cleanStr, contentW);
    const requiredH = lines.length * 4.2 + 2;
    checkSpace(requiredH);

    pdf.text(lines, margin, cursorY);
    cursorY += lines.length * 4.2 + 2.5;
  }

  // Hierarchical Chapter / Topic Item with Green Checkmark
  function addChapterItem(title) {
    const clean = sanitize(title);
    if (!clean) return;

    checkSpace(8);
    cursorY += 2;

    // Green circular checkmark badge
    setFill(COLOR_SUCCESS_GREEN);
    pdf.circle(margin + 3, cursorY - 1, 2.8, 'F');
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(6.5);
    setText(COLOR_WHITE);
    pdf.text('v', margin + 3, cursorY + 0.5, { align: 'center' });

    // Chapter Title
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    const lines = pdf.splitTextToSize(clean, contentW - 10);
    pdf.text(lines, margin + 8, cursorY);
    cursorY += lines.length * 4.2 + 2;
  }

  // Sub-Topic with Golden Arrow
  function addSubTopicItem(title, desc = '') {
    const cleanTitle = sanitize(title);
    const cleanDesc = sanitize(desc);
    if (!cleanTitle && !cleanDesc) return;

    const indent = 8;
    const textX = margin + indent + 5;
    const textW = contentW - indent - 5;

    pdf.setFontSize(8.5);
    const fullText = cleanDesc ? `${cleanTitle}: ${cleanDesc}` : cleanTitle;
    const lines = pdf.splitTextToSize(fullText, textW);
    checkSpace(lines.length * 4.2 + 2);

    // Golden arrow symbol
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(8);
    setText(COLOR_ACCENT_GOLD);
    pdf.text('->', margin + indent, cursorY);

    // Text content
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_TEXT_BODY);
    pdf.text(lines, textX, cursorY);
    cursorY += lines.length * 4.2 + 1.5;
  }

  // Individual bullet item
  function addBulletPoint(title, desc = '', indent = 4) {
    const cleanTitle = sanitize(title);
    const cleanDesc = sanitize(desc);
    if (!cleanTitle && !cleanDesc) return;

    const bulletX = margin + indent;
    const textX = margin + indent + 4;
    const textW = contentW - indent - 4;

    if (cleanTitle && cleanDesc) {
      pdf.setFontSize(8.5);
      const descLines = pdf.splitTextToSize(cleanDesc, textW);
      checkSpace((descLines.length + 1) * 4.2 + 3);

      setFill(COLOR_ACCENT_GOLD);
      pdf.circle(bulletX, cursorY - 1, 1.2, 'F');

      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(cleanTitle, textX, cursorY);
      cursorY += 4.2;

      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);
      pdf.text(descLines, textX, cursorY);
      cursorY += descLines.length * 4.2 + 2;
    } else {
      const lineText = cleanTitle || cleanDesc;
      pdf.setFontSize(8.5);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);

      const lines = pdf.splitTextToSize(lineText, textW);
      checkSpace(lines.length * 4.2 + 2);

      setFill(COLOR_ACCENT_GOLD);
      pdf.circle(bulletX, cursorY - 1, 1.2, 'F');

      pdf.text(lines, textX, cursorY);
      cursorY += lines.length * 4.2 + 2;
    }
  }

  // Callout info box
  function addCalloutBox(title, body, bgColor = COLOR_BLUE_TINT, borderColor = COLOR_ROYAL_BLUE) {
    const cleanTitle = sanitize(title);
    const cleanBody = sanitize(body);

    pdf.setFontSize(8.5);
    const lines = pdf.splitTextToSize(cleanBody, contentW - 12);
    const boxH = lines.length * 4.2 + (cleanTitle ? 12 : 8);

    checkSpace(boxH + 4);

    setFill(bgColor);
    setStroke(borderColor);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(margin, cursorY, contentW, boxH, 2.5, 2.5, 'FD');

    // Left thick accent line
    setFill(borderColor);
    pdf.roundedRect(margin, cursorY, 2.5, boxH, 1, 1, 'F');

    let textY = cursorY + 6;
    if (cleanTitle) {
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(9);
      setText(borderColor);
      pdf.text(cleanTitle, margin + 6, textY);
      textY += 5;
    }

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(8.5);
    setText(COLOR_TEXT_BODY);
    pdf.text(lines, margin + 6, textY);

    cursorY += boxH + 4;
  }

  // =========================================================================
  // PAGE 1: FRONT COVER / HERO & AUTHORITY PAGE (Inspired by Reference Cover)
  // =========================================================================
  function renderFrontCover() {
    drawCornerTag();

    const bannerH = 74;

    // Top Dark Blue Header Banner
    setFill(COLOR_PRIMARY_NAVY);
    pdf.rect(0, 0, pageW, bannerH, 'F');

    // Accent Gold curve accent
    setFill(COLOR_ACCENT_GOLD);
    pdf.rect(0, bannerH - 3, pageW, 3, 'F');

    // Central Circular Logo Badge (Vertically Centered in Banner)
    const badgeX = pageW - margin - 22;
    const badgeY = bannerH / 2;
    const badgeR = 23;

    // Outer Glow Ring
    setFill(COLOR_ACCENT_GOLD);
    pdf.circle(badgeX, badgeY, badgeR + 1.5, 'F');

    // Inner White Badge
    setFill(COLOR_WHITE);
    pdf.circle(badgeX, badgeY, badgeR, 'F');

    // Brand Logo scaled to properly fill the circular badge
    if (logoInfo?.dataUrl) {
      try {
        const ratio = (logoInfo.w || 1) / (logoInfo.h || 1);
        let drawW = 36;
        let drawH = drawW / ratio;
        if (drawH > 32) {
          drawH = 32;
          drawW = drawH * ratio;
        }
        pdf.addImage(logoInfo.dataUrl, 'PNG', badgeX - drawW / 2, badgeY - drawH / 2, drawW, drawH);
      } catch {
        pdf.setFontSize(13);
        pdf.setFont('Helvetica', 'bold');
        setText(COLOR_PRIMARY_NAVY);
        pdf.text('MARVEL', badgeX, badgeY - 2, { align: 'center' });
        setText(COLOR_BRAND_ORANGE);
        pdf.text('SLICE', badgeX, badgeY + 5, { align: 'center' });
      }
    } else {
      pdf.setFontSize(13);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text('MARVEL', badgeX, badgeY - 2, { align: 'center' });
      setText(COLOR_BRAND_ORANGE);
      pdf.text('SLICE', badgeX, badgeY + 5, { align: 'center' });
    }

    // Institute Authority Header (Aligned on Left)
    const textMaxW = badgeX - badgeR - margin - 6;

    pdf.setFontSize(15.5);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_WHITE);
    pdf.text('Leading Software & IT Training Institute', margin, 24, { maxWidth: textMaxW });

    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('INSTITUTE FOR SOFTWARE LEARNING AND COMPETITIVE EXAMS', margin, 33, { maxWidth: textMaxW });

    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    setText([224, 231, 255]);
    pdf.text('20+ Years of Excellence in IT Training & Career Transformations', margin, 41, { maxWidth: textMaxW });

    // Official curriculum badge inside banner
    setFill([18, 55, 128]);
    setStroke([35, 78, 160]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin, 48, 80, 7, 1.5, 1.5, 'FD');
    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('ACCREDITED PROFESSIONAL CAREER PROGRAM', margin + 4, 52.8);

    // Main Course Title Section
    cursorY = 88;

    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_BRAND_ORANGE);
    pdf.text('OFFICIAL CURRICULUM & CAREER SPECIFICATION', margin, cursorY);
    cursorY += 6;

    pdf.setFontSize(18);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    const titleLines = pdf.splitTextToSize(sanitize(data.meta.title), contentW - 20);
    pdf.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * 7 + 2;

    if (data.meta.subtitle) {
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_ROYAL_BLUE);
      const subLines = pdf.splitTextToSize(sanitize(data.meta.subtitle), contentW);
      pdf.text(subLines, margin, cursorY);
      cursorY += subLines.length * 4.5 + 4;
    }

    // Meta Pill Tags (Duration, Mode, Placement)
    const tagY = cursorY;
    const tags = [
      `Duration: ${data.meta.duration}`,
      `Mode: ${data.meta.mode}`,
      '100% Placement Support'
    ];

    let curTagX = margin;
    tags.forEach(tag => {
      const w = pdf.getTextWidth(tag) + 8;
      setFill(COLOR_BLUE_TINT);
      setStroke(COLOR_ROYAL_BLUE);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(curTagX, tagY, w, 6.5, 1.5, 1.5, 'FD');

      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_ROYAL_BLUE);
      pdf.text(tag, curTagX + 4, tagY + 4.5);
      curTagX += w + 4;
    });

    cursorY += 14;

    // Authority Metrics 3-Pillar Card (Navy Container matching reference)
    const cardY = cursorY;
    const cardH = 26;

    setFill(COLOR_PRIMARY_NAVY);
    pdf.roundedRect(margin, cardY, contentW, cardH, 4, 4, 'F');

    const colW = contentW / 3;

    // Metric 1
    pdf.setFontSize(12);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('20+ Years', margin + colW * 0.5, cardY + 9, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_WHITE);
    pdf.text('Experience in Training & Placements', margin + colW * 0.5, cardY + 16, { align: 'center', maxWidth: colW - 6 });

    // Divider Line 1
    setStroke([50, 80, 140]);
    pdf.setLineWidth(0.4);
    pdf.line(margin + colW, cardY + 4, margin + colW, cardY + cardH - 4);

    // Metric 2
    pdf.setFontSize(12);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('1.5 Lakh+', margin + colW * 1.5, cardY + 9, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_WHITE);
    pdf.text('Happy & Successful Learners', margin + colW * 1.5, cardY + 16, { align: 'center', maxWidth: colW - 6 });

    // Divider Line 2
    pdf.line(margin + colW * 2, cardY + 4, margin + colW * 2, cardY + cardH - 4);

    // Metric 3
    pdf.setFontSize(12);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('90,000+', margin + colW * 2.5, cardY + 9, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_WHITE);
    pdf.text('Successful IT Placements', margin + colW * 2.5, cardY + 16, { align: 'center', maxWidth: colW - 6 });

    cursorY += cardH + 10;

    // Authorized Training & Certification Partner for Top Brands
    pdf.setFontSize(9);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_PRIMARY_NAVY);
    pdf.text('Authorized Training & Certification Partner for Top Brands', margin, cursorY);
    cursorY += 5;

    // Partner Brand Badges Box
    const brandsBoxH = 34;
    setFill(COLOR_LIGHT_BG);
    setStroke(COLOR_BORDER);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, cursorY, contentW, brandsBoxH, 3, 3, 'FD');

    const partnerBrands = [
      ['IBM', 'Microsoft', 'Meta', 'Unity', 'Cisco'],
      ['Autodesk', 'Adobe', 'Apple', 'AWS', 'Google Cloud']
    ];

    let brandY = cursorY + 10;
    partnerBrands.forEach(row => {
      const bColW = contentW / row.length;
      row.forEach((bName, bIdx) => {
        const bX = margin + bColW * bIdx + bColW / 2;
        pdf.setFontSize(9);
        pdf.setFont('Helvetica', 'bold');
        setText(COLOR_TEXT_BODY);
        pdf.text(bName, bX, brandY, { align: 'center' });
      });
      brandY += 13;
    });

    // Bottom Footer Banner
    const footH = 14;
    setFill(COLOR_PRIMARY_NAVY);
    pdf.rect(0, pageH - footH, pageW, footH, 'F');

    pdf.setFontSize(7.5);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('Marvel Slice Institute for Software Learning and Competitive Exams', margin, pageH - 6.5);

    setText(COLOR_WHITE);
    pdf.text('www.marvelslice.com | +91 63809 57390', pageW - margin, pageH - 6.5, { align: 'right' });
  }

  // =========================================================================
  // PAGE 2: TARGET AUDIENCE ("Who Can Take Up This Program?")
  // =========================================================================
  function renderTargetAudience() {
    pdf.addPage();
    drawPageHeader();
    cursorY = 28;

    addSectionHeading('Who Can Take Up Our Services & Programs?', 'Tailored Learning Tracks for Every Stage of Your Career');

    addParagraph(
      'Our programs are engineered with a modular, zero-to-advanced learning trajectory, ensuring accessible on-ramps for complete beginners alongside rigorous technical depth for experienced practitioners.'
    );

    const profiles = [
      {
        num: '01',
        title: 'College Students & Freshers Seeking IT Jobs',
        desc: 'Ideal for BE, B.Tech, BCA, MCA, and BSc graduates looking to secure high-paying core software engineering jobs through structured hands-on coding and mock interviews.'
      },
      {
        num: '02',
        title: 'Candidates Shifting Career from Non-IT to IT',
        desc: 'Designed for professionals from mechanical, civil, commerce, or operations backgrounds seeking a mentored, step-by-step roadmap to transition into technology.'
      },
      {
        num: '03',
        title: 'IT Professionals Seeking Career Upskilling',
        desc: 'Targeted at junior developers, QA automation testers, and support engineers aiming to upgrade into Full Stack, Cloud, DevOps, and Senior Engineering positions.'
      },
      {
        num: '04',
        title: 'Candidates with Career Gaps Returning to Tech',
        desc: 'Specialized support for professionals restarting their careers after an employment break with refreshed skills, live portfolio projects, and placement drives.'
      }
    ];

    cursorY += 2;
    profiles.forEach(p => {
      const cardH = 22;
      checkSpace(cardH + 4);

      setFill(COLOR_LIGHT_BG);
      setStroke(COLOR_BORDER);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, cursorY, contentW, cardH, 2.5, 2.5, 'FD');

      // Left Gold Accent Strip
      setFill(COLOR_ACCENT_GOLD);
      pdf.roundedRect(margin, cursorY, 3, cardH, 1, 1, 'F');

      // Number badge
      setFill(COLOR_PRIMARY_NAVY);
      pdf.circle(margin + 12, cursorY + cardH / 2, 5, 'F');
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_WHITE);
      pdf.text(p.num, margin + 12, cursorY + cardH / 2 + 2.5, { align: 'center' });

      // Title
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(p.title, margin + 22, cursorY + 7);

      // Description
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);
      const lines = pdf.splitTextToSize(p.desc, contentW - 26);
      pdf.text(lines, margin + 22, cursorY + 12);

      cursorY += cardH + 4;
    });

    cursorY += 4;
    addCalloutBox(
      'Admissions & Eligibility Criteria',
      'No prior programming degree is mandatory. A basic familiarity with computer operations and a commitment to daily hands-on practice are all you need to get started. Pre-course foundational logic modules are included.',
      COLOR_GOLD_TINT,
      COLOR_BRAND_ORANGE
    );
  }

  // =========================================================================
  // PAGE 3: "8 Reasons to Choose Us for Your IT Training & Placements"
  // =========================================================================
  function render8Reasons() {
    pdf.addPage();
    drawPageHeader();
    cursorY = 28;

    addSectionHeading('8 Reasons to Choose Us for Your IT Training & Placements', 'The Marvel Slice Advantage: Proven Methodology for Career Success');

    const reasons = [
      { num: '1', title: 'Expert Career Guidance', desc: 'Personalized course matching based on qualification, market openings, and career goals.' },
      { num: '2', title: 'IT Professional Trainers', desc: 'Learn directly from industry software architects with 10+ years enterprise experience.' },
      { num: '3', title: 'Globally Valued Certification', desc: 'Receive verifiable certificates recognized by leading multinational technology firms.' },
      { num: '4', title: 'Complete 4-Hour Daily Solid Training', desc: '2 hrs Technical hands-on + 1 hr Aptitude drills + 1 hr Soft skills and mock interviews.' },
      { num: '5', title: 'Real-Time Capstone Projects', desc: 'Build and deploy enterprise-grade applications to showcase in technical interviews.' },
      { num: '6', title: 'Online and Offline Classroom Modes', desc: 'Flexible learning schedules with interactive live lectures and HD session archives.' },
      { num: '7', title: '100% Placement Support', desc: 'Dedicated resume restructuring, GitHub review, and direct referrals until you get placed.' },
      { num: '8', title: '1,000+ IT Recruiting Corporate Partners', desc: 'Access exclusive recruitment drives across product startups and global IT leaders.' }
    ];

    reasons.forEach(r => {
      const itemH = 16;
      checkSpace(itemH + 3);

      setFill(COLOR_LIGHT_BG);
      setStroke(COLOR_BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, cursorY, contentW, itemH, 2, 2, 'FD');

      // Left Number Pill
      setFill(COLOR_PRIMARY_NAVY);
      pdf.roundedRect(margin + 2, cursorY + 2, 10, itemH - 4, 1.5, 1.5, 'F');
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_ACCENT_GOLD);
      pdf.text(r.num, margin + 7, cursorY + itemH / 2 + 2.5, { align: 'center' });

      // Title & Desc
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(r.title, margin + 16, cursorY + 5.5);

      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);
      pdf.text(r.desc, margin + 16, cursorY + 11);

      cursorY += itemH + 3;
    });
  }

  // =========================================================================
  // PAGE 4: 4-HOUR SOLID TRAINING MODEL & METHODOLOGY
  // =========================================================================
  function renderTrainingModel() {
    pdf.addPage();
    drawPageHeader();
    cursorY = 28;

    addSectionHeading('Complete Job Training at One Place', 'The 4-Hour Daily Solid Training Framework (Investment is Less, Return is More)');

    addParagraph(
      'To ensure complete industry readiness, Marvel Slice delivers a holistic 4-hour daily structured regimen combining technical coding, aptitude problem solving, and corporate communication skills.'
    );

    cursorY += 2;

    const pillars = [
      {
        hours: '2 hrs / day',
        title: 'Technical Hands-On Skills',
        desc: 'Interactive live coding, architectural design patterns, framework implementation, and daily lab challenges reviewed line-by-line by senior tech mentors.'
      },
      {
        hours: '1 hr / day',
        title: 'Aptitude & Logical Reasoning',
        desc: 'Quantitative aptitude, logical deduction, algorithmic complexity drills, and company-specific assessment problem sets.'
      },
      {
        hours: '1 hr / day',
        title: 'Soft Skills & Interview Readiness',
        desc: 'Professional communication, technical presentation, behavioral STAR methodology, mock interview simulations, and resume refinement.'
      }
    ];

    pillars.forEach(p => {
      const pH = 24;
      checkSpace(pH + 4);

      setFill(COLOR_BLUE_TINT);
      setStroke(COLOR_ROYAL_BLUE);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, cursorY, contentW, pH, 3, 3, 'FD');

      // Left Badge
      setFill(COLOR_ROYAL_BLUE);
      pdf.roundedRect(margin + 3, cursorY + 3, 26, 7, 1.5, 1.5, 'F');
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_WHITE);
      pdf.text(p.hours, margin + 16, cursorY + 7.5, { align: 'center' });

      // Title
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(p.title, margin + 33, cursorY + 8);

      // Description
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);
      const lines = pdf.splitTextToSize(p.desc, contentW - 12);
      pdf.text(lines, margin + 6, cursorY + 16);

      cursorY += pH + 4;
    });

    cursorY += 4;
    addSubHeading('Instructor-Led Sessions & Daily Task Tracking');
    addParagraph(
      'Every session is delivered live by industry experienced trainers. Daily assignments and practical tasks are assigned at the end of each class. Doubts are clarified immediately during interactive sessions, complemented by specialized Saturday mentoring workshops.'
    );
  }

  // =========================================================================
  // CURRICULUM & SYLLABUS MODULES (Pages 5+)
  // =========================================================================
  function renderCurriculumModules() {
    pdf.addPage();
    drawPageHeader();
    cursorY = 28;

    addSectionHeading('Comprehensive Phased Curriculum & Detailed Syllabus', 'Structured Step-by-Step Roadmap from Core Fundamentals to Cloud Deployment');

    const modules = data.modules || [];

    modules.forEach((mod, idx) => {
      checkSpace(35);

      // Module Banner Header
      cursorY += 4;
      const modH = 9;
      setFill(COLOR_PRIMARY_NAVY);
      pdf.roundedRect(margin, cursorY, contentW, modH, 1.5, 1.5, 'F');

      // Left Tag
      setFill(COLOR_ACCENT_GOLD);
      pdf.roundedRect(margin + 1, cursorY + 1, 20, modH - 2, 1, 1, 'F');
      pdf.setFontSize(7.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(`MODULE ${mod.moduleNumber || idx + 1}`, margin + 11, cursorY + 6, { align: 'center' });

      // Module Title
      pdf.setFontSize(9);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_WHITE);
      pdf.text(sanitize(mod.title), margin + 25, cursorY + 6);

      cursorY += modH + 4;

      if (mod.objective) {
        pdf.setFontSize(8);
        pdf.setFont('Helvetica', 'bold');
        setText(COLOR_ROYAL_BLUE);
        pdf.text(`Objective: ${sanitize(mod.objective)}`, margin + 2, cursorY);
        cursorY += 5;
      }

      // Topics with Hierarchical Checkmark & Arrow System
      const topics = mod.topics || [];
      topics.forEach((t) => {
        if (typeof t === 'string') {
          addChapterItem(t);
        } else if (t && typeof t === 'object') {
          addChapterItem(t.title || t.name);
          const subItems = t.subtopics || t.bullets || [];
          subItems.forEach(sub => addSubTopicItem(sub));
        }
      });

      // Hands-on Lab box
      if (mod.handsOnLab) {
        cursorY += 2;
        addCalloutBox('Hands-on Lab Milestone', mod.handsOnLab, COLOR_GOLD_TINT, COLOR_BRAND_ORANGE);
      }

      cursorY += 3;
    });
  }

  // =========================================================================
  // PRODUCTION CAPSTONE PROJECTS
  // =========================================================================
  function renderCapstoneProjects() {
    checkSpace(40);
    addSectionHeading('Real-World Production Capstone Projects', 'Build a Distinguished GitHub Portfolio that Proves Your Technical Mastery');

    addParagraph(
      'Theory alone is insufficient to stand out. Every candidate builds and deploys 3 substantial, production-ready applications with automated tests and cloud hosting.'
    );

    const projects = data.projects || [];
    projects.forEach((proj, idx) => {
      const projH = 30;
      checkSpace(projH + 4);

      setFill(COLOR_LIGHT_BG);
      setStroke(COLOR_BORDER);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, cursorY, contentW, projH, 2.5, 2.5, 'FD');

      // Left Accent Strip
      setFill(COLOR_ROYAL_BLUE);
      pdf.roundedRect(margin, cursorY, 3, projH, 1, 1, 'F');

      // Title & Tag
      pdf.setFontSize(9.5);
      pdf.setFont('Helvetica', 'bold');
      setText(COLOR_PRIMARY_NAVY);
      pdf.text(`Capstone ${idx + 1}: ${sanitize(proj.title)}`, margin + 6, cursorY + 7);

      // Description
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'normal');
      setText(COLOR_TEXT_BODY);
      const lines = pdf.splitTextToSize(sanitize(proj.description || proj.desc), contentW - 12);
      pdf.text(lines, margin + 6, cursorY + 13);

      cursorY += projH + 4;
    });
  }

  // =========================================================================
  // CERTIFICATION, PLACEMENT & OFFICIAL CONTACTS (Final Section)
  // =========================================================================
  function renderFinalSection() {
    checkSpace(50);
    addSectionHeading('Verified Certification & 100% Placement Assistance', 'Globally Recognized Credentials & Dedicated Career Support');

    addSubHeading('Globally Valued Marvel Slice Certification');
    addParagraph(
      'Upon completing coursework, weekly labs, and project defenses, candidates receive the Marvel Slice Certified Professional credential, featuring permanent cryptographic online verification directly shareable on LinkedIn and technical resumes.'
    );

    addSubHeading('Dedicated 3-Step Placement Framework');
    addBulletPoint('Step 1: Resume & GitHub Polish', 'ATS-compliant resume restructuring, LinkedIn profile optimization, and public portfolio polish.');
    addBulletPoint('Step 2: Mock Interviews & Whiteboard Drills', 'Rigorous 1-on-1 technical mock interviews, behavioral coaching, and system design drills.');
    addBulletPoint('Step 3: Direct Corporate Referrals', 'Profile shortlisting and direct recruitment drives across our 1,000+ corporate hiring partner network.');

    // Official Contact Card
    cursorY += 4;
    const contactH = 26;
    checkSpace(contactH + 4);

    setFill(COLOR_PRIMARY_NAVY);
    pdf.roundedRect(margin, cursorY, contentW, contactH, 3, 3, 'F');

    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('Marvel Slice Institute for Software Learning and Competitive Exams', margin + 6, cursorY + 8);

    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_WHITE);
    pdf.text('Phone: +91 63809 57390 / +91 80882 18609', margin + 6, cursorY + 15);
    pdf.text('Email: sales@marvelslice.com', margin + 6, cursorY + 20);

    pdf.setFontSize(8);
    pdf.setFont('Helvetica', 'bold');
    setText(COLOR_ACCENT_GOLD);
    pdf.text('Website: www.marvelslice.com', pageW - margin - 6, cursorY + 18, { align: 'right' });

    cursorY += contactH + 4;
  }

  // =========================================================================
  // EXECUTION SEQUENCE
  // =========================================================================
  // 1. Front Cover Hero Page
  renderFrontCover();

  // 2. Who Can Take Up This Program?
  renderTargetAudience();

  // 3. 8 Reasons to Choose Us
  render8Reasons();

  // 4. Complete Job Training Model (4 hrs/day)
  renderTrainingModel();

  // 5. Comprehensive Syllabus & Modules
  renderCurriculumModules();

  // 6. Capstone Projects
  renderCapstoneProjects();

  // 7. Certification & Placement Contacts
  renderFinalSection();

  // =========================================================================
  // NUMBER ALL PAGES (Footer)
  // =========================================================================
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Skip footer on cover page 1
    if (i === 1) continue;

    const footY = pageH - 8;

    // Footer divider line
    setStroke(COLOR_BORDER);
    pdf.setLineWidth(0.4);
    pdf.line(margin, footY - 3, pageW - margin, footY - 3);

    pdf.setFontSize(7);
    pdf.setFont('Helvetica', 'normal');
    setText(COLOR_TEXT_MUTED);
    pdf.text('Marvel Slice Institute for Software Learning and Competitive Exams • www.marvelslice.com', margin, footY);
    pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, footY, { align: 'right' });
  }

  // Save the PDF directly to trigger the browser download
  const rawTitle = course?.title || 'Course';
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  const fileName = `Marvel_Slice_${cleanTitle}_Brochure.pdf`;
  pdf.save(fileName);

  return pdf;
}
