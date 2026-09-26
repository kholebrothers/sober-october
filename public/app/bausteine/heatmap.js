/* Baustein „Heatmap" — die große Heatmap, aus lifetracker (heatmap() in public/app.js).

   Ein Kästchen je Tag, eine Spalte je Woche, Montag oben. Die Farbe sagt,
   wie viel von deinem Commitment an dem Tag notiert ist — nicht, ob etwas
   „geschafft" wurde. Ein leeres Kästchen heißt: nichts bekannt. Moos statt
   Flamme, und nie rot. Leere Tage außerhalb des Oktobers stehen blasser
   da, Tage im Oktober nach heute als Ring. */

import { verzichte, heatWochen, tagesAnteil, tagesKopf, oktober, vonTag, istFrei, istDa, besterLauf } from "../logik.js";
import { alsDatum } from "../../kern/datum.js";
import { el } from "../ansichten/teile.js";

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const WOCHENTAGE = ["Mo", "", "Mi", "", "Fr", "", "So"];

export function tint(r) {
  if (!r) return "var(--hm-leer)";
  const pct = r < 0.34 ? 34 : r < 0.67 ? 62 : 92;
  return `color-mix(in oklab, var(--moss) ${pct}%, var(--hm-leer))`;
}

/** Was an einem Tag notiert ist, als eine Zeile. */
export function tagesText(z, tag) {
  const V = verzichte(z);
  const je = {};
  for (const e of vonTag(z, tag)) {
    const n = (je[e.verzicht] ||= { habe: 0, drang: 0, ohne: false });
    if (e.art === "ohne") n.ohne = true; else n[e.art]++;
  }
  const teile = Object.entries(je).map(([v, n]) => {
    const w = [];
    if (n.ohne) w.push("ohne");
    if (n.habe) w.push(`${n.habe}× ${V[v].habe}`);
    if (n.drang) w.push(`${n.drang}× ${V[v].drang}`);
    return `${V[v].name}: ${w.join(", ")}`;
  });
  if (istDa(z, tag)) teile.unshift("da");
  if (istFrei(z, tag)) teile.unshift("frei genommen");
  return teile.length ? teile.join(" · ") : "nichts notiert";
}

export function heatmap(z, heute) {
  const wochen = heatWochen(heute);
  const { start } = oktober(heute);
  const monatVon = (t) => alsDatum(t).getMonth();
  const okt = monatVon(start);

  const kal = el("div", "hm-kal");
  // Ein Monatsname über der ersten Woche seines Monats; Monate, die nur mit
  // ein paar Tagen am Rand hängen, bekommen keinen.
  const monate = el("div", "hm-monate");
  const wm = wochen.map((w) => monatVon(w[0]));
  const spanne = {};
  wm.forEach((m) => (spanne[m] = (spanne[m] || 0) + 1));
  let letzter = -1, letztesLabel = -9;
  wm.forEach((m, i) => {
    const zeigen = m !== letzter && spanne[m] >= 2 && i - letztesLabel >= 2;
    monate.append(el("span", null, zeigen ? MONATE[m] : ""));
    if (zeigen) letztesLabel = i;
    letzter = m;
  });
  const wt = el("div", "hm-wt");
  for (const t of WOCHENTAGE) wt.append(el("span", null, t));
  const gitter = el("div", "hm-gitter");
  gitter.setAttribute("role", "img");
  let dabeiImOktober = 0;
  for (const w of wochen) for (const tag of w) {
    const c = el("span", "hm-zelle");
    const imOkt = monatVon(tag) === okt;
    if (tag > heute) { c.dataset.kommt = ""; if (!imOkt) c.dataset.leer = ""; }
    else {
      const r = tagesAnteil(z, tag);
      if (istFrei(z, tag) && !r) c.dataset.frei = "";
      else if (!imOkt && !r) c.dataset.rand = "";
      c.style.background = tint(r);
      if (r && imOkt) dabeiImOktober++;
      c.title = `${tagesKopf(tag)} · ${tagesText(z, tag)}`;
    }
    if (tag === heute) c.dataset.heute = "";
    gitter.append(c);
  }
  gitter.setAttribute("aria-label", `Heatmap: an ${dabeiImOktober} Tagen im Oktober ist etwas notiert.`);
  kal.append(monate, wt, gitter);

  const legende = el("div", "hm-legende");
  legende.append(el("span", null, "nichts bekannt"));
  for (const r of [0, 0.3, 0.6, 1]) {
    const c = el("span", "hm-zelle");
    c.style.background = tint(r);
    legende.append(c);
  }
  legende.append(el("span", null, "alles notiert"));
  if (z.freieTage.length) {
    const f = el("span", "hm-zelle");
    f.dataset.frei = "";
    legende.append(f, el("span", null, "frei"));
  }

  const d = el("div", "hm");
  d.append(kal, legende);
  return d;
}

/** Die Karte für unten: Überschrift, längster Lauf, Heatmap. */
export function karte(api) {
  const z = api.zustand, heute = api.heute();
  const k = el("section", "karte");
  const kopf = el("div", "karte-kopf");
  kopf.append(el("p", "rubrik", "Dein Oktober"));
  const best = besterLauf(z, heute);
  if (best) kopf.append(el("span", "leise klein", `längster Lauf ${best}`));
  k.append(kopf, heatmap(z, heute));
  return k;
}
