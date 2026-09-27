/* =====================================================================
   Die App — ein Zustand, ein render(), ein Bogen

   Hervorgegangen aus dem Prototyp auf dem Branch
   `prototyp-zurueckhaltend` (NOTIZ.md dort). Übernommen ist, was der
   Nutzer bestätigt hat: alle drei Ansichten, Knopf als Standard, der
   Drang ohne Zwischenschritt, die vier Grundgefühle.
   ===================================================================== */

import { heute as heuteTag, verschiebe } from "../kern/datum.js";
import {
  FRAGEN, EBENEN, ANSICHTEN, FARBWELTEN, BAUSTEINE, aktiv, schalteBaustein, FEST, verzichte, gewaehlt, commitmentSatz, vonTag,
  notiere, schalteAlles, fuegeEigenenHinzu, benenneEigenen, entferneEigenen, hatNotizen, stand, tagesZeile, serie, lauf,
  leitgedankeAm, setzeLeitgedanke, begleitetSeit, LEITGEDANKE, tagessatz, istFrei, schalteFrei, moment,
  istDa, schalteDa, hatEintrag, ergaenze, entferne,
  tagesKopf, monat, besterLauf, SCHICHTEN, STIMMUNG, SELBST, SELBST_MAX, schreibeTag, tagebuchZeilen,
  SYSTEME, GRUPPEN, STUFEN, eingeschaetzt, verlauf, zusammenhaenge,
  TIEFEN, AUFBAU_VORSCHLAEGE, schalteSchritt, schritteGetan, setzeSchritte, ab,
  setzeAnker, setzeSwish, planHinzu, planWeg,
  ZEIT_STUFEN, ZEIT_FUER, setzeZeitVorher, freiAm, lebenszeit, dauer,
  DAEMON_PHASEN, daemonStand,
  REISE, offen, reiseWeiter, reiseStand, einrichten, stationVon, reiseBis,
  GREMLIN_STUFEN, GREMLIN_FUTTER_VORSCHLAEGE, WOCHENTAGE, gremlinStufe, setzeFuetterungstag, futterHinzu, futterWeg, fuettern, werkzeugBenutzt,
} from "./logik.js";
import { tageszeit } from "../kern/sonne.js";
import { laden, sichern, loeschen } from "./speicher.js";
import { ebenenInhalt } from "./ebenen.js";
import { holen, senden, erreichbar } from "./netz.js";
import { werkzeuge } from "./werkzeuge.js";
import { erzeugeGremlin } from "./gremlin/index.js";
import { abgleich, gruppe, binDabei, namenListe } from "./gemeinsam.js";
import * as knopfAnsicht from "./ansichten/knopf.js";
import { leiste, monatSeite, tagebuchSeite, mehrSeite, funktionSeite } from "./seiten.js";
import { komponist, satzFeld } from "./erfassung.js";
import { faerbe, wasText } from "./ansichten/teile.js";
import * as blattAnsicht from "./ansichten/blatt.js";
import * as fadenAnsicht from "./ansichten/faden.js";

const ANSICHT = { knopf: knopfAnsicht, blatt: blattAnsicht, faden: fadenAnsicht };

let z = laden();
let wahlOffen = !gewaehlt(z).length;
/* Die Einrichtung: wer neu ist, wählt zuerst, worauf er achtet. `auswahl`
   ist, was gerade angetippt ist, bevor es mit „Los geht's" gilt. */
let einrichtungOffen = !gewaehlt(z).length && !offen(z, "tracker");
let auswahl = [];          // [{schluessel, wahl}] in der Reihenfolge des Antippens
let bestaetigen = false;
/* Welche Seite unten gewählt ist (Heute, Monat, Tagebuch, Mehr) und, in
   „Mehr", welche Funktion offen ist. */
let seite = "heute", detail = null;

const $ = (s) => document.querySelector(s);
const heute = () => heuteTag();
const jetztZeit = () => new Date().toTimeString().slice(0, 5);

/* Jede Änderung geht hierdurch. Sie vergleicht den Lauf davor und danach:
   ist heute gerade dazugekommen, füllt sich sein Feld im Monat sichtbar, die
   Zahl springt, und das Telefon tippt einmal leise zurück. Erreichen die
   Tage dabei eine Stufe der Leiter (5, 8, 13, 21, 34), leuchtet der Monat
   kurz auf. Zurück kommt der Moment, damit der Aufrufer ihn mit seiner
   Meldung sagt. */
function aendern(f) {
  const stand = () => ({ lauf: lauf(z, heute()), serie: serie(z, heute()) });
  const vor = gewaehlt(z).length ? stand() : null;
  f();
  if (gewaehlt(z).length) reiseWeiter(z);
  if (!sichern(z)) melde("Auf diesem Gerät lässt sich gerade nichts speichern.");
  zeichne();
  planeAbgleich();
  gremlinNachStufe();
  if (!vor || !gewaehlt(z).length || wahlOffen) return null;
  const m = moment(vor, stand());
  if (m.heuteNeu) {
    document.querySelector(".monat-tag[data-heute]")?.classList.add("pling");
    document.querySelector(".monat-zahl")?.classList.add("hoch");
    document.querySelector(".da-knopf")?.classList.add("jetzt");
    spueren(m.stufe ? [14, 70, 22] : 14);
  }
  if (m.stufe) document.querySelector(".monat")?.classList.add("blitz");
  return m;
}

/* Ein kurzes Tippen zurück, wo das Gerät es kann (Android; iOS schweigt). */
const spueren = (muster) => { try { navigator.vibrate?.(muster); } catch {} };


/* ---- Was die Ansichten benutzen ---------------------------------------- */

