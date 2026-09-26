import { test } from "node:test";
import assert from "node:assert/strict";
import {
  neuerZustand, aus, notiere, schalteOhne, stand, oktober, tagesZeile,
  commitmentSatz, fuerKern, vonTag, VERSION, tagesKopf,
  gewaehlt, schalteAlles, setzeEigen, verzichte, FEST,
  serie, lauf, besterLauf, heatWochen, tagesAnteil, LEITER,
  schalteFrei, istFrei, leitgedanke, moment, wochen, wasTraegt,
} from "../public/app/logik.js";
import { sonne, tageszeit } from "../public/kern/sonne.js";
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

test("„Alles\" wählt die drei festen Verzichte und wieder ab", () => {
  const z = mit("kippe");
  schalteAlles(z);
  assert.deepEqual(gewaehlt(z), FEST);
  assert.equal(z.commitment.kippe.drang, true);
  schalteAlles(z);
  assert.deepEqual(gewaehlt(z), []);
});

test("„Alles\" lässt die eigene Definition stehen", () => {
  const z = mit("eigen");
  setzeEigen(z, "Alkohol");
  schalteAlles(z);
  schalteAlles(z);
  assert.deepEqual(gewaehlt(z), ["eigen"]);
});

test("die eigene Definition zählt erst mit Namen", () => {
  const z = mit("eigen");
  assert.deepEqual(gewaehlt(z), []);
  setzeEigen(z, "  keinen   Zucker ");
  assert.deepEqual(gewaehlt(z), ["eigen"]);
  assert.equal(verzichte(z).eigen.name, "Zucker");
  assert.equal(commitmentSatz(z), "Im Oktober lasse ich Zucker sein.");
  z.commitment.kaffee = { drang: false };
  assert.equal(commitmentSatz(z), "Im Oktober lasse ich den Kaffee und Zucker sein.");
});

test("die eigene Definition übersteht Speichern, der Name bleibt beim Abwählen", () => {
  const z = mit("eigen");
  setzeEigen(z, "Alkohol");
  notiere(z, { tag: "2026-10-01", zeit: "20:00", verzicht: "eigen", art: "drang" });
  const zurueck = aus(JSON.stringify(z));
  assert.deepEqual(zurueck, z);
  delete zurueck.commitment.eigen;
  assert.equal(aus(JSON.stringify(zurueck)).eigen.name, "Alkohol");
  assert.equal(verzichte(zurueck).eigen.name, "Alkohol");
});

test("der Name der eigenen Definition geht nicht an kur-core", () => {
  const z = mit("eigen");
  setzeEigen(z, "Alkohol");
  notiere(z, { tag: "2026-10-01", zeit: "20:00", verzicht: "eigen", art: "habe" });
  const k = fuerKern(z, "2026-10-01");
  assert.ok(!JSON.stringify(k).includes("Alkohol"));
  assert.equal(k.einstellungen[0].wert, "eigen");
});

const notizAn = (z, ...tage) => { for (const t of tage) schalteOhne(z, t, "12:00", "kaffee"); };
const okt = (n) => `2026-10-${String(n).padStart(2, "0")}`;

test("die Serie: ein Leertag hält, zwei beenden, heute zählt erst mit Notiz", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1), okt(2), okt(4), okt(5));
  assert.equal(serie(z, okt(5)), 4, "der 3. ist ein einzelner Leertag");
  assert.equal(serie(z, okt(6)), 4, "heute noch leer: die Serie steht");
  assert.equal(serie(z, okt(7)), 4, "heute offen, gestern leer: noch eine Lücke");
  assert.equal(serie(z, okt(8)), 0, "zwei Leertage vor heute: vorbei");
  notizAn(z, okt(8));
  assert.equal(serie(z, okt(8)), 1);
});

