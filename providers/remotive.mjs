// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// Remotive provider — public remote-jobs API (no key required).
// Docs: https://remotive.com/api/remote-jobs
// Configure as a job_boards entry:
//   - name: "Remotive"
//     provider: remotive
//     category: software-dev   # optional (Remotive category slug)
//     limit: 100               # optional
//
// Reputable, curated remote-only board. Newest-first ordering.

const API_HOST = 'remotive.com';

/** @param {string} url */
function assertRemotiveUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`remotive: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`remotive: URL must use HTTPS: ${url}`);
  if (parsed.hostname !== API_HOST)
    throw new Error(`remotive: untrusted hostname "${parsed.hostname}" — must be ${API_HOST}`);
  return url;
}

/** @param {import('./_types.js').PortalEntry & {category?: string, limit?: number}} entry */
function buildApiUrl(entry) {
  const u = new URL('https://remotive.com/api/remote-jobs');
  if (entry.category) u.searchParams.set('category', String(entry.category));
  if (entry.limit) u.searchParams.set('limit', String(entry.limit));
  return u.toString();
}

function toEpochMs(value) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** @type {Provider} */
export default {
  id: 'remotive',

  detect(entry) {
    if (entry.provider === 'remotive') return { url: buildApiUrl(entry) };
    const url = entry.careers_url || '';
    return /(^|\.)remotive\.com/i.test(url) ? { url: buildApiUrl(entry) } : null;
  },

  async fetch(entry, ctx) {
    const apiUrl = buildApiUrl(entry);
    assertRemotiveUrl(apiUrl);
    const json = /** @type {any} */ (await ctx.fetchJson(apiUrl, { redirect: 'error' }));
    const jobs = Array.isArray(json?.jobs) ? json.jobs : [];
    return jobs
      .filter(/** @param {any} j */ (j) => j && j.url && j.title)
      .map(/** @param {any} j */ (j) => ({
        title: j.title || '',
        url: j.url,
        company: j.company_name || '',
        location: j.candidate_required_location || 'Remote',
        postedAt: toEpochMs(j.publication_date),
      }));
  },
};
