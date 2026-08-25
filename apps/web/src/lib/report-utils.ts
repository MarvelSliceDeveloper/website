"use client";

import type { DashboardChartData } from "@/lib/api-types";
import { useApiQuery } from "@/lib/query";
import jsPDF, { GState } from "jspdf";
import autoTable from "jspdf-autotable";

// ── Colors ──
// NOTE: apex/canvas need concrete hex values, not CSS custom properties.
const COLORS = {
  primary: "#6d7dff",
  accent: "#25c0e8",
  success: "#2fbf71",
  warning: "#f5ad42",
  danger: "#f05d7d",
  muted: "#8b93ae",
  grid: "#e9edf5",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: COLORS.success,
  PENDING: COLORS.warning,
  FAILED: COLORS.danger,
  REFUNDED: COLORS.muted,
};

const TIME_RANGES = [
  { label: "1 Week", value: "1w" },
  { label: "1 Month", value: "1m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
  { label: "All Time", value: "all" },
] as const;

function getDateRange(range: string): { from?: string; to?: string } {
  if (range === "all") return {};
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  switch (range) {
    case "1w":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1m":
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "6m":
      from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case "1y":
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return {};
  }
  return { from: from.toISOString(), to };
}

function getPreviousDateRange(
  range: string,
): { from?: string; to?: string } | null {
  if (range === "all") return null;
  const current = getDateRange(range);
  if (!current.from || !current.to) return null;
  const fromMs = new Date(current.from).getTime();
  const toMs = new Date(current.to).getTime();
  const duration = toMs - fromMs;
  return {
    from: new Date(fromMs - duration).toISOString(),
    to: new Date(fromMs).toISOString(),
  };
}

function pctChange(
  current: number,
  previous: number,
): { text: string; direction: "up" | "down" | "flat" } {
  if (previous === 0) {
    if (current === 0) return { text: "0%", direction: "flat" };
    return { text: "New", direction: "up" };
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  if (rounded === 0) return { text: "0%", direction: "flat" };
  return {
    text: `${rounded > 0 ? "+" : ""}${rounded}%`,
    direction: rounded > 0 ? "up" : "down",
  };
}

function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// ── Canvas chart helpers (rendered to PNG, embedded in PDFs) ──
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function drawBarChart(
  labels: string[],
  values: number[],
  color: string,
  opts?: { horizontal?: boolean; valueSuffix?: string },
): string {
  const c = makeCanvas(700, 340);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const suffix = opts?.valueSuffix ?? "";

  if (opts?.horizontal) {
    const padL = 140,
      padR = 40,
      padT = 20,
      padB = 20;
    const plotW = c.width - padL - padR;
    const plotH = c.height - padT - padB;
    const max = Math.max(...values, 1);
    const n = labels.length || 1;
    const gap = plotH / n;
    const bh = gap * 0.55;
    for (let i = 0; i < n; i++) {
      const yPos = padT + gap * i + (gap - bh) / 2;
      const bw = (values[i] / max) * plotW;
      ctx.fillStyle = color;
      ctx.fillRect(padL, yPos, bw, bh);
      ctx.fillStyle = "#374151";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      const lbl =
        labels[i].length > 20 ? labels[i].slice(0, 19) + "…" : labels[i];
      ctx.fillText(lbl, padL - 8, yPos + bh / 2 + 4);
      ctx.textAlign = "left";
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(
        `${Math.round(values[i])}${suffix}`,
        padL + bw + 6,
        yPos + bh / 2 + 4,
      );
    }
    return c.toDataURL("image/png");
  }

  const padL = 48,
    padR = 20,
    padT = 28,
    padB = 96;
  const plotW = c.width - padL - padR;
  const plotH = c.height - padT - padB;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = COLORS.grid;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const y = padT + plotH - (v / max) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(c.width - padR, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(v)), padL - 8, y + 4);
  }
  const n = labels.length || 1;
  const gap = plotW / n;
  const bw = gap * 0.6;
  for (let i = 0; i < n; i++) {
    const x = padL + gap * i + (gap - bw) / 2;
    const bh = (values[i] / max) * plotH;
    const y = padT + plotH - bh;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(values[i])}${suffix}`, x + bw / 2, y - 6);
    ctx.fillStyle = "#4b5563";
    ctx.font = "10px sans-serif";
    const lbl =
      labels[i].length > 16 ? labels[i].slice(0, 15) + "…" : labels[i];
    ctx.save();
    ctx.translate(x + bw / 2, padT + plotH + 14);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = "right";
    ctx.fillText(lbl, 0, 0);
    ctx.restore();
  }
  return c.toDataURL("image/png");
}

function drawDonut(
  labels: string[],
  values: number[],
  colors: string[],
): string {
  const c = makeCanvas(700, 300);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 190,
    cy = 150,
    r = 110,
    ir = 64;
  let start = -Math.PI / 2;
  for (let i = 0; i < values.length; i++) {
    const ang = (values[i] / total) * Math.PI * 2;
    const end = start + ang;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    start = end;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(total), cx, cy - 2);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "11px sans-serif";
  ctx.fillText("Total", cx, cy + 14);
  let ly = 46;
  ctx.textAlign = "left";
  for (let i = 0; i < labels.length; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(360, ly - 11, 13, 13);
    ctx.fillStyle = "#374151";
    ctx.font = "12px sans-serif";
    ctx.fillText(
      `${labels[i]}: ${values[i]} (${Math.round((values[i] / total) * 100)}%)`,
      382,
      ly,
    );
    ly += 28;
  }
  return c.toDataURL("image/png");
}

function drawArea(
  labels: string[],
  values: number[],
  color: string,
  valueFormatter?: (n: number) => string,
): string {
  const c = makeCanvas(700, 300);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const padL = 56,
    padR = 20,
    padT = 28,
    padB = 56;
  const plotW = c.width - padL - padR;
  const plotH = c.height - padT - padB;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = COLORS.grid;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const y = padT + plotH - (v / max) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(c.width - padR, y);
    ctx.stroke();
    const label = valueFormatter ? valueFormatter(v) : String(Math.round(v));
    ctx.fillText(label, padL - 8, y + 4);
  }
  const n = labels.length;
  const pts =
    n === 0
      ? []
      : labels.map((l, i) => ({
          x: padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1)),
          y: padT + plotH - (values[i] / max) * plotH,
          l,
        }));
  if (pts.length) {
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, color + "55");
    grad.addColorStop(1, color + "00");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, padT + plotH);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = "#4b5563";
      ctx.font = "10px sans-serif";
      ctx.fillText(p.l, p.x, padT + plotH + 16);
    });
  }
  return c.toDataURL("image/png");
}

// ── PDF layout constants ──
const PAGE_BREAK_Y = 250;
const SECTION_TABLE_BREAK_Y = 240;
const FOOTER_Y_OFFSET = 10;

/**
 * Shared PDF scaffold: cover page, table of contents, section headers,
 * images, tables, and footers. Both the Course PDF and the Payment PDF
 * are built with this so the two exports look and behave consistently.
 */
class ReportPdfBuilder {
  doc: jsPDF;
  y = 20;
  pageWidth: number;
  pageHeight: number;
  toc: { title: string; page: number }[] = [];

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.doc.addPage(); // page 2: table of contents
    this.doc.addPage(); // page 3: content starts here
    this.doc.setPage(3);
  }

  private checkBreak(threshold = SECTION_TABLE_BREAK_Y) {
    if (this.y > threshold) {
      this.doc.addPage();
      this.y = 20;
    }
  }

  sectionHeader(title: string) {
    this.checkBreak();
    this.toc.push({ title, page: this.doc.internal.pages.length - 1 });
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(20, 24, 40);
    this.doc.text(title, 20, this.y);
    this.y += 8;
  }

  caption(text: string) {
    this.doc.setFontSize(8.5);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(90, 96, 115);
    const wrapped = this.doc.splitTextToSize(text, this.pageWidth - 40);
    this.doc.text(wrapped, 20, this.y);
    this.y += wrapped.length * 4.5 + 4;
  }

  paragraph(text: string) {
    this.doc.setFontSize(9.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(60, 66, 82);
    const wrapped = this.doc.splitTextToSize(text, this.pageWidth - 40);
    this.doc.text(wrapped, 20, this.y);
    this.y += wrapped.length * 5 + 6;
  }

  bulletList(lines: string[]) {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(60, 66, 82);
    lines.forEach((line) => {
      const wrapped = this.doc.splitTextToSize(
        `•  ${line}`,
        this.pageWidth - 44,
      );
      this.checkBreak(PAGE_BREAK_Y);
      this.doc.text(wrapped, 24, this.y);
      this.y += wrapped.length * 5 + 2;
    });
    this.y += 4;
  }

  metricCards(
    metrics: { label: string; value: string; prev?: number | null }[],
  ) {
    const cardW = 40;
    const cardGap = 5;
    let cardX = 20;
    metrics.forEach((m) => {
      this.doc.setFillColor(244, 246, 252);
      this.doc.setDrawColor(225, 230, 240);
      this.doc.roundedRect(cardX, this.y, cardW, 26, 2, 2, "FD");
      this.doc.setFontSize(7);
      this.doc.setTextColor(110, 120, 145);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(m.label.toUpperCase(), cardX + cardW / 2, this.y + 7, {
        align: "center",
      });
      this.doc.setFontSize(15);
      this.doc.setTextColor(20, 24, 40);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(m.value, cardX + cardW / 2, this.y + 17, {
        align: "center",
      });
      if (m.prev !== undefined && m.prev !== null) {
        const numericValue = Number(m.value.replace(/[^0-9.-]/g, ""));
        const delta = pctChange(numericValue, m.prev);
        const badgeColor =
          delta.direction === "up"
            ? [47, 191, 113]
            : delta.direction === "down"
              ? [240, 93, 125]
              : [139, 147, 174];
        const arrow =
          delta.direction === "up"
            ? "▲"
            : delta.direction === "down"
              ? "▼"
              : "—";
        this.doc.setFontSize(7.5);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        this.doc.text(
          `${arrow} ${delta.text} vs last period`,
          cardX + cardW / 2,
          this.y + 23,
          { align: "center" },
        );
      }
      cardX += cardW + cardGap;
    });
    this.y += 34;
  }

  image(base64: string, naturalW: number, naturalH: number) {
    const w = 170;
    const h = (w * naturalH) / naturalW;
    if (this.y + h > PAGE_BREAK_Y) {
      this.doc.addPage();
      this.y = 20;
    }
    this.doc.addImage(base64, "PNG", 20, this.y, w, h);
    this.y += h + 6;
  }

  table(
    head: string[],
    body: string[][],
    columnStyles?: Record<number, { cellWidth: number }>,
  ) {
    autoTable(this.doc, {
      startY: this.y,
      head: [head],
      body,
      theme: "grid",
      headStyles: { fillColor: [109, 125, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles,
      margin: { left: 20, right: 20 },
    });
    // @ts-expect-error jspdf-autotable augments the doc instance at runtime
    this.y = this.doc.lastAutoTable.finalY + 10;
  }

  noData() {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(120, 126, 140);
    this.doc.text("No data available", 20, this.y + 6);
    this.y += 14;
  }

  finalize(opts: {
    coverEyebrow: string;
    coverTitle: string;
    periodLabel: string;
    generatedDate: string;
    footerLabel: string;
  }) {
    const totalPages = this.doc.getNumberOfPages();

    // ── Page 1: cover ──
    this.doc.setPage(1);
    this.doc.setFillColor(109, 125, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");
    this.doc.setFillColor(255, 255, 255);
    this.doc.setGState(new GState({ opacity: 0.08 }));
    this.doc.circle(this.pageWidth - 20, 40, 70, "F");
    this.doc.circle(10, this.pageHeight - 30, 50, "F");
    this.doc.setGState(new GState({ opacity: 1 }));

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("LMS PORTAL", 20, 40);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(opts.coverEyebrow, 20, 46);

    this.doc.setFontSize(28);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(opts.coverTitle, 20, this.pageHeight / 2 - 10);
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `Reporting Period: ${opts.periodLabel}`,
      20,
      this.pageHeight / 2 + 5,
    );

    this.doc.setFontSize(9.5);
    this.doc.text(
      `Generated on ${opts.generatedDate}`,
      20,
      this.pageHeight - 40,
    );
    this.doc.setFontSize(8);
    this.doc.text(
      "This is an automatically generated report. All figures reflect platform data as of the generation date.",
      20,
      this.pageHeight - 32,
      { maxWidth: this.pageWidth - 40 },
    );
    this.doc.setFont("helvetica", "bold");
    this.doc.text("CONFIDENTIAL", 20, this.pageHeight - 20);

    // ── Page 2: table of contents ──
    this.doc.setPage(2);
    this.doc.setTextColor(20, 24, 40);
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Table of Contents", 20, 30);
    this.doc.setDrawColor(225, 230, 240);
    this.doc.line(20, 35, this.pageWidth - 20, 35);

    let tocY = 48;
    this.toc.forEach((entry) => {
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(50, 56, 72);
      this.doc.text(entry.title, 24, tocY);
      const pageLabel = String(entry.page);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(109, 125, 255);
      this.doc.text(pageLabel, this.pageWidth - 24, tocY, { align: "right" });
      const titleWidth = this.doc.getTextWidth(entry.title);
      const pageLabelWidth = this.doc.getTextWidth(pageLabel);
      const dotsStart = 24 + titleWidth + 3;
      const dotsEnd = this.pageWidth - 24 - pageLabelWidth - 3;
      if (dotsEnd > dotsStart) {
        this.doc.setLineDashPattern([0.5, 1.5], 0);
        this.doc.setDrawColor(200, 205, 220);
        this.doc.line(dotsStart, tocY - 1, dotsEnd, tocY - 1);
        this.doc.setLineDashPattern([], 0);
      }
      tocY += 11;
    });

    // ── Footer on every content page ──
    for (let i = 2; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(7);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(
        `${opts.footerLabel} | Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - FOOTER_Y_OFFSET,
        { align: "center" },
      );
    }
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

