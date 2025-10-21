export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(body: any, status=200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fetchText(url: string, timeoutMs=3000, headers: Record<string,string> = {}) {
  const ac = new AbortController();
  const t = setTimeout(()=>ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ac.signal, headers });
    const text = await r.text();
    return { status: r.status, ok: r.ok, text };
  } finally { clearTimeout(t); }
}

async function fetchJson(url: string, timeoutMs=3000, headers: Record<string,string> = {}) {
  const ac = new AbortController();
  const t = setTimeout(()=>ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ac.signal, headers });
    const text = await r.text();
    try { return { ok: true, json: JSON.parse(text), raw: text, status: r.status }; }
    catch { return { ok: false, raw: text, status: r.status, error: "not JSON" }; }
  } finally { clearTimeout(t); }
}

function makeAbs(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) {
    // relative → assume relative to /
    return new URL(path, base).toString();
  }
  const u = new URL(base);
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.toString();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const jsPath = searchParams.get("js") || "/d2d.js";
  const base = `http://${host}`;

  // 1) Get d2d.js
  const jsUrl = makeAbs(base, jsPath);
  let js: string | null = null;
  try {
    const r = await fetchText(jsUrl, 4000, { "Accept": "*/*" });
    if (!r.ok) return ok({ ok:false, step:"fetch_js", error:`HTTP ${r.status}`, url: jsUrl }, 502);
    js = r.text;
  } catch (e:any) {
    return ok({ ok:false, step:"fetch_js", error:String(e?.message||e), url: jsUrl }, 502);
  }

  // 2) Heuristics: pull likely endpoints from the JS
  const candidates = new Set<string>();

  // Common literal paths in JS
  const pathRegex = /['"`]\/[A-Za-z0-9_\-/.?=&%]+['"`]/g;
  for (const m of js.match(pathRegex) || []) {
    const s = m.slice(1, -1);
    candidates.add(makeAbs(base, s));
  }
  // fetch()/EventSource()/WebSocket patterns
  const fetchRegex = /fetch\(\s*['"`]([^'"`]+)['"`]/g;
  for (const m of js.matchAll(fetchRegex)) candidates.add(makeAbs(base, m[1]));
  const esRegex = /new\s+EventSource\(\s*['"`]([^'"`]+)['"`]/g;
  for (const m of js.matchAll(esRegex)) candidates.add(makeAbs(base, m[1]));
  const wsRegex = /new\s+WebSocket\(\s*['"`]([^'"`]+)['"`]/g;
  for (const m of js.matchAll(wsRegex)) candidates.add(makeAbs(base, m[1]));

  // Add sensible guesses if nothing obvious
  [
    "/status.json", "/runtime.json", "/api/status", "/api/runtime",
    "/status.php?json=1", "/d2d/status", "/d2d/runtime"
  ].forEach(p => candidates.add(makeAbs(base, p)));

  // 3) Try candidates until we get JSON
  const tried: Array<{url:string,status?:number,ok:boolean,error?:string}> = [];
  for (const url of candidates) {
    try {
      const res = await fetchJson(url, 3000, { "Accept":"application/json,*/*;q=0.8" });
      tried.push({ url, status: res.status, ok: !!res.ok, error: res.ok ? undefined : res.error });
      if (res.ok && res.json && typeof res.json === "object") {
        return ok({ ok:true, source:url, json:res.json, raw:res.raw, tried });
      }
    } catch (e:any) {
      tried.push({ url, ok:false, error:String(e?.message||e) });
    }
  }

  // 4) If we reach here, we didn't find a JSON endpoint
  return ok({ ok:false, error:"no JSON endpoint discovered from d2d.js", jsUrl, tried }, 502);
}
