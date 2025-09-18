// scripts/discovery.ts (run with ts-node or compile)
import dgram from "dgram";
const MCAST_ADDR = "227.228.229.230";
const PORT = 59368;

const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
sock.on("message", (msg) => console.log(msg.toString()));
sock.bind(PORT, () => {
  sock.addMembership(MCAST_ADDR);
  sock.setMulticastTTL(1);
  console.log(`Listening ${MCAST_ADDR}:${PORT}`);
});
