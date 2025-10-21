import net from "net";
import { EventEmitter } from "events";
import { D2DParser, d2dFrame, D2DMessage } from "@/app/lib/d2d";

export type RunTimeStatus = { raw: string; json?: any; at: number };

class Cat253Server {
  private server?: net.Server;
  private host: string;
  private port: number;
  private sockets = new Set<net.Socket>();
  public events = new EventEmitter();
  public latest: RunTimeStatus | null = null;
  private requestVariants = [
    { cmd: "Status", path: "RunTime" }, // primary
    { cmd: "RunTime" },                 // variant A
    { op: "Get", path: "RunTime" },     // variant B
  ];

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  start() {
    if (this.server) return;
    this.server = net.createServer((sock) => this.onConn(sock));
    this.server.on("error", (e) => console.error("[CAT253] server error:", e));
    this.server.listen(this.port, this.host, () => {
      console.log(`[CAT253] listening on ${this.host}:${this.port}`);
    });
  }

  private onConn(sock: net.Socket) {
    console.log("[CAT253] radar connected:", sock.remoteAddress, sock.remotePort);
    this.sockets.add(sock);

    const parser = new D2DParser();

    // 1) Send initial Status/RunTime (with fallback sequence)
    this.sendInitialRequests(sock);

    // 2) If device does unsolicited pushes every ~5s, we'll catch them here
    sock.on("data", (chunk) => {
      const frames: D2DMessage[] = parser.push(chunk);
      for (const f of frames) this.handleFrame(f);
    });

    sock.on("error", (e) => console.error("[CAT253] socket error:", e.message));
    sock.on("close", () => {
      console.log("[CAT253] radar disconnected");
      this.sockets.delete(sock);
    });
  }

  private sendInitialRequests(sock: net.Socket) {
    // Send the first; if nothing arrives in ~1s, try the next variant.
    let idx = 0;
    const trySend = () => {
      if (idx >= this.requestVariants.length) return;
      const req = this.requestVariants[idx++];
      try { sock.write(d2dFrame(req)); } catch {}
    };
    trySend();
    setTimeout(trySend, 1000);
    setTimeout(trySend, 2000);
  }

  private handleFrame(f: D2DMessage) {
    // Basic sanity: protocol = D2D, JSON object present
    if ((f.header.PROTOCOL ?? "").toUpperCase() !== "D2D") return;

    const st: RunTimeStatus = { raw: f.bodyText, json: f.json, at: Date.now() };
    this.latest = st;
    this.events.emit("runtime", st);
  }
}

// Singleton
const globalKey = Symbol.for("__cat253_server__");
type GlobalState = { server: Cat253Server };
const g = globalThis as any;
if (!g[globalKey]) {
  const HOST = process.env.CAT253_HOST ?? "0.0.0.0";
  const PORT = Number(process.env.CAT253_PORT ?? 23253); // <- match your config
  g[globalKey] = { server: new Cat253Server(HOST, PORT) } as GlobalState;
}
export const cat253 = (g[globalKey] as GlobalState).server;
