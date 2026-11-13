// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { CalendarClock, CircleCheck, Clock, RefreshCw, TriangleAlert, Video } from "lucide-react";
import { useBrain } from "../store";
import { api } from "../api";
import { GraficoBarras, Ranking } from "./charts";
import { jaDigitados } from "./Command";
import { th } from "../shared-inline";
import { ProspeccaoPainel } from "./Prospeccoes";

export const wh = [
  {
    id: "oportunidades",
    label: "Oportunidades",
  },
  {
    id: "parados",
    label: "Parados",
  },
  {
    id: "followups",
    label: "Follow-ups",
  },
  {
    id: "reunioes",
    label: "Reuni\xF5es",
  },
  {
    id: "atividades",
    label: "Atividades",
  },
];
export const qu = {
  cliente_ativo: "var(--ok)",
  perdido: "var(--crit)",
  pausado: "var(--muted)",
  negociacao: "var(--warn)",
  em_teste: "var(--violet)",
};
export const $u = {
  super_quente: "Super quente",
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};
export const Eh = {
  falta_interesse: "Falta de interesse",
  falta_tempo: "Falta de tempo",
  nao_viu_valor: "N\xE3o viu valor",
  outra_solucao: "Outra solu\xE7\xE3o",
  preco: "Pre\xE7o",
  decisao_adiada: "Decis\xE3o adiada",
  complexidade: "Complexidade",
  outros: "Outros",
};
export const _u = {
  psicologo_individual: "Psic\xF3logo(a)",
  clinica: "Cl\xEDnica",
  parceiro: "Parceiro",
};
export const Rh = {
  enviar_mensagem: "Enviar mensagem",
  ligar: "Ligar",
  agendar_reuniao: "Agendar reuni\xE3o",
  followup: "Follow-up",
};
export const Gl = (e) => `${e.slice(8, 10)}/${e.slice(5, 7)}`;
export const Kl = (e) =>
  new Date(e).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
export const Yl = (e) =>
  new Date(e).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
export const Lo = (e) =>
  `${e.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })}%`;
