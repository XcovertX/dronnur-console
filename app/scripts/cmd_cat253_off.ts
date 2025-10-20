// scripts/cmd_cat253_off.ts
import net from "net";

const IP = process.env.CMD_IP   || "192.168.1.253";  // <-- from your services map
const PORT = Number(process.env.CMD_PORT || "23523");

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  // Some firmwares are picky; trailing newline helps.
  return Buffer.from(header + payload + "\n", "utf8");
}

const frame = buildD2D({ InitSystem: "skip", TxMode: "off" }); // SAFE: no radiation

const sock = net.createConnection({ host: IP, port: PORT });
let buf = "";
sock.setTimeout(5000);

sock.on("connect", () => {
  console.log(`Connected to ${IP}:${PORT} — sending TxMode: off`);
  sock.write(frame);
});

sock.on("data", d => (buf += d.toString("utf8")));
sock.on("end", () => {
  console.log("=== RESPONSE START ===");
  console.log(buf || "(no payload)");
  console.log("=== RESPONSE END ===");
});
sock.on("timeout", () => { console.error("timeout"); sock.destroy(); });
sock.on("error", e => console.error("TCP error:", e.message));
