/* =====================================================================
   Die API der Teilnahme

   Nach kur-core/server/api.js (Stand f9e139a): dieselben Tabellen, dieselbe
   Antwort mit Schlüsseln statt Sätzen, derselbe ETag. Anders als dort:

   - **Räume.** Jede Person gehört zu einem Raum ("live" oder "vorschau",
     siehe schema.sql). Lesen und Schreiben sehen nur den eigenen.
   - **Eng.** Der Kern nimmt jeden Schlüssel und jeden Wert des
     Wertevertrags an, auch kurze Texte. Hier gibt es genau zwei Dinge:
     den Tag `dabei` (nur `true`) und die Einstellung `commitment` (eine
     Liste von Tracker-Schlüsseln). Mehr soll nicht auf den Server — dann
     kann auch nichts anderes aus Versehen dort landen.
   - **Abschied.** Wer geht, nimmt alles mit: Person, Tage, Einstellungen.

       GET  /api/state         Personen, Tage dabei, Commitments des Raums
       POST /api/einrichtung   {name, commitment}          → {id, name}
       POST /api/entry         {person, date, value}       Tag dabei / weg
       POST /api/setting       {person, value, ab}         Commitment
       POST /api/abschied      {person}                    alles weg

   ## Kein Login ist eine Entscheidung, keine Lücke

   Wer den Link hat, kann als jede Person der Gruppe schreiben. Das ist die
   Grundannahme des Musters: ein gemeinsamer Weg unter Leuten, die sich
   kennen. Deshalb steht hier so wenig.
   ===================================================================== */

const TAGE_ZURUECK = 90;
export const MAX_PERSONEN = 20;
const NAME_MAX = 24;

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const PERSON = /^p[a-z0-9]{1,16}$/;
const TRACKER = /^[a-z0-9-]{1,20}$/;
const STEUERZEICHEN = /[\u0000-\u001f\u007f]/g;
const RAEUME = new Set(["live", "vorschau"]);

function fehler(schluessel, status) {
  const e = new Error(schluessel);
  e.schluessel = schluessel;
  e.status = status || 400;
  return e;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}
  });
}

/* Der Server rechnet in UTC, die Leute leben in ihrer Zeitzone: nach
   Mitternacht ist ihr Datum dem UTC-Datum voraus. Ein Tag Spielraum. */
function tagVorTagen(n, jetzt) {
  return new Date(jetzt - n * 86400000).toISOString().slice(0, 10);
}

/**
 * @param {Request} anfrage
 * @param {object} db     D1 oder etwas, das so aussieht.
 * @param {object} o      {raum, jetzt}
 * @returns {Promise<Response|null>}  null: das ist keine API-Anfrage.
 */
export async function beantworte(anfrage, db, o) {
  const url = new URL(anfrage.url);
  if (!url.pathname.startsWith("/api/")) return null;
  const jetzt = (o && o.jetzt) || Date.now();
  const raum = o && o.raum;
  if (!RAEUME.has(raum)) return json({fehler: "raum-unbekannt"}, 500);
  if (!db) return json({fehler: "keine-datenbank"}, 503);
  try {
    const m = anfrage.method, p = url.pathname;
    if (p === "/api/state" && m === "GET") return await stand(db, raum, anfrage.headers.get("if-none-match"), jetzt);
    if (m === "POST") {
      const body = await koerper(anfrage);
      if (p === "/api/einrichtung") return json(await einrichtung(db, raum, body, jetzt));
      if (p === "/api/entry") return json(await eintrag(db, raum, body, jetzt));
      if (p === "/api/setting") return json(await einstellung(db, raum, body, jetzt));
      if (p === "/api/abschied") return json(await abschied(db, raum, body));
    }
    return json({fehler: "unbekannter-endpunkt"}, 404);
  } catch (e) {
    return json({fehler: e.schluessel || "fehler"}, e.status || 500);
  }
}

async function koerper(anfrage) {
  try { return (await anfrage.json()) || {}; } catch (e) { throw fehler("json-ungueltig"); }
}

/* ---- Lesen ---------------------------------------------------------- */

