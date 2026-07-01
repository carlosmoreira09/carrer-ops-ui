import type { Application, Analytics } from "@/lib/types";

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "unknown";
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const REACHED: Record<string, number> = {
  Evaluated: 0,
  SKIP: 0,
  Discarded: 0,
  Rejected: 1, // was at least applied in most cases; count toward applied
  Applied: 1,
  Responded: 2,
  Interview: 3,
  Offer: 4,
};

export function computeAnalytics(apps: Application[]): Analytics {
  const byStatus: Record<string, number> = {};
  let scoreSum = 0;
  let scoreCount = 0;
  let topScore = 0;
  let withPdf = 0;

  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    if (a.score != null) {
      scoreSum += a.score;
      scoreCount++;
      if (a.score > topScore) topScore = a.score;
    }
    if (a.hasPdf) withPdf++;
  }

  const reachedAtLeast = (n: number) =>
    apps.filter((a) => (REACHED[a.status] ?? 0) >= n).length;

  const applied = reachedAtLeast(1);
  const responded = reachedAtLeast(2);
  const interview = reachedAtLeast(3);
  const offer = reachedAtLeast(4);
  const total = apps.length;

  const funnelRaw = [
    { label: "Evaluated", count: total },
    { label: "Applied", count: applied },
    { label: "Responded", count: responded },
    { label: "Interview", count: interview },
    { label: "Offer", count: offer },
  ];
  const funnel = funnelRaw.map((s) => ({
    ...s,
    pct: total > 0 ? Math.round((s.count / total) * 100) : 0,
  }));

  const buckets = [
    { label: "4.5–5.0", lo: 4.5, hi: 5.01 },
    { label: "4.0–4.4", lo: 4.0, hi: 4.5 },
    { label: "3.5–3.9", lo: 3.5, hi: 4.0 },
    { label: "3.0–3.4", lo: 3.0, hi: 3.5 },
    { label: "<3.0", lo: -1, hi: 3.0 },
  ];
  const scoreBuckets = buckets.map((b) => ({
    label: b.label,
    count: apps.filter((a) => a.score != null && a.score >= b.lo && a.score < b.hi).length,
  }));

  const weekMap = new Map<string, number>();
  for (const a of apps) {
    const w = isoWeek(a.date);
    weekMap.set(w, (weekMap.get(w) ?? 0) + 1);
  }
  const weekly = [...weekMap.entries()]
    .filter(([w]) => w !== "unknown")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({ week, count }));

  const inactive = new Set(["SKIP", "Rejected", "Discarded"]);
  const activeApps = apps.filter((a) => !inactive.has(a.status)).length;

  return {
    total,
    byStatus,
    avgScore: scoreCount > 0 ? scoreSum / scoreCount : 0,
    topScore,
    withPdf,
    funnel,
    scoreBuckets,
    weekly,
    responseRate: applied > 0 ? responded / applied : 0,
    interviewRate: applied > 0 ? interview / applied : 0,
    offerRate: applied > 0 ? offer / applied : 0,
    activeApps,
  };
}
