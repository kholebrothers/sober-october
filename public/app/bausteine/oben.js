/* Oben: der Leitgedanke (Baustein, von selbst an), der Monat, der immer
   da ist, und darunter, wenn es eine Gruppe gibt, „Gemeinsam". Der Lauf
   ist ein Baustein im Monat, siehe monat.js. */

import { el, knopf } from "../ansichten/teile.js";
import { monat } from "./monat.js";
import { gemeinsam } from "./gemeinsam.js";
import { lebenszeitKarte } from "./lebenszeit.js";

export function oben(api) {
  const h = el("div", "oben");
  if (api.aktiv("leitgedanke")) {
    const l = api.leitgedanke();
    const b = knopf(l.text, "leitgedanke serif", () => api.leitgedankeBearbeiten());
    b.setAttribute("aria-label", `Dein Leitgedanke: ${l.text} — ändern`);
    h.append(b);
  }
  h.append(monat(api));
  if (api.aktiv("lebenszeit")) { const l = lebenszeitKarte(api); if (l) h.append(l); }
  const g = gemeinsam(api);
  if (g) h.append(g);
  return h;
}
