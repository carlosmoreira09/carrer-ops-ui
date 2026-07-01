import Link from "next/link";
import { notFound } from "next/navigation";
import { listReports, readReportFile } from "@/lib/parse/reports";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const reports = await listReports();
  const meta = reports.find((r) => Number(r.number) === Number(num));
  if (!meta) notFound();

  const md = await readReportFile(meta.file);
  if (md == null) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <Link href="/reports" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
          ← Reports
        </Link>
        <div className="flex items-center gap-2">
          {meta.url && (
            <a href={meta.url} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
              Open posting ↗
            </a>
          )}
          <span className="chip font-mono">#{meta.number}</span>
        </div>
      </div>
      <div className="panel p-7">
        <Markdown>{md}</Markdown>
      </div>
    </div>
  );
}
