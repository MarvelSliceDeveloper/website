/**
 * Parses a video URL and returns its platform type and embed ID.
 *
 * Supports YouTube (watch, embed, shorts, youtu.be), Vimeo, and Loom URLs.
 * Returns null for unrecognized or unsupported URLs.
 *
 * @param url - The video URL to parse
 * @returns Object with `type` and `embedId`, or null if unsupported
 */
export function parseVideoUrl(
  url: string,
): { type: string; embedId: string } | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return { type: "youtube", embedId: ytMatch[1] };

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "vimeo", embedId: vimeoMatch[1] };

  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) return { type: "loom", embedId: loomMatch[1] };

  return null;
}
