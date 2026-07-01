// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// RemoteOK provider — public API (no key required).
// Docs: https://remoteok.com/api
// The API returns a JSON array whose first element is a legal/metadata notice;
// the rest are job objects. A browser-like User-Agent is required or the CDN
// returns 403. Reputable, remote-only board. Newest-first ordering.
//
// Configure as a job_boards entry:
//   - name: "RemoteOK"
//     provider: remoteok

const API_URL = 'https://remoteok.com/api';
const API_HOST = 'remoteok.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function toEpochMs(value) {
  if (!value) return undefined;
  // RemoteOK exposes both ISO `date` and epoch-seconds `epoch`.
  if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** @param {string} url */
function isRemoteOkUrl(url) {
  try {
    const p = new URL(url);
    return p.protocol === 'https:' && (p.hostname === API_HOST || p.hostname.endsWith('.' + API_HOST));
  } catch {
    return false;
  }
}

/** @type {Provider} */
export default {
  id: 'remoteok',

  detect(entry) {
    if (entry.provider === 'remoteok') return { url: API_URL };
    const url = entry.careers_url || '';
    return /(^|\.)remoteok\.com/i.test(url) ? { url: API_URL } : null;
  },

  async fetch(_entry, ctx) {
    const arr = /** @type {any} */ (
      await ctx.fetchJson(API_URL, { redirect: 'error', headers: { 'user-agent': UA } })
    );
    const rows = Array.isArray(arr) ? arr : [];
    return rows
      // Drop the leading legal-notice object and anything without a real posting.
      .filter(/** @param {any} j */ (j) => j && j.id && j.position && j.url && isRemoteOkUrl(j.url))
      .map(/** @param {any} j */ (j) => ({
        title: j.position || '',
        url: j.url,
        company: j.company || '',
        location: j.location || 'Remote',
        postedAt: toEpochMs(j.epoch || j.date),
      }));
  },
};
