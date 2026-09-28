/* Der Tag — der tägliche Check-in auf dem Startschirm.

   Von oben nach unten, immer in derselben Ordnung, damit nichts springt:

   1. Die Leiste: je Tracker, den du sein lässt, ein Knopf mit der Zahl von
      heute — sie soll null bleiben. Ein Tippen öffnet am Knopf zwei
      Optionen: „getrunken" (oder was der Tracker heißt) und „würde gern".
      Wie oft du gern würdest, steht klein im Knopf.
   2. Die Tagesliste: was du aufbaust, als Häkchen — eine Routine mit ihren
      Schritten darunter; am Morgen die Morgenpraxis.
   3. Eine feste Zeile für die letzte Notiz, mit „Details" und „rückgängig".
   4. Ein Satz zum Tag — immer da.
   5. Ganz unten, was sonst ansteht (gestern nachtragen, die Reise).

   „Dabei" braucht keinen eigenen Knopf: jede Notiz zählt den Tag, und der
   Tag in der Woche oben lässt sich antippen. Stimmung, Schlaf und der Rest
   stehen hinter dem „+" in der Leiste unten (erfassung.js). */

import { el, knopf, faerbe } from "../ansichten/teile.js";

/* Ein Zeichen je Tracker; eigene bekommen ihren Anfangsbuchstaben. */
const ZEICHEN = { kaffee: "☕", kippe: "🚬", video: "📺" };
const zeichen = (v, V) => ZEICHEN[v] || V.name.slice(0, 1).toUpperCase();

/* Welcher Knopf gerade seine Optionen zeigt. */
let offen = null;

export function heute(api) {
  const m = api.monat();
  if (m.phase === "nach") return null;
  const s = el("section", "heute");
  s.setAttribute("aria-label", "Heute");
  s.append(el("h2", "heute-titel", "Heute"));
  const l = leiste(api);
  if (l) s.append(l);
  const t = tagesliste(api);
  if (t) s.append(t);
  s.append(letzte(api), api.satzHeute(), weiteres(api));
  return s;
}

/* ---- 1. Die Leiste ---------------------------------------------------------- */

function leiste(api) {
  const { VERZICHTE } = api;
  const lassen = api.gewaehlt().filter((v) => !VERZICHTE[v].aufbau);
  if (!lassen.length) return null;
  const w = el("div", "tracker-leiste");
  w.dataset.katze = "weg";
  for (const v of lassen) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const n = es.filter((e) => e.art === "habe").length, d = es.filter((e) => e.art === "drang").length;
    const halter = faerbe(el("div", "tracker-halter"), VERZICHTE, v);
    const b = knopf("", "tracker-chip", () => { offen = offen === v ? null : v; api.zeichne(); });
    b.dataset.focus = `chip-${v}`;
    b.setAttribute("aria-expanded", offen === v);
    b.setAttribute("aria-label", `${V.name}: heute ${n}${d ? `, ${d}-mal würde gern` : ""}. Antippen zum Notieren.`);
    b.append(el("span", "tracker-chip-zeichen", zeichen(v, V)), el("span", "tracker-chip-name", V.name));
    if (d) b.append(el("span", "tracker-chip-gern", `💭${d}`));
    const zahl = el("span", "tracker-chip-zahl", String(n));
    if (!n) zahl.dataset.null = "";
    b.append(zahl);
    halter.append(b);
    /* Die Optionen liegen über der Seite, am Knopf — nichts darunter rutscht. */
    if (offen === v) {
      const o = el("div", "tracker-optionen");
      o.setAttribute("role", "menu");
      const wahl = (text, art, klasse) => {
        const x = knopf(text, `tracker-option ${klasse}`, () => { offen = null; api.eintragen(v, art); });
        x.setAttribute("role", "menuitem");
        x.dataset.focus = `${art}-${v}`;
        return x;
      };
      const kurz = V.habe.replace(V.name, "").replace(/^\s*—\s*/, "").trim() || V.habe;
      o.append(wahl(`+ ${kurz}`, "habe", ""), wahl("💭 würde gern", "drang", "gern"));
      halter.append(o);
    }
    w.append(halter);
  }
  return w;
}

/* Ein Tippen irgendwo sonst schließt die Optionen. */
document.addEventListener("pointerdown", (ev) => {
  if (offen && !ev.target.closest?.(".tracker-halter")) { offen = null; document.querySelector(".tracker-optionen")?.remove(); document.querySelector(".tracker-chip[aria-expanded=true]")?.setAttribute("aria-expanded", "false"); }
}, true);

/* ---- 2. Die Tagesliste ------------------------------------------------------ */

function tagesliste(api) {
  const { VERZICHTE } = api;
  const aufbau = api.gewaehlt().filter((v) => VERZICHTE[v].aufbau);
  const praxis = api.ab(3) && api.morgenpraxisOffen();
  if (!aufbau.length && !praxis) return null;
  const l = el("ul", "tagesliste");
  l.setAttribute("aria-label", "Für heute");
  for (const v of aufbau) {
    const V = VERZICHTE[v];
    const li = faerbe(el("li", "tages-item"), VERZICHTE, v);
    if (V.schritte.length) {
      const getan = api.schritteGetan(v);
      const kopf = el("div", "tages-kopf");
      kopf.append(el("span", "tages-name", V.name), el("span", "tages-stand", `${getan.size} von ${V.schritte.length}`));
      const mehr = knopf("…", "rund klein", () => api.trackerBearbeiten(v));
      mehr.setAttribute("aria-label", `${V.name}: Schritte ändern`);
      kopf.append(mehr);
      li.append(kopf);
      const u = el("ul", "tages-schritte");
      u.replaceChildren(...V.schritte.map((t, i) => {
        const x = el("li");
        x.append(haken(getan.has(i), t, `schritt-${v}-${i}`, () => api.schritt(v, i)));
        return x;
      }));
      li.append(u);
      if (getan.size === V.schritte.length) li.dataset.fertig = "";
    } else {
      const getan = api.heuteVon(v).some((e) => e.art === "getan");
      li.append(haken(getan, V.name, `habe-${v}`, () => api.eintragen(v, "getan")));
    }
    l.append(li);
  }
  if (praxis) {
    const li = el("li", "tages-item tages-praxis");
    const b = knopf("", "tages-haken", () => api.werkzeug("daemon"));
    b.dataset.focus = "daemon";
    b.append(el("span", "tages-kasten", ""), el("span", "tages-wort", "Morgenpraxis: Dämonen zum Frühstück"), el("span", "leise klein", "7 Min."));
    li.append(b);
    l.append(li);
  }
  return l;
}

function haken(an, text, fokus, tun) {
  const b = knopf("", "tages-haken", tun);
  b.dataset.focus = fokus;
  b.setAttribute("aria-pressed", an);
  b.append(el("span", "tages-kasten", an ? "✓" : ""), el("span", "tages-wort", text));
  return b;
}

/* ---- 3. Die letzte Notiz — oder ein Platzhalter derselben Höhe ----------------- */

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

/* ---- 5. Was sonst ansteht --------------------------------------------------- */

function weiteres(api) {
  const r = el("div", "heute-weiteres");
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
