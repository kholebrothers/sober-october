/* Der Monat — das Herz der Seite, in jeder Ansicht oben.

   Der Oktober als Kalender, darunter ein Knopf: „Heute bin ich dabei".
   Ein Tippen, und das Feld des Tages füllt sich. Das ist die Handlung, die
   sich gut anfühlen soll — nicht das Notieren eines Konsums. Jede Notiz
   zählt den Tag genauso; dann steht der Knopf schon auf „Heute zählt".

   Ein vergangener Tag ohne Eintrag ist ein leeres Feld: nichts bekannt,
   kein Urteil. Kein Rot, kein Kreuz. */

import { el, knopf } from "../ansichten/teile.js";

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/* Durch welche Ebene der Monat gerade gelesen wird. Eine Ansichtssache
   dieses Geräts, kein Datum: sie steht neben dem Zustand, nicht darin. */
const MERK = "sober-october.schicht";
let schicht = (() => { try { return localStorage.getItem(MERK) || "dabei"; } catch { return "dabei"; } })();
const STAND_WORT = { dabei: "dabei", leer: "nichts notiert", offen: "heute, noch offen", kommt: "kommt noch" };

export function monat(api) {
  const m = api.monat();
  const s = el("section", "monat");
  s.setAttribute("aria-label", "Dein Commitment");
  s.dataset.katze = "wand";   // Gelände für den Gremlin (begleiter/welt.js)
  s.dataset.schicht = "dabei";

  /* Oben das Commitment: der Satz, die Zahl, die Woche. Den ganzen Monat
     gibt es auf Antippen. Der Tag selbst steht darunter (heute()). */
  s.append(el("p", "monat-commitment serif", api.commitmentSatz()), kopf(m), woche(api, m));

  return s;
}

/* Die Tage als Knöpfe im Raster, gefärbt durch die gewählte Ebene. */
function tage(api, zellen, S) {
  const gitter = el("div", "monat-gitter");
  for (const w of WOCHENTAGE) gitter.append(el("span", "monat-wt", w));
  for (const c of zellen) {
    const t = c.art === "rand" ? el("span", "monat-tag", "")
      : c.stand === "kommt" ? el("span", "monat-tag", String(c.nr))
      : knopf(String(c.nr), "monat-tag", () => api.tagAntippen(c.tag));
    t.dataset.stand = c.stand;
    t.dataset.art = c.art;
    if (c.heute) t.dataset.heute = "";
    if (S.id !== "dabei" && c.art !== "rand" && c.stand !== "kommt") {
      const w = api.schichtWert(S.id, c.tag);
      if (w > 0) { t.dataset.w = ""; t.style.setProperty("--w", `${Math.round(25 + w * 75)}%`); if (w > 0.6) t.dataset.voll = ""; }
    }
    if (c.art !== "rand") {
      t.setAttribute("aria-label", `${c.nr}. ${c.art === "okt" ? "Oktober" : "September"}: ${STAND_WORT[c.stand]}`);
      t.dataset.focus = `tag-${c.tag}`;
    }
    gitter.append(t);
  }
  gitter.setAttribute("role", "group");
  return gitter;
}

/* Die Woche von heute — eine Reihe statt des ganzen Monats. Daneben der
   Weg zum Monat. */
function woche(api, m) {
  const i = Math.max(0, m.zellen.findIndex((c) => c.heute));
  const start = m.zellen.some((c) => c.heute) ? i - (i % 7) : Math.max(0, m.zellen.length - 7);
  const w = el("div", "woche-streifen");
  const g = tage(api, m.zellen.slice(start, start + 7), { id: "dabei" });
  g.setAttribute("aria-label", "Diese Woche");
  const mehr = knopf("Ganzer Monat ›", "text klein woche-monat", () => api.seite("monat"));
  mehr.dataset.focus = "monat-zeigen";
  w.append(g, mehr);
  return w;
}

/* Der ganze Monat: jeder Tag antippbar, die Etappe, ab Schicht 3 durch jede
   Ebene lesbar. `neu` zeichnet nach einem Wechsel der Ebene neu. */
export function monatInhalt(api, neu) {
  const m = api.monat();
  const schichten = api.schichten();
  const S = (api.ab(3) && schichten.find((x) => x.id === schicht)) || schichten[0];
  const s = el("section", "monat monat-blatt");
  s.dataset.schicht = S.id;
  s.style.setProperty("--schicht", S.farbe);
  s.append(kopf(m), etappe(api));
  if (api.ab(3)) s.append(ebenenWahl(api, schichten, S, neu));
  const g = tage(api, m.zellen, S);
  g.setAttribute("aria-label", m.phase === "vor"
    ? `Oktober, noch nicht begonnen. Vorlauf: ${m.vorlauf} ${m.vorlauf === 1 ? "Tag" : "Tage"} dabei.`
    : `Oktober: ${m.dabei} von ${m.phase === "im" ? m.tag : 31} Tagen dabei.`);
  s.append(g, el("p", "leise klein", "Tipp einen Tag an, um zu sehen, was da steht, oder um etwas nachzutragen."));
  if (api.aktiv("lauf")) {
    const n = api.serie(), best = api.besterLauf();
    const l = el("p", "monat-lauf leise");
    l.append(el("span", null, `${n} ${n === 1 ? "Tag" : "Tage"} am Stück`));
    if (best > n) l.append(el("span", null, `längster Lauf ${best}`));
    s.append(l);
  }
  return s;
}

