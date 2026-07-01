"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Application } from "@/lib/types";
import { CANONICAL_STATUSES } from "@/lib/types";
import { scoreColor, statusColor } from "@/lib/ui";

type SortKey = "number" | "date" | "company" | "score" | "status";

export function TrackerTable({ apps }: { apps: Application[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [editing, setEditing] = useState<number | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let rows = apps;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.notes.toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter((a) => a.status === statusFilter);
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "number":
          cmp = a.number - b.number;
          break;
        case "score":
          cmp = (a.score ?? -1) - (b.score ?? -1);
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        default:
          cmp = a.date.localeCompare(b.date);
      }
      return cmp * dir;
    });
    return sorted;
  }, [apps, query, statusFilter, sort, dir]);

  async function patch(number: number, body: { status?: string; notes?: string }) {
    setBusy(number);
    try {
      const res = await fetch("/api/tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, ...body }),
      });
      if (!res.ok) alert((await res.json()).error || "Update failed");
      else router.refresh();
    } finally {
      setBusy(null);
      setEditing(null);
    }
  }

  function toggleSort(key: SortKey) {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(-1);
    }
  }

  const arrow = (k: SortKey) => (sort === k ? (dir === 1 ? " ↑" : " ↓") : "");

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search company, role, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[10rem]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {CANONICAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="chip self-center">{filtered.length} shown</span>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--color-border-soft)] text-[var(--color-faint)]">
              <th className="px-3 py-2.5 font-medium cursor-pointer" onClick={() => toggleSort("number")}>
                #{arrow("number")}
              </th>
              <th className="px-3 py-2.5 font-medium cursor-pointer" onClick={() => toggleSort("date")}>
                Date{arrow("date")}
              </th>
              <th className="px-3 py-2.5 font-medium cursor-pointer" onClick={() => toggleSort("company")}>
                Company / Role{arrow("company")}
              </th>
              <th className="px-3 py-2.5 font-medium cursor-pointer" onClick={() => toggleSort("score")}>
                Score{arrow("score")}
              </th>
              <th className="px-3 py-2.5 font-medium cursor-pointer" onClick={() => toggleSort("status")}>
                Status{arrow("status")}
              </th>
              <th className="px-3 py-2.5 font-medium">Notes</th>
              <th className="px-3 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr
                key={app.number}
                className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-panel-2)] align-top"
                style={busy === app.number ? { opacity: 0.5 } : undefined}
              >
                <td className="px-3 py-2.5 font-mono text-[var(--color-faint)]">{app.number}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-muted)] whitespace-nowrap">
                  {app.date}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{app.company}</div>
                  <div className="text-[var(--color-faint)] text-xs">{app.role}</div>
                </td>
                <td className="px-3 py-2.5 font-mono" style={{ color: scoreColor(app.score) }}>
                  {app.scoreRaw}
                </td>
                <td className="px-3 py-2.5">
                  <select
                    className="bg-transparent border border-[var(--color-border)] rounded px-1.5 py-1 text-xs"
                    style={{ color: statusColor(app.status) }}
                    value={app.status}
                    onChange={(e) => patch(app.number, { status: e.target.value })}
                  >
                    {CANONICAL_STATUSES.map((s) => (
                      <option key={s} value={s} style={{ color: "#e7ecef", background: "#161c20" }}>
                        {s}
                      </option>
                    ))}
                    {!CANONICAL_STATUSES.includes(app.status as never) && (
                      <option value={app.status}>{app.status}</option>
                    )}
                  </select>
                </td>
                <td className="px-3 py-2.5 max-w-sm">
                  {editing === app.number ? (
                    <div className="flex flex-col gap-1.5">
                      <textarea
                        className="input text-xs"
                        rows={3}
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button className="btn btn-accent" onClick={() => patch(app.number, { notes: draftNotes })}>
                          Save
                        </button>
                        <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-[var(--color-muted)] line-clamp-3 cursor-text hover:text-[var(--color-text)]"
                      onClick={() => {
                        setEditing(app.number);
                        setDraftNotes(app.notes);
                      }}
                      title="Click to edit"
                    >
                      {app.notes || <span className="text-[var(--color-faint)]">—</span>}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-right">
                  {app.reportNumber && (
                    <Link
                      href={`/reports/${app.reportNumber}`}
                      className="text-[var(--color-accent)] text-xs"
                    >
                      report
                    </Link>
                  )}
                  {app.hasPdf && <span className="ml-2 text-xs" title="Has PDF">📄</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-[var(--color-faint)]">
            No applications match.
          </div>
        )}
      </div>
    </div>
  );
}
