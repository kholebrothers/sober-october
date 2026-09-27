/* Baustein „Gremlin" — die Karte zur Beziehung (Schicht 3, unten).

   Nach SPARK 099: Wo die Beziehung steht (fünf Schritte), wann sein Tag
   ist, was er bekommen darf — und an seinem Tag das bewusste Füttern.
   „Wenn du deinen Gremlin nicht bewusst fütterst, frisst er dich." */

import { el, knopf } from "../ansichten/teile.js";

const KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function gremlinKarte(api) {
  const g = api.gremlinStand();
  const k = el("section", "karte gremlin-karte");
  k.dataset.katze = "weg";
  const kopf = el("div", "karte-kopf");
  kopf.append(el("p", "rubrik", "Dein Gremlin"), el("span", "leise klein", g.stufe.n ? `${g.stufe.n} · ${g.stufe.name}` : g.stufe.name));
  k.append(kopf);

  const leiter = el("div", "gr-leiter");
  leiter.setAttribute("role", "img");
  leiter.setAttribute("aria-label", `Beziehung: Stufe ${g.stufe.n} von 5, ${g.stufe.name}`);
  for (const s of g.stufen.slice(1)) {
    const p = el("span", "gr-stufe", s.name);
    if (s.n <= g.stufe.n) p.dataset.an = "";
    if (s.n === g.stufe.n) p.dataset.jetzt = "";
    leiter.append(p);
  }
  k.append(leiter, el("p", "gr-text serif", g.stufe.text));
  if (!g.stufe.n) return k;

  /* Sein Tag. */
  const f = el("div", "gr-fuettern");
  if (g.tag === null) {
    f.append(el("p", "serif", "Wann ist sein Tag?"),
      el("p", "leise klein", "Wenn du ihn nicht bewusst fütterst, frisst er dich. Ein fester Tag in der Woche, an dem er bekommt, was du wählst — dazwischen: Sitz."));
    const r = el("div", "gr-tage");
    [1, 2, 3, 4, 5, 6, 0].forEach((t) => {
      const b = knopf(KURZ[t], "lz-stufe", () => api.gremlinTag(t));
      b.setAttribute("aria-label", g.wochentage[t]);
      r.append(b);
    });
    f.append(r);
  } else if (g.fuetterungstag && !g.heuteGefuettert) {
    f.append(el("p", "serif gr-heute", "Heute ist sein Tag. Was bekommt er?"));
    const r = el("div", "chips-reihe");
    for (const was of g.futter) {
      const b = knopf(was, "chip-knopf gr-futter", () => api.gremlinFuettern(was));
      r.append(b);
    }
    r.append(knopf("nicht hungrig", "chip-knopf", () => api.gremlinFuettern("")));
    f.append(r);
    if (!g.futter.length) f.append(el("p", "leise klein", "Noch kein Futter gewählt — unten eins hinzufügen."));
  } else {
    const letzt = g.heuteGefuettert ? (g.heuteWas ? `Heute gefüttert: ${g.heuteWas}.` : "Heute war er nicht hungrig. Nächste Woche wieder, nicht vorher.") : "";
    f.append(el("p", "serif", letzt || `Sein Tag: ${g.wochentage[g.tag]}. Bis dahin: Sitz.`));
    const w = knopf("Tag ändern", "text klein", () => api.gremlinTag(null));
    f.append(w);
  }
  k.append(f);

  /* Das Futter — du wählst, nicht er. */
  const fu = el("div", "gr-futterliste");
  fu.append(el("p", "leise klein", "Sein Futter. Du wählst, nicht er. Was ernste Folgen hat — Alkohol, Streit, Glücksspiel, Rasen — gehört nicht auf die Liste."));
  const liste = el("div", "chips-reihe");
  g.futter.forEach((was, i) => {
    const b = knopf(`${was} ×`, "chip-knopf", () => api.gremlinFutterWeg(i));
    b.setAttribute("aria-label", `${was} entfernen`);
    liste.append(b);
  });
  for (const v of g.vorschlaege.filter((x) => !g.futter.includes(x)).slice(0, g.futter.length ? 2 : 4))
    liste.append(knopf(`+ ${v}`, "chip-knopf gr-vorschlag", () => api.gremlinFutterHinzu(v)));
  const form = el("form", "wahl-neu");
  const i = Object.assign(document.createElement("input"), { name: "futter", placeholder: "Eigenes Futter", autocomplete: "off", maxLength: 80 });
  i.setAttribute("aria-label", "Gremlin-Futter hinzufügen");
  const plus = knopf("+", "rund", () => form.requestSubmit());
  plus.setAttribute("aria-label", "Hinzufügen");
  form.append(i, plus);
  form.addEventListener("submit", (e) => { e.preventDefault(); if (i.value.trim()) api.gremlinFutterHinzu(i.value); });
  fu.append(liste, form);
  k.append(fu, el("p", "gr-quelle leise", "Nach Clinton Callahan, SPARK 099 · Possibility Management"));
  return k;
}
