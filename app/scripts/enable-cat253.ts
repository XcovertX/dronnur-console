// scripts/enable-cat253.ts  (sends to CAT-253 once it's reachable; if not, try 59623)
import net from "net";
function buildD2D(body: object) {
  const p = JSON.stringify(body);
  const h = "PROTOCOL=D2D\r\nVERSION=1.0\r\nTYPE=TEXT\r\n" + `LENGTH=${Buffer.byteLength(p)}\r\n\r\n`;
  return Buffer.from(h + p + "\n", "utf8");
}
const frame = buildD2D({
  AsterixCat253: { Enabled: true, IP: "225.0.0.5", Port: 4445, Protocol: "UDP" }
});
const s = net.createConnection({ host: "192.168.1.248", port: 59623 }); // try info/control socket
s.on("connect", ()=> s.write(frame));
s.on("data", d=> process.stdout.write(d));
