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
  REISE, offen, reiseWeiter, reiseStand, einrichten,
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
import { monatBlatt } from "./bausteine/monat.js";
import { faerbe, wasText } from "./ansichten/teile.js";
import * as blattAnsicht from "./ansichten/blatt.js";
import * as fadenAnsicht from "./ansichten/faden.js";

const ANSICHT = { knopf: knopfAnsicht, blatt: blattAnsicht, faden: fadenAnsicht };

let z = laden();
let wahlOffen = !gewaehlt(z).length;
/* Die Einrichtung: wer neu ist, wählt zuerst genau einen Kern. `kernWahl`
   ist, was gerade angetippt ist, bevor es mit „Los geht's" gilt. */
let einrichtungOffen = !gewaehlt(z).length && !offen(z, "tracker");
let kernWahl = null;

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
  const neu = gewaehlt(z).length ? reiseWeiter(z) : [];
  if (!sichern(z)) melde("Auf diesem Gerät lässt sich gerade nichts speichern.");
  zeichne();
  planeAbgleich();
  gremlinNachStufe();
  if (neu.length) setTimeout(() => reiseZeigen(neu), 1600);
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

/** Eine Meldung, an die der Satz zur Stufe angehängt wird, wenn es einen gibt. */
const mitMoment = (text, m) => (m?.satz ? (text ? `${text} ${m.satz}` : m.satz) : text);

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
  /* „Heute bin ich dabei": der Knopf unter dem Monat. Ein zweites Tippen
     schaltet nicht still zurück — vertippt ist selten, und ein Tag, der
     einfach wieder verschwindet, fühlt sich schlecht an. Zurück geht es über
     „Rückgängig" in der Meldung. Steht heute schon eine Notiz, zählt der
     Tag ohnehin; dann gibt es nichts zu tun, nur das zu sagen. */
  da() {
    const t = heute();
    const zurueck = ["Rückgängig", () => { aendern(() => schalteDa(z, t)); melde("Zurückgenommen."); }];
    if (hatEintrag(z, t)) {
      spueren(8);
      if (istDa(z, t) && !vonTag(z, t).length) melde("Heute zählt schon.", [zurueck]);
      else melde("Heute zählt schon — durch deine Notiz.");
      return;
    }
    const m = aendern(() => schalteDa(z, t));
    gremlin.freut(1, document.querySelector(".da-knopf"));
    melde(mitMoment("Du bist dabei. Der Tag zählt.", m), [["Wie geht’s dir?", () => tagEinordnen()], zurueck]);
  },
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
  gremlinTag(t) { aendern(() => setzeFuetterungstag(z, t)); if (t !== null) melde(`Sein Tag ist der ${WOCHENTAGE[t]}. Bis dahin: Sitz.`); },
  gremlinFutterHinzu(was) { aendern(() => futterHinzu(z, was)); },
  gremlinFutterWeg(i) { aendern(() => futterWeg(z, i)); },
  gremlinFuettern(was) {
    let ok = false;
    aendern(() => { ok = fuettern(z, heute(), was); });
    if (!ok) return;
    gremlin.sagt("fuetterung");
    melde(was ? `Gefüttert: ${was}. Bewusst, an seinem Tag.` : "Nicht hungrig. Dann nächste Woche — nicht vorher.");
  },
  zeitHeuteSetzen(v, m) {
    const vorher = freiAm(z, heute());
    const mo = aendern(() => schreibeTag(z, heute(), { zeit: { [v]: m } }));
    const jetzt = freiAm(z, heute());
    if (jetzt !== null && jetzt !== vorher) {
      spueren(jetzt > (vorher || 0) ? 14 : 8);
      document.querySelector(".lz-zahl")?.classList.add("hoch");
    }
    melde(mitMoment(jetzt ? `Heute frei geworden: ${dauer(jetzt)}${mo?.heuteNeu ? " Der Tag zählt." : ""}` : "Notiert.", mo));
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
    const fertig = schritteGetan(z, heute(), v).size === V.schritte.length;
    if (an) { spueren(m?.heuteNeu ? 14 : 8); gremlin.freut(vonTag(z, heute()).length, document.querySelector(`[data-focus="schritt-${v}-${i}"]`)); }
    melde(mitMoment(an ? (fertig ? `${V.name}: alle Schritte getan.` : `${V.schritte[i]} — getan.`) + (m?.heuteNeu ? " Der Tag zählt." : "") : "Zurückgenommen.", m));
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
  monatZeigen: () => monatZeigen(),
  eintragenMenue: () => eintragenMenue(),
  tagAntippen(tag) {
    if (tag > heute()) { melde(`${tagesKopf(tag)} kommt noch.`); return; }
    tagEinordnen(tag, { ausKalender: true });
  },
  getragen: () => z.tagebuch[heute()]?.getragen || "",
  getragenSetzen(text) {
    const m = aendern(() => schreibeTag(z, heute(), { getragen: text }));
    melde(mitMoment(z.tagebuch[heute()]?.getragen ? `Im Tagebuch.${m?.heuteNeu ? " Der Tag zählt." : ""}` : "Satz entfernt.", m));
  },
  tagebuchZeilen: () => tagebuchZeilen(z, heute()),
  stimmungWort: (n) => STIMMUNG[n - 1],
  stimmungHeute: () => z.tagebuch[heute()]?.stimmung || 0,
  gesicht: (n) => GESICHTER[n - 1],
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
    melde(`Willkommen zurück, ${name}. Dieses Gerät geht jetzt mit.`);
  },
  alleinBleiben() {
    aendern(() => schalteBaustein(z, "gemeinsam", false));
    melde("Du gehst allein. In den Einstellungen (⋯) kannst du jederzeit mitgehen.");
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
  if (f && f.matches("#buehne input")) return;
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
    melde(`Du gehst mit, ${p.name}. Schön, dass du da bist.`);
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
    setTimeout(() => { gremlin.pruefen(); melde(text); }, 2600);
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
    melde(mitMoment(`Dämon gefrühstückt.${m?.heuteNeu ? " Der Tag zählt." : ""}`, m));
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

/* Schnell loggen: ein Tippen notiert sofort, ohne Fragen. Die Meldung
   danach bietet zweierlei an — die Fragen, wenn man will, und das
   Zurücknehmen, falls man sich vertippt hat. Beides ist freiwillig; tut man
   nichts, bleibt der Eintrag, wie er ist. */
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
      melde(`${V.name}: zurückgenommen.`);
      return;
    }
  }
  let neu = [], id = null;
  const m = aendern(() => {
    neu = notiere(z, { tag: heute(), zeit: jetztZeit(), verzicht: v, art });
    id = z.ereignisse.at(-1).id;
  });
  document.querySelector(`[data-focus="${art === "getan" ? "habe" : art}-${v}"]`)?.classList.add("tipp");
  if (!m?.heuteNeu) spueren(8);
  if (art === "drang") gremlin.sagt(gremlinStufe(z, heute()).n >= 4 && !gremlinStufe(z, heute()).fuetterungstag ? "sitz" : "drang");
  else if (art === "habe") gremlin.sagt("geschehen");
  else gremlin.freut(vonTag(z, heute()).length, document.querySelector(`[data-focus="habe-${v}"]`));
  const text = `${art === "getan" ? `Getan: ${V.name}.` : `Notiert: ${art === "habe" ? V.habe : V.drang}.`}${m?.heuteNeu ? " Der Tag zählt." : ""}`;
  const zurueck = ["Rückgängig", () => { aendern(() => entferne(z, id)); melde("Zurückgenommen."); }];
  const details = ["Details", () => fragen(v, art, art === "habe" ? V.habe : V.drang, id)];
  melde(mitMoment(ebenenText(neu, text), m), art === "getan" ? []
    : art === "drang" && ab(z, 2) ? [["Werkzeug", () => W.menue(id)], details, zurueck]
    : [details, zurueck]);
}

