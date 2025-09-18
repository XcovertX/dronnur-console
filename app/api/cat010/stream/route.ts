import { onCat010 } from "@/app/lib/udp-cat010";

export const runtime = "nodejs";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const unsub = onCat010((buf) => {
        // send as hex for now (parsing comes next)
        const payload = JSON.stringify({ len: buf.length, hex: buf.toString("hex") });
        controller.enqueue(enc.encode(`data: ${payload}\n\n`));
      });
      const ping = setInterval(() => controller.enqueue(enc.encode(":keepalive\n\n")), 15000);
      // @ts-expect-error stash
      this.unsub = unsub; this.ping = ping;
      controller.enqueue(new TextEncoder().encode("retry: 3000\n\n"));
    },
    cancel() {
      // @ts-expect-error read back
      if (this.unsub) this.unsub();
      // @ts-expect-error read back
      if (this.ping) clearInterval(this.ping);
    }
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream" } });
}