/**
 * Shared data-fetching hook for report pages. Loads stats for the selected
 * time range plus the previous period (for delta comparisons).
 */
function useReportData(timeRange: string) {
  const currentParams = getDateRange(timeRange);
  const currentQuery = useApiQuery<DashboardChartData>(
    ["admin", "dashboard", "stats", timeRange],
    "/api/admin/dashboard/stats",
    currentParams.from && currentParams.to
      ? { from: currentParams.from, to: currentParams.to }
      : undefined,
  );

  const prevRange = getPreviousDateRange(timeRange);
  const prevQuery = useApiQuery<DashboardChartData>(
    ["admin", "dashboard", "stats", "prev", timeRange],
    "/api/admin/dashboard/stats",
    prevRange?.from && prevRange.to
      ? { from: prevRange.from, to: prevRange.to }
      : undefined,
    { enabled: prevRange !== null },
  );

  return {
    data: currentQuery.data ?? null,
    prevData: prevQuery.data ?? null,
    loading: currentQuery.isLoading || prevQuery.isLoading,
    refetch: () => {
      void currentQuery.refetch();
      void prevQuery.refetch();
    },
  };
}

export {
  COLORS,
  PIE_COLORS,
  PAYMENT_STATUS_COLORS,
  TIME_RANGES,
  getDateRange,
  getPreviousDateRange,
  pctChange,
  formatINR,
  makeCanvas,
  drawBarChart,
  drawDonut,
  drawArea,
  ReportPdfBuilder,
  useReportData,
};
