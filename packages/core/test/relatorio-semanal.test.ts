import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { run, row } from "../src/sql";
import { SEMENTES_PACIENTES, mercadoPainel, sincronizarPacientes, tendenciasPacientes } from "../src/mercado";
import { dadosDaSemana, enviarRelatorioSemanal, montarTexto, variacao } from "../src/relatorio-semanal";

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
    expect(await enviarRelatorioSemanal(brain, env, f)).toMatch(/já foi enviado/);
    expect(corpos).toHaveLength(1);
    expect(await enviarRelatorioSemanal(brain, env, f, { forcar: true })).toMatch(/enviado/);
    expect(row(brain.db, "select count(*) as n from envios where status = 'enviado'")).toEqual({ n: 2 });
  });
});
