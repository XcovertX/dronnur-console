// app/api/discovery/scan/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dgram from "dgram";

const MCAST_ADDR = "227.228.229.230";
const PORT = 59368;

function parseBeacon(buf: Buffer) {
  const text = buf.toString("utf8");
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const addrLine = lines.find(l => /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(l));
  const info = addrLine
    ? { infoAddress: addrLine, infoHost: addrLine.split(":")[0], infoPort: Number(addrLine.split(":")[1]) }
    : undefined;
  return { raw: text, ...info };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const iface = searchParams.get("iface") || "192.168.1.10";
  const timeoutMs = Number(searchParams.get("timeout") || 1500);

  // Use a Promise so we can await the UDP scan then return a JSON Response
  const result = await new Promise<{ devices: any[]; error?: string }>((resolve) => {
    const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const seen = new Map<string, any>();
    let finished = false;

    function finish(body: { devices: any[]; error?: string }) {
      if (finished) return;
      finished = true;
      try { sock.close(); } catch {}
      resolve(body);
    }

    sock.on("error", (e) => {
      finish({ devices: [], error: String(e) });
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
        // Membership failed; still resolve with an error payload
        return finish({ devices: [], error: `addMembership failed: ${String(e)}` });
      }
      setTimeout(() => {
        finish({ devices: Array.from(seen.values()) });
      }, timeoutMs);
    });

    try {
      sock.bind(PORT, "0.0.0.0");
      // Safety: if 'listening' never fires
      setTimeout(() => finish({ devices: [], error: "timeout (bind/listen)" }), timeoutMs + 500);
    } catch (e) {
      finish({ devices: [], error: String(e) });
    }
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
