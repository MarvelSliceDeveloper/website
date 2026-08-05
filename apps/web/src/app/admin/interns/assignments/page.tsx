"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconLink,
} from "@tabler/icons-react";
import { SearchInput } from "@/components/ui/SearchInput";

/** Extract spreadsheet ID from a full Google Sheets URL or return as-is. */
function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}

type SheetData = {
  headers: string[];
  rows: string[][];
  lastUpdated: string;
};

type SavedSheet = {
  id: string;
  name: string;
  addedAt: string;
  gid?: string;
};

type SheetTab = {
  gid: string;
  title: string;
};

type SheetMetadata = {
  spreadsheetTitle: string;
  tabs: SheetTab[];
};

export default function InternAssignmentsPage() {
  usePageTitle("Assignment Tracker");

  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newSheetId, setNewSheetId] = useState("");
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetGid, setNewSheetGid] = useState("0");
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata | null>(null);
  const [loadingTabs, setLoadingTabs] = useState(false);

  const fetchSavedSheets = () => {
    setLoadingSheets(true);
    api
      .get<{ sheets: SavedSheet[] }>("/api/admin/interns/assignments/sheets")
      .then((res) => {
        const sheets = res.sheets ?? [];
        setSavedSheets(sheets);
        if (sheets.length > 0 && !selectedSheetId) {
          const s = sheets[0];
          if (s) {
            const key = `${s.id}|${s.gid ?? "0"}`;
            setSelectedSheetId(key);
          }
        }
      })
      .catch(() => setSavedSheets([]))
      .finally(() => setLoadingSheets(false));
  };

  const fetchSheet = useCallback((compositeKey: string) => {
    const [sheetId, gid] = compositeKey.split("|");
    if (!sheetId) return;
    setLoading(true);
    setData(null);
    api
      .get<SheetData>(
        `/api/admin/interns/assignments?sheetId=${encodeURIComponent(sheetId)}&gid=${encodeURIComponent(gid ?? "0")}`,
      )
      .then((res) => setData(res))
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddSheet = async () => {
    const sheetId = extractSheetId(newSheetId);
    if (!sheetId) {
      toast.error("Sheet ID is required");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<{ sheets: SavedSheet[] }>(
        "/api/admin/interns/assignments/sheets",
        {
          id: sheetId,
          name: newSheetName.trim() || undefined,
          gid: newSheetGid || undefined,
        },
      );
      setSavedSheets(res.sheets ?? []);
      const key = `${sheetId}|${newSheetGid || "0"}`;
      setSelectedSheetId(key);
      setShowAddSheet(false);
      setNewSheetId("");
      setNewSheetName("");
      setNewSheetGid("0");
      toast.success("Sheet saved");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSheet = async (compositeKey: string) => {
    const [sheetId, gid] = compositeKey.split("|");
    const actualGid = gid ?? "0";
    if (!confirm("Remove this sheet from the saved list?")) return;
    try {
      const res = await api.delete<{ sheets: SavedSheet[] }>(
        `/api/admin/interns/assignments/sheets/${sheetId}?gid=${encodeURIComponent(actualGid)}`,
      );
      setSavedSheets(res.sheets ?? []);
      if (selectedSheetId === compositeKey) setSelectedSheetId(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchSavedSheets();
  }, []);

  useEffect(() => {
    if (selectedSheetId) {
      const [sheetId] = selectedSheetId.split("|");
      fetchSheet(selectedSheetId);
      // Fetch real spreadsheet + tab names
      setLoadingTabs(true);
      api
        .get<SheetMetadata>(
          `/api/admin/interns/assignments/tabs?sheetId=${encodeURIComponent(sheetId)}`,
        )
        .then((res) => setSheetMetadata(res))
        .catch(() => setSheetMetadata(null))
        .finally(() => setLoadingTabs(false));
    } else {
      setData(null);
      setLoading(false);
      setSheetMetadata(null);
    }
  }, [selectedSheetId, fetchSheet]);

  const filteredRows =
    data && data.rows
      ? data.rows.filter((row) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return row.some((cell) => cell && cell.toLowerCase().includes(q));
        })
      : [];

  const selectedSheet = selectedSheetId
    ? savedSheets.find((s) => {
        const [sid, gid] = selectedSheetId.split("|");
        return s.id === sid && (s.gid ?? "0") === (gid ?? "0");
      })
    : undefined;

  const handleTabSwitch = (compositeKey: string) => {
    setSelectedSheetId(compositeKey);
    fetchSheet(compositeKey);
  };

  const currentGid = selectedSheetId ? selectedSheetId.split("|")[1] ?? "0" : "0";
  const currentTabTitle = sheetMetadata?.tabs.find((t) => t.gid === currentGid)?.title;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Assignment Tracker"
        description="Intern assignment completion status synced from Google Sheets."
        breadcrumbs={[
          { label: "Interns", href: "/admin/interns" },
          { label: "Assignment Tracker", href: "/admin/interns/assignments" },
        ]}
        action={
          !data ? null : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => selectedSheetId && fetchSheet(selectedSheetId)}
                disabled={loading}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <span className="text-xs text-muted-foreground">
                Last updated:{" "}
                {new Date(data.lastUpdated).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          )
        }
      />

      {/* Spreadsheet + tab name banner */}
      {selectedSheetId && (sheetMetadata?.spreadsheetTitle || currentTabTitle) && (
        <div className="text-sm text-muted-foreground">
          {sheetMetadata?.spreadsheetTitle && (
            <span className="font-medium text-foreground">
              {sheetMetadata.spreadsheetTitle}
            </span>
          )}
          {currentTabTitle && (
            <>
              {sheetMetadata?.spreadsheetTitle && <span className="mx-1.5">·</span>}
              <span>{currentTabTitle}</span>
            </>
          )}
        </div>
      )}

      {/* Sheet selector + add/remove */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Active Sheet:</label>
          {loadingSheets ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : savedSheets.length === 0 ? (
            <span className="text-sm text-muted-foreground">No sheets saved yet</span>
          ) : (
            <>
              <select
                value={selectedSheetId ?? ""}
                onChange={(e) => setSelectedSheetId(e.target.value || null)}
                className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                {savedSheets.map((s) => {
                  const key = `${s.id}|${s.gid ?? "0"}`;
                  const label = s.gid && s.gid !== "0" ? `${s.name} (tab ${s.gid})` : s.name;
                  return (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <IconChevronDown size={14} className="text-muted-foreground pointer-events-none" />
            </>
          )}
        </div>

        <button
          onClick={() => setShowAddSheet(!showAddSheet)}
          className="btn-secondary text-xs flex items-center gap-1"
        >
          <IconPlus size={13} /> Add Sheet
        </button>

        {selectedSheet && (
          <button
            onClick={() => handleDeleteSheet(selectedSheetId!)}
            className="btn-secondary text-xs flex items-center gap-1 text-danger"
          >
            <IconTrash size={13} /> Remove
          </button>
        )}
      </div>

      {/* Add sheet form */}
      {showAddSheet && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Add Assignment Tracker Sheet
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Google Sheet ID or URL *
              </label>
              <div className="relative">
                <IconLink
                  size={14}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={newSheetId}
                  onChange={(e) => setNewSheetId(e.target.value)}
                  placeholder="Paste Google Sheets URL or ID here"
                  className="field w-full text-sm pl-9"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Paste the full URL (e.g.{" "}
                <code className="font-mono">docs.google.com/spreadsheets/d/.../edit</code>) or
                just the ID. The sheet must be publicly readable (Share → "Anyone with the link
                can view").
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="e.g. Python Batch June 2025"
                className="field w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Sheet Tab (gid)
              </label>
              <input
                type="text"
                value={newSheetGid}
                onChange={(e) => setNewSheetGid(e.target.value)}
                placeholder="0"
                className="field w-full text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                "0" is the first tab. Not sure of the gid? Save with "0" first, then use the Tab
                dropdown below (once real tab names load) to switch to the right one.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAddSheet}
              disabled={saving || !extractSheetId(newSheetId)}
              className="btn-primary text-xs px-3 py-2"
            >
              {saving ? "Saving..." : "Save Sheet"}
            </button>
            <button
              onClick={() => {
                setShowAddSheet(false);
                setNewSheetId("");
                setNewSheetName("");
                setNewSheetGid("0");
              }}
              className="btn-secondary text-xs px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No sheet selected */}
      {!selectedSheetId && !loading && (
        <div className="border border-border bg-card p-8 text-center">
          <IconAlertCircle size={48} className="mx-auto mb-4 text-warning/50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Sheet Selected</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add a Google Sheet ID above to start tracking intern assignment completion. The sheet
            must be publicly readable.
          </p>
        </div>
      )}

      {loading && selectedSheetId && (
        <div className="border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <IconRefresh size={18} className="text-muted-foreground animate-spin" />
            <span className="text-sm font-medium text-foreground">
              Loading assignment data...
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <th key={i} className="border-b border-border px-3 py-2 text-left">
                      <div className="h-3 w-16 animate-pulse bg-border rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="border-b border-border px-3 py-2">
                        <div className="h-3 w-full animate-pulse bg-border rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data && data.headers.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SearchInput
                placeholder="Search by intern name or status..."
                value={search}
                onChange={setSearch}
                className="max-w-md"
              />
              {/* Tab switcher — real tab names from spreadsheet metadata */}
              {selectedSheetId && selectedSheet && (() => {
                const [sheetId] = selectedSheetId.split("|");
                return (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Tab:</label>
                    <select
                      value={currentGid}
                      onChange={(e) => {
                        const key = `${sheetId}|${e.target.value}`;
                        handleTabSwitch(key);
                      }}
                      disabled={loadingTabs || !sheetMetadata}
                      className="appearance-none rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                    >
                      {loadingTabs || !sheetMetadata ? (
                        <option>Loading tabs...</option>
                      ) : (
                        sheetMetadata.tabs.map((tab) => (
                          <option key={tab.gid} value={tab.gid}>
                            {tab.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredRows.length} of {data.rows.length} interns
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card-hover/50">
                  {data.headers.map((header, idx) => {
                    const isStatusCol =
                      header.toLowerCase().includes("status") ||
                      header.toLowerCase().includes("complete");
                    const isNameCol =
                      header.toLowerCase().includes("name") ||
                      header.toLowerCase().includes("intern");
                    return (
                      <th
                        key={idx}
                        className={`whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider ${
                          isNameCol ? "w-32" : isStatusCol ? "w-24" : "w-16"
                        }`}
                      >
                        {header || `Col ${idx + 1}`}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-border/30 hover:bg-card-hover/30 transition-colors"
                  >
                    {row.map((cell, cIdx) => {
                      const header = data.headers[cIdx] || "";
                      const isStatusCol =
                        header.toLowerCase().includes("status") ||
                        header.toLowerCase().includes("complete");
                      const isNameCol = cIdx === 0;

                      const isCompleted =
                        isStatusCol &&
                        cell &&
                        (cell.toLowerCase().includes("complete") ||
                          cell.toLowerCase().includes("done"));
                      const isPending =
                        isStatusCol &&
                        cell &&
                        (cell.toLowerCase().includes("pending") ||
                          cell.toLowerCase().includes("incomplete"));

                      return (
                        <td
                          key={cIdx}
                          className={`px-3 py-2 whitespace-nowrap text-sm ${
                            isNameCol ? "font-medium text-foreground" : ""
                          }`}
                        >
                          {isStatusCol ? (
                            isCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                                <IconCircleCheck size={12} />
                                {cell || "Completed"}
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                                <IconCircleX size={12} />
                                {cell || "Pending"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{cell || "—"}</span>
                            )
                          ) : (
                            cell || "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && data.rows.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No matching records found.
            </div>
          )}
        </>
      )}
    </div>
  );
}