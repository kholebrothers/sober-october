import { test } from "node:test";
import assert from "node:assert/strict";
import { neuerZustand, aus, schalteDa, notiere, fuegeEigenenHinzu } from "../public/app/logik.js";
import { abgleich, gruppe, binDabei, namenListe } from "../public/app/gemeinsam.js";

const HEUTE = "2026-10-14";
const ich = () => {
  const z = neuerZustand();
  z.commitment.kaffee = { drang: true };
  z.gemeinsam = { id: "pich", name: "Anna" };
  return z;
};
const stand = (log = {}, settings = {}) => ({
  people: [{ id: "pich", name: "Anna" }, { id: "pben", name: "Ben" }], log, settings,
});

test("abgleichen: fehlende Tage kommen dazu, das Commitment auch", () => {
  const z = ich();
  schalteDa(z, "2026-10-12");
  notiere(z, { tag: HEUTE, zeit: "09:00", verzicht: "kaffee", art: "habe", antworten: { davor: "Stress" } });
  const a = abgleich(z, stand({ "2026-10-12": { pich: { dabei: true } } }), HEUTE);
  assert.deepEqual(a.tage, [{ date: HEUTE, value: true }]);
  assert.deepEqual(a.commitment, ["kaffee"]);
  assert.ok(!JSON.stringify(a).includes("Stress"), "was notiert ist, geht nicht an den Server");
});

test("abgleichen löscht nie alte Tage — ein zweites Gerät hat sie vielleicht", () => {
  const z = ich();
  const s = stand({ "2026-10-10": { pich: { dabei: true } }, [HEUTE]: { pich: { dabei: true } } },
    { pich: { commitment: { wert: ["kaffee"], ab: "2026-10-01" } } });
  assert.deepEqual(abgleich(z, s, HEUTE), { tage: [{ date: HEUTE, value: null }], commitment: null },
    "nur heute wird zurückgenommen, der 10. bleibt");
});

test("ohne Gruppe und ohne Stand gibt es nichts abzugleichen", () => {
  const z = ich();
  schalteDa(z, HEUTE);
  assert.deepEqual(abgleich(z, null, HEUTE), { tage: [], commitment: null });
  z.gemeinsam = null;
  assert.deepEqual(abgleich(z, stand(), HEUTE), { tage: [], commitment: null });
});

test("die Gruppe: keine Farbe je Person, die eigene Zeile aus diesem Gerät", () => {
  const z = ich();
  fuegeEigenenHinzu(z, "Zucker");
  schalteDa(z, HEUTE);
  const tage = ["2026-10-13", HEUTE, "2026-10-15"];
  const s = stand({ "2026-10-13": { pben: { dabei: true } } }, { pben: { commitment: { wert: ["kippe", "eigen"], ab: "2026-10-01" } } });
  const g = gruppe(z, s, HEUTE, tage);
  assert.deepEqual(g.leute.map((p) => [p.name, p.du, p.tage, p.anzahl]), [
    ["Anna", true, [false, true, false], 1],
    ["Ben", false, [true, false, false], 1],
  ]);
  assert.ok(g.leute.every((p) => !("farbe" in p)));
  assert.equal(g.leute[1].commitment, "Kippe · Eigenes", "der Name eines eigenen Trackers bleibt privat");
  assert.deepEqual(g.heute.map((p) => p.name), ["Anna"]);
});

test("Namen in einem Satz, du am Ende", () => {
  assert.equal(namenListe([{ name: "Anna", du: true }, { name: "Ben" }, { name: "Cem" }]), "Ben, Cem und du");
  assert.equal(namenListe([{ name: "Ben" }]), "Ben");
  assert.equal(namenListe([]), "");
});

test("wer mitgeht, übersteht Speichern; Unsinn wird verworfen; ein Abschied anderswo zählt", () => {
  const z = ich();
  assert.deepEqual(aus(JSON.stringify(z)).gemeinsam, { id: "pich", name: "Anna" });
  assert.equal(aus(JSON.stringify({ ...z, gemeinsam: { id: "DROP TABLE", name: "x" } })).gemeinsam, null);
  assert.equal(binDabei(z, stand()), true);
  assert.equal(binDabei(z, { people: [], log: {}, settings: {} }), false);
});
