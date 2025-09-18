// scripts/cmd_off_253_tcp.ts
import net from "net";

const IP = process.env.CMD_IP || "192.168.1.253";   // set to CAT-253 IP from the services map
const PORT = Number(process.env.CMD_PORT || "25323");// set to CAT-253 Port from the services map

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  // trailing newline sometimes helps strict parsers
  return Buffer.concat([Buffer.from(header, "utf8"), Buffer.from(payload + "\n", "utf8")]);
}

const frame = buildD2D({ InitSystem: "skip", TxMode: "off" });

const sock = net.createConnection({ host: IP, port: PORT });
let buf = "";
sock.setTimeout(10000);
sock.on("connect", () => sock.write(frame));
sock.on("data", d => (buf += d.toString("utf8")));
sock.on("end", () => console.log(buf));
sock.on("timeout", () => { console.error("timeout"); sock.destroy(); });
sock.on("error", e => console.error("TCP error:", e.message));
