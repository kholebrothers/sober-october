/* =====================================================================
   Die Erfassung — der Vollbild-Check-in hinter dem „+" unten

   Wie beim Erstellen in Instagram: das „+" in der Mitte der Leiste zeigt
   zuerst eine Liste — Stimmung, Schlaf, Menge, Körper, Antrieb, Selbst.
   Wer eine wählt, bekommt die Eingabe als Vollbild; die anderen Arten
   liegen links und rechts daneben, zum Wischen. Jede Eingabe ist ein
   Tippen, alles speichert sofort; Punkte oben zeigen, was schon
   festgehalten ist.

   Die Erfassung weiß nichts vom Speicher: `k` bringt den Tag, was an ihm
   steht, und wie man schreibt.
   ===================================================================== */

import { el, knopf } from "./ansichten/teile.js";
import { AMPEL, SCHLAF_DAUER, SCHLAF_TEILE, AMPEL_SYSTEME, SYSTEME, SELBST, SELBST_MAX, AFFEKTE,
  mengen, ampelAlsWert, wertAlsAmpel } from "./logik.js";

export const ARTEN = ["stimmung", "schlaf", "konsum", "koerper", "antrieb", "selbst"];
const ART = {
  stimmung: { icon: "🙂", name: "Stimmung", frage: "Was ist da?" },
  schlaf: { icon: "🌙", name: "Schlaf", frage: "Wie hast du geschlafen?" },
  konsum: { icon: "☕", name: "Menge", frage: "Wie viel war es heute?" },
  koerper: { icon: "🏃", name: "Körper", frage: "Wie geht es deinem Körper?" },
  antrieb: { icon: "⚡", name: "Antrieb", frage: "Wie viel Kraft ist da?" },
  selbst: { icon: "✨", name: "Selbst", frage: "Was hat sich gezeigt?" },
};

/** Steht an dem Tag schon etwas in dieser Art? */
export function hatWert(art, e) {
  if (art === "stimmung") return !!e.affekte?.length;
  if (art === "schlaf") return e.schlafDauer !== undefined || SCHLAF_TEILE.some((x) => e[x.id]);
  if (art === "konsum") return !!e.menge;
  if (art === "selbst") return !!e.selbst?.length;
  return AMPEL_SYSTEME[art].some((id) => e[id]);
}

/** Welche Arten es für diesen Tag gibt (Menge nur, wenn man etwas sein lässt). */
export const artenFuer = (k) => ARTEN.filter((a) => a !== "konsum" || k.lassen.length);
export const artInfo = (a) => ART[a];

/**
 * Die Auswahl hinter dem „+": ein Overlay mit allen Möglichkeiten als
 * Liste, über der Leiste. Ein Tippen wählt — oder man hält das „+"
 * gedrückt, zieht auf eine Zeile und lässt los (siehe haupt.js).
 * @param e der Tagebuch-Eintrag (für die Häkchen)
 */
export function auswahl(k, waehle, schliessen) {
  const e = k.eintrag();
  const o = el("div", "plus-overlay");
  o.addEventListener("click", (ev) => { if (ev.target === o) schliessen(); });
  const l = el("div", "plus-liste");
  l.setAttribute("role", "menu");
  l.append(el("p", "rubrik plus-titel", "Was möchtest du festhalten?"));
  for (const a of artenFuer(k)) {
    const b = knopf("", "plus-option", () => waehle(a));
    b.dataset.art = a;
    b.setAttribute("role", "menuitem");
    b.append(el("span", "plus-icon", ART[a].icon), el("span", "plus-name", ART[a].name));
    if (hatWert(a, e)) b.append(el("span", "komponist-da", "✓"));
    l.append(b);
  }
  o.append(l);
  return o;
}

/**
 * Die Eingabe: eine Seite je Art, nebeneinander, zum Wischen — wie
 * Stories. Oben der Tag, die Punkte und „Fertig". Eine Eingabe zeichnet
 * nur ihre eigene Seite neu; die Position bleibt, wo sie ist.
 * @returns {el, auffrischen} — auffrischen() zeichnet die sichtbare Seite neu
 */
export function komponist(k, start, fertig) {
  const arten = artenFuer(k);
  const w = el("div", "komponist");
  const kopf = el("div", "komponist-kopf");
  const zu = knopf("✕", "komponist-zu", fertig);
  zu.setAttribute("aria-label", "Schließen");
  const punkte = el("div", "komponist-punkte");
  punkte.setAttribute("aria-hidden", "true");
  kopf.append(zu, punkte, knopf("Fertig", "komponist-fertig", fertig));

  const bahn = el("div", "komponist-bahn");
  const seiten = arten.map((a) => {
    const s = el("section", "komponist-seite");
    s.dataset.art = a;
    s.setAttribute("aria-label", ART[a].name);
    bahn.append(s);
    return s;
  });
  const fuellen = (s) => {
    const a = s.dataset.art;
    s.replaceChildren(el("p", "komponist-icon", ART[a].icon), el("h2", "komponist-frage serif", ART[a].frage), ...INHALT[a](k, k.eintrag()));
  };
  const markiere = () => {
    const i = Math.round(bahn.scrollLeft / Math.max(1, bahn.clientWidth));
    const e = k.eintrag();
    punkte.replaceChildren(...arten.map((a, j) => {
      const p = el("i");
      if (j === i) p.className = "an";
      if (hatWert(a, e)) p.dataset.da = "";
      return p;
    }));
  };
  seiten.forEach(fuellen);
  bahn.addEventListener("scroll", () => requestAnimationFrame(markiere), { passive: true });
  w.append(kopf, bahn, el("p", "komponist-hinweis leise klein", "Wischen für mehr"));
  requestAnimationFrame(() => {
    const i = Math.max(0, arten.indexOf(start));
    bahn.scrollLeft = i * bahn.clientWidth;
    markiere();
  });
  const auffrischen = () => {
    const i = Math.round(bahn.scrollLeft / Math.max(1, bahn.clientWidth));
    if (seiten[i]) fuellen(seiten[i]);
    markiere();
  };
  return { el: w, auffrischen };
}

