import { readFile } from "node:fs/promises";
import { paths } from "@/lib/paths";
import type { Application } from "@/lib/types";

function splitRow(line: string): string[] {
  // Trim the leading/trailing pipe then split. Cells don't contain raw pipes.
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function parseReportCell(cell: string): { number: string | null; path: string | null } {
  const m = cell.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return { number: null, path: null };
  return { number: m[1], path: m[2] };
}

export function parseApplicationsMarkdown(md: string): Application[] {
  const lines = md.split("\n");
  const apps: Application[] = [];
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitRow(line);
    if (cells.length < 9) continue;
    const first = cells[0].toLowerCase();
    if (first === "#" || /^-+$/.test(cells[0])) continue; // header / separator
    const num = parseInt(cells[0], 10);
    if (Number.isNaN(num)) continue;

    const scoreRaw = cells[4];
    const scoreMatch = scoreRaw.match(/([\d.]+)/);
    const { number: reportNumber, path: reportPath } = parseReportCell(cells[7]);

    apps.push({
      number: num,
      date: cells[1],
      company: cells[2],
      role: cells[3],
      scoreRaw,
      score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
      status: cells[5],
      hasPdf: cells[6].includes("✅"),
      reportNumber,
      reportPath,
      notes: cells[8],
    });
  }
  return apps;
}

export async function readApplications(): Promise<Application[]> {
  try {
    const md = await readFile(paths.applications, "utf8");
    return parseApplicationsMarkdown(md);
  } catch {
    return [];
  }
}
