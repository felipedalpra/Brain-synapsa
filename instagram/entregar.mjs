#!/usr/bin/env node
// Entrega um post renderizado na fila do Brain (aba Instagram da Central). Só enfileira: quem aprova é o Felipe.
// Uso: BRAIN_URL=https://… IG_TOKEN=… node instagram/entregar.mjs <pasta-do-post>
//      node instagram/entregar.mjs --contexto     (mostra os temas já feitos, para não repetir)
import fs from "node:fs";
import path from "node:path";

const base = (process.env.BRAIN_URL ?? "").replace(/\/+$/, ""), token = process.env.IG_TOKEN ?? "";
if (!base || !token) { console.error("Defina BRAIN_URL e IG_TOKEN."); process.exit(1); }
const chamar = async (rota, init = {}) => {
  const r = await fetch(`${base}${rota}`, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error(`Brain recusou (${r.status}): ${j.error ?? JSON.stringify(j)}`); process.exit(3); }
  return j;
};
if (process.argv[2] === "--contexto") { console.log(JSON.stringify(await chamar("/api/instagram/contexto"), null, 1)); process.exit(0); }

const pasta = path.resolve(process.argv[2] ?? ".");
const post = JSON.parse(fs.readFileSync(path.join(pasta, "post.json"), "utf8"));
const arquivos = fs.readdirSync(pasta).filter((f) => /^slide-\d+\.jpg$/.test(f)).sort();
if (arquivos.length !== post.slides.length) { console.error(`Há ${arquivos.length} imagens para ${post.slides.length} slides: rode o render.mjs de novo.`); process.exit(1); }
for (const k of ["tema", "pilar", "maturidade", "legenda", "chave"]) if (!post[k]) { console.error(`Falta "${k}" no post.json.`); process.exit(1); }
const textos = post.slides.map((s) => [s.etiqueta, s.titulo, s.texto, s.numero, s.acao, ...(s.itens ?? []).map((i) => (typeof i === "string" ? i : `${i.titulo} ${i.texto ?? ""}`))].filter(Boolean).join(" ")).join("\n");
const r = await chamar("/api/instagram/entrega", { method: "POST", body: JSON.stringify({
  chave: post.chave, tema: post.tema, pilar: post.pilar, maturidade: post.maturidade, legenda: post.legenda, creditos: post.creditos ?? "", agendar_para: post.agendar_para ?? "", textos,
  slides: arquivos.map((f) => fs.readFileSync(path.join(pasta, f)).toString("base64")),
}) });
console.log(`Na fila do Brain: ${r.id} (${r.status}), agendado para ${new Date(r.agendadoPara).toISOString()}.`);
