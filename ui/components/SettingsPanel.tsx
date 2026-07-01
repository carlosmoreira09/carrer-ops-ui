"use client";

import { useState } from "react";
import type { EnvStatus } from "@/lib/settings";
import { JobConsole } from "@/components/JobConsole";

function KeyRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-soft)] last:border-0">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className="chip" style={{ color: ok ? "var(--color-good)" : "var(--color-low)" }}>
        {ok ? "● set" : "○ missing"}
      </span>
    </div>
  );
}

export function SettingsPanel({ env, root }: { env: EnvStatus; root: string }) {
  const [jobId, setJobId] = useState<string | null>(null);

  async function runDoctor() {
    setJobId(null);
    const res = await fetch("/api/doctor", { method: "POST" });
    const data = await res.json();
    setJobId(data.jobId);
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="panel p-5">
        <div className="label mb-3">AI provider</div>
        <div className="space-y-1">
          <div className="flex justify-between py-2 border-b border-[var(--color-border-soft)]">
            <span className="text-sm text-[var(--color-muted)]">Provider</span>
            <span className="font-mono text-sm">{env.provider}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--color-border-soft)]">
            <span className="text-sm text-[var(--color-muted)]">OpenAI model</span>
            <span className="font-mono text-sm">{env.openaiModel}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-[var(--color-muted)]">Gemini model</span>
            <span className="font-mono text-sm">{env.geminiModel}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--color-faint)] mt-3 leading-relaxed">
          Change provider/model/keys by editing <code className="font-mono">.env</code> at the
          project root, then reload. If a model id returns 404, it isn&apos;t enabled for your
          account — use e.g. <code className="font-mono">gpt-4o-mini</code> or{" "}
          <code className="font-mono">gpt-4o</code>.
        </p>
      </div>

      <div className="panel p-5">
        <div className="label mb-3">Environment</div>
        <KeyRow label=".env file present" ok={env.hasEnvFile} />
        <KeyRow label="OPENAI_API_KEY" ok={env.hasOpenAIKey} />
        <KeyRow label="GEMINI_API_KEY" ok={env.hasGeminiKey} />
        <div className="text-[0.68rem] text-[var(--color-faint)] mt-3 break-all font-mono">
          root: {root}
        </div>
      </div>

      <div className="panel p-5 md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div className="label">System health</div>
          <button className="btn" onClick={runDoctor}>
            Run doctor
          </button>
        </div>
        {jobId ? (
          <JobConsole jobId={jobId} />
        ) : (
          <p className="text-sm text-[var(--color-faint)]">
            Runs <code className="font-mono">doctor.mjs</code> to check prerequisites (cv.md,
            profile.yml, portals.yml).
          </p>
        )}
      </div>
    </div>
  );
}
