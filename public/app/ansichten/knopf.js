/* Ansicht „Knopf" — der Standard.
   Oben der Monat mit „Heute bin ich dabei". Darunter je Tracker eine
   Kachel: ein Tippen notiert, was geschehen ist, sofort; die Fragen kommen
   nur, wenn man „Details" wählt. Darunter, wenn gewählt, der leisere
   Würde-gern-Knopf. Die Kacheln sind ruhig: Farbe nur als Rand und Hauch,
   die Zahl in Tinte. */

import { el, knopf, kopf, faerbe, plusTracker } from "./teile.js";
import { oben, unten } from "../bausteine/index.js";

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const s = el("section", "ansicht-knopf");
  s.append(kopf(api), oben(api));

  const kopfzeile = el("div", "notier-kopf");
  kopfzeile.append(el("h2", "rubrik", "Notieren, wenn etwas war"), plusTracker(api, "+"));
  s.append(kopfzeile);

  const raster = el("div", "kacheln");
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const habe = es.filter((e) => e.art === "habe").length;
    const drang = es.filter((e) => e.art === "drang").length;
    const kachel = faerbe(el("div", "kachel"), VERZICHTE, v);
    kachel.dataset.an = habe > 0;

    const b = knopf("", "kachel-knopf", () => api.eintragen(v, "habe"));
    b.dataset.focus = `habe-${v}`;
    b.append(el("span", "kachel-name", V.name), el("strong", "kachel-zahl", String(habe)), el("span", "kachel-wort", `+ ${V.habe}`));
    b.setAttribute("aria-label", `${V.habe} notieren. Heute ${habe}.`);
    kachel.append(b);

    if (z.commitment[v].drang) {
      const d = knopf(V.drang, "kachel-drang", () => api.eintragen(v, "drang"));
      if (drang) d.append(el("span", "leise", ` · ${drang}×`));
      d.dataset.focus = `drang-${v}`;
      kachel.append(d);
    }
    raster.append(kachel);
  }
  s.append(raster);

  const u = unten(api);
  if (u) s.append(u);
  return s;
}