const ebenenText = (neu, text) =>
  aktiv(z, "ebenen") && neu.length ? `${text} Eine Ebene hat sich geöffnet: ${neu.map((e) => e.titel).join(", ")}.` : text;

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
    melde(ebenenText(neu, "Details sind dabei."));
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

/* ---- Der Check-in ------------------------------------------------------------

   Minimale Reibung, maximale Freiheit: oben fünf Gesichter für die
   Stimmung — ein Tippen, und es ist festgehalten. Darunter eine Reihe
   Symbole; jedes blendet eine weitere Eingabe ein (ein Satz, Schlaf,
   Bewegung …). Was man einmal eingeblendet hat, ist beim nächsten Mal
   von selbst offen (`z.checkin`), was an dem Tag schon Werte hat, auch.
   Alles speichert sofort; es gibt keinen Speichern-Knopf, nur „Fertig".
   Alles freiwillig, alles bleibt auf dem Gerät. */
const GESICHTER = ["😣", "🙁", "😐", "🙂", "😄"];

function tagEinordnen(tag, { ausKalender = false } = {}) {
  const t = tag || heute();
  const istHeute = t === heute();
  const vorher = () => z.tagebuch[t] || {};
  const k = el("div", "bogen-inhalt checkin");
  k.append(el("p", "rubrik", `${tagesKopf(t)} · Check-in`), el("h2", null, istHeute ? "Wie geht’s dir?" : "Wie ging’s dir an dem Tag?"));

  /* Speichern, still. Wird der Tag dadurch gezählt, sagt es die Meldung. */
  const sichereTag = (was) => {
    const m = aendern(() => schreibeTag(z, t, was));
    if (m?.heuteNeu) melde(mitMoment("Der Tag zählt.", m));
  };

  /* Aus dem Kalender: was an dem Tag notiert ist. */
  const notizen = vonTag(z, t).filter((e) => e.art !== "ohne");
  if (ausKalender && notizen.length) {
    const l = el("ul", "tag-notizen");
    for (const e of notizen) l.append(faerbe(el("li", null, `${e.zeit} · ${wasText(api, e)}`), verzichte(z), e.verzicht));
    k.append(l);
  }
  /* Ein vergangener Tag — oder aus dem Kalender: dabei gewesen? */
  if (!istHeute || ausKalender) {
    const l = el("label", "baustein");
    const da = Object.assign(document.createElement("input"), { type: "checkbox", checked: istDa(z, t) });
    da.addEventListener("change", () => {
      const m = aendern(() => { if (da.checked !== istDa(z, t)) schalteDa(z, t); });
      if (m?.heuteNeu) melde(mitMoment("Der Tag zählt.", m));
    });
    const tx = el("span", "baustein-text");
    tx.append(el("span", null, istHeute ? "Heute bin ich dabei" : "An dem Tag war ich dabei"),
      el("span", "leise klein", notizen.length ? "Der Tag zählt schon durch deine Notiz." : "Er zählt dann wie jeder andere — für dich und in der Gruppe."));
    l.append(da, tx);
    k.append(l);
  }

  /* Die Stimmung: fünf Gesichter, ein Tippen; dasselbe noch einmal nimmt es weg. */
  const gesichter = el("div", "gesichter");
  gesichter.setAttribute("role", "radiogroup");
  gesichter.setAttribute("aria-label", "Stimmung");
  const zeigeStimmung = () => gesichter.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-checked", vorher().stimmung === i + 1));
  GESICHTER.forEach((g, i) => {
    const b = knopf(g, "gesicht", () => {
      sichereTag({ werte: { stimmung: vorher().stimmung === i + 1 ? 0 : i + 1 } });
      spueren(8);
      zeigeStimmung();
    });
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", `Stimmung: ${STIMMUNG[i]}`);
    gesichter.append(b);
  });
  zeigeStimmung();
  k.append(gesichter);

  /* Die Symbole, und darunter die eingeblendeten Eingaben. */
  const symbole = el("div", "checkin-symbole");
  symbole.setAttribute("aria-label", "Mehr festhalten");
  const felder = el("div", "checkin-felder");
  const offenIds = new Set([...z.checkin, ...CHECKIN_MODULE.filter((m) => hatWert(m, vorher())).map((m) => m.id)]);
  const bauen = {};
  for (const mod of CHECKIN_MODULE) {
    const b = knopf("", "checkin-symbol", () => {
      const an = !offenIds.has(mod.id);
      if (an) offenIds.add(mod.id); else offenIds.delete(mod.id);
      aendern(() => { z.checkin = CHECKIN_MODULE.map((m) => m.id).filter((id) => offenIds.has(id)); });
      zeichneFelder();
      if (an) felder.querySelector(`[data-modul="${mod.id}"] input`)?.focus({ preventScroll: true });
    });
    b.dataset.modul = mod.id;
    b.append(el("span", "checkin-icon", mod.icon), el("span", "checkin-wort", mod.name));
    symbole.append(b);
    bauen[mod.id] = () => modulFeld(mod, t, vorher, sichereTag);
  }
  const zeichneFelder = () => {
    symbole.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", offenIds.has(b.dataset.modul)));
    felder.replaceChildren(...CHECKIN_MODULE.filter((m) => offenIds.has(m.id)).map((m) => bauen[m.id]()));
  };
  zeichneFelder();
  k.append(el("p", "rubrik checkin-mehr", "Mehr festhalten"), symbole, felder);

  const unten = el("div", "wahlreihe");
  unten.append(knopf("Fertig", "gross", () => bogen.close()));
  k.append(unten, el("p", "leise klein", "Wird sofort gespeichert. Nur auf diesem Gerät."));
  zeigeBogen(k);
}

