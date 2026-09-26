/* =====================================================================
   Die Logik — ohne DOM, ohne Speicher-API

   Zustand, Oktober-Zählung, Freischalten und die Übersetzung in den
   Wertevertrag von kur-core. Alles hier ist reine Funktion und läuft mit
   `node --test`.

   ## Wo die Daten liegen

   Vorerst nur im Browser (localStorage, siehe speicher.js). Später soll
   die Teilnahme — und nur sie — auf einen Server nach dem Muster von
   kur-core: wer mitmacht, mit welchem Commitment, und an welchen Tagen
   etwas notiert wurde. Einträge, Gefühle und Reflexionen bleiben im Gerät.
   `fuerKern()` ist die Stelle, an der das passiert; sie liefert schon heute
   Werte, die `normalisiere()` aus kur-core/server/api.js annimmt.
   ===================================================================== */

import { tageZwischen, tagNummer, alsDatum, verschiebe } from "../kern/datum.js";

export const VERSION = 1;

export const VERZICHTE = {
  kaffee: { name: "Kaffee", satz: "den Kaffee", habe: "Kaffee getrunken", drang: "würde gern Kaffee" },
  kippe:  { name: "Kippe",  satz: "die Kippe",  habe: "geraucht",        drang: "will rauchen" },
  video:  { name: "Video",  satz: "das Video",  habe: "Video geschaut",  drang: "würde gern schauen" },
};

/** Die drei festen Verzichte, die „Alles" auf einmal wählt. */
export const FEST = Object.keys(VERZICHTE);

/* Eigene Tracker: so viele, wie man will, jederzeit dazu. Den Namen schreibt
   der Mensch selbst („Alkohol", „Zucker", „Social Media"). Er steht in
   `z.eigene`, getrennt vom Commitment, damit er beim Abwählen nicht verloren
   geht, und bleibt auf dem Gerät, siehe fuerKern(). Der erste heißt `eigen`
   — so hieß die eine eigene Definition, die es vorher gab. */
export const EIGEN = "eigen";
const EIGEN_ID = /^eigen(-[a-z0-9]{1,12})?$/;
const EIGEN_LAENGE = 60;

/* Eigene Tracker bekommen Töne aus der Magenta-Familie, damit sie sich von
   den festen (gelb, blau, lila) und den Bedeutungsfarben unterscheiden. */
const EIGEN_FARBEN = [
  "var(--magenta)",
  "color-mix(in oklab, var(--magenta) 55%, var(--gelb))",
  "color-mix(in oklab, var(--magenta) 55%, var(--blau))",
  "color-mix(in oklab, var(--magenta) 60%, var(--leise))",
];

/** Der Name, wie er in Sätzen steht: „kein Alkohol" wird „Alkohol". */
export const saubererName = (name) =>
  String(name || "").replace(/\s+/g, " ").trim().replace(/^kein(e|en|em|er|es)?\s+/i, "").trim().slice(0, EIGEN_LAENGE);

/** Alle Tracker dieses Zustands — die festen und die eigenen. */
export function verzichte(z) {
  const alle = { ...VERZICHTE };
  z.eigene.forEach((e, i) => {
    const name = saubererName(e.name) || "Eigenes";
    alle[e.id] = { name, satz: name, habe: `${name} — ist geschehen`, drang: `würde gern: ${name}`,
      eigen: true, farbe: EIGEN_FARBEN[i % EIGEN_FARBEN.length] };
  });
  return alle;
}

/** Ein eigener Tracker mehr. Gibt seine id zurück, oder null ohne Namen. Er
    ist gleich gewählt; einen gleichnamigen gibt es nicht zweimal. */
export function fuegeEigenenHinzu(z, name) {
  const n = saubererName(name);
  if (!n) return null;
  const da = z.eigene.find((e) => saubererName(e.name).toLowerCase() === n.toLowerCase());
  const id = da ? da.id : z.eigene.some((e) => e.id === EIGEN) ? `eigen-${neueId().slice(0, 8)}` : EIGEN;
  if (!da) z.eigene.push({ id, name: n });
  z.commitment[id] ||= { drang: true };
  return id;
}

