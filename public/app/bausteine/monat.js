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
  // Die Ebenen des Monats gehören zur Schicht „Nervensystem".
  const S = (api.ab(3) && schichten.find((x) => x.id === schicht)) || schichten[0];
  const s = el("section", "monat");
  s.setAttribute("aria-label", "Dein Oktober");
  s.dataset.katze = "wand";   // Gelände für den Gremlin (begleiter/welt.js)
  s.dataset.schicht = S.id;
  s.style.setProperty("--schicht", S.farbe);

  s.append(kopf(m), etappe(api));

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
  if (api.ab(3)) s.append(ebenenWahl(api, schichten, S));
  gitter.setAttribute("role", "img");
  gitter.setAttribute("aria-label", m.phase === "vor"
    ? `Oktober, noch nicht begonnen. Vorlauf: ${m.vorlauf} ${m.vorlauf === 1 ? "Tag" : "Tage"} dabei.`
    : `Oktober: ${m.dabei} von ${m.phase === "im" ? m.tag : 31} Tagen dabei.`);
  s.append(gitter);

  if (m.phase !== "nach") s.append(daKnopf(api, zaehlt), satzZeile(api), weiteres(api));

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

/* Ein Satz zum Tag, gleich unter dem Knopf (aus lifetracker, befinden):
   „Was hat dich heute getragen?" Eine Zeile, freiwillig; gespeichert wird
   beim Verlassen des Feldes oder mit der Eingabetaste. */
function satzZeile(api) {
  const f = el("form", "satz-zeile");
  const i = Object.assign(document.createElement("input"), { name: "getragen", value: api.getragen(), autocomplete: "off", maxLength: 280,
    placeholder: "Was hat dich heute getragen?", enterKeyHint: "done" });
  i.setAttribute("aria-label", "Was hat dich heute getragen? Ein Satz für dein Tagebuch");
  i.dataset.focus = "getragen";
  const sichern = () => { if (i.value.trim() !== api.getragen()) api.getragenSetzen(i.value); };
  i.addEventListener("change", sichern);
  f.addEventListener("submit", (e) => { e.preventDefault(); i.blur(); sichern(); });
  f.append(i);
  return f;
}

/* Darunter der Tages-Check-in: Körper und Antrieb, die Systeme unter den
   Symptomen — und, wenn gestern leer geblieben ist, das Nachtragen. */
function weiteres(api) {
  const r = el("div", "monat-weiteres");
  if (!api.ab(3)) {
    const g0 = api.gesternOffen();
    if (g0) { const n0 = knopf("Gestern nachtragen", "text tag-einordnen", () => api.tagEinordnen(g0)); n0.dataset.focus = "nachtragen"; r.append(n0); }
    return r;
  }
  const n = api.eingeschaetzt(), alle = api.systemeAnzahl;
  const b = knopf("", "checkin-knopf", () => api.tagEinordnen());
  b.dataset.focus = "einordnen";
  if (n) b.dataset.teil = "";
  b.append(el("span", null, "Tages-Check-in"), el("span", "checkin-stand", n ? `${n} von ${alle}` : "Körper · Antrieb"));
  b.setAttribute("aria-label", `Tages-Check-in: ${n} von ${alle} Systemen eingeschätzt`);
  r.append(b);
  const g = api.gesternOffen();
  if (g) {
    const n = knopf("Gestern nachtragen", "text tag-einordnen", () => api.tagEinordnen(g));
    n.dataset.focus = "nachtragen";
    r.append(n);
  }
  return r;
}
