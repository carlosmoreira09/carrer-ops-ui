import { NextResponse } from "next/server";
import { readUserFile, writeUserFile, type UserFileKey } from "@/lib/write/files";

export const runtime = "nodejs";

const VALID: UserFileKey[] = ["profile", "cv", "portals"];

function keyOf(req: Request): UserFileKey | null {
  const k = new URL(req.url).searchParams.get("key");
  return VALID.includes(k as UserFileKey) ? (k as UserFileKey) : null;
}

export async function GET(req: Request) {
  const key = keyOf(req);
  if (!key) return NextResponse.json({ error: "invalid key" }, { status: 400 });
  const content = await readUserFile(key);
  return NextResponse.json({ key, content });
}

export async function PUT(req: Request) {
  const key = keyOf(req);
  if (!key) return NextResponse.json({ error: "invalid key" }, { status: 400 });
  try {
    const { content } = await req.json();
    if (typeof content !== "string") {
      return NextResponse.json({ error: "content must be a string" }, { status: 400 });
    }
    await writeUserFile(key, content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
