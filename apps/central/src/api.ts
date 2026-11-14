// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.

export async function chamar(e, a, t = 2e4) {
  const r = new AbortController(),
    o = setTimeout(() => r.abort(), t);
  try {
    const s = await fetch(e, {
        ...a,
        signal: r.signal,
        headers: {
          "content-type": "application/json",
        },
      }),
      i = await s.json().catch(() => ({}));
    if (s.status === 401) throw (location.reload(), new Error("Fa\xE7a login."));
    if (!s.ok) throw new Error(i.error ?? `Erro ${s.status}`);
    return i;
  } finally {
    clearTimeout(o);
  }
}
export const post = (e, a = {}, t = 2e4) =>
  chamar(
    e,
    {
      method: "POST",
      body: JSON.stringify(a),
    },
    t,
  );
export const api = {
  async probe() {
    try {
      const e = await chamar("/api/health", void 0, 3e3);
      return e.ok === true && e.server === "brain-server"
        ? {
            sse: e.sse === true,
          }
        : null;
    } catch {
      return null;
    }
  },
  state: () => chamar("/api/state"),
  decide: (e, a, t = false) =>
    post(`/api/proposals/${encodeURIComponent(e)}/decide`, {
      to: a,
      enviar: t,
    }),
  send: (e) => post(`/api/proposals/${encodeURIComponent(e)}/send`, {}),
  action: (e) =>
    post("/api/actions", {
      action: e,
    }),
  chat: (e) =>
    post("/api/chat", {
      text: e,
    }),
  checkIntegrations: () => post("/api/integrations/check"),
  dashboard: () => chamar("/api/dashboard"),
  refreshData: () => post("/api/refresh-data", {}, 6e4),
  crmPainel: (e = false) => chamar(`/api/crm/painel${e ? "?atualizar=1" : ""}`, void 0, 45e3),
  prospeccao: () => chamar("/api/prospeccao"),
  prospeccaoDescoberta: (e, a) =>
    post("/api/prospeccao/descoberta", {
      regiao: e,
      maximo: a,
    }),
  prospeccaoEnriquecer: () => post("/api/prospeccao/enriquecer", {}),
  prospeccaoAuto: (e) => post("/api/prospeccao/auto", e),
  prospeccaoEmailsGerar: () => post("/api/prospeccao/emails/gerar", {}),
  prospeccaoEmailsEnviar: (e) =>
    post(
      "/api/prospeccao/emails/enviar",
      {
        ids: e,
      },
      9e4,
    ),
  prospeccaoContato: (e, a) =>
    post("/api/prospeccao/contato", {
      id: e,
      acao: a,
    }),
  seo: () => chamar("/api/seo"),
  instagram: () => chamar("/api/instagram"),
  instagramAcao: (id, acao, corpo) => post(`/api/instagram/${encodeURIComponent(id)}/${acao}`, corpo ?? {}, 9e4),
  instagramAuto: (ligado) => post("/api/instagram/auto", { ligado }),
  seoSincronizar: () => post("/api/seo/sincronizar", {}),
  prospeccaoWhatsapp: (id, etapa, acao) => post("/api/prospeccao/whatsapp", { id, etapa, acao }),
  prospeccaoRotina: (e) => post("/api/prospeccao/rotina", e),
  prospeccaoRotinaRodar: () => post("/api/prospeccao/rotina/rodar", {}),
  prospeccaoAvancar: () => post("/api/prospeccao/avancar", {}),
  prospeccaoEnviarCrm: (e) =>
    post(
      "/api/prospeccao/enviar-crm",
      {
        ids: e,
      },
      9e4,
    ),
  prospeccaoDescartar: (e, a) =>
    post("/api/prospeccao/descartar", {
      id: e,
      descartar: a,
    }),
  financeiro: () => chamar("/api/financeiro"),
  finConta: (e) =>
    post("/api/financeiro/conta", {
      conta: e,
    }),
  finPagar: (e, a, t) =>
    post("/api/financeiro/conta/pagar", {
      id: e,
      pagoEm: a,
      valor: t,
    }),
  finDesfazer: (e) =>
    post("/api/financeiro/conta/desfazer", {
      id: e,
    }),
  finRemover: (e) =>
    post("/api/financeiro/conta/remover", {
      id: e,
    }),
  finImportarExtrato: (e) =>
    post("/api/financeiro/importar-extrato", {
      texto: e,
    }),
  finCobranca: (e) =>
    post("/api/financeiro/cobranca", {
      cobranca: e,
    }),
  finCobrancaAtivar: (e, a) =>
    post("/api/financeiro/cobranca/ativar", {
      id: e,
      ativa: a,
    }),
  finCobrancaRemover: (e) =>
    post("/api/financeiro/cobranca/remover", {
      id: e,
    }),
  finLancamento: (e) =>
    post("/api/financeiro/lancamento", {
      lancamento: e,
    }),
  finLancamentoRemover: (e) =>
    post("/api/financeiro/lancamento/remover", {
      id: e,
    }),
  finPremissas: (e) =>
    post("/api/financeiro/premissas", {
      premissas: e,
    }),
  teamFeed: (e) => chamar(`/api/team-feed?team=${encodeURIComponent(e)}`),
};
