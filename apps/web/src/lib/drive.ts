/**
 * Google Drive URL helpers.
 *
 * Admins paste share links like:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/file/d/FILE_ID/preview
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *
 * A raw Drive link cannot be embedded in an <iframe> (drive.google.com
 * blocks framing) nor downloaded directly, so we normalize them to the
 * /preview (embeddable) and /uc?export=download (direct download) forms.
 */

const DRIVE_ID_PATTERNS = [
  /file\/d\/([^/?#]+)/,
  /open\?id=([^&#]+)/,
  /uc\?id=([^&#]+)/,
  /uc\?export=download&id=([^&#]+)/,
  /id=([^&#]+)/,
];

export function getDriveFileId(url: string): string | null {
  if (!url || !/drive\.google\.com/i.test(url)) return null;
  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  return getDriveFileId(url) !== null;
}

/** Embeddable URL for <iframe src>. Falls back to the original URL. */
export function getDrivePreviewUrl(url: string): string {
  const id = getDriveFileId(url);
  if (!id) return url;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/** Direct download URL (no Drive web UI wrapper). */
export function getDriveDownloadUrl(url: string): string {
  const id = getDriveFileId(url);
  if (!id) return url;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "0"]);

/**
 * True when the URL is a genuinely external http(s) URL that must be fetched
 * through the API's SSRF-protected download proxy (e.g. Google Drive).
 *
 * Local API uploads (e.g. `http://localhost:4000/uploads/...`) are served with
 * CORS headers and are fetched directly — sending them through the proxy would
 * be rejected by the SSRF guard, which refuses private/reserved hosts.
 */
export function isExternalUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    // Local API uploads live under /uploads/ regardless of host — fetch them
    // directly, never through the SSRF-guarded proxy.
    if (parsed.pathname.startsWith("/uploads/")) return false;
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (LOCAL_HOSTS.has(host) || host.endsWith(".local")) return false;
  } catch {
    return true;
  }
  return true;
}
