import { readSnapshot } from "@/app/lib/d2d59623";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resp = await readSnapshot();
    return new Response(resp, { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e: any) {
    return new Response(`error: ${e.message ?? e}`, { status: 500 });
  }
}
