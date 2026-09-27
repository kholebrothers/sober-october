/* Oben: der Leitgedanke (Baustein, von selbst an) und der Monat, der immer
   da ist. Der Lauf ist ein Baustein im Monat, siehe monat.js. */

import { el, knopf } from "../ansichten/teile.js";
import { monat } from "./monat.js";

export function oben(api) {
  const h = el("div", "oben");
  if (api.aktiv("leitgedanke")) {
    const l = api.leitgedanke();
    const b = knopf(l.text, "leitgedanke serif", () => api.leitgedankeBearbeiten());
    b.setAttribute("aria-label", `Dein Leitgedanke: ${l.text} — ändern`);
    h.append(b);
  }
  h.append(monat(api));
  return h;
}
