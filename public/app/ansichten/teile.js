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
  return k;
}

/** Wie ein Eintrag in einer Zeile heißt. */
export function wasText(api, e) {
  const V = api.VERZICHTE[e.verzicht];
  return e.art === "ohne" ? `ohne ${V.name}` : e.art === "habe" ? V.habe : V.drang;
}