/** Der Satz zum Tag — immer da, direkt zum Schreiben. */
export function satzFeld(k) {
  const e = k.eintrag();
  const l = el("label", "satz-feld");
  const i = el("textarea");
  Object.assign(i, { name: "getragen", value: e.getragen || "", maxLength: 280, rows: 2,
    placeholder: k.heute ? "Wie war’s heute? Ein paar Worte …" : "Wie war’s an dem Tag? Ein paar Worte …" });
  i.setAttribute("aria-label", "Ein Satz zum Tag");
  i.dataset.focus = "satz";
  i.enterKeyHint = "done";
  /* Leise speichern: das Feld verlässt man meist, indem man etwas anderes
     antippt — neu zu zeichnen hieße, diesen Tipp zu verschlucken. */
  i.addEventListener("change", () => (k.schreibeLeise || k.schreibe)({ getragen: i.value }));
  i.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); i.blur(); } });
  l.append(i);
  return l;
}

/* Eine Reihe gleichwertiger Wahlen; ein zweites Tippen auf dieselbe nimmt sie weg. */
function wahlreihe(name, werte, jetzt, setzen, klasse = "") {
  const r = el("div", `wahl-segmente ${klasse}`);
  r.setAttribute("role", "radiogroup");
  r.setAttribute("aria-label", name);
  werte.forEach((t, i) => {
    const b = knopf(t, "segment", () => setzen(jetzt === i ? null : i));
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", jetzt === i);
    r.append(b);
  });
  return r;
}

/* Die Ampel: drei Punkte, rot, gelb, grün — für ein Gefühl, nie für ein Verhalten. */
function ampel(name, jetzt, setzen) {
  const z = el("div", "ampel-zeile");
  z.append(el("span", "ampel-name", name));
  const r = el("div", "ampel");
  r.setAttribute("role", "radiogroup");
  r.setAttribute("aria-label", name);
  [1, 2, 3].forEach((a) => {
    const b = knopf("", "ampel-punkt", () => setzen(jetzt === a ? 0 : a));
    b.dataset.ampel = a;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", jetzt === a);
    b.setAttribute("aria-label", `${name}: ${AMPEL[a - 1]}`);
    r.append(b);
  });
  z.append(r);
  return z;
}

const systemName = (id) => SYSTEME.find((x) => x.id === id).name;

const INHALT = {
  stimmung: (k, e) => {
    const r = el("div", "affekte");
    r.setAttribute("aria-label", "Was ist da? So viele, wie da sind.");
    const jetzt = e.affekte || [];
    for (const x of AFFEKTE) {
      const an = jetzt.includes(x.id);
      const b = knopf("", "affekt", () => k.schreibe({ affekte: an ? jetzt.filter((y) => y !== x.id) : [...jetzt, x.id] }));
      b.setAttribute("aria-pressed", an);
      b.setAttribute("aria-label", `${x.name} (${x.quelle})`);
      b.title = x.quelle;
      b.append(el("span", "affekt-emoji", x.emoji), el("span", "affekt-name", x.name));
      r.append(b);
    }
    return [el("p", "erfassung-frage", "Tipp alles an, was du spürst."), r,
      el("p", "leise klein affekt-quelle", "Nach Mark Solms und Jaak Panksepp: die sieben Grundsysteme, dazu Wollen, Mögen und Ekel.")];
  },
  schlaf: (k, e) => [
    el("p", "erfassung-frage", "Wie lange?"),
    wahlreihe("Schlafdauer", SCHLAF_DAUER, e.schlafDauer ?? null, (i) => k.schreibe({ schlafDauer: i ?? -1 })),
    ...SCHLAF_TEILE.map((x) => ampel(x.name, e[x.id] || 0, (a) => k.schreibe({ schlafTeile: { [x.id]: a } }))),
  ],
  konsum: (k, e) => k.lassen.map((v) => {
    const m = mengen(v.id);
    const z = el("div", "konsum-zeile");
    z.append(el("p", "erfassung-frage", m.frage ? `${v.name} · ${m.frage}` : v.name),
      wahlreihe(`${v.name}: wie viel`, m.stufen, e.menge?.[v.id] ?? null, (i) => k.schreibe({ menge: { [v.id]: i ?? -1 } })));
    return z;
  }),
  koerper: (k, e) => AMPEL_SYSTEME.koerper.map((id) => ampel(systemName(id), wertAlsAmpel(e[id]), (a) => k.schreibe({ werte: { [id]: ampelAlsWert(a) } }))),
  antrieb: (k, e) => AMPEL_SYSTEME.antrieb.map((id) => ampel(systemName(id), wertAlsAmpel(e[id]), (a) => k.schreibe({ werte: { [id]: ampelAlsWert(a) } }))),
  selbst: (k, e) => {
    const r = el("div", "chips");
    const jetzt = e.selbst || [];
    SELBST.forEach((wort, i) => {
      const an = jetzt.includes(i);
      const b = knopf(wort, "chip-knopf selbst-chip", () => k.schreibe({ selbst: an ? jetzt.filter((x) => x !== i) : [...jetzt, i] }));
      b.setAttribute("aria-pressed", an);
      b.disabled = !an && jetzt.length >= SELBST_MAX;
      r.append(b);
    });
    return [el("p", "erfassung-frage", `Was hat sich gezeigt? Höchstens ${SELBST_MAX === 2 ? "zwei" : SELBST_MAX}.`), r];
  },
};
