/* =====================================================================
   Die App — ein Zustand, ein render(), ein Bogen

   Hervorgegangen aus dem Prototyp auf dem Branch
   `prototyp-zurueckhaltend` (NOTIZ.md dort). Übernommen ist, was der
   Nutzer bestätigt hat: alle drei Ansichten, Knopf als Standard, der
   Drang ohne Zwischenschritt, die vier Grundgefühle.
   ===================================================================== */

import { heute as heuteTag } from "../kern/datum.js";
import {
  FRAGEN, EBENEN, ANSICHTEN, FEST, EIGEN, verzichte, gewaehlt, commitmentSatz, vonTag,
  notiere, schalteOhne, schalteAlles, setzeEigen, stand, tagesZeile, serie, lauf,
} from "./logik.js";
import { laden, sichern, loeschen } from "./speicher.js";
import { ebenenInhalt } from "./ebenen.js";
import * as knopfAnsicht from "./ansichten/knopf.js";
import * as blattAnsicht from "./ansichten/blatt.js";
import * as fadenAnsicht from "./ansichten/faden.js";

const ANSICHT = { knopf: knopfAnsicht, blatt: blattAnsicht, faden: fadenAnsicht };

let z = laden();
let wahlOffen = !gewaehlt(z).length;

const $ = (s) => document.querySelector(s);
const heute = () => heuteTag();
const jetztZeit = () => new Date().toTimeString().slice(0, 5);

function aendern(f) {
  f();
  if (!sichern(z)) melde("Auf diesem Gerät lässt sich gerade nichts speichern.");
  zeichne();
}

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
  eintragen,
  ohne: (v) => aendern(() => schalteOhne(z, heute(), jetztZeit(), v)),
  einschalten(id) {
    aendern(() => { z.frei[id] = { tag: heute(), zeit: jetztZeit(), gesehen: false }; });
    oeffneEbene(id);
  },
  oeffneEbene,
  einstellungen,
  zeichne: () => zeichne(),
};

/* ---- Der Bogen ---------------------------------------------------------- */

const bogen = $("#bogen");

