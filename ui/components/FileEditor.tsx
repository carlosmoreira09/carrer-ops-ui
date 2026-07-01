"use client";

import { useState } from "react";
import type { UserFileKey } from "@/lib/write/files";

type FileTab = {
  key: UserFileKey;
  label: string;
  lang: string;
  content: string;
};

export function FileEditor({ files }: { files: FileTab[] }) {
  const [active, setActive] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(files.map((f) => [f.key, f.content]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[active];
  const dirty = drafts[file.key] !== file.content && !saved[file.key];

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?key=${file.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: drafts[file.key] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
      } else {
        setSaved((s) => ({ ...s, [file.key]: true }));
        setTimeout(() => setSaved((s) => ({ ...s, [file.key]: false })), 2000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-[var(--color-border-soft)]">
        {files.map((f, i) => (
          <button
            key={f.key}
            onClick={() => setActive(i)}
            className={`px-3 py-2 text-sm rounded-t-lg font-mono transition-colors ${
              i === active
                ? "bg-[var(--color-panel-2)] text-[var(--color-text)]"
                : "text-[var(--color-faint)] hover:text-[var(--color-muted)]"
            }`}
          >
            {f.label}
            {drafts[f.key] !== f.content && !saved[f.key] && (
              <span className="ml-1.5 text-[var(--color-mid)]">•</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-2">
          {saved[file.key] && <span className="text-xs text-[var(--color-good)]">saved ✓</span>}
          <button className="btn btn-accent" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-[var(--color-low)] border-b border-[var(--color-border-soft)] bg-[#1a1113]">
          {error}
        </div>
      )}

      <textarea
        className="w-full h-[68vh] bg-[#0c1013] p-4 font-mono text-[0.8rem] leading-relaxed outline-none resize-none text-[var(--color-text)]"
        spellCheck={false}
        value={drafts[file.key]}
        onChange={(e) => setDrafts((d) => ({ ...d, [file.key]: e.target.value }))}
      />
    </div>
  );
}
