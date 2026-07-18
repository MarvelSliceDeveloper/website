export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  durationSeconds: number;
  thumbnail: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]?.replace("H", "") ?? "0", 10);
  const minutes = parseInt(match[2]?.replace("M", "") ?? "0", 10);
  const seconds = parseInt(match[3]?.replace("S", "") ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

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