/* Was sich im Check-in einblenden lässt. Jedes Modul ist ein System aus
   logik.js (fünf Stufen), der Satz zum Tag oder die Selbst-Markierungen. */
const CHECKIN_MODULE = [
  { id: "satz", icon: "✏️", name: "Ein Satz" },
  { id: "schlaf", icon: "🌙", name: "Schlaf" },
  { id: "bewegung", icon: "🏃", name: "Bewegung" },
  { id: "ernaehrung", icon: "🥗", name: "Ernährung" },
  { id: "verdauung", icon: "🌿", name: "Verdauung" },
  { id: "antrieb", icon: "⚡", name: "Antrieb" },
  { id: "motivation", icon: "🎯", name: "Motivation" },
  { id: "lust", icon: "💗", name: "Lust" },
  { id: "selbst", icon: "✨", name: "Selbst" },
];

const hatWert = (m, e) => (m.id === "satz" ? !!e.getragen : m.id === "selbst" ? !!e.selbst?.length : !!e[m.id]);

function modulFeld(mod, t, vorher, sichereTag) {
  const istHeute = t === heute();
  if (mod.id === "satz") {
    const l = el("label", "frage ebene-frage");
    l.dataset.modul = mod.id;
    l.style.setProperty("--c", "var(--magenta)");
    const g = Object.assign(document.createElement("input"), { name: "getragen", value: vorher().getragen || "", autocomplete: "off", maxLength: 280,
      placeholder: "Der Kaffee mit Ben, der Spaziergang …", enterKeyHint: "done" });
    g.addEventListener("change", () => sichereTag({ getragen: g.value }));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); g.blur(); } });
    l.append(el("span", "serif", istHeute ? "Was hat dich heute getragen?" : "Was hat dich an dem Tag getragen?"), g);
    return l;
  }
  if (mod.id === "selbst") {
    const fs = el("fieldset", "frage ebene-frage");
    fs.dataset.modul = mod.id;
    fs.style.setProperty("--c", "var(--lila)");
    fs.append(el("legend", "serif", istHeute ? "Was hat sich heute gezeigt?" : "Was hat sich an dem Tag gezeigt?"), el("p", "leise klein", `Höchstens ${SELBST_MAX === 2 ? "zwei" : SELBST_MAX}.`));
    const chips = el("span", "chips");
    SELBST.forEach((wort, i) => {
      const c = el("label", "chip");
      c.style.setProperty("--c", "var(--lila)");
      c.append(Object.assign(document.createElement("input"), { type: "checkbox", value: String(i), checked: (vorher().selbst || []).includes(i) }), el("span", null, wort));
      chips.append(c);
    });
    const sperren = () => {
      const n = chips.querySelectorAll("input:checked").length;
      for (const i of chips.querySelectorAll("input")) i.disabled = !i.checked && n >= SELBST_MAX;
    };
    chips.addEventListener("change", () => {
      sperren();
      sichereTag({ selbst: [...chips.querySelectorAll("input:checked")].map((i) => Number(i.value)) });
    });
    sperren();
    fs.append(chips);
    return fs;
  }
  /* Ein System: fünf Stufen zwischen zwei Polen. Ein Tippen wählt, ein
     zweites auf dieselbe Stufe nimmt sie weg. */
  const x = SYSTEME.find((y) => y.id === mod.id);
  const fs = el("div", "frage ebene-frage systeme");
  fs.dataset.modul = mod.id;
  fs.style.setProperty("--c", GRUPPEN[x.gruppe].farbe);
  const reihe = el("div", "system");
  reihe.setAttribute("role", "radiogroup");
  reihe.setAttribute("aria-label", `${x.name}: von ${x.pole[0]} bis ${x.pole[1]}`);
  reihe.append(el("span", "system-name", x.name));
  const stufen = el("span", "system-stufen");
  for (let n = 1; n <= STUFEN; n++) {
    const l = el("label", "stufe");
    const inp = Object.assign(document.createElement("input"), { type: "radio", name: x.id, value: String(n), checked: vorher()[x.id] === n });
    inp.setAttribute("aria-label", `${x.name} ${n} von ${STUFEN}${n === 1 ? `, ${x.pole[0]}` : n === STUFEN ? `, ${x.pole[1]}` : ""}`);
    inp.addEventListener("click", () => {
      const weg = vorher()[x.id] === n;
      if (weg) inp.checked = false;
      sichereTag({ werte: { [x.id]: weg ? 0 : n } });
    });
    l.style.setProperty("--w", `${Math.round(25 + (n / STUFEN) * 75)}%`);
    l.append(inp, el("span", "stufe-kreis"));
    stufen.append(l);
  }
  const pole = el("span", "system-pole");
  pole.append(el("span", null, x.pole[0]), el("span", null, x.pole[1]));
  reihe.append(stufen, pole);
  fs.append(reihe);
  return fs;
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
    if (neu) melde("Dein Leitgedanke gilt ab heute.");
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
  k.append(el("p", "rubrik", "Einstellungen"), el("h2", null, commitmentSatz(z)),
    offen(z, "tracker")
      ? knopf("Tracker wählen oder hinzufügen", "text", () => { bogen.close(); wahlOffen = true; zeichne(); })
      : knopf("Anders anfangen: den Kern neu wählen", "text", () => { bogen.close(); kernWahl = null; einrichtungOffen = true; zeichne(); }));

  const r = reiseKarte();
  if (r) k.append(r);
  if (offen(z, "tiefe2")) k.append(tiefeWahl("einst-tiefe"));

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

  let gruppe = null, feld = null;
  for (const b of BAUSTEINE.filter((x) => x.schicht <= z.tiefe && offen(z, x.id))) {
    if (b.gruppe !== gruppe) {
      gruppe = b.gruppe;
      feld = el("fieldset", "frage bausteine");
      feld.append(el("legend", "serif", gruppe === "Darstellung" ? "Darstellung" : `Bausteine · ${gruppe}`));
      k.append(feld);
    }
    const l = el("label", "baustein");
    const i = Object.assign(document.createElement("input"), { type: "checkbox", checked: aktiv(z, b.id) });
    i.addEventListener("change", () => {
      aendern(() => schalteBaustein(z, b.id, i.checked));
      if (b.id === "abends") tageszeitSetzen();
      if (b.id === "gemeinsam" && i.checked) aktualisieren();
      const y = bogen.scrollTop;
      const index = [...bogen.querySelectorAll(".baustein input")].indexOf(i);
      einstellungen();
      bogen.querySelectorAll(".baustein input")[index]?.focus({ preventScroll: true });
      bogen.scrollTop = y;
    });
    const t = el("span", "baustein-text");
    t.append(el("span", null, b.titel), el("span", "leise klein", b.text));
    l.append(i, t);
    feld.append(l);
    if (b.id === "leitgedanke" && aktiv(z, b.id))
      feld.append(knopf("Leitgedanken ändern", "text klein baustein-mehr", () => leitgedankeBearbeiten()));
    if (b.id === "gemeinsam" && z.gemeinsam) {
      const weg = knopf(`Du gehst als ${z.gemeinsam.name} mit. Die Gruppe verlassen`, "text klein baustein-mehr", () => {
        if (!weg.dataset.sicher) { weg.dataset.sicher = "1"; weg.textContent = "Wirklich? Name und Tage werden vom Server gelöscht. Noch einmal tippen."; return; }
        gruppeVerlassen();
      });
      feld.append(weg);
    }
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
  daten.append(weg);
  k.append(daten, knopf("schließen", "gross leise", () => bogen.close()));
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
    if (id) { melde(`${verzichte(z)[id].name} ist dabei.`); $(".wahl-neu input")?.focus(); }
  });
  s.append(neu);

  s.append(aufbauWahl());
  if (offen(z, "tiefe2")) s.append(tiefeWahl("wahl-tiefe"));

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
  f.addEventListener("submit", (e) => { e.preventDefault(); let id = null; aendern(() => { id = fuegeEigenenHinzu(z, i.value, { art: "aufbauen" }); }); if (id) melde(`${verzichte(z)[id].name} ist dabei.`); });
  k.append(r, f);
  return k;
}

