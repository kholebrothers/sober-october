/* =====================================================================
   Der Worker

   Dateien liefert die Asset-Schicht aus public/ von selbst aus; der Worker
   bekommt nur /api/* (run_worker_first in wrangler.jsonc).

   Der Raum hängt an der Adresse: die Live-Adresse ist "live", alles andere
   — Vorschauen, localhost — ist "vorschau". So schreibt keine Vorschau in
   die Gruppe von live, obwohl beide dieselbe D1 haben. Dort gilt auch die
   Dev-Uhr, damit sich eine Vorschau gemeinsam durch den Oktober spulen
   lässt; live glaubt der Server keinem Kopf.

   Das Schema legt der Worker beim ersten Aufruf selbst an (CREATE … IF NOT
   EXISTS). Es gibt keinen Migrationsschritt, den man vergessen kann.
   ===================================================================== */

import { beantworte } from "./api.js";
import { jetztFuer } from "./dev-uhr.js";
import SCHEMA from "./schema.sql";

const LIVE = /^sober-october\.[a-z0-9-]+\.workers\.dev$/;

let bereit = null;
function schema(db) {
  const befehle = SCHEMA.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
  return (bereit ||= db.batch(befehle.map((s) => db.prepare(s))).catch((e) => { bereit = null; throw e; }));
}

export default {
  async fetch(anfrage, umgebung) {
    const url = new URL(anfrage.url);
    if (!url.pathname.startsWith("/api/")) return umgebung.ASSETS.fetch(anfrage);
    const raum = LIVE.test(url.hostname) ? "live" : "vorschau";
    if (umgebung.DB) await schema(umgebung.DB);
    const jetzt = jetztFuer(anfrage, raum === "vorschau" ? {DEV_UHR: "an"} : umgebung);
    return await beantworte(anfrage, umgebung.DB, {raum, jetzt});
  }
};
