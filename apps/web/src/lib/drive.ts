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

/** True when the URL is a full http(s) URL (external / cross-origin). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
