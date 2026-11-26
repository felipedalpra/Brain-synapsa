// @ts-nocheck
// Prospecção no WhatsApp: o Instinct acha os leads, aborda e marca reunião sozinho e preenche uma planilha.
// O Brain não escolhe a quem ele fala: só lê o placar e mostra aqui (evolução, funil, estágios e quem é cada lead).
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const pct = (v) => (v === null || v === undefined ? "—" : `${String(v).replace(".", ",")}%`);
const taxa = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const ESTAGIOS = [
  { k: "abordado", rotulo: "Abordado", cor: "#6a8bd7" },
  { k: "respondeu", rotulo: "Respondeu", cor: "#6fdae6" },
  { k: "reuniao", rotulo: "Reunião", cor: "#a38bda" },
  { k: "conta gratuita", rotulo: "Conta gratuita", cor: "#f0b86e" },
  { k: "assinante", rotulo: "Assinante", cor: "#5fd3b0" },
  { k: "sem interesse", rotulo: "Sem interesse", cor: "#f2808e" },
];
const EST = Object.fromEntries(ESTAGIOS.map((e) => [e.k, e]));
const ORDEM = { abordado: 0, respondeu: 1, reuniao: 2, "conta gratuita": 3, assinante: 4 };
const TIPO = { clinica: "Clínica", influenciadora: "Influenciadora" };
const MS = 86400000;

