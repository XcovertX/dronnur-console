import dgram from "dgram";

type Listener = (buf: Buffer) => void;

const GROUP = process.env.CAT010_GROUP || "225.0.0.4";
const PORT  = Number(process.env.CAT010_PORT || "37001");
const IFACE = process.env.IFACE || undefined;

let sock: dgram.Socket | null = null;
const listeners = new Set<Listener>();

export function startCat010() {
  if (sock) return;
  sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

  sock.on("error", (e) => { console.error("cat010 udp error:", e); });
  sock.on("message", (msg) => { for (const cb of listeners) cb(msg); });

  sock.bind(PORT, () => {
    try { sock!.addMembership(GROUP, IFACE); } catch {}
    try { if (IFACE) sock!.setMulticastInterface(IFACE); } catch {}
    console.log(`CAT-010 listening ${GROUP}:${PORT}${IFACE ? " on " + IFACE : ""}`);
  });
}

export function onCat010(cb: Listener) {
  startCat010();
  listeners.add(cb);
  return () => listeners.delete(cb);
}
