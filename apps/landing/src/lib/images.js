export function optimizedUrl(url, width = 800) {
  if (!url) return url;
  if (url.includes('supabase') || url.includes('storage.googleapis.com')) {
    return `${url}?width=${width}&quality=75`;
  }
  return url;
}
