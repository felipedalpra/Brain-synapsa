// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useBrain } from "../store";
import { api } from "../api";
import { Ia, _, so } from "../lib";
import { GraficoBarras, GraficoLinhas } from "./charts";
import { jaDigitados } from "./Command";
import { th } from "../shared-inline";

export const Va = (e) => `${e.slice(8, 10)}/${e.slice(5, 7)}`;
export const qh = {
  active: "Ativo",
  trialing: "Em teste",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
  unpaid: "N\xE3o pago",
};
export const $h = {
  stripe: "Stripe",
  pix: "Pix",
  manual: "Manual",
  platform: "Plataforma",
};
export function Dashboard() {
  const { state: e, live: a, pending: t } = useBrain(),
    [r, o] = React.useState(null),
    [s, i] = React.useState(false),
    [l, c] = React.useState([]),
    [u, v] = React.useState(null),
    g = React.useCallback(() => {
      a &&
        api
          .dashboard()
          .then(o)
          .catch((y) => v(y instanceof Error ? y.message : "Erro ao carregar."));
    }, [a]);
  React.useEffect(() => {
    g();
    const y = window.setInterval(g, 3e4);
    return () => window.clearInterval(y);
  }, [g]);
  const x = () => {
    (i(true),
      c([]),
      api
        .refreshData()
        .then((y) => {
          (o(y.dashboard), c(y.avisos));
        })
        .catch((y) => v(y instanceof Error ? y.message : "Erro ao atualizar."))
        .finally(() => i(false)));
  };
  if (!a)
    return (
      <div className="page">
        <header className="page-head">
          <h1>Dashboard</h1>
          <p>
            O dashboard mostra dados reais do Stripe, da Meta e do Instagram. Abra a Central com o Brain
            ligado para ver.
          </p>
        </header>
      </div>
    );
  if (!r)
    return (
      <div className="page">
        <header className="page-head">
          <h1>Dashboard</h1>
          <p>{u ?? "Carregando os n\xFAmeros\u2026"}</p>
        </header>
      </div>
    );
  const j = r.receita,
    m = j.mrr_atual,
    N = Math.round((m.total / m.goal) * 100),
    h = r.clientes.lista.filter((y) => ["active", "trialing", "past_due"].includes(y.status)),
    f = r.clientes.lista.filter((y) => !["active", "trialing", "past_due"].includes(y.status)),
    d = r.mrrSerie,
    p = r.anuncios,
    S = r.instagram,
    C = S.historico_guardado.filter((y) => y.followers !== null),
    k = S.seguidores_novos_por_dia ?? [],
    w = e.metrics.funil;
  return (
    <div className="page">
      <header className="page-head head-row">
        <div>
          <h1>Dashboard</h1>
          <p>
            {"Receita, clientes, an\xFAncios e Instagram, direto das fontes. Atualizado "}
            {Ia(
              r.agora,
              Math.max(p.atualizadoEm ?? 0, S.atualizado_em ? Date.parse(S.atualizado_em) : 0) || r.agora,
            )}
            {" atr\xE1s na Meta; o MRR fecha todo dia \xE0s 7h."}
          </p>
        </div>
        <button type="button" className="btn" onClick={x} disabled={s}>
          <RefreshCw size={15} aria-hidden className={s ? "spin" : ""} />{" "}
          {s ? "Lendo Meta e Instagram\u2026" : "Atualizar dados"}
        </button>
      </header>
      {l.length ? (
        <p className="banner" role="alert">
          {l.join(" \xB7 ")}
        </p>
      ) : null}
      <section className="kpis" aria-label="Números principais">
        <div className="kpi kpi-hero">
          <span>MRR</span>
          <b>{_(m.total)}</b>
          <small>
            {N}
            {"% de "}
            {_(m.goal)}
            {" at\xE9 "}
            {m.goalDate}
          </small>
          <div className="bar" role="img" aria-label={`${N}% da meta`}>
            <i
              className="bar-stripe"
              style={{
                width: `${Math.min(100, (m.stripe / m.goal) * 100)}%`,
              }}
            />
            <i
              className="bar-pix"
              style={{
                width: `${Math.min(100, ((m.pix + m.manual) / m.goal) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="kpi">
          <span>Falta para a meta</span>
          <b>{_(j.falta_para_meta_brl)}</b>
          <small>
            {"\u2248 "}
            {Math.ceil(j.falta_para_meta_brl / m.essencialPrice)}
            {" Essenciais a "}
            {_(m.essencialPrice)}
          </small>
        </div>
        <div className="kpi">
          <span>Clientes pagantes</span>
          <b>{j.clientes_ativos}</b>
          <small>
            {j.clientes_cancelados}
            {" cancelados \xB7 ticket "}
            {_(j.ticket_medio_brl)}
          </small>
        </div>
        <div className="kpi">
          <span>MRR sem descontos</span>
          <b>{_(j.mrr_quando_todos_os_descontos_acabarem_brl)}</b>
          <small>Se ninguém cancelar quando os descontos acabarem</small>
        </div>
      </section>
      <div className="dash-grid">
        <section className="panel span-2" aria-labelledby="d-mrr">
          <h2 id="d-mrr">MRR por dia</h2>
          {d.length >= 2 ? (
            <GraficoLinhas
              label={`MRR de ${Va(d[0].day)} a ${Va(d[d.length - 1].day)}, hoje ${_(m.total)}`}
              money
              labels={d.map((y) => Va(y.day))}
              series={[
                {
                  name: "Total",
                  color: "var(--core-2)",
                  values: d.map((y) => y.total),
                },
                {
                  name: "Stripe",
                  color: "var(--indigo)",
                  values: d.map((y) => y.stripe),
                },
                {
                  name: "Pix",
                  color: "var(--violet)",
                  values: d.map((y) => y.pix + y.manual),
                },
              ]}
            />
          ) : (
            <p className="muted">
              O histórico começa hoje: o Brain fecha o MRR todo dia às 7h e o gráfico aparece a partir do
              segundo dia.
            </p>
          )}
          <ul className="legend">
            <li>
              <i className="dot dot-stripe" />
              {" Stripe "}
              {_(m.stripe)}
            </li>
            <li>
              <i className="dot dot-pix" />
              {" Pix "}
              {_(m.pix + m.manual)}
              {" (informado por voc\xEA)"}
            </li>
          </ul>
        </section>
        <section className="panel" aria-labelledby="d-desc">
          <h2 id="d-desc">Fins de desconto</h2>
          {j.fins_de_desconto.length === 0 ? <p className="muted">Nenhum desconto acabando.</p> : null}
          <ul className="plain">
            {j.fins_de_desconto.map((y) => (
              <li>
                <b>{y.quando}</b>
                {" \xB7 "}
                {y.contas} {y.contas > 1 ? "contas sobem" : "conta sobe"}
                {" de "}
                {_(y.de)}
                {" para "}
                {_(y.para)}
              </li>
            ))}
          </ul>
          <p className="muted">
            O Brain abre um contato para você 30 dias antes. Nenhum agente oferece desconto.
          </p>
        </section>
        <section className="panel span-3" aria-labelledby="d-cli">
          <h2 id="d-cli">Clientes</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <jaDigitados>
                  <th>Cliente</th>
                  <th>Fonte</th>
                  <th>Status</th>
                  <th className="num">Paga</th>
                  <th className="num">Tabela</th>
                  <th>Desconto até</th>
                </jaDigitados>
              </thead>
              <tbody>
                {[...h, ...f].map((y) => (
                  <jaDigitados className={h.includes(y) ? "" : "dim"}>
                    <td>{y.nome ?? y.id}</td>
                    <td>
                      {$h[y.fonte] ?? y.fonte}
                      {y.origem_do_dado === "informado" ? <em className="tag">informado</em> : null}
                    </td>
                    <td>{qh[y.status] ?? y.status}</td>
                    <td className="num">{_(y.preco_efetivo_brl)}</td>
                    <td className="num">{_(y.preco_cheio_brl)}</td>
                    <td>
                      {y.desconto_acaba_em
                        ? new Date(y.desconto_acaba_em).toLocaleDateString("pt-BR")
                        : "\u2014"}
                    </td>
                  </jaDigitados>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            Stripe é lido da conta. Pix é o que você me informou: se alguém cancelar ou atrasar, avise o
            Jarvis.
          </p>
        </section>
        <section className="panel span-2" aria-labelledby="d-ads">
          <h2 id="d-ads">Anúncios (Meta), 30 dias</h2>
          <div className="mini-kpis">
            <div>
              <span>Gasto</span>
              <b>{_(p.gasto)}</b>
            </div>
            <div>
              <span>Cliques</span>
              <b>{p.cliques.toLocaleString("pt-BR")}</b>
            </div>
            <div>
              <span>Leads</span>
              <b>{p.leads}</b>
            </div>
            <div>
              <span>Custo por lead</span>
              <b>{p.custoPorLead === null ? "\u2014" : _(p.custoPorLead)}</b>
            </div>
          </div>
          {p.porDia.length > 1 ? (
            <GraficoBarras
              label="Gasto por dia nos últimos 30 dias"
              values={p.porDia.map((y) => y.gasto)}
              labels={p.porDia.map((y) => Va(y.day))}
              color="var(--blue)"
              money
            />
          ) : null}
          {p.campanhas.length === 0 ? (
            <p className="muted">
              A conta de anúncios não teve gasto nos últimos 30 dias. Quando voltar a rodar, as campanhas
              aparecem aqui com gasto, cliques e leads.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <jaDigitados>
                    <th>Campanha</th>
                    <th className="num">Gasto</th>
                    <th className="num">Cliques</th>
                    <th className="num">Leads</th>
                  </jaDigitados>
                </thead>
                <tbody>
                  {p.campanhas.map((y) => (
                    <jaDigitados>
                      <td>{y.nome}</td>
                      <td className="num">{_(y.gasto)}</td>
                      <td className="num">{y.cliques}</td>
                      <td className="num">{y.leads}</td>
                    </jaDigitados>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel" aria-labelledby="d-fun">
          <h2 id="d-fun">Funil e fila</h2>
          {w ? (
            <ul className="plain">
              <li>
                {"Cadastros "}
                <b>{w.cadastros}</b>
              </li>
              <li>
                {"Ativados "}
                <b>{w.ativados}</b>
              </li>
              <li>
                {"No limite de 5 "}
                <b>{w.noLimite}</b>
              </li>
              <li>
                {"Pagantes "}
                <b>{w.pagantes}</b>
              </li>
            </ul>
          ) : (
            <p className="muted">
              Sem funil ainda: a plataforma precisa mandar cadastros e uso para o Brain (PR no mvp-v2).
            </p>
          )}
          <p className="muted">
            {t.length}
            {" propostas esperando voc\xEA. IA no m\xEAs: "}
            {_(r.custoIa.mes)}
            {" de "}
            {_(r.custoIa.teto)}.
          </p>
        </section>
        <section className="panel span-3" aria-labelledby="d-ig">
          <h2 id="d-ig">Instagram @synapsa.ai</h2>
          <div className="mini-kpis">
            <div>
              <span>Seguidores</span>
              <b>{S.seguidores_hoje ?? "\u2014"}</b>
            </div>
            <div>
              <span>
                {"Novos nos \xFAltimos "}
                {k.length || 0}
                {" dias"}
              </span>
              <b>{k.length ? `+${k.reduce((y, A) => y + A.novos, 0)}` : "\u2014"}</b>
            </div>
            <div>
              <span>Engajamento por post</span>
              <b>{S.engajamento_medio_por_post ?? "\u2014"}</b>
            </div>
            <div>
              <span>Alcance ontem</span>
              <b>{S.historico_guardado.at(-1)?.reach ?? "\u2014"}</b>
            </div>
          </div>
          <div className="two">
            {k.length > 1 ? (
              <GraficoLinhas
                label="Seguidores novos por dia"
                labels={k.map((y) => Va(y.day))}
                series={[
                  {
                    name: "Novos",
                    color: "var(--ok)",
                    values: k.map((y) => y.novos),
                  },
                ]}
                height={120}
              />
            ) : C.length > 1 ? (
              <GraficoLinhas
                label="Seguidores ao longo do tempo"
                labels={C.map((y) => Va(y.day))}
                series={[
                  {
                    name: "Seguidores",
                    color: "var(--ok)",
                    values: C.map((y) => y.followers ?? 0),
                  },
                ]}
                height={120}
              />
            ) : (
              <p className="muted">
                O gráfico aparece quando houver mais de um dia de dados. Use “Atualizar dados”.
              </p>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <jaDigitados>
                    <th>Post</th>
                    <th className="num">Curtidas</th>
                    <th className="num">Coment.</th>
                  </jaDigitados>
                </thead>
                <tbody>
                  {(S.ultimos_posts ?? []).slice(0, 8).map((y) => (
                    <jaDigitados>
                      <td>
                        {y.data ? (
                          <span className="muted">
                            {Va(y.data)}
                            {" \xB7 "}
                          </span>
                        ) : null}
                        {y.link ? (
                          <a href={y.link} target="_blank" rel="noreferrer" className="link">
                            {y.legenda?.slice(0, 54) ?? y.tipo ?? "Post"}{" "}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                        ) : (
                          (y.legenda?.slice(0, 54) ?? "Post")
                        )}
                      </td>
                      <td className="num">{y.curtidas ?? "\u2014"}</td>
                      <td className="num">{y.comentarios ?? "\u2014"}</td>
                    </jaDigitados>
                  ))}
                </tbody>
              </table>
              {S.ultimos_posts?.length ? null : (
                <p className="muted">Sem posts carregados ainda. Use “Atualizar dados”.</p>
              )}
            </div>
          </div>
        </section>
        <section className="panel span-3" aria-labelledby="d-feed">
          <h2 id="d-feed">Atividade recente</h2>
          {e.activity.length === 0 ? (
            <p className="muted">Nada aconteceu ainda. Lance um plano na aba Equipes.</p>
          ) : null}
          <ol className="feed">
            {e.activity.slice(0, 10).map((y) => (
              <li className={`feed-${y.tone}`}>
                <span className="feed-time">{Ia(e.now, y.at)}</span>
                <div>
                  <strong>
                    {y.agentId === "voce"
                      ? "Voc\xEA"
                      : y.agentId === "sistema"
                        ? "Sistema"
                        : (so(y.agentId)?.name ?? y.agentId)}
                  </strong>
                  <p>{y.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