const t0 = (iso) => Date.parse(`${iso}T00:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const ddmm = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "—");
const dmy = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");
const segunda = (s) => { const d = new Date(t0(s)); const w = (d.getUTCDay() + 6) % 7; return iso(d.getTime() - w * MS); };
const diasEntre = (a, b) => Math.max(0, Math.round((t0(b) - t0(a)) / MS));

const vazioSoma = () => ({ abordados: 0, responderam: 0, reunioes: 0, contas: 0, assinantes: 0 });
function somar(xs) {
  const s = vazioSoma();
  for (const x of xs) { s.abordados += x.abordados; s.responderam += x.responderam; s.reunioes += x.reunioes; s.contas += x.contas; s.assinantes += x.assinantes; }
  return s;
}

/** Agrupa as linhas do período por dia (ou por semana, se o período é longo), sem buracos no eixo. */
function serie(dias, de, ate) {
  const n = diasEntre(de, ate) + 1;
  const semanal = n > 45;
  const por = new Map();
  for (const d of dias) {
    const k = semanal ? segunda(d.dia) : d.dia;
    const a = por.get(k) ?? vazioSoma();
    a.abordados += d.abordados; a.responderam += d.responderam; a.reunioes += d.reunioes; a.contas += d.contas; a.assinantes += d.assinantes;
    por.set(k, a);
  }
  const out = [];
  const passo = semanal ? 7 : 1;
  for (let m = t0(semanal ? segunda(de) : de); m <= t0(ate); m += passo * MS) out.push({ k: iso(m), ...(por.get(iso(m)) ?? vazioSoma()) });
  return { pontos: out, semanal };
}

function Delta({ atual, antes }) {
  if (antes === null || antes === undefined) return null;
  const d = atual - antes;
  if (!d && !antes) return <small className="ix-delta">sem base anterior</small>;
  const cor = d > 0 ? "var(--ok)" : d < 0 ? "var(--crit)" : "var(--muted)";
  return <small className="ix-delta" style={{ color: cor }}>{d > 0 ? "▲" : d < 0 ? "▼" : "•"} {d > 0 ? "+" : ""}{d} vs. período anterior</small>;
}

function Kpi({ rotulo, valor, sub, atual, antes, cor }) {
  return (
    <div className="ix-kpi" style={{ "--c": cor }}>
      <span>{rotulo}</span>
      <b>{valor}</b>
      {sub ? <em>{sub}</em> : null}
      <Delta atual={atual} antes={antes} />
    </div>
  );
}

/** Barras + linha em SVG, com dica ao passar o mouse. barras/linha: chaves das séries. */
function Grafico({ pontos, semanal, barra, linha, acumular, corBarra, corLinha, rotBarra, rotLinha, vazio }) {
  const [h, setH] = React.useState(null);
  const W = 720, H = 220, m = { l: 36, r: 12, t: 14, b: 26 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const b = pontos.map((p) => p[barra] ?? 0);
  let acc = 0;
  const l = linha ? pontos.map((p) => (acumular ? (acc += p[linha] ?? 0) : p[linha] ?? 0)) : [];
  const max = Math.max(1, ...b, ...l);
  const passo = max <= 5 ? 1 : max <= 10 ? 2 : max <= 50 ? 10 : Math.pow(10, Math.floor(Math.log10(max)));
  const ticks = []; for (let v = 0; v <= max; v += passo) ticks.push(v);
  const topo = ticks[ticks.length - 1] < max ? max : ticks[ticks.length - 1];
  const y = (v) => m.t + (1 - v / (topo || 1)) * ih;
  const n = pontos.length;
  const bw = Math.max(2, Math.min(28, (iw / Math.max(1, n)) * 0.64));
  const x = (i) => m.l + ((i + 0.5) / Math.max(1, n)) * iw;
  const cada = Math.max(1, Math.ceil(n / 9));
  const tudoZero = !b.some(Boolean) && !l.some(Boolean);
  const mover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setH(Math.min(n - 1, Math.max(0, Math.floor(((px - m.l) / iw) * n))));
  };
  const rot = (p) => (semanal ? `semana de ${ddmm(p.k)}` : dmy(p.k));
  return (
    <div className="ix-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${rotBarra}${linha ? ` e ${rotLinha}` : ""}`} onPointerMove={mover} onPointerLeave={() => setH(null)} style={{ touchAction: "pan-y" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="chart-axis">{t}</text>
          </g>
        ))}
        {pontos.map((p, i) => (
          <g key={p.k}>
            {b[i] > 0 ? <rect x={x(i) - bw / 2} y={y(b[i])} width={bw} height={Math.max(1, m.t + ih - y(b[i]))} rx="2" fill={corBarra} opacity={h === null || h === i ? 0.85 : 0.35} /> : null}
            {i % cada === 0 ? <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{ddmm(p.k)}</text> : null}
          </g>
        ))}
        {linha && n > 0 ? (
          <g>
            <path d={l.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")} fill="none" stroke={corLinha} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            {n <= 40 ? l.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={corLinha} />) : null}
          </g>
        ) : null}
        {h !== null ? <line x1={x(h)} x2={x(h)} y1={m.t} y2={m.t + ih} stroke="var(--text)" strokeOpacity="0.3" strokeDasharray="3 3" /> : null}
        {tudoZero ? <text x={W / 2} y={H / 2} textAnchor="middle" className="chart-axis">{vazio}</text> : null}
      </svg>
      {h !== null ? (
        <div className="ix-tip" style={{ left: `${(x(h) / W) * 100}%` }}>
          <b>{rot(pontos[h])}</b>
          <div><i style={{ background: corBarra }} />{rotBarra}<em>{b[h]}</em></div>
          {linha ? <div><i style={{ background: corLinha }} />{rotLinha}<em>{l[h]}</em></div> : null}
        </div>
      ) : null}
    </div>
  );
}

function Funil({ t }) {
  const etapas = [
    { r: "Abordados", v: t.abordados, c: ESTAGIOS[0].cor },
    { r: "Responderam", v: t.responderam, c: ESTAGIOS[1].cor },
    { r: "Reuniões marcadas", v: t.reunioes, c: ESTAGIOS[2].cor },
    { r: "Conta gratuita", v: t.contas, c: ESTAGIOS[3].cor },
    { r: "Assinantes", v: t.assinantes, c: ESTAGIOS[4].cor },
  ];
  const max = Math.max(1, etapas[0].v);
  return (
    <div className="ix-funil">
      {etapas.map((e, i) => (
        <div key={e.r} className="ix-funil-linha">
          <span className="ix-funil-r">{e.r}</span>
          <div className="ix-funil-barra"><i style={{ width: `${Math.max(e.v ? 2 : 0, (e.v / max) * 100)}%`, background: e.c }} /></div>
          <b>{e.v}</b>
          <em>{i === 0 ? "" : `${pct(taxa(e.v, etapas[i - 1].v))} da etapa anterior`}</em>
        </div>
      ))}
    </div>
  );
}