const api = {
  get zustand() { return z; },
  get VERZICHTE() { return verzichte(z); },
  EBENEN,
  heute,
  tagesZeile: () => tagesZeile(heute()),
  gewaehlt: () => gewaehlt(z),
  commitmentSatz: () => commitmentSatz(z),
  heuteVon: (v) => vonTag(z, heute(), v),
  stand: (id) => stand(z, id),
  serie: () => serie(z, heute()),
  lauf: () => lauf(z, heute()),
  monat: () => monat(z, heute()),
  besterLauf: () => besterLauf(z, heute()),
  istDa: () => istDa(z, heute()),
  eintragen,
  leitgedanke: () => leitgedankeAm(z, heute()),
  tagessatz: () => tagessatz(z, heute()),
  leitgedankeBearbeiten,
  istFrei: () => istFrei(z, heute()),
  hatEintrag: () => hatEintrag(z, heute()),
  /* „Heute bin ich dabei": der Knopf auf dem Startschirm. Die Antwort steht
     an seiner Stelle — er wird zu „✓ Heute dabei", darunter ein leises
     „zurücknehmen". Keine Meldung, die eingeblendet wird. */
  da() {
    const t = heute();
    if (hatEintrag(z, t)) { spueren(8); return; }
    aendern(() => schalteDa(z, t));
    gremlin.freut(1, document.querySelector(".da-knopf"));
  },
  daZurueck() { aendern(() => { if (istDa(z, heute())) schalteDa(z, heute()); }); },
  /* Was an einer Notiz noch geht — an ihrem Platz in der Kachel. */
  notizWeg(id) { aendern(() => entferne(z, id)); },
  notizDetails(id) { const e = z.ereignisse.find((x) => x.id === id); if (e) fragen(e.verzicht, e.art, e.art === "habe" ? verzichte(z)[e.verzicht].habe : verzichte(z)[e.verzicht].drang, id); },
  notizWerkzeug(id) { W.menue(id); },

  reiseNeu: () => (z.reiseNeu !== null ? REISE[z.reiseNeu] : null),
  reiseGesehen() { aendern(() => { z.reiseNeu = null; }); },
  aktiv: (id) => aktiv(z, id),
  offen: (was) => offen(z, was),
  reise: () => reiseStand(z),
  ab: (n) => ab(z, n),
  trackerBearbeiten: (v) => eigenerTracker(v),
  werkzeug: (name) => W[name](),
  werkzeugStand: () => z.werkzeug,
  morgenpraxisOffen() {
    const h = new Date().getHours();
    return ab(z, 3) && h >= 4 && h < 11 && !z.tagebuch[heute()]?.daemon;
  },
  dauer,
  zeitStufen: () => ZEIT_STUFEN,
  zeitFuer: () => ZEIT_FUER,
  lebenszeit() {
    const t = heute(), e = z.tagebuch[t] || {};
    return { heute: freiAm(z, t), monat: lebenszeit(z, monat(z, t).zellen.filter((c) => c.art === "okt" && c.tag <= t).map((c) => c.tag)),
      vorher: z.zeitVorher, zeitHeute: e.zeit || {}, fuerHeute: e.fuer || [] };
  },
  zeitVorherSetzen(v, m) { aendern(() => setzeZeitVorher(z, v, m)); },
  gremlinStand() {
    const t = heute(), s = gremlinStufe(z, t), f = z.gremlin.fuetterungen.find((x) => x.tag === t);
    return { stufe: s, stufen: GREMLIN_STUFEN, tag: z.gremlin.tag, futter: z.gremlin.futter, wochentage: WOCHENTAGE,
      vorschlaege: GREMLIN_FUTTER_VORSCHLAEGE, fuetterungstag: s.fuetterungstag, heuteGefuettert: !!f, heuteWas: f?.was || "" };
  },
  gremlinTag(t) { aendern(() => setzeFuetterungstag(z, t)); },
  gremlinFutterHinzu(was) { aendern(() => futterHinzu(z, was)); },
  gremlinFutterWeg(i) { aendern(() => futterWeg(z, i)); },
  gremlinFuettern(was) {
    let ok = false;
    aendern(() => { ok = fuettern(z, heute(), was); });
    if (!ok) return;
    gremlin.sagt("fuetterung");
  },
  zeitHeuteSetzen(v, m) {
    const vorher = freiAm(z, heute());
    const mo = aendern(() => schreibeTag(z, heute(), { zeit: { [v]: m } }));
    const jetzt = freiAm(z, heute());
    if (jetzt !== null && jetzt !== vorher) {
      spueren(jetzt > (vorher || 0) ? 14 : 8);
      document.querySelector(".lz-zahl")?.classList.add("hoch");
    }
  },
  zeitFuerSchalten(id) {
    const f = new Set(z.tagebuch[heute()]?.fuer || []);
    if (f.has(id)) f.delete(id); else f.add(id);
    aendern(() => schreibeTag(z, heute(), { fuer: [...f] }));
  },
  schritteGetan: (v) => schritteGetan(z, heute(), v),
  schritt(v, i) {
    const V = verzichte(z)[v];
    let an = false;
    const m = aendern(() => { an = schalteSchritt(z, heute(), jetztZeit(), v, i); });
    document.querySelector(`[data-focus="schritt-${v}-${i}"]`)?.classList.add("tipp");
    if (an) { spueren(m?.heuteNeu ? 14 : 8); gremlin.freut(vonTag(z, heute()).length, document.querySelector(`[data-focus="schritt-${v}-${i}"]`)); }
  },
  schichten: () => SCHICHTEN,
  schichtWert: (id, tag) => SCHICHTEN.find((x) => x.id === id).wert(z, tag),
  eingeschaetzt: () => eingeschaetzt(z, heute()),
  systemeAnzahl: SYSTEME.length,
  verlauf: (tage) => verlauf(z, tage),
  zusammenhaenge: (tage) => zusammenhaenge(z, tage),
  monatsTage: () => monat(z, heute()).zellen.filter((c) => c.art !== "rand").map((c) => c.tag),
  tagEinordnen: (tag) => tagEinordnen(tag),
  /* Ein Tag im Kalender angetippt: was an dem Tag steht, und — für heute
     und vergangene Tage — ob man dabei war. Ein kommender Tag hat noch nichts. */
  seite(id, d = null) { seite = id; detail = d; if (bogen.open) bogen.close(); zeichne(); scrollTo(0, 0); },
  station: (was) => stationVon(was),
  stationen: () => REISE.map((r, i) => ({ titel: r.titel, wann: r.wann, offen: i < z.reise, naechste: i === z.reise })),
  reiseBis(was) { aendern(() => reiseBis(z, was)); },
  trackerWaehlen() { wahlOffen = true; zeichne(); scrollTo(0, 0); },
  festhalten: () => festhalten(heute()),
  satzHeute: () => satzFeld(erfassungFuer(heute(), () => zeichne())),
  tagAntippen(tag) {
    if (tag > heute()) return;
    if (bogen.open) bogen.close();
    tagEinordnen(tag);
  },
  getragen: () => z.tagebuch[heute()]?.getragen || "",
  getragenSetzen(text) {
    const m = aendern(() => schreibeTag(z, heute(), { getragen: text }));
  },
  tagebuchZeilen: () => tagebuchZeilen(z, heute()),
  stimmungWort: (n) => STIMMUNG[n - 1],
  /* Gestern leer geblieben, aber es gibt schon etwas vorher: dann darf man
     ihn nachtragen (aus lifetracker, „Noch kurz aufschreiben"). */
  gesternOffen() {
    const g = verschiebe(heute(), -1);
    const imMonat = monat(z, heute()).zellen.some((c) => c.tag === g && c.art !== "rand");
    const schonDa = [...z.daTage, ...z.ereignisse.map((e) => e.tag), ...Object.keys(z.tagebuch)].some((t) => t < g);
    return imMonat && schonDa && !hatEintrag(z, g) ? g : null;
  },
  gruppe: () => gruppeFuerAnzeige(),
  mitgehen,
  binIch(id, name) {
    aendern(() => { z.gemeinsam = { id, name }; });
  },
  alleinBleiben() {
    aendern(() => schalteBaustein(z, "gemeinsam", false));
  },
  async linkTeilen() {
    const url = location.origin + "/";
    try {
      if (navigator.share) { await navigator.share({ title: "Sober October", text: "Geh mit mir durch den Oktober.", url }); return; }
      await navigator.clipboard.writeText(url);
      melde("Link kopiert. Wer ihn öffnet, kann mitgehen.");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      melde(`Der Link: ${url}`);
    }
  },
  neuerTracker: () => neuerTracker(),
  springeZu: null,
  oeffneEbene,
  einstellungen,
  zeichne: () => zeichne(),
};

