import type { Db } from "@brain/core";

/** O pedaço de ctx.storage que usamos. Tipado à mão para o teste poder trocar por um SQLite de Node. */
export interface DoStorage {
  sql: { exec(q: string, ...bindings: (string | number | null)[]): { toArray(): any[] } };
  transactionSync<T>(fn: () => T): T;
}

/** Adapta o SQLite do Durable Object (síncrono) à interface Db do núcleo. */
export function doDb(storage: DoStorage, schema: string): Db {
  const sql = storage.sql;
  const db: Db = {
    exec(q) {
      for (const stmt of q.split(";")) if (stmt.trim()) sql.exec(stmt).toArray();
    },
    prepare(q) {
      const isInsert = /^\s*insert\b/i.test(q);
      return {
        all: (...p) => sql.exec(q, ...p).toArray(),
        get: (...p) => sql.exec(q, ...p).toArray()[0],
        run: (...p) => {
          sql.exec(q, ...p).toArray(); // consome o cursor: é isso que executa
          return isInsert ? { lastInsertRowid: Number(sql.exec("select last_insert_rowid() as id").toArray()[0].id) } : {};
        },
      };
    },
    transaction: (fn) => storage.transactionSync(fn),
  };
  db.exec(schema);
  return db;
}