test("die Kette rastet auf der Fibonacci-Leiter ein", () => {
  assert.deepEqual(LEITER, [5, 8, 13, 21, 34]);
  const z = mit("kaffee");
  assert.equal(lauf(z, okt(1)).fenster, 5, "heute allein ist auch ein Anfang");
  for (let d = 1; d <= 5; d++) notizAn(z, okt(d));
  assert.equal(lauf(z, okt(5)).fenster, 5);
  notizAn(z, okt(6));
  const l = lauf(z, okt(6));
  assert.deepEqual([l.weit, l.fenster, l.dabeiTage], [6, 8, 6]);
  assert.deepEqual(l.tage.map((t) => t.stand), ["dabei", "dabei", "dabei", "dabei", "dabei", "dabei", "kommt", "kommt"]);
  assert.equal(l.tage[5].heute, true);
  for (let d = 7; d <= 31; d++) notizAn(z, okt(d));
  assert.equal(lauf(z, okt(31)).fenster, 34, "der ganze Oktober passt hinein");
});

test("ein Leertag steht in der Kette als leer, nicht als kommt", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1), okt(3));
  assert.deepEqual(lauf(z, okt(3)).tage.slice(0, 3).map((t) => t.stand), ["dabei", "leer", "dabei"]);
});

test("der längste Lauf zählt Tage ohne Lücke", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1), okt(2), okt(3), okt(5));
  assert.equal(besterLauf(z, okt(9)), 3);
});

test("die Heatmap: 13 Wochen ab Montag, der Oktober ganz darin", () => {
  for (const heute of ["2026-09-26", okt(15), "2026-12-20"]) {
    const w = heatWochen(heute);
    assert.equal(w.length, 13);
    assert.ok(w.every((x) => x.length === 7));
    assert.equal(new Date(w[0][0] + "T12:00").getDay(), 1, "Montag oben");
    const alle = w.flat();
    if (heute < "2026-11-01") assert.ok(alle.includes(okt(1)) && alle.includes(okt(31)), heute);
    else assert.ok(alle.includes(heute));
  }
});

test("wie voll ein Tag ist: Anteil der Verzichte mit Notiz, ein habe zählt mit", () => {
  const z = mit("kaffee", "kippe");
  assert.equal(tagesAnteil(z, okt(1)), 0);
  notiere(z, { tag: okt(1), zeit: "08:00", verzicht: "kippe", art: "habe" });
  assert.equal(tagesAnteil(z, okt(1)), 0.5);
  schalteOhne(z, okt(1), "20:00", "kaffee");
  assert.equal(tagesAnteil(z, okt(1)), 1);
});

test("ein freier Tag hält die Kette und steht als frei darin", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1), okt(2));
  schalteFrei(z, okt(3));
  schalteFrei(z, okt(4));
  notizAn(z, okt(5));
  assert.equal(serie(z, okt(5)), 5);
  assert.deepEqual(lauf(z, okt(5)).tage.map((t) => t.stand), ["dabei", "dabei", "frei", "frei", "dabei"]);
  schalteFrei(z, okt(4));
  assert.equal(istFrei(z, okt(4)), false, "zurücknehmen geht");
  assert.deepEqual(fuerKern(z, okt(5)).eintraege.map((e) => e.date), [okt(1), okt(2), okt(3), okt(5)]);
});

test("freie Tage und „abends ruhiger\" überstehen Speichern; Unsinn wird verworfen", () => {
  const z = mit("kippe");
  schalteFrei(z, okt(2));
  z.abends = false;
  assert.deepEqual(aus(JSON.stringify(z)), z);
  const roh = { ...z, freieTage: [okt(2), "gestern", 7, okt(2)] };
  assert.deepEqual(aus(JSON.stringify(roh)).freieTage, [okt(2)]);
  assert.equal(aus(JSON.stringify({ v: VERSION })).abends, true, "Standard: an");
});

