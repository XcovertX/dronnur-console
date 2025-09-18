// lib/d2d59623.ts
import net from "net";

export type D2DOptions = {
  ip?: string; port?: number;
  inlineTimeoutMs?: number; twoStepConnectMs?: number; twoStepIoMs?: number;
  retries?: number;
};

function frame(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\nVERSION=1.0\r\nTYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  return Buffer.from(header + payload + "\n", "utf8"); // note trailing \n
}

async function sendInline(ip: string, port: number, buf: Buffer, tmo: number) {
  return new Promise<string>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    let out = "", wrote = false;
    s.setTimeout(tmo);
    s.on("data", d => { out += d.toString("utf8"); if (!wrote) { wrote = true; s.write(buf); }});
    s.on("end", () => resolve(out));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}

async function drainOnce(ip: string, port: number, tmo: number) {
  await new Promise<void>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    s.setTimeout(tmo);
    s.on("data", () => {}); s.on("end", () => resolve());
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}
async function sendOnce(ip: string, port: number, buf: Buffer, tmo: number) {
  return new Promise<string>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    let out = "";
    s.setTimeout(tmo);
    s.on("connect", () => s.write(buf));
    s.on("data", d => (out += d.toString("utf8")));
    s.on("end", () => resolve(out));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}

export async function sendViaInfoPort(body: object, opts: D2DOptions = {}) {
  const ip  = opts.ip  ?? process.env.DRONNUR_IP ?? "192.168.1.248";
  const port= opts.port?? Number(process.env.DRONNUR_PORT ?? "59623");
  const inlineTmo = opts.inlineTimeoutMs ?? 6000;
  const cT = opts.twoStepConnectMs ?? 4000;
  const ioT = opts.twoStepIoMs ?? 6000;
  const retries = opts.retries ?? 1;
  const pkt = frame(body);

  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await sendInline(ip, port, pkt, inlineTmo); } catch (e) { lastErr = e; }
    try { await drainOnce(ip, port, cT); return await sendOnce(ip, port, pkt, ioT); }
    catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 150)); }
  }
  throw lastErr;
}

export async function readSnapshot(opts: D2DOptions = {}) {
  const ip  = opts.ip  ?? process.env.DRONNUR_IP ?? "192.168.1.248";
  const port= opts.port?? Number(process.env.DRONNUR_PORT ?? "59623");
  const tmo = opts.twoStepIoMs ?? 6000;
  return new Promise<string>((resolve, reject) => {
    const s = net.createConnection({ host: ip, port });
    let out = ""; s.setTimeout(tmo);
    s.on("data", d => (out += d.toString("utf8")));
    s.on("end", () => resolve(out));
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}
