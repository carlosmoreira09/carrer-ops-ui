import { NextResponse } from "next/server";
import { paths } from "@/lib/paths";
import { runNodeScript } from "@/lib/jobs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const args: string[] = [];
    if (body.company) {
      args.push("--company", String(body.company));
    }
    const label = body.company ? `Scan: ${body.company}` : "Scan: all portals";
    const jobId = runNodeScript("scan", label, paths.scan, args);
    return NextResponse.json({ jobId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
