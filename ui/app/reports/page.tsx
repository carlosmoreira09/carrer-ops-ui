import Link from "next/link";
import { listReports } from "@/lib/parse/reports";
import { PageHeader } from "@/components/primitives";
import { scoreColor } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  return (
    <div>
      <PageHeader title="Reports" subtitle={`${reports.length} evaluation reports`} />
      <div className="grid md:grid-cols-2 gap-3">
        {reports.map((r) => (
          <Link
            key={r.file}
            href={`/reports/${r.number}`}
            className="panel panel-hover p-4 block transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.company || r.slug}</div>
                <div className="text-xs text-[var(--color-faint)] truncate">{r.role}</div>
              </div>
              <div
                className="font-mono text-lg font-semibold shrink-0"
                style={{ color: scoreColor(r.score) }}
              >
                {r.scoreRaw || "—"}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[0.68rem]">
              <span className="chip font-mono">#{r.number}</span>
              <span className="chip">{r.date}</span>
              {r.legitimacy && <span className="chip">{r.legitimacy}</span>}
            </div>
          </Link>
        ))}
      </div>
      {reports.length === 0 && (
        <div className="panel px-6 py-12 text-center text-sm text-[var(--color-muted)]">
          No reports yet. Evaluate a job from the Pipeline.
        </div>
      )}
    </div>
  );
}