export function CrmPainel() {
  const { live: e } = useBrain(),
    [a, t] = React.useState(null),
    [r, o] = React.useState(null),
    [s, i] = React.useState(false),
    [l, c] = React.useState("oportunidades"),
    u = React.useCallback(
      (m = false) => {
        e &&
          (i(true),
          api
            .crmPainel(m)
            .then((N) => {
              (t(N), o(null));
            })
            .catch((N) => o(N instanceof Error ? N.message : "Erro ao ler o CRM."))
            .finally(() => i(false)));
      },
      [e],
    );
  if (
    (React.useEffect(() => {
      u();
      const m = window.setInterval(() => u(), 9e4);
      return () => window.clearInterval(m);
    }, [u]),
    !e)
  )
    return (
      <div className="page">
        <header className="page-head">
          <h1>CRM</h1>
          <p>O painel do CRM lê dados reais pelo Brain. Abra a Central com o Brain ligado para ver.</p>
        </header>
      </div>
    );
  if (!a)
    return (
      <div className="page">
        <header className="page-head">
          <h1>CRM</h1>
          <p>{r ?? "Lendo o CRM\u2026"}</p>
        </header>
        {r ? (
          <button type="button" className="btn" onClick={() => u(true)}>
            Tentar de novo
          </button>
        ) : null}
      </div>
    );
  if (a.indisponivel)
    return (
      <div className="page">
        <header className="page-head">
          <h1>CRM</h1>
          <p>{a.indisponivel}</p>
        </header>
      </div>
    );
  const v = a.kpis,
    g = (m) => {
      (c(m.alvo === "reunioes" ? "reunioes" : m.alvo),
        document.getElementById("crm-listas")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }));
    },
    x = Math.max(0, Math.round((Date.now() - a.geradoEm) / 6e4)),
    j = a.etapas.map((m) => ({
      label: m.label,
      value: m.count,
      color: qu[m.id],
    }));
  return (
    <div className="page">
      <header className="page-head head-row">
        <div>
          <h1>CRM</h1>
          <p>
            {"Leads, funil, reuni\xF5es e o que fazer agora, direto do CRM Synapsa. Atualizado h\xE1 "}
            {x < 1 ? "menos de 1" : x}
            {" min; leitura apenas."}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => u(true)} disabled={s}>
          <RefreshCw size={15} aria-hidden className={s ? "spin" : ""} />{" "}
          {s ? "Lendo o CRM\u2026" : "Atualizar"}
        </button>
      </header>
      {r ? (
        <p className="banner" role="alert">
          {r}
        </p>
      ) : null}
      {a.truncado ? (
        <p className="banner" role="status">
          O CRM tem mais registros do que o painel lê de uma vez (500 por tipo). Os totais vêm do CRM; as
          listas usam os 500 primeiros.
        </p>
      ) : null}
      <section className="kpis crm-kpis" aria-label="Números principais">
        <div className="kpi kpi-hero">
          <span>Em aberto no funil</span>
          <b>{v.emAberto}</b>
          <small>
            {v.novos30d}
            {" novos nos \xFAltimos 30 dias \xB7 "}
            {v.totalLeads}
            {" leads no total"}
          </small>
        </div>
        <div className="kpi">
          <span>Clientes ativos</span>
          <b className="t-ok">{v.clientes}</b>
          <small>
            {"Convers\xE3o "}
            {Lo(v.conversaoPct)}
            {" do total"}
          </small>
        </div>
        <div className="kpi">
          <span>Perdidos</span>
          <b className="t-crit">{v.perdidos}</b>
          <small>
            {v.pausados}
            {" pausado"}
            {v.pausados === 1 ? "" : "s"}
          </small>
        </div>
        <div className="kpi">
          <span>
            {"Sem contato h\xE1 "}
            {v.staleDias}+ dias
          </span>
          <b className="t-warn">{v.semContato}</b>
          <small>Leads abertos que esfriaram</small>
        </div>
        <div className="kpi">
          <span>Reuniões hoje</span>
          <b>{v.reunioesHoje}</b>
          <small>
            {v.reunioes7d}
            {" nos pr\xF3ximos 7 dias"}
            {v.comparecimentoPct !== null ? ` \xB7 comparecimento ${Lo(v.comparecimentoPct)}` : ""}
          </small>
        </div>
        <div className="kpi">
          <span>Atividades atrasadas</span>
          <b className={v.atividadesAtrasadas ? "t-crit" : ""}>{v.atividadesAtrasadas}</b>
          <small>
            {v.atividadesPendentes}
            {" pendentes"}
          </small>
        </div>
      </section>
      <div className="dash-grid">
        <section className="panel span-3" aria-labelledby="c-acoes">
          <h2 id="c-acoes">O que fazer agora</h2>
          {a.acoes.length === 0 ? <p className="muted">Nada pedindo ação no CRM agora.</p> : null}
          <ul className="acoes">
            {a.acoes.map((m) => (
              <li>
                <button type="button" className={`acao acao-${m.tom}`} onClick={() => g(m)}>
                  <span className="acao-ico" aria-hidden>
                    {m.tom === "critico" ? (
                      <TriangleAlert size={17} />
                    ) : m.tom === "atencao" ? (
                      <Clock size={17} />
                    ) : (
                      <CalendarClock size={17} />
                    )}
                  </span>
                  <span className="acao-txt">
                    <strong>{m.titulo}</strong>
                    <small>{m.detalhe}</small>
                  </span>
                  <b className="acao-n">{m.quantidade}</b>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel span-2" aria-labelledby="c-funil">
          <h2 id="c-funil">Funil por etapa</h2>
          <Ranking label="Leads por etapa do funil" rows={j} />
          <p className="muted">
            {"Etapas em aberto somam "}
            {v.emAberto}. Cliente ativo, perdido e pausado ficam fora desse total.
          </p>
        </section>
        <section className="panel" aria-labelledby="c-perda">
          <h2 id="c-perda">Por que perdemos</h2>
          {a.motivosPerda.length ? (
            <Ranking
              label="Motivos de perda"
              rows={a.motivosPerda.map((m) => ({
                label: Eh[m.motivo] ?? m.motivo,
                value: m.total,
                color: "var(--crit)",
              }))}
            />
          ) : (
            <p className="muted">Sem motivos registrados.</p>
          )}
        </section>
        <section className="panel span-2" aria-labelledby="c-origem">
          <h2 id="c-origem">Origem e conversão</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <jaDigitados>
                  <th>Origem</th>
                  <th className="num">Leads</th>
                  <th className="num">Clientes</th>
                  <th className="num">Perdidos</th>
                  <th className="num">Conversão</th>
                </jaDigitados>
              </thead>
              <tbody>
                {a.origem.map((m) => (
                  <jaDigitados>
                    <td>{m.origem}</td>
                    <td className="num">{m.total}</td>
                    <td className="num">{m.clientes}</td>
                    <td className="num">{m.perdidos}</td>
                    <td className="num">
                      <b className={m.conversaoPct >= v.conversaoPct && m.total >= 5 ? "t-ok" : ""}>
                        {Lo(m.conversaoPct)}
                      </b>
                    </td>
                  </jaDigitados>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">Origens com poucos leads (menos de 5) não dizem muito; olhe as maiores.</p>
        </section>
        <section className="panel" aria-labelledby="c-class">
          <h2 id="c-class">Temperatura e perfil</h2>
          <h3 className="sub">Temperatura</h3>
          <Ranking
            label="Leads por classificação"
            rows={a.classificacao.map((m) => ({
              label: $u[m.nome] ?? m.nome,
              value: m.total,
              color: m.nome === "frio" ? "var(--blue)" : m.nome === "morno" ? "var(--warn)" : "var(--crit)",
            }))}
          />
          <h3 className="sub">Perfil</h3>
          <Ranking
            label="Leads por tipo"
            rows={a.tipos.map((m) => ({
              label: _u[m.nome] ?? m.nome,
              value: m.total,
              color: "var(--violet)",
            }))}
          />
        </section>
        <section className="panel span-2" aria-labelledby="c-sem">
          <h2 id="c-sem">Ritmo das últimas 8 semanas</h2>
          <div className="two">
            <div>
              <h3 className="sub">Leads novos por semana</h3>
              <GraficoBarras
                label="Leads novos por semana"
                values={a.leadsPorSemana.map((m) => m.novos)}
                labels={a.leadsPorSemana.map((m) => Gl(m.semana))}
                color="var(--core-2)"
              />
            </div>
            <div>
              <h3 className="sub">Reuniões por semana</h3>
              <GraficoBarras
                label="Reuniões por semana"
                values={a.reunioesPorSemana.map((m) => m.total)}
                labels={a.reunioesPorSemana.map((m) => Gl(m.semana))}
                color="var(--violet)"
              />
            </div>
          </div>
          <p className="muted">Semanas começam na segunda. Reuniões canceladas não entram.</p>
        </section>
        <section className="panel" aria-labelledby="c-tempo">
          <h2 id="c-tempo">Tempo médio por etapa</h2>
          {a.tempoNaEtapa.length ? (
            <ul className="plain">
              {a.tempoNaEtapa.map((m) => (
                <li>
                  {m.etapa}{" "}
                  <b>
                    {m.dias.toLocaleString("pt-BR")}
                    {" d"}
                  </b>{" "}
                  <small className="muted">
                    ({m.amostra}
                    {" leads)"}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sem histórico de etapas suficiente.</p>
          )}
        </section>
        <section className="panel span-3" id="crm-listas" aria-labelledby="c-listas">
          <h2 id="c-listas">Listas de trabalho</h2>
          <div className="chips chips-inline" role="tablist" aria-label="Listas">
            {wh.map((m) => (
              <button
                type="button"
                role="tab"
                aria-selected={l === m.id}
                className={`chip ${l === m.id ? "chip-on" : ""}`}
                onClick={() => c(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {l === "oportunidades" ? (
            <ListaLeads
              itens={a.oportunidades}
              vazio="Nenhum lead em reunião, teste ou negociação."
              legenda="Ordenado por etapa, temperatura, score e tempo parado. Quanto mais perto de fechar e mais frio o contato, mais alto."
            />
          ) : null}
          {l === "parados" ? (
            <ListaLeads
              itens={a.parados}
              vazio="Nenhum lead aberto parado."
              legenda={`Leads abertos sem contato h\xE1 ${v.staleDias}+ dias, das etapas mais avan\xE7adas para as menos.`}
            />
          ) : null}
          {l === "followups" ? (
            <ListaLeads
              itens={a.followups}
              vazio="Nenhum follow-up vencido ou marcado para hoje."
              legenda="Leads abertos com data de follow-up chegada."
            />
          ) : null}
          {l === "reunioes" ? (
            <div className="reunioes">
              <ListaLeadsSecao titulo="Hoje" itens={a.reunioesHoje} vazio="Nenhuma reunião hoje." />
              <ListaLeadsSecao
                titulo="Próximos 7 dias"
                itens={a.reunioesProximas}
                vazio="Nenhuma reunião agendada nos próximos 7 dias."
              />
              <ListaLeadsSecao
                titulo={`Passadas ainda como "agendada" (${a.acoes.find((m) => m.id === "reuniao-sem-status")?.quantidade ?? 0})`}
                itens={a.reunioesSemStatus}
                vazio="Todas as reuniões passadas têm status."
                aviso
              />
            </div>
          ) : null}
          {l === "atividades" ? (
            a.atividades.lista.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <jaDigitados>
                      <th>Lead</th>
                      <th>Tarefa</th>
                      <th>Quando</th>
                      <th>Status</th>
                    </jaDigitados>
                  </thead>
                  <tbody>
                    {a.atividades.lista.map((m) => (
                      <jaDigitados>
                        <td>{m.lead}</td>
                        <td>{Rh[m.tipo] ?? m.tipo}</td>
                        <td>{m.quando}</td>
                        <td>{m.status}</td>
                      </jaDigitados>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">
                Nenhuma atividade aberta no CRM. Atividades são as tarefas de follow-up; hoje não há nenhuma
                cadastrada.
              </p>
            )
          ) : null}
        </section>
        <section className="panel span-2" aria-labelledby="c-cli">
          <h2 id="c-cli">
            {"Clientes ativos "}
            <small className="muted">({a.clientesAtivos.length})</small>
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <jaDigitados>
                  <th>Cliente</th>
                  <th>Plano de interesse</th>
                  <th>Atualizado</th>
                </jaDigitados>
              </thead>
              <tbody>
                {a.clientesAtivos.map((m) => (
                  <jaDigitados>
                    <td>{m.nome}</td>
                    <td>{m.plano ?? "\u2014"}</td>
                    <td>{m.desde ? new Date(m.desde).toLocaleDateString("pt-BR") : "\u2014"}</td>
                  </jaDigitados>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel" aria-labelledby="c-perd">
          <h2 id="c-perd">Perdidos recentes</h2>
          <ul className="plain">
            {a.perdidosRecentes.map((m) => (
              <li>
                {m.nome}{" "}
                <small className="muted">
                  {m.origem ?? ""}
                  {m.quando ? ` \xB7 ${new Date(m.quando).toLocaleDateString("pt-BR")}` : ""}
                </small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
export function ListaLeads({ itens: e, vazio: a, legenda: t }) {
  return e.length ? (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <jaDigitados>
              <th>Lead</th>
              <th>Etapa</th>
              <th>Temperatura</th>
              <th className="num">Sem contato</th>
              <th>Próxima ação</th>
              <th>Plano</th>
            </jaDigitados>
          </thead>
          <tbody>
            {e.map((r) => (
              <jaDigitados>
                <td>
                  {r.nome}
                  <em className="tag">{_u[r.tipo ?? ""] ?? r.tipo ?? "\u2014"}</em>
                </td>
                <td>
                  <i
                    className="dot"
                    style={{
                      background: qu[r.etapaId] ?? "var(--core-2)",
                    }}
                  />
                  {r.etapa}
                </td>
                <td>{$u[r.classificacao ?? ""] ?? "\u2014"}</td>
                <td className="num">{r.diasSemContato === null ? "\u2014" : `${r.diasSemContato} d`}</td>
                <td>
                  {r.proximaAcao ??
                    (r.followUp ? `Follow-up ${r.followUp.split("-").reverse().join("/")}` : "\u2014")}
                </td>
                <td>
                  {r.plano ?? "\u2014"}
                  {r.profissionais ? ` \xB7 ${r.profissionais} prof.` : ""}
                </td>
              </jaDigitados>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{t}</p>
    </>
  ) : (
    <p className="muted">
      <CircleCheck size={14} aria-hidden /> {a}
    </p>
  );
}
export function ListaLeadsSecao({ titulo: e, itens: a, vazio: t, aviso: r }) {
  return (
    <div className="reun-col">
      <h3 className="sub">{e}</h3>
      {a.length === 0 ? <p className="muted">{t}</p> : null}
      <ul className="reun">
        {a.map((o) => (
          <li className={r ? "reun-aviso" : ""}>
            <b>{r ? Yl(o.quando) : Kl(o.quando)}</b>
            <span>
              {o.lead}
              <small className="muted">
                {r ? ` \xB7 ${Kl(o.quando)}` : ` \xB7 ${Yl(o.quando)}`}
                {o.canal ? ` \xB7 ${o.canal}` : ""}
                {o.probabilidade !== null ? ` \xB7 ${o.probabilidade}% de fechar` : ""}
              </small>
            </span>
            {o.link && !r ? (
              <a
                className="link"
                href={o.link}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Abrir a reuni\xE3o com ${o.lead}`}
              >
                <Video size={14} aria-hidden />
                {" Entrar"}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
export function Prospeccoes() {
  const [e, a] = React.useState("painel");
  return (
    <>
      <div
        className="subtabs"
        role="tablist"
        style={{
          margin: "0 0 4px",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={e === "painel"}
          className={e === "painel" ? "on" : ""}
          onClick={() => a("painel")}
        >
          Painel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={e === "prospeccoes"}
          className={e === "prospeccoes" ? "on" : ""}
          onClick={() => a("prospeccoes")}
        >
          Prospecções
        </button>
      </div>
      {e === "painel" ? (
        <CrmPainel />
      ) : (
        <div className="page">
          <header className="page-head">
            <h1>Prospecções</h1>
            <p>
              Clínicas achadas no Google Maps e qualificadas pelo site. Só entram no CRM com o seu clique.
            </p>
          </header>
          <ProspeccaoPainel />
        </div>
      )}
    </>
  );
}
