/* =====================================================================
   Der Gremlin in der App — Schicht 3, Baustein „Gremlin"

   Die Mechanik ist der Begleiter aus kur-core (public/begleiter/, kopiert),
   die Figur steht in gremlin.js, die Sätze in saetze.js. Hier nur die Naht:
   wann er da ist, was er vom Tag weiß, und worauf er reagiert.

   Er erscheint nur, wenn die Tiefe 3 ist, der Baustein an und die
   Beziehung begonnen hat (logik.js, gremlinStufe). Die Figur folgt der
   Stufe: wild, Gremlin, halb Katze, frei lebende Katze.
   ===================================================================== */

import { erzeugeBegleiter } from "../../begleiter/begleiter.js";
import { figurFuer } from "./gremlin.js";
import { GREMLINSAETZE } from "./saetze.js";

/**
 * @param o {an: () => bool, stufe: () => number, kontext: () => object|null, buzz: (muster) => void}
 */
export function erzeugeGremlin(o) {
  let b = null, figur = 0;

  /* Die Leinwand versteht keine CSS-Variablen und kein var() in color-mix.
     Ein unsichtbares Messelement löst jede Farbe auf, wie der Browser sie
     gerade sieht — hell, dunkel, abends. */
  let probe = null;
  const css = (name) => {
    if (!probe) {
      probe = document.createElement("span");
      probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
      document.body.append(probe);
    }
    probe.style.color = `var(${name})`;
    return getComputedStyle(probe).color;
  };

  /* Die Figur hängt an der Stufe der Beziehung. Ändert sie sich, zieht ein
     neuer Begleiter ein; der alte geht aus dem Bild. */
  function sicher() {
    if (!o.an()) return b;
    if (b && figur === o.stufe()) return b;
    if (b) { b.element.remove(); b = null; }
    figur = o.stufe();
    let speicher = null;
    try { speicher = localStorage; speicher.getItem("x"); } catch { speicher = null; }
    b = erzeugeBegleiter({
      silhouette: figurFuer(figur), texte: GREMLINSAETZE, kontext: () => (o.an() ? o.kontext() : null),
      speicher, praefix: "sober-october.gremlin.", id: "gremlin",
      wirt: { css, buzz: o.buzz },
    });
    b.start();
    return b;
  }

  return {
    /** Nach jedem Zeichnen: da sein oder nicht. */
    pruefen() {
      const an = o.an();
      if (an) sicher();
      if (b) b.element.hidden = !an;
    },
    /** Ein Eintrag, der den Tag trägt (dabei, getan, ein Satz). */
    freut(n, quelle) { if (o.an() && sicher()) b.cheer(n, quelle || null); },
    /** Er sagt etwas aus einem eigenen Topf: drang, geschehen, werkzeug. */
    sagt(topf) {
      if (!o.an() || !sicher()) return;
      const t = b.satz(topf);
      if (t) b.say(t, 4800);
    },
    /** Die Farben neu lesen, wenn sich hell/dunkel oder die Farbwelt ändert. */
    farbenNeu() { if (b) b.bild.farbenNeu(); },
  };
}
