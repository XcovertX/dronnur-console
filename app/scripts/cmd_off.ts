// scripts/cmd_off.ts
import net from "net";

const IP = process.env.DRONNUR_IP || "192.168.1.248";
const PORT = Number(process.env.DRONNUR_PORT || 59623);

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\n" +
    "VERSION=1.0\n" +
    "TYPE=TEXT\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\n\n`;
  return Buffer.concat([Buffer.from(header, "utf8"), Buffer.from(payload, "utf8")]);
}

const frame = buildD2D({ InitSystem: "skip", TxMode: "off" }); // safe: no radiation

const sock = net.createConnection({ host: IP, port: PORT });
let buf = "";

sock.setTimeout(5000);
sock.on("connect", () => {
  console.log(`Connected to ${IP}:${PORT} — sending TxMode: off`);
  sock.write(frame);
});
sock.on("data", (d) => (buf += d.toString("utf8")));
sock.on("end", () => {
  console.log("=== RESPONSE START ===");
  console.log(buf); // should echo current state; look for TxMode
  console.log("=== RESPONSE END ===");
});
sock.on("timeout", () => { console.error("timeout"); sock.destroy(); });
sock.on("error", (e) => console.error("TCP error:", e.message));
