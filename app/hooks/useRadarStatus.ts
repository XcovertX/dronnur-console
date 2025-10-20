// app/hooks/useRadarStatus.ts
import { useEffect, useRef, useState } from "react";

export type RadarStatus = {
  raw?: string;
  json?: any;
  error?: string;
  at: number;
};

export function useRadarStatus(params: {
  host: string; port: number;
  interval?: number; request?: string; mode?: "poll" | "push";
} | null) {
  const [status, setStatus] = useState<RadarStatus | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!params) return;
    const qs = new URLSearchParams({
      host: params.host,
      port: String(params.port),
      ...(params.interval ? { interval: String(params.interval) } : {}),
      ...(params.request ? { request: params.request } : {}),
      ...(params.mode ? { mode: params.mode } : {}),
    });
    const es = new EventSource(`/api/status/stream?${qs.toString()}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setStatus({ ...data, at: Date.now() });
      } catch {
        setStatus({ raw: ev.data, at: Date.now() });
      }
    };
    es.onerror = () => {
      // keep-alive; SSE retries automatically
    };
    return () => { es.close(); esRef.current = null; };
  }, [params?.host, params?.port, params?.interval, params?.request, params?.mode]);

  return status;
}
