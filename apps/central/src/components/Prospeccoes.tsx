// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { useBrain } from "../store";
import { api } from "../api";
import { avisos } from "./Avisos";
import { jaDigitados } from "./Command";
import { th } from "../shared-inline";

export const Sh = {
  novo: "Novas",
  enriquecendo: "Lendo site",
  qualificado: "Qualificadas",
  revisar: "Revisar",
  descartado: "Descartadas",
  no_crm: "No CRM",
};
export const bh = ["qualificado", "revisar", "novo", "enriquecendo", "no_crm", "descartado"];
export const Ht = (e) => `US$ ${e.toFixed(2)}`;
export function ProspeccaoPainel() {
  const { live: e } = useBrain(),
    [a, t] = React.useState(null),
    [r, o] = React.useState(null),
    [s, i] = React.useState("qualificado"),
    [l, c] = React.useState("S\xE3o Paulo, SP"),
    [u, v] = React.useState(20),
    [g, x] = React.useState(/* @__PURE__ */ new Set()),
    [j, m] = React.useState(false),
    [N, h] = React.useState(/* @__PURE__ */ new Set()),
    f = React.useCallback(() => {
      e &&
        api
          .prospeccao()
          .then((k) => {
            (t(k), o(null));
          })
          .catch((k) => o(k instanceof Error ? k.message : "Erro ao carregar."));
    }, [e]),
    d = a?.rodadas.some((k) => k.status === "rodando") ?? false;
  React.useEffect(() => {
    f();
    const k = window.setInterval(
      () => {
        (d && api.prospeccaoAvancar().catch(() => {}), f());
      },
      d ? 8e3 : 6e4,
    );
    return () => window.clearInterval(k);
  }, [f, d]);
  const p = async (k, w) => {
    m(true);
    try {
      const y = await k();
      (avisos.push({
        kind: "ok",
        title: y.parou
          ? y.parou
          : y.enviados !== void 0
            ? `${y.enviados} e-mail(s) enviado(s)`
            : y.novos !== void 0
              ? `${y.novos} rascunho(s) novo(s) e ${y.followups} follow-up(s)`
              : (y.message ??
                (y.criados !== void 0
                  ? `${y.criados} no CRM \xB7 ${y.jaNoCrm} j\xE1 estavam \xB7 ${y.semTelefone} sem telefone`
                  : w)),
      }),
        x(/* @__PURE__ */ new Set()),
        h(/* @__PURE__ */ new Set()),
        f());
    } catch (y) {
      avisos.push({
        kind: "erro",
        title: y instanceof Error ? y.message : "N\xE3o deu certo.",
      });
    } finally {
      m(false);
    }
  };
  if (r) return <p className="empty">{r}</p>;
  if (!a) return <p className="empty">Carregando…</p>;
  const S = a.prospects.filter((k) => k.status === s),
    C = a.orcamento.mesUsd - a.orcamento.gastoUsd;
  return (
    <div className="stack">
      {a.configurado ? null : (
        <section className="panel">
          <h2>Falta o token do Apify</h2>
          <p className="muted">
            Guarde o APIFY_TOKEN nos secrets do Brain. Sem ele nada roda. O Brain só pesquisa e organiza; nada
            é enviado a ninguém.
          </p>
        </section>
      )}
      <section className="panel">
        <h2>Buscar clínicas</h2>
        <div
          className="row"
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <label>
            Cidade
            <br />
            <input list="regioes" value={l} onChange={(k) => c(k.target.value)} />
          </label>
          <datalist id="regioes">
            {a.regioes.map((k) => (
              <option value={k} />
            ))}
          </datalist>
          <label>
            Quantas
            <br />
            <input
              type="number"
              min={1}
              max={60}
              value={u}
              onChange={(k) => v(Number(k.target.value))}
              style={{
                width: 80,
              }}
            />
          </label>
          <button
            className="btn btn-go"
            disabled={j || !a.configurado}
            onClick={() => p(() => api.prospeccaoDescoberta(l, u), "Busca iniciada")}
          >
            Buscar no Google Maps
          </button>
          <button
            className="btn"
            disabled={j || !a.configurado || a.contagem.novo === 0}
            onClick={() => p(() => api.prospeccaoEnriquecer(), "Leitura iniciada")}
          >
            Ler sites das novas ({a.contagem.novo})
          </button>
        </div>
        <p className="muted">
          {"Gasto do m\xEAs no Apify: "}
          {Ht(a.orcamento.gastoUsd)}
          {" de "}
          {Ht(a.orcamento.mesUsd)}
          {" \xB7 sobra "}
          {Ht(Math.max(C, 0))}
          {" \xB7 teto por rodada "}
          {Ht(a.orcamento.porRodadaUsd)}.
        </p>
        {a.rodadas.slice(0, 4).map((k) => (
          <p className="muted">
            {k.tipo === "descoberta" ? "Busca" : "Leitura de sites"}
            {" \xB7 "}
            {k.consulta}
            {" \xB7 "}
            {k.status === "rodando"
              ? "rodando\u2026"
              : k.status === "falhou"
                ? `falhou: ${k.detalhe ?? ""}`
                : k.detalhe}{" "}
            {k.custoUsd ? `\xB7 ${Ht(k.custoUsd)}` : ""}
          </p>
        ))}
      </section>
      <section className="panel">
        <h2>Prospecção automática</h2>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={a.rotina.ativo}
            disabled={j}
            onChange={(k) =>
              p(
                () =>
                  api.prospeccaoRotina({
                    ativo: k.target.checked,
                  }),
                k.target.checked ? "Rotina ligada" : "Rotina desligada",
              )
            }
          />
          Todo dia útil às 10h, buscar clínicas, ler os sites e gerar os rascunhos de e-mail
        </label>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            margin: "8px 0",
            alignItems: "end",
          }}
        >
          <label>
            Lugares por busca
            <br />
            <input
              type="number"
              min={5}
              max={60}
              defaultValue={a.rotina.maximo}
              style={{
                width: 80,
              }}
              onBlur={(k) => {
                const w = Number(k.target.value);
                w !== a.rotina.maximo &&
                  p(
                    () =>
                      api.prospeccaoRotina({
                        maximo: w,
                      }),
                    "Salvo",
                  );
              }}
            />
          </label>
          <button
            className="btn"
            disabled={j || !a.configurado}
            onClick={() => p(() => api.prospeccaoRotinaRodar(), "Rotina iniciada")}
          >
            Rodar agora ({a.rotina.proxima})
          </button>
        </div>
        <p className="muted">
          {a.rotina.ativo
            ? `Ligada: segunda a sexta, 10h. Pr\xF3xima cidade: ${a.rotina.proxima}${a.rotina.ultimaData ? ` \xB7 \xFAltima busca em ${a.rotina.ultimaData.split("-").reverse().join("/")}` : ""}. `
            : "Desligada. "}
          As cidades giram na ordem da lista (SP, RJ, MG e arredores). Os e-mails continuam esperando o seu OK
          para sair.
        </p>
      </section>
      <section className="panel">
        <h2>Registro automático no CRM</h2>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={a.auto.ativo}
            disabled={j}
            onChange={(k) =>
              p(
                () =>
                  api.prospeccaoAuto({
                    ativo: k.target.checked,
                  }),
                k.target.checked ? "Autom\xE1tico ligado" : "Autom\xE1tico desligado",
              )
            }
          />
          Quando uma clínica for qualificada, criar o lead no CRM sozinho
        </label>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            margin: "8px 0",
          }}
        >
          <label>
            Nota mínima
            <br />
            <input
              type="number"
              min={0}
              max={100}
              defaultValue={a.auto.notaMin}
              style={{
                width: 80,
              }}
              onBlur={(k) => {
                const w = Number(k.target.value);
                w !== a.auto.notaMin &&
                  p(
                    () =>
                      api.prospeccaoAuto({
                        notaMin: w,
                      }),
                    "Nota m\xEDnima salva",
                  );
              }}
            />
          </label>
          <label>
            Máximo por dia
            <br />
            <input
              type="number"
              min={1}
              max={40}
              defaultValue={a.auto.limiteDia}
              style={{
                width: 80,
              }}
              onBlur={(k) => {
                const w = Number(k.target.value);
                w !== a.auto.limiteDia &&
                  p(
                    () =>
                      api.prospeccaoAuto({
                        limiteDia: w,
                      }),
                    "Limite salvo",
                  );
              }}
            />
          </label>
        </div>
        <p className="muted">
          {a.auto.ativo
            ? `Ligado: entram sozinhas as qualificadas com nota ${a.auto.notaMin} ou mais, at\xE9 ${a.auto.limiteDia} por dia (${a.auto.hoje} hoje). `
            : "Desligado: nada entra no CRM sem o seu clique. "}
          Só cria o lead. Nunca envia mensagem.
        </p>
      </section>
      <section className="panel">
        <h2>E-mail de prospecção</h2>
        <p className="muted">
          Rascunho para cada clínica qualificada com e-mail público (4+ psicólogos), oferecendo uma
          demonstração de 30 minutos. Nada sai sem o seu OK. Follow-ups em D+3 e D+7 viram rascunho sozinhos e
          param quando você marca "Respondeu" ou "Pediu SAIR". {"Enviados hoje: "}
          {a.emails.enviadosHoje}
          {" de "}
          {a.emails.capDia}
          {" \xB7 total: "}
          {a.emails.enviadosTotal}.
        </p>
        {a.emails.remetenteOk ? null : (
          <p className="muted">
            Falta o remetente de prospecção (RESEND_FROM_PROSPECCAO) ou a chave do Resend.
          </p>
        )}
        <p>
          <button
            className="btn"
            disabled={j}
            onClick={() => p(() => api.prospeccaoEmailsGerar(), "Rascunhos gerados")}
          >
            Gerar rascunhos
          </button>
        </p>
        {a.emails.pendentes.length === 0 ? (
          <p className="empty">Nenhum rascunho esperando aprovação.</p>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table>
                <thead>
                  <jaDigitados>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos os rascunhos"
                        checked={a.emails.pendentes.every((k) => N.has(k.id))}
                        onChange={(k) =>
                          h(
                            k.target.checked
                              ? new Set(a.emails.pendentes.map((w) => w.id))
                              : /* @__PURE__ */ new Set(),
                          )
                        }
                      />
                    </th>
                    <th>Clínica</th>
                    <th>Para</th>
                    <th>Etapa</th>
                    <th>Texto</th>
                  </jaDigitados>
                </thead>
                <tbody>
                  {a.emails.pendentes.map((k) => (
                    <jaDigitados>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${k.nome}`}
                          checked={N.has(k.id)}
                          onChange={(w) => {
                            const y = new Set(N);
                            (w.target.checked ? y.add(k.id) : y.delete(k.id), h(y));
                          }}
                        />
                      </td>
                      <td>{k.nome}</td>
                      <td>{k.para}</td>
                      <td>{k.etapa === 0 ? "Primeiro" : k.etapa === 1 ? "D+3" : "D+7"}</td>
                      <td>
                        <details>
                          <summary>{k.assunto}</summary>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              font: "inherit",
                              margin: "8px 0 0",
                            }}
                          >
                            {k.corpo}
                          </pre>
                        </details>
                      </td>
                    </jaDigitados>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <button
                className="btn btn-go"
                disabled={j || N.size === 0 || !a.emails.remetenteOk}
                onClick={() => p(() => api.prospeccaoEmailsEnviar([...N]), "Enviado")}
              >
                {"Aprovar e enviar "}
                {N.size || ""}
                {" selecionado(s)"}
              </button>{" "}
              <span className="muted">
                Leia os textos antes. O limite do dia vale: o que passar fica na fila.
              </span>
            </p>
          </>
        )}
      </section>
      <section className="panel">
        <div className="subtabs" role="tablist">
          {bh.map((k) => (
            <button
              role="tab"
              aria-selected={s === k}
              className={s === k ? "on" : ""}
              onClick={() => {
                (i(k), x(/* @__PURE__ */ new Set()));
              }}
            >
              {Sh[k]}
              {" ("}
              {a.contagem[k]})
            </button>
          ))}
        </div>
        {s === "qualificado" && S.length > 0 ? (
          <p>
            <button
              className="btn btn-go"
              disabled={j}
              onClick={() =>
                p(
                  () =>
                    api.prospeccaoEnviarCrm(
                      S.filter((k) => !k.noCrm)
                        .slice(0, 40)
                        .map((k) => k.id),
                    ),
                  "Enviado",
                )
              }
            >
              {"Criar todas as "}
              {Math.min(S.length, 40)}
              {" qualificadas no CRM"}
            </button>{" "}
            <span className="muted">Pula quem já está no CRM pelo telefone. Não envia mensagem.</span>
          </p>
        ) : null}
        {S.length === 0 ? (
          <p className="empty">Nada aqui ainda.</p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table>
              <thead>
                <jaDigitados>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Selecionar todas"
                      checked={
                        S.filter((k) => !k.noCrm).length > 0 &&
                        S.filter((k) => !k.noCrm).every((k) => g.has(k.id))
                      }
                      onChange={(k) =>
                        x(
                          k.target.checked
                            ? new Set(S.filter((w) => !w.noCrm).map((w) => w.id))
                            : /* @__PURE__ */ new Set(),
                        )
                      }
                    />
                  </th>
                  <th>Clínica</th>
                  <th>Cidade</th>
                  <th>Psicólogos</th>
                  <th>E-mail público</th>
                  <th>Nota</th>
                  <th />
                </jaDigitados>
              </thead>
              <tbody>
                {S.map((k) => (
                  <jaDigitados>
                    <td>
                      {k.noCrm ? null : (
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${k.nome}`}
                          checked={g.has(k.id)}
                          onChange={(w) => {
                            const y = new Set(g);
                            (w.target.checked ? y.add(k.id) : y.delete(k.id), x(y));
                          }}
                        />
                      )}
                    </td>
                    <td>
                      {k.site ? (
                        <a
                          href={k.site.startsWith("http") ? k.site : `https://${k.site}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {k.nome}
                        </a>
                      ) : (
                        k.nome
                      )}
                    </td>
                    <td>
                      {k.cidade ?? "\u2014"}
                      {k.uf ? `/${k.uf}` : ""}
                    </td>
                    <td>{k.equipe ?? "\u2014"}</td>
                    <td>{k.email ?? "\u2014"}</td>
                    <td>{k.nota}</td>
                    <td
                      style={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k.noCrm || k.status === "descartado" ? null : (
                        <button
                          className="btn btn-go"
                          disabled={j}
                          onClick={() => p(() => api.prospeccaoEnviarCrm([k.id]), "Adicionado ao CRM")}
                        >
                          Adicionar ao CRM
                        </button>
                      )}{" "}
                      {k.emailEtapa !== null && !k.respondeu ? (
                        <>
                          <button
                            className="btn"
                            disabled={j}
                            onClick={() =>
                              p(() => api.prospeccaoContato(k.id, "respondeu"), "Marcada como respondeu")
                            }
                          >
                            Respondeu
                          </button>{" "}
                          <button
                            className="btn"
                            disabled={j}
                            onClick={() =>
                              p(() => api.prospeccaoContato(k.id, "sair"), "N\xE3o recebe mais e-mails")
                            }
                          >
                            Pediu SAIR
                          </button>{" "}
                        </>
                      ) : k.respondeu ? (
                        <span className="muted">{"Sequ\xEAncia parada "}</span>
                      ) : null}
                      {k.status === "descartado" ? (
                        <button
                          className="btn"
                          onClick={() => p(() => api.prospeccaoDescartar(k.id, false), "Voltou para revisar")}
                        >
                          Reabrir
                        </button>
                      ) : k.noCrm ? null : (
                        <button
                          className="btn"
                          onClick={() => p(() => api.prospeccaoDescartar(k.id, true), "Descartada")}
                        >
                          Descartar
                        </button>
                      )}
                    </td>
                  </jaDigitados>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {g.size > 0 ? (
          <p>
            <button
              className="btn btn-go"
              disabled={j}
              onClick={() => p(() => api.prospeccaoEnviarCrm([...g]), "Enviado")}
            >
              {"Criar "}
              {g.size}
              {" no CRM"}
            </button>{" "}
            <span className="muted">Pula quem já está no CRM pelo telefone. Não envia mensagem.</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
