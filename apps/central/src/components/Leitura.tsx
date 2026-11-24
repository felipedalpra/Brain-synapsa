// @ts-nocheck
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";

const ROTULO: Record<string, string> = { seo: "SEO", analytics: "Analytics", prospeccao: "Prospecção", instinct: "Instinct", financeiro: "Financeiro", mercado: "Mercado" };
const hora = (t: number) => new Date(t).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/** Leitura do dia: o Brain cruza SEO, GA4, prospecção, Instinct e MRR e diz o que decidir. Vem pronta; o botão só refaz. */
export function Leitura() {
  const { live } = useBrain();
  const [d, setD] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const carregar = React.useCallback(() => { if (live) api.leitura().then(setD).catch(() => setD(null)); }, [live]);
  React.useEffect(() => { carregar(); }, [carregar]);
  const gerar = async () => {
    setBusy(true);
    try {
      const r = await api.leituraGerar();
      setD(r);
      avisos.push({ kind: r.message === "Leitura atualizada." ? "ok" : "erro", title: r.message });
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  if (!live || !d) return null;
  const l = d.atual;
  return (
    <section className="panel leitura" aria-label="Leitura do dia">
      <div className="seo-head">
        <h2>Leitura do dia</h2>
        <button type="button" className="btn" disabled={busy || !d.temChave} onClick={gerar} title={d.temChave ? "Refaz a leitura com os números de agora (usa IA)" : "Falta a chave do modelo nos secrets do Brain"}>
          {busy ? "Lendo os números…" : l ? "Refazer" : "Gerar leitura"}
        </button>
      </div>
      {!l ? (
        <p className="muted">Ainda não há leitura. Ela sai sozinha todo dia depois das sincronizações das 7h, ou clique em "Gerar leitura".</p>
      ) : (
        <>
          <p className="muted">{l.resumo}</p>
          <ol className="leitura-lista">
            {l.decisoes.map((x, i) => (
              <li key={i} className={`leitura-item imp-${x.impacto}`}>
                <div className="leitura-topo">
                  <b>{x.titulo}</b>
                  <span className="chip">{ROTULO[x.onde] ?? x.onde}</span>
                  <span className={`chip imp-${x.impacto}`}>impacto {x.impacto === "medio" ? "médio" : x.impacto}</span>
                </div>
                <p><small>Por quê:</small> {x.porque}</p>
                <p><small>Fazer:</small> {x.acao}</p>
              </li>
            ))}
          </ol>
          <p className="muted"><small>Gerada em {hora(l.criadoEm)}. Baseada só nos números do Brain; confira antes de agir em decisões grandes.</small></p>
        </>
      )}
    </section>
  );
}
