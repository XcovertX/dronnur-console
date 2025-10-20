// pages/api/discovery/scan.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dgram from "dgram";

const MCAST_ADDR = "227.228.229.230";
const PORT = 59368;

function parseBeacon(buf: Buffer) {
  // Typical content includes a 'dspnor' line and "<ip>:<infoPort>"
  const text = buf.toString("utf8");
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const addrLine = lines.find(l => /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(l));
  const info = addrLine
    ? { infoAddress: addrLine, infoHost: addrLine.split(":")[0], infoPort: Number(addrLine.split(":")[1]) }
    : undefined;
  return { raw: text, ...info };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const iface = (req.query.iface as string) ?? "192.168.1.10";
  const timeoutMs = Number(req.query.timeout ?? 1500);

  const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

  const seen = new Map<string, any>();
  let closed = false;

  function done() {
    if (closed) return;
    closed = true;
    try { sock.close(); } catch {}
    const list = Array.from(seen.values());
    res.status(200).json({ devices: list });
  }

  sock.on("error", (e) => {
    try { sock.close(); } catch {}
    if (!closed) res.status(500).json({ error: String(e) });
  });

  sock.on("message", (msg, rinfo) => {
    const parsed = parseBeacon(msg);
    const key = `${rinfo.address}:${rinfo.port}|${parsed.infoAddress ?? ""}`;
    if (!seen.has(key)) {
      seen.set(key, {
        from: `${rinfo.address}:${rinfo.port}`,
        infoAddress: parsed.infoAddress,
        infoHost: parsed.infoHost,
        infoPort: parsed.infoPort,
        raw: parsed.raw,
      });
    }
  });

  sock.on("listening", () => {
    try {
      sock.addMembership(MCAST_ADDR, iface);
      try { sock.setMulticastInterface(iface); } catch {}
      try { sock.setMulticastLoopback(true); } catch {}
    } catch (e) {
      // still return whatever we got (likely nothing)
      return done();
    }
    // Stop after timeout
    setTimeout(done, timeoutMs);
  });

  sock.bind(PORT, "0.0.0.0"); // bind before addMembership
}