/* ---- Gemeinsam ------------------------------------------------------------

   Der Stand der Gruppe kommt vom Server (netz.js). Die Seite wartet nie
   auf ihn: sie zeichnet sofort und noch einmal, wenn er da ist. Nach jeder
   Änderung gleicht sie ab, was an den Server muss (gemeinsam.js) — nur
   Tage dabei und das Commitment, nie was notiert ist. */

let gruppenStand = null;

function gruppeFuerAnzeige() {
  if (!aktiv(z, "gemeinsam") || !erreichbar || !gruppenStand) return null;
  const tage = monat(z, heute()).zellen.filter((c) => c.art !== "rand").map((c) => c.tag);
  const g = gruppe(z, gruppenStand, heute(), tage);
  return { ...g, ich: binDabei(z, gruppenStand), tage, heuteTag: heute(), heuteSatz: namenListe(g.heute) };
}

/* Neu zeichnen, aber nicht unter den Fingern weg: wer gerade tippt (den
   Namen, einen Tracker), behält sein Feld. */
function zeichneLeise() {
  const f = document.activeElement;
  if (f && f.matches("#buehne input, #buehne textarea")) return;
  zeichne();
}

async function aktualisieren() {
  if (!aktiv(z, "gemeinsam")) return;
  const vorher = erreichbar;
  const { stand, neu } = await holen();
  gruppenStand = stand;
  if (z.gemeinsam && stand && !binDabei(z, stand)) {
    // Auf einem anderen Gerät verabschiedet: hier auch.
    z.gemeinsam = null;
    sichern(z);
  }
  if (neu || vorher !== erreichbar) zeichneLeise();
}

let abgleichTimer, abgleichLaeuft = false;
function planeAbgleich() {
  clearTimeout(abgleichTimer);
  if (z.gemeinsam && aktiv(z, "gemeinsam")) abgleichTimer = setTimeout(abgleichen, 700);
}

async function abgleichen() {
  if (abgleichLaeuft) { planeAbgleich(); return; }
  abgleichLaeuft = true;
  try {
    await aktualisieren();
    if (!z.gemeinsam || !gruppenStand) return;
    const a = abgleich(z, gruppenStand, heute());
    const person = z.gemeinsam.id;
    for (const t of a.tage) await senden("/api/entry", { person, date: t.date, value: t.value });
    if (a.commitment) await senden("/api/setting", { person, value: a.commitment, ab: heute() });
    if (a.tage.length || a.commitment) await aktualisieren();
  } catch (e) {
    if (e.schluessel === "person-unbekannt") { z.gemeinsam = null; sichern(z); zeichneLeise(); }
    // Sonst (offline, Server weg): beim nächsten Mal wieder. Nichts geht verloren,
    // der Abgleich rechnet jedes Mal neu aus diesem Gerät.
  } finally {
    abgleichLaeuft = false;
  }
}

const GRUPPEN_FEHLER = {
  "name-leer": "Wie heißt du? Ein Vorname reicht.",
  "name-zu-lang": "Ein kürzerer Name, bitte — höchstens 24 Zeichen.",
  "name-vergeben": "Den Namen gibt es in der Gruppe schon. Bist du das? Dann „Schon dabei, auf einem anderen Gerät?“.",
  "gruppe-voll": "Die Gruppe ist voll: zwanzig gehen schon mit.",
  netz: "Gerade kein Netz. Versuch es gleich noch einmal.",
};

async function mitgehen(name) {
  try {
    const p = await senden("/api/einrichtung", { name, commitment: gewaehlt(z) });
    aendern(() => { z.gemeinsam = { id: p.id, name: p.name }; });
    await abgleichen();
  } catch (e) {
    melde(GRUPPEN_FEHLER[e.schluessel] || "Das hat nicht geklappt. Versuch es gleich noch einmal.");
  }
}

async function gruppeVerlassen() {
  try {
    await senden("/api/abschied", { person: z.gemeinsam.id });
  } catch (e) {
    if (e.schluessel !== "person-unbekannt") { melde(GRUPPEN_FEHLER[e.schluessel] || "Das hat nicht geklappt."); return; }
  }
  bogen.close();
  aendern(() => { z.gemeinsam = null; });
  await aktualisieren();
  melde("Du bist aus der Gruppe gegangen. Dein Name und deine Tage sind vom Server gelöscht.");
}

/* ---- Der Bogen ---------------------------------------------------------- */

const bogen = $("#bogen");

/* Der Gremlin (Schicht 3): was er vom Tag weiß. `tag` ist, wie lange man
   schon dabei ist — danach richtet sich, welche Sätze er schon kennt. */
const gremlin = erzeugeGremlin({
  an: () => aktiv(z, "gremlin") && gewaehlt(z).length > 0 && !wahlOffen && gremlinStufe(z, heute()).n >= 1,
  stufe: () => gremlinStufe(z, heute()).n,
  buzz: (m) => spueren(m || 10),
  kontext() {
    const t = heute(), d = new Date(), h = d.getHours();
    let p = tageszeit(t, h * 60 + d.getMinutes());
    if (p === "tag" && h < 10) p = "morgen";
    const tage = [...z.daTage, ...z.ereignisse.map((e) => e.tag), ...Object.keys(z.tagebuch)].filter((x) => x <= t).sort();
    const seit = tage.length ? Math.round((new Date(t) - new Date(tage[0])) / 864e5) + 1 : 1;
    return {
      tag: Math.max(1, seit), st: serie(z, t), n: vonTag(z, t).length + (istDa(z, t) ? 1 : 0) + (z.tagebuch[t] ? 1 : 0),
      best: besterLauf(z, t), name: z.gemeinsam?.name || "", p, tiefe: p === "nacht" ? Math.min(1, ((h + 2) % 24) / 8) : 0,
      gesternLeer: !hatEintrag(z, verschiebe(t, -1)), v: "",
      bez: gremlinStufe(z, t).n, fuetterungstag: gremlinStufe(z, t).fuetterungstag,
    };
  },
});

/* Hat sich die Beziehung verändert, sagt die App es einmal — kurz nach
   der Meldung zur Handlung, damit keine die andere verschluckt. */
let letzteStufe = null;
function gremlinNachStufe() {
  const s = gremlinStufe(z, heute());
  if (letzteStufe !== null && s.n !== letzteStufe && aktiv(z, "gremlin")) {
    const text = s.n === 1 ? "Da ist jemand. Dein Gremlin zeigt sich — unten am Rand."
      : s.n > letzteStufe ? `Dein Gremlin: ${s.name}. ${s.text}` : `Dein Gremlin verwildert ein wenig: ${s.name}.`;
    setTimeout(() => gremlin.pruefen(), 2600);
  }
  letzteStufe = s.n;
}

/* Die Werkzeuge (Schicht 2) bekommen, was sie brauchen, hinein. */
const W = werkzeuge({
  el: (...a) => el(...a), knopf: (...a) => knopf(...a), zeige: (n) => zeigeBogen(n), schliessen: () => bogen.close(),
  aendern: (f) => aendern(f), melde: (...a) => melde(...a), zustand: () => z,
  setzeAnker, setzeSwish, planHinzu, planWeg, ergaenze,
  gemacht: () => { aendern(() => werkzeugBenutzt(z, heute())); gremlin.sagt("werkzeug"); },
  ab: (n) => ab(z, n), buzz: (m) => spueren(m),
  daemonPhasen: DAEMON_PHASEN, daemonStand,
  beimSchliessen: (f) => bogen.addEventListener("close", f, { once: true }),
  daemonFertig(was, sek) {
    const m = aendern(() => { schreibeTag(z, heute(), { daemon: { was, sek } }); werkzeugBenutzt(z, heute()); });
    gremlin.sagt("daemon");
  },
});

