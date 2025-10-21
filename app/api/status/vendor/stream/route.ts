export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sse = (obj:any) => `id: ${Date.now()}\n` + `data: ${JSON.stringify(obj)}\n\n`;

async function fetchStatus(url: string, timeoutMs = 2500) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { Accept: "*/*" } });
    const text = await r.text();
    // simple reuse
    const sepIdx = text.indexOf("\r\n\r\n") >= 0 ? text.indexOf("\r\n\r\n") : text.indexOf("\n\n");
    const headerText = sepIdx >= 0 ? text.slice(0, sepIdx) : "";
    const bodyText = sepIdx >= 0 ? text.slice(sepIdx + (text[sepIdx] === "\r" ? 4 : 2)) : text;
    let body = bodyText;
    const m = headerText.match(/LENGTH\s*=\s*(\d+)/i);
    if (m) body = bodyText.slice(0, Number(m[1]));
    let json: any | undefined;
    try { json = JSON.parse(body); } catch {}
    return { ok: true, json, raw: body, header: headerText };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  } finally { clearTimeout(t); }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const path = searchParams.get("path") || "/d2d_status.php";
  const intervalMs = Number(searchParams.get("interval") || 2000);
  const timeoutMs  = Number(searchParams.get("timeout")  || 2500);

  const url = `http://${host}${path}`;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let timer: any;

      const tick = async () => {
        const out = await fetchStatus(url, timeoutMs);
        controller.enqueue(enc.encode(sse({ url, at: Date.now(), ...out })));
      };

      tick();
      timer = setInterval(tick, intervalMs);

      (req as any).signal?.addEventListener("abort", () => {
        clearInterval(timer);
        try { controller.close(); } catch {}
      });
    }
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
