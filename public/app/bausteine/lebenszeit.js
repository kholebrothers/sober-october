/* Baustein „Lebenszeit" — unter dem Monat, von selbst an, ab Schicht 1.

   Oben groß: was heute frei geworden ist, daneben der Oktober bisher.
   Darunter je Tracker zum Sein-lassen eine Reihe: einmal, wie viel Zeit er
   vorher am Tag gekostet hat; danach, wie viel heute. Und wofür die freie
   Zeit ging — Routinen, Menschen, oder einfach zweckfrei. */

import { el, knopf, faerbe } from "../ansichten/teile.js";

export function lebenszeitKarte(api) {
  const V = api.VERZICHTE;
  const lassen = api.gewaehlt().filter((v) => !V[v].aufbau);
  if (!lassen.length) return null;
  const L = api.lebenszeit();
  const k = el("section", "lebenszeit");
  k.dataset.katze = "weg";

  const kopf = el("div", "lz-kopf");
  const heute = L.heute;
  const gross = el("div", "lz-gross");
  gross.append(el("strong", "lz-zahl", heute === null ? "—" : api.dauer(heute)),
    el("span", "lz-wort", heute === null ? "heute frei geworden — sag, wie viel du gebraucht hast" : "heute frei geworden"));
  kopf.append(el("p", "rubrik", "Lebenszeit"), gross);
  if (L.monat.tage) kopf.append(el("p", "lz-monat leise", `Oktober bisher: ${api.dauer(L.monat.frei)} an ${L.monat.tage} ${L.monat.tage === 1 ? "Tag" : "Tagen"}`));
  k.append(kopf);

  for (const v of lassen) {
    const r = faerbe(el("div", "lz-reihe"), V, v);
    const vorher = L.vorher[v];
    if (vorher === undefined) {
      r.append(el("span", "lz-frage", `Wie viel Zeit hat ${V[v].name} dir bisher am Tag genommen?`));
      r.append(stufen(api, (m) => api.zeitVorherSetzen(v, m), null, `lz-vorher-${v}`));
    } else {
      const name = el("span", "lz-name");
      name.append(el("span", null, V[v].name), el("span", "leise klein", ` vorher ~${api.dauer(vorher)}`));
      const aendern = knopf("ändern", "text klein lz-aendern", () => api.zeitVorherSetzen(v, null));
      aendern.setAttribute("aria-label", `${V[v].name}: Zeit von vorher ändern`);
      name.append(aendern);
      r.append(name, stufen(api, (m) => api.zeitHeuteSetzen(v, m), L.zeitHeute[v], `lz-heute-${v}`, vorher));
    }
    k.append(r);
  }

  if (heute !== null) {
    const f = el("div", "lz-fuer");
    f.append(el("span", "leise klein", "Wofür war die freie Zeit?"));
    const chips = el("div", "chips-reihe");
    for (const x of api.zeitFuer()) {
      const an = L.fuerHeute.includes(x.id);
      const b = knopf(x.name, "chip-knopf lz-chip", () => api.zeitFuerSchalten(x.id));
      b.setAttribute("aria-pressed", an);
      b.dataset.focus = `lz-fuer-${x.id}`;
      chips.append(b);
    }
    f.append(chips);
    k.append(f);
  }
  return k;
}

/* Die Stufen als Reihe kleiner Knöpfe. Bei „heute" ist die Stufe von
   vorher markiert, damit man sieht, wo man herkommt. */
function stufen(api, setzen, gewaehlt, fokus, vorher) {
  const r = el("div", "lz-stufen");
  r.setAttribute("role", "radiogroup");
  for (const m of api.zeitStufen()) {
    const b = knopf(m === 0 ? "0" : m >= 60 ? `${m / 60} h` : `${m}′`, "lz-stufe", () => setzen(gewaehlt === m ? null : m));
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", gewaehlt === m);
    b.setAttribute("aria-label", m === 0 ? "keine Zeit" : api.dauer(m));
    b.dataset.focus = `${fokus}-${m}`;
    if (vorher === m) b.dataset.vorher = "";
    r.append(b);
  }
  return r;
}
