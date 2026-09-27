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
    alle[e.id] = e.art === "aufbauen"
      ? { name, satz: name, habe: `${name} — getan`, drang: "", eigen: true, aufbau: true, schritte: e.schritte || [], farbe: "var(--moss)" }
      : { name, satz: name, habe: `${name} — ist geschehen`, drang: `würde gern: ${name}`, eigen: true, farbe: EIGEN_FARBEN[i % EIGEN_FARBEN.length] };
  });
  return alle;
}

/** Ein eigener Tracker mehr. Gibt seine id zurück, oder null ohne Namen. Er
    ist gleich gewählt; einen gleichnamigen gibt es nicht zweimal. */
export function fuegeEigenenHinzu(z, name, { art = "lassen", schritte } = {}) {
  const n = art === "aufbauen" ? String(name || "").replace(/\s+/g, " ").trim().slice(0, EIGEN_LAENGE) : saubererName(name);
  if (!n) return null;
  const da = z.eigene.find((e) => saubererName(e.name).toLowerCase() === n.toLowerCase());
  const id = da ? da.id : z.eigene.some((e) => e.id === EIGEN) ? `eigen-${neueId().slice(0, 8)}` : EIGEN;
  if (!da) {
    const e = { id, name: n };
    if (art === "aufbauen") { e.art = "aufbauen"; e.schritte = sauberSchritte(schritte); }
    z.eigene.push(e);
  }
  z.commitment[id] ||= { drang: art !== "aufbauen" };
  return id;
}

/* ---- Aufbauen -------------------------------------------------------------

   Nicht jede:r lässt etwas sein. Wer im Oktober etwas aufbaut — eine
   Morgenroutine, Bewegung, früher schlafen —, nimmt einen Tracker zum
   Aufbauen. Ein Tippen heißt „getan"; es zählt den Tag wie jede Notiz und
   ist nie „Geschehen" (Orange), sondern grün. Ab Schicht 2 kann ein solcher
   Tracker Schritte haben: eine Routine als Folge kleiner Handgriffe. */
export const AUFBAU_VORSCHLAEGE = [
  { name: "Morgenroutine", schritte: ["Ein Glas Wasser", "Fenster auf, drei tiefe Atemzüge", "Fünf Minuten bewegen", "Den Tag in einem Satz"] },
  { name: "Bewegung" },
  { name: "Früh ins Bett" },
  { name: "Draußen sein" },
];
const SCHRITTE_MAX = 8;
export const sauberSchritte = (l) =>
  (Array.isArray(l) ? l : []).map((x) => String(x || "").replace(/\s+/g, " ").trim().slice(0, 60)).filter(Boolean).slice(0, SCHRITTE_MAX);

export function setzeSchritte(z, id, schritte) {
  const e = z.eigene.find((x) => x.id === id && x.art === "aufbauen");
  if (!e) return false;
  e.schritte = sauberSchritte(schritte);
  return true;
}

/** Welche Schritte einer Routine an einem Tag getan sind: Set der Indizes. */
export const schritteGetan = (z, tag, id) =>
  new Set(z.ereignisse.filter((e) => e.tag === tag && e.verzicht === id && e.art === "getan" && Number.isInteger(e.schritt)).map((e) => e.schritt));

