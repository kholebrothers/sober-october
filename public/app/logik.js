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

/* Die eigene Definition: ein Verzicht, dessen Namen der Mensch selbst
   schreibt („Alkohol", „Zucker", „Social Media"). Der Name steht in
   `z.eigen.name`, getrennt vom Commitment, damit er beim Abwählen nicht
   verloren geht. Er bleibt auf dem Gerät, siehe fuerKern(). */
export const EIGEN = "eigen";
const EIGEN_LAENGE = 60;

/** Der Name, wie er in Sätzen steht: „kein Alkohol" wird „Alkohol". */
export function eigenerName(z) {
  return String(z.eigen?.name || "").trim().replace(/^kein(e|en|em|er|es)?\s+/i, "").trim();
}

/** Alle Verzichte dieses Zustands — die festen und, immer, der eigene. */
export function verzichte(z) {
  const name = eigenerName(z) || "Eigenes";
  return { ...VERZICHTE, [EIGEN]: { name, satz: name, habe: `${name} — ist geschehen`, drang: `würde gern: ${name}` } };
}

export const ANSICHTEN = {
  knopf: "Knopf — ein Verzicht auf einmal",
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

/* Zwei Arten, an eine Ebene zu kommen: *verdient* (sie öffnet sich durch
   Benutzen) oder *gewählt* (man schaltet sie selbst ein). Gewählte werden
   in der Ansicht „Faden" angeboten, sobald `angebot` erfüllt ist. */
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
  { id: "verlauf", art: "gewaehlt", titel: "Dein Oktober", rubrik: "Verlauf",
    bedingung: "einschalten, wenn du die Tage sehen willst",
    angebot: (z) => notizTage(z) >= 2 },
];

/* ---- Zustand ----------------------------------------------------------- */

export function neuerZustand() {
  return { v: VERSION, commitment: {}, eigen: { name: "" }, ansicht: "knopf", ereignisse: [], frei: {} };
}

/** Aus gespeichertem Text. Unlesbares oder Fremdes wird ein leerer Zustand,
    nie ein Absturz; eine unbekannte Version ebenso — die Daten bleiben dann
    im Speicher stehen, siehe speicher.js. */
export function aus(text) {
  let roh;
  try { roh = JSON.parse(text); } catch { return neuerZustand(); }
  if (!roh || typeof roh !== "object" || roh.v !== VERSION) return neuerZustand();
  const z = neuerZustand();
  if (roh.commitment && typeof roh.commitment === "object")
    for (const k of [...FEST, EIGEN])
      if (roh.commitment[k]) z.commitment[k] = { drang: !!roh.commitment[k].drang };
  if (roh.eigen && typeof roh.eigen.name === "string") z.eigen.name = roh.eigen.name.slice(0, EIGEN_LAENGE);
  if (ANSICHTEN[roh.ansicht]) z.ansicht = roh.ansicht;
  if (Array.isArray(roh.ereignisse))
    z.ereignisse = roh.ereignisse.filter((e) => e && (VERZICHTE[e.verzicht] || e.verzicht === EIGEN) && ["habe", "drang", "ohne"].includes(e.art))
      .map((e) => ({ ...e, antworten: e.antworten && typeof e.antworten === "object" ? e.antworten : {} }));
  if (roh.frei && typeof roh.frei === "object")
    for (const eb of EBENEN) if (roh.frei[eb.id]) z.frei[eb.id] = roh.frei[eb.id];
  return z;
}

/** Was gewählt ist. Die eigene Definition zählt erst, wenn sie einen Namen hat. */
export const gewaehlt = (z) => [...FEST, EIGEN].filter((k) => z.commitment[k] && (k !== EIGEN || eigenerName(z)));

/** Setzt den Namen der eigenen Definition, gekürzt auf eine Zeile. */
export function setzeEigen(z, name) {
  z.eigen.name = String(name).replace(/\s+/g, " ").slice(0, EIGEN_LAENGE);
}

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
    if (eb.art === "verdient" && !z.frei[eb.id] && eb.erfuellt(z)) {
      z.frei[eb.id] = { tag, zeit, gesehen: false };
      neu.push(eb);
    }
  return neu;
}

/** "zu" | "frei" (verdient, offen) | "an" (gewählt, eingeschaltet) | "aus" */
export function stand(z, id) {
  const eb = EBENEN.find((x) => x.id === id);
  if (eb.art === "gewaehlt") return z.frei[id] ? "an" : "aus";
  return z.frei[id] ? "frei" : "zu";
}

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

export const dabei = (z, tag) => z.ereignisse.some((e) => e.tag === tag);

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
    tage.push({ tag, heute: tag === heute, stand: i >= weit ? "kommt" : dabei(z, tag) ? "dabei" : "leer" });
  }
  return { weit, fenster, tage, dabeiTage: tage.filter((t) => t.stand === "dabei").length };
}

/** Der längste Lauf (ohne Lücke), so weit die Notizen zurückreichen. */
export function besterLauf(z, heute) {
  const tage = [...new Set(z.ereignisse.map((e) => e.tag))].filter((t) => t <= heute).sort();
  let best = 0, run = 0, vor = null;
  for (const t of tage) {
    run = vor && verschiebe(vor, 1) === t ? run + 1 : 1;
    best = Math.max(best, run);
    vor = t;
  }
  return best;
}

/* Die große Heatmap: eine Spalte je Woche (Montag oben), 13 Wochen, die den
   Oktober ganz enthalten — vorher und mittendrin endet sie mit dem
   31. Oktober, danach mit heute. Tage nach heute stehen leer. */
export const HEAT_WOCHEN = 13;

/** Wie voll ein Tag war: Anteil der gewählten Verzichte mit einer Notiz. */
export function tagesAnteil(z, tag) {
  const gew = gewaehlt(z);
  const da = new Set(vonTag(z, tag).map((e) => e.verzicht));
  if (!da.size) return 0;
  return Math.min(1, da.size / Math.max(1, gew.length));
}

/** Wochen als Listen von Tagen (Mo–So), dazu der Tag, an dem sie endet. */
export function heatWochen(heute) {
  const { start } = oktober(heute);
  const ende = [verschiebe(start, 30), heute].sort().at(-1);
  const e = alsDatum(ende);
  const letzterMontag = verschiebe(ende, -((e.getDay() + 6) % 7));
  const erster = verschiebe(letzterMontag, -7 * (HEAT_WOCHEN - 1));
  const wochen = [];
  for (let w = 0; w < HEAT_WOCHEN; w++) {
    const woche = [];
    for (let i = 0; i < 7; i++) woche.push(verschiebe(erster, w * 7 + i));
    wochen.push(woche);
  }
  return wochen;
}

/* ---- Richtung kur-core --------------------------------------------------- */

/**
 * Was später auf den Server darf: die Teilnahme. Einstellung `commitment`
 * als kurzer Text, und je Tag mit irgendeiner Notiz ein `dabei: true`.
 * Keine Einträge, keine Antworten, keine Zählungen. Von der eigenen
 * Definition nur der Schlüssel `eigen`, nicht ihr Name: der kann so
 * persönlich sein wie eine Antwort.
 */
export function fuerKern(z, heute) {
  const tage = [...new Set(z.ereignisse.map((e) => e.tag))].sort();
  return {
    einstellungen: gewaehlt(z).length ? [{ schluessel: "commitment", wert: gewaehlt(z).join(","), ab: heute }] : [],
    eintraege: tage.map((date) => ({ date, habit: "dabei", value: true })),
  };
}
