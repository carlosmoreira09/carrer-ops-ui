import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { paths } from "@/lib/paths";
import { fetchJdText } from "@/lib/fetch-jd";
import { runNodeScript } from "@/lib/jobs";
import { getEnvStatus } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let jd: string = (body.jd ?? "").trim();
    const url: string = (body.url ?? "").trim();
    const label: string = body.label || url || "pasted JD";

    const env = await getEnvStatus();
    if (!env.hasOpenAIKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set. Configure it in Settings / .env." },
        { status: 400 }
      );
    }

    if (!jd && url) {
      try {
        jd = await fetchJdText(url);
      } catch (e) {
        return NextResponse.json(
          { error: `Could not fetch JD from URL (${(e as Error).message}). Paste the JD text instead.` },
          { status: 422 }
        );
      }
    }

    if (!jd || jd.length < 80) {
      return NextResponse.json(
        { error: "Job description too short or empty. Paste the full JD." },
        { status: 422 }
      );
    }

    // Persist JD to a temp file and evaluate via --file (safe for long text).
    const jdsDir = path.join(paths.root, "jds");
    await mkdir(jdsDir, { recursive: true });
    const tmp = path.join(jdsDir, `_ui-eval-${Date.now()}.txt`);
    const header = url ? `Source URL: ${url}\n\n` : "";
    await writeFile(tmp, header + jd, "utf8");

    const args = ["--file", tmp];
    if (body.model) args.push("--model", String(body.model));

    const jobId = runNodeScript("evaluate", `Evaluate: ${label}`, paths.openaiEval, args);
    return NextResponse.json({ jobId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
