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
              <b>{cfg.formato ? cfg.formato(soma) : _(soma)}</b>
            </p>
            {dados.itens.length === 0 ? <p className="muted">Nenhum lançamento compõe este número.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Data</th><th>Descrição</th><th>Origem</th><th className="num">Valor</th></tr></thead>
                  <tbody>
                    {dados.itens.map((i, k) => (
                      <tr key={k}>
                        <td>{dia(i.data)}</td>
                        <td>{i.desc}{i.aviso ? <small className="t-warn"> · {i.aviso}</small> : null}</td>
                        <td className="muted">{i.origem}{i.conciliado === false ? " · sem conciliar" : ""}</td>
                        <td className={`num ${i.valor < 0 ? "t-crit" : ""}`}>{cfg.formato ? cfg.formato(i.valor) : _(i.valor)}</td>
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
