/* Ansicht „Blatt".
   Eine ruhige Liste: je Verzicht eine Zeile mit dem Kreis des Tages. Alle
   Ebenen sind da, aber gefaltet ganz unten — gesperrte zeigen, wie sie
   aufgehen. */

import { el, knopf, kopf, wasText } from "./teile.js";

let mehrOffen = false;

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const s = el("section", "ansicht-blatt");
  s.append(kopf(api), el("h1", "serif", api.commitmentSatz()));

  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const ohne = es.some((e) => e.art === "ohne");
    const zeile = el("div", "blatt-zeile");
    const kreis = el("span", "kreis");
    if (ohne) kreis.dataset.ohne = "";
    if (es.some((e) => e.art === "habe")) kreis.dataset.spur = "";
    if (es.some((e) => e.art === "drang")) kreis.dataset.drang = "";
    const mitte = el("div");
    mitte.append(el("strong", null, V.name));
    const liste = el("ul", "blatt-liste");
    for (const e of es.filter((e) => e.art !== "ohne")) liste.append(el("li", null, `${e.zeit} · ${wasText(api, e)}`));
    mitte.append(liste);
    const aktionen = el("div", "blatt-aktionen");
    aktionen.append(knopf("habe", "text", () => api.eintragen(v, "habe")));
    if (z.commitment[v].drang) aktionen.append(knopf("würde gern", "text", () => api.eintragen(v, "drang")));
    if (!es.some((e) => e.art === "habe")) aktionen.append(knopf(ohne ? "✓ heute ohne" : "heute ohne", "text", () => api.ohne(v)));
    zeile.append(kreis, mitte, aktionen);
    s.append(zeile);
  }

  const mehr = el("details", "blatt-mehr");
  mehr.open = mehrOffen;
  mehr.ontoggle = () => (mehrOffen = mehr.open);
  const sum = el("summary", null, "Mehr, wenn du magst");
  if (EBENEN.some((e) => api.stand(e.id) === "frei" && !z.frei[e.id].gesehen)) sum.append(" ", el("span", "punkt", ""));
  mehr.append(sum);
  for (const e of EBENEN) {
    const st = api.stand(e.id);
    const r = el("div", "blatt-ebene");
    r.dataset.stand = st;
    r.append(el("span", "rubrik", e.rubrik), el("span", "blatt-titel", e.titel));
    if (st === "zu") r.append(el("span", "leise klein", e.bedingung));
    else if (st === "aus") r.append(knopf("einschalten", "text", () => api.einschalten(e.id)));
    else r.append(knopf("öffnen", "text", () => api.oeffneEbene(e.id)));
    mehr.append(r);
  }
  s.append(mehr);
  return s;
}
