/* =====================================================================
   Die Seiten — unten eine Leiste wie in jeder App: Heute, Monat, „+",
   Tagebuch, Mehr

   „Heute" ist der Startschirm (die Ansichten in ansichten/). Die anderen
   drei stehen hier. „Mehr" ist der Ort für alles, was die App außerdem
   kann: jede Funktion eine Zeile. Was die Reise noch nicht geöffnet hat,
   steht trotzdem da — mit dem, was es öffnet, und einem bewussten
   „jetzt schon öffnen". Nichts ist versteckt.
   ===================================================================== */

import { el, knopf } from "./ansichten/teile.js";
import { monatInhalt } from "./bausteine/monat.js";
import { tagebuch } from "./bausteine/tagebuch.js";
import { verlauf } from "./bausteine/verlauf.js";
import { karte as heatmapKarte } from "./bausteine/heatmap.js";
import { gremlinKarte } from "./bausteine/gremlin.js";
import { lebenszeitKarte } from "./bausteine/lebenszeit.js";
import { gemeinsam } from "./bausteine/gemeinsam.js";

/* Kleine Linien-Symbole, damit die Leiste aussieht wie die anderer Apps. */
const SVG = {
  heute: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
  monat: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  tagebuch: '<path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><path d="M6 18a2 2 0 0 1 2-2h10M10 8h5"/>',
  mehr: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>',
};
const symbol = (name) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = SVG[name];
  return s;
};

export function leiste(api, jetzt) {
  const n = el("nav", "leiste");
  n.setAttribute("aria-label", "Bereiche");
  for (const [id, name] of [["heute", "Heute"], ["monat", "Monat"], ["plus", ""], ["tagebuch", "Tagebuch"], ["mehr", "Mehr"]]) {
    /* In der Mitte das „+", wie bei Instagram: festhalten, wie es dir geht. */
    if (id === "plus") {
      const p = knopf("+", "leiste-plus", () => api.festhalten(p));
      api.plusHalten(p);
      p.setAttribute("aria-label", "Festhalten: Stimmung, Schlaf, Menge, Körper, Antrieb, Selbst");
      n.append(p);
      continue;
    }
    const b = knopf("", "leiste-knopf", () => api.seite(id));
    b.append(symbol(id), el("span", null, name));
    if (id === jetzt) b.setAttribute("aria-current", "page");
    n.append(b);
  }
  return n;
}

const seitenKopf = (titel, zurueck) => {
  const k = el("header", "seiten-kopf");
  if (zurueck) {
    const b = knopf("‹ Mehr", "text seiten-zurueck", zurueck);
    k.append(b);
  }
  k.append(el("h1", "seiten-titel serif", titel));
  return k;
};

/* ---- Monat ---------------------------------------------------------------- */

export function monatSeite(api) {
  const s = el("section", "seite");
  s.append(seitenKopf("Dein Oktober"), monatInhalt(api, () => api.zeichne()));
  if (api.aktiv("verlauf")) s.append(verlauf(api));
  if (api.aktiv("heatmap")) s.append(heatmapKarte(api));
  return s;
}

/* ---- Tagebuch ------------------------------------------------------------- */

export function tagebuchSeite(api) {
  const s = el("section", "seite");
  s.append(seitenKopf("Dein Tagebuch"), el("p", "leise klein seiten-hilfe", "Jeder Tag eine Zeile. Tipp einen Tag an, um ihn zu ergänzen."), tagebuch(api));
  return s;
}

/* ---- Mehr ----------------------------------------------------------------- */

/* Jede Funktion: wie sie heißt, was sie tut, an welcher Station der Reise
   sie sich öffnet (null: immer da) und wie sie sich zeigt. */
