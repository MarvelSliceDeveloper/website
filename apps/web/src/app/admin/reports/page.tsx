"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { DashboardChartData } from "@/lib/api-types";
import dynamic from "next/dynamic";
import { usePageTitle } from "@/lib/use-page-title";
import { IconDownload, IconCalendar, IconRefresh } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const COLORS = {
  primary: "#6d7dff",
  accent: "#25c0e8",
  success: "#2fbf71",
  warning: "#f5ad42",
  danger: "#f05d7d",
  muted: "#8b93ae",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
];

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

// The period immediately preceding the current one, same duration.
// Used to compute "+12% vs last period" deltas. Returns null for "all time"
// since there is no meaningful prior period to compare against.
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

// ── Canvas chart helpers (rendered to PNG, embedded in the PDF) ──
type ChartDatum = { label: string; value: number };

const CANVAS_COLORS = [
  "#6d7dff",
  "#25c0e8",
  "#2fbf71",
  "#f5ad42",
  "#f05d7d",
  "#8b5cf6",
];

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
): string {
  const c = makeCanvas(700, 340);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const padL = 48,
    padR = 20,
    padT = 28,
    padB = 96;
  const plotW = c.width - padL - padR;
  const plotH = c.height - padT - padB;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = "#e9edf5";
  ctx.fillStyle = "#8b93ae";
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
    ctx.fillText(String(values[i]), x + bw / 2, y - 6);
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
  ctx.fillStyle = "#8b93ae";
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

function drawArea(labels: string[], values: number[], color: string): string {
  const c = makeCanvas(700, 300);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const padL = 48,
    padR = 20,
    padT = 28,
    padB = 56;
  const plotW = c.width - padL - padR;
  const plotH = c.height - padT - padB;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = "#e9edf5";
  ctx.fillStyle = "#8b93ae";
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

// ── PDF layout constants (named instead of scattered magic numbers) ──
const PAGE_MARGIN = 20;
const PAGE_BREAK_Y = 250; // below this, a chart image forces a new page
const SECTION_TABLE_BREAK_Y = 240;
const FOOTER_Y_OFFSET = 10;

export default function ReportsPage() {
  usePageTitle("Reports");
  const [data, setData] = useState<DashboardChartData | null>(null);
  const [prevData, setPrevData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [timeRange, setTimeRange] = useState("all");

  const fetchData = useCallback(async (range: string) => {
    setLoading(true);
    try {
      const params = getDateRange(range);
      const query = new URLSearchParams();
      if (params.from) query.set("from", params.from);
      if (params.to) query.set("to", params.to);
      const qs = query.toString();
      const res = await api.get<DashboardChartData>(
        `/api/admin/dashboard/stats${qs ? `?${qs}` : ""}`,
      );
      setData(res);

      // Fetch the equivalent prior period so the report can show
      // period-over-period deltas. Silently skipped for "all time".
      const prevRange = getPreviousDateRange(range);
      if (prevRange) {
        const prevQuery = new URLSearchParams();
        if (prevRange.from) prevQuery.set("from", prevRange.from);
        if (prevRange.to) prevQuery.set("to", prevRange.to);
        try {
          const prevRes = await api.get<DashboardChartData>(
            `/api/admin/dashboard/stats?${prevQuery.toString()}`,
          );
          setPrevData(prevRes);
        } catch (e) {
          console.error("Failed to load previous period data:", e);
          setPrevData(null);
        }
      } else {
        setPrevData(null);
      }
    } catch (e) {
      console.error("Failed to load report data:", e);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  const handleDownloadPDF = async () => {
    if (!data) return;
    setDownloading(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const periodLabel =
        timeRange === "all"
          ? "All Time"
          : (TIME_RANGES.find((t) => t.value === timeRange)?.label ??
            timeRange);
      const generatedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Reserve page 1 (cover) and page 2 (table of contents) as blanks.
      // We fill them in at the end once we know which page every section
      // landed on — jsPDF lays out content sequentially, so page numbers
      // aren't known ahead of time.
      doc.addPage(); // page 2: TOC
      doc.addPage(); // page 3: content starts here
      doc.setPage(3);
      let y = 20;

      // Tracks { sectionTitle: pageNumber } as each header is written,
      // used to build the table of contents afterward.
      const toc: { title: string; page: number }[] = [];
      const recordSection = (title: string) => {
        toc.push({ title, page: doc.internal.pages.length - 1 });
      };

      // ── Pre-render charts to images ──
      const pkgLabels = (data.studentsPerPackage ?? []).map(
        (d) => d.packageName,
      );
      const pkgVals = (data.studentsPerPackage ?? []).map((d) => d.count);
      const courseLabels = (data.studentsPerCourse ?? []).map(
        (d) => d.courseTitle,
      );
      const courseVals = (data.studentsPerCourse ?? []).map((d) => d.count);
      const growthLabels = (data.enrollmentTrend ?? []).map((d) => d.month);
      const growthVals = (data.enrollmentTrend ?? []).map((d) => d.count);
      const batchLabels = (data.batchDistribution ?? []).map((d) => d.status);
      const batchVals = (data.batchDistribution ?? []).map((d) => d.count);
      const roleLabels = (data.userRoleDistribution ?? []).map((d) => d.role);
      const roleVals = (data.userRoleDistribution ?? []).map((d) => d.count);

      const imgPkg = pkgVals.length
        ? drawBarChart(pkgLabels, pkgVals, CANVAS_COLORS[0])
        : null;
      const imgCourse = courseVals.length
        ? drawBarChart(courseLabels, courseVals, CANVAS_COLORS[1])
        : null;
      const imgGrowth = growthVals.length
        ? drawArea(growthLabels, growthVals, CANVAS_COLORS[0])
        : null;
      const imgBatch = batchVals.length
        ? drawDonut(batchLabels, batchVals, CANVAS_COLORS)
        : null;
      const imgRoles = roleVals.length
        ? drawDonut(roleLabels, roleVals, CANVAS_COLORS)
        : null;

      // Revenue chart images
      const revenueLabels = (data.monthlyRevenue ?? []).map((d) => d.month);
      const revenueVals = (data.monthlyRevenue ?? []).map((d) => d.amount);
      const imgRevenue = revenueVals.length
        ? drawArea(revenueLabels, revenueVals, CANVAS_COLORS[3])
        : null;
      const revPkgLabels = (data.revenueByPackage ?? []).map(
        (d) => d.packageName,
      );
      const revPkgVals = (data.revenueByPackage ?? []).map((d) => d.total);
      const imgRevPkg = revPkgVals.length
        ? drawBarChart(revPkgLabels, revPkgVals, CANVAS_COLORS[4])
        : null;

      const totalStudents =
        (data.userRoleDistribution ?? []).find((u) => u.role === "STUDENT")
          ?.count ?? 0;
      const totalInstructors =
        (data.userRoleDistribution ?? []).find((u) => u.role === "INSTRUCTOR")
          ?.count ?? 0;
      const activeBatches =
        (data.batchDistribution ?? []).find((b) => b.status === "ACTIVE")
          ?.count ?? 0;
      const totalEnrollments = pkgVals.reduce((a, b) => a + b, 0);
      const totalPackages = pkgLabels.length;

      // Prior-period equivalents for the delta badges on the summary cards.
      const prevStudents = prevData
        ? ((prevData.userRoleDistribution ?? []).find(
            (u) => u.role === "STUDENT",
          )?.count ?? 0)
        : null;
      const prevInstructors = prevData
        ? ((prevData.userRoleDistribution ?? []).find(
            (u) => u.role === "INSTRUCTOR",
          )?.count ?? 0)
        : null;
      const prevActiveBatches = prevData
        ? ((prevData.batchDistribution ?? []).find((b) => b.status === "ACTIVE")
            ?.count ?? 0)
        : null;
      const prevPackages = prevData
        ? (prevData.studentsPerPackage ?? []).length
        : null;

      // ══════════════════════════════════════════════
      // SECTION 1 — Executive Summary
      // ══════════════════════════════════════════════
      recordSection("1. Executive Summary");
      doc.setTextColor(20, 24, 40);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("1. Executive Summary", 20, y);
      y += 8;

      const metrics: { label: string; value: string; prev: number | null }[] = [
        {
          label: "Total Learners",
          value: String(totalStudents),
          prev: prevStudents,
        },
        { label: "Packages", value: String(totalPackages), prev: prevPackages },
        {
          label: "Active Batches",
          value: String(activeBatches),
          prev: prevActiveBatches,
        },
        {
          label: "Instructors",
          value: String(totalInstructors),
          prev: prevInstructors,
        },
      ];
      const cardW = 36;
      const cardGap = 5;
      let cardX = 20;
      metrics.forEach((m) => {
        doc.setFillColor(244, 246, 252);
        doc.setDrawColor(225, 230, 240);
        doc.roundedRect(cardX, y, cardW, 26, 2, 2, "FD");
        doc.setFontSize(7);
        doc.setTextColor(110, 120, 145);
        doc.setFont("helvetica", "normal");
        doc.text(m.label.toUpperCase(), cardX + cardW / 2, y + 7, {
          align: "center",
        });
        doc.setFontSize(16);
        doc.setTextColor(20, 24, 40);
        doc.setFont("helvetica", "bold");
        doc.text(m.value, cardX + cardW / 2, y + 17, { align: "center" });

        // Period-over-period delta badge
        if (m.prev !== null) {
          const delta = pctChange(Number(m.value), m.prev);
          const badgeColor =
            delta.direction === "up"
              ? [47, 191, 113]
              : delta.direction === "down"
                ? [240, 93, 125]
                : [139, 147, 174];
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
          const arrow =
            delta.direction === "up"
              ? "▲"
              : delta.direction === "down"
                ? "▼"
                : "—";
          doc.text(
            `${arrow} ${delta.text} vs last period`,
            cardX + cardW / 2,
            y + 23,
            { align: "center" },
          );
        }
        cardX += cardW + cardGap;
      });
      y += 34;

      doc.setFontSize(9.5);
      doc.setTextColor(60, 66, 82);
      doc.setFont("helvetica", "normal");
      const summary =
        `This report presents a consolidated view of platform activity` +
        `${timeRange === "all" ? "" : ` for the period "${periodLabel}"`}. ` +
        `As of the date of generation, the institution supports ${totalStudents} active learner(s) across ${totalPackages} learning package(s), ` +
        `delivered through ${activeBatches} active batch(es) and facilitated by ${totalInstructors} instructor(s). ` +
        `A cumulative total of ${totalEnrollments} package enrollment(s) have been recorded. ` +
        `The sections that follow detail enrollment distribution by package and course, growth trends over time, ` +
        `batch lifecycle status, user-role composition, and a register of recent enrollments.`;
      const summaryLines = doc.splitTextToSize(summary, pageWidth - 40);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 5 + 8;

      // ── Key Insights (auto-generated highlights) ──
      const insights: string[] = [];
      if (pkgLabels.length) {
        const maxIdx = pkgVals.indexOf(Math.max(...pkgVals));
        const share = totalEnrollments
          ? Math.round((pkgVals[maxIdx] / totalEnrollments) * 100)
          : 0;
        insights.push(
          `"${pkgLabels[maxIdx]}" is the most subscribed package, accounting for ${pkgVals[maxIdx]} learner(s) (${share}% of total enrollments).`,
        );
      }
      if (courseLabels.length) {
        const maxIdx = courseVals.indexOf(Math.max(...courseVals));
        insights.push(
          `"${courseLabels[maxIdx]}" leads course enrollment with ${courseVals[maxIdx]} student(s).`,
        );
      }
      if (growthVals.length >= 2) {
        const trendDelta = pctChange(
          growthVals[growthVals.length - 1],
          growthVals[0],
        );
        const trendWord =
          trendDelta.direction === "up"
            ? "grew"
            : trendDelta.direction === "down"
              ? "declined"
              : "held steady";
        insights.push(
          `Enrollment ${trendWord} ${trendDelta.text !== "0%" ? `by ${trendDelta.text.replace("+", "").replace("-", "")} ` : ""}from ${growthLabels[0]} to ${growthLabels[growthLabels.length - 1]}.`,
        );
      }
      if (batchVals.length) {
        const totalBatches = batchVals.reduce((a, b) => a + b, 0);
        const activeShare = totalBatches
          ? Math.round((activeBatches / totalBatches) * 100)
          : 0;
        insights.push(
          `${activeShare}% of all batches (${activeBatches} of ${totalBatches}) are currently active.`,
        );
      }

      if (insights.length) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 24, 40);
        doc.text("Key Insights", 20, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 66, 82);
        insights.forEach((line) => {
          const wrapped = doc.splitTextToSize(`•  ${line}`, pageWidth - 44);
          doc.text(wrapped, 24, y);
          y += wrapped.length * 5 + 2;
        });
        y += 6;
      }

      // ══════════════════════════════════════════════
      // SECTION 2 — Students per Package
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
      recordSection("2. Students per Package");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 24, 40);
      doc.text("2. Students per Package", 20, y);
      y += 6;
      if (imgPkg) {
        const hPkg = (170 * 340) / 700;
        if (y + hPkg > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgPkg, "PNG", 20, y, 170, hPkg);
        y += hPkg + 6;
      }
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(90, 96, 115);
      doc.text(
        "Learner distribution across each package. Taller bars indicate the most subscribed programs.",
        20,
        y,
      );
      y += 6;

      if (data.studentsPerPackage?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Package", "Students"]],
          body: data.studentsPerPackage.map((d) => [
            d.packageName,
            String(d.count),
          ]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("No data available", 20, y + 6);
        y += 14;
      }

      // ══════════════════════════════════════════════
      // SECTION 3 — Students per Course
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
      recordSection("3. Students per Course");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 24, 40);
      doc.text("3. Students per Course", 20, y);
      y += 6;
      if (imgCourse) {
        const hC = (170 * 340) / 700;
        if (y + hC > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgCourse, "PNG", 20, y, 170, hC);
        y += hC + 6;
      }

      if (data.studentsPerCourse?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Course", "Students"]],
          body: data.studentsPerCourse.map((d) => [
            d.courseTitle,
            String(d.count),
          ]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("No data available", 20, y + 6);
        y += 14;
      }

      // ══════════════════════════════════════════════
      // SECTION 4 — Enrollment Growth
      // ══════════════════════════════════════════════
      if (imgGrowth) {
        if (y > SECTION_TABLE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        recordSection("4. Enrollment Growth Over Time");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 24, 40);
        doc.text("4. Enrollment Growth Over Time", 20, y);
        y += 6;
        const hG = (170 * 300) / 700;
        if (y + hG > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgGrowth, "PNG", 20, y, 170, hG);
        y += hG + 10;
      }

      // ══════════════════════════════════════════════
      // SECTION 5 — Batch Distribution
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
      recordSection("5. Batch Distribution");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 24, 40);
      doc.text("5. Batch Distribution", 20, y);
      y += 6;
      if (imgBatch) {
        const hD = (170 * 300) / 700;
        if (y + hD > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgBatch, "PNG", 20, y, 170, hD);
        y += hD + 6;
      }

      if (data.batchDistribution?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Status", "Count"]],
          body: data.batchDistribution.map((d) => [d.status, String(d.count)]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("No data available", 20, y + 6);
        y += 14;
      }

      // ══════════════════════════════════════════════
      // SECTION 6 — User Role Distribution
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
      recordSection("6. User Role Distribution");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 24, 40);
      doc.text("6. User Role Distribution", 20, y);
      y += 6;
      if (imgRoles) {
        const hR = (170 * 300) / 700;
        if (y + hR > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgRoles, "PNG", 20, y, 170, hR);
        y += hR + 6;
      }

      if (data.userRoleDistribution?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Role", "Count"]],
          body: data.userRoleDistribution.map((d) => [d.role, String(d.count)]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("No data available", 20, y + 6);
        y += 14;
      }

      // ══════════════════════════════════════════════
      // SECTION 7 — Monthly Revenue Trend
      // ══════════════════════════════════════════════
      if (imgRevenue) {
        if (y > SECTION_TABLE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        recordSection("7. Monthly Revenue Trend");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 24, 40);
        doc.text("7. Monthly Revenue Trend", 20, y);
        y += 6;
        const hRev = (170 * 300) / 700;
        if (y + hRev > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgRevenue, "PNG", 20, y, 170, hRev);
        y += hRev + 10;
      }

      // ══════════════════════════════════════════════
      // SECTION 8 — Revenue by Package
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
      if (imgRevPkg) {
        recordSection("8. Revenue by Package");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 24, 40);
        doc.text("8. Revenue by Package", 20, y);
        y += 6;
        const hRevPkg = (170 * 340) / 700;
        if (y + hRevPkg > PAGE_BREAK_Y) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(imgRevPkg, "PNG", 20, y, 170, hRevPkg);
        y += hRevPkg + 6;
      }

      if (data.revenueByPackage?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Package", "Revenue (INR)"]],
          body: data.revenueByPackage.map((d) => [
            d.packageName,
            `₹${(d.total / 100).toLocaleString("en-IN")}`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      }

      // ══════════════════════════════════════════════
      // SECTION 9 — Recent Enrollments
      // ══════════════════════════════════════════════
      if (y > SECTION_TABLE_BREAK_Y) {
        doc.addPage();
        y = 20;
      }
        recordSection("9. Recent Enrollments");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 24, 40);
        doc.text("9. Recent Enrollments", 20, y);
      y += 6;
      if (data.recentEnrollments?.length) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(90, 96, 115);
        doc.text(
          "Most recent package enrollments, ordered by date of registration.",
          20,
          y,
        );
        y += 5;
      }

      if (data.recentEnrollments?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Student", "Email", "Package", "Status", "Date"]],
          body: data.recentEnrollments.map((e) => [
            e.userName,
            e.userEmail,
            e.packageName,
            e.status,
            new Date(e.appliedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          ]),
          theme: "grid",
          headStyles: { fillColor: [109, 125, 255] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
          },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable!.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("No data available", 20, y + 6);
        y += 14;
      }

      const totalPages = doc.getNumberOfPages();

      // ══════════════════════════════════════════════
      // PAGE 1 — Cover page
      // ══════════════════════════════════════════════
      doc.setPage(1);
      doc.setFillColor(109, 125, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      // Decorative accent shape
      doc.setFillColor(255, 255, 255);
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.circle(pageWidth - 20, 40, 70, "F");
      doc.circle(10, pageHeight - 30, 50, "F");
      doc.setGState(new doc.GState({ opacity: 1 }));

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("LMS PORTAL", 20, 40);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("LEARNING MANAGEMENT SYSTEM", 20, 46);

      doc.setFontSize(30);
      doc.setFont("helvetica", "bold");
      doc.text("Analytics Report", 20, pageHeight / 2 - 10);
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.text(`Reporting Period: ${periodLabel}`, 20, pageHeight / 2 + 5);

      doc.setFontSize(9.5);
      doc.text(`Generated on ${generatedDate}`, 20, pageHeight - 40);
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(
        "This is an automatically generated report. All figures reflect platform data as of the generation date.",
        20,
        pageHeight - 32,
        { maxWidth: pageWidth - 40 },
      );
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CONFIDENTIAL", 20, pageHeight - 20);

      // ══════════════════════════════════════════════
      // PAGE 2 — Table of contents
      // ══════════════════════════════════════════════
      doc.setPage(2);
      doc.setTextColor(20, 24, 40);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Table of Contents", 20, 30);
      doc.setDrawColor(225, 230, 240);
      doc.line(20, 35, pageWidth - 20, 35);

      let tocY = 48;
      toc.forEach((entry) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 56, 72);
        doc.text(entry.title, 24, tocY);
        const pageLabel = String(entry.page);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(109, 125, 255);
        doc.text(pageLabel, pageWidth - 24, tocY, { align: "right" });
        // dotted leader
        const titleWidth = doc.getTextWidth(entry.title);
        const pageLabelWidth = doc.getTextWidth(pageLabel);
        const dotsStart = 24 + titleWidth + 3;
        const dotsEnd = pageWidth - 24 - pageLabelWidth - 3;
        doc.setTextColor(200, 205, 220);
        doc.setFont("helvetica", "normal");
        if (dotsEnd > dotsStart) {
          doc.setLineDashPattern([0.5, 1.5], 0);
          doc.setDrawColor(200, 205, 220);
          doc.line(dotsStart, tocY - 1, dotsEnd, tocY - 1);
          doc.setLineDashPattern([], 0);
        }
        tocY += 11;
      });

      // ── Footer + running header on every content page (skip cover) ──
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `LMS Portal — Confidential Report | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - FOOTER_Y_OFFSET,
          { align: "center" },
        );
      }

      doc.save(
        `LMS-Report-${timeRange}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Analytics
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed analytics and insights across the platform.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading || !data}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {downloading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <IconDownload size={16} />
          )}
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {/* Time Range Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <IconCalendar size={16} className="text-muted-foreground" />
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.value}
            onClick={() => setTimeRange(tr.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              timeRange === tr.value
                ? "bg-primary/10 text-primary border-primary/20"
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            {tr.label}
          </button>
        ))}
        <button
          onClick={() => fetchData(timeRange)}
          className="ml-2 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover transition-colors"
          title="Refresh"
        >
          <IconRefresh size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          Loading...
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Package */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Students per Package
          </h3>
          {data?.studentsPerPackage?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.primary],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: data.studentsPerPackage.map((d) => d.packageName),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                    rotate: -20,
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={[
                {
                  name: "Students",
                  data: data.studentsPerPackage.map((d) => d.count),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Enrollment Growth */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Enrollment Growth Over Time
          </h3>
          {data?.enrollmentTrend?.length ? (
            <Chart
              options={{
                chart: {
                  type: "area",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.primary],
                fill: {
                  type: "gradient",
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0,
                  },
                },
                xaxis: {
                  categories: data.enrollmentTrend.map((d) => d.month),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
                stroke: { width: 2 },
              }}
              series={[
                {
                  name: "Enrolled",
                  data: data.enrollmentTrend.map((d) => d.count),
                },
              ]}
              type="area"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Batch Distribution */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Batch Distribution
          </h3>
          {data?.batchDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: data.batchDistribution.map((b) => b.status),
                plotOptions: {
                  pie: {
                    donut: { size: "65%" },
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  labels: { colors: "var(--muted-foreground)" },
                },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={data.batchDistribution.map((b) => b.count)}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            User Roles
          </h3>
          {data?.userRoleDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: data.userRoleDistribution.map((u) => u.role),
                plotOptions: {
                  pie: {
                    donut: { size: "65%" },
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  labels: { colors: "var(--muted-foreground)" },
                },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={data.userRoleDistribution.map((u) => u.count)}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Students per Course */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Students per Course
          </h3>
          {data?.studentsPerCourse?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.accent],
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    horizontal: true,
                  },
                },
                xaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={[
                {
                  name: "Students",
                  data: data.studentsPerCourse.map((d) => ({
                    x: d.courseTitle,
                    y: d.count,
                  })),
                },
              ]}
              type="bar"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — Payment Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Monthly Revenue Trend */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Monthly Revenue Trend
          </h3>
          {data?.monthlyRevenue?.length ? (
            <Chart
              options={{
                chart: {
                  type: "area",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.success],
                fill: {
                  type: "gradient",
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0,
                  },
                },
                xaxis: {
                  categories: data.monthlyRevenue.map((d) => d.month),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                    formatter: (val: number) =>
                      `₹${(val / 100).toLocaleString("en-IN")}`,
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: {
                  theme: "light",
                  y: {
                    formatter: (val: number) =>
                      `₹${(val / 100).toLocaleString("en-IN")}`,
                  },
                },
                dataLabels: { enabled: false },
                stroke: { width: 2 },
              }}
              series={[
                {
                  name: "Revenue",
                  data: data.monthlyRevenue.map((d) => d.amount),
                },
              ]}
              type="area"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No payment data
            </div>
          )}
        </div>

        {/* Revenue by Package */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Revenue by Package
          </h3>
          {data?.revenueByPackage?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.warning],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: data.revenueByPackage.map(
                    (d) => d.packageName,
                  ),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                    rotate: -20,
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                    formatter: (val: number) =>
                      `₹${(val / 100).toLocaleString("en-IN")}`,
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: {
                  theme: "light",
                  y: {
                    formatter: (val: number) =>
                      `₹${(val / 100).toLocaleString("en-IN")}`,
                  },
                },
                dataLabels: { enabled: false },
              }}
              series={[
                {
                  name: "Revenue",
                  data: data.revenueByPackage.map((d) => d.total),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No payment data
            </div>
          )}
        </div>
      </div>

      {/* Recent Enrollments Table */}
      {data?.recentEnrollments && data.recentEnrollments.length > 0 && (
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Recent Enrollments
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-medium uppercase text-muted">
                    Student
                  </th>
                  <th className="pb-2 text-xs font-medium uppercase text-muted">
                    Package
                  </th>
                  <th className="pb-2 text-xs font-medium uppercase text-muted">
                    Status
                  </th>
                  <th className="pb-2 text-xs font-medium uppercase text-muted">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentEnrollments.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5">
                      <p className="font-medium text-foreground">
                        {e.userName}
                      </p>
                      <p className="text-xs text-muted">{e.userEmail}</p>
                    </td>
                    <td className="py-2.5 text-foreground">{e.packageName}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          e.status === "APPROVED"
                            ? "bg-success/15 text-success"
                            : e.status === "PENDING"
                              ? "bg-warning/15 text-warning"
                              : "bg-danger/15 text-danger"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(e.appliedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
