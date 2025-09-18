// lib/d2d59623.ts
import net from "net";

export type D2DOptions = {
  ip?: string;              // default 192.168.1.248
  port?: number;            // default 59623
  connectTimeoutMs?: number; // default 4000
  ioTimeoutMs?: number;     // default 5000
  retries?: number;         // default 1 (one retry if ECONNRESET)
};

function buildFrame(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  // trailing newline helps strict parsers on some firmware
  return Buffer.from(header + payload + "\n", "utf8");
}

// Step 1: drain one-shot info so the server closes cleanly
async function drainOnce(ip: string, port: number, tmo: number) {
  await new Promise<void>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    s.setTimeout(tmo);
    s.on("data", () => {/* ignore snapshot */});
    s.on("end",  () => resolve());
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}

// Step 2: reconnect and send command; collect any echo
async function sendOnce(ip: string, port: number, frame: Buffer, tmo: number) {
  const resp = await new Promise<string>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    let buf = "";
    s.setTimeout(tmo);
    s.on("connect", () => s.write(frame));
    s.on("data", (d) => (buf += d.toString("utf8")));
    s.on("end", () => resolve(buf));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
  return resp;
}

export async function sendViaInfoPort(
  body: object,
  opts: D2DOptions = {}
): Promise<string> {
  const ip  = opts.ip  ?? process.env.DRONNUR_IP   ?? "192.168.1.248";
  const port= opts.port?? Number(process.env.DRONNUR_PORT ?? "59623");
  const cT  = opts.connectTimeoutMs ?? 4000;
  const ioT = opts.ioTimeoutMs      ?? 5000;
  const retries = opts.retries ?? 1;

  const frame = buildFrame(body);

  // attempt(s)
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await drainOnce(ip, port, cT);           // let server send & close
      return await sendOnce(ip, port, frame, ioT); // now send command
    } catch (e: any) {
      lastErr = e;
      // If we raced the close and got ECONNRESET/ECONNABORTED, retry once
      const msg = String(e?.code ?? e?.message ?? e);
      const transient = /ECONNRESET|ECONNABORTED|EPIPE|ETIMEOUT|timeout/i.test(msg);
      if (!transient || attempt === retries) break;
      await new Promise(r => setTimeout(r, 150));
    }
  }
  throw lastErr;
}

// Optional: read current snapshot (no command)
export async function readSnapshot(opts: D2DOptions = {}) {
  const ip  = opts.ip  ?? process.env.DRONNUR_IP   ?? "192.168.1.248";
  const port= opts.port?? Number(process.env.DRONNUR_PORT ?? "59623");
  const ioT = opts.ioTimeoutMs ?? 5000;
  const blob: string = await new Promise((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    let buf = "";
    s.setTimeout(ioT);
    s.on("data", (d) => (buf += d.toString("utf8")));
    s.on("end",  () => resolve(buf));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
  return blob; // may contain header+JSON; parse on caller if needed
}