function zeigeBogen(knoten) {
  const titel = knoten.querySelector("h2") || knoten.querySelector(".rubrik");
  if (titel) {
    titel.id = "bogen-titel";
    bogen.setAttribute("aria-labelledby", titel.id);
  } else bogen.removeAttribute("aria-labelledby");
  bogen.replaceChildren(knoten);
  if (!bogen.open) bogen.showModal();
}

function knopf(text, klasse, beiKlick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  if (klasse) b.className = klasse;
  b.addEventListener("click", beiKlick);
  return b;
}

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

/* Schnell loggen: ein Tippen notiert sofort, ohne Fragen. Die Antwort steht
   in der Kachel selbst: die Zahl springt, darunter die letzte Notiz mit
   „Details" und „rückgängig" — an einem festen Platz, nicht eingeblendet. */
function eintragen(v, art) {
  const V = verzichte(z)[v];
  if (V.aufbau) {
    art = "getan";
    /* Aufbauen ist ein Häkchen am Tag, kein Zähler: ein zweites Tippen
       nimmt es zurück. Dafür braucht es keine Meldung mit „Rückgängig". */
    const getan = vonTag(z, heute(), v).filter((e) => e.art === "getan" && !Number.isInteger(e.schritt));
    if (getan.length) {
      aendern(() => { for (const e of getan) entferne(z, e.id); });
      spueren(8);
      return;
    }
  }
  const m = aendern(() => notiere(z, { tag: heute(), zeit: jetztZeit(), verzicht: v, art }));
  document.querySelector(`[data-focus="${art === "getan" ? "habe" : art}-${v}"]`)?.classList.add("tipp");
  if (!m?.heuteNeu) spueren(8);
  if (art === "drang") gremlin.sagt(gremlinStufe(z, heute()).n >= 4 && !gremlinStufe(z, heute()).fuetterungstag ? "sitz" : "drang");
  else if (art === "habe") gremlin.sagt("geschehen");
  else gremlin.freut(vonTag(z, heute()).length, document.querySelector(`[data-focus="habe-${v}"]`));
}


/* Begleitung, wenn man sie will: erst Raum, dann zurück zu den Fragen.
   Was schon ausgefüllt war, bleibt stehen. */
