import { logger } from "../utils/logger";

/**
 * Google Sheets service — fetches assignment tracker data from publicly-readable
 * Google Sheets via the CSV export URL, and discovers tabs via the Sheets API
 * v4 metadata endpoint.
 *
 * CSV data fetching needs no credentials — the sheet must be shared as
 * "Anyone with the link can view" (File → Share → General access).
 *
 * Tab discovery (listSheetTabs) needs a free, read-only Google Sheets API key
 * set as GOOGLE_SHEETS_API_KEY. This is NOT OAuth — just an API key you
 * create in Google Cloud Console (APIs & Services → Credentials), restricted
 * to the Sheets API. It works fine against publicly-viewable sheets.
 *
 * Sheet IDs are stored in the SystemSetting model (key:
 * `intern_assignment_sheets`) as a JSON array: [{ id, name, addedAt, gid }]
 */

export type SavedSheet = {
  id: string;
  name: string;
  addedAt: string;
  gid?: string;
};

export type SheetTab = {
  gid: string;
  title: string;
};

export type SheetMetadata = {
  spreadsheetTitle: string;
  tabs: SheetTab[];
};

const SYSTEM_SETTING_KEY = "intern_assignment_sheets";

/** Decode the handful of HTML entities that show up in Google's tab titles. */
function decodeHtmlEntities_(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Parse CSV text into rows of cells. Handles basic double-quote escaping. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim() === "") continue;
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        row.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

class GoogleSheetsService {
  /**
   * Fetch sheet data via the CSV export URL (works for public sheets).
   * No Google API credentials required — the sheet must be "Anyone with the
   * link can view". If the sheet is private, the response will be a 403/404
   * and the error is surfaced to the caller.
   */
  async fetchSheet(
    spreadsheetId: string,
    gid: string = "0",
  ): Promise<{
    headers: string[];
    rows: string[][];
    lastUpdated: string;
  }> {
    const urls = [
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
    ];

    let lastErr: Error | null = null;
    for (const csvUrl of urls) {
      try {
        const res = await fetch(csvUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/csv,text/html;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
        });

        if (!res.ok) {
          const bodyText = await res.text();
          const body = bodyText.slice(0, 300);
          lastErr = new Error(
            `CSV export failed: ${res.status} ${res.statusText}. ${body}`,
          );
          logger.warn(
            "[GoogleSheets] CSV export attempt failed: %s — trying next URL...",
            csvUrl,
          );
          continue;
        }

        const csvText = await res.text();
        const values = parseCsv(csvText);

        if (values.length === 0) {
          return {
            headers: [],
            rows: [],
            lastUpdated: new Date().toISOString(),
          };
        }

        const headers = values[0] ?? [];
        const rows = values.slice(1);

        logger.info(
          "[GoogleSheets] Fetched CSV: %d rows, %d cols",
          rows.length,
          headers.length,
        );

        return {
          headers,
          rows,
          lastUpdated: new Date().toISOString(),
        };
      } catch (err: any) {
        lastErr = err;
        logger.warn(
          "[GoogleSheets] CSV fetch attempt failed for %s: %s",
          csvUrl,
          err.message,
        );
      }
    }

