// scripts/dump-services.ts
import net from "net";

const IP = process.env.DRONNUR_IP || "192.168.1.248";
const PORT = Number(process.env.DRONNUR_PORT || "59623");

function extractJson(blob: string) {
  const i = blob.indexOf("{"), j = blob.lastIndexOf("}");
  if (i >= 0 && j > i) return JSON.parse(blob.slice(i, j + 1));
  throw new Error("JSON not found in response");
}

(async () => {
  const buf = await new Promise<string>((resolve, reject) => {
    const s = net.createConnection({ host: IP, port: PORT });
    let data = "";
    s.setTimeout(5000);
    s.on("data", d => (data += d.toString("utf8")));
    s.on("end", () => resolve(data));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
  const obj = extractJson(buf);
  console.log(JSON.stringify(obj, null, 2));
})();
