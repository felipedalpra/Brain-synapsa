import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA, type Db } from "./sql";

// O Vite remove o prefixo "node:" de sqlite; carregar por require evita o problema nos testes.
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

/** Banco SQLite em arquivo (ou ":memory:") para o servidor local e os testes. Não entra no bundle do Worker. */
export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const raw = new DatabaseSync(path);
  raw.exec("pragma journal_mode = wal; pragma foreign_keys = on;");
  raw.exec(SCHEMA);
  let depth = 0;
  return {
    exec: (sql) => void raw.exec(sql),
    prepare: (sql) => raw.prepare(sql) as unknown as ReturnType<Db["prepare"]>,
    transaction<T>(fn: () => T): T {
      if (depth > 0) return fn();
      raw.exec("begin");
      depth++;
      try {
        const r = fn();
        raw.exec("commit");
        return r;
      } catch (e) {
        raw.exec("rollback");
        throw e;
      } finally {
        depth--;
      }
    },
  };
}
