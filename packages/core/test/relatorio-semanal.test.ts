import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { run, row } from "../src/sql";
import { SEMENTES_PACIENTES, mercadoPainel, sincronizarPacientes, tendenciasPacientes } from "../src/mercado";
import { acoesDaSemana, dadosDaSemana, enviarRelatorioSemanal, montarTexto, ordenarAcoes, variacao, type DadosSemana } from "../src/relatorio-semanal";

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
const DIA = 86_400_000;

describe("tendências de busca por terapia", () => {
  it("guarda uma consulta por termo, marca o novo na semana seguinte e não mistura com o radar do psicólogo", async () => {
    let agora = Date.UTC(2026, 10, 23, 15);
    const brain = new Brain(openDb(":memory:"), () => agora);
    let chamadas = 0, semana2 = false;
    const f = (async () => { chamadas++; return json(["x", semana2 ? ["terapia online", "terapia online gratuita"] : ["terapia online"]]); }) as unknown as typeof fetch;
    expect(await sincronizarPacientes(brain, f)).toMatch(/atualizadas/);
    expect(chamadas).toBe(SEMENTES_PACIENTES.length);
    expect(await sincronizarPacientes(brain, f)).toMatch(/já atualizadas/);
    agora += 8 * DIA; semana2 = true;
    await sincronizarPacientes(brain, f);
    expect(tendenciasPacientes(brain).novas.map((x) => x.texto)).toContain("terapia online gratuita");
    expect(mercadoPainel(brain, {}).grupos).toHaveLength(0);
  });
});

