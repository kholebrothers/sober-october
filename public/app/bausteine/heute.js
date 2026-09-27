/* Der Tag — der tägliche Check-in auf dem Startschirm.

   Von oben nach unten, immer in derselben Ordnung, damit nichts springt:

   1. Die Tracker, wie gewählt. Je Tracker eine Zeile mit großen Knöpfen:
      was du getan hast („+ Kaffee getrunken"), was du gern würdest
      („+ würde gern"), was du tun willst („✓ Morgenroutine"). Die Zahl
      von heute steht im Knopf. Jedes Tippen zählt den Tag.
   2. Ein Satz zum Tag — immer da, zum direkten Schreiben.
   3. Mehr festhalten, optional: Stimmung, Schlaf, Menge, Körper, Antrieb,
      Selbst. Jede Zeile zeigt, was schon drinsteht, und klappt genau an
      ihrer Stelle auf; was darüber steht, bewegt sich nicht.
   4. Ganz unten, was sonst ansteht (gestern nachtragen, die Reise).

   Die letzte Notiz eines Trackers hat ihren festen Platz in seiner Zeile
   (mit „Details" und „rückgängig"); ist noch nichts notiert, steht dort
   ein leiser Platzhalter gleicher Höhe. */

import { el, knopf, faerbe } from "../ansichten/teile.js";

export function heute(api) {
  const m = api.monat();
  if (m.phase === "nach") return null;
  const s = el("section", "heute");
  s.setAttribute("aria-label", "Heute");

  const kopf = el("div", "heute-kopf");
  kopf.append(el("h2", "heute-titel", "Heute"));
  const nurNotiz = api.hatEintrag() && !api.istDa();
  const da = knopf("", "da-pille", () => (api.istDa() ? api.daZurueck() : api.da()));
  da.dataset.focus = "da";
  da.setAttribute("aria-pressed", api.hatEintrag());
  da.disabled = nurNotiz;
  da.append(el("span", "da-pille-kreis", api.hatEintrag() ? "✓" : ""), el("span", null, nurNotiz ? "zählt durch deine Notiz" : "Heute dabei"));
  da.setAttribute("aria-label", api.istDa() ? "Heute dabei. Antippen nimmt es zurück." : nurNotiz ? "Heute zählt durch deine Notiz." : "Heute dabei — antippen");
  kopf.append(da);
  s.append(kopf, tracker(api), api.satzHeute(), api.erfassungHeute(), weiteres(api));
  return s;
}

/* ---- 1. Die Tracker --------------------------------------------------------- */

function tracker(api) {
  const { VERZICHTE } = api;
  const liste = el("div", "tracker-liste");
  liste.dataset.katze = "weg";
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const karte = faerbe(el("div", "tracker"), VERZICHTE, v);
    if (V.aufbau) karte.dataset.aufbau = "";

    /* Eine Routine mit Schritten (ab Schicht 2): die Karte ist die Liste. */
    if (V.aufbau && V.schritte.length && api.ab(2)) {
      karte.append(routine(api, v, V));
      liste.append(karte);
      continue;
    }
    karte.append(el("p", "tracker-name", V.name));
    const knoepfe = el("div", "tracker-knoepfe");
    if (V.aufbau) {
      const getan = es.some((e) => e.art === "getan");
      const b = knopf("", "tracker-knopf tracker-getan", () => api.eintragen(v, "getan"));
      b.dataset.focus = `habe-${v}`;
      b.setAttribute("aria-pressed", getan);
      b.append(el("span", "tracker-zeichen", getan ? "✓" : ""), el("span", "tracker-wort", getan ? "heute getan" : "getan"));
      b.setAttribute("aria-label", `${V.name}: ${getan ? "heute getan. Antippen nimmt es zurück." : "als getan markieren."}`);
      knoepfe.append(b);
    } else {
      const habe = es.filter((e) => e.art === "habe").length, drang = es.filter((e) => e.art === "drang").length;
      /* Der Name steht schon über den Knöpfen: im Knopf nur das Verb. */
      const kurz = V.habe.replace(V.name, "").replace(/^\s*—\s*/, "").trim() || V.habe;
      knoepfe.append(zaehlKnopf(api, v, "habe", kurz, habe, V.habe), zaehlKnopf(api, v, "drang", "würde gern", drang, V.drang));
    }
    karte.append(knoepfe);
    if (!V.aufbau) karte.append(letzte(api, v, V, es));
    liste.append(karte);
  }
  return liste;
}

function zaehlKnopf(api, v, art, wort, n, lang = wort) {
  const b = knopf("", `tracker-knopf tracker-${art}`, () => api.eintragen(v, art));
  b.dataset.focus = `${art}-${v}`;
  b.append(el("span", "tracker-zeichen", "+"), el("span", "tracker-wort", wort), el("span", "tracker-zahl", n ? String(n) : ""));
  b.setAttribute("aria-label", `${lang} notieren. Heute ${n}.`);
  return b;
}

/* Die letzte Notiz von heute — oder ein Platzhalter derselben Höhe. */
function letzte(api, v, V, es) {
  const l = el("p", "tracker-letzte");
  const e = es.filter((x) => x.art === "habe" || x.art === "drang").at(-1);
  if (!e) { l.append(el("span", "leise", "heute noch nichts notiert")); return l; }
  l.append(el("span", "leise", `${e.zeit} · ${e.art === "habe" ? V.habe : V.drang}`), knopf("Details", "text klein", () => api.notizDetails(e.id)));
  if (e.art === "drang" && api.ab(2)) l.append(knopf("Werkzeug", "text klein", () => api.notizWerkzeug(e.id)));
  const weg = knopf("rückgängig", "text klein leise", () => api.notizWeg(e.id));
  weg.dataset.focus = `weg-${v}`;
  l.append(weg);
  return l;
}

/* Eine Routine: Schritt für Schritt abhaken. */
function routine(api, v, V) {
  const getan = api.schritteGetan(v);
  const k = el("div", "routine");
  const kopf = el("div", "routine-kopf");
  const mehr = knopf("…", "rund klein", () => api.trackerBearbeiten(v));
  mehr.setAttribute("aria-label", `${V.name}: Schritte ändern`);
  kopf.append(el("span", "tracker-name", V.name), el("span", "routine-stand", `${getan.size} von ${V.schritte.length}`), mehr);
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

/* ---- 4. Was sonst ansteht --------------------------------------------------- */

function weiteres(api) {
  const r = el("div", "heute-weiteres");
  if (api.ab(3) && api.morgenpraxisOffen()) {
    const d = knopf("", "daemon-hinweis", () => api.werkzeug("daemon"));
    d.dataset.focus = "daemon";
    d.append(el("span", null, "Morgenpraxis: Dämonen zum Frühstück"), el("span", "leise klein", "7 Min."));
    r.append(d);
  }
  const g = api.gesternOffen();
  if (g) {
    const n = knopf("Gestern nachtragen", "text tag-einordnen", () => api.tagEinordnen(g));
    n.dataset.focus = "nachtragen";
    r.append(n);
  }
  const neu = api.reiseNeu();
  if (neu) {
    const b = knopf("", "reise-neu-hinweis", () => api.reiseGesehen());
    b.append(el("span", "reise-neu-titel", `Neu: ${neu.titel}`), el("span", "leise klein", neu.text), el("span", "reise-ok", "gesehen"));
    r.append(b);
  } else if (api.reise().naechste) r.append(el("p", "reise-hinweis leise klein", api.reise().noch));
  return r;
}
