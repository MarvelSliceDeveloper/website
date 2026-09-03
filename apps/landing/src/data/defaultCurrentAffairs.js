// Headline / Title Deduplication Helper for Current Affairs
export function deduplicateCurrentAffairs(articles = []) {
  if (!Array.isArray(articles)) return [];
  const seenNormTitles = new Set();
  const result = [];

  for (const art of articles) {
    if (!art || !art.title) continue;

    // Normalize title by removing source suffixes (- The Hindu, - PIB, etc.), punctuation, lowercasing
    const rawTitle = (art.title || '')
      .replace(/\s*-\s*[^-]+$/, '') // Remove source suffix at end
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (!rawTitle) continue;

    // Truncate to first 35 alphanumeric chars for headline matching
    const key = rawTitle.slice(0, 35);

    if (!seenNormTitles.has(key)) {
      seenNormTitles.add(key);
      result.push(art);
    }
  }

  return result;
}
