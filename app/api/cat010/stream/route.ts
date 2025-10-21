export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dgram from "dgram";

function isMulticast(ip: string) {
  const m = ip.match(/^(\d+)\./);
  if (!m) return false;
  const first = Number(m[1]);
  return first >= 224 && first <= 239;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") || "225.0.0.4";   // may be multicast OR unicast
  const port  = Number(searchParams.get("port") || 37001);
  const iface = searchParams.get("iface") || "192.168.1.10";

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

      const send = (obj: any) => {
        controller.enqueue(enc.encode(`id: ${Date.now()}\n` +
                                      `data: ${JSON.stringify(obj)}\n\n`));
      };

      sock.on("message", (msg, rinfo) => {
        send({ len: msg.length, from: `${rinfo.address}:${rinfo.port}` });
      });

      sock.on("listening", () => {
        try {
          if (isMulticast(group)) {
            // Multicast path
            sock.addMembership(group, iface);
            try { sock.setMulticastInterface(iface); } catch {}
            try { sock.setMulticastLoopback(true); } catch {}
            send({ status: "listening", mode: "multicast", group, port, iface });
          } else {
            // Unicast path — do NOT addMembership
            send({ status: "listening", mode: "unicast", ip: group, port, iface });
          }
        } catch (e) {
          send({ error: `join/setup failed: ${String(e)}` });
        }
      });

      sock.on("error", (e) => {
        send({ error: String(e) });
        try { sock.close(); } catch {}
        try { controller.close(); } catch {}
      });

      // Bind first; 0.0.0.0 is correct for both multicast and unicast
      sock.bind(port, "0.0.0.0");

      // Close when client disconnects
      (req as any).signal?.addEventListener("abort", () => {
        try { sock.close(); } catch {}
        try { controller.close(); } catch {}
      });
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
