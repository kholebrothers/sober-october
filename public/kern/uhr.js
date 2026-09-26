/* =====================================================================
   Die Dev-Uhr — nur lokal.

   Ein kleines Pult unten links, mit dem sich der "aktuelle Tag" vor- und
   zurückschalten lässt: Tag 1, Tag 2, Tag 3, wieder zurück. Damit lässt sich
   ansehen, was ein Lauf, ein freier Tag oder eine lange Pause mit der Seite
   macht, ohne eine Woche zu warten.

   ## Wie

   Die Seite bekommt eine verschobene Uhr: `Date` wird durch eine Klasse
   ersetzt, die für "jetzt" die echte Zeit plus die gewählten Tage liefert.
   Damit geht alles mit — der Tag, der Sonnenstand, der Begleiter —, ohne
   dass irgendein Modul davon weiß. Jede Anfrage an /api/ bekommt den Kopf
   `x-dev-tage`, und der Worker glaubt ihn, wenn er lokal mit DEV_UHR läuft
   (server/dev-uhr.js). Die Verschiebung steht im localStorage und gilt
   nach dem Neuladen weiter.

   Dieses Skript muss **vor** allen anderen Modulen laufen — was sich
   `Date.now` vorher gemerkt hat, bleibt bei der echten Zeit.

   Auf jedem anderen Host als localhost (und hier: den Vorschau-Adressen)
   tut es nichts.
   ===================================================================== */

export const TAG_MS = 86400000;
const SCHLUESSEL = "dev.tage";

/** Eine Date-Klasse, deren "jetzt" um `tage` verschoben ist. */
export function verschobeneZeit(Echt, tage, echtJetzt) {
  if (!tage) return Echt;
  const jetzt = () => (echtJetzt ? echtJetzt() : Echt.now()) + tage * TAG_MS;
  return class Verschoben extends Echt {
    constructor(...a) { if (a.length) super(...a); else super(jetzt()); }
    static now() { return jetzt(); }
  };
}

/* sober-october: auch auf den Vorschau-Adressen (<alias>-sober-october.…
   workers.dev), damit sich eine Vorschau durch den Oktober spulen lässt.
   Auf der Live-Adresse (sober-october.…) bleibt die Uhr aus. */
function lokal(ort) {
  return ort && (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(ort.hostname) ||
    /-sober-october\.[a-z0-9-]+\.workers\.dev$/.test(ort.hostname));
}

function lies() {
  try { return parseInt(localStorage.getItem(SCHLUESSEL), 10) || 0; } catch (e) { return 0; }
}
function setze(tage) {
  try { if (tage) localStorage.setItem(SCHLUESSEL, String(tage)); else localStorage.removeItem(SCHLUESSEL); } catch (e) {}
}

function pult(tage) {
  const heute = new Date();
  const kurz = heute.toLocaleDateString("de-DE", {weekday: "short", day: "numeric", month: "numeric"});
  const box = document.createElement("div");
  box.id = "dev-uhr";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Dev-Uhr");
  box.innerHTML =
    '<b>DEV</b>' +
    '<button type="button" data-tu="-1" aria-label="Einen Tag zurück">‹</button>' +
    '<span class="d-tag"></span>' +
    '<button type="button" data-tu="1" aria-label="Einen Tag vor">›</button>' +
    '<button type="button" data-tu="0" class="d-echt">heute</button>';
  box.querySelector(".d-tag").textContent = kurz + (tage ? " (" + (tage > 0 ? "+" : "") + tage + ")" : "");
  box.querySelector(".d-echt").hidden = !tage;
  box.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    const d = +b.dataset.tu;
    setze(d === 0 ? 0 : tage + d);
    location.reload();
  });
  const stil = document.createElement("style");
  stil.textContent =
    "#dev-uhr{position:fixed;left:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:9999;" +
    "display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:10px;" +
    "font:600 12px/1 ui-monospace,Menlo,monospace;background:rgba(20,20,20,.86);color:#fff;" +
    "box-shadow:0 2px 10px rgba(0,0,0,.25)}" +
    "#dev-uhr b{color:#f5c542;letter-spacing:.08em;padding:0 4px}" +
    "#dev-uhr button{font:inherit;color:#fff;background:rgba(255,255,255,.12);border:0;border-radius:6px;" +
    "min-width:28px;height:26px;padding:0 8px;cursor:pointer}" +
    "#dev-uhr button:hover{background:rgba(255,255,255,.24)}" +
    "#dev-uhr .d-tag{padding:0 6px;white-space:nowrap}" +
    /* Unten sitzt auch die Meldung — sie rückt über das Pult. */
    "body:has(#dev-uhr) .fx-meldung{bottom:calc(58px + env(safe-area-inset-bottom))}" +
    (tage ? "#dev-uhr{outline:2px solid #f5c542}" : "");
  document.head.appendChild(stil);
  const dran = () => document.body.appendChild(box);
  if (document.body) dran(); else addEventListener("DOMContentLoaded", dran);
}

/* ---- Einschalten, wenn wir lokal sind -------------------------------- */
if (typeof location !== "undefined" && lokal(location)) {
  const tage = lies();
  if (tage) {
    globalThis.Date = verschobeneZeit(Date, tage);
    const echtesFetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (was, wie) => {
      const url = new URL(typeof was === "string" ? was : was.url, location.href);
      if (!url.pathname.startsWith("/api/")) return echtesFetch(was, wie);
      const kopf = new Headers((wie && wie.headers) || (typeof was === "string" ? undefined : was.headers));
      kopf.set("x-dev-tage", String(tage));
      return echtesFetch(was, Object.assign({}, wie, {headers: kopf}));
    };
  }
  pult(tage);
}