export function benenneEigenen(z, id, name) {
  const n = saubererName(name), e = z.eigene.find((x) => x.id === id);
  if (!n || !e) return false;
  e.name = n;
  return true;
}

/** Entfernen geht nur, solange nichts dazu notiert ist — sonst hingen
    Notizen ohne Namen herum. Abwählen geht immer. */
export function entferneEigenen(z, id) {
  if (z.ereignisse.some((e) => e.verzicht === id)) return false;
  z.eigene = z.eigene.filter((e) => e.id !== id);
  delete z.commitment[id];
  return true;
}

export const hatNotizen = (z, id) => z.ereignisse.some((e) => e.verzicht === id);

export const ANSICHTEN = {
  knopf: "Knopf — ein Tracker auf einmal",
  blatt: "Blatt — alles auf einer Seite",
  faden: "Faden — Text und eigene Worte",
};

/* Die vier Grundgefühle als Selbstauskunft, Mehrfachwahl. Eine Linse,
   keine Diagnose: die App ordnet nichts zu, der Mensch wählt. */
const GEFUEHLE = ["Angst", "Wut", "Trauer", "Freude", "weiß nicht"];

/* „davor" und „statt" stammen aus smokefree/modul.js (FRAGEN_ZIGARETTE),
   die dort auf lifetracker RUECK zurückgehen. */
export const FRAGEN = {
  habe: [
    { id: "davor", frage: "Was war kurz davor?", platz: "Telefonat, Feierabend, Warten …" },
    { id: "gefuehl", frage: "Was ist jetzt da?", wahl: GEFUEHLE, mehr: true },
    { id: "statt", frage: "Was hätte auch gepasst?", platz: "Oder: nichts." },
  ],
  drang: [
    { id: "davor", frage: "Was war kurz davor?", platz: "Aufgewacht, Pause, Langeweile …" },
    { id: "gefuehl", frage: "Was ist gerade da?", wahl: GEFUEHLE, mehr: true },
    { id: "wo", frage: "Wo spürst du es?", platz: "Brust, Hände, Mund, nirgends …" },
    { id: "damit", frage: "Was machst du jetzt damit?",
      wahl: ["abwarten", "etwas anderes", "nachgeben", "ist schon vorbei", "weiß nicht"] },
  ],
};

/** Antworten, die aus einer Auswahl stammen — sie sind nicht die eigenen
    Worte und werden nicht als Zitat gezeigt. */
export const AUSWAHL = new Set(["gefuehl", "damit"]);

/* Ebenen öffnen sich durch Benutzen. Was man selbst einschaltet, ist ein
   Baustein (siehe BAUSTEINE); die Ebenen als Ganzes sind selbst einer. */
export const EBENEN = [
  { id: "drang", art: "verdient", titel: "Wie ein Drang verläuft", rubrik: "Wissen · Nervensystem",
    bedingung: "öffnet sich, wenn du einen Würde-gern-Moment notiert hast",
    erfuellt: (z) => z.ereignisse.some((e) => e.art === "drang") },
  { id: "routine", art: "verdient", titel: "Was an der Stelle steht", rubrik: "Wissen · Routinen",
    bedingung: "öffnet sich, wenn du an drei Tagen etwas notiert hast",
    erfuellt: (z) => notizTage(z) >= 3 },
  { id: "statt", art: "verdient", titel: "Etwas anderes an die Stelle", rubrik: "Neue Verhaltensweisen",
    bedingung: "öffnet sich, wenn du zweimal notiert hast, was auch gepasst hätte",
    erfuellt: (z) => z.ereignisse.filter((e) => e.antworten.statt || e.antworten.damit === "etwas anderes").length >= 2 },
  { id: "rueckblick", art: "verdient", titel: "Dein Oktober in Wochen", rubrik: "Rückblick",
    bedingung: "öffnet sich, wenn die erste Oktoberwoche vorbei ist",
    erfuellt: (z, tag) => notizTage(z) >= 1 && (oktober(tag).phase === "nach" || (oktober(tag).phase === "im" && oktober(tag).tag >= 8)) },
];

