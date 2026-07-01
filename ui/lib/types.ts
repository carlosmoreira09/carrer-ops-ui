export type Application = {
  number: number;
  date: string;
  company: string;
  role: string;
  score: number | null;
  scoreRaw: string;
  status: string;
  hasPdf: boolean;
  reportNumber: string | null;
  reportPath: string | null;
  notes: string;
};

export type PipelineItem = {
  url: string;
  company: string;
  role: string;
  done: boolean;
  raw: string; // original line
};

export type ScanRow = {
  url: string;
  firstSeen: string;
  portal: string;
  title: string;
  company: string;
  status: string;
  location: string;
};

export type ReportMeta = {
  number: string;
  slug: string;
  date: string;
  file: string; // filename only
  company: string;
  role: string;
  score: number | null;
  scoreRaw: string;
  legitimacy: string;
  url: string;
  archetype: string;
};

export type Artifact = {
  name: string;
  kind: "cv" | "cover" | "other";
  size: number;
  mtime: string;
};

export type Analytics = {
  total: number;
  byStatus: Record<string, number>;
  avgScore: number;
  topScore: number;
  withPdf: number;
  funnel: { label: string; count: number; pct: number }[];
  scoreBuckets: { label: string; count: number }[];
  weekly: { week: string; count: number }[];
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  activeApps: number;
};

export type JobKind = "scan" | "evaluate" | "pdf" | "cover" | "doctor" | "merge";

export type JobStatus = "running" | "done" | "error";

export type Job = {
  id: string;
  kind: JobKind;
  label: string;
  status: JobStatus;
  startedAt: number;
  endedAt?: number;
  exitCode?: number;
  logs: string[];
};

export const CANONICAL_STATUSES = [
  "Evaluated",
  "Applied",
  "Responded",
  "Interview",
  "Offer",
  "Rejected",
  "Discarded",
  "SKIP",
] as const;
