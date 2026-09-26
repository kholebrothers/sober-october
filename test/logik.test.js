import { test } from "node:test";
import assert from "node:assert/strict";
import {
  neuerZustand, aus, notiere, schalteOhne, stand, oktober, tagesZeile,
  commitmentSatz, fuerKern, vonTag, VERSION, tagesKopf,
} from "../public/app/logik.js";
import { normalisiere, leer, TAG, SCHLUESSEL } from "./kur-core-wertevertrag.js";

const mit = (...v) => {
  const z = neuerZustand();
  for (const k of v) z.commitment[k] = { drang: true };
  return z;
};

test("der Oktober: vorher, mittendrin, danach", () => {
  assert.deepEqual(oktober("2026-09-26"), { phase: "vor", noch: 5, start: "2026-10-01" });
  assert.equal(oktober("2026-10-01").tag, 1);
  assert.equal(oktober("2026-10-31").tag, 31);
  assert.equal(oktober("2026-11-01").phase, "nach");
  assert.equal(tagesZeile("2026-09-30"), "Morgen beginnt der Oktober");
  assert.equal(tagesZeile("2026-10-05"), "Tag 5");
});

test("der Satz des Commitments", () => {
  assert.equal(commitmentSatz(mit("kippe")), "Im Oktober lasse ich die Kippe sein.");
  assert.equal(commitmentSatz(mit("kaffee", "kippe", "video")),
    "Im Oktober lasse ich den Kaffee, die Kippe und das Video sein.");
  assert.equal(commitmentSatz(neuerZustand()), "");
});

test("ein Drang öffnet die Ebene zum Drang, ein Konsum nicht", () => {
  const z = mit("kippe");
  assert.deepEqual(notiere(z, { tag: "2026-10-01", zeit: "08:00", verzicht: "kippe", art: "habe" }), []);
  assert.equal(stand(z, "drang"), "zu");
  const neu = notiere(z, { tag: "2026-10-01", zeit: "09:00", verzicht: "kippe", art: "drang" });
  assert.deepEqual(neu.map((e) => e.id), ["drang"]);
  assert.equal(stand(z, "drang"), "frei");
  assert.deepEqual(notiere(z, { tag: "2026-10-01", zeit: "10:00", verzicht: "kippe", art: "drang" }), [],
    "eine Ebene öffnet sich nur einmal");
});

test("Routinen öffnen sich am dritten Tag mit Notiz, nicht mit der dritten Notiz", () => {
  const z = mit("kaffee");
  for (let i = 0; i < 3; i++) notiere(z, { tag: "2026-10-01", zeit: "08:0" + i, verzicht: "kaffee", art: "habe" });
  assert.equal(stand(z, "routine"), "zu");
  notiere(z, { tag: "2026-10-02", zeit: "08:00", verzicht: "kaffee", art: "habe" });
  const neu = notiere(z, { tag: "2026-10-03", zeit: "08:00", verzicht: "kaffee", art: "habe" });
  assert.ok(neu.some((e) => e.id === "routine"));
});

test("gewählte Ebenen öffnen sich nie von selbst", () => {
  const z = mit("kaffee");
  for (let d = 1; d <= 9; d++) notiere(z, { tag: `2026-10-0${d}`, zeit: "08:00", verzicht: "kaffee", art: "drang" });
  assert.equal(stand(z, "verlauf"), "aus");
});

test("„heute ohne\" schaltet an und wieder aus", () => {
  const z = mit("video");
  schalteOhne(z, "2026-10-02", "20:00", "video");
  assert.equal(vonTag(z, "2026-10-02", "video").length, 1);
  schalteOhne(z, "2026-10-02", "21:00", "video");
  assert.equal(vonTag(z, "2026-10-02", "video").length, 0);
});

test("Gespeichertes kommt unverändert zurück", () => {
  const z = mit("kaffee", "kippe");
  z.ansicht = "faden";
  notiere(z, { tag: "2026-10-01", zeit: "08:00", verzicht: "kippe", art: "drang",
    antworten: { davor: "Balkon", gefuehl: "Angst, Trauer" }, begleitetSek: 40 });
  assert.deepEqual(aus(JSON.stringify(z)), z);
});

test("Unlesbares wird ein leerer Zustand, kein Absturz", () => {
  for (const t of ["", "{", "null", "[]", JSON.stringify({ v: VERSION + 1, commitment: { kaffee: {} } })])
    assert.deepEqual(aus(t), neuerZustand(), t);
});

test("Fremde Verzichte und Arten werden beim Laden verworfen", () => {
  const roh = { v: VERSION, commitment: { kaffee: { drang: 1 }, bier: { drang: true } },
    ereignisse: [{ tag: "2026-10-01", verzicht: "bier", art: "habe" }, { tag: "2026-10-01", verzicht: "kaffee", art: "sieg" }] };
  const z = aus(JSON.stringify(roh));
  assert.deepEqual(z.commitment, { kaffee: { drang: true } });
  assert.deepEqual(z.ereignisse, []);
});

test("fuerKern liefert nur Teilnahme — und nur Werte, die kur-core annimmt", () => {
  const z = mit("kaffee", "video");
  notiere(z, { tag: "2026-10-01", zeit: "08:00", verzicht: "kaffee", art: "habe", antworten: { davor: "Büro" } });
  notiere(z, { tag: "2026-10-01", zeit: "09:00", verzicht: "kaffee", art: "drang" });
  schalteOhne(z, "2026-10-03", "22:00", "video");
  const k = fuerKern(z, "2026-10-03");

  assert.deepEqual(k.eintraege.map((e) => e.date), ["2026-10-01", "2026-10-03"]);
  assert.ok(!JSON.stringify(k).includes("Büro"), "keine Antworten auf dem Server");
  for (const e of k.eintraege) {
    assert.match(e.date, TAG);
    assert.match(e.habit, SCHLUESSEL);
    assert.ok(!leer(e.value));
    assert.deepEqual(normalisiere(e.value), e.value);
  }
  for (const e of k.einstellungen) {
    assert.match(e.schluessel, SCHLUESSEL);
    assert.match(e.ab, TAG);
    assert.deepEqual(normalisiere(e.wert), e.wert);
  }
});

test("Tagesköpfe: im Oktober die Nummer, sonst das Datum", () => {
  assert.equal(tagesKopf("2026-10-07"), "Tag 7");
  assert.match(tagesKopf("2026-09-26"), /26/);
});
