/* Das Netz — nur für die Gruppe.

   Ein Abruf mit ETag (304, wenn sich nichts geändert hat) und ein Senden.
   Alles andere läuft ohne Netz weiter: Ist der Server nicht da (offline,
   lokal ohne Worker, noch keine Datenbank), ist `erreichbar` falsch, und
   die Seite zeigt die Gruppe einfach nicht. */

let etag = null;
let stand = null;
export let erreichbar = false;

/** @returns {stand, neu} — neu: ob sich seit dem letzten Mal etwas geändert hat */
export async function holen() {
  try {
    const r = await fetch("/api/state", { headers: etag ? { "if-none-match": etag } : {}, cache: "no-store" });
    if (r.status === 304) { erreichbar = true; return { stand, neu: false }; }
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error(String(r.status));
    stand = await r.json();
    etag = r.headers.get("etag");
    erreichbar = true;
    return { stand, neu: true };
  } catch {
    erreichbar = false;
    return { stand, neu: false };
  }
}

/** POST an die API. Wirft einen Fehler mit dem Schlüssel des Servers
    (`name-vergeben`, `gruppe-voll`, …) oder `netz`. */
export async function senden(pfad, body) {
  let r;
  try {
    r = await fetch(pfad, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw Object.assign(new Error("netz"), { schluessel: "netz" });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.fehler || "fehler"), { schluessel: j.fehler || "fehler" });
  etag = null;   // der nächste Abruf holt sicher neu
  return j;
}
