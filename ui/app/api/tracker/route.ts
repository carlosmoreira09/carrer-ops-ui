import { NextResponse } from "next/server";
import { updateApplicationRow } from "@/lib/write/tracker";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const number = Number(body.number);
    if (!Number.isFinite(number)) {
      return NextResponse.json({ error: "number required" }, { status: 400 });
    }
    const changed = await updateApplicationRow(number, {
      status: body.status,
      notes: body.notes,
    });
    if (!changed) {
      return NextResponse.json({ error: "row not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