/* Wie tief? Drei Karten, eine gewählt; wirkt sofort. */
function tiefeWahl(klasse) {
  const fs = el("fieldset", `frage ${klasse}`);
  fs.append(el("legend", "serif", "Wie tief willst du gehen?"));
  for (const t of TIEFEN.filter((x) => x.n === 1 || offen(z, `tiefe${x.n}`))) {
    const l = el("label", "ansicht-option tiefe-option");
    const i = Object.assign(document.createElement("input"), { type: "radio", name: `tiefe-${klasse}`, value: String(t.n), checked: z.tiefe === t.n });
    i.addEventListener("change", () => { aendern(() => { z.tiefe = t.n; }); if (bogen.open) einstellungen(); });
    l.dataset.tiefe = t.n;
    l.append(i, el("span", "serif", `${t.n} · ${t.name}`), el("span", "leise klein", t.text));
    fs.append(l);
  }
  fs.append(el("p", "leise klein", "Jede Schicht nimmt die vorigen mit. Du kannst jederzeit wechseln; nichts geht verloren."));
  return fs;
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
    melde(`${verzichte(z)[id].name} ist dabei.`);
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
      melde(`${V[id].name} ist entfernt.`);
    });
    unten.append(weg);
  }
  unten.append(knopf("abbrechen", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(); });
  zeigeBogen(f);
}

