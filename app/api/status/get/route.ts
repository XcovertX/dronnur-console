export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import net from "net";

type Res = { ok: true; raw: string; json?: any, mode: string } |
           { ok: false; error: string, mode?: string, detail?: string };

function readOnce({ host, port, timeoutMs, write }: {
  host: string; port: number; timeoutMs: number; write?: Buffer | null;
}): Promise<{ raw: string }> {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let buf = Buffer.alloc(0);
    let finished = false;

    const finishOk = () => {
      if (finished) return;
      finished = true;
      try { sock.destroy(); } catch {}
      resolve({ raw: buf.toString("utf8").trim() });
    };
    const finishErr = (err: any) => {
      if (finished) return;
      finished = true;
      try { sock.destroy(); } catch {}
      reject(err);
    };

    sock.setTimeout(timeoutMs);
    sock.on("timeout", () => finishErr(new Error("timeout")));
    sock.on("error", (e) => finishErr(e));
    sock.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); });
    // some servers call 'end', others hard reset ('close' with error). We try to parse on either.
    sock.on("end", finishOk);
    sock.on("close", (hadErr) => { if (!hadErr) finishOk(); }); 

    sock.connect(port, host, () => {
      if (write && write.length) {
        try { sock.write(write); } catch (e) { finishErr(e); }
      }
    });
  });
}

function d2dFrame(obj: object) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const head = Buffer.from(`PROTOCOL=D2D\r\nLENGTH=${body.length}\r\n\r\n`, "utf8");
  return Buffer.concat([head, body]);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const port = Number(searchParams.get("port") || 59623);
  const timeoutMs = Number(searchParams.get("timeout") || 2000);

  // 1) Try PASSIVE (send nothing; read once)
  try {
    const { raw } = await readOnce({ host, port, timeoutMs, write: null });
    try { return json({ ok: true, json: JSON.parse(raw), raw, mode: "passive" }); }
    catch { return json({ ok: true, raw, mode: "passive" }); }
  } catch (e: any) {
    // fall through to LINE
  }

  // 2) Try LINE request: "RunTime\r\n"
  try {
    const line = Buffer.from("RunTime\r\n", "utf8");
    const { raw } = await readOnce({ host, port, timeoutMs, write: line });
    try { return json({ ok: true, json: JSON.parse(raw), raw, mode: "line" }); }
    catch { return json({ ok: true, raw, mode: "line" }); }
  } catch (e: any) {
    // fall through to D2D
  }

  // 3) Try D2D-framed JSON: {"cmd":"RunTime"}
  try {
    const frame = d2dFrame({ cmd: "RunTime" });
    const { raw } = await readOnce({ host, port, timeoutMs, write: frame });
    try { return json({ ok: true, json: JSON.parse(raw), raw, mode: "d2d" }); }
    catch { return json({ ok: true, raw, mode: "d2d" }); }
  } catch (e: any) {
    // All modes failed — report last error
    const msg = e?.code === "ECONNRESET"
      ? "peer reset the connection (ECONNRESET) — request format not accepted for this port"
      : String(e?.message || e);
    return json({ ok: false, error: msg, detail: String(e), mode: "failed" }, 502);
  }
}

function json(body: Res, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
