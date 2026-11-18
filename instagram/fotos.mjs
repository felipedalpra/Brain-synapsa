#!/usr/bin/env node
// Baixa fotos de PESSOAS para o post do dia, uma diferente para cada slide que vai ter foto.
// Uso: node instagram/fotos.mjs <pasta-do-post> <quantas> "<palavras-chave em português ou inglês>" [v|h]
//   ex.: node instagram/fotos.mjs /tmp/ig/2026-11-18 4 "consultorio conversa estudo"
// Com PEXELS_KEY no ambiente usa a busca da API do Pexels (resultado novo todo dia); sem a chave, ou se a API falhar,
// usa o catálogo curado em instagram/fotos.json (fotos de pessoas já olhadas, giradas pelo dia do ano).
// Grava foto-1.jpg, foto-2.jpg… e fotos.json na pasta do post com fotógrafo e foco sugerido. Olhe cada imagem antes de usar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const [pastaArg, nArg, termosArg = "", orientArg = ""] = process.argv.slice(2);
if (!pastaArg || !nArg) { console.error('Uso: node instagram/fotos.mjs <pasta> <quantas> "<palavras-chave>" [v|h]'); process.exit(1); }
const pasta = path.resolve(pastaArg), n = Math.max(1, Math.min(8, Number(nArg) || 3));
fs.mkdirSync(pasta, { recursive: true });
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const termos = semAcento(termosArg).split(/[\s,;]+/).filter((t) => t.length > 2);
const dia = Math.floor(Date.now() / 86400000);
const url = (id, w = 1400) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

async function baixar(id, destino, u = url(id)) {
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length < 20000) throw new Error("imagem pequena demais");
  fs.writeFileSync(destino, b);
}

let escolhidas = [];
const chave = process.env.PEXELS_KEY;
if (chave && termos.length) {
  try {
    // a API pede busca em inglês: se vier em português, o catálogo cobre; aqui usa os termos como vieram
    const q = encodeURIComponent(termosArg.trim());
    const pagina = 1 + (dia % 4);
    const r = await fetch(`https://api.pexels.com/v1/search?query=${q}&orientation=${orientArg === "h" ? "landscape" : "portrait"}&size=large&per_page=40&page=${pagina}`, { headers: { Authorization: chave }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const j = await r.json();
    const boas = (j.photos ?? []).filter((f) => !/child|kid|baby|boy|girl\b|teen/i.test(f.alt ?? ""));
    for (let k = 0; k < boas.length && escolhidas.length < n; k++) {
      const f = boas[(k * 7 + dia) % boas.length];
      if (escolhidas.some((e) => e.id === f.id)) continue;
      escolhidas.push({ id: f.id, o: f.height >= f.width ? "v" : "h", foco: "50% 40%", credito: f.photographer ?? "Pexels", u: f.src?.large2x ?? url(f.id) });
    }
    if (escolhidas.length) console.log(`Pexels API: ${escolhidas.length} fotos.`);
  } catch (e) { console.error(`API do Pexels indisponível (${e.message}); uso o catálogo.`); escolhidas = []; }
}
if (escolhidas.length < n) {
  const cat = JSON.parse(fs.readFileSync(path.join(AQUI, "fotos.json"), "utf8"));
  const pontos = (f) => termos.reduce((s, t) => s + (f.tags.some((g) => semAcento(g).includes(t) || t.includes(semAcento(g))) ? 1 : 0), 0) + (orientArg && f.o === orientArg ? 0.5 : 0);
  // ordena por afinidade; entre as melhores gira pelo dia para não repetir foto em dias seguidos
  const ord = cat.map((f) => ({ f, p: pontos(f) })).sort((a, b) => b.p - a.p);
  const topo = ord.filter((x) => x.p >= (ord[0]?.p ?? 0) - 1).map((x) => x.f);
  const pool = topo.length >= n ? topo : ord.slice(0, Math.max(n, 10)).map((x) => x.f);
  for (let k = 0; escolhidas.length < n && k < pool.length * 2; k++) {
    const f = pool[(dia * 3 + k * 5) % pool.length];
    if (!escolhidas.some((e) => e.id === f.id)) escolhidas.push({ ...f, u: url(f.id) });
  }
}
const saida = [];
for (const [k, f] of escolhidas.entries()) {
  const arq = `foto-${k + 1}.jpg`;
  try { await baixar(f.id, path.join(pasta, arq), f.u); saida.push({ arquivo: arq, id: f.id, orientacao: f.o, foco: f.foco, credito: f.credito }); console.log(`${arq}  (${f.o === "v" ? "vertical" : "horizontal"}, foco sugerido ${f.foco}, foto de ${f.credito})`); }
  catch (e) { console.error(`falhou ${f.id}: ${e.message}`); }
}
if (!saida.length) { console.error("Nenhuma foto baixada. Faça o post sem foto só se isso se repetir."); process.exit(2); }
fs.writeFileSync(path.join(pasta, "fotos.json"), JSON.stringify(saida, null, 1));
console.log(`\nCréditos: ${[...new Set(saida.map((s) => s.credito))].join(", ")} / Pexels`);
