/* =====================================================================
   Entdecken — Werkzeuge und Wissen als Feed zum Hochwischen

   Wie bei TikTok und Instagram: eine Karte füllt den Bildschirm; nach oben
   wischen oder rechts tippen zeigt die nächste, links tippen die vorige.
   Oben Balken wie bei Stories. Jede Karte ist ein Werkzeug (Anker, Swish,
   Reframing, Wenn-dann, Dämonen zum Frühstück) mit einem Knopf zum
   Starten, oder ein Stück Wissen (die Ebenen), dessen Text direkt in der
   Karte steht. Technisch nur CSS Scroll-Snap.
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
 * @param api  die App (werkzeug, werkzeugStand, EBENEN, stand, ebenenText)
 * @param fertig schließt den Feed
 * @param start  "werkzeuge" oder "wissen": wo der Feed beginnt
 */
export function feed(api, fertig, start = "werkzeuge") {
  const w = api.werkzeugStand();
  const f = el("div", "feed");
  const zu = knopf("✕", "feed-zu", fertig);
  zu.setAttribute("aria-label", "Schließen");
  const karten = el("div", "feed-karten");

  const karte = (zeichen, rubrik, titel, inhalt, farbe, aktion) => {
    const k = el("article", "feed-karte");
    k.style.setProperty("--c", farbe);
    const text = typeof inhalt === "string" ? el("p", "feed-text", inhalt) : inhalt;
    text.classList.add("feed-inhalt");
    k.append(el("p", "feed-zeichen", zeichen), el("p", "rubrik", rubrik), el("h2", "feed-titel serif", titel), text);
    if (aktion) k.append(aktion);
    karten.append(k);
    return k;
  };

  for (const x of WERKZEUGE)
    karte(x.zeichen, "Werkzeug", x.titel, x.text, x.farbe, knopf(x.knopf(w), "gross feed-los", () => api.werkzeug(x.was(w))));

  /* Das Wissen steht in der Karte selbst — lesen, weiterwischen. */
  let ersteWissen = null;
  for (const e of api.EBENEN) {
    const frei = api.stand(e.id) === "frei";
    const k = karte("📚", e.rubrik, e.titel, frei ? api.ebenenText(e.id) : `Noch zu: ${e.bedingung}.`, "var(--blau)", null);
    if (!frei) k.dataset.zu = "";
    ersteWissen ||= k;
  }

  const alle = [...karten.children];
  const jetzt = () => Math.round(karten.scrollTop / Math.max(1, karten.clientHeight));
  const geh = (i) => karten.scrollTo({ top: Math.max(0, Math.min(alle.length - 1, i)) * karten.clientHeight, behavior: "smooth" });

  /* Oben, wie bei Stories, ein Balken je Karte: wo man ist, wie viele noch. */
  const balken = el("div", "feed-balken");
  balken.setAttribute("aria-hidden", "true");
  for (let i = 0; i < alle.length; i++) balken.append(el("i"));
  const markiere = () => {
    const i = jetzt();
    balken.querySelectorAll("i").forEach((p, j) => p.dataset.stand = j < i ? "gesehen" : j === i ? "jetzt" : "");
  };
  karten.addEventListener("scroll", () => requestAnimationFrame(markiere), { passive: true });

  /* Tippen rechts: weiter; links: zurück — wie bei Instagram. Hoch- und
     runterwischen geht wie bei TikTok, auch mehrere Karten auf einmal. */
  karten.addEventListener("click", (ev) => {
    if (ev.target.closest("button, a, input, textarea, .feed-inhalt ul, details")) return;
    const x = ev.clientX / window.innerWidth;
    if (x > 0.6) geh(jetzt() + 1);
    else if (x < 0.3) geh(jetzt() - 1);
  });

  f.append(karten, balken, zu);
  requestAnimationFrame(() => {
    if (start === "wissen" && ersteWissen) karten.scrollTop = ersteWissen.offsetTop;
    markiere();
  });
  return f;
}
