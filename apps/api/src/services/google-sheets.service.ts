import { logger } from "../utils/logger";

/**
 * Google Sheets service — fetches assignment tracker data from publicly-readable
 * Google Sheets via the CSV export URL, and discovers tabs by scraping Google's
 * public "htmlview" page.
 *
 * CSV data fetching and tab discovery need no credentials — the sheet must be
 * shared as "Anyone with the link can view" (File → Share → General access).
 *
 * ⚠️ The htmlview scrape and CSV export are unofficial and could break if Google
 * changes their pages. To stay resilient, this service falls back to the
 * official Sheets API v4 when the normal path fails — set a free, read-only
 * Google Sheets API key as GOOGLE_SHEETS_API_KEY (Google Cloud Console →
 * APIs & Services → Credentials, restricted to the Sheets API). The key only
 * reads publicly-viewable sheets; it does NOT bypass sharing settings.
 *
 * Fallback behaviour:
 *  - fetchSheet: CSV export URLs → Sheets API v4 values.get
 *  - getSpreadsheetMetadata (tabs): htmlview scrape → Sheets API v4 spreadsheets.get
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

function getSheetsApiKey(): string | undefined {
  return process.env.GOOGLE_SHEETS_API_KEY?.trim() || undefined;
}

const DATA_CACHE_TTL_MS = 30_000;
const METADATA_CACHE_TTL_MS = 5 * 60_000;

type SheetDataResult = {
  headers: string[];
  rows: string[][];
  lastUpdated: string;
};

class GoogleSheetsService {
  private readonly dataCache = new Map<
    string,
    { value: SheetDataResult; expiresAt: number }
  >();
  private readonly metadataCache = new Map<
    string,
    { value: SheetMetadata; expiresAt: number }
  >();
  /**
   * Fetch sheet data with a short in-memory TTL cache (30s) so repeated loads
   * (tab switches, re-visits) don't re-hit Google. Pass `bypassCache` (e.g.
   * from the admin "Refresh" button) to force a fresh read.
   */
  async fetchSheet(
    spreadsheetId: string,
    gid: string = "0",
    bypassCache = false,
  ): Promise<SheetDataResult> {
    const cacheKey = `${spreadsheetId}|${gid}`;
    if (!bypassCache) {
      const cached = this.dataCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.info("[GoogleSheets] fetchSheet cache hit: %s", cacheKey);
        return cached.value;
      }
    }

    const data = await this.loadSheet(spreadsheetId, gid);
    this.dataCache.set(cacheKey, {
      value: data,
      expiresAt: Date.now() + DATA_CACHE_TTL_MS,
    });
    return data;
  }

  /**
   * Load sheet data — tries the CSV export URL first (no credentials, works
   * for public sheets). If every CSV URL fails and GOOGLE_SHEETS_API_KEY is
   * set, falls back to the official Sheets API v4 values.get endpoint. If the
   * sheet is private, both paths fail and the error is surfaced to the caller.
   */
  private async loadSheet(
    spreadsheetId: string,
    gid: string,
  ): Promise<SheetDataResult> {
    try {
      return await this.fetchSheetViaCsv(spreadsheetId, gid);
    } catch (csvErr: unknown) {
      const apiKey = getSheetsApiKey();
      if (!apiKey) throw csvErr;

      logger.warn(
        "[GoogleSheets] CSV export failed for %s (gid %s) — falling back to Sheets API v4.",
        spreadsheetId,
        gid,
      );
      try {
        return await this.fetchSheetViaApi(spreadsheetId, gid, apiKey);
      } catch (apiErr: unknown) {
        const csvMsg = csvErr instanceof Error ? csvErr.message : String(csvErr);
        const apiMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        throw new Error(`Could not load sheet data. CSV: ${csvMsg} | API: ${apiMsg}`);
      }
    }
  }

  /**
   * Fetch sheet data via the CSV export URLs (works for public sheets).
   * No Google API credentials required — the sheet must be "Anyone with the
   * link can view". If the sheet is private, the response will be a 403/404
   * and the error is surfaced to the caller.
   */
  private async fetchSheetViaCsv(
    spreadsheetId: string,
    gid: string,
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
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        logger.warn(
          "[GoogleSheets] CSV fetch attempt failed for %s: %s",
          csvUrl,
          lastErr.message,
        );
      }
    }

    throw lastErr ?? new Error("Unknown error fetching Google Sheets data");
  }

  /**
   * Fallback data fetch via the official Sheets API v4 (values.get with
   * formatted values, so the output matches the CSV export as closely as
   * possible). Requires GOOGLE_SHEETS_API_KEY. The API addresses tabs by
   * title, so the gid is first resolved to a sheet title.
   */
  private async fetchSheetViaApi(
    spreadsheetId: string,
    gid: string,
    apiKey: string,
  ): Promise<{ headers: string[]; rows: string[][]; lastUpdated: string }> {
    const sheetTitle = await this.resolveTabTitle(spreadsheetId, gid, apiKey);
    const range = `${sheetTitle}!A1:ZZZ`;
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}` +
      `?key=${encodeURIComponent(apiKey)}&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Sheets API values.get failed: ${res.status} ${body.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as { values?: unknown[][] };
    const values = Array.isArray(json.values) ? json.values : [];
    const normalized = values.map((row) =>
      (Array.isArray(row) ? row : []).map((cell) =>
        cell === null || cell === undefined ? "" : String(cell),
      ),
    );

    const headers = normalized[0] ?? [];
    const rows = normalized.slice(1);

    logger.info(
      "[GoogleSheets] Fetched via API: %d rows, %d cols",
      rows.length,
      headers.length,
    );

    return { headers, rows, lastUpdated: new Date().toISOString() };
  }

  /**
   * Resolve a numeric gid to its tab title via the Sheets API v4
   * (spreadsheets.get). Used by fetchSheetViaApi to address a tab by range.
   */
  private async resolveTabTitle(
    spreadsheetId: string,
    gid: string,
    apiKey: string,
  ): Promise<string> {
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
      `?key=${encodeURIComponent(apiKey)}&fields=sheets.properties(sheetId,title)`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Sheets API spreadsheets.get failed: ${res.status} ${body.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as {
      sheets?: { properties?: { sheetId?: number; title?: string } }[];
    };
    const sheets = Array.isArray(json.sheets) ? json.sheets : [];
    const match = sheets.find(
      (s) =>
        s.properties?.sheetId !== undefined &&
        String(s.properties.sheetId) === gid,
    );

    if (!match?.properties?.title) {
      throw new Error(`Tab with gid ${gid} not found in spreadsheet.`);
    }
    return match.properties.title;
  }

  /**
   * Fetch real spreadsheet metadata (title + every tab's title/gid) with a
   * long in-memory TTL cache (5 min — tab lists change rarely). Pass
   * `bypassCache` to force a fresh read.
   */
  async getSpreadsheetMetadata(
    spreadsheetId: string,
    bypassCache = false,
  ): Promise<SheetMetadata> {
    const cacheKey = spreadsheetId;
    if (!bypassCache) {
      const cached = this.metadataCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.info("[GoogleSheets] metadata cache hit: %s", cacheKey);
        return cached.value;
      }
    }

    const metadata = await this.loadSpreadsheetMetadata(spreadsheetId);
    this.metadataCache.set(cacheKey, {
      value: metadata,
      expiresAt: Date.now() + METADATA_CACHE_TTL_MS,
    });
    return metadata;
  }

  /**
   * Load spreadsheet metadata — tries the public "htmlview" page scrape first
   * (no credentials); if that fails and GOOGLE_SHEETS_API_KEY is set, falls
   * back to the official Sheets API v4 spreadsheets.get endpoint.
   */
  private async loadSpreadsheetMetadata(
    spreadsheetId: string,
  ): Promise<SheetMetadata> {
    try {
      return await this.getSpreadsheetMetadataViaHtmlView(spreadsheetId);
    } catch (htmlErr: unknown) {
      const apiKey = getSheetsApiKey();
      if (!apiKey) throw htmlErr;

      logger.warn(
        "[GoogleSheets] htmlview scrape failed for %s — falling back to Sheets API v4.",
        spreadsheetId,
      );
      try {
        return await this.getSpreadsheetMetadataViaApi(spreadsheetId, apiKey);
      } catch (apiErr: unknown) {
        const htmlMsg = htmlErr instanceof Error ? htmlErr.message : String(htmlErr);
        const apiMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        throw new Error(
          `Could not read spreadsheet tabs. htmlview: ${htmlMsg} | API: ${apiMsg}`,
        );
      }
    }
  }

  /**
   * Tab discovery by scraping Google's public "htmlview" page WITHOUT an API
   * key. The sheet must be shared as "Anyone with the link can view" (same
   * requirement as CSV fetching already has).
   *
   * ⚠️ TRADE-OFF: this parses Google's public HTML page structure, which is
   * NOT an official/documented API. It works today, but Google could change
   * that page's markup at any time and silently break tab discovery — there
   * is no contract guaranteeing it keeps working. When this path fails and
   * GOOGLE_SHEETS_API_KEY is set, getSpreadsheetMetadata automatically falls
   * back to the official Sheets API v4 (getSpreadsheetMetadataViaApi).
   */
  private async getSpreadsheetMetadataViaHtmlView(
    spreadsheetId: string,
  ): Promise<SheetMetadata> {
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
   * Fallback tab discovery via the official Sheets API v4 (spreadsheets.get).
   * Requires GOOGLE_SHEETS_API_KEY. The key only reads publicly-viewable
   * sheets — it does not bypass sharing settings.
   */
  private async getSpreadsheetMetadataViaApi(
    spreadsheetId: string,
    apiKey: string,
  ): Promise<SheetMetadata> {
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
      `?key=${encodeURIComponent(apiKey)}&fields=properties.title,sheets.properties(sheetId,title)`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Sheets API metadata failed: ${res.status} ${body.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as {
      properties?: { title?: string };
      sheets?: { properties?: { sheetId?: number; title?: string } }[];
    };
    const spreadsheetTitle =
      json.properties?.title?.trim() || "Untitled Spreadsheet";

    const tabs: SheetTab[] = [];
    const sheets = Array.isArray(json.sheets) ? json.sheets : [];
    for (const sheet of sheets) {
      const gid = sheet.properties?.sheetId;
      const title = sheet.properties?.title?.trim();
      if (gid !== undefined && title) tabs.push({ gid: String(gid), title });
    }

    if (tabs.length === 0) {
      throw new Error(
        "Sheets API returned no tabs for this spreadsheet — make sure it is publicly viewable.",
      );
    }

    logger.info(
      "[GoogleSheets] Discovered %d tab(s) in '%s' via Sheets API v4",
      tabs.length,
      spreadsheetTitle,
    );

    return { spreadsheetTitle, tabs };
  }

  /**
   * List available tabs (gid + title) in a spreadsheet, plus the
   * spreadsheet's own title. Replaces the old gid-guessing approach.
   */
  async listSheetTabs(
    spreadsheetId: string,
    bypassCache = false,
  ): Promise<SheetMetadata> {
    return this.getSpreadsheetMetadata(spreadsheetId, bypassCache);
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