function Lead({ l, hoje, aoAbrir }) {
  const parado = diasEntre(l.atualizado ?? l.primeira ?? hoje, hoje);
  return (
    <button type="button" className="ix-card" onClick={() => aoAbrir(l)}>
      <b>{l.nome}</b>
      <span>{TIPO[l.tipo] ?? l.tipo}{l.cidade ? ` · ${l.cidade}` : ""}</span>
      <em>{parado === 0 ? "hoje" : `há ${parado} dia${parado === 1 ? "" : "s"}`}</em>
    </button>
  );
}

function Ficha({ l, hoje, aoFechar }) {
  React.useEffect(() => {
    const f = (e) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [aoFechar]);
  const est = EST[l.status] ?? EST.abordado;
  const pos = ORDEM[l.status];
  const fone = l.whatsapp ? (l.whatsapp.length <= 11 ? `55${l.whatsapp}` : l.whatsapp) : "";
  const bonito = l.whatsapp && l.whatsapp.length >= 10 ? `(${l.whatsapp.slice(0, 2)}) ${l.whatsapp.slice(2, l.whatsapp.length - 4)}-${l.whatsapp.slice(-4)}` : l.whatsapp;
  const desde = l.primeira ? diasEntre(l.primeira, hoje) : null;
  return (
    <div className="ix-fundo" onClick={aoFechar}>
      <aside className="ix-ficha" role="dialog" aria-label={`Ficha de ${l.nome}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h3>{l.nome}</h3>
            <p>{TIPO[l.tipo] ?? l.tipo}{l.cidade ? ` · ${l.cidade}` : ""}</p>
          </div>
          <button type="button" className="btn" onClick={aoFechar} aria-label="Fechar">Fechar</button>
        </header>
        <span className="ix-badge" style={{ "--c": est.cor }}>{est.rotulo}</span>
        <ol className="ix-passos" aria-label="Caminho do lead">
          {ESTAGIOS.slice(0, 5).map((e, i) => (
            <li key={e.k} className={pos !== undefined && i <= pos ? "feito" : ""} style={{ "--c": e.cor }}><i />{e.rotulo}</li>
          ))}
        </ol>
        <dl className="ix-dados">
          <div><dt>WhatsApp</dt><dd>{bonito ? <>{bonito} {fone ? <a href={`https://wa.me/${fone}`} target="_blank" rel="noreferrer">abrir conversa</a> : null}</> : "não informado"}</dd></div>
          <div><dt>Primeira abordagem</dt><dd>{dmy(l.primeira)}{desde !== null ? <span className="muted"> · há {desde} dia{desde === 1 ? "" : "s"}</span> : null}</dd></div>
          <div><dt>Última atualização</dt><dd>{dmy(l.atualizado)}</dd></div>
        </dl>
        <h4>Histórico de estágios</h4>
        {l.eventos.length ? (
          <ul className="ix-linha-tempo">
            {l.eventos.map((e, i) => (
              <li key={i} style={{ "--c": (EST[e.para] ?? EST.abordado).cor }}>
                <i /><b>{(EST[e.para] ?? { rotulo: e.para }).rotulo}</b><span>{dmy(e.dia)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Ainda sem mudanças registradas. O Brain anota cada troca de estágio que ele vê na planilha, a cada leitura.</p>}
      </aside>
    </div>
  );
}

const PERIODOS = [["7", "7 dias"], ["30", "30 dias"], ["90", "90 dias"], ["tudo", "Tudo"]];

export function InstinctPainel() {
  const [p, setP] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [per, setPer] = React.useState("30");
  const [tipo, setTipo] = React.useState("todos");
  const [busca, setBusca] = React.useState("");
  const [fStatus, setFStatus] = React.useState("todos");
  const [aberto, setAberto] = React.useState(null);
  const [cfg, setCfg] = React.useState(false);
  const carregar = React.useCallback(() => {
    api.instinct().then((x) => { setP(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);
  React.useEffect(() => { carregar(); const t = window.setInterval(carregar, 6e4); return () => window.clearInterval(t); }, [carregar]);
  const agir = async (fn, ok) => {
    setBusy(true);
    try { const r = await fn(); avisos.push({ kind: "ok", title: r?.message ?? ok }); carregar(); }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); carregar(); }
    finally { setBusy(false); }
  };

  const hoje = p?.hoje ?? iso(Date.now());
  const dados = React.useMemo(() => {
    if (!p) return null;
    const todos = p.dias.filter((d) => tipo === "todos" || d.tipo === tipo);
    const primeiro = p.dias.length ? p.dias.reduce((a, d) => (d.dia < a ? d.dia : a), hoje) : hoje;
    const n = per === "tudo" ? null : Number(per);
    const de = n ? iso(t0(hoje) - (n - 1) * MS) : primeiro;
    const atual = todos.filter((d) => d.dia >= de && d.dia <= hoje);
    const antes = n ? todos.filter((d) => d.dia >= iso(t0(de) - n * MS) && d.dia < de) : null;
    return { de, atual, soma: somar(atual), antes: antes ? somar(antes) : null, serie: serie(atual, de, hoje), porTipo: { clinica: somar(p.dias.filter((d) => d.tipo === "clinica" && d.dia >= de && d.dia <= hoje)), influenciadora: somar(p.dias.filter((d) => d.tipo === "influenciadora" && d.dia >= de && d.dia <= hoje)) } };
  }, [p, per, tipo, hoje]);

  const leads = React.useMemo(() => (p ? p.leads.filter((l) => (tipo === "todos" || l.tipo === tipo)) : []), [p, tipo]);
  const filtrados = React.useMemo(() => {
    const q = busca.trim().toLowerCase();
    return leads.filter((l) => (fStatus === "todos" || l.status === fStatus) && (!q || `${l.nome} ${l.cidade} ${l.whatsapp}`.toLowerCase().includes(q)));
  }, [leads, busca, fStatus]);
  const porEstagio = React.useMemo(() => {
    const m = Object.fromEntries(ESTAGIOS.map((e) => [e.k, []]));
    for (const l of leads) (m[l.status] ?? m.abordado).push(l);
    return m;
  }, [leads]);
  const cidades = React.useMemo(() => {
    const m = new Map();
    for (const l of leads) { const c = l.cidade || "Sem cidade"; const a = m.get(c) ?? { total: 0, avancou: 0 }; a.total++; if ((ORDEM[l.status] ?? 0) >= 2) a.avancou++; m.set(c, a); }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  }, [leads]);

  if (erro) return <section className="panel"><p className="empty">{erro}</p></section>;
  if (!p || !dados) return null;
  const vazio = !p.dias.length && !p.leads.length;
  const s = dados.soma, a = dados.antes;
  const taxaResp = taxa(s.responderam, s.abordados);
  const taxaReu = taxa(s.reunioes, s.abordados);
  const conv = taxa(s.contas + s.assinantes, s.abordados);
  const paradosReu = leads.filter((l) => l.status === "reuniao" && diasEntre(l.atualizado ?? l.primeira ?? hoje, hoje) >= 7).length;
  const semResposta = leads.filter((l) => l.status === "abordado" && diasEntre(l.primeira ?? hoje, hoje) >= 5).length;
  const lido = p.ultimaLeitura ? new Date(p.ultimaLeitura).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <section className="ix">
      <header className="ix-topo">
        <div>
          <h3>Prospecção no WhatsApp</h3>
          <p className="muted">O Instinct acha, aborda e marca reunião sozinho. Aqui o Brain só acompanha o resultado.</p>
        </div>
        <div className="ix-acoes">
          <span className="muted">{lido ? `Lida em ${lido}` : "Ainda não lida"}</span>
          <a className="btn" href={p.planilha.url} target="_blank" rel="noreferrer">Planilha</a>
          <button className="btn" onClick={() => setCfg((v) => !v)} aria-expanded={cfg}>Configurar</button>
        </div>
      </header>

      {cfg ? (
        <div className="ix-cfg">
          <p className="muted">Para ler e preparar a planilha, compartilhe como editora com <code>{p.planilha.conta ?? "a conta de serviço do Brain"}</code>.</p>
          <button className="btn" disabled={busy} onClick={() => agir(() => api.instinctPreparar(), "Abas prontas")}>Criar abas Dia e Leads</button>{" "}
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link de outra planilha" aria-label="Link da planilha" />{" "}
          <button className="btn" disabled={busy || !link} onClick={() => agir(() => api.instinctConfig(link), "Planilha trocada").then(() => setLink(""))}>Trocar</button>
        </div>
      ) : null}
      {p.erro ? <p className="empty">{p.erro}</p> : null}
      {p.ignoradas ? <p className="muted">{p.ignoradas} linha(s) da planilha foram ignoradas por falta de data, tipo ou status.</p> : null}

      <div className="ix-filtros">
        <div className="seg" role="group" aria-label="Período">
          {PERIODOS.map(([k, r]) => <button key={k} type="button" className={per === k ? "on" : ""} onClick={() => setPer(k)}>{r}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Tipo de lead">
          {[["todos", "Todos"], ["clinica", "Clínicas"], ["influenciadora", "Influenciadoras"]].map(([k, r]) => <button key={k} type="button" className={tipo === k ? "on" : ""} onClick={() => setTipo(k)}>{r}</button>)}
        </div>
      </div>

      {vazio && !p.erro ? <p className="muted">Sem dados ainda. Quando o Instinct preencher as abas Dia e Leads, os gráficos aparecem aqui.</p> : null}

      <div className="ix-kpis">
        <Kpi rotulo="Abordados" valor={s.abordados} atual={s.abordados} antes={a?.abordados} cor="#6a8bd7" />
        <Kpi rotulo="Responderam" valor={s.responderam} sub={`${pct(taxaResp)} dos abordados`} atual={s.responderam} antes={a?.responderam} cor="#6fdae6" />
        <Kpi rotulo="Reuniões marcadas" valor={s.reunioes} sub={`${pct(taxaReu)} dos abordados`} atual={s.reunioes} antes={a?.reunioes} cor="#a38bda" />
        <Kpi rotulo="Contas gratuitas" valor={s.contas} atual={s.contas} antes={a?.contas} cor="#f0b86e" />
        <Kpi rotulo="Assinantes" valor={s.assinantes} atual={s.assinantes} antes={a?.assinantes} cor="#5fd3b0" />
        <Kpi rotulo="Conversão" valor={pct(conv)} sub="conta ou assinatura ÷ abordados" atual={0} antes={null} cor="#e7ecfb" />
      </div>

      <div className="ix-grade">
        <article className="ix-caixa">
          <h4>Abordagens e respostas</h4>
          <p className="muted">{dados.serie.semanal ? "Por semana." : "Por dia."} Barras: abordados. Linha: responderam.</p>
          <Grafico pontos={dados.serie.pontos} semanal={dados.serie.semanal} barra="abordados" linha="responderam" corBarra="#6a8bd7" corLinha="#6fdae6" rotBarra="Abordados" rotLinha="Responderam" vazio="Sem abordagens no período" />
        </article>
        <article className="ix-caixa">
          <h4>Reuniões marcadas</h4>
          <p className="muted">Barras: reuniões no {dados.serie.semanal ? "semana" : "dia"}. Linha: total acumulado no período.</p>
          <Grafico pontos={dados.serie.pontos} semanal={dados.serie.semanal} barra="reunioes" linha="reunioes" acumular corBarra="#a38bda" corLinha="#5fd3b0" rotBarra="Reuniões" rotLinha="Acumulado" vazio="Nenhuma reunião no período" />
        </article>
      </div>

      <div className="ix-grade">
        <article className="ix-caixa">
          <h4>Funil do período</h4>
          <Funil t={s} />
        </article>
        <article className="ix-caixa">
          <h4>Clínicas × influenciadoras</h4>
          <table className="ix-tab">
            <thead><tr><th></th><th>Abord.</th><th>Resp.</th><th>Reun.</th><th>Contas</th><th>Assin.</th><th>Conv.</th></tr></thead>
            <tbody>
              {[["clinica", "Clínicas"], ["influenciadora", "Influenciadoras"]].map(([k, r]) => {
                const x = dados.porTipo[k];
                return <tr key={k}><td>{r}</td><td>{x.abordados}</td><td>{x.responderam} <span className="muted">{pct(taxa(x.responderam, x.abordados))}</span></td><td>{x.reunioes}</td><td>{x.contas}</td><td>{x.assinantes}</td><td>{pct(taxa(x.contas + x.assinantes, x.abordados))}</td></tr>;
              })}
            </tbody>
          </table>
          {cidades.length ? (
            <>
              <h4>Onde estão os leads</h4>
              <ul className="ix-cidades">
                {cidades.map(([c, v]) => (
                  <li key={c}><span>{c}</span><div><i style={{ width: `${(v.total / cidades[0][1].total) * 100}%` }} /></div><b>{v.total}</b><em>{v.avancou} em reunião ou mais</em></li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      </div>

      <article className="ix-caixa">
        <h4>Estágios dos leads</h4>
        <p className="muted">
          {leads.length} lead(s) no total.
          {semResposta ? ` ${semResposta} abordado(s) há 5 dias ou mais sem resposta.` : ""}
          {paradosReu ? ` ${paradosReu} em reunião há 7 dias ou mais sem avançar.` : ""} Clique num lead para ver a ficha.
        </p>
        <div className="ix-quadro">
          {ESTAGIOS.map((e) => (
            <div key={e.k} className="ix-coluna" style={{ "--c": e.cor }}>
              <header><i />{e.rotulo}<b>{porEstagio[e.k].length}</b></header>
              <div className="ix-coluna-lista">
                {porEstagio[e.k].slice(0, 12).map((l) => <Lead key={l.chave} l={l} hoje={hoje} aoAbrir={setAberto} />)}
                {porEstagio[e.k].length > 12 ? <button type="button" className="ix-mais" onClick={() => { setFStatus(e.k); }}>ver os {porEstagio[e.k].length} na lista abaixo</button> : null}
                {!porEstagio[e.k].length ? <span className="ix-vazio">Ninguém aqui</span> : null}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="ix-caixa">
        <h4>Todos os leads</h4>
        <div className="ix-filtros">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, cidade ou WhatsApp" aria-label="Buscar lead" />
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filtrar por estágio">
            <option value="todos">Todos os estágios</option>
            {ESTAGIOS.map((e) => <option key={e.k} value={e.k}>{e.rotulo}</option>)}
          </select>
        </div>
        {filtrados.length ? (
          <div className="ix-rolagem">
            <table className="ix-tab ix-leads">
              <thead><tr><th>Lead</th><th>Tipo</th><th>Cidade</th><th>Estágio</th><th>1ª abordagem</th><th>Atualizado</th></tr></thead>
              <tbody>
                {filtrados.map((l) => {
                  const e = EST[l.status] ?? EST.abordado;
                  return (
                    <tr key={l.chave} tabIndex={0} onClick={() => setAberto(l)} onKeyDown={(ev) => ev.key === "Enter" && setAberto(l)}>
                      <td><b>{l.nome}</b></td><td>{TIPO[l.tipo] ?? l.tipo}</td><td>{l.cidade || "—"}</td>
                      <td><span className="ix-badge" style={{ "--c": e.cor }}>{e.rotulo}</span></td><td>{dmy(l.primeira)}</td><td>{dmy(l.atualizado)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">{leads.length ? "Nenhum lead com esse filtro." : "Nenhum lead na planilha ainda."}</p>}
      </article>

      {aberto ? <Ficha l={aberto} hoje={hoje} aoFechar={() => setAberto(null)} /> : null}
    </section>
  );
}
