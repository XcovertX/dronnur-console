// app/api/status/stream/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import net from "net";

function sseChunk(obj: any) {
  return `id: ${Date.now()}\n` + `data: ${JSON.stringify(obj)}\n\n`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const port = Number(searchParams.get("port") || 59623);
  const intervalMs = Number(searchParams.get("interval") || 5000); // poll interval
  const timeoutMs  = Number(searchParams.get("timeout")  || 2000);
  const requestLine = searchParams.get("request") || "";   // e.g., "RunTime\n"
  const mode = (searchParams.get("mode") || "poll").toLowerCase(); // "poll" | "push"

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let timer: ReturnType<typeof setInterval> | null = null;
      let closed = false;

      const send = (obj: any) => controller.enqueue(enc.encode(sseChunk(obj)));
      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        controller.close();
      };

      // --- POLL MODE: open a new TCP connection each interval and fetch status
      const pollOnce = () => {
        const sock = new net.Socket();
        let buf = Buffer.alloc(0);
        let finished = false;

        const finish = (obj: any) => {
          if (finished) return;
          finished = true;
          try { sock.destroy(); } catch {}
          send(obj);
        };

        sock.setTimeout(timeoutMs);
        sock.on("timeout", () => finish({ error: "timeout" }));
        sock.on("error", (e) => finish({ error: String(e) }));
        sock.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); });
        sock.on("end", () => {
          const raw = buf.toString("utf8").trim();
          try { finish({ raw, json: JSON.parse(raw) }); }
          catch { finish({ raw }); }
        });

        sock.connect(port, host, () => {
          if (requestLine) {
            try { sock.write(requestLine); } catch {}
          }
        });
      };

      if (mode === "poll") {
        pollOnce(); // immediate
        timer = setInterval(pollOnce, intervalMs);
      }

      // --- PUSH MODE: keep one TCP socket open and forward whatever arrives
      if (mode === "push") {
        const sock = new net.Socket();
        let buf = Buffer.alloc(0);

        const cleanup = () => {
          try { sock.destroy(); } catch {}
          close();
        };

        sock.setTimeout(0); // don't auto-timeout
        sock.on("error", (e) => { send({ error: String(e) }); cleanup(); });
        sock.on("close", () => close());
        sock.on("data", (chunk) => {
          // If device sends status then newline-delimited JSON, handle it,
          // else just try full-buffer parse on each chunk.
          buf = Buffer.concat([buf, chunk]);
          const text = buf.toString("utf8");
          // Try line-split JSON first
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length > 1) {
            for (const line of lines) {
              if (!line.trim()) continue;
              try { send({ json: JSON.parse(line) }); }
              catch { send({ raw: line }); }
            }
            buf = Buffer.alloc(0); // reset buffer after splitting
          } else {
            // Try whole buffer as JSON
            try { send({ json: JSON.parse(text) }); buf = Buffer.alloc(0); }
            catch { /* keep buffering */ }
          }
        });

        sock.connect(port, host, () => {
          if (requestLine) {
            try { sock.write(requestLine); } catch {}
          }
          send({ status: "connected", mode: "push", host, port });
        });
      }

      // Abort when client disconnects
      const abort = (req as any).signal as AbortSignal | undefined;
      if (abort) abort.addEventListener("abort", close);
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