/** Einen Schritt an- oder abhaken. */
export function schalteSchritt(z, tag, zeit, id, i) {
  const da = z.ereignisse.findIndex((e) => e.tag === tag && e.verzicht === id && e.art === "getan" && e.schritt === i);
  if (da >= 0) { z.ereignisse.splice(da, 1); return false; }
  z.ereignisse.push({ id: neueId(), tag, zeit, verzicht: id, art: "getan", schritt: i, antworten: {} });
  return true;
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

/** Die hellen Farbwelten, alle auf Flexoki-Grund. `papier` und `flaeche`
    sind die Töne für die Vorschau in den Einstellungen und die Browserleiste. */
export const FARBWELTEN = {
  papier: { name: "Papier", papier: "#F2F0E5", flaeche: "#FFFCF0" },
  salbei: { name: "Salbei", papier: "#E9ECDD", flaeche: "#F8FAF0" },
  flieder: { name: "Flieder", papier: "#EBE9F1", flaeche: "#FAF9FD" },
};

export const ANSICHTEN = {
  knopf: "Knopf — der Monat und je Tracker eine Kachel",
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
/* Drei Schichten, drei Tiefen. Man wählt beim Start, wie tief man gehen
   will, und kann es jederzeit ändern; jede Schicht nimmt die vorigen mit.
   Ein Baustein gehört zu einer Schicht und erscheint erst ab ihr. */
export const TIEFEN = [
  { n: 1, name: "Beobachten", text: "Einfach festhalten: jeden Tag ein Check-in, was du lässt oder aufbaust, ein Satz zum Tag." },
  { n: 2, name: "Formen", text: "Verhalten verändern: Routinen in kleinen Schritten, Wenn-dann-Pläne, schnelle Werkzeuge für den Drang-Moment." },
  { n: 3, name: "Nervensystem", text: "Tiefer schauen: Körper und Antrieb täglich einschätzen, Zusammenhänge über den Monat, der Gremlin." },
];

export const BAUSTEINE = [
  { id: "leitgedanke", schicht: 1, gruppe: "Oben", titel: "Leitgedanke", standard: true,
    text: "Ein eigener Satz, der dich begleitet." },
  { id: "lauf", schicht: 1, gruppe: "Oben", titel: "Lauf", standard: false,
    text: "Unter der Etappe: wie viele Tage am Stück, dein längster Lauf und ein Satz zum Tag." },
  { id: "gemeinsam", schicht: 1, gruppe: "Oben", titel: "Gemeinsam", standard: true,
    text: "Mit anderen durch den Oktober: wer heute dabei ist, und jede Reise als Farbe. Geteilt wird nur dein Name, was du sein lässt, und an welchen Tagen du dabei warst." },
  { id: "lebenszeit", schicht: 1, gruppe: "Oben", titel: "Lebenszeit", standard: true,
    text: "Wie viel Zeit Kaffee, Kippe, Video vorher gekostet haben — und wie viel jetzt frei wird: für Routinen, oder einfach zweckfrei." },
  { id: "tagebuch", schicht: 1, gruppe: "Unten", titel: "Dein Tagebuch", standard: true,
    text: "Jeder Tag eine Zeile: dein Satz, die Stimmung, was sich gezeigt hat. Fehlt ein Tag, lässt er sich nachtragen." },
  { id: "verlauf", schicht: 3, gruppe: "Unten", titel: "Verlauf und Zusammenhänge", standard: true,
    text: "Körper und Antrieb über den Monat, neben Drang und Geschehen — und in Sätzen, was zusammenfällt." },
  { id: "heatmap", schicht: 1, gruppe: "Unten", titel: "Heatmap", standard: false,
    text: "Dein Oktober als Kästchen, eine Spalte je Woche." },
  { id: "ebenen", schicht: 3, gruppe: "Unten", titel: "Wissen und Rückblick", standard: false,
    text: "Ebenen, die sich durch Benutzen öffnen: wie ein Drang verläuft, Routinen, Neues an die Stelle, der Rückblick in Wochen." },
  { id: "werkzeuge", schicht: 2, gruppe: "Unten", titel: "Werkzeuge", standard: true,
    text: "Anker, Swish, Reframing und Wenn-dann-Pläne — kurz, für den Moment, in dem der Drang kommt." },
  { id: "gremlin", schicht: 3, gruppe: "Unten", titel: "Gremlin", standard: true,
    text: "Der Begleiter am Rand, nach dem Possibility Management: der Teil, der von Drama lebt. Er sagt laut, was er will — und bekommt eine Aufgabe." },
  { id: "abends", schicht: 1, gruppe: "Darstellung", titel: "Abends ruhiger", standard: true,
    text: "Nach Sonnenuntergang wird die Seite eine Spur ruhiger." },
];

export function aktiv(z, id) {
  const b = BAUSTEINE.find((x) => x.id === id);
  if (!b || b.schicht > z.tiefe) return false;
  if (id in z.bausteine) return z.bausteine[id];
  return !!b.standard;
}

/** Ab welcher Tiefe etwas da ist, das kein Baustein ist. */
export const ab = (z, n) => z.tiefe >= n;

export function schalteBaustein(z, id, an = !aktiv(z, id)) {
  if (!BAUSTEINE.some((b) => b.id === id)) return;
  z.bausteine[id] = !!an;
}

/* ---- Zustand ----------------------------------------------------------- */

export function neuerZustand() {
  return { v: VERSION, commitment: {}, eigene: [], ansicht: "knopf", farbe: "papier", ereignisse: [], frei: {}, freieTage: [], daTage: [], leitgedanken: [], bausteine: {}, gemeinsam: null, tagebuch: {}, tiefe: 1,
    werkzeug: { anker: null, swish: null, plaene: [] }, zeitVorher: {} };
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
        z.eigene.push(e.art === "aufbauen"
          ? { id: e.id, name: String(e.name).slice(0, EIGEN_LAENGE), art: "aufbauen", schritte: sauberSchritte(e.schritte) }
          : { id: e.id, name: String(e.name).slice(0, EIGEN_LAENGE) });
  // Die eine eigene Definition von vorher wird der erste eigene Tracker.
  if (roh.eigen && saubererName(roh.eigen.name) && !z.eigene.some((x) => x.id === EIGEN))
    z.eigene.unshift({ id: EIGEN, name: String(roh.eigen.name).slice(0, EIGEN_LAENGE) });
  const ids = [...FEST, ...z.eigene.map((e) => e.id)];
  if (roh.commitment && typeof roh.commitment === "object")
    for (const k of ids)
      if (roh.commitment[k]) z.commitment[k] = { drang: !!roh.commitment[k].drang };
  if (ANSICHTEN[roh.ansicht]) z.ansicht = roh.ansicht;
  z.werkzeug = werkzeugAus(roh.werkzeug);
  if (roh.zeitVorher && typeof roh.zeitVorher === "object")
    for (const k of ids) if (minuten(roh.zeitVorher[k]) !== null) z.zeitVorher[k] = roh.zeitVorher[k];
  // Ein Stand von vor den Schichten hatte alles: er bleibt auf der tiefsten.
  z.tiefe = [1, 2, 3].includes(roh.tiefe) ? roh.tiefe : 3;
  // Wer in der Gruppe mitgeht: nur die id des Servers und der Name.
  if (roh.gemeinsam && /^p[a-z0-9]{1,16}$/.test(roh.gemeinsam.id) && typeof roh.gemeinsam.name === "string")
    z.gemeinsam = { id: roh.gemeinsam.id, name: roh.gemeinsam.name.slice(0, 24) };
  if (FARBWELTEN[roh.farbe]) z.farbe = roh.farbe;
  if (Array.isArray(roh.ereignisse))
    z.ereignisse = roh.ereignisse.filter((e) => e && ids.includes(e.verzicht) && ["habe", "drang", "ohne", "getan"].includes(e.art))
      .map((e) => ({ ...e, antworten: e.antworten && typeof e.antworten === "object" ? e.antworten : {} }));
  if (roh.frei && typeof roh.frei === "object")
    for (const eb of EBENEN) if (roh.frei[eb.id]) z.frei[eb.id] = roh.frei[eb.id];
  const tagListe = (l) => (Array.isArray(l) ? [...new Set(l.filter((t) => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)))].sort() : []);
  z.freieTage = tagListe(roh.freieTage);
  z.daTage = tagListe(roh.daTage);

  if (roh.tagebuch && typeof roh.tagebuch === "object")
    for (const [tag, e] of Object.entries(roh.tagebuch)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tag) || !e || typeof e !== "object") continue;
      const t = {};
      for (const x of SYSTEME) if (Number.isInteger(e[x.id]) && e[x.id] >= 1 && e[x.id] <= STUFEN) t[x.id] = e[x.id];
      if (Array.isArray(e.selbst)) {
        const s = [...new Set(e.selbst.filter((i) => Number.isInteger(i) && i >= 0 && i < SELBST.length))].slice(0, SELBST_MAX);
        if (s.length) t.selbst = s;
      }
      if (typeof e.getragen === "string" && e.getragen.trim()) t.getragen = e.getragen.trim().slice(0, 280);
      if (e.zeit && typeof e.zeit === "object") {
        const zt = {};
        for (const [k, m] of Object.entries(e.zeit)) if (ids.includes(k) && minuten(m) !== null) zt[k] = m;
        if (Object.keys(zt).length) t.zeit = zt;
      }
      if (Array.isArray(e.fuer)) { const f = [...new Set(e.fuer.filter((x) => ZEIT_FUER.some((y) => y.id === x)))]; if (f.length) t.fuer = f; }
      if (Object.keys(t).length) z.tagebuch[tag] = t;
    }

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
  const reihe = (n) => (n.length > 1 ? n.slice(0, -1).join(", ") + " und " + n.at(-1) : n[0]);
  const lassen = gewaehlt(z).filter((k) => !V[k].aufbau).map((k) => V[k].satz);
  const bauen = gewaehlt(z).filter((k) => V[k].aufbau).map((k) => V[k].satz);
  if (lassen.length && bauen.length) return `Im Oktober lasse ich ${reihe(lassen)} sein und baue ${reihe(bauen)} auf.`;
  if (bauen.length) return `Im Oktober baue ich ${reihe(bauen)} auf.`;
  if (lassen.length) return `Im Oktober lasse ich ${reihe(lassen)} sein.`;
  return "";
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

