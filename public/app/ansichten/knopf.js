/* Ansicht „Knopf" — der Standard.
   Oben das Commitment mit „Heute bin ich dabei". Darunter je Tracker eine
   Karte mit echten Knöpfen: ein Tippen notiert sofort; „Details" und
   „rückgängig" stehen danach in der Karte. Tracker zum Aufbauen sind ein
   Häkchen am Tag; ab Schicht 2 wird eine Routine mit Schritten zur Liste. */

import { el, knopf, kopf, faerbe } from "./teile.js";
import { oben } from "../bausteine/index.js";

export function render(api) {
  const { zustand: z, VERZICHTE } = api;
  const s = el("section", "ansicht-knopf");
  s.append(kopf(api), oben(api));

  /* Je Tracker eine Karte: oben der Name und was heute
     war, darunter die Knöpfe — sichtbar als Knöpfe, mit „+". Die letzte
     Notiz von heute steht darunter, mit „Details" und „rückgängig": die
     Antwort auf ein Tippen hat ihren festen Platz, sie wird nicht eingeblendet. */
  const raster = el("div", "tracker-liste");
  raster.dataset.katze = "weg";
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const habe = es.filter((e) => e.art === (V.aufbau ? "getan" : "habe")).length;
    const drang = es.filter((e) => e.art === "drang").length;
    const karte = faerbe(el("div", "tracker"), VERZICHTE, v);
    if (V.aufbau) karte.dataset.aufbau = "";

    /* Eine Routine mit Schritten (ab Schicht 2): die Karte ist die Liste. */
    if (V.aufbau && V.schritte.length && api.ab(2)) {
      karte.append(routine(api, v, V));
      raster.append(karte);
      continue;
    }
    const kopf = el("div", "tracker-kopf");
    kopf.append(el("span", "tracker-name", V.name));
    if (!V.aufbau) kopf.append(el("span", "tracker-heute", habe || drang ? `heute ${[habe && `${habe}×`, drang && `${drang}× würde gern`].filter(Boolean).join(" · ")}` : "heute nichts"));
    karte.append(kopf);

    const knoepfe = el("div", "tracker-knoepfe");
    if (V.aufbau) {
      const b = knopf("", "tracker-haken", () => api.eintragen(v, "getan"));
      b.dataset.focus = `habe-${v}`;
      b.setAttribute("aria-pressed", habe > 0);
      b.append(el("span", "tracker-kasten", habe ? "✓" : ""), el("span", null, habe ? "heute getan" : "heute getan?"));
      b.setAttribute("aria-label", `${V.name}: ${habe ? "heute getan. Antippen nimmt es zurück." : "als getan markieren."}`);
      knoepfe.append(b);
    } else {
      const b = knopf("", "tracker-plus", () => api.eintragen(v, "habe"));
      b.dataset.focus = `habe-${v}`;
      b.append(el("span", "tracker-plus-zeichen", "+"), el("span", null, V.habe));
      b.setAttribute("aria-label", `${V.habe} notieren. Heute ${habe}.`);
      knoepfe.append(b);
      if (z.commitment[v].drang && api.offen("drang")) {
        const d = knopf("", "tracker-plus leise", () => api.eintragen(v, "drang"));
        d.dataset.focus = `drang-${v}`;
        d.append(el("span", "tracker-plus-zeichen", "+"), el("span", null, V.drang));
        knoepfe.append(d);
      }
    }
    karte.append(knoepfe);

    /* Die letzte Notiz von heute, mit dem, was an ihr noch geht. */
    const letzte = es.filter((e) => e.art === "habe" || e.art === "drang").at(-1);
    if (letzte) {
      const l = el("p", "tracker-letzte");
      l.append(el("span", "leise", `${letzte.zeit} · ${letzte.art === "habe" ? V.habe : V.drang}`));
      const det = knopf("Details", "text klein", () => api.notizDetails(letzte.id));
      l.append(det);
      if (letzte.art === "drang" && api.ab(2)) l.append(knopf("Werkzeug", "text klein", () => api.notizWerkzeug(letzte.id)));
      const weg = knopf("rückgängig", "text klein leise", () => api.notizWeg(letzte.id));
      weg.dataset.focus = `weg-${v}`;
      l.append(weg);
      karte.append(l);
    }
    raster.append(karte);
  }
  /* Die Tracker gehören zum Tag: solange er nicht begonnen ist, stehen sie nicht da. */
  if (api.hatEintrag()) s.append(raster);

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
