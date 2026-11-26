#!/usr/bin/env node
// Escolhe o formato e o tipo do post de hoje, aprendendo com o desempenho que o Brain já mediu.
// Formato: 2 carrosséis e 1 estático (a regra de sempre, pela data). Tipo do estático: o rodízio de 20, ajustado pelo que performou.
// Uso: BRAIN_URL=https://… IG_TOKEN=… node instagram/escolher.mjs [AAAA-MM-DD]
// Sem BRAIN_URL e IG_TOKEN, ou se o Brain não responder, cai no rodízio fixo da data. Saída: JSON com formato, tipo, numero e motivo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dia = process.argv[2] ?? new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const n = Math.round((Date.parse(`${dia}T00:00:00Z`) - Date.parse("2026-11-01T00:00:00Z")) / 86_400_000);
const mod = (a, b) => ((a % b) + b) % b;

const tipos = [...fs.readFileSync(path.join(aqui, "tipos-estatico.md"), "utf8").matchAll(/^(\d+)\.\s+\*\*(.+?)\.\*\*/gm)].map((m) => ({ numero: +m[1], nome: m[2] }));
const saida = (o) => { console.log(JSON.stringify(o, null, 1)); process.exit(0); };

if (mod(n, 3) !== 2) saida({ dia, formato: "carrossel", motivo: "Dois carrosséis para cada estático." });
const rodizio = tipos[mod(Math.floor((n - 26) / 3), tipos.length)];

const base = (process.env.BRAIN_URL ?? "").replace(/\/+$/, ""), token = process.env.IG_TOKEN ?? "";
let ctx = null;
if (base && token) {
  try {
    const r = await fetch(`${base}/api/instagram/contexto`, { headers: { authorization: `Bearer ${token}` } });
    if (r.ok) ctx = await r.json();
  } catch { /* sem rede: usa o rodízio */ }
}
const fixo = (motivo) => saida({ dia, formato: "estatico", tipo: rodizio.nome, numero: rodizio.numero, motivo, sufixoPilar: ` | estático · ${rodizio.nome.toLowerCase()}` });
if (!ctx?.desempenho) fixo("Rodízio fixo da data (o Brain não devolveu desempenho).");

const medidos = new Map(ctx.desempenho.tipos.map((t) => [t.tipo.toLowerCase(), t]));
const comDado = ctx.desempenho.tipos.filter((t) => t.n >= 2).map((t) => t.taxaAcao).sort((a, b) => a - b);
if (comDado.length < 3) fixo("Ainda há poucos estáticos medidos para comparar: segue o rodízio fixo.");
const mediana = comDado[Math.floor(comDado.length / 2)];

// Não repete os 6 últimos tipos de estático usados.
const recentes = (ctx.recentes ?? []).map((r) => String(r.pilar ?? "").toLowerCase()).filter((p) => /^est[aá]tico/.test(p)).slice(0, 6);
const usado = (t) => recentes.some((p) => p.includes(t.nome.toLowerCase()));
const peso = (t) => {
  if (usado(t)) return 0;
  const m = medidos.get(t.nome.toLowerCase());
  if (!m || m.n < 2) return 1.5;          // ainda não medido: explora
  return m.taxaAcao >= mediana ? 2 : 0.5;  // acima da mediana repete mais; abaixo, menos
};
const pesos = tipos.map(peso);
const total = pesos.reduce((a, b) => a + b, 0);
if (!total) fixo("Todos os tipos foram usados há pouco: segue o rodízio fixo.");
// Sorteio determinístico pela data: o mesmo dia dá sempre a mesma resposta.
let s = (n * 2654435761) >>> 0; s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0; s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
let alvo = ((s ^ (s >>> 16)) >>> 0) / 4294967296 * total, i = 0;
while (alvo >= pesos[i]) { alvo -= pesos[i]; i++; }
const t = tipos[i];
const m = medidos.get(t.nome.toLowerCase());
saida({ dia, formato: "estatico", tipo: t.nome, numero: t.numero, motivo: m && m.n >= 2 ? `Esse tipo teve taxa de ação ${(m.taxaAcao * 100).toFixed(1)}% em ${m.n} posts (mediana ${(mediana * 100).toFixed(1)}%).` : "Tipo ainda pouco medido: entra para o Brain aprender." , sufixoPilar: ` | estático · ${t.nome.toLowerCase()}` });
