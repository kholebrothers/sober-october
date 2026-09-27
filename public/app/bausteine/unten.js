/* Die Bausteine unten: das Tagebuch, die Heatmap und die offenen Ebenen.

   Eine ruhige Spalte unter dem, was die Ansicht zeigt. Gesperrte Ebenen
   stehen hier nicht — was sich noch nicht geöffnet hat, ist nicht da. */

import { el, knopf } from "../ansichten/teile.js";
import { karte } from "./heatmap.js";
import { tagebuch } from "./tagebuch.js";
import { verlauf } from "./verlauf.js";
import { werkzeugKarte } from "./werkzeuge.js";
import { gremlinKarte } from "./gremlin.js";

export function unten(api, { ebenen = true } = {}) {
  const teile = [];
  if (api.aktiv("werkzeuge")) teile.push(werkzeugKarte(api));
  if (api.aktiv("gremlin")) teile.push(gremlinKarte(api));
  if (api.aktiv("tagebuch")) teile.push(tagebuch(api));
  if (api.aktiv("verlauf")) teile.push(verlauf(api));
  if (api.aktiv("heatmap")) teile.push(karte(api));
  if (ebenen && api.aktiv("ebenen")) {
    const offen = api.EBENEN.filter((e) => api.stand(e.id) === "frei");
    if (offen.length) {
      const k = el("section", "karte ebenen-karte");
      k.append(el("p", "rubrik", "Für dich geöffnet"));
      for (const e of offen) {
        const b = knopf("", "ebene-knopf", () => api.oeffneEbene(e.id));
        b.dataset.ebene = e.id;
        b.append(el("span", "rubrik", e.rubrik), el("span", "serif", e.titel));
        if (!api.zustand.frei[e.id].gesehen) b.append(el("span", "punkt", ""));
        k.append(b);
      }
      teile.push(k);
    }
  }
  if (!teile.length) return null;
  const d = el("div", "unten");
  d.append(...teile);
  return d;
}