/* ---- Eintragen ------------------------------------------------------------

   Das „+" oben: alles, was sich festhalten lässt, an einer Stelle — egal,
   wie weit die Reise ist. Die Reise entscheidet, was auf dem Startschirm
   steht, nicht, was man eintragen darf. Was man hier benutzt, zählt für
   die Reise wie überall sonst. */
function eintragenMenue() {
  const k = el("div", "bogen-inhalt eintragen-menue");
  k.append(el("p", "rubrik", tagesZeile(heute())), el("h2", null, "Eintragen"));
  const liste = el("div", "eintragen-liste");
  const punkt = (titel, text, tun, farbe) => {
    const b = knopf("", "eintragen-punkt", () => { bogen.close(); tun(); });
    if (farbe) b.style.setProperty("--c", farbe);
    b.append(el("span", "eintragen-titel", titel));
    if (text) b.append(el("span", "leise klein", text));
    liste.append(b);
  };
  const t = heute(), V = verzichte(z);
  if (!hatEintrag(z, t)) punkt("Heute bin ich dabei", "Der Tag zählt.", () => api.da(), "var(--moss)");
  for (const v of gewaehlt(z)) {
    const farbe = V[v].farbe || `var(--${{ kaffee: "gelb", kippe: "blau", video: "lila" }[v] || "moss"})`;
    if (V[v].aufbau) punkt(`${V[v].name} — getan`, null, () => eintragen(v, "getan"), farbe);
    else {
      punkt(V[v].habe, V[v].name, () => eintragen(v, "habe"), farbe);
      punkt(V[v].drang, "Ein Moment, in dem du gern würdest", () => eintragen(v, "drang"), farbe);
    }
  }
  punkt("Check-in", "Wie geht’s dir? Ein Tippen — und mehr, wenn du magst", () => tagEinordnen(t), "var(--magenta)");
  punkt("Einen anderen Tag", "Im Monat nachtragen oder ansehen", () => monatZeigen(), "var(--leise)");
  punkt("Weiterer Tracker", "Etwas sein lassen oder aufbauen", () => neuerTracker(), "var(--leise)");
  punkt("Leitgedanke", "Ein Satz, der dich begleitet", () => leitgedankeBearbeiten(), "var(--leise)");
  k.append(liste, knopf("schließen", "text leise", () => bogen.close()));
  zeigeBogen(k);
}