function zeigeBogen(knoten) {
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

function eintragen(v, art) {
  const V = verzichte(z)[v];
  fragen(v, art, art === "habe" ? V.habe : V.drang);
}

/* Begleitung, wenn man sie will: erst Raum, dann zurück zu den Fragen.
   Was schon ausgefüllt war, bleibt stehen. */
function begleiten(v, zurueck) {
  const k = el("div", "bogen-inhalt begleitung");
  k.dataset.v = v;
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

function fragen(v, art, titel) {
  const V = verzichte(z)[v];
  const f = el("form", "bogen-inhalt");
  f.dataset.v = v;
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
  const speichern = (mitAntworten) => {
    const antworten = {};
    if (mitAntworten) for (const [k, w] of new FormData(f)) {
      const t = String(w).trim();
      if (t) antworten[k] = antworten[k] ? antworten[k] + ", " + t : t;
    }
    let neu = [];
    aendern(() => { neu = notiere(z, { tag: heute(), zeit: jetztZeit(), verzicht: v, art, antworten, begleitetSek }); });
    bogen.close();
    melde(neu.length ? `Notiert. Eine Ebene hat sich geöffnet: ${neu.map((e) => e.titel).join(", ")}.` : "Notiert.");
  };
  const unten = el("div", "wahlreihe");
  unten.append(knopf("notieren", "gross", () => speichern(true)),
    knopf("nur notieren, ohne Fragen", "text", () => speichern(false)),
    knopf("abbrechen", "text leise", () => bogen.close()));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(true); });
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

/* ---- Einstellungen ------------------------------------------------------- */

function einstellungen() {
  const k = el("div", "bogen-inhalt");
  k.append(el("p", "rubrik", "Einstellungen"), el("h2", null, commitmentSatz(z)));
  k.append(knopf("Commitment ändern", "text", () => { bogen.close(); wahlOffen = true; zeichne(); }));

  const ans = el("fieldset", "frage");
  ans.append(el("legend", "serif", "Ansicht"));
  for (const [id, text] of Object.entries(ANSICHTEN)) {
    const l = el("label", "zeile");
    const i = Object.assign(document.createElement("input"), { type: "radio", name: "ansicht", value: id, checked: z.ansicht === id });
    i.addEventListener("change", () => aendern(() => { z.ansicht = id; }));
    l.append(i, el("span", null, text));
    ans.append(l);
  }
  k.append(ans);

  const daten = el("div", "frage");
  daten.append(el("p", "serif", "Deine Daten"),
    el("p", "leise", "Alles, was du notierst, liegt nur auf diesem Gerät, in diesem Browser. Nichts davon geht an einen Server."));
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

let meldeTimer;
function melde(text) {
  const m = $("#meldung");
  m.textContent = text;
  m.hidden = false;
  clearTimeout(meldeTimer);
  meldeTimer = setTimeout(() => (m.hidden = true), 3600);
}

/* ---- Commitment wählen ----------------------------------------------------- */

function wahlSeite() {
  const s = el("section", "wahl");
  s.append(el("p", "rubrik", `Sober October · ${tagesZeile(heute())}`),
    el("h1", "serif", "Was lässt du im Oktober sein?"),
    el("p", "leise", "Eins reicht. Bereitschaft genügt."));
  const V = verzichte(z);
  const los = knopf("So ist es.", "gross", () => { wahlOffen = false; zeichne(); });
  const umschalten = (id) => () => {
    if (z.commitment[id]) delete z.commitment[id]; else z.commitment[id] = { drang: true };
  };
  const zeile = (id, text, an, beiKlick) => {
    const r = el("div", "wahl-zeile");
    r.dataset.v = id;
    r.dataset.an = an;
    const b = knopf(an ? `✓ ${text}` : text, "wahl-knopf", () => aendern(beiKlick));
    b.setAttribute("aria-pressed", an);
    r.append(b);
    return r;
  };
  const drangZusatz = (r, id) => {
    const l = el("label", "leise wahl-zusatz");
    const i = Object.assign(document.createElement("input"), { type: "checkbox", checked: z.commitment[id].drang });
    i.addEventListener("change", () => aendern(() => { z.commitment[id].drang = i.checked; }));
    l.append(i, " auch die Momente notieren, in denen ich gern würde");
    r.append(l);
  };

  for (const id of FEST) {
    const r = zeile(id, V[id].name, !!z.commitment[id], umschalten(id));
    if (z.commitment[id]) drangZusatz(r, id);
    s.append(r);
  }

  s.append(zeile("alles", `Alles — ${FEST.map((k) => V[k].name).join(", ")}`,
    FEST.every((k) => z.commitment[k]), () => schalteAlles(z)));

  const eigen = zeile(EIGEN, "Eigene Definition von Sober", !!z.commitment[EIGEN], umschalten(EIGEN));
  if (z.commitment[EIGEN]) {
    const l = el("label", "wahl-zusatz wahl-eigen");
    l.append(el("span", "leise", "Was heißt sober für dich? Was lässt du sein?"));
    const i = Object.assign(document.createElement("input"), {
      name: "eigen", value: z.eigen.name, placeholder: "Alkohol, Zucker, Social Media …", autocomplete: "off", maxLength: 60,
    });
    // Ohne neu zu zeichnen, damit der Cursor im Feld bleibt.
    i.addEventListener("input", () => {
      setzeEigen(z, i.value);
      if (!sichern(z)) melde("Auf diesem Gerät lässt sich gerade nichts speichern.");
      los.disabled = !gewaehlt(z).length;
    });
    l.append(i);
    eigen.append(l);
    drangZusatz(eigen, EIGEN);
  }
  s.append(eigen);

  los.disabled = !gewaehlt(z).length;
  s.append(los, el("p", "leise", "Du kannst es jederzeit ändern. Was du notierst, bleibt auf diesem Gerät."));
  return s;
}

/* ---- Zeichnen -------------------------------------------------------------- */

function zeichne() {
  const buehne = $("#buehne");
  const ansicht = wahlOffen || !gewaehlt(z).length ? null : ANSICHT[z.ansicht] || knopfAnsicht;
  buehne.dataset.ansicht = ansicht ? z.ansicht : "wahl";
  buehne.replaceChildren(ansicht ? ansicht.render(api) : wahlSeite());
}

/* Ein neuer Tag, während die App offen stand: beim Zurückkommen neu zeichnen. */
let zuletzt = heute();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && heute() !== zuletzt) { zuletzt = heute(); zeichne(); }
});
/* Ein anderer Tab hat gespeichert. */
addEventListener("storage", (e) => { if (e.key === "sober-october") { z = laden(); zeichne(); } });

zeichne();
