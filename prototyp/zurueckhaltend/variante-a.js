/* PROTOTYP — Variante A „Blatt".
   Eine ruhige Liste: je Verzicht eine Zeile mit dem Kreis des Tages.
   Alle Ebenen sind da, aber gefaltet ganz unten — gesperrte zeigen, wie sie
   aufgehen. Das ist die Variante mit dem sichtbaren Menü. */

export const NAME = "Blatt";
let mehrOffen = false;

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const s = document.createElement("section");
  s.className = "va";
  s.innerHTML = `<p class="bogen-rubrik">Oktober · Tag ${api.tagNr(z.heute)}</p>
    <h1 class="serif">${api.commitmentSatz()}</h1>`;

  for (const v of api.gewaehlt()) {
    const V = VERZICHTE[v];
    const es = api.heuteVon(v);
    const ohne = es.some((e) => e.art === "ohne");
    const zeile = document.createElement("div");
    zeile.className = "va-zeile";
    const kreis = document.createElement("span");
    kreis.className = "kreis";
    if (ohne) kreis.dataset.ohne = "";
    if (es.some((e) => e.art === "habe")) kreis.dataset.spur = "";
    if (es.some((e) => e.art === "drang")) kreis.dataset.drang = "";
    const mitte = document.createElement("div");
    mitte.innerHTML = `<strong>${V.name}</strong>`;
    const liste = document.createElement("ul");
    liste.className = "va-liste";
    es.filter((e) => e.art !== "ohne").forEach((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.zeit} · ${e.art === "habe" ? V.habe : V.drang}`;
      liste.append(li);
    });
    mitte.append(liste);
    const aktionen = document.createElement("div");
    aktionen.className = "va-aktionen";
    const b = (t, f, k = "text") => { const x = document.createElement("button"); x.type = "button"; x.className = k; x.textContent = t; x.onclick = f; return x; };
    aktionen.append(b("habe", () => api.eintragen(v, "habe")));
    if (z.wahl[v].drang) aktionen.append(b("würde gern", () => api.eintragen(v, "drang")));
    if (!es.some((e) => e.art === "habe")) aktionen.append(b(ohne ? "✓ heute ohne" : "heute ohne", () => api.ohne(v)));
    zeile.append(kreis, mitte, aktionen);
    s.append(zeile);
  }

  const mehr = document.createElement("details");
  mehr.className = "va-mehr";
  mehr.open = mehrOffen;
  mehr.ontoggle = () => (mehrOffen = mehr.open);
  const offen = EBENEN.filter((e) => api.stand(e.id) === "frei" && !z.frei[e.id].gesehen).length;
  mehr.innerHTML = `<summary>Mehr, wenn du magst${offen ? ` <span class="punkt" title="neu"></span>` : ""}</summary>`;
  for (const e of EBENEN) {
    const st = api.stand(e.id);
    const r = document.createElement("div");
    r.className = "va-ebene";
    r.dataset.stand = st;
    r.innerHTML = `<span class="bogen-rubrik">${e.rubrik}</span><span class="va-titel">${e.titel}</span>`;
    const x = document.createElement("button");
    x.type = "button";
    x.className = "text";
    if (st === "zu") { x.textContent = e.bedingung; x.disabled = true; }
    else if (st === "aus") { x.textContent = "einschalten"; x.onclick = () => api.einschalten(e.id); }
    else { x.textContent = "öffnen"; x.onclick = () => api.oeffneEbene(e.id); }
    r.append(x);
    mehr.append(r);
  }
  s.append(mehr);
  return s;
}
