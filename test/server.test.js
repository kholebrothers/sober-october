/* Der Server der Teilnahme, gegen echtes SQLite mit dem echten Schema
   (d1-attrappe.js aus kur-core). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { beantworte, MAX_PERSONEN } from "../server/api.js";
import { d1 } from "./d1-attrappe.js";

const JETZT = Date.UTC(2026, 9, 14, 12);
const HEUTE = "2026-10-14";

async function rufe(db, pfad, body, raum = "live") {
  const a = new Request("https://s.test" + pfad, body === undefined ? {}
    : {method: "POST", body: JSON.stringify(body), headers: {"content-type": "application/json"}});
  const r = await beantworte(a, db, {raum, jetzt: JETZT});
  return {status: r.status, body: r.status === 304 ? null : await r.json()};
}
const stand = async (db, raum) => (await rufe(db, "/api/state", undefined, raum)).body;

test("was nicht unter /api/ liegt, geht den Server nichts an", async () => {
  assert.equal(await beantworte(new Request("https://s.test/index.html"), d1(), {raum: "live"}), null);
});

test("mitgehen: Name und Commitment in einem Zug, der Name nur einmal", async () => {
  const db = d1();
  const r = await rufe(db, "/api/einrichtung", {name: "  Anna ", commitment: ["kaffee", "eigen-ab12"]});
  assert.equal(r.status, 200);
  assert.match(r.body.id, /^p[a-z0-9]{8}$/);
  const s = await stand(db);
  assert.deepEqual(s.people, [{id: r.body.id, name: "Anna"}]);
  assert.deepEqual(s.settings[r.body.id].commitment, {wert: ["kaffee", "eigen-ab12"], ab: HEUTE});
  assert.deepEqual((await rufe(db, "/api/einrichtung", {name: "anna"})).body, {fehler: "name-vergeben"});
});

test("live und Vorschau sehen einander nicht", async () => {
  const db = d1();
  const a = (await rufe(db, "/api/einrichtung", {name: "Anna"}, "live")).body;
  const b = (await rufe(db, "/api/einrichtung", {name: "Anna"}, "vorschau")).body;
  assert.ok(b.id, "derselbe Name geht im anderen Raum");
  await rufe(db, "/api/entry", {person: a.id, date: HEUTE, value: true}, "live");
  assert.deepEqual((await stand(db, "vorschau")).people.map((p) => p.id), [b.id]);
  assert.deepEqual((await stand(db, "vorschau")).log, {});
  assert.equal((await rufe(db, "/api/entry", {person: a.id, date: HEUTE, value: true}, "vorschau")).status, 404,
    "eine Vorschau kann nicht als Person von live schreiben");
  assert.equal((await beantworte(new Request("https://s.test/api/state"), db, {raum: "sonstwo"})).status, 500);
});

test("ein Tag dabei: nur true oder weg, nichts anderes", async () => {
  const db = d1();
  const {id} = (await rufe(db, "/api/einrichtung", {name: "Ben"})).body;
  assert.equal((await rufe(db, "/api/entry", {person: id, date: HEUTE, value: true})).status, 200);
  assert.deepEqual((await stand(db)).log, {[HEUTE]: {[id]: {dabei: true}}});
  for (const value of ["Kaffee getrunken", 3, {a: 1}, false])
    assert.deepEqual((await rufe(db, "/api/entry", {person: id, date: HEUTE, value})).body, {fehler: "wert-ungueltig"});
  assert.equal((await rufe(db, "/api/entry", {person: id, date: "2026-10-17", value: true})).body.fehler, "datum-in-zukunft");
  await rufe(db, "/api/entry", {person: id, date: HEUTE, value: null});
  assert.deepEqual((await stand(db)).log, {});
});

test("das Commitment ist eine Liste von Schlüsseln, kein Text", async () => {
  const db = d1();
  const {id} = (await rufe(db, "/api/einrichtung", {name: "Cem"})).body;
  assert.equal((await rufe(db, "/api/setting", {person: id, ab: HEUTE, value: ["kippe"]})).status, 200);
  assert.deepEqual((await stand(db)).settings[id].commitment.wert, ["kippe"]);
  assert.equal((await rufe(db, "/api/setting", {person: id, ab: HEUTE, value: ["Ich trinke zu viel"]})).body.fehler, "wert-ungueltig");
  assert.equal((await rufe(db, "/api/einrichtung", {name: "Dora", commitment: "kaffee"})).body.fehler, "wert-ungueltig");
});

test("Abschied: Person, Tage und Commitment sind weg", async () => {
  const db = d1();
  const {id} = (await rufe(db, "/api/einrichtung", {name: "Eli", commitment: ["video"]})).body;
  await rufe(db, "/api/entry", {person: id, date: HEUTE, value: true});
  assert.equal((await rufe(db, "/api/abschied", {person: id})).status, 200);
  assert.deepEqual(await stand(db), {people: [], log: {}, settings: {}});
  assert.equal(db.roh.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 0);
});

test("eine Gruppe hat höchstens zwanzig; die Vorschau zählt für sich", async () => {
  const db = d1();
  for (let i = 0; i < MAX_PERSONEN; i++) await rufe(db, "/api/einrichtung", {name: `P${i}`});
  const r = await rufe(db, "/api/einrichtung", {name: "Noch eine"});
  assert.deepEqual([r.status, r.body], [409, {fehler: "gruppe-voll"}]);
  assert.equal((await rufe(db, "/api/einrichtung", {name: "Noch eine"}, "vorschau")).status, 200);
});

test("ohne Datenbank sagt der Server es, statt abzustürzen", async () => {
  const r = await beantworte(new Request("https://s.test/api/state"), undefined, {raum: "live"});
  assert.deepEqual([r.status, await r.json()], [503, {fehler: "keine-datenbank"}]);
});
