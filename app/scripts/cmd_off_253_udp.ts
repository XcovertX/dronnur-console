// scripts/cmd_off_253_udp.ts
import dgram from "dgram";

const IP = process.env.CMD_IP || "225.0.0.5";       // CAT-253 IP from services map
const PORT = Number(process.env.CMD_PORT || "4445");// CAT-253 port
const IFACE = process.env.IFACE || "192.168.1.10";  // your NIC

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  return Buffer.from(header + payload + "\n", "utf8");
}

const frame = buildD2D({ InitSystem: "skip", TxMode: "off" });

const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
sock.bind(0, IFACE, () => {
  sock.setMulticastInterface(IFACE); // harmless for unicast too
  sock.send(frame, PORT, IP, (err) => {
    if (err) console.error("UDP send error:", err);
    else console.log(`Sent to ${IP}:${PORT}`);
    sock.close();
  });
});