/* Der ganze Monat als Blatt; ein Wechsel der Ebene zeichnet es neu. */
function monatZeigen() {
  zeigeBogen(monatBlatt(api, () => monatZeigen()));
}

/* ---- Die Einrichtung ----------------------------------------------------------

   Wer neu ist, wählt genau eine Sache: etwas, das er im Oktober sein lässt,
   oder etwas, das er aufbaut. Mehr braucht der erste Tag nicht; alles
   andere öffnet sich unterwegs (REISE in logik.js). Zwei Schritte: wählen,
   dann sehen, wie es losgeht. Erst „Los geht's" schreibt den Kern. */

const KERN_LASSEN = FEST.map((k) => ({ fest: k }));
const KERN_AUFBAU = AUFBAU_VORSCHLAEGE.map((v) => ({ name: v.name, art: "aufbauen", schritte: v.schritte }));

/* Auf dem iPhone speichern Safari und der Home-Bildschirm getrennt: was im
   Browser notiert ist, fehlt in der App. Deshalb der Hinweis, bevor es losgeht. */
const imIosBrowser = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone && !matchMedia("(display-mode: standalone)").matches;

function einrichtungSeite() {
  const s = el("section", "einrichtung");
  s.append(el("p", "rubrik", `Sober October · ${tagesZeile(heute())}`));
  if (!kernWahl) {
    s.append(el("h1", "serif", "Worauf willst du im Oktober achten?"),
      el("p", "leise", "Such dir eine Sache aus. Mehr kommt mit der Zeit dazu."));
    const gruppe = (titel, wahlen, art) => {
      const g = el("div", "kern-gruppe");
      g.append(el("h2", "rubrik", titel));
      for (const w of wahlen) {
        const name = w.fest ? verzichte(z)[w.fest].name : w.name;
        const b = knopf(name, "kern-knopf", () => { kernWahl = w; zeichne(); scrollTo(0, 0); });
        if (w.fest) b.dataset.v = w.fest; else b.dataset.v = "aufbau";
        b.dataset.focus = `kern-${name}`;
        g.append(b);
      }
      const f = el("form", "wahl-neu");
      const i = Object.assign(document.createElement("input"), { name: "kern", autocomplete: "off", maxLength: 60,
        placeholder: art === "aufbauen" ? "Etwas anderes, z. B. Lesen am Abend" : "Etwas anderes, z. B. Alkohol" });
      i.setAttribute("aria-label", art === "aufbauen" ? "Etwas anderes aufbauen" : "Etwas anderes sein lassen");
      i.enterKeyHint = "next";
      const weiter = knopf("→", "rund", () => f.requestSubmit());
      weiter.setAttribute("aria-label", "Weiter");
      f.append(i, weiter);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!i.value.trim()) { i.focus(); return; }
        kernWahl = { name: i.value, art };
        zeichne();
        scrollTo(0, 0);
      });
      g.append(f);
      return g;
    };
    s.append(gruppe("Sein lassen", KERN_LASSEN, "lassen"), gruppe("Aufbauen", KERN_AUFBAU, "aufbauen"));
    if (gewaehlt(z).length) s.append(knopf("bleibt, wie es ist", "text leise", () => { einrichtungOffen = false; zeichne(); }));
    return s;
  }

  const probe = structuredClone(z);
  einrichten(probe, kernWahl);
  const aufbau = !kernWahl.fest && kernWahl.art === "aufbauen";
  s.append(el("h1", "serif", commitmentSatz(probe)),
    el("p", "einrichtung-so", aufbau
      ? "So geht es los: Jeden Tag, an dem du es tust, ein Tippen auf „getan“. Und an jedem Tag ein Tippen auf „Heute bin ich dabei“."
      : "So geht es los: Jeden Tag ein Tippen auf „Heute bin ich dabei“. Passiert es doch, notierst du es — auch das zählt den Tag. Kein Urteil."));

  const reise = el("ol", "reise-liste");
  const start = el("li");
  start.dataset.stand = "jetzt";
  start.append(el("span", "reise-titel", "Der Monat und dein Kern"), el("span", "reise-tag", "jetzt"));
  reise.append(start);
  for (const r of REISE) {
    const li = el("li");
    li.append(el("span", "reise-titel", r.titel), el("span", "reise-tag", r.wann));
    reise.append(li);
  }
  s.append(el("h2", "rubrik", "Was sich durch Benutzen öffnet"), reise);

  if (imIosBrowser()) {
    const tipp = el("div", "einrichtung-tipp");
    tipp.append(el("strong", null, "Tipp fürs iPhone"),
      el("span", null, "Leg die App zuerst auf den Home-Bildschirm (Teilen → „Zum Home-Bildschirm“) und fang dort an. Safari und Home-Bildschirm speichern getrennt."));
    s.append(tipp);
  }

  const unten = el("div", "einrichtung-unten");
  unten.append(
    knopf("Los geht’s", "gross", () => {
      const w = kernWahl;
      kernWahl = null;
      einrichtungOffen = false;
      wahlOffen = false;
      aendern(() => einrichten(z, w));
      scrollTo(0, 0);
    }),
    knopf("anders wählen", "text leise", () => { kernWahl = null; zeichne(); }),
  );
  s.append(unten, el("p", "leise klein", "Was du notierst, bleibt auf diesem Gerät."));
  return s;
}

