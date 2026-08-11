"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconDownload,
  IconFileTypeCsv,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconChevronDown,
} from "@tabler/icons-react";
import type { DashboardChartData } from "@/lib/api-types";
import { buildReportPdf } from "@/lib/report-pdf";
import { exportReportCsv, exportReportXlsx } from "@/lib/report-export";
import type { ReportScope } from "@/lib/report-pdf";

interface ReportExportDropdownProps {
  data: DashboardChartData | null;
  scope: ReportScope;
  timeRange: string;
  periodLabel: string;
  generatedDate: string;
  pdfLabel: string;
}

type ExportKind = "pdf" | "csv" | "xlsx";

export default function ReportExportDropdown({
  data,
  scope,
  timeRange,
  periodLabel,
  generatedDate,
  pdfLabel,
}: ReportExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const runExport = async (kind: ExportKind) => {
    if (!data) return;
    setExporting(kind);
    setOpen(false);
    try {
      if (kind === "pdf") {
        await buildReportPdf({ data, scope, timeRange, periodLabel, generatedDate });
      } else if (kind === "csv") {
        exportReportCsv({ data, scope, timeRange, periodLabel, generatedDate });
      } else {
        await exportReportXlsx({ data, scope, timeRange, periodLabel, generatedDate });
      }
    } catch (err) {
      console.error("Report export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  const items: { kind: ExportKind; label: string; icon: React.ReactNode }[] = [
    { kind: "pdf", label: pdfLabel, icon: <IconFileTypePdf size={16} /> },
    { kind: "csv", label: "Download CSV", icon: <IconFileTypeCsv size={16} /> },
    { kind: "xlsx", label: "Download Excel", icon: <IconFileSpreadsheet size={16} /> },
  ];

  const activeItem = exporting ? items.find((i) => i.kind === exporting) : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!data || exporting !== null}
        className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {exporting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <IconDownload size={16} />
        )}
        {exporting ? `Exporting ${activeItem?.label ?? ""}...` : "Export"}
        <IconChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1.5">
          {items.map((item) => (
            <button
              key={item.kind}
              onClick={() => runExport(item.kind)}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground hover:bg-accent/60 cursor-pointer"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
