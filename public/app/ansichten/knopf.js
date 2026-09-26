/* Ansicht „Knopf" — der Standard.
   Ein Verzicht auf einmal, ein Zählknopf aus smokefree/knopf (Richtung
   `verbrauchen`), darunter der leisere Würde-gern-Knopf. Sonst nichts.
   Gesperrte Ebenen sind unsichtbar: eine offene erscheint als Punkt im
   Kopf. Wählbare Ebenen stecken hinter einem einzigen „+" ganz unten. */

import { zaehlknopf } from "../../knopf/knopf.js";
import { el, knopf, kopf, faerbe } from "./teile.js";

let aktiv = 0;
let plusOffen = false;

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const gew = api.gewaehlt();
  if (aktiv >= gew.length) aktiv = 0;
  const v = gew[aktiv];
  const V = VERZICHTE[v];
  const es = api.heuteVon(v);
  const s = el("section", "ansicht-knopf");
  faerbe(s, VERZICHTE, v);

  const punkte = el("span", "punkte");
  for (const e of EBENEN.filter((e) => ["frei", "an"].includes(api.stand(e.id)))) {
    const p = knopf("", "punkt-knopf", () => api.oeffneEbene(e.id));
    p.dataset.neu = !z.frei[e.id].gesehen;
    p.dataset.ebene = e.id;
    p.title = e.titel;
    p.setAttribute("aria-label", e.titel);
    punkte.append(p);
  }
  s.append(kopf(api, punkte));

  if (gew.length > 1) {
    const reiter = el("div", "reiter");
    reiter.setAttribute("role", "tablist");
    gew.forEach((k, i) => {
      const r = knopf(VERZICHTE[k].name, "text", () => { aktiv = i; api.zeichne(); });
      r.setAttribute("role", "tab");
      faerbe(r, VERZICHTE, k);
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

  const waehlbar = EBENEN.filter((e) => api.stand(e.id) === "aus");
  if (waehlbar.length) {
    const plus = el("div", "plus");
    const pk = knopf(plusOffen ? "×" : "+", "rund", () => { plusOffen = !plusOffen; api.zeichne(); });
    pk.setAttribute("aria-label", "Weitere Ebenen");
    pk.setAttribute("aria-expanded", plusOffen);
    plus.append(pk);
    if (plusOffen) for (const e of waehlbar)
      plus.append(knopf(`${e.titel} einschalten`, "text", () => { plusOffen = false; api.einschalten(e.id); }));
    s.append(plus);
  }
  return s;
}
