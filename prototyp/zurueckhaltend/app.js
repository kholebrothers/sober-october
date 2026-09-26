/* PROTOTYP, zum Wegwerfen. Kein Produktivcode, keine Tests, keine Speicherung.

   Frage: Wie fühlt sich eine App an, deren Oberfläche nur das eigene
   Commitment zeigt, während alles andere erst freigeschaltet werden muss?

   Drei Varianten auf einer Seite, umschaltbar über ?variant=A|B|C, die
   Leiste unten oder ←/→. Gemeinsam sind der Zustand, die Commitment-Wahl
   und der Eintragsbogen; jede Variante rendert den Tag auf ihre eigene Art.
   Der Zustand lebt nur im Speicher: ein Neuladen fängt von vorn an. */

import { verschiebe, tagNummer } from "./geliehen/datum.js";
import { VERZICHTE, FRAGEN, EBENEN, ebenenInhalt } from "./inhalt.js";
import * as A from "./variante-a.js";
import * as B from "./variante-b.js";
import * as C from "./variante-c.js";

const VARIANTEN = { A, B, C };
const START = "2026-10-01";

const zustand = {
  phase: "wahl",
  wahl: { kaffee: null, kippe: null, video: null }, // null | { drang: bool }
  heute: START,
  ereignisse: [], // { id, tag, zeit, verzicht, art: habe|drang|ohne, wann, antworten }
  frei: {},       // ebeneId -> { tag, zeit, gesehen }
};

const $ = (s) => document.querySelector(s);
const jetztZeit = () => new Date().toTimeString().slice(0, 5);
let variante = new URLSearchParams(location.search).get("variant") || "A";
if (!VARIANTEN[variante]) variante = "A";

/* ---- Was die Varianten benutzen -------------------------------------- */

const api = {
  zustand, VERZICHTE, EBENEN,
  tagNr: (tag) => tagNummer(START, tag),
  gewaehlt: () => Object.keys(zustand.wahl).filter((k) => zustand.wahl[k]),
  heuteVon: (v) => zustand.ereignisse.filter((e) => e.tag === zustand.heute && (!v || e.verzicht === v)),
  commitmentSatz() {
    const n = api.gewaehlt().map((k) => VERZICHTE[k].satz);
    const liste = n.length > 1 ? n.slice(0, -1).join(", ") + " und " + n.at(-1) : n[0];
    return `Im Oktober lasse ich ${liste} sein.`;
  },
  stand(id) { // "zu" | "frei" | "an" (gewählt eingeschaltet) | "aus"
    const e = EBENEN.find((x) => x.id === id);
    if (e.art === "gewaehlt") return zustand.frei[id] ? "an" : "aus";
    return zustand.frei[id] ? "frei" : "zu";
  },
  eintragen,
  ohne(v) {
    const da = api.heuteVon(v).find((e) => e.art === "ohne");
    if (da) zustand.ereignisse.splice(zustand.ereignisse.indexOf(da), 1);
    else zustand.ereignisse.push({ id: crypto.randomUUID(), tag: zustand.heute, zeit: jetztZeit(), verzicht: v, art: "ohne", antworten: {} });
    neu();
  },
  einschalten(id) {
    zustand.frei[id] = { tag: zustand.heute, zeit: jetztZeit(), gesehen: false };
    neu();
    oeffneEbene(id);
  },
  oeffneEbene,
};

/* ---- Freischalten ------------------------------------------------------ */

function pruefeFrei() {
  const neue = [];
  for (const e of EBENEN) {
    if (e.art === "verdient" && !zustand.frei[e.id] && e.erfuellt(zustand)) {
      zustand.frei[e.id] = { tag: zustand.heute, zeit: jetztZeit(), gesehen: false };
      neue.push(e);
    }
  }
  return neue;
}

/* ---- Der Bogen: habe / würde gern -------------------------------------- */

const bogen = $("#bogen");

function zeigeBogen(knoten) {
  bogen.replaceChildren(knoten);
  if (!bogen.open) bogen.showModal();
}

function knopf(text, klasse, beiKlick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  if (klasse) b.className = klasse;
  b.addEventListener("click", beiKlick);
  return b;
}

