import { NextResponse } from "next/server";
import { paths } from "@/lib/paths";
import { runNodeScript } from "@/lib/jobs";

export const runtime = "nodejs";

export async function POST() {
  const jobId = runNodeScript("doctor", "Doctor: prerequisite check", paths.doctor, []);
  return NextResponse.json({ jobId });
}
