"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScanRow } from "@/lib/types";
import { JobConsole } from "@/components/JobConsole";

export function ScanPanel({ rows }: { rows: ScanRow[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [query, setQuery] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query) return rows.slice(0, 200);
    const q = query.toLowerCase();
    return rows
      .filter(
        (r) =>
          r.company.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      )
      .slice(0, 200);
  }, [rows, query]);

  async function runScan() {
    setRunning(true);
    setJobId(null);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company ? { company } : {}),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Scan failed");
      setRunning(false);
      return;
    }
    setJobId(data.jobId);
  }

  async function pushToPipeline(r: ScanRow) {
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", url: r.url, company: r.company, role: r.title }),
    });
    setAdded((prev) => new Set(prev).add(r.url));
  }

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="input max-w-[16rem]"
            placeholder="Company (optional — blank = all portals)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <button className="btn btn-accent" onClick={runScan} disabled={running && !jobId}>
            ⧉ Run scan
          </button>
          <span className="text-xs text-[var(--color-faint)]">
            Hits Greenhouse / Ashby / Lever APIs directly — zero LLM cost.
          </span>
        </div>
      </div>

      {jobId !== null || running ? (
        <JobConsole
          jobId={jobId}
          onDone={(status) => {
            setRunning(false);
            if (status === "done") router.refresh();
          }}
        />
      ) : null}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="label">Scan history</div>
          <input
            className="input max-w-[16rem]"
            placeholder="Filter company, title, location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--color-border-soft)] text-[var(--color-faint)]">
                <th className="px-3 py-2.5 font-medium">Seen</th>
                <th className="px-3 py-2.5 font-medium">Company</th>
                <th className="px-3 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Location</th>
                <th className="px-3 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.url}
                  className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-panel-2)]"
                >
                  <td className="px-3 py-2 font-mono text-xs text-[var(--color-faint)] whitespace-nowrap">
                    {r.firstSeen}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{r.company}</td>
                  <td className="px-3 py-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--color-info)]"
                    >
                      {r.title}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--color-muted)] whitespace-nowrap">
                    {r.location}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {added.has(r.url) ? (
                      <span className="text-xs text-[var(--color-good)]">✓ added</span>
                    ) : (
                      <button className="btn btn-ghost text-xs" onClick={() => pushToPipeline(r)}>
                        + pipeline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-faint)]">
              No matching jobs.
            </div>
          )}
        </div>
        {rows.length > 200 && !query && (
          <div className="text-xs text-[var(--color-faint)] mt-2 text-center">
            Showing 200 of {rows.length}. Use the filter to narrow.
          </div>
        )}
      </div>
    </div>
  );
}
