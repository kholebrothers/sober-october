/* Die Inhalte der Ebenen, als DOM.

   Die Wissenstexte sind ein erster Entwurf im Ton der Plattform („eine
   mögliche Spur", keine Anweisung, keine Diagnose). Sie sind fachlich
   nicht geprüft und stehen deshalb hier, getrennt von der Mechanik. */

import { verzichte, tagesKopf, besterLauf, wochen, wasTraegt } from "./logik.js";
import { heatmap } from "./ansichten/heatmap.js";

export function ebenenInhalt(id, z, heute) {
  const d = document.createElement("div");
  d.className = "ebene-inhalt";
  const p = (t, k) => { const e = document.createElement("p"); e.textContent = t; if (k) e.className = k; d.append(e); };
  switch (id) {
    case "drang":
      p("Ein Drang ist ein Zustand, kein Auftrag. Er steigt an, hat eine Spitze und fällt wieder, oft innerhalb von Minuten, auch wenn man ihm nicht nachgibt.");
      p("Dahinter steht ein Nervensystem, das gelernt hat, an einer bestimmten Stelle etwas zu erwarten: Koffein am Morgen, Nikotin in der Pause, das nächste Video vor dem Schlafen. Die Erwartung kommt pünktlich, auch wenn das Erwartete ausbleibt.");
      p("Eine mögliche Spur: den Drang ansehen wie eine Welle. Du musst sie nicht wegmachen.");
      break;
    case "routine": {
      p("Die meisten Gewohnheiten haben drei Teile: einen Auslöser, den Ablauf selbst, und etwas, das danach anders ist.");
      p("Aus deinen Notizen, wörtlich:", "leise");
      const ul = document.createElement("ul");
      z.ereignisse.filter((e) => e.antworten.davor).slice(-8).forEach((e) => {
        const li = document.createElement("li");
        li.textContent = `„${e.antworten.davor}“ · ${verzichte(z)[e.verzicht].name}, ${tagesKopf(e.tag)}`;
        ul.append(li);
      });
      if (ul.children.length) d.append(ul);
      else p("Noch keine Antworten auf „Was war kurz davor?“.", "leise");
      p("Hier ist sichtbar, was du beobachtet hast. Eine Deutung steht hier nicht.", "leise");
      break;
    }
    case "statt": {
      p("Was an die Stelle kann, weiß niemand besser als du. Das hast du selbst notiert:");
      const eigene = z.ereignisse.filter((e) => e.antworten.statt);
      eigene.forEach((e) => p(`„${e.antworten.statt}“`, "zitat"));
      if (!eigene.length) p("Noch nichts in eigenen Worten.", "leise");
      p("Eine mögliche Spur, von anderen: warmes Wasser statt Kaffee · fünf Minuten raus statt Kippe · ein Kapitel statt einer Folge.", "leise");
      break;
    }
    case "rueckblick": {
      const V = verzichte(z);
      const ws = wochen(z, heute);
      if (!ws.length) p("Der Rückblick beginnt mit dem Oktober.", "leise");
      for (const w of ws) {
        const b = document.createElement("section");
        b.className = "woche";
        const kopf = document.createElement("p");
        kopf.className = "rubrik";
        kopf.textContent = `${w.titel} · ${w.von}.–${w.bis}. Oktober`;
        const satz = document.createElement("p");
        satz.textContent = `An ${w.dabei} von ${w.tage} ${w.tage === 1 ? "Tag" : "Tagen"} dabei` +
          (w.frei ? `, ${w.frei === 1 ? "einer" : w.frei} davon frei genommen.` : ".");
        b.append(kopf, satz);
        const ul = document.createElement("ul");
        ul.className = "woche-je";
        for (const [v, n] of Object.entries(w.je)) {
          const teile = [];
          if (n.ohne) teile.push(`${n.ohne}× ohne`);
          if (n.habe) teile.push(`${n.habe}× ${V[v].habe}`);
          if (n.drang) teile.push(`${n.drang}× ${V[v].drang}`);
          if (!teile.length) continue;
          const li = document.createElement("li");
          li.dataset.v = v;
          li.textContent = `${V[v].name}: ${teile.join(", ")}`;
          ul.append(li);
        }
        if (ul.children.length) b.append(ul);
        for (const s of w.saetze.slice(-3)) {
          const q = document.createElement("p");
          q.className = "zitat";
          q.dataset.v = s.v;
          q.textContent = `„${s.text}“`;
          b.append(q);
        }
        d.append(b);
      }
      const traegt = wasTraegt(z);
      if (traegt.length) {
        p("Was trägt — in deinen Worten, nach Häufigkeit:", "leise");
        const ul = document.createElement("ul");
        for (const t of traegt) {
          const li = document.createElement("li");
          li.textContent = t.n > 1 ? `${t.text} (${t.n}×)` : t.text;
          ul.append(li);
        }
        d.append(ul);
      }
      p("Hier ist sichtbar, was du notiert hast. Eine Bewertung steht hier nicht.", "leise");
      break;
    }
    case "verlauf": {
      const best = besterLauf(z, heute);
      if (best) p(`Längster Lauf bisher: ${best} ${best === 1 ? "Tag" : "Tage"} am Stück.`, "leise");
      d.append(heatmap(z, heute));
      p("Je voller das Kästchen, desto mehr von deinem Commitment ist an dem Tag notiert — auch ein „habe“ zählt, es ist ein Ereignis, kein Versagen. Ein leeres Kästchen heißt: nichts bekannt. Nicht: nicht geschafft.", "leise");
      break;
    }
  }
  return d;
}
