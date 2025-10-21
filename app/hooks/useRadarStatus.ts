// app/hooks/useRadarStatus.ts
import { useEffect, useState } from "react";
export function useRadarStatus() {
  const [st, setSt] = useState<any>(null);
  useEffect(() => {
    const es = new EventSource("/api/status/stream");
    es.onmessage = (ev) => { try { setSt(JSON.parse(ev.data)); } catch {} };
    return () => es.close();
  }, []);
  return st; // {ok, json, raw, at} or {ok, info} / {ok, heartbeat}
}