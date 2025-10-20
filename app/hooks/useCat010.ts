// hooks/useCat010.ts
import { useEffect, useRef, useState } from "react";

export function useCat010(params: { group: string; port: number; iface: string } | null) {
  const [frames, setFrames] = useState(0);
  const lastLenRef = useRef(0);
  const [lastFrom, setLastFrom] = useState<string>("");

  useEffect(() => {
    if (!params) return;
    const qs = new URLSearchParams({
      group: params.group,
      port: String(params.port),
      iface: params.iface,
    });
    const es = new EventSource(`/api/cat010/stream?${qs.toString()}`);
    es.onmessage = (ev) => {
      try {
        const { len, from } = JSON.parse(ev.data);
        lastLenRef.current = len ?? 0;
        if (from) setLastFrom(from);
        setFrames((c) => c + 1);
      } catch {}
    };
    es.onerror = () => { /* keep-alive; SSE will reconnect */ };
    return () => es.close();
  }, [params?.group, params?.port, params?.iface]);

  return { frames, lastLen: lastLenRef.current, lastFrom };
}
