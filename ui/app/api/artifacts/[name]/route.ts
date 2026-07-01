import { readFile } from "node:fs/promises";
import path from "node:path";
import { paths, isInside } from "@/lib/paths";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const file = path.join(paths.outputDir, path.basename(name));
  if (!isInside(paths.outputDir, file)) {
    return new Response("Invalid path", { status: 400 });
  }
  try {
    const buf = await readFile(file);
    const isPdf = name.toLowerCase().endsWith(".pdf");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(name)}"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
