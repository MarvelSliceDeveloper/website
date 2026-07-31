/**
 * YouTube Data API v3 integration for fetching video metadata.
 *
 * Used by the admin course builder to auto-fill lesson title and duration
 * when an instructor pastes a YouTube URL.
 *
 * Requires YOUTUBE_API_KEY env var. Free tier: 10,000 quota units/day.
 */
export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  durationSeconds: number;
  thumbnail: string;
}

/**
 * Extracts the 11-character video ID from various YouTube URL formats.
 *
 * Supports: watch?v= (v= anywhere in the query string), watch/ID,
 * shorts/, live/, embed/, v/, youtu.be/, and bare 11-char IDs.
 *
 * @param url - YouTube URL or bare video ID
 * @returns 11-character video ID, or null if no match
 */
export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();

  // Bare 11-char video ID
  const bareMatch = trimmed.match(/^([a-zA-Z0-9_-]{11})$/);
  if (bareMatch) return bareMatch[1];

  // Path-based IDs: /watch/ID, /shorts/ID, /live/ID, /embed/ID, /v/ID, youtu.be/ID
  const pathMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch|shorts|live|embed|v)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (pathMatch) return pathMatch[1];

  // Query-based: youtube.com/watch?...&v=ID — v= may appear anywhere in the query string
  if (/youtube\.com/.test(trimmed)) {
    const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (queryMatch) return queryMatch[1];
  }

  return null;
}

/**
 * Converts ISO 8601 duration (e.g. "PT1H30M15S") to total seconds.
 *
 * @param duration - ISO 8601 duration string
 * @returns Total seconds, or 0 for invalid input
 */
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]?.replace("H", "") ?? "0", 10);
  const minutes = parseInt(match[2]?.replace("M", "") ?? "0", 10);
  const seconds = parseInt(match[3]?.replace("S", "") ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetches video metadata (title, duration, thumbnail) from YouTube Data API.
 *
 * @param urlOrId - YouTube URL or bare video ID
 * @returns Video metadata, or null if API key not set, video not found, or fetch fails
 */
export async function fetchYouTubeVideoInfo(
  urlOrId: string,
): Promise<YouTubeVideoInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[youtube] YOUTUBE_API_KEY not set");
    return null;
  }

  const videoId = extractVideoId(urlOrId);
  if (!videoId) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`,
    );
    if (!res.ok) {
      console.warn(`[youtube] API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: { title: string; thumbnails?: { default?: { url: string } } };
        contentDetails?: { duration: string };
      }>;
    };

    const item = data.items?.[0];
    if (!item) return null;

    return {
      videoId: item.id,
      title: item.snippet?.title ?? "",
      durationSeconds: parseISO8601Duration(
        item.contentDetails?.duration ?? "PT0S",
      ),
      thumbnail:
        item.snippet?.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    };
  } catch (err) {
    console.warn("[youtube] fetch failed:", err);
    return null;
  }
}
