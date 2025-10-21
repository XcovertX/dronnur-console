// scripts/cat253_server.ts
import net from "net";

function d2dFrame(obj: object) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const head = Buffer.from(`PROTOCOL=D2D\r\nLENGTH=${body.length}\r\n\r\n`, "utf8");
  return Buffer.concat([head, body]);
}

const HOST = process.env.HOST || "192.168.1.253";
const PORT = Number(process.env.PORT || 23523);

const server = net.createServer((sock) => {
  console.log("Radar connected:", sock.remoteAddress, sock.remotePort);

  // Request runtime status on connect (adjust command/shape to your ICD)
  const req = d2dFrame({ cmd: "Status", path: "RunTime" });
  setTimeout(() => sock.write(req), 150);

  let buf = Buffer.alloc(0);
  sock.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const text = buf.toString("utf8");
    const sep = text.indexOf("\r\n\r\n");
    if (sep >= 0) {
      const header = text.slice(0, sep);
      const m = header.match(/LENGTH=(\d+)/i);
      const len = m ? Number(m[1]) : NaN;
      const body = text.slice(sep + 4);
      if (Number.isFinite(len) && body.length >= len) {
        const jsonText = body.slice(0, len);
        console.log("RunTime:", jsonText);
        try { console.log("Parsed:", JSON.parse(jsonText)); } catch {}
        buf = Buffer.from(body.slice(len)); // keep leftover for next messages
      }
    }
  });

  sock.on("close", () => console.log("Radar disconnected"));
  sock.on("error", (e) => console.error("Socket error:", e));
});

server.listen(PORT, HOST, () => {
  console.log(`CAT-253 server listening on ${HOST}:${PORT}`);
});
