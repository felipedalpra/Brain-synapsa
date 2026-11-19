// @ts-nocheck
// Inspeção de números: clique em um valor e veja os lançamentos/linhas de origem que o compõem.
import * as React from "react";
import { _ } from "../lib";

const dia = (d) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}` : d ?? "");

/** cfg: { titulo, sub?, total?, itens?: [{data?, desc, origem?, valor, aviso?}], carregar?: () => Promise<{total, itens}> } */
export function useInspetor() {
  const [cfg, setCfg] = React.useState(null);
  const [dados, setDados] = React.useState(null);
  const [erro, setErro] = React.useState("");
  React.useEffect(() => {
    if (!cfg) return;
    setErro("");
    if (cfg.itens) return setDados({ total: cfg.total, itens: cfg.itens });
    setDados(null);
    let vivo = true;
    cfg.carregar().then((r) => vivo && setDados(r)).catch((e) => vivo && setErro(String(e?.message ?? e)));
    return () => { vivo = false; };
  }, [cfg]);
  React.useEffect(() => {
    if (!cfg) return;
    const fn = (e) => e.key === "Escape" && setCfg(null);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [cfg]);

  const fmt = cfg ? cfg.formato ?? (dados?.formato === "num" ? (v) => Number(v).toLocaleString("pt-BR") : _) : _;
  const soma = dados ? Math.round(dados.itens.reduce((t, i) => t + (Number(i.valor) || 0), 0) * 100) / 100 : 0;
  const painel = cfg ? (
    <div className="insp-fundo" onClick={() => setCfg(null)}>
      <aside className="insp" role="dialog" aria-label={`Lançamentos de ${cfg.titulo}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h3>{cfg.titulo}</h3>
            {cfg.sub ? <small className="muted">{cfg.sub}</small> : null}
          </div>
          <button type="button" className="btn ghost" onClick={() => setCfg(null)} aria-label="Fechar">✕</button>
        </header>
        {erro ? <p className="t-crit">{erro}</p> : !dados ? <p className="muted">Carregando…</p> : (
          <>
            <p className="insp-total">
              <span>{dados.itens.length} lançamento(s)</span>
              <b>{fmt(soma)}</b>
            </p>
            {dados.itens.length === 0 ? <p className="muted">Nenhum lançamento compõe este número.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Data</th><th>Descrição</th><th>Origem</th><th className="num">Valor</th>{cfg.ignorar ? <th></th> : null}</tr></thead>
                  <tbody>
                    {dados.itens.map((i, k) => (
                      <tr key={k}>
                        <td>{dia(i.data)}</td>
                        <td>{i.desc}{i.aviso ? <small className="t-warn"> · {i.aviso}</small> : null}</td>
                        <td className="muted">{i.origem}{i.conciliado === false ? " · sem conciliar" : ""}</td>
                        <td className={`num ${i.valor < 0 ? "t-crit" : ""}`}>{fmt(i.valor)}</td>
                        {cfg.ignorar ? (
                          <td>
                            {String(i.ref ?? "").startsWith("extrato:") ? (
                              <button type="button" className="btn-link" title="Tira este lançamento da DRE e do caixa (ex.: movimentação de outro negócio)" onClick={() => cfg.ignorar(Number(i.ref.slice(8)), i)}>Ignorar</button>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {cfg.nota ? <p className="muted">{cfg.nota}</p> : null}
          </>
        )}
      </aside>
    </div>
  ) : null;
  return { abrir: setCfg, painel };
}

/** Número clicável: abre o inspetor. */
export function NumClick({ onClick, children, titulo = "Ver lançamentos" }) {
  return (
    <button type="button" className="num-click" title={titulo} onClick={onClick}>
      {children}
    </button>
  );
}

const ATIVAS = ["active", "trialing", "past_due"];

/** Abre as assinaturas que compõem MRR, ARR, clientes ou ticket. modo: efetivo | cheio | ativos | cancelados | arr */
export function verAssinaturas(insp, modo = "efetivo") {
  const cfg = {
    efetivo: ["MRR", "Assinaturas ativas pelo preço efetivo (o que cada cliente paga hoje)"],
    cheio: ["MRR sem descontos", "Assinaturas ativas pelo preço de tabela"],
    ativos: ["Clientes pagantes", "Assinaturas ativas, com o preço efetivo de cada uma"],
    cancelados: ["Clientes cancelados", "Assinaturas que não estão mais ativas"],
    arr: ["ARR", "MRR de cada assinatura ativa × 12"],
  }[modo];
  insp.abrir({
    titulo: cfg[0],
    sub: cfg[1],
    nota: "Se um cliente aparece duplicado, com valor errado ou como ativo sem dever estar, é aqui que dá para ver.",
    carregar: () =>
      import("../api").then(({ chamar }) =>
        chamar("/api/subscriptions").then((r) => ({
          itens: r.subscriptions
            .filter((s) => (modo === "cancelados" ? !ATIVAS.includes(s.status) : ATIVAS.includes(s.status)))
            .map((s) => {
              const base = modo === "cheio" ? s.list_price_brl : s.effective_price_brl;
              return {
                desc: s.label || s.external_id,
                origem: `${s.source}${s.origin ? " · " + s.origin : ""} · ${s.status}`,
                valor: (base ?? 0) * (modo === "arr" ? 12 : 1),
                aviso: s.discount_ends_at && modo !== "cheio" ? `desconto até ${String(s.discount_ends_at).slice(0, 10)}` : "",
              };
            }),
        })),
      ),
  });
}
