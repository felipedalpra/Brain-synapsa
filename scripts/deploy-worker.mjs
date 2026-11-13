// Publica o Worker synapsa-brain sem tocar nos segredos nem nos assets (Central) já publicados.
// Uso: CLOUDFLARE_API_TOKEN=... node scripts/deploy-worker.mjs   (opcional: CLOUDFLARE_ACCOUNT_ID)
import { build } from "esbuild";
import { readFileSync } from "node:fs";

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

const metadata = {
  main_module: "index.js",
  compatibility_date: "2026-09-01",
  compatibility_flags: ["nodejs_compat"],
  keep_bindings: ["secret_text", "plain_text", "json", "secret_key", "durable_object_namespace", "assets"],
  keep_assets: true,
};
const form = new FormData();
form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
form.append("index.js", new Blob([readFileSync("out/index.js")], { type: "application/javascript+module" }), "index.js");
form.append("index.js.map", new Blob([readFileSync("out/index.js.map")], { type: "application/source-map" }), "index.js.map");

const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/synapsa-brain`, {
  method: "PUT", headers: { Authorization: `Bearer ${TOKEN}` }, body: form,
});
const j = await r.json();
if (!j.success) { console.error(JSON.stringify(j.errors)); process.exit(1); }
console.log("Worker publicado. versão:", j.result?.etag ?? j.result?.id ?? "ok");
