#!/usr/bin/env node
// Renderiza um post (post.json) em imagens JPEG 1080x1350 prontas para o Instagram.
// Uso: node instagram/render.mjs <pasta-do-post>     (lê <pasta>/post.json, grava <pasta>/slide-01.jpg…)
// Fotos: caminho relativo à pasta do post (baixe antes; veja PLAYBOOK.md). Prints: "prints/<nome>.jpg" (em instagram/assets).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
function playwright() {
  for (const p of ["playwright", path.join(execSync("npm root -g").toString().trim(), "playwright")]) { try { return require(p); } catch { /* tenta o próximo */ } }
  throw new Error("Playwright não encontrado: rode `npm i -g playwright && npx playwright install chromium`.");
}
const pasta = path.resolve(process.argv[2] ?? ".");
const post = JSON.parse(fs.readFileSync(path.join(pasta, "post.json"), "utf8"));
const uri = (arq) => {
  const p = arq.startsWith("prints/") || arq.startsWith("logo-") ? path.join(AQUI, "assets", arq) : path.join(pasta, arq);
  const ext = path.extname(p).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,${fs.readFileSync(p).toString("base64")}`;
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// **negrito** vira destaque de cor; quebra de linha vira <br>
const rico = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<em>$1</em>").replace(/\n/g, "<br>");

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px}
body{font-family:"Inter","Helvetica Neue",Arial,sans-serif;color:var(--tinta);-webkit-font-smoothing:antialiased;overflow:hidden}
.s{position:relative;width:1080px;height:1350px;padding:96px 88px 150px;display:flex;flex-direction:column;overflow:hidden}
.claro{background:var(--claro)}
.suave{background:var(--suave)}
.escuro{background:var(--escuro);color:#fff}
.marca{background:var(--marca);color:#fff}
/* os três círculos que se sobrepõem, do logo: única decoração da marca */
.orbes{position:absolute;pointer-events:none}
.orbes i{position:absolute;border-radius:50%;filter:blur(2px)}
.orbes i:nth-child(1){background:radial-gradient(circle at 35% 35%,#8FB0F5,#5F86E0)}
.orbes i:nth-child(2){background:radial-gradient(circle at 50% 40%,#fff,#E6E9FB);opacity:.9}
.orbes i:nth-child(3){background:radial-gradient(circle at 60% 40%,#C4A6F5,#9B74E6)}
.orbes.g{right:-150px;top:-170px;width:760px;height:420px;opacity:.5}
.orbes.g i{width:400px;height:400px;top:0}.orbes.g i:nth-child(1){left:0}.orbes.g i:nth-child(2){left:180px}.orbes.g i:nth-child(3){left:360px}
.escuro .orbes.g,.marca .orbes.g{opacity:.22}
h1{font-weight:800;font-size:92px;line-height:1.04;letter-spacing:-3px;text-wrap:balance}
h2{font-weight:800;font-size:72px;line-height:1.08;letter-spacing:-2px;text-wrap:balance}
p{font-size:41px;line-height:1.42;font-weight:400;color:var(--texto);text-wrap:pretty}
.escuro p,.marca p,.foto p{color:rgba(255,255,255,.86)}
em{font-style:normal;color:var(--acento)}
.escuro em,.foto em{color:var(--acento-claro)}
.marca em{color:#fff;text-decoration:underline;text-decoration-thickness:6px;text-underline-offset:10px;text-decoration-color:rgba(255,255,255,.55)}
.etiqueta{font-size:27px;font-weight:600;color:var(--acento);margin-bottom:34px}
.escuro .etiqueta,.marca .etiqueta,.foto .etiqueta{color:rgba(255,255,255,.8)}
.meio{margin:auto 0;position:relative;z-index:1}
.base{margin-top:auto}
/* rodapé: logo + posição no carrossel */
.pe{position:absolute;left:88px;right:88px;bottom:62px;display:flex;align-items:center;justify-content:space-between}
.pe img{height:46px}
.pe .pos{display:flex;gap:9px;align-items:center}
.pe .pos b{width:11px;height:11px;border-radius:50%;background:color-mix(in srgb,var(--acento) 24%,transparent)}
.pe .pos b.on{width:34px;border-radius:8px;background:var(--acento)}
.escuro .pe .pos b,.marca .pe .pos b,.foto .pe .pos b{background:rgba(255,255,255,.3)}
.escuro .pe .pos b.on,.marca .pe .pos b.on,.foto .pe .pos b.on{background:#fff}
/* capa com foto */
.foto{color:#fff;padding-bottom:170px}
.foto .bg{position:absolute;inset:0;background-size:cover}
.foto .veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,26,62,.28) 0%,rgba(26,26,62,.12) 30%,rgba(26,26,62,.86) 66%,rgba(26,26,62,.97) 100%)}
.foto .base{position:relative}
.foto h1{font-size:88px}
.foto p{margin-top:28px;font-size:36px}
.arraste{position:absolute;right:88px;top:84px;font-size:26px;font-weight:600;background:rgba(255,255,255,.16);backdrop-filter:blur(14px);border:1.5px solid rgba(255,255,255,.34);padding:12px 24px;border-radius:50px}
.capa h1+p{margin-top:34px}
/* lista */
ol,ul{list-style:none;display:flex;flex-direction:column;gap:30px;margin-top:52px}
li{display:flex;gap:26px;align-items:flex-start;font-size:36px;line-height:1.36;color:#3A4063}
li>span{flex:none;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-weight:700;font-size:30px;display:flex;align-items:center;justify-content:center;margin-top:-4px}
ul li>span{width:16px;height:16px;margin-top:17px;background:var(--acento)}
li strong{color:var(--tinta);font-weight:700;display:block}
li small{font-size:32px;color:#5A6088;display:block;margin-top:4px;line-height:1.36}
.escuro li,.escuro li small{color:rgba(255,255,255,.84)}.escuro li strong{color:#fff}
.cheia li{font-size:32px}.cheia li small{font-size:28.5px}.cheia ol,.cheia ul{gap:22px;margin-top:40px}.cheia h2{font-size:58px}
/* dado */
.numero{font-weight:800;font-size:230px;line-height:.95;letter-spacing:-9px;background:linear-gradient(135deg,var(--g1),var(--g2));-webkit-background-clip:text;color:transparent;margin-bottom:28px}
.fonte{font-size:25px;color:#6C7393;margin-top:36px}
/* print da plataforma */
.janela{margin-top:52px;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 24px 70px rgba(86,103,214,.28);border:1px solid #E0E2EB;align-self:center}
.janela .barra{height:44px;background:#EEF0F7;display:flex;gap:9px;align-items:center;padding-left:20px}
.janela .barra b{width:13px;height:13px;border-radius:50%;background:#CDD2E4}
.janela img{display:block;width:100%}
.selo{align-self:flex-start;font-size:24px;font-weight:700;border-radius:50px;padding:9px 22px;margin-bottom:30px;background:color-mix(in srgb,var(--acento) 14%,transparent);color:var(--acento)}
.selo.plano,.selo.piloto{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.4)}
.claro .selo.plano,.claro .selo.piloto,.suave .selo.plano,.suave .selo.piloto{background:#FFF3DC;color:#8A5A00;border:0}
/* fechamento */
.cta{align-items:flex-start;justify-content:center}
.cta .logo{height:84px;margin-bottom:64px}
.cta h2{font-size:74px}
.cta .acao{margin-top:56px;font-size:35px;font-weight:700;background:#fff;color:var(--acento-escuro);padding:24px 46px;border-radius:60px}
.cta .assin{position:absolute;left:88px;bottom:70px;font-size:28px;color:rgba(255,255,255,.85);font-weight:500}
/* fotos em outros layouts */
.fotoTopo{position:absolute;left:0;right:0;top:0;height:720px;background-size:cover;background-position:center}
.metade .fotoTopo{border-radius:0 0 76px 76px}
.moldura .fotoTopo{left:64px;right:64px;top:64px;height:700px;border-radius:60px;box-shadow:0 30px 70px rgba(26,26,62,.28)}
.metade,.moldura{padding-bottom:170px}
.metade .meio,.moldura .meio{margin:auto 0 0}
.metade h1,.moldura h1{font-size:80px}
.metade .arraste,.moldura .arraste{top:84px}
.comfoto{padding-top:540px}
.comfoto .orbes{display:none}
.comfoto .fotoTopo{height:480px;border-radius:0 0 64px 64px}
.comfoto h2{font-size:60px}
.comfoto p{font-size:36px}
.comfoto .meio{margin:0}
.medalhao{width:300px;height:300px;border-radius:50%;background-size:cover;background-position:center;margin-bottom:40px;box-shadow:0 0 0 10px color-mix(in srgb,var(--acento) 22%,transparent)}
.fotocheia{color:#fff;padding-bottom:170px}
.fotocheia .bg{position:absolute;inset:0;background-size:cover}
.fotocheia .veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,26,62,.2) 0%,rgba(26,26,62,.1) 30%,rgba(26,26,62,.88) 68%,rgba(26,26,62,.97) 100%)}
.fotocheia.topo{padding-top:150px}
.fotocheia.topo .veu{background:linear-gradient(180deg,rgba(26,26,62,.92) 0%,rgba(26,26,62,.7) 32%,rgba(26,26,62,.08) 64%,rgba(26,26,62,.2) 100%)}
.fotocheia .base,.fotocheia .alto{position:relative}
.fotocheia h2{font-size:78px}
.fotocheia p{color:rgba(255,255,255,.88);margin-top:26px;font-size:38px}
.fotocheia em{color:var(--acento-claro)}
.fotocheia .etiqueta{color:rgba(255,255,255,.82)}
.fotocheia .pe .pos b{background:rgba(255,255,255,.3)}.fotocheia .pe .pos b.on{background:#fff}
.cta .bgfoto{position:absolute;inset:0;background-size:cover;background-position:center}
.cta .veumarca{position:absolute;inset:0;background:linear-gradient(160deg,color-mix(in srgb,var(--g1) 80%,#101030) 0%,color-mix(in srgb,var(--g2) 78%,#101030) 100%);opacity:.9}
.cta.comfundo>*{position:relative}
.cta.comfundo>.bgfoto,.cta.comfundo>.veumarca{position:absolute}
.cta.comfundo>.assin{position:absolute}
`;


// Seis estilos que se revezam por dia (o dia do ano decide), para o feed não parecer sempre o mesmo.
// Cada um muda paleta, decoração, alinhamento e o formato padrão da capa. Todos mantêm as cores da marca como base.
const ESTILOS = {
  indigo: { v: "--claro:#F4F5FA;--suave:linear-gradient(135deg,#DCE4F8 0%,#EBE4F9 100%);--escuro:linear-gradient(135deg,#1A1A3E 0%,#2D2060 100%);--marca:linear-gradient(135deg,#6A8BD7 0%,#A38BDA 100%);--tinta:#222639;--texto:#4A5072;--acento:#5667D6;--acento-claro:#B9A6F0;--acento-escuro:#4B5BD0;--g1:#6A8BD7;--g2:#A38BDA", css: "", capa: "cheia" },
  aurora: { v: "--claro:#F8F3FF;--suave:linear-gradient(160deg,#E7DBFB 0%,#DCEBFB 100%);--escuro:linear-gradient(160deg,#241454 0%,#4B2A94 100%);--marca:linear-gradient(160deg,#A38BDA 0%,#6A8BD7 100%);--tinta:#26193F;--texto:#554A78;--acento:#7B4FD8;--acento-claro:#D2BDFB;--acento-escuro:#6A3FC4;--g1:#A38BDA;--g2:#6A8BD7", css: ".orbes.g{left:-210px;right:auto;top:auto;bottom:-120px;opacity:.42}.capa .meio,.capa .meio *{text-align:center}.capa .meio{align-items:center}h1{letter-spacing:-2px}", capa: "moldura" },
  oceano: { v: "--claro:#EEF6FB;--suave:linear-gradient(135deg,#D3E7F7 0%,#E5F0FA 100%);--escuro:linear-gradient(135deg,#0F2447 0%,#1B4A7A 100%);--marca:linear-gradient(135deg,#3F7FD6 0%,#6A8BD7 100%);--tinta:#12263F;--texto:#42607F;--acento:#2C6BC4;--acento-claro:#9CC6F5;--acento-escuro:#1F58A8;--g1:#4F8FE0;--g2:#7BA6E8", css: ".orbes.g{right:-260px;top:auto;bottom:-230px;opacity:.38;transform:rotate(-8deg)}.s{padding-left:96px;padding-right:96px}", capa: "metade" },
  lyra: { v: "--claro:#F2F8FA;--suave:linear-gradient(135deg,#DDF3EE 0%,#E6E9FB 100%);--escuro:linear-gradient(135deg,#171A4D 0%,#2B2E80 100%);--marca:linear-gradient(135deg,#6A8BD7 0%,#8F7AD9 100%);--tinta:#1B2240;--texto:#46507A;--acento:#5667D6;--acento-claro:#7CE3C0;--acento-escuro:#4B5BD0;--g1:#6A8BD7;--g2:#2FBF8F", css: ".orbes.g{left:auto;right:-120px;top:-60px;width:520px;opacity:.3}.etiqueta{color:#1E9F78}.escuro .etiqueta,.marca .etiqueta,.foto .etiqueta{color:rgba(255,255,255,.82)}.selo{background:rgba(47,191,143,.16);color:#17795A}", capa: "cheia" },
  grafite: { v: "--claro:#F1F2F6;--suave:linear-gradient(135deg,#E1E4EE 0%,#ECEAF6 100%);--escuro:linear-gradient(135deg,#15161F 0%,#262845 100%);--marca:linear-gradient(135deg,#4452C8 0%,#6A5AD0 100%);--tinta:#16171F;--texto:#464A60;--acento:#4452C8;--acento-claro:#A9B2F5;--acento-escuro:#3A47B4;--g1:#4452C8;--g2:#8F7AD9", css: ".orbes{display:none}.s{padding-top:110px}h1,h2{letter-spacing:-3px;font-weight:800}.etiqueta{text-transform:uppercase;letter-spacing:3px;font-size:23px}.metade .fotoTopo{border-radius:0}.janela{border-radius:6px}.cta .acao{border-radius:12px}", capa: "metade" },
  cremoso: { v: "--claro:#FBF7F2;--suave:linear-gradient(135deg,#F3E8F4 0%,#E6ECFA 100%);--escuro:linear-gradient(135deg,#2A1F4A 0%,#3C2A6E 100%);--marca:linear-gradient(135deg,#8E7BE0 0%,#C58ED8 100%);--tinta:#2B2236;--texto:#5B5068;--acento:#6B4BC8;--acento-claro:#D8C4F7;--acento-escuro:#5B3DB4;--g1:#8E7BE0;--g2:#C58ED8", css: ".orbes.g{left:50%;right:auto;top:-250px;transform:translateX(-50%);opacity:.35}.capa .meio,.capa .meio *{text-align:center}.capa .meio{align-items:center}.texto .meio h2{text-align:left}", capa: "moldura" },
};
const NOMES = Object.keys(ESTILOS);
const diaN = (() => { const m = String(post.chave ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : Math.floor(Date.now() / 86400000); })();
const estiloNome = ESTILOS[post.estilo] ? post.estilo : NOMES[diaN % NOMES.length];
const ESTILO = ESTILOS[estiloNome];
const CAPAS = ["cheia", "metade", "moldura"];
const capaPadrao = ["cheia", "metade", "moldura"].includes(post.capa_layout) ? post.capa_layout : ESTILO.capa;
console.log(`Estilo do dia: ${estiloNome}; capa: ${capaPadrao}`);

const SELO = { plano: "Visão de futuro: ainda não disponível", piloto: "Em piloto", existe: "Já disponível na Synapsa" };
function slide(s, i, n) {
  const fundo = s.fundo ?? (s.tipo === "cta" ? "marca" : "claro");
  const escuro = ["escuro", "marca"].includes(fundo) || (s.tipo === "capa" && s.foto && !["metade", "moldura"].includes(s.layout ?? capaPadrao)) || s.tipo === "foto";
  const pe = s.tipo === "cta" ? "" : `<div class="pe"><img src="${uri(escuro ? "logo-claro.png" : "logo-escuro.png")}" alt=""><div class="pos">${Array.from({ length: n }, (_, k) => `<b class="${k === i ? "on" : ""}"></b>`).join("")}</div></div>`;
  const orbes = s.orbes === false ? "" : `<div class="orbes g"><i></i><i></i><i></i></div>`;
  const etiqueta = s.etiqueta ? `<div class="etiqueta">${esc(s.etiqueta)}</div>` : "";
  const selo = s.selo ? `<div class="selo ${s.selo}">${SELO[s.selo] ?? esc(s.selo)}</div>` : "";
  const bgFoto = (f, foco) => `background-image:url(${uri(f)});background-position:${foco ?? "center"}`;
  if (s.tipo === "capa" && s.foto) {
    const lay = CAPAS.includes(s.layout) ? s.layout : capaPadrao;
    if (lay === "metade" || lay === "moldura") {
      const cl = ["claro", "suave", "escuro", "marca"].includes(s.fundo) ? s.fundo : "claro";
      const esc2 = ["escuro", "marca"].includes(cl);
      const pe2 = `<div class="pe"><img src="${uri(esc2 ? "logo-claro.png" : "logo-escuro.png")}" alt=""><div class="pos">${Array.from({ length: n }, (_, k) => `<b class="${k === i ? "on" : ""}"></b>`).join("")}</div></div>`;
      return `<section class="s capa ${lay} ${cl}"><div class="fotoTopo" style="${bgFoto(s.foto, s.foco)}"></div><div class="arraste">Arraste</div><div class="meio">${etiqueta}<h1>${rico(s.titulo)}</h1>${s.texto ? `<p>${rico(s.texto)}</p>` : ""}</div>${pe2}</section>`;
    }
    return `<section class="s foto"><div class="bg" style="${bgFoto(s.foto, s.foco)}"></div><div class="veu"></div><div class="arraste">Arraste</div><div class="base">${etiqueta}<h1>${rico(s.titulo)}</h1>${s.texto ? `<p>${rico(s.texto)}</p>` : ""}</div>${pe}</section>`;
  }
  if (s.tipo === "foto") {
    const topo = s.posicao === "topo";
    return `<section class="s fotocheia ${topo ? "topo" : ""}"><div class="bg" style="${bgFoto(s.foto, s.foco)}"></div><div class="veu"></div>${topo ? `<div class="alto">${etiqueta}<h2>${rico(s.titulo)}</h2>${s.texto ? `<p>${rico(s.texto)}</p>` : ""}</div>` : `<div class="base">${etiqueta}<h2>${rico(s.titulo)}</h2>${s.texto ? `<p>${rico(s.texto)}</p>` : ""}</div>`}${pe}</section>`;
  }
  if (s.tipo === "capa")
    return `<section class="s capa ${fundo}">${orbes}<div class="meio">${etiqueta}<h1>${rico(s.titulo)}</h1>${s.texto ? `<p>${rico(s.texto)}</p>` : ""}</div>${pe}</section>`;
  const comTopo = s.foto && s.layout === "topo" && ["texto", "lista", "dado"].includes(s.tipo);
  const medalhao = s.foto && s.layout === "medalhao" && ["texto", "lista", "dado"].includes(s.tipo) ? `<div class="medalhao" style="${bgFoto(s.foto, s.foco)}"></div>` : "";
  const topoFoto = comTopo ? `<div class="fotoTopo" style="${bgFoto(s.foto, s.foco)}"></div>` : "";
  const extra = comTopo ? " comfoto" : "";
  if (s.tipo === "texto")
    return `<section class="s texto ${fundo}${extra}">${topoFoto}${orbes}<div class="meio">${medalhao}${selo}${etiqueta}<h2>${rico(s.titulo)}</h2>${s.texto ? `<p style="margin-top:36px">${rico(s.texto)}</p>` : ""}</div>${pe}</section>`;
  if (s.tipo === "lista") {
    const tag = s.numerada ? "ol" : "ul";
    const cheia = s.itens.length >= 5 || s.itens.reduce((t, x) => t + (x.titulo ?? "").length + (x.texto ?? x).length, 0) > 330;
    return `<section class="s ${fundo}${cheia ? " cheia" : ""}${extra}">${topoFoto}${orbes}<div class="meio">${medalhao}${selo}${etiqueta}<h2>${rico(s.titulo)}</h2><${tag}>${s.itens.map((it, k) => `<li><span>${s.numerada ? k + 1 : ""}</span><div>${typeof it === "string" ? rico(it) : `<strong>${rico(it.titulo)}</strong>${it.texto ? `<small>${rico(it.texto)}</small>` : ""}`}</div></li>`).join("")}</${tag}></div>${pe}</section>`;
  }
  if (s.tipo === "dado") {
    if (!s.fonte) throw new Error(`Slide ${i + 1}: todo dado precisa de "fonte" (quem publicou e o ano).`);
    return `<section class="s ${fundo}${extra}">${topoFoto}${orbes}<div class="meio">${medalhao}${etiqueta}<div class="numero">${esc(s.numero)}</div><h2 style="font-size:54px">${rico(s.titulo)}</h2>${s.texto ? `<p style="margin-top:28px">${rico(s.texto)}</p>` : ""}<div class="fonte">Fonte: ${esc(s.fonte)}</div></div>${pe}</section>`;
  }
  if (s.tipo === "print")
    return `<section class="s ${s.fundo ?? "suave"}"><div class="meio" style="display:flex;flex-direction:column">${selo || `<div class="selo">${SELO.existe}</div>`}<h2>${rico(s.titulo)}</h2>${s.texto ? `<p style="margin-top:26px">${rico(s.texto)}</p>` : ""}<div class="janela" style="width:${s.largura ?? 640}px"><div class="barra"><b></b><b></b><b></b></div><img src="${uri(s.imagem)}" alt=""></div></div>${pe}</section>`;
  if (s.tipo === "cta")
    return `<section class="s cta ${fundo}${s.foto ? " comfundo" : ""}">${s.foto ? `<div class="bgfoto" style="${bgFoto(s.foto, s.foco)}"></div><div class="veumarca"></div>` : orbes}<img class="logo" src="${uri("logo-claro.png")}" alt="Synapsa"><h2>${rico(s.titulo)}</h2>${s.texto ? `<p style="margin-top:30px">${rico(s.texto)}</p>` : ""}${s.acao ? `<div class="acao">${esc(s.acao)}</div>` : ""}<div class="assin">Synapsa. Onde a prática evolui.</div></section>`;
  throw new Error(`Slide ${i + 1}: tipo desconhecido "${s.tipo}". Use capa, foto, texto, lista, dado, print ou cta.`);
}

const { chromium } = playwright();
const nav = await chromium.launch();
const pg = await nav.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const n = post.slides.length;
if (n < 1 || n > 10) throw new Error("Um post tem de 1 a 10 slides.");
const avisos = [];
for (let i = 0; i < n; i++) {
  await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{${ESTILO.v}}${CSS}${ESTILO.css}</style></head><body>${slide(post.slides[i], i, n)}</body></html>`, { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  // texto que passa da área útil = slide ilegível: avisa para encurtar
  const estouro = await pg.evaluate(() => {
    const s = document.querySelector(".s"), pe = document.querySelector(".pe,.assin");
    const limite = pe ? pe.getBoundingClientRect().top - 24 : 1350 - 60;
    let pior = 0;
    for (const el of s.querySelectorAll("h1,h2,p,li,.janela,.acao,.fonte,.numero")) { const r = el.getBoundingClientRect(); pior = Math.max(pior, r.bottom - limite, 70 - r.top, r.right - 1080 + 40); }
    return Math.round(pior);
  });
  if (estouro > 0) avisos.push(`slide ${i + 1}: o conteúdo passa ${estouro}px da área útil. Encurte o texto.`);
  const arq = path.join(pasta, `slide-${String(i + 1).padStart(2, "0")}.jpg`);
  await pg.screenshot({ path: arq, type: "jpeg", quality: 90 });
  console.log(arq, Math.round(fs.statSync(arq).size / 1024) + " KB");
}
await nav.close();
if (avisos.length) { console.error("\nAJUSTE NECESSÁRIO:\n- " + avisos.join("\n- ")); process.exit(2); }
