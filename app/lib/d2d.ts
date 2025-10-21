// Robust D2D frame parser for TCP streams.
// Accepts chunks, buffers, and emits complete { header, bodyText, json } frames.

export type D2DHeader = {
  PROTOCOL?: string;
  VERSION?: string;
  TYPE?: string;
  LENGTH?: number;
  [k: string]: string | number | undefined;
};

export type D2DMessage = {
  headerText: string;
  header: D2DHeader;
  bodyText: string;   // exactly LENGTH bytes (UTF-8)
  json?: any;         // parsed JSON if possible
};

export class D2DParser {
  private buf: Buffer = Buffer.alloc(0);

  /** Push inbound TCP data into the parser; returns array of completed frames (may be empty). */
  push(chunk: Buffer): D2DMessage[] {
    this.buf = Buffer.concat([this.buf, chunk]);
    const out: D2DMessage[] = [];

    while (true) {
      // Find header/body separator: prefer \r\n\r\n, fallback to \n\n
      let sep = this.buf.indexOf(Buffer.from("\r\n\r\n"));
      let advance = 4;
      if (sep < 0) {
        sep = this.buf.indexOf(Buffer.from("\n\n"));
        advance = 2;
      }
      if (sep < 0) break; // need more data for header

      const headerText = this.buf.slice(0, sep).toString("utf8");
      const rest = this.buf.slice(sep + advance);

      // Parse header lines: KEY=VALUE (case-insensitive for LENGTH/PROTOCOL)
      const header: D2DHeader = {};
      for (const line of headerText.split(/\r?\n/)) {
        const m = line.match(/^\s*([^:=\s]+)\s*[:=]\s*(.+?)\s*$/);
        if (!m) continue;
        const k = m[1].toUpperCase();
        const v = m[2];
        if (k === "LENGTH") header.LENGTH = Number(v);
        else if (k === "PROTOCOL") header.PROTOCOL = v;
        else if (k === "VERSION") header.VERSION = v;
        else if (k === "TYPE") header.TYPE = v;
        else header[k] = v;
      }

      const N = header.LENGTH ?? NaN;
      if (!Number.isFinite(N)) {
        // Malformed header: drop just the header and try to resync
        this.buf = rest;
        continue;
      }
      if (rest.length < N) {
        // Wait for full body
        break;
      }

      const bodyBuf = rest.slice(0, N);
      const bodyText = bodyBuf.toString("utf8");
      // Advance buffer to after this frame
      this.buf = rest.slice(N);

      let json: any | undefined;
      try { json = JSON.parse(bodyText); } catch {}
      out.push({ headerText, header, bodyText, json });
    }

    return out;
  }
}

/** Build a D2D frame with a JSON body. */
export function d2dFrame(obj: object, extraHeaders?: Record<string,string>) {
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  const headLines = [
    "PROTOCOL=D2D",
    "VERSION=1.0",
    "TYPE=TEXT",
    `LENGTH=${body.length}`,
    ...(extraHeaders ? Object.entries(extraHeaders).map(([k,v]) => `${k}=${v}`) : []),
    "", // blank line
    "",
  ].join("\r\n");
  const head = Buffer.from(headLines, "utf8");
  return Buffer.concat([head, body]);
}
