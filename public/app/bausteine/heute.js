/* Der Tag — der tägliche Check-in auf dem Startschirm.

   Von oben nach unten, immer in derselben Ordnung, damit nichts springt:

   1. Die Leiste der Tracker: je Tracker ein Knopf mit seiner Zahl von
      heute — was du getan hast, und, darunter schlanker, was du gern
      würdest. Was du aufbaust, ist ein Häkchen. Jedes Tippen zählt den Tag.
   2. Eine feste Zeile für die letzte Notiz, mit „Details" und „rückgängig".
   3. Ein Satz zum Tag — immer da, zum direkten Schreiben.
   4. Ganz unten, was sonst ansteht (gestern nachtragen, die Reise).

   Stimmung, Schlaf, Menge, Körper, Antrieb, Selbst stehen hinter dem „+"
   in der Leiste unten (erfassung.js). */

import { el, knopf, faerbe } from "../ansichten/teile.js";

/* Ein Zeichen je Tracker; eigene bekommen ihren Anfangsbuchstaben. */
const ZEICHEN = { kaffee: "☕", kippe: "🚬", video: "📺" };
const zeichen = (v, V) => ZEICHEN[v] || (V.aufbau ? "" : V.name.slice(0, 1).toUpperCase());

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
  s.append(kopf, leiste(api), letzte(api), api.satzHeute(), weiteres(api));
  return s;
}

/* ---- 1. Die Leiste der Tracker ------------------------------------------------ */

function leiste(api) {
  const { VERZICHTE } = api;
  const w = el("div", "tracker-leiste");
  w.dataset.katze = "weg";
  const reihe = el("div", "tracker-reihe");
  const drang = el("div", "tracker-reihe tracker-reihe-drang");
  const routinen = [];
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    if (V.aufbau && V.schritte.length && api.ab(2)) { routinen.push([v, V]); continue; }
    if (V.aufbau) {
      const getan = es.some((e) => e.art === "getan");
      const b = faerbe(knopf("", "tracker-chip tracker-chip-getan", () => api.eintragen(v, "getan")), VERZICHTE, v);
      b.dataset.focus = `habe-${v}`;
      b.setAttribute("aria-pressed", getan);
      b.append(el("span", "tracker-chip-haken", getan ? "✓" : ""), el("span", "tracker-chip-name", V.name));
      b.setAttribute("aria-label", `${V.name}: ${getan ? "heute getan. Antippen nimmt es zurück." : "als getan markieren."}`);
      reihe.append(b);
      continue;
    }
    const n = es.filter((e) => e.art === "habe").length;
    const b = faerbe(knopf("", "tracker-chip", () => api.eintragen(v, "habe")), VERZICHTE, v);
    b.dataset.focus = `habe-${v}`;
    b.append(el("span", "tracker-chip-zeichen", zeichen(v, V)), el("span", "tracker-chip-name", V.name), el("span", "tracker-chip-zahl", String(n)));
    b.setAttribute("aria-label", `${V.habe} — notieren. Heute ${n}.`);
    reihe.append(b);

    const d = es.filter((e) => e.art === "drang").length;
    const db = faerbe(knopf("", "tracker-chip tracker-chip-drang", () => api.eintragen(v, "drang")), VERZICHTE, v);
    db.dataset.focus = `drang-${v}`;
    db.append(el("span", "tracker-chip-zeichen", zeichen(v, V)), el("span", "tracker-chip-zahl", String(d)));
    db.setAttribute("aria-label", `${V.drang} — notieren. Heute ${d}.`);
    drang.append(db);
  }
  w.append(reihe);
  if (drang.childElementCount) {
    const z = el("div", "tracker-drang-zeile");
    z.append(el("span", "tracker-drang-wort", "würde gern"), drang);
    w.append(z);
  }
  for (const [v, V] of routinen) {
    const k = faerbe(el("div", "tracker"), VERZICHTE, v);
    k.append(routine(api, v, V));
    w.append(k);
  }
  return w;
}

/* ---- 2. Die letzte Notiz — oder ein Platzhalter derselben Höhe ----------------- */

function letzte(api) {
  const l = el("p", "tracker-letzte");
  const e = api.heuteVon().filter((x) => x.art === "habe" || x.art === "drang").at(-1);
  if (!e) { l.append(el("span", "leise", "Tipp an, was heute passiert — jedes Tippen zählt.")); return l; }
  const V = api.VERZICHTE[e.verzicht];
  l.append(el("span", "leise", `${e.zeit} · ${e.art === "habe" ? V.habe : V.drang}`), knopf("Details", "text klein", () => api.notizDetails(e.id)));
  if (e.art === "drang" && api.ab(2)) l.append(knopf("Werkzeug", "text klein", () => api.notizWerkzeug(e.id)));
  const weg = knopf("rückgängig", "text klein leise", () => api.notizWeg(e.id));
  weg.dataset.focus = "weg";
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
