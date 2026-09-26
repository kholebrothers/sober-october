/* PROTOTYP, zum Wegwerfen. Texte, Fragen und Ebenen. Kein Produktivcode.

   „davor" und „statt" beim „habe"-Eintrag stammen aus smokefree/modul.js
   (FRAGEN_ZIGARETTE), die wiederum auf lifetracker RUECK zurückgehen.
   Die zum „würde gern"-Eintrag sind für diesen Prototyp neu. */

import { hero } from "./geliehen/hero.js";

export const VERZICHTE = {
  kaffee: { name: "Kaffee", satz: "den Kaffee", habe: "Kaffee getrunken", drang: "würde gern Kaffee" },
  kippe:  { name: "Kippe",  satz: "die Kippe",  habe: "geraucht",        drang: "will rauchen" },
  video:  { name: "Video",  satz: "das Video",  habe: "Video geschaut",  drang: "würde gern schauen" },
};

/* Die vier Grundgefühle als Selbstauskunft, Mehrfachwahl. Eine Linse,
   keine Diagnose: die App ordnet nichts zu, der Mensch wählt. */
const GEFUEHLE = ["Angst", "Wut", "Trauer", "Freude", "weiß nicht"];

export const FRAGEN = {
  habe: [
    { id: "davor", frage: "Was war kurz davor?", platz: "Telefonat, Feierabend, Warten …" },
    { id: "gefuehl", frage: "Was ist jetzt da?", wahl: GEFUEHLE, mehr: true },
    { id: "statt", frage: "Was hätte auch gepasst?", platz: "Oder: nichts." },
  ],
  drang: [
    { id: "davor", frage: "Was war kurz davor?", platz: "Aufgewacht, Pause, Langeweile …" },
    { id: "gefuehl", frage: "Was ist gerade da?", wahl: GEFUEHLE, mehr: true },
    { id: "wo", frage: "Wo spürst du es?", platz: "Brust, Hände, Mund, nirgends …" },
    { id: "damit", frage: "Was machst du jetzt damit?",
      wahl: ["abwarten", "etwas anderes", "nachgeben", "ist schon vorbei", "weiß nicht"] },
  ],
};

/* Zwei Arten, an eine Ebene zu kommen — das ist die eigentliche Frage des
   Prototyps: *verdient* (sie öffnet sich durch Benutzen) oder *gewählt*
   (man schaltet sie selbst ein). */
export const EBENEN = [
  { id: "drang", art: "verdient", titel: "Wie ein Drang verläuft", rubrik: "Wissen · Nervensystem",
    bedingung: "öffnet sich, wenn du einen Würde-gern-Moment notiert hast",
    erfuellt: (z) => z.ereignisse.some((e) => e.art === "drang") },
  { id: "routine", art: "verdient", titel: "Was an der Stelle steht", rubrik: "Wissen · Routinen",
    bedingung: "öffnet sich, wenn du an drei Tagen etwas notiert hast",
    erfuellt: (z) => new Set(z.ereignisse.map((e) => e.tag)).size >= 3 },
  { id: "statt", art: "verdient", titel: "Etwas anderes an die Stelle", rubrik: "Neue Verhaltensweisen",
    bedingung: "öffnet sich, wenn du zweimal notiert hast, was auch gepasst hätte",
    erfuellt: (z) => z.ereignisse.filter((e) => e.antworten.statt || e.antworten.damit === "etwas anderes").length >= 2 },
  { id: "verlauf", art: "gewaehlt", titel: "Dein Oktober", rubrik: "Verlauf",
    bedingung: "einschalten, wenn du die Tage sehen willst" },
  { id: "gemeinsam", art: "gewaehlt", titel: "Gemeinsam", rubrik: "Community",
    bedingung: "einschalten, wenn du die anderen sehen willst" },
];

/* Inhalt einer Ebene, als DOM. Alles Attrappe: die Texte sind Platzhalter
   im richtigen Ton, nicht geprüft. */
