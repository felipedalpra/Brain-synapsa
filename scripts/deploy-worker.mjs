// Publica o Worker synapsa-brain sem tocar nos segredos nem nos assets (Central) já publicados.
// Uso: CLOUDFLARE_API_TOKEN=... node scripts/deploy-worker.mjs [--central [arquivo.html]]
//   sem --central: só o Worker (a Central publicada fica como está)
//   com --central: também publica a Central (padrão: apps/central/dist/index.html;
//                  para voltar à versão guardada: --central apps/central/producao/index.html)
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { blake3 } from "@noble/hashes/blake3.js";

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "261dde5cf4e3748f8658ca81d312c324";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!TOKEN) { console.error("Defina CLOUDFLARE_API_TOKEN"); process.exit(1); }

await build({
  entryPoints: ["apps/edge/src/index.ts"],
  bundle: true, format: "esm", target: "es2022", platform: "neutral",
  mainFields: ["module", "main"], sourcemap: true, outfile: "out/index.js",
  alias: { "@brain/core": "./packages/core/src/index.ts", "@brain/shared": "./packages/shared/src/index.ts" },
  external: ["cloudflare:workers", "node:*"], logLevel: "warning",
});

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const ci = process.argv.indexOf("--central");
let assetsJwt = null;
if (ci >= 0) {
  const arq = process.argv[ci + 1]?.endsWith(".html") ? process.argv[ci + 1] : "apps/central/dist/index.html";
  const b64 = readFileSync(arq).toString("base64");
  const hash = Buffer.from(blake3(new TextEncoder().encode(b64 + "html"))).toString("hex").slice(0, 32);
  const size = readFileSync(arq).length;
  const ses = await (await fetch(`${API}/workers/scripts/synapsa-brain/assets-upload-session`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ manifest: { "/index.html": { hash, size } } }),
  })).json();
  if (!ses.success) { console.error("sessão de assets:", JSON.stringify(ses.errors)); process.exit(1); }
  assetsJwt = ses.result.jwt;
  if (ses.result.buckets?.length) {
    const f = new FormData();
    f.append(hash, new Blob([b64], { type: "text/html" }), hash);
    const up = await (await fetch(`${API}/workers/assets/upload?base64=true`, { method: "POST", headers: { Authorization: `Bearer ${assetsJwt}` }, body: f })).json();
    if (!up.success) { console.error("upload de assets:", JSON.stringify(up.errors)); process.exit(1); }
    assetsJwt = up.result.jwt ?? assetsJwt;
  }
  console.log("Central enviada:", arq, `(${size} bytes)`);
}

const metadata = {
  main_module: "index.js",
  compatibility_date: "2026-09-01",
  compatibility_flags: ["nodejs_compat"],
  keep_bindings: ["secret_text", "plain_text", "json", "secret_key", "durable_object_namespace"],
  ...(assetsJwt
    ? { assets: { jwt: assetsJwt, config: { run_worker_first: true } }, bindings: [{ type: "assets", name: "ASSETS" }] }
    : { keep_assets: true, keep_bindings: ["secret_text", "plain_text", "json", "secret_key", "durable_object_namespace", "assets"] }),
};
const form = new FormData();
form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
form.append("index.js", new Blob([readFileSync("out/index.js")], { type: "application/javascript+module" }), "index.js");
form.append("index.js.map", new Blob([readFileSync("out/index.js.map")], { type: "application/source-map" }), "index.js.map");

const r = await fetch(`${API}/workers/scripts/synapsa-brain`, {
  method: "PUT", headers: { Authorization: `Bearer ${TOKEN}` }, body: form,
});
const j = await r.json();
if (!j.success) { console.error(JSON.stringify(j.errors)); process.exit(1); }
console.log("Worker publicado. versão:", j.result?.etag ?? j.result?.id ?? "ok");