    throw lastErr ?? new Error("Unknown error fetching Google Sheets data");
  }

  /**
   * Fetch real spreadsheet metadata (title + every tab's title/gid) WITHOUT
   * an API key, by scraping Google's public "htmlview" page. The sheet must
   * be shared as "Anyone with the link can view" (same requirement as CSV
   * fetching already has).
   *
   * ⚠️ TRADE-OFF: this parses Google's public HTML page structure, which is
   * NOT an official/documented API. It works today, but Google could change
   * that page's markup at any time and silently break tab discovery — there
   * is no contract guaranteeing it keeps working. If this ever starts
   * returning zero tabs, fall back to manually adding sheets with their gid
   * (already supported via the "Add Sheet" form — find the gid in the
   * browser URL bar as #gid=XXXXXXXXXX when viewing that tab).
   *
   * The officially-supported, stable alternative is the Sheets API v4 with
   * a free read-only API key — worth reconsidering if this breaks.
   */
  async getSpreadsheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn(
        "[GoogleSheets] htmlview fetch failed for %s: %d %s",
        spreadsheetId,
        res.status,
        body.slice(0, 300),
      );
      throw new Error(
        `Could not read spreadsheet page (${res.status}). Make sure the sheet is shared as "Anyone with the link can view" and the ID is correct.`,
      );
    }

    const html = await res.text();

    // Spreadsheet title lives in <title>Name - Google Sheets</title>
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const spreadsheetTitle = titleMatch
      ? decodeHtmlEntities_(titleMatch[1]).replace(/\s*-\s*Google (Sheets|Drive)\s*$/i, "").trim()
      : "Untitled Spreadsheet";

    // Tab bar entries look like:
    // <li id="sheet-button-1847293056" ...><span ...>Batch A</span></li>
    const tabs: SheetTab[] = [];
    const tabRegex = /id="sheet-button-(\d+)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g;
    let match: RegExpExecArray | null;
    while ((match = tabRegex.exec(html)) !== null) {
      const gid = match[1];
      const title = decodeHtmlEntities_(match[2]).trim();
      if (title) tabs.push({ gid, title });
    }

    if (tabs.length === 0) {
      logger.warn(
        "[GoogleSheets] No tabs detected via htmlview scrape for %s — page structure may have changed, or sheet isn't public.",
        spreadsheetId,
      );
      throw new Error(
        "Could not detect any tabs automatically. Either the sheet isn't publicly viewable, or Google changed their page layout. Add this sheet's tabs manually instead (find each tab's gid in the URL bar: #gid=XXXXXXXXXX).",
      );
    }

    logger.info(
      "[GoogleSheets] Discovered %d tab(s) in '%s' via htmlview scrape",
      tabs.length,
      spreadsheetTitle,
    );

    return { spreadsheetTitle, tabs };
  }

  /**
   * List available tabs (gid + title) in a spreadsheet, plus the
   * spreadsheet's own title. Replaces the old gid-guessing approach.
   */
  async listSheetTabs(spreadsheetId: string): Promise<SheetMetadata> {
    return this.getSpreadsheetMetadata(spreadsheetId);
  }

  /**
   * Get saved sheet IDs from SystemSetting.
   * Returns an array of { id, name, addedAt, gid }.
   */
  async getSavedSheets(): Promise<SavedSheet[]> {
    const { prisma } = await import("../utils/prisma");
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SYSTEM_SETTING_KEY },
    });

    if (!setting || !setting.value) return [];

    try {
      return JSON.parse(setting.value) as SavedSheet[];
    } catch {
      return [];
    }
  }

  /**
   * Save a sheet (id + gid + name) to SystemSetting. Prevents duplicates by
   * id+gid combo, so the same spreadsheet tab can't be saved twice.
   */
  async saveSheet(sheet: {
    id: string;
    name: string;
    gid?: string;
  }): Promise<SavedSheet[]> {
    const { prisma } = await import("../utils/prisma");

    const existing = await this.getSavedSheets();
    const gid = sheet.gid ?? "0";
    // Dedup by id+gid combo
    const filtered = existing.filter(
      (s) => !(s.id === sheet.id && (s.gid ?? "0") === gid),
    );
    const updated = [
      ...filtered,
      { id: sheet.id, name: sheet.name, gid, addedAt: new Date().toISOString() },
    ];

    await prisma.systemSetting.upsert({
      where: { key: SYSTEM_SETTING_KEY },
      update: { value: JSON.stringify(updated) },
      create: {
        key: SYSTEM_SETTING_KEY,
        value: JSON.stringify(updated),
        type: "json",
      },
    });

    return updated;
  }

  /**
   * Remove a saved sheet by ID (and optional gid to disambiguate tabs).
   */
  async removeSheet(sheetId: string, gid?: string): Promise<SavedSheet[]> {
    const { prisma } = await import("../utils/prisma");

    const existing = await this.getSavedSheets();
    let updated: SavedSheet[];
    if (gid !== undefined) {
      // Remove only the matching id+gid combo
      updated = existing.filter(
        (s) => !(s.id === sheetId && (s.gid ?? "0") === gid),
      );
    } else {
      // Remove all sheets with this ID
      updated = existing.filter((s) => s.id !== sheetId);
    }

    if (updated.length === 0) {
      await prisma.systemSetting.deleteMany({
        where: { key: SYSTEM_SETTING_KEY },
      });
    } else {
      await prisma.systemSetting.update({
        where: { key: SYSTEM_SETTING_KEY },
        data: { value: JSON.stringify(updated) },
      });
    }

    return updated;
  }
}

export const googleSheetsService = new GoogleSheetsService();