export function ebenenInhalt(id, z, api) {
  const d = document.createElement("div");
  d.className = "ebene-inhalt";
  const p = (t, k) => { const e = document.createElement("p"); e.textContent = t; if (k) e.className = k; d.append(e); };
  switch (id) {
    case "drang":
      p("Ein Drang ist ein Zustand, kein Auftrag. Er steigt an, hat eine Spitze und fällt wieder — oft innerhalb von Minuten, auch wenn man ihm nicht nachgibt.");
      p("Dahinter steht ein Nervensystem, das gelernt hat, an einer bestimmten Stelle etwas zu erwarten: Koffein am Morgen, Nikotin in der Pause, das nächste Video vor dem Schlafen. Die Erwartung kommt pünktlich, auch wenn das Erwartete ausbleibt.");
      p("Eine mögliche Spur: den Drang ansehen wie eine Welle. Du musst sie nicht wegmachen.");
      break;
    case "routine": {
      p("Die meisten Gewohnheiten haben drei Teile: einen Auslöser, den Ablauf selbst, und etwas, das danach anders ist.");
      p("Aus deinen Notizen, wörtlich:", "leise");
      const ul = document.createElement("ul");
      z.ereignisse.filter((e) => e.antworten.davor).slice(-5).forEach((e) => {
        const li = document.createElement("li");
        li.textContent = `„${e.antworten.davor}" — ${VERZICHTE[e.verzicht].name}, Tag ${api.tagNr(e.tag)}`;
        ul.append(li);
      });
      if (!ul.children.length) p("(noch keine Antworten auf „Was war kurz davor?“)", "leise");
      d.append(ul);
      p("Hier ist sichtbar, was du beobachtet hast. Eine Deutung steht hier nicht.", "leise");
      break;
    }
    case "statt":
      p("Was an die Stelle kann, weiß niemand besser als du. Das hast du selbst notiert:");
      z.ereignisse.filter((e) => e.antworten.statt).forEach((e) => p(`„${e.antworten.statt}"`, "zitat"));
      p("Eine mögliche Spur, von anderen: warmes Wasser statt Kaffee · fünf Minuten raus statt Kippe · ein Kapitel statt einer Folge.", "leise");
      break;
    case "verlauf": {
      const reihe = document.createElement("div");
      reihe.className = "monat";
      for (let i = 1; i <= 31; i++) {
        const tag = `2026-10-${String(i).padStart(2, "0")}`;
        const k = document.createElement("span");
        k.className = "kreis klein";
        k.title = `Tag ${i}`;
        const es = z.ereignisse.filter((e) => e.tag === tag);
        if (es.some((e) => e.art === "ohne")) k.dataset.ohne = "";
        if (es.some((e) => e.art === "habe")) k.dataset.spur = "";
        if (es.some((e) => e.art === "drang")) k.dataset.drang = "";
        if (tag === z.heute) k.dataset.heute = "";
        reihe.append(k);
      }
      d.append(reihe);
      p("Ein leerer Kreis heißt: nichts bekannt. Nicht: nicht geschafft.", "leise");
      break;
    }
    case "gemeinsam": {
      const eigene = new Set(z.ereignisse.map((e) => e.tag)).size;
      const verlauf = document.createElement("p");
      verlauf.className = "kur-hero__klein";
      verlauf.textContent = "Heute haben 37 Menschen etwas notiert. Niemand sieht, was.";
      d.append(hero({
        titel: "Du und die anderen",
        stand: { zahl: String(eigene), einheit: "Tage mit Notiz", titel: "Jeder für sich.", detail: "Alles freiwillig. Ein Link, kein Login." },
        vorsatz: { titel: "Commitment", stufe: 1, inhalt: document.createTextNode(api.commitmentSatz()) },
        gemeinsam: { zahl: "412", einheit: "Tage zusammen", verlauf },
      }));
      p("Attrappe: Zahlen erfunden. Die echte Mechanik steht in kur-core (eigene vs. kollektive Tage).", "leise");
      break;
    }
  }
  return d;
}
