// scripts/cat253_server.ts
import net from "net";

const LISTEN_PORT = Number(process.env.LISTEN_PORT || "23523");
const HOST = process.env.HOST || "0.0.0.0";

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  return Buffer.from(header + payload + "\n", "utf8");
}

const server = net.createServer((socket) => {
  console.log(`[CAT253] Connected from ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", (buf) => {
    process.stdout.write(`[CAT253] RX ${buf.length} bytes\n`);
    process.stdout.write(buf.toString("utf8"));
  });

  socket.on("close", () => console.log("[CAT253] Socket closed"));
  socket.on("error", (e) => console.error("[CAT253] Socket error:", e.message));

  // (Safe) send Tx OFF upon connect so we never radiate by accident:
  const frame = buildD2D({ InitSystem: "skip", TxMode: "off" });
  socket.write(frame);
});

server.listen(LISTEN_PORT, HOST, () => {
  console.log(`[CAT253] Listening on ${HOST}:${LISTEN_PORT}`);
});
