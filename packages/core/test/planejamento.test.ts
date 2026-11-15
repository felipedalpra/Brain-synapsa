import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { planAcao, planPainel, segundaDe } from "../src/planejamento";

const T0 = Date.parse("2026-11-15T22:30:00Z"); // domingo 19h30 em Brasília
const mk = () => { const b = new Brain(openDb(":memory:"), () => T0); seedKnownFacts(b); return b; };

describe("planejamento semanal", () => {
  it("a semana começa na segunda (horário de Brasília)", () => {
    expect(segundaDe("2026-11-15")).toBe("2026-11-09");
    expect(segundaDe("2026-11-16")).toBe("2026-11-16");
    expect(planPainel(mk())).toMatchObject({ semana: "2026-11-09", fim: "2026-11-15", ehAtual: true });
  });
  it("cria post e tarefa, marca status e calcula a taxa", () => {
    const b = mk();
    planAcao(b, { acao: "criar", tipo: "post", titulo: "O que muda quando o consultório vira clínica", dia: 1, formato: "carrossel", semana: "2026-11-16" });
    let p = planAcao(b, { acao: "criar", tipo: "tarefa", titulo: "Mandar contrato AGES", responsavel: "Cassio", semana: "2026-11-16" });
    expect(p.posts[0]).toMatchObject({ dia: 1, formato: "carrossel", status: "pendente" });
    p = planAcao(b, { acao: "status", id: p.tarefas[0]!.id, status: "concluida" });
    expect(p.resumo.geral).toMatchObject({ total: 2, concluidas: 1, taxa: 0.5 });
    expect(p.resumo.porResponsavel.find((r) => r.nome === "Cassio")).toMatchObject({ total: 1, concluidas: 1 });
    expect(() => planAcao(b, { acao: "criar", titulo: " " })).toThrow(/título/);
  });
  it("subtarefas: a tarefa acompanha o andamento e a taxa conta as subtarefas", () => {
    const b = mk();
    let p = planAcao(b, { acao: "criar", tipo: "tarefa", titulo: "Ativação do CRM", responsavel: "Felipe Dalpra" });
    const pai = p.tarefas[0]!.id;
    planAcao(b, { acao: "criar", pai, titulo: "Importar leads" });
    p = planAcao(b, { acao: "criar", pai, titulo: "Ligar automações", responsavel: "Felipe Augusto" });
    expect(p.tarefas[0]!.subtarefas.map((s) => s.responsavel)).toEqual(["Felipe Dalpra", "Felipe Augusto"]);
    p = planAcao(b, { acao: "status", id: p.tarefas[0]!.subtarefas[0]!.id, status: "concluida" });
    expect(p.tarefas[0]!.status).toBe("andamento");
    expect(p.resumo.geral).toMatchObject({ total: 2, concluidas: 1 });
    p = planAcao(b, { acao: "status", id: pai, status: "concluida" });
    expect(p.tarefas[0]!.subtarefas.every((s) => s.status === "concluida")).toBe(true);
    expect(() => planAcao(b, { acao: "criar", pai: p.tarefas[0]!.subtarefas[0]!.id, titulo: "x" })).toThrow(/Subtarefa/);
    p = planAcao(b, { acao: "remover", id: pai });
    expect(p.tarefas).toHaveLength(0);
  });
  it("traz os pendentes da semana anterior uma vez só e guarda o histórico", () => {
    const b = mk();
    let p = planAcao(b, { acao: "criar", tipo: "tarefa", titulo: "Otimização de SEO", semana: "2026-11-09" });
    planAcao(b, { acao: "criar", pai: p.tarefas[0]!.id, titulo: "Página de Porto Alegre" });
    p = planAcao(b, { acao: "criar", tipo: "tarefa", titulo: "Gravar reels", semana: "2026-11-09" });
    planAcao(b, { acao: "status", id: p.tarefas[1]!.id, status: "concluida" });
    expect(planPainel(b, "2026-11-16").pendentesAnterior).toBe(1);
    p = planAcao(b, { acao: "trazer_pendentes", semana: "2026-11-16" });
    expect(p.tarefas.map((t) => t.titulo)).toEqual(["Otimização de SEO"]);
    expect(p.tarefas[0]!.subtarefas).toHaveLength(1);
    expect(planAcao(b, { acao: "trazer_pendentes", semana: "2026-11-16" }).tarefas).toHaveLength(1);
    expect(p.pendentesAnterior).toBe(0);
    const h = planPainel(b, "2026-11-09").historico;
    expect(h.find((x) => x.semana === "2026-11-09")).toMatchObject({ total: 2, concluidas: 1, taxa: 0.5 });
  });
});
