import { sendViaInfoPort } from "@/app/lib/d2d59623";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Safety: block Tx unless ALLOW_TX=true
function guard(body: any) {
  const allow = (process.env.ALLOW_TX ?? "false").toLowerCase() === "true";
  const tx = String(body?.TxMode ?? "").toLowerCase();
  if (!allow && tx && tx !== "off") {
    throw new Error(`Blocked TxMode="${body.TxMode}". Set ALLOW_TX=true to permit.`);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    guard(body);
    const resp = await sendViaInfoPort(body, { retries: 1 });
    return new Response(resp, { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e: any) {
    return new Response(`error: ${e.message ?? e}`, { status: 400 });
  }
}
