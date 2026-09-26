/* Ansicht „Knopf" — der Standard.
   Ein Tracker auf einmal, ein Zählknopf aus smokefree/knopf (Richtung
   `verbrauchen`), darunter der leisere Würde-gern-Knopf. Ein Tippen
   notiert sofort; die Fragen kommen nur, wenn man „Details" wählt. Kein
   „heute ohne": kein Eintrag heißt ohnehin ohne.
   Oben und unten stehen nur die Bausteine, die eingeschaltet sind. */

import { zaehlknopf } from "../../knopf/knopf.js";
import { el, knopf, kopf, faerbe, plusTracker } from "./teile.js";
import { oben, unten } from "../bausteine/index.js";

let aktiv = 0;

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const gew = api.gewaehlt();
  if (api.springeZu && gew.includes(api.springeZu)) { aktiv = gew.indexOf(api.springeZu); api.springeZu = null; }
  if (aktiv >= gew.length) aktiv = 0;
  const v = gew[aktiv];
  const V = VERZICHTE[v];
  const es = api.heuteVon(v);
  const s = faerbe(el("section", "ansicht-knopf"), VERZICHTE, v);
  s.append(kopf(api));
  const o = oben(api);
  if (o) s.append(o);

  // Die Reiter stehen immer da, auch bei einem Tracker: am Ende das „+".
  const reiter = el("div", "reiter");
  const tabs = el("div", "reiter-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Deine Tracker");
  gew.forEach((k, i) => {
    const r = faerbe(knopf(VERZICHTE[k].name, "text", () => { aktiv = i; api.zeichne(); }), VERZICHTE, k);
    r.setAttribute("role", "tab");
    r.setAttribute("aria-selected", i === aktiv);
    r.id = `tracker-tab-${k}`;
    r.dataset.focus = `tracker-${k}`;
    r.tabIndex = i === aktiv ? 0 : -1;
    r.setAttribute("aria-controls", "tracker-panel");
    r.addEventListener("keydown", (e) => {
      const richtung = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!richtung && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      aktiv = e.key === "Home" ? 0 : e.key === "End" ? gew.length - 1 : (i + richtung + gew.length) % gew.length;
      api.zeichne();
      document.getElementById(`tracker-tab-${gew[aktiv]}`)?.focus();
    });
    tabs.append(r);
  });
  reiter.append(tabs, plusTracker(api, "+"));
  s.append(reiter);

  const panel = el("div", "tracker-panel");
  panel.id = "tracker-panel";
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `tracker-tab-${v}`);
  panel.append(el("h1", "tracker-titel serif", "Was ist gerade da?"));
  const habe = es.filter((e) => e.art === "habe").length;
  const k = zaehlknopf({
    form: "teilung", richtung: "verbrauchen",
    beschriftung: V.habe,
    nebentext: (n) => (n ? "heute" : "heute noch nichts notiert"),
    beiTipp: () => api.eintragen(v, "habe"),
  });
  k.setze({ n: habe });
  const taste = k.wurzel.querySelector("button");
  taste.dataset.focus = "notieren";
  taste.setAttribute("aria-label", `${V.habe} notieren. Heute ${habe} Einträge.`);
  k.wurzel.querySelector(".zk-mitte").append(el("span", "zk-hinweis", "Antippen zum Notieren"));
  panel.append(k.wurzel);

  if (z.commitment[v].drang) {
    const n = es.filter((e) => e.art === "drang").length;
    const d = knopf(V.drang, "drang-knopf", () => api.eintragen(v, "drang"));
    if (n) d.append(" ", el("span", "leise", `· ${n}× heute`));
    d.dataset.focus = "drang";
    panel.append(d);
  }
  s.append(panel);
  const u = unten(api);
  if (u) s.append(u);
  return s;
}
