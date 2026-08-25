"use client";

import type { DashboardChartData } from "@/lib/api-types";
import type { Worksheet } from "exceljs";
import { formatINR } from "@/lib/report-utils";
import type { ReportScope } from "@/lib/report-pdf";

const BRAND = {
  name: "Marvel Slice",
  tagline: "Learning Management System",
  primary: "FF6D5B",
  dark: "1F2937",
  light: "F3F4F6",
  muted: "6B7280",
  border: "D1D5DB",
};

interface ExportOptions {
  data: DashboardChartData;
  scope: ReportScope;
  timeRange: string;
  periodLabel: string;
  generatedDate: string;
}

interface SheetSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export function buildSections(
  data: DashboardChartData,
  scope: ReportScope,
): SheetSection[] {
  const isCourse = scope === "course";
  const isPayment = scope === "payment";
  const sections: SheetSection[] = [];

  if (!isPayment) {
    sections.push({
      title: "Students per Course",
      headers: ["Course", "Students"],
      rows: (data.studentsPerCourse ?? []).map((d) => [d.courseTitle, d.count]),
    });
    sections.push({
      title: "Course Completion Rates",
      headers: ["Course", "Enrolled", "Completed", "Completion %"],
      rows: (data.courseCompletion ?? []).map((d) => [
        d.courseTitle,
        d.enrolled,
        d.completed,
        d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0,
      ]),
    });
    sections.push({
      title: "Students per Package",
      headers: ["Package", "Students"],
      rows: (data.studentsPerPackage ?? []).map((d) => [
        d.packageName,
        d.count,
      ]),
    });
    sections.push({
      title: "Top Courses",
      headers: ["Course", "Enrollments"],
      rows: (data.topCourses ?? []).map((d) => [
        d.courseTitle,
        d.enrollmentCount,
      ]),
    });
    sections.push({
      title: "Enrollment Trend",
      headers: ["Month", "Total Enrollments"],
      rows: (data.enrollmentTrend ?? []).map((d) => [d.month, d.count]),
    });
  }

  if (!isCourse) {
    sections.push({
      title: "Monthly Revenue",
      headers: ["Month", "Revenue (INR)"],
      rows: (data.monthlyRevenue ?? []).map((d) => [
        d.month,
        formatINR(d.amount),
      ]),
    });
    sections.push({
      title: "Revenue by Package",
      headers: ["Package", "Revenue (INR)"],
      rows: (data.revenueByPackage ?? []).map((d) => [
        d.packageName,
        formatINR(d.total),
      ]),
    });
    sections.push({
      title: "Payment Status Breakdown",
      headers: ["Status", "Count", "Amount (INR)"],
      rows: (data.paymentStatusDistribution ?? []).map((d) => [
        d.status,
        d.count,
        formatINR(d.amount),
      ]),
    });
    sections.push({
      title: "Recent Transactions",
      headers: ["Student", "Email", "Package", "Status", "Date"],
      rows: (data.recentEnrollments ?? []).map((e) => [
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
    });
  }

  return sections;
}

export function buildKpis(data: DashboardChartData): [string, string][] {
  const revenue = (data.monthlyRevenue ?? []).reduce((a, b) => a + b.amount, 0);
  const students =
    (data.userRoleDistribution ?? []).find((u) => u.role === "STUDENT")
      ?.count ?? 0;
  const enrollments = (data.studentsPerCourse ?? []).reduce(
    (a, b) => a + b.count,
    0,
  );
  return [
    ["Total Learners", String(students)],
    ["Total Courses", String((data.studentsPerCourse ?? []).length)],
    ["Total Revenue", formatINR(revenue)],
    ["Total Enrollments", String(enrollments)],
    ["ARPU", formatINR(data.arpu ?? 0)],
    ["Refund Rate", `${data.refundRate ?? 0}%`],
  ];
}

// ── CSV ──

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportReportCsv(opts: ExportOptions): void {
  const { data, scope, periodLabel, generatedDate } = opts;
  const lines: string[] = [];

  const titleMap: Record<ReportScope, string> = {
    overview: "Platform Report",
    course: "Course Report",
    payment: "Payment Report",
  };

  lines.push(escapeCsvCell(`${BRAND.name} — ${titleMap[scope]}`));
  lines.push(escapeCsvCell(`Reporting Period: ${periodLabel}`));
  lines.push(escapeCsvCell(`Generated on: ${generatedDate}`));
  lines.push("");

  const kpis = buildKpis(data);
  if (kpis.length) {
    lines.push("Key Metrics");
    lines.push("Metric,Value");
    kpis.forEach(([k, v]) =>
      lines.push(`${escapeCsvCell(k)},${escapeCsvCell(v)}`),
    );
    lines.push("");
  }

  buildSections(data, scope).forEach((section) => {
    lines.push(section.title);
    lines.push(section.headers.map(escapeCsvCell).join(","));
    section.rows.forEach((row) => lines.push(row.map(escapeCsvCell).join(",")));
    lines.push("");
  });

  // UTF-8 BOM so Excel opens non-ASCII (₹, en-dash) correctly.
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  triggerDownload(
    blob,
    `LMS-${scope}-Report-${opts.timeRange}-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

// ── XLSX ──

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/images/Marvel_logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const targetH = 64;
    const scale = targetH / bitmap.height;
    const targetW = Math.round(bitmap.width * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    return canvas.toDataURL("image/png").split(",")[1] ?? null;
  } catch {
    return null;
  }
}

function hexToArgb(hex: string): { argb: string } {
  return { argb: `FF${hex.replace(/^#/, "").toUpperCase()}` };
}

export async function exportReportXlsx(opts: ExportOptions): Promise<void> {
  const { data, scope, periodLabel, generatedDate } = opts;
  const workbook = new (await import("exceljs")).Workbook();

  const titleMap: Record<ReportScope, string> = {
    overview: "Platform Report",
    course: "Course Report",
    payment: "Payment Report",
  };

  // ── Sheet 1: branded Summary with header box ──
  const summary = workbook.addWorksheet("Summary", {
    views: [{ state: "frozen", ySplit: 7 }],
  });

  const logo = await loadLogoBase64();
  summary.mergeCells("A1:G4");
  const box = summary.getCell("A1");
  box.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: hexToArgb(BRAND.primary),
  };

  if (logo) {
    const imgId = workbook.addImage({ base64: logo, extension: "png" });
    summary.addImage(imgId, {
      tl: { col: 0, row: 0 },
      ext: { width: 72, height: 72 },
    });
  }

  const nameCell = summary.getCell("C2");
  nameCell.value = BRAND.name;
  nameCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  const taglineCell = summary.getCell("C3");
  taglineCell.value = `${BRAND.tagline} — ${titleMap[scope]}`;
  taglineCell.font = { size: 11, color: { argb: "FFF3F4F6" } };
  const metaCell = summary.getCell("C4");
  metaCell.value = `Reporting Period: ${periodLabel}   |   Generated on: ${generatedDate}`;
  metaCell.font = { size: 9, italic: true, color: { argb: "FFE5E7EB" } };

  for (let c = 2; c <= 7; c++) {
    summary.getCell(2, c).alignment = { vertical: "middle" };
    summary.getCell(3, c).alignment = { vertical: "middle" };
    summary.getCell(4, c).alignment = { vertical: "middle" };
  }
  summary.getRow(1).height = 72;

  writeTable(
    summary,
    {
      title: "Key Metrics",
      headers: ["Metric", "Value"],
      rows: buildKpis(data).map(([k, v]) => [k, v]),
    },
    7,
  );
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 34;

  // ── One sheet per section ──
  for (const section of buildSections(data, scope)) {
    const sheet = workbook.addWorksheet(section.title.slice(0, 31), {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    writeTable(sheet, section, 1);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(
    blob,
    `LMS-${scope}-Report-${opts.timeRange}-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

function writeTable(
  sheet: Worksheet,
  section: SheetSection,
  startRow: number,
): void {
  const headerRow = sheet.getRow(startRow);
  headerRow.values = section.headers;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: hexToArgb(BRAND.primary),
  };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 20;

  section.rows.forEach((row) => {
    sheet.addRow(row).eachCell((cell) => {
      cell.alignment = { vertical: "middle" };
    });
  });

  // Striped data rows for readability.
  for (let i = startRow + 1; i <= startRow + section.rows.length; i++) {
    if ((i - startRow) % 2 === 0) {
      const r = sheet.getRow(i);
      r.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: hexToArgb(BRAND.light),
        };
      });
    }
  }

  section.headers.forEach((h, i) => {
    const col = sheet.getColumn(i + 1);
    col.width = Math.max(16, h.length + 8);
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