/** Details nachtragen: erst schnell notieren, die Fragen später, wenn man
    will. Gibt wie notiere() die Ebenen zurück, die sich dadurch öffnen. */
export function ergaenze(z, id, { antworten = {}, begleitetSek } = {}) {
  const e = z.ereignisse.find((x) => x.id === id);
  if (!e) return [];
  e.antworten = { ...e.antworten, ...antworten };
  if (begleitetSek) e.begleitetSek = (e.begleitetSek || 0) + begleitetSek;
  return freischalten(z, e.tag, e.zeit);
}

/** Vertippt: ein Eintrag geht wieder weg. */
export function entferne(z, id) {
  const vorher = z.ereignisse.length;
  z.ereignisse = z.ereignisse.filter((e) => e.id !== id);
  return z.ereignisse.length < vorher;
}

/** „heute ohne" an- oder ausschalten. Die Oberfläche bietet es nicht mehr an
    — kein Eintrag heißt ohnehin „ohne" —, alte Einträge bleiben lesbar. */
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

/* Frei ist, was nichts geloggt hat: dafür gibt es keinen Knopf mehr, ein
   leerer Tag ist ein freier Tag. `freieTage` stammt aus einem früheren
   Stand, in dem man ihn eigens nahm; solche Tage zählen weiter als dabei. */
