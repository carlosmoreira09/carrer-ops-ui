import { readFile, writeFile } from "node:fs/promises";
import { paths } from "@/lib/paths";
import { CANONICAL_STATUSES } from "@/lib/types";

export type RowUpdate = { status?: string; notes?: string };

/**
 * Update the status and/or notes of an EXISTING tracker row (matched by the
 * `#` number column). Adding new rows must go through the TSV + merge-tracker
 * flow — never here.
 */
export async function updateApplicationRow(
  number: number,
  update: RowUpdate
): Promise<boolean> {
  if (update.status && !CANONICAL_STATUSES.includes(update.status as never)) {
    throw new Error(`Invalid status: ${update.status}`);
  }
  const md = await readFile(paths.applications, "utf8");
  const lines = md.split("\n");
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) continue;
    // Split preserving structure; cells are pipe-delimited.
    const cells = line.split("|");
    // cells[0] is empty (before leading pipe). Real columns start at index 1.
    if (cells.length < 10) continue;
    const numCell = cells[1].trim();
    if (numCell !== String(number)) continue;

    // Column mapping (1-indexed within cells due to leading pipe):
    // 1:# 2:Date 3:Company 4:Role 5:Score 6:Status 7:PDF 8:Report 9:Notes
    if (update.status !== undefined) {
      cells[6] = ` ${update.status} `;
    }
    if (update.notes !== undefined) {
      cells[9] = ` ${update.notes.replace(/\|/g, "\\|").replace(/\n/g, " ")} `;
    }
    lines[i] = cells.join("|");
    changed = true;
    break;
  }

  if (changed) await writeFile(paths.applications, lines.join("\n"), "utf8");
  return changed;
}
