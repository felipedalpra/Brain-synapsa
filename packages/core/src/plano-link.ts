// Tarefas da semana compartilhadas por link (e por PDF) com o time. Quem tem o link vê a lista e marca como concluída;
// a marca vai direto para o Brain. O link é um segredo por semana e por pessoa: não dá para editar, criar nem apagar nada.
import { BrainError, type Brain } from "./brain";
import { itensDa, folhas, planAcao, segundaDe, taxa, type PlanItem, type Taxa } from "./planejamento";
import { row } from "./sql";

const DAY = 86_400_000;
const somaDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface Link { token: string; semana: string; responsavel: string; revogado: number }
export function pegarLink(brain: Brain, token: string): Link {
  const l = /^[0-9a-f]{48}$/.test(token) ? row<Link>(brain.db, "select token, semana, responsavel, revogado from plan_links where token = ?", token) : undefined;
  if (!l || l.revogado) throw new BrainError("not_found", "Este link não existe mais. Peça um novo.");
  return l;
}

export interface VistaPublica {
  semana: string; fim: string; responsavel: string; resumo: Taxa;
  posts: PlanItem[]; tarefas: PlanItem[];
}

/** O que o link mostra: sem notas internas. Link de uma pessoa mostra só o que é dela (a tarefa inteira, se alguma subtarefa for dela). */
export function vistaPublica(brain: Brain, semana: string, responsavel: string): VistaPublica {
  const todos = itensDa(brain, semana);
  const meu = (i: PlanItem) => !responsavel || i.responsavel === responsavel || i.subtarefas.some((s) => s.responsavel === responsavel);
  const limpo = (i: PlanItem): PlanItem => ({ ...i, notas: "", subtarefas: i.subtarefas.map((s) => ({ ...s, notas: "" })) });
  const itens = todos.filter(meu).map(limpo);
  const posts = itens.filter((i) => i.tipo === "post").sort((a, b) => (a.dia ?? 9) - (b.dia ?? 9) || a.ordem - b.ordem);
  const tarefas = itens.filter((i) => i.tipo === "tarefa");
  return { semana, fim: somaDias(semana, 6), responsavel, resumo: taxa(itens), posts, tarefas };
}
export const vistaDoLink = (brain: Brain, token: string): VistaPublica => { const l = pegarLink(brain, token); return vistaPublica(brain, l.semana, l.responsavel); };

/** Marca uma tarefa como concluída (ou reabre) pelo link. Só vale para itens que o link mostra. */
export function marcarPeloLink(brain: Brain, token: string, body: Record<string, unknown>): VistaPublica {
  const l = pegarLink(brain, token);
  const v = vistaPublica(brain, l.semana, l.responsavel);
  const visiveis = new Set([...v.posts, ...v.tarefas].flatMap((i) => [i.id, ...i.subtarefas.map((s) => s.id)]));
  const id = String(body.id ?? "");
  if (!visiveis.has(id)) throw new BrainError("not_found", "Essa tarefa não está neste link.");
  const status = String(body.status ?? "");
  if (!["pendente", "andamento", "concluida"].includes(status)) throw new BrainError("invalid", "Status inválido.");
  const quem = String(body.quem ?? "").trim().slice(0, 60) || l.responsavel;
  if (!quem) throw new BrainError("invalid", "Diga quem você é antes de marcar.");
  planAcao(brain, { acao: "status", id, status, semana: l.semana, via: "link", quem });
  brain.audit("time", "plan_marcado_por_link", id, { quem, status });
  return vistaPublica(brain, l.semana, l.responsavel);
}

