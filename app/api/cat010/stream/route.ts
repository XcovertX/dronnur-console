// pages/api/cat010/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dgram from "dgram";

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const group = (req.query.group as string) || "225.0.0.5";
  const port = Number(req.query.port || 4445);
  const iface = (req.query.iface as string) || "192.168.1.10";

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
  let closed = false;

  function send(id: number, data: any) {
    res.write(`id: ${id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sock.on("message", (msg, rinfo) => {
    // You can parse ASTERIX here; for the wireframe, we just expose length & source.
    send(Date.now(), { len: msg.length, from: `${rinfo.address}:${rinfo.port}` });
  });

  sock.on("listening", () => {
    try {
      sock.addMembership(group, iface);
      try { sock.setMulticastInterface(iface); } catch {}
      try { sock.setMulticastLoopback(true); } catch {}
    } catch (e) {
      send(Date.now(), { error: `addMembership failed: ${String(e)}` });
    }
  });

  sock.on("error", (e) => {
    send(Date.now(), { error: String(e) });
    cleanup();
  });

  function cleanup() {
    if (closed) return;
    closed = true;
    try { sock.close(); } catch {}
    try { res.end(); } catch {}
  }

  req.on("close", cleanup);
  req.on("aborted", cleanup);

  sock.bind(port, "0.0.0.0");
}