export const istFrei = (z, tag) => z.freieTage.includes(tag);

export function schalteFrei(z, tag) {
  if (istFrei(z, tag)) z.freieTage = z.freieTage.filter((t) => t !== tag);
  else z.freieTage = [...z.freieTage, tag].sort();
}

/* „Ich bin da" — aus lifetracker (NICHTS, Stufe 0): der kleinste
   vollständige Eintrag des Tages. Ein Tippen auf die Zahl oben, und der
   Tag zählt; jede andere Notiz zählt ihn genauso. */
export const istDa = (z, tag) => z.daTage.includes(tag);

export function schalteDa(z, tag) {
  if (istDa(z, tag)) z.daTage = z.daTage.filter((t) => t !== tag);
  else z.daTage = [...z.daTage, tag].sort();
}

/** Etwas steht an dem Tag: eine Notiz oder „ich bin da" — nicht „frei". */
export const hatEintrag = (z, tag) => istDa(z, tag) || z.ereignisse.some((e) => e.tag === tag) || !!z.tagebuch[tag];

/** Alle Tage mit irgendeinem Eintrag (oder frei genommen), sortiert. */
const eintragsTage = (z) =>
  [...new Set([...z.ereignisse.map((e) => e.tag), ...z.freieTage, ...z.daTage, ...Object.keys(z.tagebuch)])].sort();

export const dabei = (z, tag) => istFrei(z, tag) || hatEintrag(z, tag);

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
    const st = i >= weit ? "kommt" : istFrei(z, tag) && !hatEintrag(z, tag) ? "frei" : dabei(z, tag) ? "dabei" : "leer";
    tage.push({ tag, heute: tag === heute, stand: st });
  }
  return { weit, fenster, tage, dabeiTage: tage.filter((t) => t.stand === "dabei" || t.stand === "frei").length };
}

