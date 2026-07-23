"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconUpload,
  IconTableImport,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

type ImportRow = { name: string; email: string; role: string };
type ImportResult = { imported: number; skipped: number; errors: string[] };

export default function ImportUsersPage() {
  usePageTitle("Import Users");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const rows: ImportRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Missing required fields (name, email)`);
        continue;
      }
      const name = parts[0] ?? "";
      const email = parts[1] ?? "";
      const role = (parts[2] ?? "STUDENT").toUpperCase();

      if (!name || !email) {
        errors.push(`Line ${i + 1}: Name and email are required`);
        continue;
      }
      if (!["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        errors.push(`Line ${i + 1}: Invalid role "${parts[2]}"`);
        continue;
      }
      rows.push({ name, email, role });
    }

    if (errors.length > 0 && rows.length === 0) {
      setParseError(errors.join("\n"));
    } else {
      setParseError(errors.length > 0 ? errors.join("\n") : "");
    }
    setParsedRows(rows);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) ?? "";
        setCsvText(text);
        parseCSV(text);
        setResult(null);
      };
      reader.readAsText(file);
    },
    [parseCSV],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);

    try {
      const lines = [
        "name,email,role",
        ...parsedRows.map((r) => `${r.name},${r.email},${r.role}`),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const file = new File([blob], "users.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post<ImportResult>(
        "/api/admin/users/import",
        formData,
      );
      setResult(res);
      toast.success(`Imported ${res.imported} user(s)`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const roleStyles: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
    INSTRUCTOR: "bg-sky-100 text-sky-700",
    STUDENT: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Import Users"
        description="Bulk import users from a CSV file"
        breadcrumbs={[
          { label: "Users", href: "/admin/users" },
          { label: "Import", href: "/admin/users/import" },
        ]}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-card-hover/50"
        }`}
      >
        <IconUpload size={32} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop your CSV file here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            CSV format: name, email, role (one user per line)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-700">Parse warnings:</p>
          <pre className="mt-1 whitespace-pre-wrap text-xs text-amber-600">
            {parseError}
          </pre>
        </div>
      )}

      {/* Preview table */}
      {parsedRows.length > 0 && (
        <div className="glass-card border border-border/80">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <IconTableImport size={18} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Preview — {parsedRows.length} user(s)
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {importing ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <IconUpload size={14} />
                  Import All
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {parsedRows.map((row, i) => (
                  <tr
                    key={`${row.email}-${i}`}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {row.email}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium ${roleStyles[row.role] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {row.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import results */}
      {result && (
        <div className="glass-card border border-border/80 p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Import Results
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <IconCheck size={16} className="text-emerald-600" />
              <span className="text-sm text-foreground">
                <strong>{result.imported}</strong> imported
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconX size={16} className="text-amber-600" />
              <span className="text-sm text-foreground">
                <strong>{result.skipped}</strong> skipped (duplicates)
              </span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-danger">Errors:</p>
              <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push("/admin/users")}
            className="btn-secondary text-sm mt-2"
          >
            Back to Users
          </button>
        </div>
      )}
    </div>
  );
}
