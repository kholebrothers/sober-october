/* PROTOTYP — Variante C „Faden".
   Text zuerst. Oben der Satz des Commitments und die Verben, darunter ein
   Faden aus dem, was notiert wurde, mit den eigenen Worten, wörtlich.
   Es gibt kein Menü: Wissen kommt als Eintrag in den Faden, im Moment, in
   dem es verdient ist. Gewählte Ebenen werden an bestimmten Tagen einmal
   angeboten (Tag 2: Verlauf, Tag 3: Gemeinsam) und dann nicht wieder. */

export const NAME = "Faden";
const ANGEBOT = { verlauf: 2, gemeinsam: 3 };

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const s = document.createElement("section");
  s.className = "vc";
  s.innerHTML = `<h1 class="serif">${api.commitmentSatz()}</h1><p class="vc-tag">Tag ${api.tagNr(z.heute)}.</p>`;

  const verben = document.createElement("div");
  verben.className = "vc-verben";
  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const p = document.createElement("p");
    p.innerHTML = `<span class="leise">${V.name}:</span> `;
    const b = (t, f) => { const x = document.createElement("button"); x.type = "button"; x.className = "text vc-verb"; x.textContent = t; x.onclick = f; return x; };
    p.append(b(V.habe, () => api.eintragen(v, "habe")));
    if (z.wahl[v].drang) p.append(" · ", b(V.drang, () => api.eintragen(v, "drang")));
    verben.append(p);
  }
  s.append(verben);

  // Den Faden zusammensetzen: Einträge, geöffnete Ebenen, Angebote.
  const posten = [];
  for (const e of z.ereignisse) posten.push({ tag: e.tag, zeit: e.zeit, typ: "eintrag", e });
  for (const eb of EBENEN) {
    const f = z.frei[eb.id];
    if (eb.art === "verdient" && f) posten.push({ tag: f.tag, zeit: f.zeit, typ: "spur", eb });
    if (eb.art === "gewaehlt") {
      const tagN = api.tagNr(z.heute);
      if (f) posten.push({ tag: f.tag, zeit: f.zeit, typ: "an", eb });
      else if (tagN >= ANGEBOT[eb.id]) posten.push({ tag: z.heute, zeit: "99", typ: "angebot", eb });
    }
  }
  posten.sort((a, b) => (b.tag + b.zeit).localeCompare(a.tag + a.zeit));

  const faden = document.createElement("ol");
  faden.className = "vc-faden";
  let letzterTag = null;
  for (const p of posten) {
    if (p.tag !== letzterTag) {
      letzterTag = p.tag;
      faden.insertAdjacentHTML("beforeend", `<li class="vc-kopf bogen-rubrik">Tag ${api.tagNr(p.tag)}</li>`);
    }
    const li = document.createElement("li");
    li.className = `vc-${p.typ}`;
    if (p.typ === "eintrag") {
      const { e } = p;
      const V = VERZICHTE[e.verzicht];
      const was = e.art === "ohne" ? `ohne ${V.name}` : e.art === "habe" ? V.habe : V.drang;
      li.innerHTML = `<span class="leise">${e.zeit}</span> ${was}`;
      // Nur Freitext wird zitiert; eine Auswahl sind nicht die eigenen Worte.
      for (const [k, w] of Object.entries(e.antworten)) {
        const gewaehlt = k === "gefuehl" || k === "damit";
        li.append(Object.assign(document.createElement("span"), { className: gewaehlt ? "zitat wahl" : "zitat", textContent: gewaehlt ? w : `„${w}"` }));
      }
    } else if (p.typ === "spur") {
      li.innerHTML = `<span class="leise">Eine Spur öffnet sich.</span> `;
      const b = document.createElement("button");
      b.type = "button"; b.className = "text"; b.textContent = `${p.eb.titel} →`;
      b.onclick = () => api.oeffneEbene(p.eb.id);
      li.append(b);
    } else if (p.typ === "angebot") {
      li.innerHTML = `<span class="leise">Wenn du magst:</span> `;
      const b = document.createElement("button");
      b.type = "button"; b.className = "text"; b.textContent = `${p.eb.titel} einschalten`;
      b.onclick = () => api.einschalten(p.eb.id);
      li.append(b);
    } else {
      const b = document.createElement("button");
      b.type = "button"; b.className = "text"; b.textContent = `${p.eb.titel} →`;
      b.onclick = () => api.oeffneEbene(p.eb.id);
      li.append(b);
    }
    faden.append(li);
  }
  if (!posten.length) faden.insertAdjacentHTML("beforeend", `<li class="leise">Noch nichts. Der Tag steht da.</li>`);
  s.append(faden);
  return s;
}
