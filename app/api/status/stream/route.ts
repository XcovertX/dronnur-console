export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cat253 } from "@/app/lib/cat253";

const sse = (obj:any)=>`id: ${Date.now()}\n`+`data: ${JSON.stringify(obj)}\n\n`;

export async function GET(_req: Request) {
  cat253.start();

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      // Send last known immediately (if any)
      if (cat253.latest) controller.enqueue(enc.encode(sse({ ok:true, ...cat253.latest })));
      else controller.enqueue(enc.encode(sse({ ok:true, info:"waiting for radar connection..." })));

      const onRuntime = (st:any)=> controller.enqueue(enc.encode(sse({ ok:true, ...st })));
      cat253.events.on("runtime", onRuntime);

      // heartbeat
      const hb = setInterval(()=> controller.enqueue(enc.encode(sse({ ok:true, heartbeat: Date.now() }))), 10_000);

      (globalThis as any)._cleanup = () => {
        clearInterval(hb);
        cat253.events.off("runtime", onRuntime);
        try { controller.close(); } catch {}
      };
    },
    cancel() { try { (globalThis as any)._cleanup?.(); } catch {} },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
