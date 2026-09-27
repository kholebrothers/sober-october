/* Baustein „Verlauf" — unten, von selbst an.

   Die Systeme unter den Symptomen über den Monat: je System eine Reihe, Tag
   für Tag, darunter Drang und Geschehen — alle auf denselben Tagen, damit
   man sieht, was zusammenfällt. Darunter, sobald genug Tage da sind, die
   Zusammenhänge in Sätzen (logik.js, zusammenhaenge). Ein Hinweis, kein
   Beweis: die App zählt, sie deutet nicht. */

import { el } from "../ansichten/teile.js";

const ZIEL = { drang: "Würde-gern-Momente", geschehen: "Mal geschehen" };
const zahl = (n) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

export function verlauf(api) {
  const tage = api.monatsTage();
  const reihen = api.verlauf(tage);
  const bis = tage.filter((t) => t <= api.heute()).length;
  const k = el("section", "karte verlauf");
  const kopf = el("div", "karte-kopf");
  kopf.append(el("p", "rubrik", "Verlauf"), el("span", "leise klein", "unter den Symptomen"));
  k.append(kopf);

  const tabelle = el("div", "vl");
  tabelle.style.setProperty("--n", String(tage.length));
  let gruppe = null;
  for (const r of reihen) {
    const neu = r.gruppe || "symptom";
    if (neu !== gruppe) { gruppe = neu; if (tabelle.childNodes.length) tabelle.append(el("span", "vl-abstand")); }
    const zeile = el("div", "vl-zeile");
    zeile.style.setProperty("--f", r.farbe);
    zeile.append(el("span", "vl-name", r.name));
    const zellen = el("span", "vl-zellen");
    r.werte.forEach((w, i) => {
      const c = el("i");
      if (i >= bis) c.dataset.kommt = "";
      else if (w) c.style.setProperty("--w", `${Math.round(25 + w * 75)}%`);
      if (tage[i] === api.heute()) c.dataset.heute = "";
      zellen.append(c);
    });
    const angaben = r.werte.slice(0, bis).filter(Boolean).length;
    zellen.setAttribute("role", "img");
    zellen.setAttribute("aria-label", `${r.name}: an ${angaben} von ${bis} Tagen angegeben`);
    zeile.append(zellen);
    tabelle.append(zeile);
  }
  k.append(tabelle);

  const zs = api.zusammenhaenge(tage.slice(0, bis));
  if (zs.length) {
    const l = el("ul", "zusammenhaenge");
    for (const x of zs) {
      const li = el("li");
      li.style.setProperty("--f", x.ziel === "drang" ? "var(--teal)" : "var(--clay)");
      li.append(el("strong", null, `${x.system.name} und ${x.ziel === "drang" ? "Drang" : "Geschehen"}. `),
        `Eher „${x.system.pole[0]}“ (${x.unten.tage} Tage): ${zahl(x.unten.schnitt)} ${ZIEL[x.ziel]} am Tag. ` +
        `Eher „${x.system.pole[1]}“ (${x.oben.tage} Tage): ${zahl(x.oben.schnitt)}.`);
      l.append(li);
    }
    k.append(l, el("p", "leise klein", "Gezählt, nicht gedeutet: was zusammenfällt, muss nicht auseinander folgen."));
  } else {
    k.append(el("p", "leise klein", "Nach ein paar Tagen Check-in stehen hier Zusammenhänge: wie es mit Drang und Geschehen aussah, wenn ein System eher am einen oder am anderen Pol stand."));
  }
  return k;
}
