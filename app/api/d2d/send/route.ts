export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import net from "net";

function d2dFrame(obj: object) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const head = Buffer.from(`PROTOCOL=D2D\r\nLENGTH=${body.length}\r\n\r\n`, "utf8");
  return Buffer.concat([head, body]);
}

async function sendD2D(host: string, port: number, payload: object, timeoutMs: number) {
  return new Promise<{ raw: string; json?: any }>((resolve, reject) => {
    const sock = new net.Socket();
    let buf = Buffer.alloc(0);
    let done = false;

    const finish = (err?: any) => {
      if (done) return;
      done = true;
      try { sock.destroy(); } catch {}
      if (err) return reject(err);
      const raw = buf.toString("utf8").trim();
      try { resolve({ raw, json: JSON.parse(raw) }); }
      catch { resolve({ raw }); }
    };

    sock.setTimeout(timeoutMs);
    sock.on("timeout", () => finish(new Error("timeout")));
    sock.on("error", (e) => finish(e));
    sock.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); });
    sock.on("end", () => finish());
    sock.on("close", (hadErr) => { if (!hadErr) finish(); });

    sock.connect(port, host, () => {
      try { sock.write(d2dFrame(payload)); } catch (e) { finish(e); }
    });
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const port = Number(searchParams.get("port") || 23523); // likely AsterixCat253.Port
  const timeoutMs = Number(searchParams.get("timeout") || 2000);

  // default command to get runtime status; adjust if your ICD uses a different verb/path
  const cmd = searchParams.get("cmd") || "RunTime";
  // optional JSON body (URL-encoded)
  const body = searchParams.get("body"); // e.g. {"path":"RunTime"}
  let payload: any = body ? JSON.parse(body) : { cmd };

  try {
    const out = await sendD2D(host, port, payload, timeoutMs);
    return new Response(JSON.stringify({ ok: true, mode: "d2d", ...out }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const msg = e?.code === "ECONNRESET"
      ? "peer reset the connection (wrong port/command?)"
      : String(e?.message || e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
