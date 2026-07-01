import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { paths } from "@/lib/paths";
import type { Artifact } from "@/lib/types";

export async function listArtifacts(): Promise<Artifact[]> {
  let files: string[];
  try {
    files = (await readdir(paths.outputDir)).filter((f) => f.endsWith(".pdf"));
  } catch {
    return [];
  }
  const out: Artifact[] = [];
  for (const name of files) {
    try {
      const s = await stat(path.join(paths.outputDir, name));
      const kind: Artifact["kind"] = name.includes("-cover")
        ? "cover"
        : name.startsWith("cv-")
        ? "cv"
        : "other";
      out.push({
        name,
        kind,
        size: s.size,
        mtime: s.mtime.toISOString(),
      });
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

export async function listHtmlFiles(): Promise<string[]> {
  try {
    return (await readdir(paths.outputDir)).filter((f) => f.endsWith(".html")).sort();
  } catch {
    return [];
  }
}