function begleiten(v, zurueck) {
  const k = el("div", "bogen-inhalt begleitung");
  faerbe(k, verzichte(z), v);
  k.append(
    el("p", "rubrik", verzichte(z)[v].name),
    Object.assign(el("div", "welle"), { ariaHidden: "true" }),
    el("p", "serif", "Das darf da sein. Ein Drang steigt, und er fällt auch wieder."),
    el("p", "serif", "Du musst nichts damit machen."),
  );
  const uhr = el("p", "leise uhr", "0:00");
  k.append(uhr);
  const beginn = Date.now();
  const t = setInterval(() => {
    const s = Math.floor((Date.now() - beginn) / 1000);
    uhr.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, 500);
  bogen.addEventListener("close", () => clearInterval(t), { once: true });
  k.append(knopf("weiter", "gross", () => { clearInterval(t); zurueck(Math.round((Date.now() - beginn) / 1000)); }));
  zeigeBogen(k);
}

/** Die Fragen zu einem Eintrag, der schon notiert ist. */
function fragen(v, art, titel, id) {
  const V = verzichte(z)[v];
  const f = el("form", "bogen-inhalt");
  faerbe(f, verzichte(z), v);
  f.append(el("p", "rubrik", `${V.name} · ${jetztZeit()}`), el("h2", null, titel),
    el("p", "leise", "Alles freiwillig. Ein Wort reicht, keins auch."));
  let begleitetSek = 0;
  if (art === "drang") {
    const b = knopf("einen Moment begleiten", "text", () =>
      begleiten(v, (sek) => { begleitetSek = sek; b.remove(); zeigeBogen(f); }));
    f.append(b);
  }
  for (const q of FRAGEN[art]) {
    const l = el(q.wahl ? "fieldset" : "label", "frage");
    l.append(el(q.wahl ? "legend" : "span", "serif", q.frage));
    if (q.wahl) {
      const r = el("span", "chips");
      for (const w of q.wahl) {
        const c = el("label", "chip");
        c.dataset.wert = w;
        const i = Object.assign(document.createElement("input"), { type: q.mehr ? "checkbox" : "radio", name: q.id, value: w });
        c.append(i, el("span", null, w));
        r.append(c);
      }
      l.append(r);
    } else {
      l.append(Object.assign(document.createElement("input"), { name: q.id, placeholder: q.platz, autocomplete: "off", maxLength: 280 }));
    }
    f.append(l);
  }
  const speichern = () => {
    const antworten = {};
    for (const [k, w] of new FormData(f)) {
      const t = String(w).trim();
      if (t) antworten[k] = antworten[k] ? antworten[k] + ", " + t : t;
    }
    let neu = [];
    bogen.close();
    aendern(() => { neu = ergaenze(z, id, { antworten, begleitetSek }); });
  };
  const unten = el("div", "wahlreihe");
  unten.append(knopf("speichern", "gross", speichern), knopf("schließen", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(); });
  zeigeBogen(f);
}

function oeffneEbene(id) {
  const e = EBENEN.find((x) => x.id === id);
  if (z.frei[id] && !z.frei[id].gesehen) aendern(() => { z.frei[id].gesehen = true; });
  const k = el("div", "bogen-inhalt ebene");
  k.dataset.ebene = id;
  k.append(el("p", "rubrik", e.rubrik), el("h2", null, e.titel), ebenenInhalt(id, z, heute()),
    knopf("schließen", "text", () => bogen.close()));
  zeigeBogen(k);
}

/* ---- Ein Tag im Blatt ------------------------------------------------------------

   Für einen anderen Tag als heute (aus dem Kalender, „Gestern nachtragen")
   dieselbe Erfassung wie auf dem Startschirm, in einem Blatt: was notiert
   ist, ob man dabei war, und alles, was sich festhalten lässt. Alles
   speichert sofort; es gibt nur „Fertig". */
function tagEinordnen(tag) {
  const t = tag || heute();
  if (t === heute()) { zumHeute(); return; }
  const y = bogen.open ? bogen.scrollTop : 0;
  const k = el("div", "bogen-inhalt tag-blatt");
  k.append(el("p", "rubrik", tagesKopf(t)), el("h2", null, "Wie war der Tag?"));

  const notizen = vonTag(z, t).filter((e) => e.art !== "ohne");
  if (notizen.length) {
    const l = el("ul", "tag-notizen");
    for (const e of notizen) l.append(faerbe(el("li", null, `${e.zeit} · ${wasText(api, e)}`), verzichte(z), e.verzicht));
    k.append(l);
  }
  const l = el("label", "baustein");
  const da = Object.assign(document.createElement("input"), { type: "checkbox", checked: istDa(z, t) });
  da.addEventListener("change", () => { aendern(() => { if (da.checked !== istDa(z, t)) schalteDa(z, t); }); });
  const tx = el("span", "baustein-text");
  tx.append(el("span", null, "An dem Tag war ich dabei"),
    el("span", "leise klein", notizen.length ? "Der Tag zählt schon durch deine Notiz." : "Er zählt dann wie jeder andere — für dich und in der Gruppe."));
  l.append(da, tx);
  const kt = erfassungFuer(t, () => tagEinordnen(t));
  const mehr = knopf("Stimmung, Schlaf, Menge … festhalten", "text", () => festhalten(t));
  k.append(l, satzFeld(kt), mehr);
  k.append(knopf("Fertig", "gross", () => bogen.close()));
  zeigeBogen(k);
  bogen.scrollTop = y;
}

/* Was die Erfassung für einen Tag braucht. `neu` zeichnet sie nach einer
   Eingabe neu (auf dem Startschirm tut das zeichne() ohnehin). */
function erfassungFuer(t, neu) {
  const V = verzichte(z);
  return {
    tag: t,
    heute: t === heute(),
    eintrag: () => z.tagebuch[t] || {},
    lassen: gewaehlt(z).filter((v) => !V[v].aufbau).map((v) => ({ id: v, name: V[v].name })),
    schreibe(was) { aendern(() => schreibeTag(z, t, was)); spueren(8); neu(); },
    /* Ohne neu zu zeichnen — für das Textfeld, siehe erfassung.js. Was sich
       dadurch sonst ändert (der Tag zählt), zeigt das nächste Zeichnen. */
    schreibeLeise(was) {
      schreibeTag(z, t, was);
      if (gewaehlt(z).length) reiseWeiter(z);
      if (!sichern(z)) melde("Auf diesem Gerät lässt sich gerade nichts speichern.");
      planeAbgleich();
      setTimeout(zeichneLeise, 400);
    },
    neu,
  };
}

/* Das „+" unten: der Vollbild-Check-in (erfassung.js). Er merkt sich,
   welche Art zuletzt offen war. */
let komponistArt = "stimmung";
function festhalten(t) {
  const zeige = () => {
    const k = erfassungFuer(t, zeige);
    k.titel = t === heute() ? "Heute" : tagesKopf(t);
    const inhalt = komponist(k, komponistArt, (a) => { komponistArt = a; zeige(); }, () => bogen.close());
    bogen.classList.add("vollbild");
    zeigeBogen(inhalt);
  };
  bogen.addEventListener("close", () => { bogen.classList.remove("vollbild"); zeichne(); }, { once: true });
  zeige();
}

/* Heute im Kalender angetippt: zum Tag auf dem Startschirm. Ist man schon
   dort, bleibt die Seite, wo sie ist — nichts springt. */
function zumHeute() {
  if (bogen.open) bogen.close();
  if (seite === "heute") return;
  seite = "heute"; detail = null;
  zeichne();
  scrollTo(0, 0);
}

/* ---- Der Leitgedanke ------------------------------------------------------ */

function leitgedankeBearbeiten() {
  const jetzt = leitgedankeAm(z, heute());
  const f = el("form", "bogen-inhalt leit-bogen");
  f.append(el("p", "rubrik", "Dein Leitgedanke"),
    el("h2", null, `„${jetzt.text}“`));
  const seit = begleitetSeit(z, heute());
  f.append(el("p", "leise", seit
    ? `Begleitet dich seit ${tagesKopf(jetzt.ab)}${seit > 1 ? ` — ${seit} Tage` : ""}.`
    : "Der Satz, mit dem die App anfängt. Er darf deiner bleiben."));
  const l = el("label", "frage");
  l.append(el("span", "serif", "Ein Satz, der dich begleitet. Er darf bleiben, er darf sich ändern."));
  const i = Object.assign(document.createElement("input"), { name: "leit", value: jetzt.text, autocomplete: "off", maxLength: 120,
    placeholder: LEITGEDANKE });
  l.append(i);
  f.append(l);

  const frueher = z.leitgedanken.filter((x) => x.ab <= heute()).slice(0, -1).reverse();
  if (frueher.length) {
    const d = el("details", "leit-frueher");
    d.append(el("summary", "leise", "Frühere Leitgedanken"));
    for (const x of frueher) d.append(el("p", "zitat", `„${x.text}“ · ab ${tagesKopf(x.ab)}`));
    f.append(d);
  }

  const speichern = () => {
    let neu = false;
    aendern(() => { neu = setzeLeitgedanke(z, i.value, heute()); });
    bogen.close();
  };
  const unten = el("div", "wahlreihe");
  unten.append(knopf("so soll er lauten", "gross", speichern), knopf("bleibt, wie er ist", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(); });
  zeigeBogen(f);
}

/* ---- Einstellungen ------------------------------------------------------- */

/* Die Einstellungen in drei Teilen: was du trackst, wie es aussieht, und
   welche Bausteine dazukommen. Jeder Baustein sagt in einem Satz, was er
   tut; er wirkt sofort, ohne Speichern-Knopf. */
function einstellungen() {
  const k = el("div", "bogen-inhalt einstellungen");
  k.append(el("p", "rubrik", "Einstellungen"), el("h2", null, "Darstellung und Daten"));

  const ans = el("fieldset", "frage");
  ans.append(el("legend", "serif", "Ansicht"));
  const reihe = el("div", "ansicht-wahl");
  for (const [id, text] of Object.entries(ANSICHTEN)) {
    const [name, erklaerung] = text.split(" — ");
    const l = el("label", "ansicht-option");
    const i = Object.assign(document.createElement("input"), { type: "radio", name: "ansicht", value: id, checked: z.ansicht === id });
    i.addEventListener("change", () => aendern(() => { z.ansicht = id; }));
    l.append(i, el("span", "serif", name), el("span", "leise klein", erklaerung));
    reihe.append(l);
  }
  ans.append(reihe);
  if (offen(z, "ansicht")) k.append(ans);

  const farbe = el("fieldset", "frage");
  farbe.append(el("legend", "serif", "Farbwelt"));
  const wahl = el("div", "farbwahl");
  for (const [id, f] of Object.entries(FARBWELTEN)) {
    const l = el("label", "farbe-option");
    const i = Object.assign(document.createElement("input"), { type: "radio", name: "farbe", value: id, checked: z.farbe === id });
    i.addEventListener("change", () => aendern(() => { z.farbe = id; }));
    const feld = el("span", "farbe-feld");
    feld.style.background = `linear-gradient(180deg, ${f.flaeche} 0 45%, ${f.papier} 45%)`;
    for (const a of ["--moss", "--gelb", "--blau", "--magenta"]) {
      const p = document.createElement("i");
      p.style.background = `var(${a})`;
      feld.append(p);
    }
    l.append(i, feld, el("span", null, f.name));
    wahl.append(l);
  }
  farbe.append(wahl, el("p", "leise klein", "Gilt für die helle Darstellung. Im Dunkeln bleibt es beim warmen Braun."));
  k.append(farbe);

  /* Abends ruhiger: der einzige Schalter, der hier bleibt. Was die App
     sonst kann, steht unter „Mehr". */
  const abends = el("label", "baustein");
  const ai = Object.assign(document.createElement("input"), { type: "checkbox", checked: aktiv(z, "abends") });
  ai.addEventListener("change", () => { aendern(() => schalteBaustein(z, "abends", ai.checked)); tageszeitSetzen(); });
  const at = el("span", "baustein-text");
  at.append(el("span", null, "Abends ruhiger"), el("span", "leise klein", "Nach Sonnenuntergang wird die Seite eine Spur ruhiger."));
  abends.append(ai, at);
  k.append(abends);

  if (z.gemeinsam) {
    const weg = knopf(`Du gehst als ${z.gemeinsam.name} mit. Die Gruppe verlassen`, "text klein", () => {
      if (!weg.dataset.sicher) { weg.dataset.sicher = "1"; weg.textContent = "Wirklich? Name und Tage werden vom Server gelöscht. Noch einmal tippen."; return; }
      gruppeVerlassen();
    });
    k.append(weg);
  }

  const daten = el("div", "frage");
  daten.append(el("p", "serif", "Deine Daten"),
    el("p", "leise klein", "Alles, was du notierst, liegt nur auf diesem Gerät, in diesem Browser. Gehst du gemeinsam mit, kennt der Server nur deinen Namen, was du sein lässt, und an welchen Tagen du dabei warst — sonst nichts."));
  const weg = knopf("Alles auf diesem Gerät löschen", "text", () => {
    if (weg.dataset.sicher) {
      loeschen();
      location.reload();
      return;
    }
    weg.dataset.sicher = "1";
    weg.textContent = "Wirklich löschen? Noch einmal tippen.";
  });
  daten.append(weg, knopf("Neu anfangen: auswählen, worauf du achtest", "text", () => { bogen.close(); auswahl = []; bestaetigen = false; einrichtungOffen = true; zeichne(); }));
  k.append(daten, knopf("Fertig", "gross", () => bogen.close()));
  zeigeBogen(k);
}

/* Die Meldung oben, optional mit Knöpfen ([Text, Handlung]). Mit Knöpfen
   bleibt sie länger stehen, damit man sie erreicht. */
let meldeTimer;
function melde(text, aktionen = []) {
  const m = $("#meldung");
  m.replaceChildren(el("span", null, text));
  for (const [t, tun] of aktionen) m.append(knopf(t, "melde-knopf", () => { m.hidden = true; tun(); }));
  if (aktionen.length) {
    const schliessen = knopf("×", "melde-knopf meldung-schliessen", () => { m.hidden = true; });
    schliessen.setAttribute("aria-label", "Meldung schließen");
    m.append(schliessen);
  }
  m.hidden = false;
  clearTimeout(meldeTimer);
  /* Keine Meldung wartet darauf, weggeklickt zu werden: eine reine
     Bestätigung geht nach gut drei Sekunden, eine mit Knöpfen nach acht. */
  meldeTimer = setTimeout(() => (m.hidden = true), aktionen.length ? 8000 : 3500);
}

/* ---- Commitment wählen ----------------------------------------------------- */

function wahlSeite() {
  const s = el("section", "wahl");
  const V = verzichte(z);
  const alle = FEST.every((k) => z.commitment[k]);
  s.append(el("p", "rubrik", `Sober October · ${tagesZeile(heute())}`),
    el("h1", "serif", "Was lässt du im Oktober sein?"));
  const unterKopf = el("div", "wahl-unterkopf");
  const alles = knopf(alle ? "✓ Alles" : "Alles", "chip-knopf", () => aendern(() => schalteAlles(z)));
  alles.setAttribute("aria-pressed", alle);
  alles.dataset.focus = "wahl-alles";
  alles.title = "Kaffee, Kippe und Video auf einmal";
  unterKopf.append(el("span", "leise", "Eins reicht. Bereitschaft genügt."), alles);
  s.append(unterKopf);

  const liste = el("div", "wahl-liste");
  for (const id of [...FEST, ...z.eigene.filter((e) => e.art !== "aufbauen").map((e) => e.id)]) liste.append(trackerZeile(id));
  s.append(liste, el("p", "leise klein wahl-hilfe", "„Würde gern“ schaltet das Notieren von Verlangen ein. Du kannst es jederzeit ändern."));

  const neu = el("form", "wahl-neu");
  const i = Object.assign(document.createElement("input"), {
    name: "neu", placeholder: "Eigener Tracker, z. B. Alkohol", autocomplete: "off", maxLength: 60,
  });
  i.setAttribute("aria-label", "Eigenen Tracker hinzufügen");
  const plus = knopf("+", "rund", () => neu.requestSubmit());
  plus.setAttribute("aria-label", "Hinzufügen");
  neu.append(i, plus);
  neu.addEventListener("submit", (e) => {
    e.preventDefault();
    let id = null;
    aendern(() => { id = fuegeEigenenHinzu(z, i.value); });
    if (id) $(".wahl-neu input")?.focus();
  });
  s.append(neu);

  s.append(aufbauWahl());

  const los = knopf("Mit meiner Auswahl starten", "gross", () => { wahlOffen = false; zeichne(); });
  los.disabled = !gewaehlt(z).length;
  s.append(los, el("p", "leise klein", "Du kannst jederzeit Tracker dazunehmen oder abwählen. Was du notierst, bleibt auf diesem Gerät."));
  return s;
}

/* Eine Zeile je Tracker: links der Name (antippen wählt ihn), rechts, wenn
   gewählt, ein leiser Schalter für die Würde-gern-Momente. Eigene Tracker
   haben dazu ein „…" für Umbenennen, Schritte und Entfernen. */
function trackerZeile(id) {
  const V = verzichte(z);
  const an = !!z.commitment[id];
  const zeile = faerbe(el("div", "wahl-zeile"), V, id);
  zeile.dataset.an = an;
  const b = knopf(V[id].name, "wahl-knopf", () => aendern(() => {
    if (z.commitment[id]) delete z.commitment[id]; else z.commitment[id] = { drang: !V[id].aufbau };
  }));
  b.setAttribute("aria-pressed", an);
  b.dataset.focus = `wahl-${id}`;
  b.prepend(el("span", "wahl-haken", an ? "✓" : ""));
  zeile.append(b);
  if (an && !V[id].aufbau) {
    const d = knopf("würde gern", "chip-knopf klein", () => aendern(() => { z.commitment[id].drang = !z.commitment[id].drang; }));
    d.setAttribute("aria-pressed", z.commitment[id].drang);
    d.dataset.focus = `wahl-drang-${id}`;
    d.title = "Auch die Momente notieren, in denen ich gern würde";
    d.setAttribute("aria-label", `${V[id].name}: Würde-gern-Momente mitnotieren`);
    zeile.append(d);
  }
  if (V[id].eigen) {
    const m = knopf("…", "rund klein", () => eigenerTracker(id));
    m.setAttribute("aria-label", `${V[id].name}: ${V[id].aufbau ? "Schritte, umbenennen oder entfernen" : "umbenennen oder entfernen"}`);
    zeile.append(m);
  }
  return zeile;
}

/* Was man aufbaut: Vorschläge zum Antippen, eigene per Feld. Gewählte
   stehen oben in der Liste wie jeder Tracker. */
function aufbauWahl() {
  const k = el("div", "aufbau-wahl");
  k.append(el("h2", "serif", "Was baust du auf?"),
    el("p", "leise klein", "Auch ohne Verzicht: eine Routine, die du im Oktober pflegen willst. Ein Tippen am Tag heißt „getan“."));
  const gebaut = z.eigene.filter((e) => e.art === "aufbauen");
  if (gebaut.length) {
    const l = el("div", "wahl-liste");
    for (const e of gebaut) l.append(trackerZeile(e.id));
    k.append(l);
  }
  const r = el("div", "chips-reihe");
  const namen = new Set(z.eigene.map((e) => e.name.toLowerCase()));
  for (const v of AUFBAU_VORSCHLAEGE) {
    if (namen.has(v.name.toLowerCase())) continue;
    const b = knopf(`+ ${v.name}`, "chip-knopf aufbau-chip", () => aendern(() => fuegeEigenenHinzu(z, v.name, { art: "aufbauen", schritte: v.schritte })));
    b.dataset.focus = `aufbau-${v.name}`;
    r.append(b);
  }
  const f = el("form", "wahl-neu");
  const i = Object.assign(document.createElement("input"), { name: "aufbau", placeholder: "Eigenes, z. B. Lesen am Abend", autocomplete: "off", maxLength: 60 });
  i.setAttribute("aria-label", "Etwas zum Aufbauen hinzufügen");
  const plus = knopf("+", "rund", () => f.requestSubmit());
  plus.setAttribute("aria-label", "Hinzufügen");
  f.append(i, plus);
  f.addEventListener("submit", (e) => { e.preventDefault(); let id = null; aendern(() => { id = fuegeEigenenHinzu(z, i.value, { art: "aufbauen" }); }); });
  k.append(r, f);
  return k;
}


/* Ein neuer Tracker, aus jeder Ansicht heraus über „+". Er ist gleich
   gewählt; die Knopf-Ansicht springt auf ihn. */
function neuerTracker() {
  const f = el("form", "bogen-inhalt");
  f.append(el("p", "rubrik", "Neuer Tracker"), el("h2", null, "Was lässt du sein — oder baust du auf?"));
  const artWahl = el("div", "wahlreihe");
  for (const [wert, text] of [["lassen", "sein lassen"], ["aufbauen", "aufbauen"]]) {
    const l = el("label", "zeile");
    l.append(Object.assign(document.createElement("input"), { type: "radio", name: "art", value: wert, checked: wert === "lassen" }), el("span", null, text));
    artWahl.append(l);
  }
  f.append(artWahl);
  const i = Object.assign(document.createElement("input"), { name: "neu", placeholder: "z. B. Alkohol, Zucker, Social Media", autocomplete: "off", maxLength: 60 });
  i.setAttribute("aria-label", "Name des Trackers");
  const l = el("label", "frage");
  l.append(i);
  f.append(l);
  const aus = FEST.filter((k) => !z.commitment[k]);
  if (aus.length) {
    const r = el("div", "wahlreihe");
    r.append(el("span", "leise klein", "Oder wieder dazu:"));
    for (const k of aus) r.append(knopf(verzichte(z)[k].name, "chip-knopf", () => {
      aendern(() => { z.commitment[k] = { drang: true }; });
      bogen.close();
      api.springeZu = k;
      zeichne();
    }));
    f.append(r);
  }
  const hinzu = () => {
    let id = null;
    const art = new FormData(f).get("art") || "lassen";
    aendern(() => { id = fuegeEigenenHinzu(z, i.value, { art }); });
    if (!id) { i.focus(); return; }
    bogen.close();
    api.springeZu = id;
    zeichne();
  };
  const unten = el("div", "wahlreihe");
  unten.append(knopf("hinzufügen", "gross", hinzu), knopf("abbrechen", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); hinzu(); });
  zeigeBogen(f);
  i.focus();
}

