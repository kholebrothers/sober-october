/* Ansicht „Blatt".
   Eine ruhige Liste: je Tracker eine Zeile mit dem Kreis des Tages, den
   Aktionen darunter und dem, was heute notiert ist. Oben und unten stehen
   die eingeschalteten Bausteine. */

import { el, knopf, kopf, wasText, faerbe, plusTracker } from "./teile.js";
import { oben } from "../bausteine/index.js";

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const s = el("section", "ansicht-blatt");
  s.append(kopf(api));
  const o = oben(api);
  if (o) s.append(o);

  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const ohne = es.some((e) => e.art === "ohne");
    const zeile = faerbe(el("div", "blatt-zeile"), VERZICHTE, v);
    const kreis = el("span", "kreis");
    if (ohne) kreis.dataset.ohne = "";
    if (es.some((e) => e.art === "habe")) kreis.dataset.spur = "";
    if (es.some((e) => e.art === "drang")) kreis.dataset.drang = "";
    const mitte = el("div");
    mitte.append(el("strong", "v-name", V.name));
    const liste = el("ul", "blatt-liste");
    for (const e of es.filter((e) => e.art !== "ohne")) liste.append(el("li", null, `${e.zeit} · ${wasText(api, e)}`));
    mitte.append(liste);
    zeile.append(kreis, mitte);
    s.append(zeile);
  }
  return s;
}
