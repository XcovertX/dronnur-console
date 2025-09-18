// lib/d2d.ts (Node runtime)
import net from "net";

export function buildD2D(json: object) {
  const payload = JSON.stringify(json);
  const header = [
    "PROTOCOL=D2D",
    "VERSION=1.0",
    "TYPE=TEXT",
    `LENGTH=${Buffer.byteLength(payload, "utf8")}`,
    "", // blank line
  ].join("\n");
  return Buffer.concat([Buffer.from(header, "utf8"), Buffer.from(payload, "utf8")]);
}

export async function sendD2D(ip: string, port: number, body: object): Promise<string> {
  const frame = buildD2D(body);
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let buf = "";
    sock.setTimeout(3000);
    sock.on("data", d => (buf += d.toString("utf8")));
    sock.on("error", reject);
    sock.on("timeout", () => { sock.destroy(); reject(new Error("timeout")); });
    sock.connect(port, ip, () => sock.write(frame));
    sock.on("close", () => resolve(buf));
  });
}
