/* =====================================================================
   Die Erfassung — der Vollbild-Check-in hinter dem „+" unten

   Wie beim Erstellen in Instagram: ein „+" in der Mitte der Leiste öffnet
   eine ruhige Vollbild-Seite. Unten ein Wähler für die Art — Stimmung,
   Schlaf, Menge, Körper, Antrieb, Selbst —, darüber die eine Eingabe,
   um die es gerade geht. Wischen oder Tippen wechselt die Art. Jede
   Eingabe ist ein Tippen, alles speichert sofort; ein Häkchen im Wähler
   zeigt, was schon festgehalten ist.

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

/**
 * Die Vollbild-Seite. `art` ist die gezeigte Art, `wechsle(art)` zeigt eine
 * andere, `fertig()` schließt.
 * @param k {tag, titel, eintrag(), lassen: [{id, name}], schreibe(was)}
 */
export function komponist(k, art, wechsle, fertig) {
  const arten = ARTEN.filter((a) => a !== "konsum" || k.lassen.length);
  if (!arten.includes(art)) art = arten[0];
  const e = k.eintrag();
  const w = el("div", "komponist");
  w.dataset.art = art;

  const kopf = el("div", "komponist-kopf");
  const zu = knopf("✕", "komponist-zu", fertig);
  zu.setAttribute("aria-label", "Schließen");
  kopf.append(zu, el("span", "komponist-tag", k.titel), knopf("Fertig", "komponist-fertig", fertig));

  const mitte = el("div", "komponist-mitte");
  mitte.append(el("p", "komponist-icon", ART[art].icon), el("h2", "komponist-frage serif", ART[art].frage), ...INHALT[art](k, e));
  /* Wischen wechselt die Art, wie zwischen Beitrag, Story und Reel. */
  let x0 = null;
  mitte.addEventListener("touchstart", (ev) => { x0 = ev.touches[0].clientX; }, { passive: true });
  mitte.addEventListener("touchend", (ev) => {
    if (x0 === null) return;
    const dx = ev.changedTouches[0].clientX - x0, i = arten.indexOf(art);
    x0 = null;
    if (Math.abs(dx) > 60) wechsle(arten[Math.min(arten.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1)))]);
  });

  const waehler = el("div", "komponist-waehler");
  waehler.setAttribute("role", "tablist");
  for (const a of arten) {
    const b = knopf("", "komponist-art", () => wechsle(a));
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", a === art);
    b.append(el("span", null, ART[a].name));
    if (hatWert(a, e)) b.append(el("span", "komponist-da", "✓"));
    waehler.append(b);
  }
  w.append(kopf, mitte, waehler);
  requestAnimationFrame(() => waehler.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: "center", block: "nearest" }));
  return w;
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
