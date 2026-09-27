/* Baustein „Dein Tagebuch" — unten, von selbst an.

   Aus lifetracker („Deine Sätze"): eine Antwort allein ist eine Notiz,
   dreißig sind ein Verlauf. Jeder Tag eine Zeile, neu nach alt: links der
   Tag, dann die Punkte seiner Ebenen (Dabei, Stimmung, Selbst, Drang,
   Geschehen — jede in ihrer Farbe), rechts der Satz. Auch leere Tage stehen
   da; antippen trägt nach oder ergänzt. Zuerst eine Woche, auf Wunsch alles. */

import { el, knopf } from "../ansichten/teile.js";

const KURZ = 7;
let alle = false;

export function tagebuch(api) {
  const zeilen = api.tagebuchZeilen();
  const k = el("section", "karte tagebuch");
  const kopf = el("div", "karte-kopf");
  const saetze = zeilen.filter((z) => z.getragen).length;
  kopf.append(el("p", "rubrik", "Dein Tagebuch"), el("span", "leise klein", saetze === 1 ? "ein Satz" : `${saetze} Sätze`));
  k.append(kopf);

  const liste = el("ol", "tb-liste");
  for (const z of alle ? zeilen : zeilen.slice(0, KURZ)) {
    const li = el("li");
    const b = knopf("", "tb-zeile", () => api.tagEinordnen(z.tag));
    if (!z.dabei) b.dataset.leer = "";
    b.append(el("span", "tb-tag", z.heute ? "heute" : z.kopf));

    const punkte = el("span", "tb-punkte");
    punkte.setAttribute("aria-hidden", "true");
    const punkt = (klasse, stil) => { const p = el("i", klasse); if (stil) p.style.setProperty("--w", stil); punkte.append(p); };
    punkt(z.dabei ? "p-dabei an" : "p-dabei");
    if (z.stimmung) punkt("p-stimmung", `${Math.round(25 + (z.stimmung / 5) * 75)}%`);
    for (let i = 0; i < z.selbst.length; i++) punkt("p-selbst");
    if (z.drang) punkt("p-drang");
    if (z.habe) punkt("p-geschehen");
    b.append(punkte);

    const text = el("span", "tb-text");
    if (z.getragen) text.append(el("span", "tb-satz", z.getragen));
    else if (z.selbst.length) text.append(el("span", "leise", z.selbst.join(", ")));
    else if (z.dabei) text.append(el("span", "leise", z.heute ? "dabei — ein Satz dazu?" : "dabei"));
    else text.append(el("span", "leise", z.heute ? "noch offen" : "nichts eingetragen · nachtragen"));
    b.append(text);

    const worte = [z.heute ? "Heute" : z.kopf, z.dabei ? "dabei" : "nichts eingetragen"];
    if (z.stimmung) worte.push(`Stimmung ${api.stimmungWort(z.stimmung)}`);
    if (z.selbst.length) worte.push(z.selbst.join(", "));
    if (z.getragen) worte.push(`„${z.getragen}“`);
    b.setAttribute("aria-label", `${worte.join(". ")}. Öffnen zum Ergänzen.`);
    li.append(b);
    liste.append(li);
  }
  k.append(liste);
  if (zeilen.length > KURZ) {
    const mehr = knopf(alle ? "Nur die letzte Woche" : `Alle ${zeilen.length} Tage`, "text klein", () => { alle = !alle; api.zeichne(); });
    mehr.dataset.focus = "tb-mehr";
    k.append(mehr);
  }
  return k;
}
