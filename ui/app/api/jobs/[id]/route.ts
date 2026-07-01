import { getJob, subscribe } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE stream of a job's logs. Replays existing logs, then live-streams. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return new Response("Job not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Replay buffered logs.
      for (const line of job.logs) {
        if (line === "__END__") continue;
        send("log", line);
      }

      if (job.status !== "running") {
        send("end", { status: job.status, exitCode: job.exitCode });
        controller.close();
        return;
      }

      const unsub = subscribe(id, (line) => {
        if (line === "__END__") {
          const j = getJob(id);
          send("end", { status: j?.status, exitCode: j?.exitCode });
          unsub();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          return;
        }
        try {
          send("log", line);
        } catch {
          unsub();
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
