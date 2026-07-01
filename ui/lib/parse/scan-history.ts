import { readFile } from "node:fs/promises";
import { paths } from "@/lib/paths";
import type { ScanRow } from "@/lib/types";

export function parseScanHistory(tsv: string): ScanRow[] {
  const lines = tsv.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iUrl = idx("url");
  const iSeen = idx("first_seen");
  const iPortal = idx("portal");
  const iTitle = idx("title");
  const iCompany = idx("company");
  const iStatus = idx("status");
  const iLoc = idx("location");

  const rows: ScanRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split("\t");
    if (!c[iUrl]) continue;
    rows.push({
      url: c[iUrl] ?? "",
      firstSeen: c[iSeen] ?? "",
      portal: c[iPortal] ?? "",
      title: c[iTitle] ?? "",
      company: c[iCompany] ?? "",
      status: c[iStatus] ?? "",
      location: c[iLoc] ?? "",
    });
  }
  return rows;
}

export async function readScanHistory(): Promise<ScanRow[]> {
  try {
    const tsv = await readFile(paths.scanHistory, "utf8");
    return parseScanHistory(tsv);
  } catch {
    return [];
  }
}
