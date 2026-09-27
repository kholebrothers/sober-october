import { test } from "node:test";
import assert from "node:assert/strict";
import {
  neuerZustand, aus, notiere, schalteOhne, stand, oktober, tagesZeile,
  commitmentSatz, fuerKern, vonTag, VERSION, tagesKopf,
  gewaehlt, schalteAlles, fuegeEigenenHinzu, benenneEigenen, entferneEigenen, verzichte, FEST,
  serie, lauf, besterLauf, heatWochen, tagesAnteil, LEITER,
  schalteFrei, istFrei, tagessatz, moment, wochen, wasTraegt,
  leitgedankeAm, setzeLeitgedanke, begleitetSeit, LEITGEDANKE,
  BAUSTEINE, aktiv, schalteBaustein,
  istDa, schalteDa, hatEintrag, ergaenze, entferne, FARBWELTEN, monat,
  SCHICHTEN, STIMMUNG, SELBST, schreibeTag, tagebuchZeilen, SYSTEME, zusammenhaenge, verlauf, eingeschaetzt,
  TIEFEN, AUFBAU_VORSCHLAEGE, schalteSchritt, schritteGetan, setzeSchritte,
  setzeAnker, setzeSwish, planHinzu, planWeg, PLAENE_MAX,
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

test("die App fängt klein an: auf Schicht 1 Leitgedanke, Gemeinsam, Tagebuch und Abendruhe, auf Schicht 3 auch der Verlauf", () => {
  const z = neuerZustand();
  assert.deepEqual(BAUSTEINE.filter((b) => aktiv(z, b.id)).map((b) => b.id), ["leitgedanke", "gemeinsam", "tagebuch", "abends"]);
  z.tiefe = 3;
  assert.deepEqual(BAUSTEINE.filter((b) => aktiv(z, b.id)).map((b) => b.id), ["leitgedanke", "gemeinsam", "tagebuch", "verlauf", "werkzeuge", "gremlin", "abends"]);
  z.tiefe = 1;
  schalteBaustein(z, "heatmap");
  schalteBaustein(z, "leitgedanke", false);
  schalteBaustein(z, "gibtsnicht", true);
  assert.equal(aktiv(z, "heatmap"), true);
  assert.equal(aktiv(z, "leitgedanke"), false);
  assert.deepEqual(z.bausteine, { heatmap: true, leitgedanke: false });
  assert.deepEqual(aus(JSON.stringify(z)).bausteine, z.bausteine);
});

test("Ebenen öffnen sich auch, wenn der Baustein aus ist — einschalten zeigt, was schon verdient ist", () => {
  const z = mit("kaffee");
  notiere(z, { tag: okt(1), zeit: "08:00", verzicht: "kaffee", art: "drang" });
  assert.equal(aktiv(z, "ebenen"), false);
  assert.equal(stand(z, "drang"), "frei");
});

test("ein Stand von live (vor den Bausteinen) fängt klein an", () => {
  const live = { v: VERSION, commitment: { kaffee: { drang: true } }, ansicht: "knopf",
    ereignisse: [{ id: "a", tag: okt(1), zeit: "08:00", verzicht: "kaffee", art: "habe", antworten: {} }], frei: {} };
  const z = aus(JSON.stringify(live));
  assert.deepEqual(z.bausteine, {});
  assert.equal(aktiv(z, "lauf"), false);
});

test("ein Stand aus der Vorschau behält, was dort sichtbar war", () => {
  const vorschau = { v: VERSION, commitment: { kaffee: { drang: true } }, ansicht: "blatt", abends: false,
    ereignisse: [{ id: "a", tag: okt(1), zeit: "08:00", verzicht: "kaffee", art: "drang", antworten: {} }],
    freieTage: [okt(2)], frei: { verlauf: { tag: okt(1) }, drang: { tag: okt(1), zeit: "08:00", gesehen: true } } };
  const z = aus(JSON.stringify(vorschau));
  assert.deepEqual(z.bausteine, { lauf: true, heatmap: true, ebenen: true, abends: false });
  assert.equal(z.frei.verlauf, undefined, "die Ebene „Dein Oktober\" gibt es nicht mehr, sie ist die Heatmap");
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

test("„Alles\" lässt eigene Tracker stehen", () => {
  const z = neuerZustand();
  const id = fuegeEigenenHinzu(z, "Alkohol");
  schalteAlles(z);
  schalteAlles(z);
  assert.deepEqual(gewaehlt(z), [id]);
});

test("eigene Tracker: beliebig viele, gleich gewählt, keiner doppelt", () => {
  const z = neuerZustand();
  assert.equal(fuegeEigenenHinzu(z, "   "), null, "ohne Namen kein Tracker");
  const a = fuegeEigenenHinzu(z, "  keinen   Zucker ");
  const b = fuegeEigenenHinzu(z, "Social Media");
  const c = fuegeEigenenHinzu(z, "zucker");
  assert.equal(a, "eigen", "der erste heißt wie die eine eigene Definition von früher");
  assert.match(b, /^eigen-[a-z0-9]+$/);
  assert.equal(c, a, "gleichnamig heißt: derselbe");
  assert.deepEqual(gewaehlt(z), [a, b]);
  const V = verzichte(z);
  assert.equal(V[a].name, "Zucker");
  assert.notEqual(V[a].farbe, V[b].farbe, "jeder eigene hat seinen Ton");
  z.commitment.kaffee = { drang: false };
  assert.equal(commitmentSatz(z), "Im Oktober lasse ich den Kaffee, Zucker und Social Media sein.");
});

test("umbenennen immer, entfernen nur ohne Notizen", () => {
  const z = neuerZustand();
  const a = fuegeEigenenHinzu(z, "Alkhol");
  const b = fuegeEigenenHinzu(z, "Zucker");
  assert.equal(benenneEigenen(z, a, "Alkohol"), true);
  assert.equal(verzichte(z)[a].name, "Alkohol");
  notiere(z, { tag: "2026-10-01", zeit: "20:00", verzicht: a, art: "drang" });
  assert.equal(entferneEigenen(z, a), false);
  assert.equal(entferneEigenen(z, b), true);
  assert.deepEqual(z.eigene.map((e) => e.id), [a]);
  assert.equal(z.commitment[b], undefined);
});

test("eigene Tracker überstehen Speichern; der Name bleibt beim Abwählen", () => {
  const z = neuerZustand();
  const a = fuegeEigenenHinzu(z, "Alkohol");
  const b = fuegeEigenenHinzu(z, "Zucker");
  notiere(z, { tag: "2026-10-01", zeit: "20:00", verzicht: b, art: "drang" });
  assert.deepEqual(aus(JSON.stringify(z)), z);
  delete z.commitment[a];
  const zurueck = aus(JSON.stringify(z));
  assert.equal(verzichte(zurueck)[a].name, "Alkohol");
  assert.deepEqual(gewaehlt(zurueck), [b]);
});

test("die eine eigene Definition von früher wird der erste eigene Tracker", () => {
  const alt = { v: VERSION, commitment: { kippe: { drang: true }, eigen: { drang: false } }, eigen: { name: "Alkohol" },
    ereignisse: [{ id: "x", tag: "2026-10-01", zeit: "20:00", verzicht: "eigen", art: "habe", antworten: {} }] };
  const z = aus(JSON.stringify(alt));
  assert.deepEqual(z.eigene, [{ id: "eigen", name: "Alkohol" }]);
  assert.deepEqual(gewaehlt(z), ["kippe", "eigen"]);
  assert.equal(z.commitment.eigen.drang, false);
  assert.equal(z.ereignisse.length, 1);
});

test("Unsinn bei eigenen Trackern wird beim Laden verworfen", () => {
  const roh = { v: VERSION, eigene: [{ id: "eigen", name: "A" }, { id: "eigen", name: "B" }, { id: "kaffee", name: "C" }, { id: "eigen-x", name: "  " }, null],
    ereignisse: [{ tag: "2026-10-01", verzicht: "eigen-weg", art: "habe" }] };
  const z = aus(JSON.stringify(roh));
  assert.deepEqual(z.eigene, [{ id: "eigen", name: "A" }]);
  assert.deepEqual(z.ereignisse, []);
});

test("der Name eines eigenen Trackers geht nicht an kur-core", () => {
  const z = neuerZustand();
  const a = fuegeEigenenHinzu(z, "Alkohol");
  notiere(z, { tag: "2026-10-01", zeit: "20:00", verzicht: a, art: "habe" });
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

test("die Heatmap: ab der Woche des 1. September, Montag oben, der Oktober ganz darin", () => {
  for (const [heute, n] of [["2026-09-26", 9], [okt(15), 9], ["2026-11-20", 12], ["2026-12-20", 13]]) {
    const w = heatWochen(heute);
    assert.equal(w.length, n, heute);
    assert.ok(w.every((x) => x.length === 7));
    assert.equal(new Date(w[0][0] + "T12:00").getDay(), 1, "Montag oben");
    const alle = w.flat();
    if (heute < "2026-12-01") assert.ok(alle.includes("2026-09-01") && alle.includes(okt(31)), heute);
    assert.ok(alle.includes(heute) || heute < okt(31));
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

test("freie Tage überstehen Speichern; Unsinn wird verworfen", () => {
  const z = mit("kippe");
  schalteFrei(z, okt(2));
  assert.deepEqual(aus(JSON.stringify(z)), z);
  const roh = { ...z, freieTage: [okt(2), "gestern", 7, okt(2)] };
  assert.deepEqual(aus(JSON.stringify(roh)).freieTage, [okt(2)]);
});
test("der Satz zum Tag lädt ein und mahnt nie", () => {
  const z = mit("kaffee");
  assert.equal(tagessatz(z, okt(1)), "Eine Notiz, und der Tag zählt.");
  notizAn(z, okt(1));
  assert.match(tagessatz(z, okt(1)), /^Der Tag zählt\. Eine Notiz/);
  assert.equal(tagessatz(z, okt(2)), "Eine Notiz hält die Kette.");
  assert.equal(tagessatz(z, okt(3)), "Gestern war frei. Heute reicht wieder eine Notiz.");
  schalteFrei(z, okt(3));
  assert.match(tagessatz(z, okt(3)), /^Heute ist frei/);
});

test("der Leitgedanke: anfangs der der App, dann deiner, ab einem Tag", () => {
  const z = mit("kaffee");
  assert.deepEqual(leitgedankeAm(z, okt(1)), { text: "Bereitschaft genügt.", ab: null });
  assert.equal(begleitetSeit(z, okt(1)), null);
  assert.equal(setzeLeitgedanke(z, "Bereitschaft genügt.", okt(1)), false, "derselbe Satz ändert nichts");
  assert.deepEqual(z.leitgedanken, []);
  assert.equal(setzeLeitgedanke(z, "  Ein Tag nach   dem anderen. ", okt(3)), true);
  assert.equal(leitgedankeAm(z, okt(2)).text, LEITGEDANKE, "nie rückwirkend");
  assert.equal(leitgedankeAm(z, okt(9)).text, "Ein Tag nach dem anderen.");
  assert.equal(begleitetSeit(z, okt(9)), 7);
  setzeLeitgedanke(z, "Atmen.", okt(10));
  setzeLeitgedanke(z, "Atmen. Weiter.", okt(10));
  assert.deepEqual(z.leitgedanken.map((l) => l.text), ["Ein Tag nach dem anderen.", "Atmen. Weiter."],
    "am selben Tag zweimal geändert: nur der letzte");
  setzeLeitgedanke(z, "", okt(12));
  assert.equal(leitgedankeAm(z, okt(12)).text, LEITGEDANKE, "leer heißt: zurück zu dem der App");
  assert.deepEqual(aus(JSON.stringify(z)).leitgedanken, z.leitgedanken, "übersteht Speichern");
});

test("der Rückblick weiß, welcher Leitgedanke in welcher Woche galt", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1), okt(9));
  setzeLeitgedanke(z, "Atmen.", okt(8));
  assert.deepEqual(wochen(z, okt(9)).map((w) => w.leitgedanke), [LEITGEDANKE, "Atmen."]);
});

test("der Leitgedanke bleibt auf dem Gerät", () => {
  const z = mit("kaffee");
  setzeLeitgedanke(z, "Mein Geheimnis", okt(1));
  notizAn(z, okt(1));
  assert.ok(!JSON.stringify(fuerKern(z, okt(1))).includes("Geheimnis"));
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

test("„ich bin da\": ein Tippen, und der Tag zählt wie eine Notiz", () => {
  const z = mit("kaffee");
  notizAn(z, okt(1));
  schalteDa(z, okt(2));
  schalteDa(z, okt(3));
  assert.equal(istDa(z, okt(2)), true);
  assert.equal(hatEintrag(z, okt(2)), true);
  assert.equal(serie(z, okt(3)), 3);
  assert.deepEqual(lauf(z, okt(3)).tage.slice(0, 3).map((t) => t.stand), ["dabei", "dabei", "dabei"]);
  assert.equal(tagessatz(z, okt(3)), "Der Tag zählt. Du bist da.");
  assert.equal(besterLauf(z, okt(3)), 3);
  assert.equal(tagesAnteil(z, okt(2)), 0.2, "in der Heatmap der hellste Ton");
  assert.deepEqual(fuerKern(z, okt(3)).eintraege.map((e) => e.date), [okt(1), okt(2), okt(3)]);
  schalteDa(z, okt(3));
  assert.equal(istDa(z, okt(3)), false, "zurücknehmen geht");
  assert.deepEqual(aus(JSON.stringify(z)).daTage, [okt(2)], "übersteht Speichern");
});

test("„ich bin da\" an einem freien Tag: der Tag steht als dabei, nicht als frei", () => {
  const z = mit("kaffee");
  schalteFrei(z, okt(1));
  schalteDa(z, okt(1));
  assert.equal(lauf(z, okt(1)).tage[0].stand, "dabei");
  assert.equal(tagessatz(z, okt(1)), "Der Tag zählt. Du bist da.");
});

test("schnell loggen: erst notieren, Details später, oder zurücknehmen", () => {
  const z = mit("kaffee");
  notiere(z, { tag: okt(1), zeit: "08:00", verzicht: "kaffee", art: "habe" });
  const id = z.ereignisse.at(-1).id;
  assert.deepEqual(z.ereignisse[0].antworten, {});
  ergaenze(z, id, { antworten: { davor: "Büro" } });
  const neu = ergaenze(z, id, { antworten: { statt: "Tee" } });
  assert.deepEqual(z.ereignisse[0].antworten, { davor: "Büro", statt: "Tee" }, "Details kommen dazu, nichts geht verloren");
  assert.deepEqual(neu, []);
  notiere(z, { tag: okt(2), zeit: "08:00", verzicht: "kaffee", art: "habe" });
  const offen = ergaenze(z, z.ereignisse.at(-1).id, { antworten: { statt: "Wasser" } });
  assert.deepEqual(offen.map((e) => e.id), ["statt"], "Details können eine Ebene öffnen");
  assert.equal(entferne(z, id), true);
  assert.equal(entferne(z, id), false);
  assert.equal(z.ereignisse.length, 1);
});

test("es gibt keinen Baustein „Freie Tage\" mehr; ein leerer Tag ist frei", () => {
  assert.ok(!BAUSTEINE.some((b) => b.id === "freieTage"));
  const z = aus(JSON.stringify({ v: VERSION, bausteine: { freieTage: true, lauf: true } }));
  assert.deepEqual(z.bausteine, { lauf: true });
});

test("drei helle Farbwelten; die gewählte übersteht Speichern, Unbekanntes wird Papier", () => {
  assert.deepEqual(Object.keys(FARBWELTEN), ["papier", "salbei", "flieder"]);
  const z = neuerZustand();
  assert.equal(z.farbe, "papier");
  z.farbe = "flieder";
  assert.equal(aus(JSON.stringify(z)).farbe, "flieder");
  assert.equal(aus(JSON.stringify({ ...z, farbe: "neon" })).farbe, "papier");
});

test("der Monat: der Oktober als Kalender, Montag vorn, ein Tippen macht den Tag voll", () => {
  const z = mit("kaffee");
  const m = monat(z, "2026-10-14");
  assert.equal(m.phase, "im");
  assert.equal(m.zellen[0].tag, "2026-09-28", "der 1. Oktober 2026 ist ein Donnerstag");
  assert.deepEqual(m.zellen.slice(0, 3).map((c) => c.art), ["rand", "rand", "rand"]);
  assert.equal(m.zellen.filter((c) => c.art === "okt").length, 31);
  assert.equal(m.dabei, 0);
  const heute = m.zellen.find((c) => c.heute);
  assert.deepEqual([heute.nr, heute.stand], [14, "offen"]);
  assert.equal(m.zellen.find((c) => c.tag === "2026-10-13").stand, "leer", "vergangen ohne Eintrag: nichts bekannt");
  assert.equal(m.zellen.find((c) => c.tag === "2026-10-15").stand, "kommt");

  schalteDa(z, "2026-10-14");
  notiere(z, { tag: "2026-10-02", zeit: "09:00", verzicht: "kaffee", art: "habe" });
  const n = monat(z, "2026-10-14");
  assert.equal(n.dabei, 2, "ein Konsum ist eine Notiz, der Tag zählt trotzdem");
  assert.equal(n.zellen.find((c) => c.heute).stand, "dabei");
});

test("der Monat kurz vor dem Oktober: die Tage davor sind Vorlauf", () => {
  const z = mit("kaffee");
  schalteDa(z, "2026-09-26");
  const m = monat(z, "2026-09-27");
  assert.equal(m.phase, "vor");
  assert.equal(m.zellen[0].tag, "2026-09-21", "ab dem Montag dieser Woche");
  assert.ok(m.zellen.filter((c) => c.art !== "okt").every((c) => c.art === "vorlauf"));
  assert.equal(m.vorlauf, 1);
  assert.equal(m.dabei, 0);
  assert.equal(monat(z, "2026-08-01").zellen.filter((c) => c.art === "vorlauf").length, 0, "Wochen vorher noch kein Vorlauf");
});

test("das Tagebuch: Stimmung, Selbst, getragen — und der Tag zählt", () => {
  const z = mit("kaffee");
  const t = "2026-10-14";
  schreibeTag(z, t, { stimmung: 4, selbst: [6, 6, 1, 3], getragen: "  der Spaziergang  " });
  assert.deepEqual(z.tagebuch[t], { stimmung: 4, selbst: [6, 1], getragen: "der Spaziergang" }, "höchstens zwei Selbst");
  assert.equal(hatEintrag(z, t), true, "einordnen zählt den Tag wie eine Notiz");
  assert.deepEqual(fuerKern(z, t).eintraege, [{ date: t, habit: "dabei", value: true }]);
  assert.ok(!JSON.stringify(fuerKern(z, t)).includes("Spaziergang"), "was im Tagebuch steht, bleibt im Gerät");
  schreibeTag(z, t, { getragen: "" });
  assert.equal(z.tagebuch[t].getragen, undefined);
  schreibeTag(z, t, { stimmung: 0, selbst: [] });
  assert.equal(z.tagebuch[t], undefined, "leer heißt weg");
});

test("das Tagebuch übersteht Speichern; Unsinn wird verworfen", () => {
  const z = mit("kaffee");
  schreibeTag(z, "2026-10-02", { stimmung: 1, selbst: [0] });
  assert.deepEqual(aus(JSON.stringify(z)).tagebuch, z.tagebuch);
  const roh = { ...z, tagebuch: { "gestern": { stimmung: 3 }, "2026-10-03": { stimmung: 9, selbst: [99, "x"], getragen: 5 } } };
  assert.deepEqual(aus(JSON.stringify(roh)).tagebuch, {});
});

test("die Ebenen: jede eine Farbe, jede ein Wert von 0 bis 1", () => {
  const z = mit("kaffee");
  const t = "2026-10-14";
  schreibeTag(z, t, { stimmung: STIMMUNG.length, selbst: [2] });
  notiere(z, { tag: t, zeit: "10:00", verzicht: "kaffee", art: "drang" });
  schreibeTag(z, t, { werte: { schlaf: 1, bewegung: 3 } });
  const w = Object.fromEntries(SCHICHTEN.map((s) => [s.id, s.wert(z, t)]));
  assert.deepEqual(w, { dabei: 1, koerper: 0.4, antrieb: 1, selbst: 0.5, drang: 1 / 3, geschehen: 0 },
    "Körper und Antrieb sind der Mittelwert der angegebenen Systeme");
  assert.equal(new Set(SCHICHTEN.map((s) => s.farbe)).size, SCHICHTEN.length, "keine Farbe doppelt");
  assert.ok(!SCHICHTEN.some((s) => /rot|red/.test(s.farbe)), "kein Rot");
  assert.equal(SELBST.length, 11);
});

test("das Tagebuch in Zeilen: jeder Tag eine, neu nach alt, leere Tage auch", () => {
  const z = mit("kaffee");
  schreibeTag(z, "2026-10-02", { stimmung: 2, selbst: [6], getragen: "Tee statt Kaffee" });
  schalteDa(z, "2026-10-03");
  const zeilen = tagebuchZeilen(z, "2026-10-04");
  assert.deepEqual(zeilen.map((x) => x.tag), ["2026-10-04", "2026-10-03", "2026-10-02", "2026-10-01"]);
  assert.deepEqual(zeilen.map((x) => x.dabei), [false, true, true, false]);
  assert.deepEqual([zeilen[2].kopf, zeilen[2].getragen, zeilen[2].stimmung, zeilen[2].selbst], ["Tag 2", "Tee statt Kaffee", 2, ["Selbstfürsorge"]]);
  assert.equal(zeilen[0].heute, true);
  schalteDa(z, "2026-09-20");
  assert.equal(tagebuchZeilen(z, "2026-10-04").at(-1).tag, "2026-09-20", "wer schon im Vorlauf war, sieht ihn");
  assert.equal(tagebuchZeilen(z, "2026-12-31").length, 45, "höchstens 45 Tage");
});

test("die Systeme unter den Symptomen: acht, zwei Gruppen, je fünf Stufen", () => {
  assert.deepEqual(SYSTEME.map((x) => x.id), ["schlaf", "verdauung", "bewegung", "ernaehrung", "stimmung", "antrieb", "motivation", "lust"]);
  const z = mit("kaffee");
  schreibeTag(z, "2026-10-05", { werte: { schlaf: 2, lust: 5, verdauung: 9, erfunden: 3 } });
  assert.deepEqual(z.tagebuch["2026-10-05"], { schlaf: 2, lust: 5 }, "Unbekanntes und Unsinn fallen weg");
  assert.equal(eingeschaetzt(z, "2026-10-05"), 2);
  assert.deepEqual(aus(JSON.stringify(z)).tagebuch, z.tagebuch);
  schreibeTag(z, "2026-10-05", { werte: { schlaf: 0, lust: 0 } });
  assert.equal(z.tagebuch["2026-10-05"], undefined);
});

test("Zusammenhänge: erst mit genug Tagen auf beiden Seiten, dann nach Größe", () => {
  const z = mit("kaffee");
  const tage = [];
  for (let d = 1; d <= 8; d++) {
    const t = okt(d);
    tage.push(t);
    const schlecht = d <= 4;
    schreibeTag(z, t, { werte: { schlaf: schlecht ? 1 : 5, stimmung: 3 } });
    for (let i = 0; i < (schlecht ? 3 : 0); i++) notiere(z, { tag: t, zeit: "10:00", verzicht: "kaffee", art: "drang" });
  }
  const zs = zusammenhaenge(z, tage);
  assert.equal(zs.length, 1, "Stimmung immer mittel: kein Vergleich");
  assert.deepEqual([zs[0].system.id, zs[0].ziel, zs[0].unten, zs[0].oben],
    ["schlaf", "drang", { tage: 4, schnitt: 3 }, { tage: 4, schnitt: 0 }]);
  assert.deepEqual(zusammenhaenge(z, tage.slice(0, 5)), [], "nur ein Tag mit gutem Schlaf: zu wenig");
});

test("der Verlauf: je System eine Reihe, Drang und Geschehen darunter", () => {
  const z = mit("kaffee");
  schreibeTag(z, okt(2), { werte: { schlaf: 5 } });
  notiere(z, { tag: okt(1), zeit: "10:00", verzicht: "kaffee", art: "habe" });
  const v = verlauf(z, [okt(1), okt(2)]);
  assert.deepEqual(v.map((r) => r.id).slice(-3), ["lust", "drang", "geschehen"]);
  assert.deepEqual(v[0].werte, [0, 1]);
  assert.deepEqual(v.at(-1).werte, [1 / 3, 0]);
});

test("drei Schichten: neu fängt man bei 1 an, ein alter Stand hatte alles", () => {
  assert.deepEqual(TIEFEN.map((t) => t.name), ["Beobachten", "Formen", "Nervensystem"]);
  assert.equal(neuerZustand().tiefe, 1);
  assert.equal(aus(JSON.stringify({ v: 1, commitment: { kaffee: { drang: true } } })).tiefe, 3, "wer schon da war, verliert nichts");
  const z = mit("kaffee");
  z.tiefe = 2;
  assert.equal(aus(JSON.stringify(z)).tiefe, 2);
  schalteBaustein(z, "verlauf", true);
  assert.equal(aktiv(z, "verlauf"), false, "Schicht 3 bleibt zu, auch wenn eingeschaltet");
  z.tiefe = 3;
  assert.equal(aktiv(z, "verlauf"), true);
});

test("aufbauen statt lassen: eine Morgenroutine mit Schritten", () => {
  const z = mit("kaffee");
  const vorschlag = AUFBAU_VORSCHLAEGE[0];
  const id = fuegeEigenenHinzu(z, vorschlag.name, { art: "aufbauen", schritte: vorschlag.schritte });
  const V = verzichte(z)[id];
  assert.equal(V.aufbau, true);
  assert.equal(V.schritte.length, 4);
  assert.deepEqual(z.commitment[id], { drang: false }, "beim Aufbauen gibt es kein würde gern");
  assert.equal(commitmentSatz(z), "Im Oktober lasse ich den Kaffee sein und baue Morgenroutine auf.");

  assert.equal(schalteSchritt(z, okt(3), "07:00", id, 0), true);
  schalteSchritt(z, okt(3), "07:05", id, 2);
  assert.deepEqual([...schritteGetan(z, okt(3), id)].sort(), [0, 2]);
  assert.equal(hatEintrag(z, okt(3)), true, "ein Schritt zählt den Tag");
  assert.equal(schalteSchritt(z, okt(3), "07:10", id, 0), false, "zweites Tippen nimmt ihn weg");
  assert.deepEqual([...schritteGetan(z, okt(3), id)], [2]);

  setzeSchritte(z, id, ["  Wasser ", "", "Dehnen"]);
  const zurueck = aus(JSON.stringify(z));
  assert.deepEqual(zurueck.eigene.find((e) => e.id === id), { id, name: "Morgenroutine", art: "aufbauen", schritte: ["Wasser", "Dehnen"] });
  assert.equal(zurueck.ereignisse.filter((e) => e.art === "getan").length, 1);
});

test("nur aufbauen, ohne Verzicht, geht auch", () => {
  const z = neuerZustand();
  fuegeEigenenHinzu(z, "Bewegung", { art: "aufbauen" });
  assert.equal(commitmentSatz(z), "Im Oktober baue ich Bewegung auf.");
  assert.equal(gewaehlt(z).length, 1);
});

test("Werkzeuge: Anker, Swish und Wenn-dann bleiben, Unsinn fällt weg", () => {
  const z = mit("kaffee");
  setzeAnker(z, "  Am See, morgens, ganz ruhig ", "");
  setzeSwish(z, "Die Kaffeemaschine im Büro", "Ich, wach und klar, mit Tee");
  assert.equal(planHinzu(z, "Wenn ich ins Büro komme", "dann trinke ich zuerst ein Glas Wasser"), true);
  assert.equal(planHinzu(z, "", "irgendwas"), false);
  assert.deepEqual(z.werkzeug, {
    anker: { moment: "Am See, morgens, ganz ruhig", geste: "Daumen und Zeigefinger" },
    swish: { ausloeser: "Die Kaffeemaschine im Büro", ziel: "Ich, wach und klar, mit Tee" },
    plaene: [{ wenn: "ich ins Büro komme", dann: "trinke ich zuerst ein Glas Wasser" }],
  });
  assert.deepEqual(aus(JSON.stringify(z)).werkzeug, z.werkzeug);
  for (let i = 0; i < PLAENE_MAX + 2; i++) planHinzu(z, `wenn ${i}`, "dann");
  assert.equal(z.werkzeug.plaene.length, PLAENE_MAX);
  planWeg(z, 0);
  assert.equal(z.werkzeug.plaene.length, PLAENE_MAX - 1);
  assert.deepEqual(aus(JSON.stringify({ ...z, werkzeug: { anker: { moment: 5 }, plaene: "x" } })).werkzeug, { anker: null, swish: null, plaene: [] });
});
