/* Was alle drei Ansichten teilen: die Kopfzeile und ein paar Helfer. Was
   darüber hinaus oben und unten steht, sind Bausteine (../bausteine/). */

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

/** Die Farbe eines Trackers an ein Element: data-v für die festen, dazu
    --v direkt für die eigenen (die haben keine feste Regel im Stylesheet). */
export function faerbe(e, V, v) {
  e.dataset.v = V[v]?.eigen ? "eigen" : v;
  if (V[v]?.farbe) e.style.setProperty("--v", V[v].farbe);
  return e;
}

/** Die Kopfzeile: die Marke und der Tag. Alles Weitere steht unten unter „Mehr". */
export function kopf(api, rechts) {
  const k = el("header", "kopf");
  const marke = el("div", "kopf-marke");
  marke.append(el("span", "markenname", "Sober October"), el("span", "rubrik", api.tagesZeile()));
  k.append(marke);
  if (rechts) {
    const r = el("span", "kopf-rechts");
    r.append(rechts);
    k.append(r);
  }
  return k;
}

/** Das „+" für einen weiteren Tracker, in jeder Ansicht an derselben Stelle
    der Liste: am Ende. */
export function plusTracker(api, text = "+ Tracker") {
  const b = knopf(text, "text plus-tracker", () => api.neuerTracker());
  b.setAttribute("aria-label", "Weiteren Tracker hinzufügen");
  return b;
}

/** Wie ein Eintrag in einer Zeile heißt. */
export function wasText(api, e) {
  const V = api.VERZICHTE[e.verzicht];
  if (e.art === "getan") return Number.isInteger(e.schritt) && V.schritte?.[e.schritt] ? `${V.name}: ${V.schritte[e.schritt]}` : `${V.name} — getan`;
  return e.art === "ohne" ? `ohne ${V.name}` : e.art === "habe" ? V.habe : V.drang;
}
