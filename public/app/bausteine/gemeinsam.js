/* Baustein „Gemeinsam" — unter dem Monat.

   Wer noch nicht mitgeht, sieht eine Einladung: wer schon unterwegs ist,
   was geteilt wird und was nicht, ein Feld für den Namen. Wer mitgeht,
   sieht, wer heute dabei ist, und jede Reise als eine Reihe in Moos —
   Farbe steht in dieser App für eine Ebene, nicht für eine Person. Keine
   Rangliste: die Reihenfolge ist die, in der man dazugekommen ist. Ist der Server nicht erreichbar, steht hier nichts. */

import { el, knopf } from "../ansichten/teile.js";

export function gemeinsam(api) {
  const g = api.gruppe();
  if (!g) return null;
  const s = el("section", "gemeinsam");
  s.setAttribute("aria-label", "Gemeinsam");
  if (!g.ich) s.append(...einladung(api, g));
  else s.append(...gruppe(api, g));
  return s;
}

function einladung(api, g) {
  const teile = [el("p", "rubrik", "Gemeinsam unterwegs")];
  const andere = g.leute.map((p) => p.name);
  teile.push(el("p", "gemeinsam-satz serif", andere.length
    ? `${andere.length === 1 ? "Eine Person geht" : `${andere.length} gehen`} schon mit: ${andere.join(", ")}.`
    : "Geh mit anderen durch den Oktober. Jede Reise bleibt deine eigene."));

  const f = el("form", "gemeinsam-form");
  const i = Object.assign(document.createElement("input"), { name: "name", placeholder: "Dein Vorname", autocomplete: "given-name", maxLength: 24 });
  i.setAttribute("aria-label", "Dein Name für die Gruppe");
  f.append(i, knopf("Mitgehen", "gross", () => f.requestSubmit()));
  f.addEventListener("submit", (e) => { e.preventDefault(); api.mitgehen(i.value); });
  teile.push(f);

  teile.push(el("p", "leise klein", "Die Gruppe sieht deinen Namen, was du sein lässt, und an welchen Tagen du dabei warst. Was du notierst — Einträge, Gefühle, Worte — bleibt auf diesem Gerät."));

  const unten = el("div", "wahlreihe");
  if (andere.length) {
    const wer = knopf("Schon dabei, auf einem anderen Gerät?", "text klein", () => {
      wer.replaceWith(...g.leute.map((p) => knopf(p.name, "chip-knopf", () => api.binIch(p.id, p.name))));
    });
    unten.append(wer);
  }
  unten.append(knopf("Lieber allein", "text leise klein", () => api.alleinBleiben()));
  teile.push(unten);
  return teile;
}

function gruppe(api, g) {
  const kopf = el("div", "gemeinsam-kopf");
  kopf.append(el("p", "rubrik", "Gemeinsam"));
  const teilen = knopf("Link teilen", "text klein", () => api.linkTeilen());
  kopf.append(teilen);

  const satz = el("p", "gemeinsam-satz serif");
  satz.textContent = g.heute.length ? `Heute dabei: ${g.heuteSatz}.` : "Heute ist noch niemand dabei. Du kannst anfangen.";

  const liste = el("ul", "reisen");
  for (const p of g.leute) {
    const li = el("li", "reise");
    if (p.du) li.dataset.du = "";
    const name = el("div", "reise-name");
    name.append(el("strong", null, p.du ? `${p.name} · du` : p.name));
    if (p.commitment) name.append(el("span", "leise klein", p.commitment));
    const faden = el("div", "reise-faden");
    faden.style.setProperty("--n", String(p.tage.length));
    p.tage.forEach((an, i) => {
      const t = el("i");
      if (an) t.dataset.an = "";
      if (g.tage[i] === g.heuteTag) t.dataset.heute = "";
      faden.append(t);
    });
    faden.setAttribute("role", "img");
    faden.setAttribute("aria-label", `${p.du ? "Du" : p.name}: ${p.anzahl} ${p.anzahl === 1 ? "Tag" : "Tage"} dabei`);
    li.append(name, faden, el("span", "reise-zahl", String(p.anzahl)));
    liste.append(li);
  }
  return [kopf, satz, liste];
}
