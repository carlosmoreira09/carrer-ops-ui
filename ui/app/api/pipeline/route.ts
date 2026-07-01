import { NextResponse } from "next/server";
import {
  addPipelineUrl,
  removePipelineUrl,
  togglePipelineDone,
} from "@/lib/write/pipeline";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, url } = body;
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    switch (action) {
      case "add":
        await addPipelineUrl(url, body.company ?? "", body.role ?? "");
        break;
      case "remove":
        await removePipelineUrl(url);
        break;
      case "toggle":
        await togglePipelineDone(url, Boolean(body.done));
        break;
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
