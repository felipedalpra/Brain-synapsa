import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { estadoFrescor, FONTES } from "../src/frescor";

describe("frescor", () => {
  it("fonte nunca lida está atrasada; depois de lida, deixa de estar até vencer o intervalo", () => {
    let agora = Date.UTC(2026, 10, 27, 13);
    const brain = new Brain(openDb(":memory:"), () => agora);
    const env = {};
    const ini = estadoFrescor(brain, env);
    expect(ini.haAtraso).toBe(true);
    expect(ini.fontes.map((f) => f.id)).not.toContain("meta"); // sem token da Meta, a fonte fica de fora
    for (const f of FONTES) brain.setPolicy(`fresco_${f.id}`, { ok: agora, tentou: agora });
    expect(estadoFrescor(brain, env).haAtraso).toBe(false);
    agora += 31 * 60_000; // Instinct e CRM vencem em 30 min
    const dep = estadoFrescor(brain, env);
    expect(dep.haAtraso).toBe(true);
    expect(dep.fontes.filter((f) => f.atrasada).map((f) => f.id).sort()).toEqual(["crm", "instinct"]);
  });
  it("depois de erro, tenta de novo em 10 min e mostra o erro", () => {
    let agora = Date.UTC(2026, 10, 27, 13);
    const brain = new Brain(openDb(":memory:"), () => agora);
    for (const f of FONTES) brain.setPolicy(`fresco_${f.id}`, { ok: agora, tentou: agora });
    brain.setPolicy("fresco_crm", { ok: agora - 40 * 60_000, tentou: agora, erro: "falhou" });
    const e = estadoFrescor(brain, {});
    expect(e.fontes.find((f) => f.id === "crm")).toMatchObject({ atrasada: false, erro: "falhou" });
    agora += 11 * 60_000;
    expect(estadoFrescor(brain, {}).fontes.find((f) => f.id === "crm")?.atrasada).toBe(true);
  });
});
