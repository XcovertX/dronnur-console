// app/api/status/get/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import net from "net";

type Result = { ok: true; raw: string; json?: any } | { ok: false; error: string, raw?: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248"; // info host from discovery
  const port = Number(searchParams.get("port") || 59623);    // info/control port
  const timeoutMs = Number(searchParams.get("timeout") || 2000);
  // If your device needs a line to trigger status (often it just pushes JSON and closes),
  // set ?request=RunTime or similar:
  const requestLine = searchParams.get("request") || "";     // e.g., "RunTime\n"

  const result: Result = await new Promise((resolve) => {
    const sock = new net.Socket();
    let buf = Buffer.alloc(0);
    let done = false;

    function finish(r: Result) {
      if (done) return;
      done = true;
      try { sock.destroy(); } catch {}
      resolve(r);
    }

    sock.setTimeout(timeoutMs);
    sock.on("timeout", () => finish({ ok: false, error: "timeout" }));
    sock.on("error", (e) => finish({ ok: false, error: String(e) }));
    sock.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); });
    sock.on("end", () => {
      const raw = buf.toString("utf8").trim();
      try {
        const json = JSON.parse(raw);
        finish({ ok: true, raw, json });
      } catch {
        // device might return plain text or header+json; return raw anyway
        finish({ ok: true, raw });
      }
    });

    sock.connect(port, host, () => {
      if (requestLine) {
        try { sock.write(requestLine); } catch {}
      }
      // If the device expects nothing, it will just send JSON and close.
    });
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
