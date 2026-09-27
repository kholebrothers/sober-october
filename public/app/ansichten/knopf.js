/* Ansicht „Knopf" — der Standard.
   Oben der Monat mit „Heute bin ich dabei". Darunter je Tracker eine
   Kachel: ein Tippen notiert sofort; die Fragen kommen nur, wenn man
   „Details" wählt, darunter, wenn gewählt, der leisere Würde-gern-Knopf.
   Tracker zum Aufbauen (Morgenroutine, Bewegung) sind grün und zählen
   „getan"; ab Schicht 2 wird eine Routine mit Schritten zur Liste. Die
   Kacheln sind ruhig: Farbe nur als Rand und Hauch, die Zahl in Tinte. */

import { el, knopf, kopf, faerbe, plusTracker } from "./teile.js";
import { oben, unten } from "../bausteine/index.js";

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const s = el("section", "ansicht-knopf");
  s.append(kopf(api), oben(api));

  const kopfzeile = el("div", "notier-kopf");
  kopfzeile.append(el("h2", "rubrik", "Notieren"));
  if (api.offen("tracker")) kopfzeile.append(plusTracker(api, "+"));
  s.append(kopfzeile);

  const raster = el("div", "kacheln");
  raster.dataset.katze = "weg";
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const habe = es.filter((e) => e.art === (V.aufbau ? "getan" : "habe")).length;
    const drang = es.filter((e) => e.art === "drang").length;
    const kachel = faerbe(el("div", "kachel"), VERZICHTE, v);
    kachel.dataset.an = habe > 0;
    if (V.aufbau) kachel.dataset.aufbau = "";

    /* Eine Routine mit Schritten (ab Schicht 2): die Kachel ist die Liste. */
    if (V.aufbau && V.schritte.length && api.ab(2)) {
      kachel.append(routine(api, v, V));
      raster.append(kachel);
      continue;
    }
    const b = knopf("", "kachel-knopf", () => api.eintragen(v, "habe"));
    b.dataset.focus = `habe-${v}`;
    /* Aufbauen ist ein Häkchen am Tag; Sein-lassen zählt, wie oft. */
    b.append(el("span", "kachel-name", V.name), el("strong", "kachel-zahl", V.aufbau ? (habe ? "✓" : "–") : String(habe)),
      el("span", "kachel-wort", V.aufbau ? (habe ? "heute getan" : "+ getan") : `+ ${V.habe}`));
    if (V.aufbau) b.setAttribute("aria-pressed", habe > 0);
    b.setAttribute("aria-label", V.aufbau ? `${V.name}: ${habe ? "heute getan. Antippen nimmt es zurück." : "getan notieren."}` : `${V.habe} notieren. Heute ${habe}.`);
    kachel.append(b);

    if (!V.aufbau && z.commitment[v].drang && api.offen("drang")) {
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

/* Eine Routine: Schritt für Schritt abhaken. Oben der Name und wie viele
   getan sind, darunter die Schritte; jeder ist ein eigener Knopf. */
function routine(api, v, V) {
  const getan = api.schritteGetan(v);
  const k = el("div", "routine");
  const kopf = el("div", "routine-kopf");
  const mehr = knopf("…", "rund klein", () => api.trackerBearbeiten(v));
  mehr.setAttribute("aria-label", `${V.name}: Schritte ändern`);
  kopf.append(el("span", "kachel-name", V.name), el("span", "routine-stand", `${getan.size} von ${V.schritte.length}`), mehr);
  k.append(kopf);
  const l = el("ol", "routine-schritte");
  V.schritte.forEach((t, i) => {
    const li = el("li");
    const b = knopf("", "routine-schritt", () => api.schritt(v, i));
    b.setAttribute("aria-pressed", getan.has(i));
    b.dataset.focus = `schritt-${v}-${i}`;
    b.append(el("span", "routine-haken", getan.has(i) ? "✓" : ""), el("span", null, t));
    li.append(b);
    l.append(li);
  });
  k.append(l);
  if (getan.size === V.schritte.length) k.dataset.fertig = "";
  return k;
}