describe("relatório semanal", () => {
  it("calcula variação em texto", () => {
    expect(variacao(120, 100)).toBe("+20%");
    expect(variacao(80, 100)).toBe("-20%");
    expect(variacao(5, 0)).toBe("novo");
    expect(variacao(0, 0)).toBe("sem dados");
  });

  it("monta os números do banco, envia só uma vez por semana e não leva rodapé de saída", async () => {
    const brain = new Brain(openDb(":memory:"), () => Date.UTC(2026, 10, 30, 17));
    for (let i = 1; i <= 14; i++) {
      const dia = new Date(Date.UTC(2026, 10, 30) - i * DIA).toISOString().slice(0, 10);
      run(brain.db, "insert into meta_ad_dia (day, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, spend, impressions, reach, clicks, link_clicks, leads, updated_at) values (?, 'a', 'A', 's', 'S', 'c', 'Campanha X', ?, 100, 80, 5, ?, 1, 0)", dia, i <= 7 ? 20 : 10, i <= 7 ? 6 : 3);
    }
    const d = dadosDaSemana(brain, {});
    expect(d.meta?.anuncios?.gasto).toEqual({ atual: 140, anterior: 70 });
    const { assunto, corpo } = montarTexto(d, { resumo: "Resumo de teste.", decisoes: [{ titulo: "Faça X", porque: "porque 10", acao: "agir", onde: "meta", impacto: "alto" }] });
    expect(assunto).toMatch(/tráfego da semana/);
    expect(corpo).toMatch(/Gasto: R\$ 140,00 \(\+100%/);
    expect(corpo).toMatch(/1\. Faça X/);

    const corpos: any[] = [];
    const f = (async (_u: string, init: any) => { corpos.push(JSON.parse(init.body)); return json({ id: "r1" }); }) as unknown as typeof fetch;
    const env = { RESEND_API_KEY: "k", RESEND_FROM: "Brain <b@x.com>" };
    expect(await enviarRelatorioSemanal(brain, env, f)).toMatch(/felipeodriosolladalpra@gmail\.com/);
    expect(corpos[0].to).toEqual(["felipeodriosolladalpra@gmail.com"]);
    expect(corpos[0].text).not.toMatch(/responda SAIR/);
    expect(corpos[0].headers).toBeUndefined();
    expect(corpos[0].html).toMatch(/Tráfego da semana/);
    expect(corpos[0].html).toMatch(/ESTA SEMANA/);
    expect(corpos[0].html).not.toMatch(/responda SAIR/);
    expect(await enviarRelatorioSemanal(brain, env, f)).toMatch(/já foi enviado/);
    expect(corpos).toHaveLength(1);
    expect(await enviarRelatorioSemanal(brain, env, f, { forcar: true })).toMatch(/enviado/);
    expect(row(brain.db, "select count(*) as n from envios where status = 'enviado'")).toEqual({ n: 2 });
  });

  it("transforma os números em tarefas com passos e meta", () => {
    const par = (atual: number, anterior: number) => ({ atual, anterior });
    const d: DadosSemana = {
      periodo: { de: "2026-11-23", ate: "2026-11-29" },
      google: [{ site: "synapsa.com.br", cliques: par(5, 20), impressoes: par(300, 400), topBuscas: [{ busca: "crm para psicólogos", cliques: 0, impressoes: 80, posicao: 9 }] }],
      visitas: [{ site: "synapsa.com.br", sessoes: par(60, 50), ultimoDia: "2026-11-24", canais: [], campanhas: [] }],
      meta: { anuncios: { gasto: par(100, 80), impressoes: par(1000, 900), alcance: par(900, 800), cliquesNoLink: par(40, 35), leads: par(0, 2), campanhas: [] }, instagram: { alcance: par(500, 900), visitasAoPerfil: par(100, 90), cliquesNoLink: par(3, 8) } },
      diretorio: { sessoes: par(12, 10), perfisMaisVistos: [], perfisComVisita: 3, perfisNoGoogle: { total: 20, comImpressao: 5, comClique: 1 } },
      tendencias: { primeiraLeitura: false, novas: ["terapia para burnout"], destaques: [] },
    };
    const acoes = acoesDaSemana(d);
    const titulos = acoes.map((a) => a.titulo).join("|");
    expect(titulos).toMatch(/não geram lead/);
    expect(titulos).toMatch(/Marque os links com UTM/);
    expect(titulos).toMatch(/GA4 está sem dado novo/);
    expect(titulos).toMatch(/Google trouxe menos gente/);
    expect(titulos).toMatch(/"crm para psicólogos" para o top 5/);
    expect(titulos).toMatch(/perfis do diretório aparecerem/);
    expect(titulos).toMatch(/mais gente ao diretório/);
    expect(titulos).toMatch(/clica no link/);
    expect(acoes.every((a) => (a.passos?.length ?? 0) >= 2 && a.sucesso)).toBe(true);

    const top = ordenarAcoes(acoes);
    expect(top).toHaveLength(5);
    expect(top.every((a) => a.impacto === "alto" || a.impacto === "medio")).toBe(true);
    const { corpo } = montarTexto(d, { resumo: "", decisoes: top });
    expect(corpo).toMatch(/O que fazer esta semana \(em ordem de prioridade\)/);
    expect(corpo).toMatch(/1\. .*\[impacto alto\]/);
    expect(corpo).toMatch(/\n- Abra o Gerenciador de Eventos/);
    expect(corpo).toMatch(/Deu certo quando:/);
  });

  it("não inventa tarefa quando está tudo bem", () => {
    const par = (atual: number, anterior: number) => ({ atual, anterior });
    const d: DadosSemana = {
      periodo: { de: "2026-11-23", ate: "2026-11-29" }, google: [{ site: "s", cliques: par(30, 28), impressoes: par(500, 480), topBuscas: [] }],
      visitas: [{ site: "s", sessoes: par(100, 90), ultimoDia: "2026-11-28", canais: [], campanhas: [{ campanha: "a", sessoes: 5, antes: 4 }] }],
      meta: { anuncios: null, instagram: null }, diretorio: { sessoes: par(80, 60), perfisMaisVistos: [], perfisComVisita: 9, perfisNoGoogle: { total: 10, comImpressao: 9, comClique: 5 } },
      tendencias: { primeiraLeitura: true, novas: [], destaques: [] },
    };
    expect(acoesDaSemana(d)).toEqual([]);
    expect(montarTexto(d, { resumo: "ok", decisoes: [] }).corpo).toMatch(/Nada urgente/);
  });
});