/* ---- Bausteine ------------------------------------------------------------

   Die App fängt klein an: die Tracker, und je Tracker „habe", „würde gern"
   und „heute ohne". Alles andere ist ein Baustein, den man in den
   Einstellungen dazunimmt oder weglässt. `standard` sagt, was ein neuer
   Zustand von sich aus zeigt — nur der Leitgedanke und die Abendruhe, weil
   beide nichts fordern. */
export const BAUSTEINE = [
  { id: "leitgedanke", gruppe: "Oben", titel: "Leitgedanke", standard: true,
    text: "Ein eigener Satz, der dich begleitet." },
  { id: "lauf", gruppe: "Oben", titel: "Lauf und Kette", standard: false,
    text: "Tage dabei, die Kette auf der Fibonacci-Leiter, ein Satz zum Tag und kleine Momente an den Stufen." },
  { id: "freieTage", gruppe: "Oben", titel: "Freie Tage", standard: false,
    text: "Einen Tag bewusst frei nehmen — er hält die Kette." },
  { id: "heatmap", gruppe: "Unten", titel: "Heatmap", standard: false,
    text: "Dein Oktober als Kästchen, eine Spalte je Woche." },
  { id: "ebenen", gruppe: "Unten", titel: "Wissen und Rückblick", standard: false,
    text: "Ebenen, die sich durch Benutzen öffnen: wie ein Drang verläuft, Routinen, Neues an die Stelle, der Rückblick in Wochen." },
  { id: "abends", gruppe: "Darstellung", titel: "Abends ruhiger", standard: true,
    text: "Nach Sonnenuntergang wird die Seite eine Spur ruhiger." },
];

export function aktiv(z, id) {
  if (id in z.bausteine) return z.bausteine[id];
  return !!BAUSTEINE.find((b) => b.id === id)?.standard;
}

export function schalteBaustein(z, id, an = !aktiv(z, id)) {
  if (!BAUSTEINE.some((b) => b.id === id)) return;
  z.bausteine[id] = !!an;
}

/* ---- Zustand ----------------------------------------------------------- */

export function neuerZustand() {
  return { v: VERSION, commitment: {}, eigene: [], ansicht: "knopf", ereignisse: [], frei: {}, freieTage: [], leitgedanken: [], bausteine: {} };
}

/** Aus gespeichertem Text. Unlesbares oder Fremdes wird ein leerer Zustand,
    nie ein Absturz; eine unbekannte Version ebenso — die Daten bleiben dann
    im Speicher stehen, siehe speicher.js. */
