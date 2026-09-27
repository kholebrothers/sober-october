/* =====================================================================
   Die Erfassung eines Tages — direkt in der Seite

   Ein Tag startet leer. Ist er begonnen, schlägt die Erfassung vor, was
   sich festhalten lässt: Stimmung, Schlaf, Konsum, ein Satz, Körper,
   Antrieb, Selbst — als eine Reihe. Ein Tippen klappt genau eine Art auf;
   jede Eingabe ist ein Tippen auf eine Kategorie — keine Skalen, kein
   Speichern-Knopf.

   Dieselbe Erfassung steht auf dem Startschirm (heute) und im Blatt eines
   anderen Tages (aus dem Kalender). Sie weiß nichts vom Speicher: `k`
   bringt den Tag, was an ihm steht, und wie man schreibt.
   ===================================================================== */

import { el, knopf } from "./ansichten/teile.js";
import { ERFASSUNG, AMPEL, SCHLAF_DAUER, SCHLAF_TEILE, AMPEL_SYSTEME, SYSTEME, SELBST, SELBST_MAX, STIMMUNG,
  mengen, ampelAlsWert, wertAlsAmpel } from "./logik.js";

export const GESICHTER = ["😣", "🙁", "😐", "🙂", "😄"];

const ART = {
  stimmung: { icon: "🙂", name: "Stimmung" },
  schlaf: { icon: "🌙", name: "Schlaf" },
  konsum: { icon: "☕", name: "Konsum" },
  satz: { icon: "✏️", name: "Ein Satz" },
  koerper: { icon: "🏃", name: "Körper" },
  antrieb: { icon: "⚡", name: "Antrieb" },
  selbst: { icon: "✨", name: "Selbst" },
};

/** Steht an dem Tag schon etwas in dieser Art? */
function hatWert(art, e) {
  if (art === "stimmung") return !!e.stimmung;
  if (art === "schlaf") return e.schlafDauer !== undefined || SCHLAF_TEILE.some((x) => e[x.id]);
  if (art === "konsum") return !!e.menge;
  if (art === "satz") return !!e.getragen;
  if (art === "selbst") return !!e.selbst?.length;
  return AMPEL_SYSTEME[art].some((id) => e[id]);
}

/* Welche Art gerade aufgeklappt ist — immer höchstens eine, je Tag. Eine
   Ansichtssache, kein Datum: sie steht neben dem Zustand, nicht darin. */
let auf = { tag: null, art: null };

/**
 * Eine Reihe Vorschläge; ein Tippen klappt genau einen auf, ein zweites
 * klappt ihn wieder zu. Was schon festgehalten ist, zeigt sich im
 * Vorschlag selbst (das Gesicht, ein Häkchen) — so bleibt die Seite ruhig.
 * @param k {tag, eintrag(), lassen: [{id, name}], schreibe(was), neu(), heute}
 */
export function erfassung(k) {
  const e = k.eintrag();
  const arten = ERFASSUNG.filter((a) => a !== "konsum" || k.lassen.length);
  if (auf.tag !== k.tag) auf = { tag: k.tag, art: null };
  const w = el("div", "erfassung");
  const r = el("div", "erfassung-vorschlaege");
  for (const art of arten) {
    const offen = auf.art === art, da = hatWert(art, e);
    const b = knopf("", "erfassung-vorschlag", () => { auf = { tag: k.tag, art: offen ? null : art }; k.neu(); });
    b.dataset.focus = `hinzu-${art}`;
    b.setAttribute("aria-expanded", offen);
    if (da) b.dataset.da = "";
    b.append(el("span", "erfassung-icon", art === "stimmung" && e.stimmung ? GESICHTER[e.stimmung - 1] : ART[art].icon),
      el("span", null, ART[art].name));
    if (da && art !== "stimmung") b.append(el("span", "erfassung-da", "✓"));
    r.append(b);
  }
  w.append(r);
  if (auf.art && arten.includes(auf.art)) w.append(feld(auf.art, k, e));
  return w;
}

/* Das aufgeklappte Feld. */
function feld(art, k, e) {
  const f = el("section", "erfassung-feld");
  f.dataset.art = art;
  f.setAttribute("aria-label", ART[art].name);
  f.append(...INHALT[art](k, e));
  return f;
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
    const r = el("div", "gesichter");
    r.setAttribute("role", "radiogroup");
    r.setAttribute("aria-label", "Stimmung");
    GESICHTER.forEach((g, i) => {
      const b = knopf(g, "gesicht", () => k.schreibe({ werte: { stimmung: e.stimmung === i + 1 ? 0 : i + 1 } }));
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", e.stimmung === i + 1);
      b.setAttribute("aria-label", `Stimmung: ${STIMMUNG[i]}`);
      b.dataset.focus = `gesicht-${i + 1}`;
      r.append(b);
    });
    return [r];
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
  satz: (k, e) => {
    const i = Object.assign(document.createElement("input"), { name: "getragen", value: e.getragen || "", autocomplete: "off", maxLength: 280,
      placeholder: k.heute ? "Was hat dich heute getragen?" : "Was hat dich an dem Tag getragen?", enterKeyHint: "done" });
    i.setAttribute("aria-label", "Ein Satz zum Tag");
    i.dataset.focus = "satz";
    i.addEventListener("change", () => k.schreibe({ getragen: i.value }));
    i.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); i.blur(); } });
    return [i];
  },
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
