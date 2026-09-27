/* Ansicht „Faden".
   Text zuerst. Oben der Satz des Commitments und die Verben, darunter ein
   Faden aus dem, was notiert wurde, mit den eigenen Worten, wörtlich. Ist
   der Baustein „Wissen und Rückblick" an, kommen offene Ebenen als Eintrag
   in den Faden, an dem Tag, an dem sie sich geöffnet haben. */

import { AUSWAHL, tagesKopf } from "../logik.js";
import { el, knopf, kopf, wasText, faerbe, plusTracker } from "./teile.js";
import { oben } from "../bausteine/index.js";

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const s = el("section", "ansicht-faden");
  s.append(kopf(api));
  const o = oben(api);
  if (o) s.append(o);


  const posten = z.ereignisse.map((e) => ({ tag: e.tag, zeit: e.zeit, e }));
  if (api.aktiv("ebenen"))
    for (const eb of EBENEN) if (z.frei[eb.id]) posten.push({ tag: z.frei[eb.id].tag, zeit: z.frei[eb.id].zeit, eb });
  posten.sort((a, b) => (b.tag + b.zeit).localeCompare(a.tag + a.zeit));

  const faden = el("ol", "faden");
  let letzterTag = null;
  for (const p of posten) {
    if (p.tag !== letzterTag) {
      letzterTag = p.tag;
      faden.append(el("li", "faden-kopf rubrik", tagesKopf(p.tag)));
    }
    if (p.e) {
      const li = faerbe(el("li", "faden-eintrag"), VERZICHTE, p.e.verzicht);
      li.append(el("span", "leise", p.e.zeit), " ", wasText(api, p.e));
      // Nur Freitext wird zitiert; eine Auswahl sind nicht die eigenen Worte.
      for (const [k, w] of Object.entries(p.e.antworten))
        li.append(AUSWAHL.has(k) ? el("span", "zitat wahl", w) : el("span", "zitat", `„${w}“`));
      faden.append(li);
    } else {
      const li = el("li", "faden-spur");
      li.dataset.ebene = p.eb.id;
      li.append(el("span", "leise", "Eine Spur öffnet sich. "), knopf(`${p.eb.titel} →`, "text", () => api.oeffneEbene(p.eb.id)));
      faden.append(li);
    }
  }
  if (!posten.length) faden.append(el("li", "leise", "Noch nichts. Der Tag steht da."));
  s.append(faden);
  return s;
}
