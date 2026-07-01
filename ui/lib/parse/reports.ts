import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { paths, isInside } from "@/lib/paths";
import type { ReportMeta } from "@/lib/types";

function field(md: string, label: string): string {
  const re = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

/** Parse the header block of a report file into metadata. */
export function parseReportHeader(md: string, file: string): ReportMeta {
  const nameMatch = file.match(/^(\d+)-(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
  const number = nameMatch ? nameMatch[1] : "";
  const slug = nameMatch ? nameMatch[2] : file.replace(/\.md$/, "");
  const dateFromName = nameMatch ? nameMatch[3] : "";

  const titleLine = md.split("\n").find((l) => l.startsWith("# ")) ?? "";
  const title = titleLine.replace(/^#\s*/, "").replace(/^Evaluation:\s*/i, "");
  const [company, role] = title.split(/\s+[—-]\s+/, 2);

  const scoreRaw = field(md, "Score");
  const scoreMatch = scoreRaw.match(/([\d.]+)/);

  return {
    number,
    slug,
    date: field(md, "Date") || dateFromName,
    file,
    company: (company || "").trim(),
    role: (role || "").trim(),
    scoreRaw,
    score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
    legitimacy: field(md, "Legitimacy"),
    url: field(md, "URL"),
    archetype: field(md, "Archetype"),
  };
}

export async function listReports(): Promise<ReportMeta[]> {
  let files: string[];
  try {
    files = (await readdir(paths.reportsDir)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const metas = await Promise.all(
    files.map(async (file) => {
      try {
        const md = await readFile(path.join(paths.reportsDir, file), "utf8");
        return parseReportHeader(md, file);
      } catch {
        return null;
      }
    })
  );
  return metas
    .filter((m): m is ReportMeta => m !== null)
    .sort((a, b) => Number(b.number) - Number(a.number));
}

/** Read a single report's raw markdown by filename (guarded). */
export async function readReportFile(file: string): Promise<string | null> {
  const target = path.join(paths.reportsDir, path.basename(file));
  if (!isInside(paths.reportsDir, target)) return null;
  try {
    return await readFile(target, "utf8");
  } catch {
    return null;
  }
}
