// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// We Work Remotely provider — public RSS feeds (no key required).
// Feeds: https://weworkremotely.com/categories/remote-programming-jobs.rss
// Item titles are formatted "Company: Role"; <region> carries the location.
// Reputable, remote-only board. Newest-first ordering.
//
// Configure as a job_boards entry:
//   - name: "We Work Remotely"
//     provider: weworkremotely
//     feed: "https://weworkremotely.com/categories/remote-programming-jobs.rss"  # optional

const DEFAULT_FEED = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';
const API_HOST = 'weworkremotely.com';

/** @param {string} url */
function assertWwrUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`weworkremotely: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`weworkremotely: URL must use HTTPS: ${url}`);
  if (parsed.hostname !== API_HOST && !parsed.hostname.endsWith('.' + API_HOST))
    throw new Error(`weworkremotely: untrusted hostname "${parsed.hostname}"`);
  return url;
}

function stripCdata(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(stripCdata(m[1])) : '';
}

function toEpochMs(value) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** @type {Provider} */
export default {
  id: 'weworkremotely',

  detect(entry) {
    if (entry.provider === 'weworkremotely') return { url: entry.feed || DEFAULT_FEED };
    const url = entry.careers_url || entry.feed || '';
    return /(^|\.)weworkremotely\.com/i.test(url) ? { url: entry.feed || DEFAULT_FEED } : null;
  },

  async fetch(entry, ctx) {
    const feed = entry.feed || DEFAULT_FEED;
    assertWwrUrl(feed);
    const xml = await ctx.fetchText(feed, { redirect: 'error' });
    const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    const jobs = [];
    for (const block of items) {
      const rawTitle = tag(block, 'title');
      const link = tag(block, 'link');
      if (!rawTitle || !link) continue;
      // Titles look like "Company: Role" — split on the first colon.
      let company = '';
      let title = rawTitle;
      const idx = rawTitle.indexOf(':');
      if (idx > 0) {
        company = rawTitle.slice(0, idx).trim();
        title = rawTitle.slice(idx + 1).trim();
      }
      jobs.push({
        title,
        url: link,
        company,
        location: tag(block, 'region') || 'Remote',
        postedAt: toEpochMs(tag(block, 'pubDate')),
      });
    }
    return jobs;
  },
};