export function aus(text) {
  let roh;
  try { roh = JSON.parse(text); } catch { return neuerZustand(); }
  if (!roh || typeof roh !== "object" || roh.v !== VERSION) return neuerZustand();
  const z = neuerZustand();
  if (Array.isArray(roh.eigene))
    for (const e of roh.eigene)
      if (e && EIGEN_ID.test(e.id) && saubererName(e.name) && !z.eigene.some((x) => x.id === e.id))
        z.eigene.push({ id: e.id, name: String(e.name).slice(0, EIGEN_LAENGE) });
  // Die eine eigene Definition von vorher wird der erste eigene Tracker.
  if (roh.eigen && saubererName(roh.eigen.name) && !z.eigene.some((x) => x.id === EIGEN))
    z.eigene.unshift({ id: EIGEN, name: String(roh.eigen.name).slice(0, EIGEN_LAENGE) });
  const ids = [...FEST, ...z.eigene.map((e) => e.id)];
  if (roh.commitment && typeof roh.commitment === "object")
    for (const k of ids)
      if (roh.commitment[k]) z.commitment[k] = { drang: !!roh.commitment[k].drang };
  if (ANSICHTEN[roh.ansicht]) z.ansicht = roh.ansicht;
  if (Array.isArray(roh.ereignisse))
    z.ereignisse = roh.ereignisse.filter((e) => e && ids.includes(e.verzicht) && ["habe", "drang", "ohne"].includes(e.art))
      .map((e) => ({ ...e, antworten: e.antworten && typeof e.antworten === "object" ? e.antworten : {} }));
  if (roh.frei && typeof roh.frei === "object")
    for (const eb of EBENEN) if (roh.frei[eb.id]) z.frei[eb.id] = roh.frei[eb.id];
  if (Array.isArray(roh.freieTage))
    z.freieTage = [...new Set(roh.freieTage.filter((t) => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)))].sort();

  if (Array.isArray(roh.leitgedanken))
    z.leitgedanken = roh.leitgedanken
      .filter((l) => l && typeof l.text === "string" && l.text.trim() && /^\d{4}-\d{2}-\d{2}$/.test(l.ab))
      .map((l) => ({ text: l.text.slice(0, LEIT_LAENGE), ab: l.ab }))
      .sort((a, b) => a.ab.localeCompare(b.ab));
  if (roh.bausteine && typeof roh.bausteine === "object") {
    for (const b of BAUSTEINE) if (typeof roh.bausteine[b.id] === "boolean") z.bausteine[b.id] = roh.bausteine[b.id];
  } else {
    // Ein Stand von vor den Bausteinen: was dort sichtbar war, bleibt es.
    // Lauf und Kette gab es nur in der Vorschau (die schrieb `freieTage`),
    // nie live — wer von dort kommt, fängt klein an.
    if ("freieTage" in roh && z.ereignisse.length) z.bausteine.lauf = true;
    if (z.freieTage.length) z.bausteine.freieTage = true;
    if (roh.frei && roh.frei.verlauf) z.bausteine.heatmap = true;
    if (EBENEN.some((eb) => z.frei[eb.id])) z.bausteine.ebenen = true;
    if (roh.abends === false) z.bausteine.abends = false;
  }
  return z;
}

/** Was gewählt ist: erst die festen, dann die eigenen in ihrer Reihenfolge. */
export const gewaehlt = (z) => [...FEST, ...z.eigene.map((e) => e.id)].filter((k) => z.commitment[k]);

/** „Alles": wählt die drei festen Verzichte — oder, wenn sie schon alle
    gewählt sind, wieder ab. Die eigene Definition bleibt, wie sie ist. */
export function schalteAlles(z) {
  const alle = FEST.every((k) => z.commitment[k]);
  for (const k of FEST) {
    if (alle) delete z.commitment[k];
    else if (!z.commitment[k]) z.commitment[k] = { drang: true };
  }
}

export function commitmentSatz(z) {
  const V = verzichte(z);
  const n = gewaehlt(z).map((k) => V[k].satz);
  if (!n.length) return "";
  const liste = n.length > 1 ? n.slice(0, -1).join(", ") + " und " + n.at(-1) : n[0];
  return `Im Oktober lasse ich ${liste} sein.`;
}

export const vonTag = (z, tag, v) => z.ereignisse.filter((e) => e.tag === tag && (!v || e.verzicht === v));

export const notizTage = (z) => new Set(z.ereignisse.map((e) => e.tag)).size;

/** Ein Eintrag. Gibt die Ebenen zurück, die sich dadurch geöffnet haben. */
export function notiere(z, { tag, zeit, verzicht, art, antworten = {}, begleitetSek }) {
  const e = { id: neueId(), tag, zeit, verzicht, art, antworten };
  if (begleitetSek) e.begleitetSek = begleitetSek;
  z.ereignisse.push(e);
  return freischalten(z, tag, zeit);
}

