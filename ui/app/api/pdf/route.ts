import { NextResponse } from "next/server";
import path from "node:path";
import { paths, isInside } from "@/lib/paths";
import { runNodeScript } from "@/lib/jobs";

export const runtime = "nodejs";

/** Convert an existing HTML file in output/ to a PDF via generate-pdf.mjs. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const htmlName = String(body.html || "");
    if (!htmlName.endsWith(".html")) {
      return NextResponse.json({ error: "html filename required" }, { status: 400 });
    }
    const input = path.join(paths.outputDir, path.basename(htmlName));
    if (!isInside(paths.outputDir, input)) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }
    const output = input.replace(/\.html$/, ".pdf");
    const jobId = runNodeScript(
      "pdf",
      `PDF: ${path.basename(output)}`,
      paths.generatePdf,
      [input, output]
    );
    return NextResponse.json({ jobId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
