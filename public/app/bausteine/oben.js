/* Die Bausteine oben: Leitgedanke, Lauf und Kette.

   Jeder ist für sich abschaltbar, und zusammen stehen sie als eine Fläche
   da (aus lifetracker, .hero): links die Zahl, rechts der Leitgedanke und
   der Satz zum Tag, darunter die Kette. Fehlt der Lauf, bleibt nur die
   Textspalte; ist nichts an, gibt es oben nichts. */

import { el, knopf } from "../ansichten/teile.js";

export function oben(api) {
  const leit = api.aktiv("leitgedanke"), lauf = api.aktiv("lauf");
  if (!leit && !lauf) return null;

  const h = el("div", lauf ? "oben lauf" : "oben");
  const text = el("div", "lauf-text");
  if (leit) {
    const l = api.leitgedanke();
    const b = knopf(l.text, "lauf-zeile leitgedanke serif", () => api.leitgedankeBearbeiten());
    b.setAttribute("aria-label", `Dein Leitgedanke: ${l.text} — ändern`);
    text.append(b);
  }
  const unter = el("span", "lauf-unter leise");
  if (lauf) unter.append(el("span", null, api.tagessatz()));
  if (unter.childNodes.length) text.append(unter);

  if (lauf) h.append(zahl(api));
  h.append(text);
  if (lauf) h.append(kette(api));
  return h;
}

/* Die Zahl ist zugleich der Knopf „Ich bin da" (aus lifetracker): antippen,
   und der Tag zählt. Zählt er schon — durch „da" oder eine Notiz —, trägt
   sie einen Ring. */
function zahl(api) {
  const n = api.serie();
  const heute = api.hatEintrag();
  const b = knopf("", n ? "lauf-zahl an" : "lauf-zahl", () => api.da());
  b.append(el("span", "n", String(n)), el("span", "u", n === 1 ? "Tag dabei" : "Tage dabei"));
  b.setAttribute("aria-pressed", heute);
  b.setAttribute("aria-label", heute ? `${n} Tage dabei — heute zählt` : `${n} Tage dabei — antippen: heute bin ich da`);
  b.title = heute ? "Heute zählt" : "Heute bin ich da";
  return b;
}

/* Die Kette rastet auf der Fibonacci-Leiter ein (5, 8, 13, 21, 34). Sie
   bricht nie um; die Zählung steht im Tooltip und für Screenreader. */
function kette(api) {
  const l = api.lauf();
  const k = el("div", "kette");
  const worte = [];
  for (const t of l.tage) {
    const p = el("span", "glied");
    p.dataset.stand = t.stand;
    if (t.heute) p.dataset.heute = "";
    k.append(p);
    if (t.stand !== "kommt") worte.push(t.stand === "dabei" ? "dabei" : t.heute ? "noch offen" : "frei");
  }
  k.setAttribute("role", "img");
  k.setAttribute("aria-label", `Dein Lauf, Tag 1 bis heute: ${worte.join(", ")}` +
    (l.fenster > l.weit ? ` — dann noch ${l.fenster - l.weit} Tage bis ${l.fenster}` : ""));
  k.title = `${l.dabeiTage} von ${l.fenster} Tagen`;
  const reihe = el("div", "kette-zeile");
  reihe.append(k);
  return reihe;
}
