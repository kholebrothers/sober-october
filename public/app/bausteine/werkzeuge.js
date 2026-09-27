/* Baustein „Werkzeuge" — Schicht 2, unten, von selbst an.

   Vier Knöpfe: Anker, Swish, Reframing, Wenn-dann. Die Werkzeuge selbst
   stehen in ../werkzeuge.js; hier ist nur der Zugang, wenn gerade kein
   Drang notiert wurde (dann kommen sie über die Meldung). */

import { el, knopf } from "../ansichten/teile.js";

export function werkzeugKarte(api) {
  const w = api.werkzeugStand();
  const k = el("section", "karte werkzeuge");
  const kopf = el("div", "karte-kopf");
  kopf.append(el("p", "rubrik", "Werkzeuge"), el("span", "leise klein", "für den Moment"));
  k.append(kopf);
  const r = el("div", "werkzeug-reihe");
  const b = (name, was, farbe) => {
    const x = knopf(name, "werkzeug-chip", () => api.werkzeug(was));
    x.style.setProperty("--c", farbe);
    x.dataset.focus = `werkzeug-${was}`;
    r.append(x);
  };
  b(w.anker ? "Anker" : "Anker setzen", w.anker ? "ankerAbrufen" : "ankerSetzen", "var(--moss)");
  b("Swish", "swish", "var(--teal)");
  b("Reframing", "reframing", "var(--lila)");
  b(w.plaene.length ? `Wenn-dann · ${w.plaene.length}` : "Wenn-dann", "plaene", "var(--gelb)");
  k.append(r);
  if (w.plaene.length) k.append(el("p", "werkzeug-plan klein", `Wenn ${w.plaene[0].wenn}, dann ${w.plaene[0].dann}.`));
  return k;
}
