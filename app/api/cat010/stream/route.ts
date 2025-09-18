import { onCat010 } from "@/app/lib/udp-cat010";
export const runtime = "nodejs";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const unsub = onCat010((hex, len) => {
        const payload = JSON.stringify({ len, hex });
        controller.enqueue(enc.encode(`data: ${payload}\n\n`));
      });
      const ping = setInterval(() => controller.enqueue(enc.encode(":keepalive\n\n")), 15000);
      controller.enqueue(enc.encode("retry: 3000\n\n"));
      // @ts-expect-error close
      this.unsub = unsub; this.ping = ping;
    },
    cancel() {
      // @ts-expect-error close
      if (this.unsub) this.unsub();
      // @ts-expect-error close
      if (this.ping) clearInterval(this.ping);
    }
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream" } });
}
