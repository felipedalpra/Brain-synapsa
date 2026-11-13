import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { Brain, Runner, SCHEMA, complianceReviewer, seedKnownFacts } from "@brain/core";
import { doDb, type DoStorage } from "../src/do-db";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

/** Imita ctx.storage do Durable Object: cursor com toArray(), sem BEGIN/COMMIT manual, transactionSync. */
function fakeStorage(): DoStorage {
  const raw = new DatabaseSync(":memory:");
  raw.exec("pragma foreign_keys = on;");
  return {
    sql: {
      exec(q, ...b) {
        if (/^\s*(begin|commit|rollback)\b/i.test(q)) throw new Error("BEGIN/COMMIT não são permitidos no Durable Object");
        return { toArray: () => raw.prepare(q).all(...b) as any[] };
      },
    },
    transactionSync(fn) {
      raw.exec("begin");
      try {
        const r = fn();
        raw.exec("commit");
        return r;
      } catch (e) {
        raw.exec("rollback");
        throw e;
      }
    },
  };
}

describe("adaptador do Durable Object", () => {
  it("cria o schema, semeia os fatos e fecha o MRR de R$ 496", () => {
    const brain = new Brain(doDb(fakeStorage(), SCHEMA));
    seedKnownFacts(brain);
    expect(brain.snapshot([]).metrics.mrr.total).toBe(496);
  });
  it("devolve lastInsertRowid e roda uma tarefa de ponta a ponta", async () => {
    const brain = new Brain(doDb(fakeStorage(), SCHEMA));
    brain.reviewer = complianceReviewer;
    seedKnownFacts(brain);
    const runner = new Runner(brain, {});
    const id = brain.assignTask("guardiao", "conciliar", "voce");
    expect(id).toBeGreaterThan(0);
    await runner.idle();
    expect(brain.snapshot([]).runtime["guardiao"]?.status).toBe("ocioso");
  });
  it("transação desfaz tudo se algo falha", () => {
    const db = doDb(fakeStorage(), SCHEMA);
    expect(() =>
      db.transaction(() => {
        db.prepare("insert into policies (key, value) values (?, ?)").run("x", "1");
        throw new Error("falha");
      }),
    ).toThrow("falha");
    expect(db.prepare("select * from policies where key = 'x'").get()).toBeUndefined();
  });
});
