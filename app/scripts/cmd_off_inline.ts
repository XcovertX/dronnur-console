// scripts/cmd_off_inline.ts
import net from "net";
const IP = "192.168.1.248", PORT = 59623;
const payload = JSON.stringify({ InitSystem: "skip", TxMode: "off" });
const header =
  "PROTOCOL=D2D\r\nVERSION=1.0\r\nTYPE=TEXT\r\n" +
  `LENGTH=${Buffer.byteLength(payload)}\r\n\r\n`;
const buf = Buffer.from(header + payload + "\n","utf8");

const s = net.createConnection({ host: IP, port: PORT });
let out = "", wrote = false;
s.setTimeout(6000);
s.on("data", d => {
  out += d.toString("utf8");
  if (!wrote) { wrote = true; s.write(buf); }
});
s.on("end", () => { console.log(out); });
s.on("timeout", () => { console.error("timeout"); s.destroy(); });
s.on("error", e => console.error(e.message));