/** „heute ohne" an- oder ausschalten. */
export function schalteOhne(z, tag, zeit, verzicht) {
  const da = z.ereignisse.findIndex((e) => e.tag === tag && e.verzicht === verzicht && e.art === "ohne");
  if (da >= 0) z.ereignisse.splice(da, 1);
  else z.ereignisse.push({ id: neueId(), tag, zeit, verzicht, art: "ohne", antworten: {} });
}

export function freischalten(z, tag, zeit) {
  const neu = [];
  for (const eb of EBENEN)
    if (eb.art === "verdient" && !z.frei[eb.id] && eb.erfuellt(z, tag)) {
      z.frei[eb.id] = { tag, zeit, gesehen: false };
      neu.push(eb);
    }
  return neu;
}

/** "zu" | "frei" */
export const stand = (z, id) => (z.frei[id] ? "frei" : "zu");

function neueId() {
  return (globalThis.crypto?.randomUUID?.() || String(Math.random()).slice(2)).replace(/-/g, "").slice(0, 12);
}

/* ---- Der Oktober --------------------------------------------------------- */

/** Wo steht `heute` zum Oktober seines Jahres?
    @returns {phase: "vor"|"im"|"nach", tag, noch, start} */
export function oktober(heute) {
  const jahr = alsDatum(heute).getFullYear();
  const start = `${jahr}-10-01`;
  const n = tagNummer(start, heute);
  if (n < 1) return { phase: "vor", noch: tageZwischen(heute, start), start };
  if (n > 31) return { phase: "nach", tag: n, start };
  return { phase: "im", tag: n, start };
}

export function tagesZeile(heute) {
  const o = oktober(heute);
  if (o.phase === "vor") return o.noch === 1 ? "Morgen beginnt der Oktober" : `Noch ${o.noch} Tage bis Oktober`;
  if (o.phase === "nach") return "Nach dem Oktober";
  return `Tag ${o.tag}`;
}

/** Kopf eines vergangenen Tages: im Oktober „Tag N", sonst das Datum. */
export function tagesKopf(tag) {
  const o = oktober(tag);
  if (o.phase === "im") return `Tag ${o.tag}`;
  return alsDatum(tag).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
}

/* ---- Der Lauf — aus lifetracker ----------------------------------------

   Übernommen aus lifetracker/public/app.js (personStreak, kettenLauf,
   bestStreak, heatmap). Die Regeln sind dieselben, nur „dabei" heißt hier
   etwas anderes: dort ein Häkchen, hier eine Notiz, gleich welche — ein
   „heute ohne", ein „habe", ein „würde gern". Wer notiert, ist dabei; ein
   Konsum ist ein Ereignis, kein Bruch der Kette.

   Ein einzelner Leertag beendet den Lauf nicht, zwei hintereinander schon.
   Der laufende Tag zählt erst, wenn etwas drin steht — sonst stünde die
   Serie jeden Morgen auf null. */

/* Ein freier Tag ist bewusst genommen, nicht vergessen: er hält die Kette
   wie eine Notiz und bekommt seine eigene Farbe (aus lifetracker, FEIER). */
export const istFrei = (z, tag) => z.freieTage.includes(tag);

export function schalteFrei(z, tag) {
  if (istFrei(z, tag)) z.freieTage = z.freieTage.filter((t) => t !== tag);
  else z.freieTage = [...z.freieTage, tag].sort();
}

export const dabei = (z, tag) => istFrei(z, tag) || z.ereignisse.some((e) => e.tag === tag);

/** Tage dabei, von heute (oder gestern, solange heute leer ist) zurück. */
export function serie(z, heute) {
  let d = dabei(z, heute) ? heute : verschiebe(heute, -1), n = 0, luecke = 0;
  for (let i = 0; i < 400; i++) {
    if (dabei(z, d)) { n++; luecke = 0; } else if (++luecke >= 2) break;
    d = verschiebe(d, -1);
  }
  return n;
}

