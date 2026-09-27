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
  const zaehlt = api.hatEintrag();
  const schichten = api.schichten();
  const S = schichten.find((x) => x.id === schicht) || schichten[0];
  const s = el("section", "monat");
  s.setAttribute("aria-label", "Dein Oktober");
  s.dataset.schicht = S.id;
  s.style.setProperty("--schicht", S.farbe);

  s.append(kopf(m));

  const gitter = el("div", "monat-gitter");
  for (const w of WOCHENTAGE) gitter.append(el("span", "monat-wt", w));
  for (const c of m.zellen) {
    const t = el("span", "monat-tag", c.art === "rand" ? "" : String(c.nr));
    t.dataset.stand = c.stand;
    t.dataset.art = c.art;
    if (c.heute) t.dataset.heute = "";
    if (S.id !== "dabei" && c.art !== "rand" && c.stand !== "kommt") {
      const w = api.schichtWert(S.id, c.tag);
      if (w > 0) { t.dataset.w = ""; t.style.setProperty("--w", `${Math.round(25 + w * 75)}%`); if (w > 0.6) t.dataset.voll = ""; }
    }
    if (c.art !== "rand") t.title = `${c.nr}. ${c.art === "okt" ? "Oktober" : "September"}: ${STAND_WORT[c.stand]}`;
    gitter.append(t);
  }
  s.append(ebenenWahl(api, schichten, S));
  gitter.setAttribute("role", "img");
  gitter.setAttribute("aria-label", m.phase === "vor"
    ? `Oktober, noch nicht begonnen. Vorlauf: ${m.vorlauf} ${m.vorlauf === 1 ? "Tag" : "Tage"} dabei.`
    : `Oktober: ${m.dabei} von ${m.phase === "im" ? m.tag : 31} Tagen dabei.`);
  s.append(gitter);

  if (m.phase !== "nach") {
    s.append(daKnopf(api, zaehlt));
    const e = api.heuteEingeordnet();
    const b = knopf(e ? "Der Tag ist eingeordnet · ändern" : "Wie war der Tag?", "text tag-einordnen", () => api.tagEinordnen());
    b.dataset.focus = "einordnen";
    s.append(b);
  }

  if (api.aktiv("lauf")) {
    const n = api.serie(), best = api.besterLauf();
    const l = el("p", "monat-lauf leise");
    l.append(el("span", null, `${n} ${n === 1 ? "Tag" : "Tage"} am Stück`));
    if (best > n) l.append(el("span", null, `längster Lauf ${best}`));
    l.append(el("span", "monat-satz", api.tagessatz()));
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

function daKnopf(api, zaehlt) {
  const nurNotiz = zaehlt && !api.istDa();
  const b = knopf("", "da-knopf", () => api.da());
  b.dataset.focus = "da";
  b.setAttribute("aria-pressed", zaehlt);
  b.append(el("span", "da-haken", "✓"), el("span", "da-wort", zaehlt ? "Heute zählt" : "Heute bin ich dabei"));
  if (nurNotiz) b.append(el("span", "da-klein", "durch deine Notiz"));
  return b;
}

/* Die Ebenen als Reihe kleiner Schalter, jeder mit dem Punkt seiner Farbe.
   Darunter ein Satz, was die gewählte zeigt. */
function ebenenWahl(api, schichten, S) {
  const w = el("div", "ebenen-wahl");
  const reihe = el("div", "ebenen-reihe");
  reihe.setAttribute("role", "radiogroup");
  reihe.setAttribute("aria-label", "Den Monat lesen als");
  for (const x of schichten) {
    const b = knopf(x.name, "ebene-chip", () => {
      schicht = x.id;
      try { localStorage.setItem(MERK, x.id); } catch {}
      api.zeichne();
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