/* Ein eigener Tracker: umbenennen, oder entfernen, solange nichts notiert ist. */
function eigenerTracker(id) {
  const V = verzichte(z);
  const f = faerbe(el("form", "bogen-inhalt"), V, id);
  f.append(el("p", "rubrik", V[id].aufbau ? "Zum Aufbauen" : "Eigener Tracker"), el("h2", null, V[id].name));
  const l = el("label", "frage");
  l.append(el("span", "serif", "Name"));
  const i = Object.assign(document.createElement("input"), { name: "name", value: V[id].name, autocomplete: "off", maxLength: 60 });
  l.append(i);
  f.append(l);
  /* Ab Schicht 2: eine Routine in Schritten, einer je Zeile. */
  let schritte = null;
  if (V[id].aufbau && z.tiefe >= 2) {
    const sl = el("label", "frage");
    schritte = Object.assign(document.createElement("textarea"), { name: "schritte", rows: 4, value: V[id].schritte.join("\n"),
      placeholder: "Ein Glas Wasser\nFenster auf, drei Atemzüge\n…" });
    sl.append(el("span", "serif", "Schritte, einer je Zeile"), schritte,
      el("span", "leise klein", "Klein genug, dass du sie auch an schweren Tagen schaffst. Leer lassen: ein Tippen für alles."));
    f.append(sl);
  }
  const unten = el("div", "wahlreihe");
  const speichern = () => {
    aendern(() => { benenneEigenen(z, id, i.value); if (schritte) setzeSchritte(z, id, schritte.value.split("\n")); });
    bogen.close();
  };
  unten.append(knopf("speichern", "gross", speichern));
  if (hatNotizen(z, id)) {
    f.append(el("p", "leise klein", "Dazu ist schon etwas notiert, deshalb lässt er sich nicht entfernen. Abwählen reicht: die Notizen bleiben."));
  } else {
    const weg = knopf("entfernen", "text leise", () => {
      aendern(() => entferneEigenen(z, id));
      bogen.close();
    });
    unten.append(weg);
  }
  unten.append(knopf("abbrechen", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(); });
  zeigeBogen(f);
}


