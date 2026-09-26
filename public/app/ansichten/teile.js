/* Was alle drei Ansichten teilen: der Kopf und ein paar Bausteine. Das
   Layout darunter gehört jeder Ansicht selbst. */

export function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function knopf(text, klasse, beiKlick) {
  const b = el("button", klasse, text);
  b.type = "button";
  b.onclick = beiKlick;
  return b;
}

/** Die Kopfzeile: links der Tag, rechts optional etwas, dann „Einstellungen". */
export function kopf(api, rechts) {
  const k = el("header", "kopf");
  k.append(el("span", "rubrik", api.tagesZeile()));
  const r = el("span", "kopf-rechts");
  if (rechts) r.append(rechts);
  const e = knopf("⋯", "rund klein", () => api.einstellungen());
  e.setAttribute("aria-label", "Einstellungen");
  r.append(e);
  k.append(r);
  if (!api.gewaehlt().length) return k;
  const f = el("div", "kopf-flaeche");
  f.append(k, laufZeile(api));
  return f;
}

/** Der Lauf aus dem Kopf von lifetracker: die Zahl der Tage dabei und die
    Kette, die auf der Fibonacci-Leiter einrastet (5, 8, 13, 21, 34). */
export function laufZeile(api) {
  const n = api.serie();
  const l = api.lauf();
  const h = el("div", "lauf");
  const zahl = el("div", n ? "lauf-zahl an" : "lauf-zahl");
  zahl.append(el("span", "n", String(n)), el("span", "u", n === 1 ? "Tag dabei" : "Tage dabei"));
  const kette = el("div", "kette");
  const text = [];
  for (const t of l.tage) {
    const p = el("span", "glied");
    p.dataset.stand = t.stand;
    if (t.heute) p.dataset.heute = "";
    kette.append(p);
    if (t.stand !== "kommt") text.push(t.stand === "dabei" ? "dabei" : t.heute ? "noch offen" : "nichts");
  }
  kette.setAttribute("role", "img");
  kette.setAttribute("aria-label", `Dein Lauf, Tag 1 bis heute: ${text.join(", ")}` +
    (l.fenster > l.weit ? ` — dann noch ${l.fenster - l.weit} Tage bis ${l.fenster}` : ""));
  const unten = el("div", "kette-zeile");
  unten.append(kette, el("span", "leise klein", `${l.dabeiTage} von ${l.fenster} Tagen`));
  h.append(zahl, unten);
  return h;
}

/** Wie ein Eintrag in einer Zeile heißt. */
export function wasText(api, e) {
  const V = api.VERZICHTE[e.verzicht];
  return e.art === "ohne" ? `ohne ${V.name}` : e.art === "habe" ? V.habe : V.drang;
}
