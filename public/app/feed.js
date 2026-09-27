/* =====================================================================
   Entdecken — Werkzeuge und Wissen als Feed zum Hochwischen

   Wie bei TikTok: eine Karte füllt den Bildschirm, nach oben wischen zeigt
   die nächste. Jede Karte ist ein Werkzeug (Anker, Swish, Reframing,
   Wenn-dann, Dämonen zum Frühstück) oder ein Stück Wissen (die Ebenen).
   Ein Knopf startet das Werkzeug oder öffnet den Text. Technisch nur
   CSS Scroll-Snap — keine Bibliothek, keine Animation, die man abschalten
   müsste.
   ===================================================================== */

import { el, knopf } from "./ansichten/teile.js";

const WERKZEUGE = [
  { id: "anker", zeichen: "⚓", titel: "Anker", farbe: "var(--moss)",
    text: "Einen ruhigen, starken Moment an eine kleine Geste binden. Im Drang-Moment: die Geste — und du bist wieder dort.",
    was: (w) => (w.anker ? "ankerAbrufen" : "ankerSetzen"), knopf: (w) => (w.anker ? "Anker abrufen" : "Anker setzen") },
  { id: "swish", zeichen: "🔄", titel: "Swish", farbe: "var(--teal)",
    text: "Das Bild kurz vor dem Drang wird klein und dunkel, das Bild von dir, wie du sein willst, groß und hell. Fünfmal, schnell.",
    was: () => "swish", knopf: () => "Swish machen" },
  { id: "reframing", zeichen: "🪞", titel: "Reframing", farbe: "var(--lila)",
    text: "Jeder Drang will etwas Gutes für dich — Ruhe, Pause, Nähe. Welche Absicht steckt dahinter, und wie ginge das anders?",
    was: () => "reframing", knopf: () => "Absicht finden" },
  { id: "plaene", zeichen: "➡️", titel: "Wenn-dann", farbe: "var(--gelb)",
    text: "Ein Plan für den nächsten Moment: Wenn der Drang nach dem Essen kommt, dann gehe ich einmal um den Block.",
    was: () => "plaene", knopf: (w) => (w.plaene.length ? `Pläne ansehen · ${w.plaene.length}` : "Plan fassen") },
  { id: "daemon", zeichen: "🍳", titel: "Dämonen zum Frühstück", farbe: "var(--magenta)",
    text: "Sieben Minuten am Morgen: den Trigger des Tages freiwillig auf den Teller legen, bevor er dich überrascht.",
    was: () => "daemon", knopf: () => "7 Minuten beginnen" },
];

/**
 * @param api  die App (werkzeug, werkzeugStand, EBENEN, stand, oeffneEbene)
 * @param fertig schließt den Feed
 * @param start  "werkzeuge" oder "wissen": wo der Feed beginnt
 */
export function feed(api, fertig, start = "werkzeuge") {
  const w = api.werkzeugStand();
  const f = el("div", "feed");
  const zu = knopf("✕", "feed-zu", fertig);
  zu.setAttribute("aria-label", "Schließen");
  const karten = el("div", "feed-karten");

  const karte = (zeichen, rubrik, titel, text, farbe, aktion) => {
    const k = el("article", "feed-karte");
    k.style.setProperty("--c", farbe);
    k.append(el("p", "feed-zeichen", zeichen), el("p", "rubrik", rubrik), el("h2", "feed-titel serif", titel), el("p", "feed-text", text));
    if (aktion) k.append(aktion);
    karten.append(k);
    return k;
  };

  for (const x of WERKZEUGE)
    karte(x.zeichen, "Werkzeug", x.titel, x.text, x.farbe, knopf(x.knopf(w), "gross feed-los", () => api.werkzeug(x.was(w))));

  let ersteWissen = null;
  for (const e of api.EBENEN) {
    const frei = api.stand(e.id) === "frei";
    const k = karte("📚", `Wissen · ${e.rubrik}`, e.titel, frei ? "Ein kurzer Text zum Lesen — wenn du magst." : `Noch zu: ${e.bedingung}.`,
      "var(--blau)", frei ? knopf("Lesen", "gross feed-los", () => api.oeffneEbene(e.id)) : null);
    if (!frei) k.dataset.zu = "";
    ersteWissen ||= k;
  }

  /* Rechts, wie bei TikTok, zeigt eine Spalte Punkte, wo man ist. */
  const punkte = el("div", "feed-punkte");
  punkte.setAttribute("aria-hidden", "true");
  const alle = [...karten.children];
  for (let i = 0; i < alle.length; i++) punkte.append(el("i"));
  const markiere = () => {
    const i = Math.round(karten.scrollTop / Math.max(1, karten.clientHeight));
    punkte.querySelectorAll("i").forEach((p, j) => p.classList.toggle("an", j === i));
  };
  karten.addEventListener("scroll", markiere, { passive: true });

  f.append(karten, zu, punkte);
  requestAnimationFrame(() => {
    if (start === "wissen" && ersteWissen) karten.scrollTop = ersteWissen.offsetTop;
    markiere();
  });
  return f;
}