/* ---- Die Einrichtung ----------------------------------------------------------

   Wer neu ist, wählt, worauf er im Oktober achtet: etwas, das er sein
   lässt, oder etwas, das er aufbaut — eins oder mehreres, wie er will.
   Dann ein Satz und „Los geht's". Alles andere öffnet sich unterwegs
   (REISE in logik.js). */

const KERN_LASSEN = FEST.map((k) => ({ fest: k }));
const KERN_AUFBAU = AUFBAU_VORSCHLAEGE.map((v) => ({ name: v.name, art: "aufbauen", schritte: v.schritte }));
const wahlName = (w) => (w.fest ? verzichte(z)[w.fest].name : w.name);
const wahlSchluessel = (w) => (w.fest ? w.fest : `${w.art}:${w.name.trim().toLowerCase()}`);

/* Auf dem iPhone speichern Safari und der Home-Bildschirm getrennt. */
const imIosBrowser = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone && !matchMedia("(display-mode: standalone)").matches;

function waehle(w) {
  const k = wahlSchluessel(w);
  if (auswahl.some((a) => a.schluessel === k)) {
    auswahl = auswahl.filter((a) => a.schluessel !== k);
  } else {
    auswahl.push({ schluessel: k, wahl: w });
  }
  zeichne();
}

