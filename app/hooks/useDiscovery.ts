// hooks/useDiscovery.ts
import { useEffect, useState } from "react";

export type RadarInfo = { infoHost: string; infoPort: number; infoAddress: string };

export function useDiscovery(iface: string) {
  const [devices, setDevices] = useState<RadarInfo[]>([]);
  const [selected, setSelected] = useState<RadarInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/discovery/scan?iface=${encodeURIComponent(iface)}`);
        const j = await r.json();
        if (!alive) return;
        const list: RadarInfo[] = (j.devices || [])
          .filter((d: any) => d.infoHost && d.infoPort)
          .map((d: any) => ({ infoHost: d.infoHost, infoPort: d.infoPort, infoAddress: d.infoAddress }));
        setDevices(list);
        if (list.length && !selected) setSelected(list[0]); // auto-pick first
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [iface]);

  return { devices, selected, setSelected, loading };
}
