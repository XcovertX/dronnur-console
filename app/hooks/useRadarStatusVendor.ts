// app/hooks/useRadarStatusVendor.ts
import { useEffect, useState } from "react";
export function useRadarStatusVendor(host = "192.168.1.248") {
  const [st, setSt] = useState<any>(null);
  useEffect(() => {
    const es = new EventSource(`/api/status/vendor/stream?host=${host}&interval=2000`);
    es.onmessage = (ev) => { try { setSt(JSON.parse(ev.data)); } catch {} };
    return () => es.close();
  }, [host]);
  return st; // { ok, json, raw, header, url, at }
}