/* Die Kette zeigt den ganzen Lauf, rastet aber auf der Fibonacci-Leiter ein:
   5, 8, 13, 21, 34. Sie springt eine Stufe, sobald der Lauf die alte sprengt;
   die blassen Punkte hinter heute sind die Tage bis zur nächsten Stufe.
   34 ist eine Stufe über den 31 Tagen des Oktobers: der Monat passt ganz
   hinein. */
export const LEITER = [5, 8, 13, 21, 34];

/** {weit, fenster, tage: [{tag, stand: "dabei"|"leer"|"kommt", heute}]} */
export function lauf(z, heute) {
  const max = LEITER.at(-1);
  let d = heute, luecke = 0, weit = 0, ab = 0;
  if (!dabei(z, d)) { d = verschiebe(d, -1); ab = 1; }
  for (let i = 0; i < max - ab; i++) {
    if (dabei(z, d)) { luecke = 0; weit = ab + i + 1; } else if (++luecke >= 2) break;
    d = verschiebe(d, -1);
  }
  weit = Math.max(weit, 1);                  // heute allein ist auch ein Anfang
  const fenster = LEITER.find((l) => l >= weit) || max;
  const tage = [];
  for (let i = 0; i < fenster; i++) {
    const tag = verschiebe(heute, i - (weit - 1));
    const st = i >= weit ? "kommt" : istFrei(z, tag) && !vonTag(z, tag).length ? "frei" : dabei(z, tag) ? "dabei" : "leer";
    tage.push({ tag, heute: tag === heute, stand: st });
  }
  return { weit, fenster, tage, dabeiTage: tage.filter((t) => t.stand === "dabei" || t.stand === "frei").length };
}

/** Der längste Lauf (ohne Lücke), so weit die Notizen zurückreichen. */
export function besterLauf(z, heute) {
  const tage = [...new Set([...z.ereignisse.map((e) => e.tag), ...z.freieTage])].filter((t) => t <= heute).sort();
  let best = 0, run = 0, vor = null;
  for (const t of tage) {
    run = vor && verschiebe(vor, 1) === t ? run + 1 : 1;
    best = Math.max(best, run);
    vor = t;
  }
  return best;
}

/* Die große Heatmap: eine Spalte je Woche (Montag oben). Sie beginnt mit
   der Woche des 1. September — der Monat davor ist die Vorbereitung — und
   endet mit dem 31. Oktober, danach mit heute; höchstens 13 Wochen, dann
   rückt der Anfang mit. Tage nach heute stehen leer. */
export const HEAT_WOCHEN = 13;

/** Wie voll ein Tag war: Anteil der gewählten Verzichte mit einer Notiz. */
export function tagesAnteil(z, tag) {
  const gew = gewaehlt(z);
  const da = new Set(vonTag(z, tag).map((e) => e.verzicht));
  if (!da.size) return 0;
  return Math.min(1, da.size / Math.max(1, gew.length));
}

/** Wochen als Listen von Tagen (Mo–So). */
export function heatWochen(heute) {
  const { start } = oktober(heute);
  const montag = (t) => verschiebe(t, -((alsDatum(t).getDay() + 6) % 7));
  const ende = [verschiebe(start, 30), heute].sort().at(-1);
  const letzterMontag = montag(ende);
  const vomSeptember = tageZwischen(montag(verschiebe(start, -30)), letzterMontag) / 7 + 1;
  const n = Math.min(HEAT_WOCHEN, vomSeptember);
  const wochen = [];
  for (let w = 0; w < n; w++) {
    const woche = [];
    for (let i = 0; i < 7; i++) woche.push(verschiebe(letzterMontag, -7 * (n - 1 - w) + i));
    wochen.push(woche);
  }
  return wochen;
}

