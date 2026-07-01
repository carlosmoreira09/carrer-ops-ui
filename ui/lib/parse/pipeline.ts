import { readFile } from "node:fs/promises";
import { paths } from "@/lib/paths";
import type { PipelineItem } from "@/lib/types";

/**
 * Lines look like:
 *   - [ ] https://url | Company | Role
 *   - [x] https://url | Company | Role
 */
export function parsePipelineMarkdown(md: string): PipelineItem[] {
  const items: PipelineItem[] = [];
  for (const raw of md.split("\n")) {
    const m = raw.match(/^\s*-\s*\[( |x|X)\]\s*(.+)$/);
    if (!m) continue;
    const done = m[1].toLowerCase() === "x";
    const rest = m[2].trim();
    const parts = rest.split("|").map((p) => p.trim());
    const url = parts[0] || "";
    if (!/^https?:|^local:/.test(url)) continue;
    items.push({
      url,
      company: parts[1] || "",
      role: parts[2] || "",
      done,
      raw: raw.trim(),
    });
  }
  return items;
}

export async function readPipeline(): Promise<PipelineItem[]> {
  try {
    const md = await readFile(paths.pipeline, "utf8");
    return parsePipelineMarkdown(md);
  } catch {
    return [];
  }
}