async function stand(db, raum, ifNoneMatch, jetzt) {
  const body = JSON.stringify(await lesen(db, raum, jetzt));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const etag = '"' + [...new Uint8Array(digest)].slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0")).join("") + '"';
  const kopf = {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", etag};
  if (ifNoneMatch && ifNoneMatch === etag) return new Response(null, {status: 304, headers: kopf});
  return new Response(body, {status: 200, headers: kopf});
}

/** {people: [{id, name}], log: {date: {person: {dabei: true}}}, settings: {person: {commitment: {wert, ab}}}} */
export async function lesen(db, raum, jetzt) {
  const seit = tagVorTagen(TAGE_ZURUECK, jetzt || Date.now());
  const [leute, zeilen, einst] = await Promise.all([
    db.prepare("SELECT id, name FROM people WHERE raum = ? ORDER BY created_at, id").bind(raum).all(),
    db.prepare(`SELECT e.date, e.person_id, e.habit, e.value FROM entries e JOIN people p ON p.id = e.person_id
                WHERE p.raum = ? AND e.date >= ?`).bind(raum, seit).all(),
    db.prepare(`SELECT s.person_id, s.key, s.value, s.ab FROM settings s JOIN people p ON p.id = s.person_id
                WHERE p.raum = ?`).bind(raum).all()
  ]);
  const log = {};
  for (const z of zeilen.results) {
    let wert;
    try { wert = JSON.parse(z.value); } catch (e) { continue; }
    ((log[z.date] ||= {})[z.person_id] ||= {})[z.habit] = wert;
  }
  const settings = {};
  for (const z of einst.results) {
    let wert;
    try { wert = JSON.parse(z.value); } catch (e) { continue; }
    (settings[z.person_id] ||= {})[z.key] = {wert, ab: z.ab};
  }
  return {people: leute.results.map((p) => ({id: p.id, name: p.name})), log, settings};
}

/* ---- Schreiben -------------------------------------------------------- */

function sauberName(roh) {
  const name = typeof roh === "string" ? roh.replace(STEUERZEICHEN, " ").replace(/\s+/g, " ").trim() : "";
  if (!name) throw fehler("name-leer");
  if (name.length > NAME_MAX) throw fehler("name-zu-lang");
  return name;
}

/** Das Commitment: eine kurze Liste von Tracker-Schlüsseln, sonst nichts. */
function sauberCommitment(roh) {
  if (!Array.isArray(roh) || roh.length > 12 || !roh.every((k) => typeof k === "string" && TRACKER.test(k)))
    throw fehler("wert-ungueltig");
  return [...new Set(roh)];
}

function neueId() { return "p" + crypto.randomUUID().replace(/-/g, "").slice(0, 8); }

function istDoppelt(e) { return /unique|constraint/i.test((e && e.message) || ""); }

/**
 * Person und Commitment, atomar (aus kur-core: eine Person ohne ihr
 * Commitment, weil der zweite Aufruf verloren ging, wäre halb da).
 * Zählen und Einfügen in einer Anweisung, damit die Obergrenze hält.
 */
async function einrichtung(db, raum, body, jetzt) {
  const name = sauberName(body.name);
  const commitment = sauberCommitment(body.commitment || []);
  const heute = tagVorTagen(0, jetzt);
  const id = neueId();
  const befehle = [
    db.prepare(`INSERT INTO people (id, raum, name, created_at)
                SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM people WHERE raum = ?) < ${MAX_PERSONEN}`)
      .bind(id, raum, name, jetzt, raum)
  ];
  if (commitment.length)
    befehle.push(db.prepare(`INSERT INTO settings (person_id, key, value, ab, updated_at)
                             SELECT ?, 'commitment', ?, ?, ? WHERE EXISTS (SELECT 1 FROM people WHERE id = ?)`)
      .bind(id, JSON.stringify(commitment), heute, jetzt, id));
  let res;
  try { res = await db.batch(befehle); }
  catch (e) { if (istDoppelt(e)) throw fehler("name-vergeben", 409); throw e; }
  if (!res[0] || !res[0].meta || !res[0].meta.changes) throw fehler("gruppe-voll", 409);
  return {id, name};
}

async function bekannt(db, raum, id) {
  if (!PERSON.test(id || "")) throw fehler("person-ungueltig");
  const da = await db.prepare("SELECT 1 FROM people WHERE id = ? AND raum = ?").bind(id, raum).first();
  if (!da) throw fehler("person-unbekannt", 404);
}

/* Ein Tag dabei: `true` setzt ihn, `null` nimmt ihn weg. Andere Werte gibt
   es nicht. */
async function eintrag(db, raum, body, jetzt) {
  const date = body.date;
  if (!TAG.test(date || "")) throw fehler("datum-ungueltig");
  if (date > tagVorTagen(-1, jetzt)) throw fehler("datum-in-zukunft");
  if (date < tagVorTagen(TAGE_ZURUECK, jetzt)) throw fehler("datum-zu-alt");
  if (body.value !== true && body.value !== null) throw fehler("wert-ungueltig");
  await bekannt(db, raum, body.person);
  if (body.value === null) {
    await db.prepare("DELETE FROM entries WHERE date = ? AND person_id = ? AND habit = 'dabei'").bind(date, body.person).run();
    return {ok: true, geloescht: true};
  }
  await db.prepare(
    `INSERT INTO entries (date, person_id, habit, value, updated_at) VALUES (?, ?, 'dabei', 'true', ?)
     ON CONFLICT (date, person_id, habit) DO UPDATE SET updated_at = excluded.updated_at`
  ).bind(date, body.person, jetzt).run();
  return {ok: true};
}

async function einstellung(db, raum, body, jetzt) {
  if (!TAG.test(body.ab || "")) throw fehler("datum-ungueltig");
  const commitment = sauberCommitment(body.value);
  await bekannt(db, raum, body.person);
  await db.prepare(
    `INSERT INTO settings (person_id, key, value, ab, updated_at) VALUES (?, 'commitment', ?, ?, ?)
     ON CONFLICT (person_id, key) DO UPDATE SET value = excluded.value, ab = excluded.ab, updated_at = excluded.updated_at`
  ).bind(body.person, JSON.stringify(commitment), body.ab, jetzt).run();
  return {ok: true};
}

async function abschied(db, raum, body) {
  await bekannt(db, raum, body.person);
  await db.batch([
    db.prepare("DELETE FROM entries WHERE person_id = ?").bind(body.person),
    db.prepare("DELETE FROM settings WHERE person_id = ?").bind(body.person),
    db.prepare("DELETE FROM people WHERE id = ? AND raum = ?").bind(body.person, raum)
  ]);
  return {ok: true};
}
