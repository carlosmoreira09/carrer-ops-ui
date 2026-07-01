import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_REDIRECTS = 3;

/**
 * Best-effort fetch of a job description as plain text from a URL.
 * Hardened against SSRF: only http/https, DNS-resolved host must be a public
 * IP (no loopback / private / link-local / unique-local ranges), redirects are
 * followed manually and re-validated, response size and content-type are capped.
 */
export async function fetchJdText(url: string): Promise<string> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHttpUrl(current);

    const res = await fetch(current, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
      redirect: "manual",
    });

    // Handle redirects ourselves so each hop's target is re-validated.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`Redirect without Location (${res.status})`);
      if (hop === MAX_REDIRECTS) throw new Error("Too many redirects");
      current = new URL(loc, current).toString();
      continue;
    }

    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);

    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    if (ctype && !/text\/html|text\/plain|application\/xhtml\+xml/.test(ctype)) {
      throw new Error(`Unsupported content-type: ${ctype.split(";")[0]}`);
    }

    const html = await readCapped(res, MAX_BYTES);
    return htmlToText(html);
  }

  throw new Error("Too many redirects");
}

/** Reject anything that isn't http/https pointing at a public IP. */
async function assertPublicHttpUrl(raw: string): Promise<void> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  const host = u.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  const candidates: string[] = [];
  if (net.isIP(host)) {
    candidates.push(host);
  } else {
    const results = await lookup(host, { all: true }).catch(() => {
      throw new Error(`Cannot resolve host: ${host}`);
    });
    for (const r of results) candidates.push(r.address);
  }
  if (candidates.length === 0) throw new Error(`Cannot resolve host: ${host}`);
  for (const ip of candidates) {
    if (isBlockedIp(ip)) {
      throw new Error("URL resolves to a non-public address (blocked)");
    }
  }
}

function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isBlockedV4(ip);
  if (v === 6) return isBlockedV6(ip);
  return true; // unknown → block
}

function isBlockedV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 127) return true; // this-host / loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true; // unspecified / loopback
  // IPv4-mapped (::ffff:a.b.c.d) — classify the embedded v4.
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  if (lower.startsWith("fe80")) return true; // link-local
  const first = parseInt(lower.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // unique-local fc00::/7
  return false;
}

/** Read a response body, aborting if it exceeds maxBytes. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const lenHeader = res.headers.get("content-length");
  if (lenHeader && Number(lenHeader) > maxBytes) {
    throw new Error("Response too large");
  }
  if (!res.body) return await res.text();

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error("Response too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}