function eintragen(v, art) {
  const V = VERZICHTE[v];
  if (art === "habe") return fragen(v, "habe", null, V.habe);
  // Beim Drang zuerst: jetzt oder vorhin? Das entscheidet, ob begleitet wird.
  const k = document.createElement("div");
  k.className = "bogen-inhalt";
  k.innerHTML = `<p class="bogen-rubrik">${V.name}</p><h2>${V.drang}</h2>`;
  const reihe = document.createElement("div");
  reihe.className = "wahlreihe";
  reihe.append(
    knopf("gerade jetzt", "gross", () => begleiten(v)),
    knopf("vorhin", "gross leise", () => fragen(v, "drang", "vorhin", V.drangVorhin)),
  );
  k.append(reihe, knopf("abbrechen", "text", () => bogen.close()));
  zeigeBogen(k);
}

/* Der Würde-gern-Moment wird begleitet, nicht abgefragt: erst Raum, dann
   Fragen. Die Welle ist ein langsam atmender Kreis — Attrappe. */
function begleiten(v) {
  const V = VERZICHTE[v];
  const k = document.createElement("div");
  k.className = "bogen-inhalt begleitung";
  k.innerHTML = `<p class="bogen-rubrik">${V.name} · gerade jetzt</p>
    <div class="welle" aria-hidden="true"></div>
    <p class="serif">Das darf da sein. Ein Drang steigt, und er fällt auch wieder.<br>Du musst nichts damit machen.</p>
    <p class="leise uhr">0:00</p>`;
  const beginn = Date.now();
  const uhr = k.querySelector(".uhr");
  const t = setInterval(() => {
    const s = Math.floor((Date.now() - beginn) / 1000);
    uhr.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, 500);
  k.append(knopf("weiter", "gross", () => { clearInterval(t); fragen(v, "drang", "jetzt", V.drang, Math.round((Date.now() - beginn) / 1000)); }));
  bogen.addEventListener("close", () => clearInterval(t), { once: true });
  zeigeBogen(k);
}

function fragen(v, art, wann, titel, begleitetSek) {
  const V = VERZICHTE[v];
  const satz = art === "habe" ? FRAGEN.habe : wann === "vorhin" ? FRAGEN.drangVorhin : FRAGEN.drang;
  const f = document.createElement("form");
  f.className = "bogen-inhalt";
  f.method = "dialog";
  f.innerHTML = `<p class="bogen-rubrik">${V.name} · ${jetztZeit()}</p><h2>${titel}</h2>
    <p class="leise">Alles freiwillig. Ein Wort reicht, keins auch.</p>`;
  for (const q of satz) {
    const l = document.createElement("label");
    l.className = "frage";
    l.innerHTML = `<span class="serif">${q.frage}</span>`;
    if (q.wahl) {
      const r = document.createElement("span");
      r.className = "chips";
      q.wahl.forEach((w) => {
        r.insertAdjacentHTML("beforeend", `<label class="chip"><input type="radio" name="${q.id}" value="${w}"><span>${w}</span></label>`);
      });
      l.append(r);
    } else {
      l.insertAdjacentHTML("beforeend", `<input name="${q.id}" placeholder="${q.platz}" autocomplete="off">`);
    }
    f.append(l);
  }
  const speichern = (mitAntworten) => {
    const antworten = {};
    if (mitAntworten) for (const [k, w] of new FormData(f)) if (String(w).trim()) antworten[k] = String(w).trim();
    zustand.ereignisse.push({ id: crypto.randomUUID(), tag: zustand.heute, zeit: jetztZeit(), verzicht: v, art, wann, antworten, begleitetSek });
    bogen.close();
    const neue = pruefeFrei();
    neu();
    melde(neue.length ? `Notiert. Eine Ebene hat sich geöffnet: ${neue.map((e) => e.titel).join(", ")}.` : "Notiert.");
  };
  const unten = document.createElement("div");
  unten.className = "wahlreihe";
  unten.append(knopf("notieren", "gross", () => speichern(true)), knopf("nur notieren, ohne Fragen", "text", () => speichern(false)));
  f.append(unten);
  f.addEventListener("submit", (e) => { e.preventDefault(); speichern(true); });
  zeigeBogen(f);
}

function oeffneEbene(id) {
  const e = EBENEN.find((x) => x.id === id);
  if (zustand.frei[id]) zustand.frei[id].gesehen = true;
  const k = document.createElement("div");
  k.className = "bogen-inhalt ebene";
  k.innerHTML = `<p class="bogen-rubrik">${e.rubrik}</p><h2>${e.titel}</h2>`;
  k.append(ebenenInhalt(id, zustand, api), knopf("schließen", "text", () => { bogen.close(); neu(); }));
  zeigeBogen(k);
}

let meldeTimer;
function melde(text) {
  const m = $("#meldung");
  m.textContent = text;
  m.hidden = false;
  clearTimeout(meldeTimer);
  meldeTimer = setTimeout(() => (m.hidden = true), 3200);
}

/* ---- Commitment wählen -------------------------------------------------- */

function wahlSeite() {
  const s = document.createElement("section");
  s.className = "wahl";
  s.innerHTML = `<p class="bogen-rubrik">Sober October</p>
    <h1 class="serif">Was lässt du im Oktober sein?</h1>
    <p class="leise">Eins reicht. Bereitschaft genügt.</p>`;
  for (const [id, V] of Object.entries(VERZICHTE)) {
    const an = !!zustand.wahl[id];
    const z = document.createElement("div");
    z.className = "wahl-zeile";
    z.dataset.an = an;
    z.append(knopf(an ? `✓ ${V.name}` : V.name, "wahl-knopf", () => {
      zustand.wahl[id] = an ? null : { drang: true };
      neu();
    }));
    if (an) {
      const l = document.createElement("label");
      l.className = "leise wahl-zusatz";
      l.innerHTML = `<input type="checkbox" ${zustand.wahl[id].drang ? "checked" : ""}> auch die Momente notieren, in denen ich gern würde`;
      l.querySelector("input").addEventListener("change", (e) => { zustand.wahl[id].drang = e.target.checked; neu(); });
      z.append(l);
    }
    s.append(z);
  }
  const los = knopf("So ist es.", "gross", () => { zustand.phase = "tag"; neu(); });
  los.disabled = !api.gewaehlt().length;
  s.append(los, Object.assign(document.createElement("p"), { className: "leise", textContent: "Du kannst es jederzeit ändern. Niemand sieht, was du wählst." }));
  return s;
}

/* ---- Rendern ------------------------------------------------------------ */

function neu() {
  const buehne = $("#buehne");
  buehne.dataset.variante = variante;
  buehne.replaceChildren(zustand.phase === "wahl" ? wahlSeite() : VARIANTEN[variante].render(api));
  $("#vname").textContent = `${variante} — ${VARIANTEN[variante].NAME}`;
  $("#zustand").textContent = JSON.stringify(zustand, null, 1);
}

/* ---- Prototyp-Leiste ---------------------------------------------------- */

function wechsle(schritt) {
  const ks = Object.keys(VARIANTEN);
  variante = ks[(ks.indexOf(variante) + schritt + ks.length) % ks.length];
  const u = new URL(location.href);
  u.searchParams.set("variant", variante);
  history.replaceState(null, "", u);
  neu();
}
$("#vor").onclick = () => wechsle(1);
$("#zurueck").onclick = () => wechsle(-1);
$("#tag").onclick = () => { zustand.heute = verschiebe(zustand.heute, 1); neu(); melde(`Tag ${api.tagNr(zustand.heute)}.`); };
$("#zeige").onclick = () => { $("#zustand").hidden = !$("#zustand").hidden; };
$("#neu").onclick = () => location.reload();
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, [contenteditable]") || bogen.open) return;
  if (e.key === "ArrowRight") wechsle(1);
  if (e.key === "ArrowLeft") wechsle(-1);
});

// ?demo=1 füllt ein paar Tage vor, damit die Ebenen ohne Klickerei zu sehen sind.
if (new URLSearchParams(location.search).get("demo")) {
  zustand.wahl = { kaffee: { drang: true }, kippe: { drang: true }, video: null };
  zustand.phase = "tag";
  const e = (tag, verzicht, art, antworten = {}, wann) => {
    zustand.heute = tag;
    zustand.ereignisse.push({ id: crypto.randomUUID(), tag, zeit: "08:10", verzicht, art, wann, antworten });
    pruefeFrei(); // am Tag des Eintrags, damit die Ebenen dort aufgehen, wo sie verdient wurden
  };
  e("2026-10-01", "kaffee", "drang", { davor: "aufgewacht", damit: "abwarten" }, "jetzt");
  e("2026-10-01", "kippe", "ohne");
  e("2026-10-02", "kippe", "habe", { davor: "Feierabend, Kollege draußen", statt: "einfach mit raus, ohne" });
  e("2026-10-03", "kippe", "drang", { davor: "nach dem Essen", damit: "etwas anderes" }, "vorhin");
  zustand.heute = "2026-10-04";
}

neu();
