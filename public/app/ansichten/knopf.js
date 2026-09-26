/* Ansicht „Knopf" — der Standard.
   Ein Tracker auf einmal, ein Zählknopf aus smokefree/knopf (Richtung
   `verbrauchen`), darunter der leisere Würde-gern-Knopf und „heute ohne".
   Oben und unten stehen nur die Bausteine, die eingeschaltet sind. */

import { zaehlknopf } from "../../knopf/knopf.js";
import { el, knopf, kopf, faerbe } from "./teile.js";
import { oben, unten } from "../bausteine/index.js";

let aktiv = 0;

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const gew = api.gewaehlt();
  if (aktiv >= gew.length) aktiv = 0;
  const v = gew[aktiv];
  const V = VERZICHTE[v];
  const es = api.heuteVon(v);
  const s = faerbe(el("section", "ansicht-knopf"), VERZICHTE, v);
  s.append(kopf(api));
  const o = oben(api);
  if (o) s.append(o);

  if (gew.length > 1) {
    const reiter = el("div", "reiter");
    reiter.setAttribute("role", "tablist");
    gew.forEach((k, i) => {
      const r = faerbe(knopf(VERZICHTE[k].name, "text", () => { aktiv = i; api.zeichne(); }), VERZICHTE, k);
      r.setAttribute("role", "tab");
      r.setAttribute("aria-selected", i === aktiv);
      reiter.append(r);
    });
    s.append(reiter);
  }

  const habe = es.filter((e) => e.art === "habe").length;
  const k = zaehlknopf({
    form: "teilung", richtung: "verbrauchen",
    beschriftung: V.habe,
    nebentext: (n) => (n ? "heute" : "heute noch nichts notiert"),
    beiTipp: () => api.eintragen(v, "habe"),
  });
  k.setze({ n: habe });
  s.append(k.wurzel);

  if (z.commitment[v].drang) {
    const n = es.filter((e) => e.art === "drang").length;
    const d = knopf(V.drang, "drang-knopf", () => api.eintragen(v, "drang"));
    if (n) d.append(" ", el("span", "leise", `· ${n}× heute`));
    s.append(d);
  }
  if (!habe) {
    const ohne = es.some((e) => e.art === "ohne");
    s.append(knopf(ohne ? `✓ heute ohne ${V.name}` : `heute ohne ${V.name}`, "text", () => api.ohne(v)));
  }
  const u = unten(api);
  if (u) s.append(u);
  return s;
}
