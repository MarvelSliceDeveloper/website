"use client";

import type { DashboardChartData } from "@/lib/api-types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildSections, buildKpis } from "@/lib/report-export";

export type ReportScope = "overview" | "course" | "payment";

interface PdfOptions {
  data: DashboardChartData;
  scope: ReportScope;
  timeRange: string;
  periodLabel: string;
  generatedDate: string;
}

const COLORS = {
  primary: [109, 125, 255] as const,
  dark: [31, 41, 55] as const,
  muted: [107, 114, 128] as const,
};

/**
 * Builds a plain tabular PDF (Excel-style) for the given report scope.
 * No charts, graphics, or cover pages — just data tables. "course" and
 * "payment" include only their relevant tables; "overview" includes all.
 */
export function buildReportPdf(opts: PdfOptions): Promise<void> {
  const { data, scope, periodLabel, generatedDate } = opts;

  const titleMap: Record<ReportScope, string> = {
    overview: "Platform Report",
    course: "Course Report",
    payment: "Payment Report",
  };

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const sections = [
    {
      title: "Key Metrics",
      headers: ["Metric", "Value"],
      rows: buildKpis(data).map(([k, v]) => [k, v]),
    },
    ...buildSections(data, scope),
  ];

  let y = 0;

  // ── Header (title + meta, no graphics) ──
  doc.setFillColor(109, 125, 255);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(titleMap[scope], margin, 11);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Marvel Slice LMS   |   Period: ${periodLabel}   |   Generated on: ${generatedDate}`,
    margin,
    18,
  );

  y = 34;

  const drawTable = (
    title: string,
    headers: string[],
    rows: (string | number)[][],
  ) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 24;
    }
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.text(title, margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [109, 125, 255], textColor: 255, fontSize: 8.5 },
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable!.finalY + 10;
  };

  sections.forEach((section) => {
    if (section.rows.length === 0) return;
    drawTable(section.title, section.headers, section.rows);
  });

  // ── Footer with page numbers on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" },
    );
  }

  const filename = `LMS-${scope}-Report-${opts.timeRange}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return Promise.resolve();
}
