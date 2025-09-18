// scripts/info.ts
import net from "net";

const IP = process.env.DRONNUR_IP || "192.168.1.248";
const PORT = Number(process.env.DRONNUR_PORT || 59623);

const sock = net.createConnection({ host: IP, port: PORT });
let buf = "";

sock.setTimeout(5000);

sock.on("connect", () => console.log(`Connected to ${IP}:${PORT}`));
sock.on("data", (d) => (buf += d.toString("utf8")));
sock.on("end", () => {
  console.log("=== RESPONSE START ===");
  console.log(buf);            // You'll see a small header + JSON-ish state
  console.log("=== RESPONSE END ===");
});
sock.on("timeout", () => { console.error("timeout"); sock.destroy(); });
sock.on("error", (e) => console.error("TCP error:", e.message));
