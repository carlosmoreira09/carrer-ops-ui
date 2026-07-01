"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  jobId: string | null;
  onDone?: (status: string, exitCode?: number) => void;
};

export function JobConsole({ jobId, onDone }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error" | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!jobId) {
      setLines([]);
      setStatus(null);
      return;
    }
    setLines([]);
    setStatus("running");
    const es = new EventSource(`/api/jobs/${jobId}`);

    es.addEventListener("log", (e) => {
      setLines((prev) => [...prev, (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) : ""]);
    });
    es.addEventListener("end", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      const st = payload.exitCode === 0 ? "done" : "error";
      setStatus(st);
      doneRef.current?.(st, payload.exitCode);
      es.close();
    });
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [jobId]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [lines]);

  if (!jobId) return null;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-soft)]">
        <span className="label">Job output</span>
        <span
          className="chip"
          style={{
            color:
              status === "running"
                ? "var(--color-info)"
                : status === "done"
                ? "var(--color-good)"
                : "var(--color-low)",
          }}
        >
          {status === "running" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-info)] animate-pulse" />
          )}
          {status}
        </span>
      </div>
      <div
        ref={boxRef}
        className="font-mono text-[0.74rem] leading-relaxed p-4 max-h-80 overflow-y-auto whitespace-pre-wrap text-[var(--color-muted)]"
      >
        {lines.length === 0 ? (
          <span className="text-[var(--color-faint)]">Starting…</span>
        ) : (
          lines.map((l, i) => <div key={i}>{l || " "}</div>)
        )}
      </div>
    </div>
  );
}
