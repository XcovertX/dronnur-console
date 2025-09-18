import dgram from "dgram";

type Listener = (hex: string, len: number) => void;
const GROUP = process.env.CAT010_GROUP || "225.0.0.4";
const PORT  = Number(process.env.CAT010_PORT || "37001");
const IFACE = process.env.IFACE || "192.168.1.10";

let socket: dgram.Socket | null = null;
let listeners = new Set<Listener>();

export function startCat010() {
  if (socket) return;
  socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  socket.on("error", (e) => console.error("cat010 udp error", e));
  socket.on("message", (msg) => {
    const hex = msg.toString("hex");
    const len = msg.length;
    for (const cb of listeners) cb(hex, len);
  });
  socket.bind(PORT, () => {
    try { socket!.addMembership(GROUP, IFACE); } catch {}
    try { socket!.setMulticastInterface(IFACE); } catch {}
    console.log(`CAT-010 listening ${GROUP}:${PORT} on ${IFACE}`);
  });
}
export function onCat010(cb: Listener) { startCat010(); listeners.add(cb); return () => listeners.delete(cb); }
