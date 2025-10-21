export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(body: any, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json" }});
}
function withTimeout(url: string, ms: number, init?: RequestInit) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...init, signal: ac.signal })
    .finally(() => clearTimeout(t));
}

/** Try to parse JSON, else attempt to extract a JSON block from HTML. */
async function parseStatus(resp: Response) {
  const text = await resp.text();
  try { return { raw: text, json: JSON.parse(text) }; } catch {}
  // crude extractor: first { ... } block
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return { raw: text, json: JSON.parse(m[0]) }; } catch {}
  }
  return { raw: text };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host") || "192.168.1.248";
  const path = searchParams.get("path") || "/status.php";
  const timeoutMs = Number(searchParams.get("timeout") || 3000);

  const url = `http://${host}${path}`;
  try {
    const r = await withTimeout(url, timeoutMs, {
      // Add headers if their PHP requires a referer or auth cookie
      headers: { "Accept": "application/json, text/html;q=0.9,*/*;q=0.8" },
    });
    if (!r.ok) return ok({ ok:false, error:`HTTP ${r.status}`, url }, 502);
    const out = await parseStatus(r);
    return ok({ ok:true, url, ...out });
  } catch (e: any) {
    return ok({ ok:false, error:String(e?.message || e), url }, 502);
  }
}
