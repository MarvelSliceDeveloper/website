import { supabase } from './supabaseClient.js';

export const RSS_FEEDS = [
  // 1. Banking & RBI
  {
    name: 'Economic Times & RBI',
    category: 'Banking & RBI',
    url: 'https://news.google.com/rss/search?q=Banking+RBI+Reserve+Bank+India+site:economictimes.indiatimes.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Livemint & Business Banking',
    category: 'Banking & RBI',
    url: 'https://news.google.com/rss/search?q=Banking+Finance+site:livemint.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Financial Express Banking',
    category: 'Banking & RBI',
    url: 'https://news.google.com/rss/search?q=Banking+RBI+Monetary+Policy+site:financialexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  // 2. Economy & Business
  {
    name: 'Economic Times Economy',
    category: 'Economy & Business',
    url: 'https://news.google.com/rss/search?q=Economy+GDP+Inflation+India+site:economictimes.indiatimes.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Business Standard Policy',
    category: 'Economy & Business',
    url: 'https://news.google.com/rss/search?q=Economy+Trade+Markets+site:business-standard.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Livemint Economy & Markets',
    category: 'Economy & Business',
    url: 'https://news.google.com/rss/search?q=Economy+Markets+GST+site:livemint.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  // 3. Government Schemes
  {
    name: 'PIB India Official Schemes',
    category: 'Government Schemes',
    url: 'https://news.google.com/rss/search?q=site:pib.gov.in+Scheme+Yojana+Ministry&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'The Hindu Govt Policies',
    category: 'Government Schemes',
    url: 'https://news.google.com/rss/search?q=Government+Scheme+Ministry+site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Indian Express Schemes',
    category: 'Government Schemes',
    url: 'https://news.google.com/rss/search?q=Scheme+Cabinet+Approval+site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'Medium',
  },
  // 4. National Affairs
  {
    name: 'The Hindu National News',
    category: 'National Affairs',
    url: 'https://news.google.com/rss/search?q=National+News+India+Parliament+site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Indian Express National',
    category: 'National Affairs',
    url: 'https://news.google.com/rss/search?q=National+Governance+Supreme+Court+site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Times of India National',
    category: 'National Affairs',
    url: 'https://news.google.com/rss/search?q=India+National+News+site:timesofindia.indiatimes.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  // 5. International Affairs
  {
    name: 'The Hindu World & Diplomacy',
    category: 'International Affairs',
    url: 'https://news.google.com/rss/search?q=India+Foreign+Policy+Summit+site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'BBC World News & India',
    category: 'International Affairs',
    url: 'https://news.google.com/rss/search?q=Global+Geopolitics+United+Nations+site:bbc.com&hl=en-US&gl=US&ceid=US:en',
    importance: 'High',
  },
  {
    name: 'Reuters World News',
    category: 'International Affairs',
    url: 'https://news.google.com/rss/search?q=International+Affairs+Diplomacy+site:reuters.com&hl=en-US&gl=US&ceid=US:en',
    importance: 'Medium',
  },
  // 6. Science & Defense
  {
    name: 'ISRO, DRDO & Defense News',
    category: 'Science & Defense',
    url: 'https://news.google.com/rss/search?q=ISRO+DRDO+Defense+Military+site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  {
    name: 'Tech & Science Express',
    category: 'Science & Defense',
    url: 'https://news.google.com/rss/search?q=Science+Defense+Technology+site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'High',
  },
  // 7. Sports & Awards
  {
    name: 'The Hindu Sports & Honors',
    category: 'Sports & Awards',
    url: 'https://news.google.com/rss/search?q=Sports+Awards+Cricket+Olympics+site:thehindu.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'Medium',
  },
  {
    name: 'Indian Express Sports & Awards',
    category: 'Sports & Awards',
    url: 'https://news.google.com/rss/search?q=Sports+World+Cup+Awards+site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    importance: 'Medium',
  },
];

function decodeHtmlEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function extractImageUrl(description = '', enclosureUrl = '', mediaUrl = '') {
  if (enclosureUrl) return enclosureUrl;
  if (mediaUrl) return mediaUrl;
  const match = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export function formatDetailedContent(title, description, category, source, dateStr) {
  const headline = (title || '').replace(/\s*-\s*[^-]+$/, '').trim();
  const cleanSnippet = decodeHtmlEntities(description || '');

  if (cleanSnippet.length > 120 && !cleanSnippet.includes(headline)) {
    return cleanSnippet;
  }

  const dateFormatted = dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Recent';

  return `Executive Summary (${dateFormatted}):
${headline}. Reported by ${source || 'Official News Source'}, this update represents a key current affairs development under ${category}.

Detailed Background & Context:
Nodal authorities and official representatives have highlighted key developments regarding this announcement. Key aspects to track for competitive examinations include policy scope, regulatory frameworks, operational timelines, and financial or institutional benchmarks associated with ${headline}.

Exam Revision Highlights:
• Topic Category: ${category}
• Primary Source: ${source || 'Official Media'}
• Exam Relevance: High priority for IBPS PO, SBI PO, RBI Grade B, SSC, and Railway Mains examinations.`;
}

function parseRssXml(xmlText, category, defaultImportance, feedSource) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);

    const rawTitle = titleMatch ? titleMatch[1] : '';
    const cleanTitle = decodeHtmlEntities(rawTitle);
    const link = linkMatch ? linkMatch[1].trim() : '';
    const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
    const rawDesc = descMatch ? descMatch[1] : '';
    const cleanDesc = decodeHtmlEntities(rawDesc);
    const sourceName = sourceMatch ? decodeHtmlEntities(sourceMatch[1]) : feedSource;
    const imageUrl = extractImageUrl(
      rawDesc,
      enclosureMatch ? enclosureMatch[1] : '',
      mediaMatch ? mediaMatch[1] : ''
    );

    if (cleanTitle && link) {
      let publishedAt = new Date().toISOString();
      try {
        const parsedDate = new Date(pubDateStr);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate.toISOString();
        }
      } catch {
        // Fallback to now
      }

      const summary = cleanTitle;
      const content = formatDetailedContent(cleanTitle, cleanDesc, category, sourceName, publishedAt);

      items.push({
        title: cleanTitle,
        summary,
        content,
        category,
        source: sourceName || 'Official News Agency',
        source_url: link,
        image_url: imageUrl || '/images/banking/5.png',
        published_at: publishedAt,
        importance: defaultImportance,
        is_published: true,
      });
    }
  }

  return items;
}

