export function scoreColor(score: number | null): string {
  if (score == null) return "var(--color-faint)";
  if (score >= 4.0) return "var(--color-good)";
  if (score >= 3.0) return "var(--color-mid)";
  return "var(--color-low)";
}

const STATUS_COLORS: Record<string, string> = {
  Evaluated: "#8a969e",
  Applied: "#60a5fa",
  Responded: "#a78bfa",
  Interview: "#fbbf24",
  Offer: "#34d399",
  Rejected: "#f87171",
  Discarded: "#5a666d",
  SKIP: "#5a666d",
};

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "#8a969e";
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
