/* PROTOTYP — Variante B „Knopf".
   Ein Verzicht auf einmal, ein Zählknopf aus smokefree/knopf (Richtung
   `verbrauchen`), darunter der leisere Würde-gern-Knopf. Sonst nichts.
   Gesperrte Ebenen sind unsichtbar: eine verdiente Ebene erscheint als
   Punkt oben, sobald sie sich geöffnet hat. Gewählte Ebenen stecken hinter
   einem einzigen „+" ganz unten. */

import { zaehlknopf } from "./geliehen/knopf.js";

export const NAME = "Knopf";
let aktiv = 0;
let plusOffen = false;

export function render(api) {
  const { zustand: z, VERZICHTE, EBENEN } = api;
  const gew = api.gewaehlt();
  if (aktiv >= gew.length) aktiv = 0;
  const v = gew[aktiv];
  const V = VERZICHTE[v];
  const es = api.heuteVon(v);
  const s = document.createElement("section");
  s.className = "vb";

  // Oben: nur die Punkte der Ebenen, die offen sind. Nichts Gesperrtes.
  const oben = document.createElement("div");
  oben.className = "vb-oben";
  oben.innerHTML = `<span class="bogen-rubrik">Tag ${api.tagNr(z.heute)}</span>`;
  const punkte = document.createElement("span");
  punkte.className = "vb-punkte";
  EBENEN.filter((e) => ["frei", "an"].includes(api.stand(e.id))).forEach((e) => {
    const p = document.createElement("button");
    p.type = "button";
    p.className = "vb-punkt";
    p.dataset.neu = !z.frei[e.id].gesehen;
    p.title = e.titel;
    p.setAttribute("aria-label", e.titel);
    p.onclick = () => api.oeffneEbene(e.id);
    punkte.append(p);
  });
  oben.append(punkte);
  s.append(oben);

  if (gew.length > 1) {
    const reiter = document.createElement("div");
    reiter.className = "vb-reiter";
    gew.forEach((k, i) => {
      const r = document.createElement("button");
      r.type = "button";
      r.className = "text";
      r.dataset.an = i === aktiv;
      r.textContent = VERZICHTE[k].name;
      r.onclick = () => { aktiv = i; document.querySelector("#buehne").replaceChildren(render(api)); };
      reiter.append(r);
    });
    s.append(reiter);
  }

  const habe = es.filter((e) => e.art === "habe").length;
  const k = zaehlknopf({
    form: "teilung", richtung: "verbrauchen",
    beschriftung: V.habe,
    nebentext: (n) => (n ? "heute" : "heute noch nichts notiert"),
    beiTipp: () => api.eintragen(v, "habe"),
  });
  k.setze({ n: habe });
  s.append(k.wurzel);

  if (z.wahl[v].drang) {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "vb-drang";
    const n = es.filter((e) => e.art === "drang").length;
    d.innerHTML = `${V.drang}${n ? ` <span class="leise">· ${n}× heute</span>` : ""}`;
    d.onclick = () => api.eintragen(v, "drang");
    s.append(d);
  }

  if (!habe) {
    const o = document.createElement("button");
    o.type = "button";
    o.className = "text";
    const ohne = es.some((e) => e.art === "ohne");
    o.textContent = ohne ? `✓ heute ohne ${V.name}` : `heute ohne ${V.name}`;
    o.onclick = () => api.ohne(v);
    s.append(o);
  }

  const plus = document.createElement("div");
  plus.className = "vb-plus";
  const pk = document.createElement("button");
  pk.type = "button";
  pk.className = "rund";
  pk.textContent = plusOffen ? "×" : "+";
  pk.setAttribute("aria-label", "Weitere Ebenen");
  pk.onclick = () => { plusOffen = !plusOffen; document.querySelector("#buehne").replaceChildren(render(api)); };
  plus.append(pk);
  if (plusOffen) {
    EBENEN.filter((e) => api.stand(e.id) === "aus").forEach((e) => {
      const x = document.createElement("button");
      x.type = "button";
      x.className = "text";
      x.textContent = `${e.titel} einschalten`;
      x.onclick = () => { plusOffen = false; api.einschalten(e.id); };
      plus.append(x);
    });
    if (!plus.querySelector(".text")) plus.append(Object.assign(document.createElement("span"), { className: "leise", textContent: "Alles Wählbare ist an." }));
  }
  s.append(plus);
  return s;
}