/* Die große Zahl zählt, was wächst: im Oktober die Tage dabei, davor der
   Vorlauf, danach die Summe. */
function kopf(m) {
  const k = el("div", "monat-kopf");
  const [n, wort] =
    m.phase === "vor" ? [m.vorlauf, m.vorlauf === 1 ? "Tag Vorlauf" : "Tage Vorlauf"]
    : m.phase === "nach" ? [m.dabei, "von 31 Tagen dabei"]
    : [m.dabei, m.dabei === 1 ? "Tag dabei" : "Tage dabei"];
  k.append(el("strong", "monat-zahl", String(n)), el("span", "monat-wort", wort));
  return k;
}


/* Die Ebenen als Reihe kleiner Schalter, jeder mit dem Punkt seiner Farbe.
   Darunter ein Satz, was die gewählte zeigt. */
function ebenenWahl(api, schichten, S, neu) {
  const w = el("div", "ebenen-wahl");
  const reihe = el("div", "ebenen-reihe");
  reihe.setAttribute("role", "radiogroup");
  reihe.setAttribute("aria-label", "Den Monat lesen als");
  for (const x of schichten) {
    const b = knopf(x.name, "ebene-chip", () => {
      schicht = x.id;
      try { localStorage.setItem(MERK, x.id); } catch {}
      neu();
    });
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", x.id === S.id);
    b.style.setProperty("--c", x.farbe);
    b.dataset.focus = `ebene-${x.id}`;
    reihe.append(b);
  }
  w.append(reihe, el("p", "ebenen-text leise", S.text));
  return w;
}

/* Die Etappe — die Kette aus lifetracker. Sie zeigt den laufenden Lauf,
   rastet aber auf der Fibonacci-Leiter ein: 5, 8, 13, 21, 34 Tage. Ist
   eine Etappe voll, beginnt die nächste, länger; die blassen Glieder sind
   die Tage bis dahin. Ein einzelner leerer Tag bricht sie nicht. Für wen
   „Fibonacci" nichts heißt, heißt sie einfach Etappe. */
function etappe(api) {
  const l = api.lauf();
  const e = el("div", "etappe");
  const kette = el("div", "kette");
  const worte = [];
  for (const t of l.tage) {
    const g = el("span", "glied");
    g.dataset.stand = t.stand;
    if (t.heute) g.dataset.heute = "";
    kette.append(g);
    if (t.stand !== "kommt") worte.push(t.stand === "dabei" || t.stand === "frei" ? "dabei" : t.heute ? "offen" : "leer");
  }
  kette.setAttribute("role", "img");
  kette.setAttribute("aria-label", `Etappe: ${l.dabeiTage} von ${l.fenster} Tagen. ${worte.join(", ")}.`);
  const text = el("p", "etappe-text");
  text.append(el("span", "rubrik", "Etappe"), el("span", "etappe-zahl", `${l.dabeiTage} von ${l.fenster} Tagen`));
  text.title = "Die Etappen wachsen wie die Fibonacci-Folge: 5, 8, 13, 21, 34 Tage. Ein einzelner leerer Tag bricht sie nicht.";
  e.append(text, kette);
  return e;
}


/* Darunter der Tages-Check-in: Körper und Antrieb, die Systeme unter den
   Symptomen — und, wenn gestern leer geblieben ist, das Nachtragen. */
function weiteres(api) {
  const r = el("div", "monat-weiteres");
  if (api.ab(3) && api.morgenpraxisOffen()) {
    const d = knopf("", "daemon-hinweis", () => api.werkzeug("daemon"));
    d.dataset.focus = "daemon";
    d.append(el("span", null, "Morgenpraxis: Dämonen zum Frühstück"), el("span", "leise klein", "7 Min."));
    r.append(d);
  }
  const g = api.gesternOffen();
  if (g) {
    const n = knopf("Gestern nachtragen", "text tag-einordnen", () => api.tagEinordnen(g));
    n.dataset.focus = "nachtragen";
    r.append(n);
  }
  const h = reiseHinweis(api);
  if (h) r.append(h);
  return r;
}

/* Was als Nächstes kommt, leise unter dem Knopf — und was man dafür tun
   kann. Am Ziel der Reise steht hier nichts mehr. */
function reiseHinweis(api) {
  /* Eben geöffnet: hier, an diesem festen Platz, bis man es gesehen hat. */
  const neu = api.reiseNeu();
  if (neu) {
    const b = knopf("", "reise-neu-hinweis", () => api.reiseGesehen());
    b.append(el("span", "reise-neu-titel", `Neu: ${neu.titel}`), el("span", "leise klein", neu.text), el("span", "reise-ok", "gesehen"));
    b.setAttribute("aria-label", `Neu: ${neu.titel}. ${neu.text} Antippen, wenn gesehen.`);
    return b;
  }
  const r = api.reise();
  if (!r.naechste) return null;
  return el("p", "reise-hinweis leise klein", r.noch);
}



