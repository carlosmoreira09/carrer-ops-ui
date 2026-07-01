"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineItem } from "@/lib/types";
import { JobConsole } from "@/components/JobConsole";

export function PipelinePanel({
  items,
  hasKey,
  model,
}: {
  items: PipelineItem[];
  hasKey: boolean;
  model: string;
}) {
  const router = useRouter();
  const [newUrl, setNewUrl] = useState("");
  const [jd, setJd] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobLabel, setJobLabel] = useState("");

  async function addUrl() {
    const url = newUrl.trim();
    if (!url) return;
    // Accept "url | company | role" too.
    const [u, company, role] = url.split("|").map((s) => s.trim());
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", url: u, company, role }),
    });
    setNewUrl("");
    router.refresh();
  }

  async function pipelineAction(action: string, url: string, done?: boolean) {
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, url, done }),
    });
    router.refresh();
  }

  async function evaluate(payload: { url?: string; jd?: string; label: string }) {
    if (!hasKey) {
      alert("OPENAI_API_KEY not set. Configure it in Settings.");
      return;
    }
    setJobLabel(payload.label);
    setJobId(null);
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, model }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Evaluate failed");
      return;
    }
    setJobId(data.jobId);
  }

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <div className="space-y-5">
      {/* Add + ad-hoc evaluate */}
      <div className="panel p-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Paste job URL   (or  url | Company | Role)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
          />
          <button className="btn" onClick={addUrl}>
            + Add
          </button>
          <button className="btn btn-ghost" onClick={() => setShowJd((s) => !s)}>
            Paste JD
          </button>
        </div>
        {showJd && (
          <div className="space-y-2">
            <textarea
              className="input font-mono text-xs"
              rows={6}
              placeholder="Paste full job description text here to evaluate directly…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <button
              className="btn btn-accent"
              disabled={jd.trim().length < 80}
              onClick={() => evaluate({ jd, label: "pasted JD" })}
            >
              ⚡ Evaluate pasted JD
            </button>
          </div>
        )}
      </div>

      {jobId !== null || jobLabel ? (
        <div className="space-y-2">
          <div className="text-sm text-[var(--color-muted)]">
            Evaluating: <span className="text-[var(--color-text)]">{jobLabel}</span>
          </div>
          <JobConsole
            jobId={jobId}
            onDone={(status) => {
              if (status === "done") router.refresh();
            }}
          />
        </div>
      ) : null}

      {/* Pending */}
      <div>
        <div className="label mb-2">Pending ({pending.length})</div>
        <div className="panel divide-y divide-[var(--color-border-soft)]">
          {pending.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-faint)]">
              Inbox empty. Add a URL above or push jobs from Scan.
            </div>
          )}
          {pending.map((item) => (
            <PipelineRow
              key={item.url}
              item={item}
              onEvaluate={() =>
                evaluate({
                  url: item.url,
                  label: `${item.company || item.url} — ${item.role}`,
                })
              }
              onRemove={() => pipelineAction("remove", item.url)}
              onDone={() => pipelineAction("toggle", item.url, true)}
            />
          ))}
        </div>
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <div className="label mb-2">Evaluated ({done.length})</div>
          <div className="panel divide-y divide-[var(--color-border-soft)] opacity-70">
            {done.map((item) => (
              <div key={item.url} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-[var(--color-good)]">✓</span>
                <span className="flex-1 truncate">
                  <span className="font-medium">{item.company || "—"}</span>
                  <span className="text-[var(--color-faint)]"> · {item.role}</span>
                </span>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => pipelineAction("toggle", item.url, false)}
                >
                  reopen
                </button>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => pipelineAction("remove", item.url)}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineRow({
  item,
  onEvaluate,
  onRemove,
  onDone,
}: {
  item: PipelineItem;
  onEvaluate: () => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {item.company || <span className="text-[var(--color-faint)]">Unknown company</span>}
          {item.role && <span className="text-[var(--color-faint)] font-normal"> · {item.role}</span>}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-[0.7rem] text-[var(--color-faint)] hover:text-[var(--color-info)] truncate block"
        >
          {item.url}
        </a>
      </div>
      <button className="btn btn-accent" onClick={onEvaluate}>
        ⚡ Evaluate
      </button>
      <button className="btn btn-ghost text-xs" onClick={onDone} title="Mark evaluated">
        ✓
      </button>
      <button className="btn btn-ghost text-xs" onClick={onRemove} title="Remove">
        ✕
      </button>
    </div>
  );
}
