// scripts/discovery.ts
import dgram from "dgram";

const MCAST_ADDR = "227.228.229.230";
const PORT = 59368;

// Your PC's IP on the Dronnur link:
const IFACE = process.env.IFACE ?? "192.168.1.10";

const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

sock.on("error", (e) => {
  console.error("UDP error:", e);
  process.exit(1);
});

sock.on("listening", () => {
  const addr = sock.address();
  console.log(`Listening on ${addr.address}:${addr.port}`);
  try {
    // Make sure the OS joins the group on the correct NIC
    sock.addMembership(MCAST_ADDR, IFACE);
    // Optional but helpful on Windows:
    try { sock.setMulticastInterface(IFACE); } catch {}
    try { sock.setMulticastLoopback(true); } catch {}
    console.log(`Joined ${MCAST_ADDR} on iface ${IFACE}`);
  } catch (e) {
    console.error("addMembership failed:", e);
  }
});

sock.on("message", (msg, rinfo) => {
  console.log(`[${new Date().toISOString()}] from ${rinfo.address}:${rinfo.port}`);
  console.log(msg.toString());  // should contain the dspnor line and "192.168.1.248:59623"
});

sock.bind(PORT, "0.0.0.0"); // bind before addMembership
