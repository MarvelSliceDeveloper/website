# YouTube Data API Integration

Auto-fetches video metadata (title, duration, thumbnail) from YouTube when an admin adds/edits a lesson video URL in the course builder.

## Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable **YouTube Data API v3** (APIs & Services > Library)
4. Go to **Credentials** → Create Credentials → **API Key**
5. (Recommended) Restrict the key to YouTube Data API v3 and your server's IP/referrer

## Configuration

Add to root `.env`:

```env
YOUTUBE_API_KEY=your_api_key_here
```

**Free tier**: 10,000 quota units/day. Fetching one video = 1 unit. (~10k fetches/day free).

## Architecture

### Backend

| File | Purpose |
|------|---------|
| `apps/api/src/services/youtube.service.ts` | Fetches video info from YouTube API, parses ISO 8601 duration |
| `apps/api/src/modules/youtube/youtube.routes.ts` | `GET /api/youtube/video-info?url=...` returns `{ videoId, title, durationSeconds, thumbnail }` |

The route is mounted in `app.ts` at `/api/youtube`.

### Frontend

| File | Change |
|------|--------|
| `AddLessonForm.tsx` | On `onBlur` of video URL input, calls `/api/youtube/video-info`, sets `durationSeconds` and auto-fills title |
| `LessonCard.tsx` | Same on blur in edit mode; includes `durationSeconds` in save payload |

### Endpoint Response

```json
{
  "videoId": "_uQrJ0TkZlc",
  "title": "Python Full Course for Beginners",
  "durationSeconds": 22447,
  "thumbnail": "https://i.ytimg.com/vi/_uQrJ0TkZlc/default.jpg"
}
```

The backend parses ISO 8601 duration (`PT6H14M7S` → 22447 seconds).

## Usage

1. Admin opens a course → **Content** tab → adds/edits a lesson
2. Pastes a YouTube URL (e.g. `https://www.youtube.com/watch?v=abc123`)
3. On blur, the frontend calls `GET /api/youtube/video-info?url=...`
4. Title field auto-fills from YouTube, duration is saved to the lesson
5. Lesson card displays `{n} min` next to the video type badge

## Troubleshooting

- **404 response**: The API key is not set or the video doesn't exist
- **Empty response**: Check `YOUTUBE_API_KEY` in `.env`, verify YouTube Data API v3 is enabled
- **Quota exceeded**: You'll get a 403 from Google; wait for the quota to reset (daily)

## Related

- `apps/api/src/services/youtube.service.ts` — core fetching logic
- `apps/web/src/app/admin/courses/[id]/_components/AddLessonForm.tsx` — frontend integration
- `apps/web/src/app/admin/courses/[id]/_components/LessonCard.tsx` — edit mode integration
