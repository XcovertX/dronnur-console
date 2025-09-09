import React, { useState } from "react";

// Dronnur Radar Console – Interactive Wireframe (v1)
// Notes:
// - Pure React + TailwindCSS (no external UI libs) for maximum portability in preview.
// - This is a clickable wireframe to communicate layout & workflow, not final UI.
// - All controls are non-functional placeholders unless otherwise noted.

const SectionHeader: React.FC<{ title: string; subtitle?: string }>=({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    <div className="mt-3 h-px w-full bg-gray-200" />
  </div>
);

const LabeledRow: React.FC<{ label: string; children?: React.ReactNode }>=({ label, children }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="text-sm">{children}</div>
  </div>
);

const StatPill: React.FC<{ label: string; value: string }>=({ label, value }) => (
  <div className="px-3 py-1 rounded-full text-xs bg-gray-100">{label}: <span className="font-semibold">{value}</span></div>
);

const Toggle: React.FC<{ label: string }>=({ label }) => (
  <label className="flex items-center gap-2 text-sm select-none">
    <input type="checkbox" className="h-4 w-4" />
    {label}
  </label>
);

const Select: React.FC<{ options: string[] }>=({ options }) => (
  <select className="text-sm border rounded-md px-2 py-1 bg-white">
    {options.map(o=> <option key={o}>{o}</option>)}
  </select>
);

const Slider: React.FC<{ min?: number; max?: number; step?: number }>=({ min=0, max=100, step=1 }) => (
  <input type="range" min={min} max={max} step={step} className="w-full" />
);

type BoxProps = React.PropsWithChildren<{
  title?: string;
  className?: string;
  right?: React.ReactNode;
}>;
const Box = ({ title, className, right, children }: BoxProps) => (
  <div className={`rounded-2xl border bg-white shadow-sm ${className ?? ""}`}>
    {(title || right) && (
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        {right}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const PPI: React.FC = () => {
  return (
    <div className="relative w-full aspect-square max-h-[400px] max-w-[400] mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-gray-300" />
      {/* Range rings */}
      <div className="absolute inset-6 rounded-full border border-gray-400" />
      <div className="absolute inset-12 rounded-full border border-gray-600" />
      <div className="absolute inset-20 rounded-full border border-gray-200" />
      {/* Bearing spokes */}
      {[0,45,90,135].map((deg)=> (
        <div key={deg} className="absolute inset-0" style={{ transform:`rotate(${deg}deg)`}}>
          <div className="absolute left-1/2 top-0 h-full w-px bg-gray-200 -translate-x-1/2" />
        </div>
      ))}
      {/* Sweep arc (placeholder) */}
      <div className="absolute inset-0 flex items-center justify-left">
        <div className="h-[4px] w-1/2 bg-black/30 origin-right" style={{ transform:"rotate(50deg)"}} />
      </div>
      {/* Targets (placeholders) */}
      <div className="absolute left-[70%] top-[40%] w-2 h-2 rounded-full bg-emerald-500" />
      <div className="absolute left-[35%] top-[65%] w-2 h-2 rounded-full bg-amber-500" />
      <div className="absolute left-[55%] top-[25%] w-2 h-2 rounded-full bg-sky-500" />
      {/* Heading marker */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[10px] bg-black text-white px-1 rounded">N</div>
    </div>
  );
};

const TracksTable: React.FC = () => (
  <div className="overflow-auto max-h-160">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2 pr-2">Track</th>
          <th className="py-2 pr-2">Source</th>
          <th className="py-2 pr-2">Lat</th>
          <th className="py-2 pr-2">Lon</th>
          <th className="py-2 pr-2">Course</th>
          <th className="py-2 pr-2">Speed</th>
          <th className="py-2 pr-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 12 }).map((_,i)=> (
          <tr key={i} className="border-t">
            <td className="py-2 pr-2">{100+i}</td>
            <td className="py-2 pr-2">CAT-010</td>
            <td className="py-2 pr-2">60.{i}°</td>
            <td className="py-2 pr-2">5.{i}°</td>
            <td className="py-2 pr-2">{(i*30)%360}°</td>
            <td className="py-2 pr-2">{5+i} m/s</td>
            <td className="py-2 pr-2">Tracked</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DNESMTable: React.FC = () => (
  <div className="overflow-auto max-h-48">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="py-2 pr-2">UTC</th>
          <th className="py-2 pr-2">Bearing (rel)</th>
          <th className="py-2 pr-2">Bearing (true)</th>
          <th className="py-2 pr-2">Freq (MHz)</th>
          <th className="py-2 pr-2">Level</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 7 }).map((_,i)=> (
          <tr key={i} className="border-t">
            <td className="py-2 pr-2">12:3{i}:10</td>
            <td className="py-2 pr-2">{110+i}.0</td>
            <td className="py-2 pr-2">{140+i}.0</td>
            <td className="py-2 pr-2">9300</td>
            <td className="py-2 pr-2">{3000 + i*12}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Login: React.FC = () => (
  <div className="max-w-md mx-auto">
    <SectionHeader title="Login" subtitle="Authenticate to your Dronnur radar" />
    <Box>
      <div className="space-y-3">
        <div className="grid grid-cols-3 items-center gap-3">
          <label className="text-sm text-gray-600 col-span-1">Username</label>
          <input className="col-span-2 border rounded-md px-2 py-1.5" placeholder="user" />
        </div>
        <div className="grid grid-cols-3 items-center gap-3">
          <label className="text-sm text-gray-600 col-span-1">Password</label>
          <input type="password" className="col-span-2 border rounded-md px-2 py-1.5" placeholder="••••" />
        </div>
        <button className="mt-2 w-full rounded-xl bg-black text-white py-2 text-sm">Sign in</button>
      </div>
    </Box>
    <SectionHeader title="Discovery" subtitle="Detected Dronnur units on the network" />
    <Box>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="col-span-2 space-y-1">
          <div>192.168.1.248:59623 — D2D — SN: 00012345</div>
          <div className="text-gray-500">FW: 1.2.0 | Services: CAT-010, CAT-240, AIS, ADS-B, Syslog</div>
        </div>
        <div className="flex items-center justify-end">
          <button className="rounded-lg border px-3 py-1.5">Connect</button>
        </div>
      </div>
    </Box>
  </div>
);

const Dashboard: React.FC = () => (
  <div className="grid grid-cols-36 gap-4">
    <div className="col-span-16">
      <Box title="Plan Position Indicator (PPI)" right={<div className="flex gap-2"> <StatPill label="Range" value="18 km"/> <StatPill label="North" value="Up"/> </div>}>
        <PPI />
      </Box>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Box title="DNESM Events" className="h-64"><DNESMTable /></Box>
        <Box title="System Logs" className="h-64"><div className="h-64 text-xs font-mono overflow-auto">[12:30:10] INFO Syslog enabled\n[12:30:11] WARN Antenna RPM limited in sector mode\n[12:30:15] INFO External INS active...</div></Box>
      </div>
    </div>
    <div className="col-span-10 space-y-4">
      <Box title="System Status" className="">
        <div className="flex mb-2">
          <StatPill label="Tx Mode" value="Surveillance" />
          <StatPill label="Tx Power" value="10" />
          <StatPill label="RPM" value="10.0" />
          <StatPill label="Tilt" value="0°" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Box title="Sensors" className="col-span-2">
            <LabeledRow label="GPS Source">External GNS</LabeledRow>
            <LabeledRow label="INS Source">External INS</LabeledRow>
            <LabeledRow label="Gyro Heading">132.5°</LabeledRow>
          </Box>
          <Box title="Modules Temps"className="col-span-2">
            <LabeledRow label="Processor">32°C</LabeledRow>
            <LabeledRow label="RF Converter">33°C</LabeledRow>
            <LabeledRow label="Power Amp">35°C</LabeledRow>
            <LabeledRow label="Clock Gen">31°C</LabeledRow>
          </Box>
        </div>
      </Box>
      <Box title="Selected Target" className="h-56">
        <div className="text-sm space-y-1">
          <div>ID: 1082 | Source: CAT-010</div>
          <div>Lat/Lon: 60.5 / 5.1</div>
          <div>Course: 210° | Speed: 13.2 m/s</div>
          <div>Status: Tracked | MMSI: —</div>
        </div>
      </Box>
    </div>
    <div className="col-span-10">
      <Box title="Active Tracks" className="h-187"><TracksTable /></Box>
    </div>
  </div>
);

const Antenna: React.FC = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-8">
      <Box title="Antenna Controls">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <LabeledRow label="Rotation Mode"><Select options={["CW","CCW","Sector","Stop & Stare","Off"]}/></LabeledRow>
            <LabeledRow label="RPM (1–30)"><div className="w-48"><Slider min={1} max={30} step={0.1} /></div></LabeledRow>
            <LabeledRow label="Tilt (–10° to +20°)"><div className="w-48"><Slider min={-10} max={20} step={0.5} /></div></LabeledRow>
            <div className="flex gap-2">
              <button className="rounded-lg bg-black text-white px-3 py-1.5 text-sm">Start</button>
              <button className="rounded-lg border px-3 py-1.5 text-sm">Stop</button>
            </div>
          </div>
          <div className="space-y-3">
            <SectionHeader title="Azimuth Calibration" />
            <LabeledRow label="Offset (°)"><div className="w-48"><Slider min={0} max={360} step={0.1} /></div></LabeledRow>
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1.5 text-sm">Preview</button>
              <button className="rounded-lg bg-black text-white px-3 py-1.5 text-sm">Store</button>
            </div>
          </div>
        </div>
      </Box>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Box title="Sector Scan (up to 3)">
          <div className="grid grid-cols-4 gap-3 text-sm items-center">
            <span>Start</span><input className="border rounded px-2 py-1" placeholder="-20" />
            <span>Stop</span><input className="border rounded px-2 py-1" placeholder="20" />
            <span>True/Rel</span><Select options={["relative","true"]} />
            <span>Scans</span><input className="border rounded px-2 py-1" placeholder="0" />
          </div>
        </Box>
        <Box title="Sector Blanking (up to 3)">
          <div className="grid grid-cols-4 gap-3 text-sm items-center">
            <Toggle label="Active" />
            <span>Start</span><input className="border rounded px-2 py-1" placeholder="0" />
            <span>Stop</span><input className="border rounded px-2 py-1" placeholder="20" />
          </div>
        </Box>
      </div>
    </div>
    <div className="col-span-4">
      <Box title="Preview">
        <div className="aspect-square">
          <PPI />
        </div>
      </Box>
    </div>
  </div>
);

const ModesTx: React.FC = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-7">
      <Box title="Mode Selection">
        <div className="grid grid-cols-3 gap-3">
          {["Surveillance","Long Range","LPI","ESM","NAV","Drone","Off"].map(m => (
            <button key={m} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">{m}</button>
          ))}
        </div>
      </Box>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Box title="Transmission">
          <LabeledRow label="Tx Power (1–20)"><div className="w-48"><Slider min={1} max={20} step={1} /></div></LabeledRow>
          <LabeledRow label="Range"><Select options={["12 km","18 km","24 km"]} /></LabeledRow>
        </Box>
        <Box title="Startup Behavior">
          <div className="flex gap-2">
            {["Skip","Position","Full Scan"].map(b => (
              <button key={b} className="rounded-lg border px-3 py-1.5 text-sm">{b}</button>
            ))}
          </div>
        </Box>
      </div>
    </div>
    <div className="col-span-5">
      <Box title="Mode Notes">
        <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
          <li>Surveillance: tracks to ~19 km</li>
          <li>Long Range: tracks to ~38 km</li>
          <li>LPI: reduced peak power & RPM</li>
          <li>ESM: X-band emissions events</li>
          <li>NAV: CFAR off for static bins (~10 km)</li>
          <li>Drone: small UAS detection up to ~5 km</li>
        </ul>
      </Box>
    </div>
  </div>
);

const Services: React.FC = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-6 space-y-4">
      <Box title="Services">
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Asterix CAT-010 (Tracks)" />
          <Toggle label="Asterix CAT-240 (Video)" />
          <Toggle label="Asterix CAT-253 (Ctl/Status)" />
          <Toggle label="AIS Internal" />
          <Toggle label="ADS-B Internal" />
          <Toggle label="NMEA TTM" />
          <Toggle label="DNESM Events" />
          <Toggle label="Syslog" />
        </div>
      </Box>
      <Box title="External Inputs">
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="External GNS (GPS)" />
          <Toggle label="External INS" />
        </div>
      </Box>
    </div>
    <div className="col-span-6">
      <Box title="Network & Endpoints">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-5 gap-2 items-center">
            <span>Service</span>
            <span>Enabled</span>
            <span>IP</span>
            <span>Port</span>
            <span>Protocol</span>
          </div>
          {[
            { s:"CAT-010", ip:"225.0.0.5", port:"4445", proto:"UDP" },
            { s:"CAT-240", ip:"225.0.0.6", port:"4446", proto:"UDP" },
            { s:"Syslog", ip:"225.0.0.9", port:"514", proto:"UDP" },
          ].map((row, i)=> (
            <div key={i} className="grid grid-cols-5 gap-2 items-center">
              <span>{row.s}</span>
              <input type="checkbox" />
              <input defaultValue={row.ip} className="border rounded px-2 py-1" />
              <input defaultValue={row.port} className="border rounded px-2 py-1" />
              <Select options={["UDP","TCP"]} />
            </div>
          ))}
        </div>
      </Box>
    </div>
  </div>
);

const DataViews: React.FC = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-7">
      <Box title="CAT-240 Video (Wireframe)">
        <div className="h-[360px] bg-gray-50 rounded-xl border flex items-center justify-center text-sm text-gray-500">
          Heatmap placeholder (Range bins × Doppler bins)
        </div>
      </Box>
    </div>
    <div className="col-span-5">
      <Box title="CAT-010 Tracks"><TracksTable /></Box>
    </div>
  </div>
);

const Maintenance: React.FC = () => (
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-6 space-y-4">
      <Box title="Health & Firmware">
        <LabeledRow label="Processor Temp">32°C</LabeledRow>
        <LabeledRow label="RF Converter Temp">33°C</LabeledRow>
        <LabeledRow label="Power Amp Temp">35°C</LabeledRow>
        <LabeledRow label="Clock Gen Temp">31°C</LabeledRow>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>FW: 1.2.0</div>
          <div>Build: 0x0021</div>
        </div>
      </Box>
      <Box title="Configuration">
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm">Save Preset</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm">Load Preset</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm">Export</button>
        </div>
      </Box>
    </div>
    <div className="col-span-6 space-y-4">
      <Box title="Reset / Reboot (Guarded)">
        <p className="text-sm text-gray-600 mb-3">Factory reset and reboot controls must be double-confirmed and restricted.</p>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm">Reboot</button>
          <button className="rounded-lg border border-red-500 text-red-600 px-3 py-1.5 text-sm">Factory Reset</button>
        </div>
      </Box>
      <Box title="Syslog">
        <div className="h-[220px] overflow-auto text-xs font-mono bg-gray-50 rounded-md p-3 border">
          [12:30:10] INFO System OK\n[12:31:03] INFO External GNS source locked\n[12:32:40] WARN Antenna RPM limited to 12 in Sector mode
        </div>
      </Box>
    </div>
  </div>
);

const TabButton: React.FC<{ label: string; active: boolean; onClick: ()=>void }>=({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-3 py-2 rounded-xl text-sm border ${active ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>{label}</button>
);

export default function DronnurConsoleWireframe() {
  const tabs = ["Login","Dashboard","Antenna","Modes & Tx","Services","Data","Maintenance"] as const;
  const [active, setActive] = useState<(typeof tabs)[number]>("Dashboard");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      {/* <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black" />
            <div>
              <div className="text-sm font-semibold leading-4">Dronnur Radar Console</div>
              <div className="text-xs text-gray-500">Interactive Wireframe</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatPill label="Connected" value="192.168.1.248" />
            <StatPill label="Unit" value="SN 00012345" />
          </div>
        </div>
      </div> */}


      {/* Content */}
      <div className="max-w-10xl mx-auto px-4 py-4">
        
        {/* Tabs */}
        <div className="flex justify-end gap-2 mb-5">
          <div className="flex flex-grow items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black" />
            <div>
              <div className="text-sm font-semibold leading-4">Dronnur Radar Console</div>
              <div className="text-xs text-gray-500">Interactive Wireframe</div>
            </div>
          </div>
          {tabs.map(t => (
            <TabButton key={t} label={t} active={active===t} onClick={()=>setActive(t)} />
          ))}
          <div className="flex flex-col items-center">
            <StatPill label="Connected" value="192.168.1.248" />
            <StatPill label="Unit" value="SN 00012345" />
          </div>
        </div>

        {/* Pages */}
        <div className="space-y-4">
          {active === "Login" && <Login />}
          {active === "Dashboard" && <Dashboard />}
          {active === "Antenna" && <Antenna />}
          {active === "Modes & Tx" && <ModesTx />}
          {active === "Services" && <Services />}
          {active === "Data" && <DataViews />}
          {active === "Maintenance" && <Maintenance />}
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-gray-500">Wireframe v1 · For layout discussion only</div>
    </div>
  );
}