export async function fetchRssFeed(feed) {
  const proxies = [
    feed.url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`,
    `https://corsproxy.io/?${encodeURIComponent(feed.url)}`,
  ];

  for (const targetUrl of proxies) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!response.ok) continue;

      const xmlText = await response.text();
      const items = parseRssXml(xmlText, feed.category, feed.importance, feed.name);
      if (items && items.length > 0) {
        return items;
      }
    } catch {
      // Try next proxy candidate
    }
  }

  return [];
}

export async function fetchAndStoreCurrentAffairs() {
  console.log('[RSS] Starting automated Current Affairs fetch (India + International feeds)...');
  let totalFetched = 0;
  let totalInserted = 0;
  const allParsedItems = [];

  for (const feed of RSS_FEEDS) {
    const items = await fetchRssFeed(feed);
    totalFetched += items.length;
    allParsedItems.push(...items);
  }

  if (allParsedItems.length === 0) {
    console.log('[RSS] No items fetched.');
    return { fetched: 0, inserted: 0, items: [] };
  }

  // Deduplicate items by source_url in memory
  const uniqueItemsMap = new Map();
  for (const item of allParsedItems) {
    if (!uniqueItemsMap.has(item.source_url)) {
      uniqueItemsMap.set(item.source_url, item);
    }
  }
  const uniqueItems = Array.from(uniqueItemsMap.values());

  try {
    // Check existing URLs in Supabase current_affairs
    const { data: existing, error: selectErr } = await supabase
      .from('current_affairs')
      .select('source_url');

    if (selectErr) {
      console.warn('[RSS] Supabase query notice (table may need migration):', selectErr.message);
      return { fetched: totalFetched, inserted: 0, items: uniqueItems };
    }

    const existingUrls = new Set((existing || []).map((row) => row.source_url));
    const newItems = uniqueItems.filter((item) => !existingUrls.has(item.source_url));

    if (newItems.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('current_affairs')
        .upsert(newItems, { onConflict: 'source_url', ignoreDuplicates: true })
        .select('id');

      if (insertErr) {
        console.error('[RSS] Supabase insertion error:', insertErr.message);
      } else {
        totalInserted = inserted ? inserted.length : 0;
        console.log(`[RSS] Successfully processed ${newItems.length} articles (${totalInserted} new inserted).`);
      }
    } else {
      console.log('[RSS] All fetched articles are already up to date.');
    }
  } catch (err) {
    console.error('[RSS] Unexpected DB processing error:', err.message);
  }

  return { fetched: totalFetched, inserted: totalInserted, items: uniqueItems };
}