/* Die Reise in den Einstellungen: was schon offen ist, was als Nächstes kommt. */
function reiseKarte() {
  const st = reiseStand(z);
  if (!st.naechste) return null;
  const k = el("div", "frage reise-karte");
  k.append(el("p", "serif", "Deine Reise"),
    el("p", "leise klein", "Was du benutzt, öffnet das Nächste."));
  const l = el("ol", "reise-liste");
  REISE.forEach((r, i) => {
    const li = el("li");
    li.dataset.stand = i < z.reise ? "offen" : i === z.reise ? "naechste" : "zu";
    li.append(el("span", "reise-titel", r.titel), el("span", "reise-tag", i < z.reise ? "✓ offen" : r.wann));
    l.append(li);
  });
  k.append(l, el("p", "leise klein", st.noch));
  return k;
}

/* Eine Station ist erreicht: einmal sagen, was jetzt da ist. */
function reiseZeigen(neu) {
  if (bogen.open) { bogen.addEventListener("close", () => setTimeout(() => reiseZeigen(neu), 300), { once: true }); return; }
  const k = el("div", "bogen-inhalt reise-neu");
  const st = reiseStand(z);
  k.append(el("p", "rubrik", "Deine Reise"));
  for (const r of neu) k.append(el("h2", null, r.titel), el("p", "serif", r.text));
  if (st.naechste) k.append(el("p", "leise klein", st.noch));
  k.append(knopf("Schön", "gross", () => bogen.close()));
  zeigeBogen(k);
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
  buehne.replaceChildren(ansicht ? ansicht.render(api) : einrichtungOffen ? einrichtungSeite() : wahlSeite());
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