/* ---- Der Leitgedanke --------------------------------------------------------

   Ein eigener Satz, der begleitet — über Tage, Wochen, den ganzen Monat.
   Er darf bleiben, er darf sich ändern. Wie die Einstellungen in lifetracker
   gilt er *ab* einem Tag und wirkt nie rückwirkend: ein neuer Satz ersetzt
   den alten nicht, er löst ihn ab, und der Rückblick weiß, welcher Satz in
   welcher Woche galt. Solange keiner geschrieben ist, gilt der der App. */
export const LEITGEDANKE = "Bereitschaft genügt.";
const LEIT_LAENGE = 120;

/** {text, ab} — der Satz, der an `tag` galt; ab: null, wenn es der der App ist. */
export function leitgedankeAm(z, tag) {
  const bis = z.leitgedanken.filter((l) => l.ab <= tag);
  return bis.length ? bis.at(-1) : { text: LEITGEDANKE, ab: null };
}

/** Ein neuer Satz ab `tag`. Derselbe Satz noch einmal ändert nichts; am
    selben Tag zweimal geändert, gilt nur der letzte. Leer heißt: zurück zu
    dem der App. */
export function setzeLeitgedanke(z, text, tag) {
  const t = String(text).replace(/\s+/g, " ").trim().slice(0, LEIT_LAENGE) || LEITGEDANKE;
  if (leitgedankeAm(z, tag).text === t) return false;
  z.leitgedanken = z.leitgedanken.filter((l) => l.ab < tag);
  if (!(t === LEITGEDANKE && !z.leitgedanken.length)) z.leitgedanken.push({ text: t, ab: tag });
  return true;
}

/** Wie viele Tage der Satz schon begleitet, heute eingeschlossen. */
export const begleitetSeit = (z, heute) => {
  const l = leitgedankeAm(z, heute);
  return l.ab ? tageZwischen(l.ab, heute) + 1 : null;
};

/* ---- Der Satz zum Tag — aus lifetracker (tagLine) -------------------------

   Unter dem Leitgedanken: was der Tag gerade ist. Es geht um Dranbleiben,
   nicht um Menge — ab der ersten Notiz zählt der Tag, alles weitere ist
   Zugabe. Einladen, nie mahnen. */
export function tagessatz(z, heute) {
  if (istFrei(z, heute) && !vonTag(z, heute).length) return "Heute ist frei — genommen, nicht vergessen.";
  const n = vonTag(z, heute).length;
  if (n) return `Der Tag zählt. ${n === 1 ? "Eine Notiz" : n + " Notizen"}\u00a0— alles weitere ist Zugabe.`;
  const st = serie(z, heute);
  if (st >= 1 && !dabei(z, verschiebe(heute, -1))) return "Gestern blieb leer. Heute reicht wieder eine Notiz.";
  if (st >= 1) return "Eine Notiz hält die Kette.";
  return "Eine Notiz, und der Tag zählt.";
}

/* ---- Kleine Momente -------------------------------------------------------

   Wenn die Tage dabei eine Stufe der Leiter erreichen, sagt die App einmal
   etwas dazu — jede Stufe etwas anderes, nie zweimal dasselbe. Am Rahmen der
   Kette hängt das nicht: der springt schon morgens, weil der offene Tag
   mitzählt, und ein Moment ohne eigenes Zutun wäre keiner. */
const STUFEN_SATZ = {
  5: "Fünf Tage dabei. Die erste Stufe der Kette ist voll.",
  8: "Acht Tage. Aus einzelnen Tagen wird ein Lauf.",
  13: "Dreizehn Tage am Stück dabei.",
  21: "Einundzwanzig — drei Wochen dabei.",
  34: "Vierunddreißig. Die Kette reicht über den ganzen Oktober.",
};

