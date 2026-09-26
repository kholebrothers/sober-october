/* Ansicht „Faden".
   Text zuerst. Oben der Satz des Commitments und die Verben, darunter ein
   Faden aus dem, was notiert wurde, mit den eigenen Worten, wörtlich.
   Kein Menü: Wissen kommt als Eintrag in den Faden, in dem Moment, in dem
   es sich öffnet. Wählbare Ebenen werden angeboten, sobald ihr `angebot`
   erfüllt ist. */

import { AUSWAHL, tagesKopf } from "../logik.js";
import { el, knopf, kopf, wasText, faerbe } from "./teile.js";

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const s = el("section", "ansicht-faden");
  s.append(kopf(api), el("h1", "serif", api.commitmentSatz()));

  const verben = el("div", "verben");
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const p = el("p");
    faerbe(p, VERZICHTE, v);
    p.append(el("span", "leise v-name", `${V.name}: `), knopf(V.habe, "text verb", () => api.eintragen(v, "habe")));
    if (z.commitment[v].drang) p.append(" · ", knopf(V.drang, "text verb", () => api.eintragen(v, "drang")));
    verben.append(p);
  }
  s.append(verben);

  const posten = z.ereignisse.map((e) => ({ tag: e.tag, zeit: e.zeit, typ: "eintrag", e }));
  for (const eb of EBENEN) {
    const f = z.frei[eb.id];
    if (f) posten.push({ tag: f.tag, zeit: f.zeit, typ: eb.art === "verdient" ? "spur" : "an", eb });
    else if (eb.art === "gewaehlt" && eb.angebot(z)) posten.push({ tag: api.heute(), zeit: "99", typ: "angebot", eb });
  }
  posten.sort((a, b) => (b.tag + b.zeit).localeCompare(a.tag + a.zeit));

  const faden = el("ol", "faden");
  let letzterTag = null;
  for (const p of posten) {
    if (p.tag !== letzterTag) {
      letzterTag = p.tag;
      faden.append(el("li", "faden-kopf rubrik", tagesKopf(p.tag)));
    }
    const li = el("li", `faden-${p.typ}`);
    if (p.e) faerbe(li, VERZICHTE, p.e.verzicht);
    if (p.eb) li.dataset.ebene = p.eb.id;
    if (p.typ === "eintrag") {
      li.append(el("span", "leise", p.e.zeit), " ", wasText(api, p.e));
      // Nur Freitext wird zitiert; eine Auswahl sind nicht die eigenen Worte.
      for (const [k, w] of Object.entries(p.e.antworten))
        li.append(AUSWAHL.has(k) ? el("span", "zitat wahl", w) : el("span", "zitat", `„${w}“`));
    } else if (p.typ === "spur") {
      li.append(el("span", "leise", "Eine Spur öffnet sich. "), knopf(`${p.eb.titel} →`, "text", () => api.oeffneEbene(p.eb.id)));
    } else if (p.typ === "angebot") {
      li.append(el("span", "leise", "Wenn du magst: "), knopf(`${p.eb.titel} einschalten`, "text", () => api.einschalten(p.eb.id)));
    } else {
      li.append(knopf(`${p.eb.titel} →`, "text", () => api.oeffneEbene(p.eb.id)));
    }
    faden.append(li);
  }
  if (!posten.length) faden.append(el("li", "leise", "Noch nichts. Der Tag steht da."));
  s.append(faden);
  return s;
}