test("der Leitgedanke lädt ein und mahnt nie", () => {
  const z = mit("kaffee");
  assert.equal(leitgedanke(z, okt(1)).zeile, "Eine Notiz, und der Tag zählt.");
  notizAn(z, okt(1));
  assert.equal(leitgedanke(z, okt(1)).zeile, "Der Tag zählt.");
  assert.match(leitgedanke(z, okt(1)).unter, /eine Notiz/);
  assert.equal(leitgedanke(z, okt(2)).zeile, "Eine Notiz hält die Kette.");
  assert.equal(leitgedanke(z, okt(3)).zeile, "Gestern blieb leer. Heute reicht wieder eine Notiz.");
  schalteFrei(z, okt(3));
  assert.equal(leitgedanke(z, okt(3)).zeile, "Heute ist frei.");
});

test("kleine Momente: heute kommt dazu, die Serie erreicht eine Stufe", () => {
  const z = mit("kaffee");
  const stand = (t) => ({ lauf: lauf(z, t), serie: serie(z, t) });
  for (let d = 1; d <= 7; d++) notizAn(z, okt(d));
  const vor = stand(okt(8));
  notizAn(z, okt(8));
  const m = moment(vor, stand(okt(8)));
  assert.equal(m.heuteNeu, true);
  assert.equal(m.stufe, 8);
  assert.match(m.satz, /Acht/);
  const vor2 = stand(okt(8));
  notiere(z, { tag: okt(8), zeit: "09:00", verzicht: "kaffee", art: "habe" });
  assert.deepEqual(moment(vor2, stand(okt(8))), { heuteNeu: false, stufe: 0, satz: "" }, "die zweite Notiz des Tages ist still");
});

test("der Rückblick öffnet sich nach der ersten Oktoberwoche", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1));
  notiere(z, { tag: okt(7), zeit: "08:00", verzicht: "kaffee", art: "habe" });
  assert.equal(stand(z, "rueckblick"), "zu");
  notiere(z, { tag: okt(8), zeit: "08:00", verzicht: "kaffee", art: "habe" });
  assert.equal(stand(z, "rueckblick"), "frei");
});

test("der Rückblick zählt je Abschnitt und zeigt die eigenen Worte", () => {
  const z = mit("kaffee", "kippe");
  notizAn(z, okt(1), okt(2));
  schalteFrei(z, okt(3));
  notiere(z, { tag: okt(9), zeit: "08:00", verzicht: "kippe", art: "drang", antworten: { statt: "Tee" } });
  notiere(z, { tag: okt(10), zeit: "08:00", verzicht: "kippe", art: "habe", antworten: { statt: "tee " } });
  notiere(z, { tag: okt(10), zeit: "09:00", verzicht: "kippe", art: "habe", antworten: { statt: "Spazieren" } });
  const w = wochen(z, okt(10));
  assert.deepEqual(w.map((x) => x.titel), ["Erste Woche", "Zweite Woche"]);
  assert.deepEqual([w[0].tage, w[0].dabei, w[0].frei], [7, 3, 1]);
  assert.deepEqual(w[0].je.kaffee, { ohne: 2, habe: 0, drang: 0 });
  assert.deepEqual([w[1].tage, w[1].dabei], [3, 2]);
  assert.deepEqual(w[1].je.kippe, { ohne: 0, habe: 2, drang: 1 });
  assert.deepEqual(w[1].saetze.map((x) => x.text), ["Tee", "tee ", "Spazieren"]);
  assert.deepEqual(wasTraegt(z), [{ text: "Tee", n: 2 }, { text: "Spazieren", n: 1 }]);
  assert.deepEqual(wochen(z, "2026-09-26"), [], "vor dem Oktober gibt es nichts zurückzublicken");
});

test("Sonne über Berlin und die Tageszeit", () => {
  const { auf, unter } = sonne("2026-10-15");
  assert.ok(auf > 7 * 60 && auf < 8 * 60, `Aufgang ${auf}`);
  assert.ok(unter > 18 * 60 && unter < 18 * 60 + 40, `Untergang ${unter}`);
  assert.equal(tageszeit("2026-10-15", 12 * 60), "tag");
  assert.equal(tageszeit("2026-10-15", 19 * 60), "abend");
  assert.equal(tageszeit("2026-10-15", 23 * 60), "nacht");
  assert.equal(tageszeit("2026-10-15", 5 * 60), "nacht");
});
