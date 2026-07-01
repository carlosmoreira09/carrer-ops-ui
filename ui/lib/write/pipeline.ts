import { readFile, writeFile } from "node:fs/promises";
import { paths } from "@/lib/paths";

async function read(): Promise<string> {
  try {
    return await readFile(paths.pipeline, "utf8");
  } catch {
    return "# Pipeline — Pending URLs\n\n## Pending\n";
  }
}

export async function addPipelineUrl(url: string, company = "", role = ""): Promise<void> {
  const md = await read();
  if (md.includes(url)) return; // dedup
  const parts = [url, company, role].filter((p, i) => i === 0 || p).join(" | ");
  const entry = `- [ ] ${parts}`;
  const lines = md.split("\n");
  const idx = lines.findIndex((l) => /^##\s+Pending/i.test(l));
  if (idx >= 0) {
    lines.splice(idx + 1, 0, entry);
  } else {
    lines.push(entry);
  }
  await writeFile(paths.pipeline, lines.join("\n"), "utf8");
}

export async function removePipelineUrl(url: string): Promise<void> {
  const md = await read();
  const lines = md.split("\n").filter((l) => !(l.includes(url) && /^\s*-\s*\[/.test(l)));
  await writeFile(paths.pipeline, lines.join("\n"), "utf8");
}

export async function togglePipelineDone(url: string, done: boolean): Promise<void> {
  const md = await read();
  const mark = done ? "[x]" : "[ ]";
  const lines = md.split("\n").map((l) => {
    if (l.includes(url) && /^\s*-\s*\[/.test(l)) {
      return l.replace(/\[( |x|X)\]/, mark);
    }
    return l;
  });
  await writeFile(paths.pipeline, lines.join("\n"), "utf8");
}
