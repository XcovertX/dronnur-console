// scripts/set_cat253_to_pc.ts
import net from "net";
const INFO_IP = process.env.INFO_IP || "192.168.1.248";
const INFO_PORT = Number(process.env.INFO_PORT || "59623");

// where YOU want the radar to connect:
const PC_IP = process.env.PC_IP || "192.168.1.10";
const PC_PORT = Number(process.env.PC_PORT || "23523");

function buildD2D(body: object) {
  const payload = JSON.stringify(body);
  const header =
    "PROTOCOL=D2D\r\n" +
    "VERSION=1.0\r\n" +
    "TYPE=TEXT\r\n" +
    `LENGTH=${Buffer.byteLength(payload, "utf8")}\r\n\r\n`;
  return Buffer.from(header + payload + "\n", "utf8");
}

// First connection: let the info socket speak and close
function readInfoOnce(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host: INFO_IP, port: INFO_PORT });
    s.setTimeout(5000);
    s.on("data", () => {}); // ignore
    s.on("end", resolve);
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });
}

async function main() {
  await readInfoOnce();

  // Adjust to match the ICD field names for service config. Many builds accept this shape:
  const body = {
    AsterixCat253: {
      Enabled: true,
      Protocol: "TCP",
      IP: PC_IP,
      Port: PC_PORT
    }
  };

  const frame = buildD2D(body);

  await new Promise<void>((resolve, reject) => {
    const s = net.createConnection({ host: INFO_IP, port: INFO_PORT });
    let resp = "";
    s.setTimeout(5000);
    s.on("connect", () => s.write(frame));
    s.on("data", (d) => (resp += d.toString("utf8")));
    s.on("end", () => { console.log("Response:\n", resp); resolve(); });
    s.on("timeout", () => { s.destroy(); reject(new Error("timeout")); });
    s.on("error", reject);
  });

  console.log("CAT-253 updated to", `${PC_IP}:${PC_PORT}`);
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