const FUNKTIONEN = [
  { id: "werkzeuge", icon: "🧰", titel: "Werkzeuge", text: "Zum Durchwischen: Anker, Swish, Reframing, Wenn-dann, Dämonen zum Frühstück.", schluessel: "werkzeuge",
    tun: (api) => api.entdecken("werkzeuge") },
  { id: "verlauf", icon: "📈", titel: "Verlauf und Zusammenhänge", text: "Körper und Antrieb über den Monat, neben Drang und Geschehen.", schluessel: "verlauf",
    zeige: (api) => verlauf(api) },
  { id: "lebenszeit", icon: "⏳", titel: "Lebenszeit", text: "Was Kaffee, Kippe, Video vorher kosteten — und was jetzt frei wird.", schluessel: "lebenszeit",
    zeige: (api) => lebenszeitKarte(api) || el("p", "leise", "Die Lebenszeit rechnet mit dem, was du sein lässt. Du baust gerade nur auf.") },
  { id: "gemeinsam", icon: "👥", titel: "Gemeinsam", text: "Mit anderen durch den Oktober: wer heute dabei ist.", schluessel: "gemeinsam",
    zeige: (api) => gemeinsam(api) || el("p", "leise", "Die Gruppe ist gerade nicht erreichbar. Alles andere läuft weiter.") },
  { id: "gremlin", icon: "👾", titel: "Dein Gremlin", text: "Der Teil, der von Drama lebt — und eine Aufgabe bekommt.", schluessel: "gremlin",
    zeige: (api) => gremlinKarte(api) },
  { id: "wissen", icon: "📚", titel: "Wissen und Rückblick", text: "Zum Durchwischen: wie ein Drang verläuft, Routinen, der Rückblick.", schluessel: "ebenen",
    tun: (api) => api.entdecken("wissen") },
  { id: "leitgedanke", icon: "🕯️", titel: "Leitgedanke", text: "Ein eigener Satz, der dich begleitet.", schluessel: "leitgedanke",
    tun: (api) => api.leitgedankeBearbeiten() },
  { id: "tracker", icon: "➕", titel: "Deine Tracker", text: "Etwas dazunehmen, abwählen, umbenennen.", schluessel: "tracker",
    tun: (api) => api.trackerWaehlen() },
  { id: "reise", icon: "🧭", titel: "Deine Reise", text: "Was sich schon geöffnet hat und was als Nächstes kommt.", schluessel: null,
    zeige: (api) => reise(api) },
  { id: "einstellungen", icon: "⚙️", titel: "Einstellungen", text: "Darstellung und deine Daten.", schluessel: null,
    tun: (api) => api.einstellungen() },
];

export function mehrSeite(api) {
  const s = el("section", "seite");
  s.append(seitenKopf("Mehr"));
  const l = el("div", "mehr-liste");
  /* Was schon offen ist, steht oben; was noch zu ist, darunter. */
  const istOffen = (f) => !f.schluessel || api.offen(f.schluessel);
  for (const f of [...FUNKTIONEN.filter(istOffen), ...FUNKTIONEN.filter((f) => !istOffen(f))]) {
    const offen = istOffen(f);
    const b = knopf("", "mehr-zeile", () => (offen && f.tun ? f.tun(api) : api.seite("mehr", f.id)));
    if (!offen) b.dataset.zu = "";
    const t = el("span", "mehr-text");
    t.append(el("span", "mehr-titel", f.titel), el("span", "leise klein", offen ? f.text : `Öffnet sich: ${api.station(f.schluessel)?.wann || "unterwegs"}`));
    b.append(el("span", "mehr-icon", f.icon), t, el("span", "mehr-pfeil", offen ? "›" : "🔒"));
    l.append(b);
  }
  s.append(l);
  return s;
}

/* Eine Funktion auf ihrer eigenen Seite — oder, noch zu, was sie öffnet. */
export function funktionSeite(api, id) {
  const f = FUNKTIONEN.find((x) => x.id === id);
  if (!f) return mehrSeite(api);
  const s = el("section", "seite");
  s.append(seitenKopf(f.titel, () => api.seite("mehr")));
  if (f.schluessel && !api.offen(f.schluessel)) {
    const st = api.station(f.schluessel);
    const k = el("div", "zu-karte");
    k.append(el("p", "serif", f.text),
      el("p", "leise", `Das öffnet sich auf deiner Reise von selbst — durch: ${st.wann}. Du kannst es auch jetzt schon öffnen — dann öffnet sich auch, was auf der Reise davor liegt.`),
      knopf("Jetzt schon öffnen", "gross", () => api.reiseBis(f.schluessel)));
    s.append(k);
    return s;
  }
  if (f.tun) { s.append(el("p", "leise", f.text), knopf(f.titel, "gross", () => f.tun(api))); return s; }
  s.append(f.zeige(api));
  return s;
}


function reise(api) {
  const l = el("ol", "reise-liste");
  for (const r of api.stationen()) {
    const li = el("li");
    li.dataset.stand = r.offen ? "offen" : r.naechste ? "naechste" : "zu";
    li.append(el("span", "reise-titel", r.titel), el("span", "reise-tag", r.offen ? "✓ offen" : r.wann));
    l.append(li);
  }
  const k = el("div");
  k.append(l);
  const noch = api.reise().noch;
  if (noch) k.append(el("p", "leise klein", noch));
  return k;
}
