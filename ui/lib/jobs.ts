import { spawn } from "node:child_process";
import { PROJECT_ROOT } from "@/lib/paths";
import type { Job, JobKind } from "@/lib/types";

type Registry = {
  jobs: Map<string, Job>;
  seq: number;
  listeners: Map<string, Set<(line: string) => void>>;
};

// Survive Next.js dev HMR by stashing on globalThis.
const g = globalThis as unknown as { __careerOpsJobs?: Registry };
const reg: Registry =
  g.__careerOpsJobs ??
  (g.__careerOpsJobs = { jobs: new Map(), seq: 0, listeners: new Map() });

function emit(id: string, line: string) {
  const job = reg.jobs.get(id);
  if (job) job.logs.push(line);
  const ls = reg.listeners.get(id);
  if (ls) for (const fn of ls) fn(line);
}

export function getJob(id: string): Job | undefined {
  return reg.jobs.get(id);
}

export function listJobs(): Job[] {
  return [...reg.jobs.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function subscribe(id: string, fn: (line: string) => void): () => void {
  let set = reg.listeners.get(id);
  if (!set) reg.listeners.set(id, (set = new Set()));
  set.add(fn);
  return () => set!.delete(fn);
}

/**
 * Spawn `node <script> ...args` from the project root, streaming stdout/stderr
 * into a Job. Returns the job id immediately.
 */
export function runNodeScript(
  kind: JobKind,
  label: string,
  script: string,
  args: string[] = [],
  extraEnv: Record<string, string> = {}
): string {
  const id = `job_${Date.now()}_${++reg.seq}`;
  const job: Job = {
    id,
    kind,
    label,
    status: "running",
    startedAt: Date.now(),
    logs: [],
  };
  reg.jobs.set(id, job);

  const child = spawn("node", [script, ...args], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...extraEnv },
  });

  const onData = (buf: Buffer) => {
    for (const line of buf.toString().split("\n")) {
      if (line.length) emit(id, line);
    }
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  child.on("error", (err) => {
    emit(id, `ERROR: ${err.message}`);
    job.status = "error";
    job.endedAt = Date.now();
    emit(id, "__END__");
  });

  child.on("close", (code) => {
    job.exitCode = code ?? -1;
    job.status = code === 0 ? "done" : "error";
    job.endedAt = Date.now();
    emit(id, `\n[exit ${code}]`);
    emit(id, "__END__");
  });

  return id;
}
