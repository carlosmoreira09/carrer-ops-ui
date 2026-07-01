"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Artifact } from "@/lib/types";
import { fmtBytes, timeAgo } from "@/lib/ui";
import { JobConsole } from "@/components/JobConsole";

const KIND_LABEL: Record<Artifact["kind"], string> = {
  cv: "CV",
  cover: "Cover letter",
  other: "File",
};
const KIND_COLOR: Record<Artifact["kind"], string> = {
  cv: "var(--color-info)",
  cover: "var(--color-accent)",
  other: "var(--color-muted)",
};

export function ArtifactsPanel({
  artifacts,
  htmls,
}: {
  artifacts: Artifact[];
  htmls: string[];
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(artifacts[0]?.name ?? null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function genPdf(html: string) {
    setJobId(null);
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "PDF generation failed");
    setJobId(data.jobId);
  }

  return (
    <div className="space-y-5">
      {htmls.length > 0 && (
        <div className="panel p-4">
          <div className="label mb-2">Generate PDF from HTML</div>
          <div className="flex flex-wrap gap-2">
            {htmls.map((h) => (
              <button key={h} className="btn text-xs" onClick={() => genPdf(h)}>
                ⬦ {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {jobId && (
        <JobConsole
          jobId={jobId}
          onDone={(status) => {
            if (status === "done") router.refresh();
          }}
        />
      )}

      <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-4">
        <div className="space-y-2">
          {artifacts.length === 0 && (
            <div className="panel px-4 py-10 text-center text-sm text-[var(--color-faint)]">
              No PDFs in output/ yet.
            </div>
          )}
          {artifacts.map((art) => (
            <div
              key={art.name}
              className={`panel panel-hover p-3 cursor-pointer transition-colors ${
                preview === art.name ? "border-[var(--color-accent)]!" : ""
              }`}
              onClick={() => setPreview(art.name)}
              style={preview === art.name ? { borderColor: "var(--color-accent)" } : undefined}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="chip" style={{ color: KIND_COLOR[art.kind] }}>
                  {KIND_LABEL[art.kind]}
                </span>
                <span className="text-[0.68rem] text-[var(--color-faint)] ml-auto">
                  {timeAgo(art.mtime)}
                </span>
              </div>
              <div className="text-xs font-medium break-all leading-snug">{art.name}</div>
              <div className="flex items-center gap-3 mt-2 text-[0.68rem] text-[var(--color-faint)]">
                <span>{fmtBytes(art.size)}</span>
                <a
                  href={`/api/artifacts/${encodeURIComponent(art.name)}`}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="text-[var(--color-accent)]"
                >
                  download
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="panel overflow-hidden min-h-[600px]">
          {preview ? (
            <iframe
              key={preview}
              src={`/api/artifacts/${encodeURIComponent(preview)}`}
              className="w-full h-[80vh] bg-white"
              title={preview}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--color-faint)]">
              Select a PDF to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
