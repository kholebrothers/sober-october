/* =====================================================================
   D1 über echtes SQLite

   Der Server kennt D1 nur über prepare().bind().all/first/run() und
   batch(). Das lässt sich über node:sqlite nachbauen — mit echtem SQL,
   echtem Schema, echten Constraints. Eine Attrappe, die Abfragen nur
   mitschreibt, hätte den eindeutigen Namen nie verletzt.
   ===================================================================== */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server", "schema.sql");

export function d1() {
  const roh = new DatabaseSync(":memory:");
  roh.exec(fs.readFileSync(SCHEMA, "utf8"));

  function ausfuehren(sql, werte) {
    const r = roh.prepare(sql).run(...(werte || []));
    return {meta: {changes: Number(r.changes)}};
  }
  function befehl(sql, werte) {
    return {
      sql, werte,
      bind(...w) { return befehl(sql, w); },
      async all() { return {results: roh.prepare(sql).all(...(werte || []))}; },
      async first() { return roh.prepare(sql).get(...(werte || [])) || null; },
      async run() { return ausfuehren(sql, werte); }
    };
  }
  return {
    prepare: (sql) => befehl(sql, []),
    /* D1 führt einen Batch als Transaktion aus: alles oder nichts. */
    async batch(liste) {
      roh.exec("BEGIN");
      try {
        const out = liste.map((b) => ausfuehren(b.sql, b.werte));
        roh.exec("COMMIT");
        return out;
      } catch (e) { roh.exec("ROLLBACK"); throw e; }
    },
    roh
  };
}