// ---------- PDF (sem biblioteca: Helvetica padrão, A4, texto + caixas de seleção) ----------
const W = 595, H = 842, M = 48;
const CP1252: Record<string, number> = { "–": 0x96, "—": 0x97, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "…": 0x85, "€": 0x80 };
function pdfTexto(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    const b = c < 256 ? c : CP1252[ch] ?? 63;
    out += b === 40 || b === 41 || b === 92 ? `\\${String.fromCharCode(b)}` : b >= 32 && b < 127 ? String.fromCharCode(b) : b < 32 ? " " : `\\${b.toString(8).padStart(3, "0")}`;
  }
  return out;
}
const largura = (s: string, tam: number, neg: boolean): number => {
  let w = 0;
  for (const ch of s) w += /[iljtfI.,:;'|!()\[\] ]/.test(ch) ? 0.28 : /[mwMW@]/.test(ch) ? 0.85 : /[A-Z]/.test(ch) ? 0.68 : /\d/.test(ch) ? 0.556 : 0.5;
  return w * tam * (neg ? 1.06 : 1);
};
function quebrar(s: string, max: number, tam: number, neg = false): string[] {
  const out: string[] = [];
  let cur = "";
  for (const palavra of s.replace(/\s+/g, " ").trim().split(" ")) {
    const t = cur ? `${cur} ${palavra}` : palavra;
    if (cur && largura(t, tam, neg) > max) { out.push(cur); cur = palavra; } else cur = t;
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}
const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function pdfDaVista(v: VistaPublica, linkUrl?: string): Uint8Array {
  const paginas: { c: string[]; y: number; annots: string[] }[] = [];
  let pg: { c: string[]; y: number; annots: string[] };
  const nova = () => { pg = { c: [], y: H - M, annots: [] }; paginas.push(pg); };
  const garantir = (altura: number) => { if (pg.y - altura < M + 24) nova(); };
  const texto = (x: number, y: number, s: string, tam: number, neg = false, cinza = false) => pg.c.push(`BT /${neg ? "F2" : "F1"} ${tam} Tf ${cinza ? "0.45 0.48 0.55" : "0.07 0.09 0.15"} rg ${x} ${y} Td (${pdfTexto(s)}) Tj ET`);
  const caixa = (x: number, y: number, st: string) => {
    pg.c.push(`${st === "concluida" ? "0.2 0.65 0.5" : "0.35 0.4 0.55"} RG 1 w ${x} ${y} 10 10 re S`);
    if (st === "concluida") pg.c.push(`0.2 0.65 0.5 RG 1.6 w ${x + 2} ${y + 5} m ${x + 4.2} ${y + 2.5} l ${x + 8.5} ${y + 8.2} l S`);
    if (st === "andamento") pg.c.push(`0.85 0.6 0.2 RG 1.6 w ${x + 2.5} ${y + 5} m ${x + 7.5} ${y + 5} l S`);
  };
  nova();
  texto(M, pg.y - 18, "Planejamento da semana", 20, true); pg.y -= 28;
  texto(M, pg.y - 12, `${dm(v.semana)} a ${dm(v.fim)}/${v.fim.slice(0, 4)}${v.responsavel ? `  ·  Responsável: ${v.responsavel}` : "  ·  Equipe toda"}`, 11, false, true); pg.y -= 20;
  texto(M, pg.y - 12, v.resumo.total ? `${v.resumo.concluidas} de ${v.resumo.total} concluídas (${pct(v.resumo.taxa)})` : "Nada planejado para esta semana", 11, true); pg.y -= 16;
  if (linkUrl) {
    texto(M, pg.y - 11, "Para marcar como concluída, abra o link:", 9.5, false, true);
    texto(M, pg.y - 24, linkUrl, 8, true);
    pg.annots.push(`<< /Type /Annot /Subtype /Link /Rect [${M} ${pg.y - 27} ${M + Math.min(largura(linkUrl, 8, true), W - 2 * M)} ${pg.y - 13}] /Border [0 0 0] /A << /S /URI /URI (${pdfTexto(linkUrl)}) >> >>`);
    pg.y -= 32;
  }
  pg.y -= 10;
  const item = (i: PlanItem, recuo: number, prefixo = "", resp = true) => {
    const x = M + recuo, larg = W - M - (x + 20);
    const rot = `${prefixo}${i.titulo}`;
    const linhas = quebrar(rot, larg, 11, false);
    const meta = [i.responsavel && resp ? i.responsavel : "", i.status === "andamento" ? "em andamento" : "", i.status === "concluida" && i.concluidoPor ? `concluída por ${i.concluidoPor}` : ""].filter(Boolean).join("  ·  ");
    garantir(linhas.length * 14 + (meta ? 12 : 0) + 8);
    caixa(x, pg.y - 11, i.status);
    linhas.forEach((ln, k) => texto(x + 20, pg.y - 10 - k * 14, ln, 11, false, i.status === "concluida"));
    pg.y -= linhas.length * 14;
    if (meta) { texto(x + 20, pg.y - 8, meta, 9, false, true); pg.y -= 12; }
    pg.y -= 6;
  };
  const titulo = (s: string) => { garantir(40); pg.y -= 6; texto(M, pg.y - 12, s, 13, true); pg.c.push(`0.8 0.83 0.9 RG 0.7 w ${M} ${pg.y - 18} m ${W - M} ${pg.y - 18} l S`); pg.y -= 28; };
  if (v.posts.length) {
    titulo("Posts da semana");
    for (const p of v.posts) item(p, 0, `${p.dia != null ? `${DIAS[p.dia]!.slice(0, 3)} ${dm(somaDias(v.semana, p.dia))} · ` : ""}${p.formato ? `[${p.formato}] ` : ""}`, !v.responsavel);
  }
  if (v.tarefas.length) {
    titulo("Tarefas");
    for (const t of v.tarefas) { item(t, 0, "", !v.responsavel); for (const s of t.subtarefas) item(s, 22, "", !v.responsavel); }
  }
  if (!v.posts.length && !v.tarefas.length) texto(M, pg.y - 12, "Nenhum item para mostrar.", 11, false, true);
  // montagem
  const objs: string[] = [];
  const add = (s: string) => objs.push(s) && objs.length;
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids: number[] = [];
  paginas.forEach((p, n) => {
    p.c.push(`BT /F1 8.5 Tf 0.45 0.48 0.55 rg ${M} ${M - 14} Td (${pdfTexto(`Synapsa  ·  página ${n + 1} de ${paginas.length}`)}) Tj ET`);
    const cont = p.c.join("\n");
    const iCont = add(`<< /Length ${cont.length} >>\nstream\n${cont}\nendstream`);
    const ann = p.annots.map((a) => add(a));
    const iPag = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${iCont} 0 R${ann.length ? ` /Annots [${ann.map((a) => `${a} 0 R`).join(" ")}]` : ""} >>`);
    kids.push(iPag);
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  let out = "%PDF-1.4\n";
  const pos: number[] = [];
  objs.forEach((o, i) => { pos.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${pos.map((p) => `${String(p).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}

export const pdfSemana = (brain: Brain, semana: string, responsavel: string, linkUrl?: string) => pdfDaVista(vistaPublica(brain, segundaDe(semana), responsavel), linkUrl);

// ---------- Página do link ----------
export const PLANO_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const PLANO_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Tarefas da semana · Synapsa</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#060a18;--bg2:#0a1126;--panel:#0e1630;--panel2:#141f40;--line:rgba(138,156,214,.16);--line2:rgba(138,156,214,.34);--text:#e7ecfb;--mut:#93a0c8;--blue:#6a8bd7;--indigo:#5667d6;--ok:#5fd3b0;--warn:#f0b86e;--crit:#f2808e;--core2:#7c9ce8;color-scheme:dark}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--text);font:15px/1.5 "Hanken Grotesk","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh;
background-image:radial-gradient(1100px 700px at 30% -10%,rgba(86,103,214,.22),transparent 60%),linear-gradient(rgba(138,156,214,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(138,156,214,.045) 1px,transparent 1px);background-size:auto,44px 44px,44px 44px;background-attachment:fixed;
padding:calc(16px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right)) 60px max(16px,env(safe-area-inset-left))}
main{max-width:720px;margin:0 auto}
.marca{display:flex;align-items:center;gap:10px;margin-bottom:22px}
.marca svg{flex:none}.marca span{font:600 17px/1 "Chakra Petch","Segoe UI",sans-serif;letter-spacing:.2px}.marca em{font-style:normal;color:var(--mut);font-size:13px;margin-left:auto}
.cab{background:linear-gradient(160deg,var(--panel),var(--bg2));border:1px solid var(--line);border-radius:16px;padding:18px 18px 16px}
h1{font:700 26px/1.15 "Chakra Petch","Segoe UI",sans-serif;margin:0 0 4px}
h2{font:600 14px/1 "Chakra Petch","Segoe UI",sans-serif;letter-spacing:.4px;margin:28px 0 10px;color:var(--mut)}
.sub{color:var(--mut);font-size:14px;margin:0}
.top{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
a.pdf{display:inline-flex;align-items:center;padding:8px 14px;border-radius:10px;border:1px solid var(--line2);color:var(--text);text-decoration:none;font-weight:500;font-size:14px;transition:background .15s}
a.pdf:hover{background:#8a9cd61a}
.barra{height:8px;background:var(--bg);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin:16px 0 8px}
.barra i{display:block;height:100%;background:linear-gradient(90deg,var(--indigo),var(--ok));border-radius:6px;transition:width .4s}
#res{color:var(--text);font-weight:500}
.quem{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:14px 0 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center;color:var(--mut);font-size:14px}
.quem input{flex:1 1 180px;min-width:0;padding:9px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--bg);color:var(--text);font:inherit}
.quem input:focus{outline:2px solid var(--core2);outline-offset:1px}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}ul ul{margin:8px 0 0 30px}
li>.it{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:13px 14px;display:flex;gap:13px;align-items:flex-start;transition:border-color .15s,background .15s}
li>.it:hover{border-color:var(--line2);background:var(--panel2)}
li li>.it{padding:10px 12px;background:var(--bg2)}
button.cx{flex:none;width:28px;height:28px;border-radius:9px;border:2px solid var(--line2);background:transparent;color:#04201a;font-size:17px;font-weight:700;line-height:1;cursor:pointer;padding:0;transition:background .15s,border-color .15s}
button.cx:hover{border-color:var(--ok)}
button.cx.c{background:var(--ok);border-color:var(--ok)}button.cx.a{border-color:var(--warn);color:var(--warn)}button.cx:focus-visible{outline:2px solid var(--core2);outline-offset:2px}
.t{min-width:0;flex:1}.t b{font-weight:600;overflow-wrap:anywhere}.t.f b{text-decoration:line-through;text-decoration-color:var(--mut);color:var(--mut);font-weight:500}
.m{color:var(--mut);font-size:13px;margin-top:2px}.erro{color:var(--crit);background:rgba(242,128,142,.1);border:1px solid rgba(242,128,142,.35);border-radius:10px;padding:8px 12px;margin:14px 0 0}.vazio{color:var(--mut)}
.rodape{margin-top:36px;text-align:center;color:var(--mut);font-size:12.5px}
@media print{body{background:#fff;color:#000}.quem,a.pdf,button.cx{display:none}}
</style></head><body><main>
<div class="marca"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><defs><radialGradient id="o" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#eaf1ff"/><stop offset=".45" stop-color="#7c9ce8"/><stop offset="1" stop-color="#5667d6"/></radialGradient></defs><circle cx="17" cy="17" r="15" fill="url(#o)"/><circle cx="17" cy="17" r="15" fill="none" stroke="#8a9cd6" stroke-opacity=".5"/><circle cx="12.5" cy="15" r="2.2" fill="#0a1126"/><circle cx="21.5" cy="15" r="2.2" fill="#0a1126"/></svg><span>Central Synapsa</span><em>Time</em></div>
<section class="cab"><div class="top"><div><h1>Tarefas da semana</h1><p class="sub" id="sub"></p></div><a class="pdf" id="pdf" href="#">Baixar PDF</a></div>
<div class="barra"><i id="prog" style="width:0"></i></div><p class="sub" id="res"></p></section>
<div class="quem" id="quem" hidden><label for="nome">Seu nome, para registrar quem concluiu:</label><input id="nome" maxlength="60" autocomplete="name" placeholder="Ex.: Cassio"></div>
<p class="erro" id="erro" hidden></p><div id="lista"></div>
<p class="rodape">Synapsa. Onde a prática evolui.</p>
</main><script>
(function(){
var token=location.pathname.split("/").filter(Boolean).pop();
var api="/api/p/"+token, nomeEl=document.getElementById("nome"), fixo="";
var DIAS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
try{nomeEl.value=localStorage.getItem("plano_nome")||""}catch(e){}
nomeEl.addEventListener("input",function(){try{localStorage.setItem("plano_nome",nomeEl.value)}catch(e){}});
document.getElementById("pdf").href=api+"/pdf";
function dm(d){return d.slice(8,10)+"/"+d.slice(5,7)}
function soma(d,n){return new Date(Date.parse(d+"T12:00:00Z")+n*864e5).toISOString().slice(0,10)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function erro(m){var e=document.getElementById("erro");e.hidden=!m;e.textContent=m||""}
function marcar(i){
  var quem=fixo||nomeEl.value.trim();
  if(!quem){erro("Escreva seu nome acima antes de marcar.");nomeEl.focus();return}
  erro("");
  fetch(api+"/status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:i.id,status:i.status==="concluida"?"pendente":"concluida",quem:quem})})
   .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Não deu certo.");return j})}).then(desenhar).catch(function(e){erro(e.message)});
}
function linha(i,sub){
  var li=el("li"),it=el("div","it"),b=el("button","cx"+(i.status==="concluida"?" c":i.status==="andamento"?" a":""),i.status==="concluida"?"✓":i.status==="andamento"?"–":"");
  b.type="button";b.setAttribute("role","checkbox");b.setAttribute("aria-checked",i.status==="concluida"?"true":"false");b.setAttribute("aria-label",(i.status==="concluida"?"Reabrir: ":"Concluir: ")+i.titulo);
  b.onclick=function(){marcar(i)};
  var t=el("div","t"+(i.status==="concluida"?" f":"")),meta=[];
  t.appendChild(el("b",null,(i.dia!=null&&i.tipo==="post"?DIAS[i.dia]+" · ":"")+(i.formato?"["+i.formato+"] ":"")+i.titulo));
  if(i.responsavel&&!fixo)meta.push(i.responsavel);
  if(i.status==="andamento")meta.push("em andamento");
  if(i.status==="concluida"&&i.concluidoPor)meta.push("concluída por "+i.concluidoPor);
  if(meta.length)t.appendChild(el("div","m",meta.join(" · ")));
  it.appendChild(b);it.appendChild(t);li.appendChild(it);
  if(i.subtarefas&&i.subtarefas.length){var u=el("ul");i.subtarefas.forEach(function(s){u.appendChild(linha(s,true))});li.appendChild(u)}
  return li;
}
function bloco(box,titulo,itens){
  if(!itens.length)return;
  box.appendChild(el("h2",null,titulo));var u=el("ul");itens.forEach(function(i){u.appendChild(linha(i))});box.appendChild(u);
}
function desenhar(v){
  fixo=v.responsavel||"";
  document.getElementById("quem").hidden=!!fixo;
  document.getElementById("sub").textContent=dm(v.semana)+" a "+dm(v.fim)+(fixo?" · "+fixo:" · equipe toda");
  var r=v.resumo;document.getElementById("prog").style.width=(r.taxa*100)+"%";
  document.getElementById("res").textContent=r.total?r.concluidas+" de "+r.total+" concluídas":"Nada planejado para esta semana.";
  var box=document.getElementById("lista");box.textContent="";
  bloco(box,"Posts da semana",v.posts);bloco(box,"Tarefas",v.tarefas);
  if(!v.posts.length&&!v.tarefas.length)box.appendChild(el("p","vazio","Nenhum item para mostrar."));
}
function carregar(){fetch(api).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Link inválido.");return j})}).then(desenhar).catch(function(e){erro(e.message)})}
carregar();setInterval(function(){if(!document.hidden)carregar()},45000);
})();
</script></body></html>`;