/** Der längste Lauf (ohne Lücke), so weit die Notizen zurückreichen. */
export function besterLauf(z, heute) {
  const tage = eintragsTage(z).filter((t) => t <= heute);
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

/** Wie voll ein Tag war: Anteil der gewählten Verzichte mit einer Notiz.
    Nur „ich bin da" ist der hellste Ton: dabei, ohne Einzelheiten. */
export function tagesAnteil(z, tag) {
  const gew = gewaehlt(z);
  const da = new Set(vonTag(z, tag).map((e) => e.verzicht));
  if (!da.size) return istDa(z, tag) ? 0.2 : 0;
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

/* ---- Der Monat -------------------------------------------------------------

   Das Herz der Seite: der Oktober als Kalender, Montag vorn. Ein Tag ist
   „dabei", sobald etwas drin steht — ein Tippen auf „Heute bin ich dabei"
   oder irgendeine Notiz. Ein vergangener Tag ohne Eintrag ist „leer": nichts
   bekannt, kein Urteil. Kurz vor dem Oktober (höchstens zwei Wochen) stehen
   die Tage davor als Vorlauf mit darin; sonst füllen leere Ränder die erste
   Woche auf. */
export const VORLAUF_TAGE = 14;

/** {phase, tag, noch, dabei, vorlauf, zellen: [{tag, nr, art: "okt"|"vorlauf"|"rand", stand, heute}]} */
export function monat(z, heute) {
  const o = oktober(heute);
  const ende = verschiebe(o.start, 30);
  const montag = (t) => verschiebe(t, -((alsDatum(t).getDay() + 6) % 7));
  const mitVorlauf = o.phase === "vor" && o.noch <= VORLAUF_TAGE;
  const von = montag(mitVorlauf ? heute : o.start);
  const zellen = [];
  for (let t = von; t <= ende; t = verschiebe(t, 1)) {
    const art = t >= o.start ? "okt" : mitVorlauf ? "vorlauf" : "rand";
    const stand = art === "rand" ? "rand" : t > heute ? "kommt" : dabei(z, t) ? "dabei" : t === heute ? "offen" : "leer";
    zellen.push({ tag: t, nr: alsDatum(t).getDate(), art, stand, heute: t === heute });
  }
  const zaehle = (art) => zellen.filter((c) => c.art === art && c.stand === "dabei").length;
  return { phase: o.phase, tag: o.tag, noch: o.noch, dabei: zaehle("okt"), vorlauf: zaehle("vorlauf"), zellen };
}

/* ---- Das Tagebuch: Ebenen eines Tages --------------------------------------

   Ein Tag hat mehr als „dabei oder nicht". Im Tages-Check-in schätzt man die
   Systeme darunter ein (Körper und Antrieb, siehe SYSTEME); aus lifetracker
   kommen die Selbst-Markierungen (höchstens zwei) und der Satz „Was hat
   dich heute getragen?".
   Das alles bleibt auf dem Gerät (fuerKern() gibt nur den Tag weiter), und
   jedes davon zählt den Tag wie eine Notiz.

   Jede Ebene hat eine Flexoki-Farbe; der Monat lässt sich durch jede davon
   lesen. Farbe beschreibt also, *was* festgehalten ist — nicht wer, und
   nicht, ob es gut war. Rot gibt es weiterhin nicht. (Im Code heißen sie
   SCHICHTEN, weil EBENEN schon die Wissensebenen sind.) */
/* Die Systeme unter den Symptomen. Kaffee, Kippe und Video sind Oberfläche —
   Symptom oder Lösungsversuch. Darunter laufen Systeme weiter, die man
   täglich kurz einschätzen kann, jedes auf fünf Stufen zwischen zwei Polen.
   Zwei Gruppen: der Körper und der Antrieb. Keine Diagnose, eine
   Selbstauskunft; über Tage wird daraus ein Bild. */
export const STUFEN = 5;
export const SYSTEME = [
  { id: "schlaf", name: "Schlaf", gruppe: "koerper", pole: ["unruhig", "erholsam"] },
  { id: "verdauung", name: "Verdauung", gruppe: "koerper", pole: ["gestört", "ruhig"] },
  { id: "bewegung", name: "Bewegung", gruppe: "koerper", pole: ["kaum", "viel"] },
  { id: "ernaehrung", name: "Ernährung", gruppe: "koerper", pole: ["unstet", "nährend"] },
  { id: "stimmung", name: "Stimmung", gruppe: "antrieb", pole: ["schwer", "leicht"] },
  { id: "antrieb", name: "Antrieb", gruppe: "antrieb", pole: ["wenig", "viel"] },
  { id: "motivation", name: "Motivation", gruppe: "antrieb", pole: ["wenig", "viel"] },
  { id: "lust", name: "Lust", gruppe: "antrieb", pole: ["wenig", "viel"] },
];
export const GRUPPEN = { koerper: { name: "Körper", farbe: "var(--blau)" }, antrieb: { name: "Antrieb", farbe: "var(--gelb)" } };
/** Die Stimmung in Worten, von 1 bis 5 (aus der ersten Fassung). */
export const STIMMUNG = ["schwer", "eher schwer", "mittel", "eher leicht", "leicht"];
export const SELBST = ["Selbstvertrauen", "Selbstwirksamkeit", "Selbstwertgefühl", "Selbstwahrnehmung",
  "Selbstregulation", "Selbstberuhigung", "Selbstfürsorge", "Selbstakzeptanz", "Selbstmitgefühl",
  "Selbstbehauptung", "Selbstbestimmung"];
export const SELBST_MAX = 2;

/** Der Mittelwert einer Gruppe an einem Tag, 0 (nichts angegeben) bis 1. */
export function gruppenWert(z, tag, gruppe) {
  const e = z.tagebuch[tag] || {};
  const w = SYSTEME.filter((x) => x.gruppe === gruppe && e[x.id]).map((x) => e[x.id] / STUFEN);
  return w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0;
}

const drangAm = (z, t) => vonTag(z, t).filter((e) => e.art === "drang").length;
const habeAm = (z, t) => vonTag(z, t).filter((e) => e.art === "habe").length;

/* wert(z, tag) → 0 (nichts) bis 1 (voll). Körper und Antrieb sind der
   Mittelwert ihrer Systeme: blass heißt „am unteren Pol", voll „am oberen" —
   eine Stufe, keine Note. */
export const SCHICHTEN = [
  { id: "dabei", name: "Dabei", farbe: "var(--moss)", text: "Tage, an denen du da warst.",
    wert: (z, t) => (dabei(z, t) ? 1 : 0) },
  { id: "koerper", name: "Körper", farbe: GRUPPEN.koerper.farbe, text: "Schlaf, Verdauung, Bewegung, Ernährung im Mittel. Blass: eher unruhig, voll: eher erholt.",
    wert: (z, t) => gruppenWert(z, t, "koerper") },
  { id: "antrieb", name: "Antrieb", farbe: GRUPPEN.antrieb.farbe, text: "Stimmung, Antrieb, Motivation, Lust im Mittel. Blass: eher wenig, voll: eher viel.",
    wert: (z, t) => gruppenWert(z, t, "antrieb") },
  { id: "selbst", name: "Selbst", farbe: "var(--lila)", text: "Tage, die du einem Selbst zugeordnet hast — voll bei zweien.",
    wert: (z, t) => (z.tagebuch[t]?.selbst?.length || 0) / SELBST_MAX },
  { id: "drang", name: "Drang", farbe: "var(--teal)", text: "Würde-gern-Momente, die du notiert hast. Voller: mehr davon.",
    wert: (z, t) => Math.min(1, drangAm(z, t) / 3) },
  { id: "geschehen", name: "Geschehen", farbe: "var(--clay)", text: "Was geschehen ist, notiert. Ein Ereignis, kein Urteil.",
    wert: (z, t) => Math.min(1, habeAm(z, t) / 3) },
];

/** Einen Teil des Tagebuchs setzen; leer (oder 0) heißt weg.
    werte: {schlaf: 1–5, …}; stimmung geht auch direkt (erste Fassung). */
export function schreibeTag(z, tag, { werte = {}, stimmung, selbst, getragen, zeit, fuer } = {}) {
  const t = { ...(z.tagebuch[tag] || {}) };
  const alle = stimmung !== undefined ? { ...werte, stimmung } : werte;
  for (const [id, n] of Object.entries(alle)) {
    if (!SYSTEME.some((x) => x.id === id)) continue;
    if (Number.isInteger(n) && n >= 1 && n <= STUFEN) t[id] = n; else delete t[id];
  }
  if (selbst !== undefined) {
    const s = [...new Set(selbst)].filter((i) => i >= 0 && i < SELBST.length).slice(0, SELBST_MAX);
    if (s.length) t.selbst = s; else delete t.selbst;
  }
  if (getragen !== undefined) {
    const g = String(getragen || "").replace(/\s+/g, " ").trim().slice(0, 280);
    if (g) t.getragen = g; else delete t.getragen;
  }
  if (zeit !== undefined) {
    const zt = { ...(t.zeit || {}) };
    for (const [k, m] of Object.entries(zeit)) { if (minuten(m) !== null) zt[k] = m; else delete zt[k]; }
    if (Object.keys(zt).length) t.zeit = zt; else delete t.zeit;
  }
  if (fuer !== undefined) {
    const f = [...new Set(fuer)].filter((x) => ZEIT_FUER.some((y) => y.id === x));
    if (f.length) t.fuer = f; else delete t.fuer;
  }
  if (Object.keys(t).length) z.tagebuch[tag] = t; else delete z.tagebuch[tag];
}

/** Wie viele Systeme an einem Tag eingeschätzt sind. */
export const eingeschaetzt = (z, tag) => SYSTEME.filter((x) => z.tagebuch[tag]?.[x.id]).length;

/* ---- Lebenszeit ---------------------------------------------------------------

   Was Kaffee, Kippe, Video an Zeit gekostet haben — und was davon jetzt frei
   ist. Einmal je Tracker: wie viel am Tag vorher (zeitVorher, Minuten).
   Dann je Tag, wenn man will: wie viel heute (tagebuch.zeit). Frei geworden
   ist die Differenz, nie weniger als null. Gezählt werden nur Tage, an
   denen etwas angegeben ist — ein leerer Tag ist nichts bekannt, nicht
   „alles gespart". Und wofür die freie Zeit ging: Routinen, oder einfach
   zweckfrei. */
export const ZEIT_STUFEN = [0, 15, 30, 60, 90, 120, 180, 240];
export const ZEIT_FUER = [
  { id: "routine", name: "Routinen" }, { id: "zweckfrei", name: "zweckfrei" }, { id: "menschen", name: "Menschen" },
  { id: "draussen", name: "draußen" }, { id: "ruhe", name: "Ruhe" },
];
function minuten(m) { return Number.isInteger(m) && m >= 0 && m <= 720 ? m : null; }

export function setzeZeitVorher(z, id, m) {
  if (minuten(m) === null) delete z.zeitVorher[id]; else z.zeitVorher[id] = m;
}

/** Was an einem Tag frei geworden ist, in Minuten — oder null, wenn nichts angegeben ist. */
export function freiAm(z, tag) {
  const zt = z.tagebuch[tag]?.zeit;
  if (!zt) return null;
  let frei = 0, bekannt = false;
  for (const [id, heute] of Object.entries(zt)) {
    if (!(id in z.zeitVorher)) continue;
    bekannt = true;
    frei += Math.max(0, z.zeitVorher[id] - heute);
  }
  return bekannt ? frei : null;
}

/** Über Tage: {tage, frei, fuer: {id: Tage}} */
export function lebenszeit(z, tage) {
  let frei = 0, n = 0;
  const fuer = {};
  for (const t of tage) {
    const f = freiAm(z, t);
    if (f === null) continue;
    n++;
    frei += f;
    for (const x of z.tagebuch[t]?.fuer || []) fuer[x] = (fuer[x] || 0) + 1;
  }
  return { tage: n, frei, fuer };
}

/** „1 Std. 20 Min." */
export function dauer(m) {
  if (!m) return "0 Min.";
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h} Std. ${r} Min.` : `${h} Std.`) : `${r} Min.`;
}

/* ---- Zusammenhänge ---------------------------------------------------------

   Über Tage, nicht an einem: Wie sah es mit Drang und Geschehen aus an Tagen,
   an denen ein System eher am unteren Pol stand (1–2), und an Tagen, an denen
   es eher am oberen stand (4–5)? Gezeigt wird nur, was auf beiden Seiten
   mindestens drei Tage hat und sich um mindestens einen halben Moment
   unterscheidet. Ein Hinweis, kein Beweis; die App deutet nicht. */
export const MIN_TAGE = 3;

export function zusammenhaenge(z, tage, n = 3) {
  const out = [];
  for (const x of SYSTEME) {
    const mit = tage.filter((t) => z.tagebuch[t]?.[x.id]);
    const unten = mit.filter((t) => z.tagebuch[t][x.id] <= 2), oben = mit.filter((t) => z.tagebuch[t][x.id] >= 4);
    if (unten.length < MIN_TAGE || oben.length < MIN_TAGE) continue;
    for (const [ziel, zaehl] of [["drang", drangAm], ["geschehen", habeAm]]) {
      const schnitt = (l) => l.reduce((a, t) => a + zaehl(z, t), 0) / l.length;
      const a = schnitt(unten), b = schnitt(oben);
      if (Math.abs(a - b) >= 0.5) out.push({ system: x, ziel, unten: { tage: unten.length, schnitt: a }, oben: { tage: oben.length, schnitt: b } });
    }
  }
  return out.sort((p, q) => Math.abs(q.unten.schnitt - q.oben.schnitt) - Math.abs(p.unten.schnitt - p.oben.schnitt)).slice(0, n);
}

/** Der Verlauf über Tage: je System eine Reihe (0 = nichts, sonst Stufe/5),
    dazu Drang und Geschehen — untereinander, damit man sieht, was
    zusammenfällt. */
export function verlauf(z, tage) {
  const reihe = (f) => tage.map(f);
  return [
    ...SYSTEME.map((x) => ({ id: x.id, name: x.name, farbe: GRUPPEN[x.gruppe].farbe, gruppe: x.gruppe,
      werte: reihe((t) => (z.tagebuch[t]?.[x.id] || 0) / STUFEN) })),
    { id: "drang", name: "Drang", farbe: "var(--teal)", werte: reihe((t) => Math.min(1, drangAm(z, t) / 3)) },
    { id: "geschehen", name: "Geschehen", farbe: "var(--clay)", werte: reihe((t) => Math.min(1, habeAm(z, t) / 3)) },
  ];
}

/* ---- Das Tagebuch in Zeilen --------------------------------------------------

   Aus lifetracker („Deine Sätze"): eine Antwort allein ist eine Notiz,
   dreißig sind ein Verlauf. Jeder Tag eine Zeile, neu nach alt, von heute
   bis zum Anfang — dem 1. Oktober, oder früher, wenn schon vorher etwas
   steht (höchstens 45 Tage). Auch leere Tage stehen da: man sieht, wo einer
   fehlt, und kann ihn nachtragen. */
export function tagebuchZeilen(z, heute) {
  const { start } = oktober(heute);
  const erster = eintragsTage(z)[0];
  let von = [start, erster].filter(Boolean).sort()[0];
  if (von > heute) von = heute;
  if (tageZwischen(von, heute) > 44) von = verschiebe(heute, -44);
  const zeilen = [];
  for (let t = heute; t >= von; t = verschiebe(t, -1)) {
    const e = z.tagebuch[t] || {};
    const es = vonTag(z, t);
    zeilen.push({ tag: t, kopf: tagesKopf(t), heute: t === heute, dabei: dabei(z, t),
      stimmung: e.stimmung || 0, koerper: gruppenWert(z, t, "koerper"), antrieb: gruppenWert(z, t, "antrieb"),
      selbst: (e.selbst || []).map((i) => SELBST[i]), getragen: e.getragen || "",
      drang: es.filter((x) => x.art === "drang").length, habe: es.filter((x) => x.art === "habe").length });
  }
  return zeilen;
}

/* ---- Werkzeuge (Schicht 2) --------------------------------------------------

   Kurze Werkzeuge aus dem NLP für den Moment, in dem der Drang kommt, und
   die Wenn-dann-Pläne (aus lifetracker; eigentlich Psychologie, nicht NLP).
   Hier steht nur, was sich die App merkt; die Anleitungen stehen in
   werkzeuge.js. Alles bleibt auf dem Gerät.

     anker  {moment, geste}   der Zustand, der an eine Geste gebunden ist
     swish  {ausloeser, ziel} die beiden Bilder, in Worten
     plaene [{wenn, dann}]     höchstens zwölf */
const KURZTEXT = (t, n = 140) => String(t || "").replace(/\s+/g, " ").trim().slice(0, n);
export const PLAENE_MAX = 12;

function werkzeugAus(roh) {
  const w = { anker: null, swish: null, plaene: [] };
  if (!roh || typeof roh !== "object") return w;
  const txt = (x, n) => (typeof x === "string" ? KURZTEXT(x, n) : "");
  if (roh.anker && txt(roh.anker.moment)) w.anker = { moment: txt(roh.anker.moment), geste: txt(roh.anker.geste, 60) || "Daumen und Zeigefinger" };
  if (roh.swish && txt(roh.swish.ausloeser) && txt(roh.swish.ziel)) w.swish = { ausloeser: txt(roh.swish.ausloeser), ziel: txt(roh.swish.ziel) };
  if (Array.isArray(roh.plaene))
    w.plaene = roh.plaene.filter((p) => p && txt(p.wenn) && txt(p.dann)).slice(0, PLAENE_MAX)
      .map((p) => ({ wenn: txt(p.wenn), dann: txt(p.dann) }));
  return w;
}

export function setzeAnker(z, moment, geste) {
  z.werkzeug.anker = KURZTEXT(moment) ? { moment: KURZTEXT(moment), geste: KURZTEXT(geste, 60) || "Daumen und Zeigefinger" } : null;
}
export function setzeSwish(z, ausloeser, ziel) {
  z.werkzeug.swish = KURZTEXT(ausloeser) && KURZTEXT(ziel) ? { ausloeser: KURZTEXT(ausloeser), ziel: KURZTEXT(ziel) } : null;
}
/** Ein Wenn-dann-Plan mehr; gibt false zurück, wenn etwas fehlt oder die Liste voll ist. */
export function planHinzu(z, wenn, dann) {
  const p = { wenn: KURZTEXT(wenn).replace(/^wenn\s+/i, ""), dann: KURZTEXT(dann).replace(/^dann\s+/i, "") };
  if (!p.wenn || !p.dann || z.werkzeug.plaene.length >= PLAENE_MAX) return false;
  z.werkzeug.plaene.push(p);
  return true;
}
export function planWeg(z, i) { z.werkzeug.plaene.splice(i, 1); }

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
  if (istFrei(z, heute) && !hatEintrag(z, heute)) return "Heute ist frei — genommen, nicht vergessen.";
  const n = vonTag(z, heute).length;
  if (!n && istDa(z, heute)) return "Der Tag zählt. Du bist da.";
  if (n) return `Der Tag zählt. ${n === 1 ? "Eine Notiz" : n + " Notizen"}\u00a0— alles weitere ist Zugabe.`;
  const st = serie(z, heute);
  if (st >= 1 && !dabei(z, verschiebe(heute, -1))) return "Gestern war frei. Heute reicht wieder eine Notiz.";
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
  const tage = eintragsTage(z);
  return {
    einstellungen: gewaehlt(z).length ? [{ schluessel: "commitment", wert: gewaehlt(z).join(","), ab: heute }] : [],
    eintraege: tage.map((date) => ({ date, habit: "dabei", value: true })),
  };
}