function einrichtungSeite() {
  const s = el("section", "einrichtung");
  s.append(el("p", "rubrik", `Sober October · ${tagesZeile(heute())}`));

  if (bestaetigen && auswahl.length) {
    const probe = structuredClone(z);
    einrichten(probe, auswahl.map((a) => a.wahl));
    s.append(el("h1", "serif einrichtung-satz", commitmentSatz(probe)));
    if (imIosBrowser()) s.append(el("p", "leise klein einrichtung-tipp", "Tipp: erst über Teilen → „Zum Home-Bildschirm“ hinzufügen, dann dort starten."));
    const unten = el("div", "einrichtung-unten");
    unten.append(
      knopf("Los geht’s", "gross", () => {
        const wahlen = auswahl.map((a) => a.wahl);
        auswahl = []; bestaetigen = false;
        einrichtungOffen = false; wahlOffen = false;
        aendern(() => einrichten(z, wahlen));
        scrollTo(0, 0);
      }),
      knopf("zurück", "text leise", () => { bestaetigen = false; zeichne(); }),
    );
    s.append(unten);
    return s;
  }

  s.append(el("h1", "serif", "Worauf willst du im Oktober achten?"),
    el("p", "leise", "Eins reicht, mehr geht auch."));
  const gruppe = (titel, wahlen, art) => {
    const g = el("div", "kern-gruppe");
    g.append(el("h2", "rubrik", titel));
    const alle = [...wahlen, ...auswahl.map((a) => a.wahl).filter((w) => !w.fest && w.art === art && !wahlen.some((x) => wahlSchluessel(x) === wahlSchluessel(w)))];
    for (const w of alle) {
      const k = wahlSchluessel(w), an = auswahl.some((a) => a.schluessel === k);
      const zeile = el("div", "kern-zeile");
      zeile.dataset.v = w.fest || "aufbau";
      zeile.dataset.an = an;
      const b = knopf("", "kern-knopf", () => waehle(w));
      b.setAttribute("aria-pressed", an);
      b.dataset.focus = `kern-${k}`;
      b.append(el("span", "kern-haken", an ? "✓" : ""), el("span", "kern-name", wahlName(w)));
      zeile.append(b);
      g.append(zeile);
    }
    const f = el("form", "wahl-neu");
    const i = Object.assign(document.createElement("input"), { name: "kern", autocomplete: "off", maxLength: 60,
      placeholder: art === "aufbauen" ? "Etwas anderes, z. B. Lesen am Abend" : "Etwas anderes, z. B. Alkohol" });
    i.setAttribute("aria-label", art === "aufbauen" ? "Etwas anderes aufbauen" : "Etwas anderes sein lassen");
    const plus = knopf("+", "rund", () => f.requestSubmit());
    plus.setAttribute("aria-label", "Hinzufügen");
    f.append(i, plus);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!i.value.trim()) { i.focus(); return; }
      waehle({ name: i.value.trim(), art });
    });
    g.append(f);
    return g;
  };
  s.append(gruppe("Sein lassen", KERN_LASSEN, "lassen"), gruppe("Aufbauen", KERN_AUFBAU, "aufbauen"));

  const weiter = el("div", "einrichtung-weiter");
  const w = knopf(auswahl.length ? "Weiter" : "Wähl etwas aus", "gross", () => { bestaetigen = true; zeichne(); scrollTo(0, 0); });
  w.disabled = !auswahl.length;
  weiter.append(w);
  if (gewaehlt(z).length) weiter.append(knopf("bleibt, wie es ist", "text leise", () => { einrichtungOffen = false; zeichne(); }));
  s.append(weiter);
  return s;
}



/* ---- Zeichnen -------------------------------------------------------------- */

/* Die Farbwelt hängt am Wurzelelement; die Browserleiste nimmt ihr Papier mit. */
function farbeSetzen() {
  if (document.documentElement.dataset.farbe !== z.farbe) gremlin.farbenNeu();
  document.documentElement.dataset.farbe = z.farbe;
  const m = document.querySelector('meta[name="theme-color"][media*="light"]');
  if (m) m.content = FARBWELTEN[z.farbe].papier;
}

function zeichne() {
  farbeSetzen();
  const buehne = $("#buehne");
  const ansicht = einrichtungOffen || wahlOffen || !gewaehlt(z).length ? null : ANSICHT[z.ansicht] || knopfAnsicht;
  buehne.dataset.ansicht = ansicht ? z.ansicht : einrichtungOffen ? "einrichtung" : "wahl";
  // Gleiche Aktion bleibt nach dem Neuzeichnen per Tastatur erreichbar.
  const fokus = document.activeElement;
  const innerhalb = buehne.contains(fokus);
  const schluessel = fokus?.dataset.focus;
  const name = fokus?.getAttribute("aria-label") || fokus?.textContent;
  if (!ansicht) buehne.replaceChildren(einrichtungOffen ? einrichtungSeite() : wahlSeite());
  else {
    const inhalt = seite === "monat" ? monatSeite(api) : seite === "tagebuch" ? tagebuchSeite(api)
      : seite === "mehr" ? (detail ? funktionSeite(api, detail) : mehrSeite(api)) : ansicht.render(api);
    buehne.replaceChildren(inhalt, leiste(api, seite));
  }
  buehne.dataset.seite = ansicht ? seite : "";
  gremlin.pruefen();
  if (letzteStufe === null) letzteStufe = gremlinStufe(z, heute()).n;
  if (innerhalb) {
    const ziel = schluessel
      ? [...buehne.querySelectorAll("[data-focus]")].find((e) => e.dataset.focus === schluessel)
      : [...buehne.querySelectorAll("button")].find((e) => (e.getAttribute("aria-label") || e.textContent) === name);
    ziel?.focus({ preventScroll: true });
  }
}

/* Ein neuer Tag, während die App offen stand: beim Zurückkommen neu zeichnen. */
let zuletzt = heute();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (heute() !== zuletzt) { zuletzt = heute(); zeichne(); }
  aktualisieren();
});
/* Die Gruppe: einmal die Minute nachsehen, solange die Seite zu sehen ist. */
setInterval(() => { if (document.visibilityState === "visible") aktualisieren(); }, 60 * 1000);
/* Ein anderer Tab hat gespeichert. */
addEventListener("storage", (e) => { if (e.key === "sober-october") { z = laden(); zeichne(); } });

/* Baustein „Abends ruhiger" — dezent: nach Sonnenuntergang wird das Papier eine Spur
   dunkler und die Schrift eine Spur weicher, ab 22 Uhr noch eine Spur mehr.
   Kein Umschalten ins Dunkle; wer dunkel will, stellt das System um. */
function tageszeitSetzen() {
  const d = new Date();
  const zeit = aktiv(z, "abends") ? tageszeit(heute(), d.getHours() * 60 + d.getMinutes()) : "tag";
  document.documentElement.dataset.tageszeit = zeit;
}
tageszeitSetzen();
setInterval(tageszeitSetzen, 5 * 60 * 1000);

/* Der Service Worker macht die App vom Homescreen aus startfähig, auch
   ohne Netz. Er ist Beiwerk: geht die Anmeldung schief, läuft alles genauso
   weiter — nur eben online. */
if (navigator.serviceWorker && location.protocol !== "file:")
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));

zeichne();
aktualisieren().then(planeAbgleich);
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("bereit")));
