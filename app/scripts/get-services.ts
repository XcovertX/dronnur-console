// scripts/get-services.ts
import net from "net";

const IP = "192.168.1.248";
const PORT = 59623;

function extractJson(blob: string) {
  const i = blob.indexOf("{");
  const j = blob.lastIndexOf("}");
  if (i >= 0 && j > i) return JSON.parse(blob.slice(i, j + 1));
  throw new Error("JSON not found in response");
}

const sock = net.createConnection({ host: IP, port: PORT });
let buf = "";
sock.setTimeout(5000);
sock.on("data", d => (buf += d.toString("utf8")));
sock.on("end", () => {
  try {
    const obj = extractJson(buf);
    const svc = obj?.services ?? obj?.Services ?? {};
    const cat253 = svc.AsterixCat253 || svc["AsterixCat253"];
    console.log("Services:", Object.keys(svc));
    console.log("AsterixCat253:", cat253);
  } catch (e: any) {
    console.error("Parse error:", e.message);
  }
});
sock.on("timeout", () => { console.error("timeout"); sock.destroy(); });
sock.on("error", e => console.error("TCP error:", e.message));