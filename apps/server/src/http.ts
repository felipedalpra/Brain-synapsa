import { createServer, type IncomingMessage, type Server } from "node:http";
import { createHandler, type Services } from "@brain/core";

export type { Services };

/** Adaptador Node: converte para Request/Response e cuida do SSE (/api/events), que só existe aqui. */
export function createApp(svc: Services, port = 8787): Server {
  const { brain } = svc;
  const handle = createHandler({ ...svc, sse: true, extraOrigins: ["http://localhost:5173", "http://127.0.0.1:5173", ...(svc.extraOrigins ?? [])] });

  const toRequest = async (req: IncomingMessage): Promise<Request> => {
    const url = `http://${req.headers.host ?? `localhost:${port}`}${req.url ?? "/"}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
    if (req.method === "GET" || req.method === "HEAD") return new Request(url, { method: req.method, headers });
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const c of req) {
      size += (c as Buffer).length;
      if (size > 64_000) break;
      chunks.push(c as Buffer);
    }
    return new Request(url, { method: req.method, headers, body: Buffer.concat(chunks) });
  };

  return createServer(async (req, res) => {
    try {
      const r = await toRequest(req);
      const u = new URL(r.url);
      if (req.method === "GET" && u.pathname === "/api/events") {
        const origin = req.headers.origin;
        if (origin && origin !== u.origin && !["http://localhost:5173", "http://127.0.0.1:5173"].includes(origin)) {
          res.writeHead(403, { "content-type": "application/json" }).end(JSON.stringify({ error: "origem não permitida" }));
          return;
        }
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive", ...(origin ? { "access-control-allow-origin": origin } : {}) });
        const send = () => res.write(`event: change\ndata: ${Date.now()}\n\n`);
        let t: NodeJS.Timeout | undefined;
        const onChange = () => {
          clearTimeout(t);
          t = setTimeout(send, 60);
        };
        brain.on("change", onChange);
        const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
        req.on("close", () => {
          brain.off("change", onChange);
          clearInterval(ping);
          clearTimeout(t);
        });
        res.write("retry: 2000\n\n");
        return;
      }
      const out = (await handle(r)) ?? new Response(JSON.stringify({ error: "não encontrado" }), { status: 404, headers: { "content-type": "application/json" } });
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: "erro interno" }));
    }
  });
}