/** Was sich zwischen zwei Ständen verändert hat; vor/nach = {lauf, serie}. */
export function moment(vor, nach) {
  const heuteVor = vor.lauf.tage.find((t) => t.heute)?.stand;
  const heuteNach = nach.lauf.tage.find((t) => t.heute)?.stand;
  const stufe = LEITER.find((l) => vor.serie < l && nach.serie >= l) || 0;
  return {
    heuteNeu: heuteVor !== heuteNach && (heuteNach === "dabei" || heuteNach === "frei"),
    stufe,
    satz: stufe ? STUFEN_SATZ[stufe] : "",
  };
}

/* ---- Rückblick in Wochen — aus lifetracker (Kurviertel) -------------------

   Der Oktober in vier Abschnitten: drei Wochen und die letzten zehn Tage.
   Gezeigt wird nur, was schon begonnen hat. Die eigenen Worte stehen
   wörtlich da; eine Deutung steht hier nicht. */
const ABSCHNITTE = [["Erste Woche", 1, 7], ["Zweite Woche", 8, 14], ["Dritte Woche", 15, 21], ["Letzte Tage", 22, 31]];

export function wochen(z, heute) {
  const { start } = oktober(heute);
  const aus = [];
  for (const [titel, von, bis] of ABSCHNITTE) {
    const erster = verschiebe(start, von - 1);
    if (erster > heute) break;
    const tage = [];
    for (let i = von; i <= bis; i++) { const t = verschiebe(start, i - 1); if (t <= heute) tage.push(t); }
    const es = z.ereignisse.filter((e) => tage.includes(e.tag));
    const je = {};
    for (const v of new Set([...gewaehlt(z), ...es.map((e) => e.verzicht)])) {
      const ev = es.filter((e) => e.verzicht === v);
      je[v] = { ohne: ev.filter((e) => e.art === "ohne").length, habe: ev.filter((e) => e.art === "habe").length,
        drang: ev.filter((e) => e.art === "drang").length };
    }
    const saetze = es.filter((e) => e.antworten.statt || e.antworten.davor)
      .map((e) => ({ tag: e.tag, v: e.verzicht, text: e.antworten.statt || e.antworten.davor, statt: !!e.antworten.statt }));
    aus.push({ titel, von, bis, tage: tage.length, leitgedanke: leitgedankeAm(z, tage.at(-1)).text, dabei: tage.filter((t) => dabei(z, t)).length,
      frei: tage.filter((t) => istFrei(z, t)).length, je, saetze });
  }
  return aus;
}

/** Was trägt: die eigenen „Was hätte auch gepasst?"-Antworten nach Häufigkeit. */
export function wasTraegt(z, n = 3) {
  const zaehl = new Map();
  for (const e of z.ereignisse) {
    const t = String(e.antworten.statt || "").trim();
    if (!t) continue;
    const k = t.toLowerCase();
    const alt = zaehl.get(k);
    zaehl.set(k, { text: alt ? alt.text : t, n: (alt ? alt.n : 0) + 1 });
  }
  return [...zaehl.values()].sort((a, b) => b.n - a.n).slice(0, n);
}

/* ---- Richtung kur-core --------------------------------------------------- */

/**
 * Was später auf den Server darf: die Teilnahme. Einstellung `commitment`
 * als kurzer Text, und je Tag mit irgendeiner Notiz (oder frei genommen)
 * ein `dabei: true`.
 * Keine Einträge, keine Antworten, keine Zählungen. Von eigenen Trackern
 * nur der Schlüssel (`eigen`, `eigen-…`), nicht ihr Name: der kann so
 * persönlich sein wie eine Antwort.
 */
export function fuerKern(z, heute) {
  const tage = [...new Set([...z.ereignisse.map((e) => e.tag), ...z.freieTage])].sort();
  return {
    einstellungen: gewaehlt(z).length ? [{ schluessel: "commitment", wert: gewaehlt(z).join(","), ab: heute }] : [],
    eintraege: tage.map((date) => ({ date, habit: "dabei", value: true })),
  };
}
