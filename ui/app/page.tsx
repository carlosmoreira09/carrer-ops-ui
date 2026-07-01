import { readApplications } from "@/lib/parse/applications";
import { computeAnalytics } from "@/lib/parse/analytics";
import { listReports } from "@/lib/parse/reports";
import { PageHeader, StatCard, Bar } from "@/components/primitives";
import { scoreColor, statusColor } from "@/lib/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const apps = await readApplications();
  const a = computeAnalytics(apps);
  const reports = await listReports();

  const maxWeek = Math.max(1, ...a.weekly.map((w) => w.count));
  const maxBucket = Math.max(1, ...a.scoreBuckets.map((b) => b.count));
  const recent = [...apps].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your job search at a glance — computed live from data/applications.md"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Applications" value={a.total} hint={`${a.activeApps} active`} />
        <StatCard
          label="Avg score"
          value={a.avgScore ? a.avgScore.toFixed(2) : "—"}
          hint={`top ${a.topScore ? a.topScore.toFixed(1) : "—"}`}
          accent={scoreColor(a.avgScore || null)}
        />
        <StatCard label="Reports" value={reports.length} hint={`${a.withPdf} with PDF`} />
        <StatCard
          label="Response rate"
          value={`${Math.round(a.responseRate * 100)}%`}
          hint={`interview ${Math.round(a.interviewRate * 100)}%`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="panel p-5">
          <div className="label mb-4">Funnel</div>
          <div className="space-y-3">
            {a.funnel.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-muted)]">{s.label}</span>
                  <span className="font-mono">
                    {s.count}
                    <span className="text-[var(--color-faint)]"> · {s.pct}%</span>
                  </span>
                </div>
                <Bar value={s.count} max={a.total || 1} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="label mb-4">Score distribution</div>
          <div className="space-y-3">
            {a.scoreBuckets.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-muted)] font-mono">{b.label}</span>
                  <span className="font-mono">{b.count}</span>
                </div>
                <Bar
                  value={b.count}
                  max={maxBucket}
                  color={
                    b.label.startsWith("4")
                      ? "var(--color-good)"
                      : b.label.startsWith("3")
                      ? "var(--color-mid)"
                      : "var(--color-low)"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-5">
          <div className="label mb-4">Weekly activity</div>
          {a.weekly.length === 0 ? (
            <div className="text-sm text-[var(--color-faint)]">No dated entries yet.</div>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {a.weekly.slice(-16).map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t bg-[var(--color-accent-dim)] group-hover:bg-[var(--color-accent)] transition-colors"
                    style={{ height: `${(w.count / maxWeek) * 100}%`, minHeight: "3px" }}
                    title={`${w.week}: ${w.count}`}
                  />
                  <span className="text-[0.58rem] text-[var(--color-faint)] truncate w-full text-center">
                    {w.week.split("-W")[1]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="label">Recent</div>
            <Link href="/tracker" className="text-[0.72rem] text-[var(--color-accent)]">
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {recent.map((app) => (
              <div key={app.number} className="flex items-center gap-3 py-1.5 text-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: statusColor(app.status) }}
                />
                <span className="flex-1 truncate">
                  <span className="font-medium">{app.company}</span>
                  <span className="text-[var(--color-faint)]"> · {app.role}</span>
                </span>
                <span className="font-mono text-xs" style={{ color: scoreColor(app.score) }}>
                  {app.scoreRaw}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
