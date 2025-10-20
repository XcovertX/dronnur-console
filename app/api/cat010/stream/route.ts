// app/api/cat010/stream/route.ts  (or src/app/api/...)
// App Router, Node runtime, SSE + UDP multicast

export const runtime = "nodejs";          // required: Edge doesn't support dgram
export const dynamic = "force-dynamic";   // keep the stream open

import dgram from "dgram";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") || "225.0.0.5";
  const port  = Number(searchParams.get("port") || 4445);
  const iface = searchParams.get("iface") || "192.168.1.10";

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      function send(obj: any) {
        const chunk = `id: ${Date.now()}\n` + `data: ${JSON.stringify(obj)}\n\n`;
        controller.enqueue(enc.encode(chunk));
      }

      const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

      sock.on("message", (msg, rinfo) => {
        send({ len: msg.length, from: `${rinfo.address}:${rinfo.port}` });
      });

      sock.on("listening", () => {
        try {
          sock.addMembership(group, iface);
          try { sock.setMulticastInterface(iface); } catch {}
          try { sock.setMulticastLoopback(true); } catch {}
          send({ status: "listening", group, port, iface });
        } catch (e) {
          send({ error: `addMembership failed: ${String(e)}` });
        }
      });

      sock.on("error", (e) => {
        send({ error: String(e) });
        cleanup();
      });

      function cleanup() {
        try { sock.close(); } catch {}
        try { controller.close(); } catch {}
      }

      // Close when client disconnects
      const abort = (req as any).signal as AbortSignal | undefined;
      if (abort) abort.addEventListener("abort", cleanup);

      sock.bind(port, "0.0.0.0");
    },
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
