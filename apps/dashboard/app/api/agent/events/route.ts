import { subscribe } from "@/lib/agent-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE stream of agent activity + UI commands for the open window. */
export function GET(req: Request) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      const send = (s: string) => ctrl.enqueue(enc.encode(s));
      const unsub = subscribe((e) => send(`data: ${JSON.stringify(e)}\n\n`));
      const beat = setInterval(() => send(": ping\n\n"), 15000);
      send(": connected\n\n");
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(beat);
        ctrl.close();
      });
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
