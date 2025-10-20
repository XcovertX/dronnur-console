// app/hooks/useDiscovery.ts
import { useEffect, useState } from "react";

export type RadarInfo = { infoHost: string; infoPort: number; infoAddress: string };

export function useDiscovery(iface: string) {
  const [devices, setDevices] = useState<RadarInfo[]>([]);
  const [selected, setSelected] = useState<RadarInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/discovery/scan?iface=${encodeURIComponent(iface)}`);
        // Always read as text, then try JSON
        const txt = await resp.text();
        let data: any = {};
        try { data = JSON.parse(txt || "{}"); }
        catch {
          // Not JSON (e.g., Next 500 HTML). Record a helpful error.
          throw new Error(`Discovery returned non-JSON (${resp.status}): ${txt?.slice(0,120)}`);
        }

        const list: RadarInfo[] = Array.isArray(data.devices)
          ? data.devices
              .filter((d: any) => d?.infoHost && d?.infoPort)
              .map((d: any) => ({
                infoHost: String(d.infoHost),
                infoPort: Number(d.infoPort),
                infoAddress: String(d.infoAddress ?? `${d.infoHost}:${d.infoPort}`),
              }))
          : [];

        if (!alive) return;
        setDevices(list);
        if (list.length && !selected) setSelected(list[0]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? String(e));
        setDevices([]);
        setSelected(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [iface]);

  return { devices, selected, setSelected, loading, error };
}
