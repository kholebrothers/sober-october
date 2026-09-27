/* =====================================================================
   Der Begleiter

   Er wohnt am unteren Rand, läuft herum, versteckt sich, schaut um Ecken.
   Man kann ihn streicheln. Je mehr am Tag steht, desto wacher ist er — und
   wenn lange nichts passiert, meldet er sich.

   Diese Datei ist die **Mechanik**: Szenenlotterie, Posenwechsel, die
   Naht zwischen App und Welt, das Streicheln, die Auswahl der Sätze. Sie
   kennt keine Häkchen, keinen Zustand, keine Klassennamen einer App und
   keinen einzigen Text.

   ## Was hineingereicht wird

       silhouette   Das Tier. Siehe bild.js.
       texte        Die Sätze, nach Töpfen. Siehe test/beispiel/saetze.js.
       kontext()    Der Tageskontext, oder null, wenn niemand da ist:
                    {tag, st, n, best, name, p, gesternLeer, tiefe, v, vtext}
                    Der Kern liest daraus `tag` (die Stufe), `n` (den
                    Schwung), `p` (die Tageszeit) und `tiefe` (wie tief in
                    der Nacht). Alles andere reicht er nur an die Sätze
                    weiter — welche Platzhalter es gibt, bestimmt die App.
       wirt         {css, buzz, burst, rain} — Wirkung, die dem Wirt gehört.
       dokument,
       fenster,
       speicher     Die Umgebung. Keine Globalen; nichts greift aus dem
                    Modul nach oben.

   ## Das Gelände ist eine Konvention

   Wege und Wände liest `welt.js` aus `data-katze`. Die Spielziele hier
   folgen derselben Konvention:

       data-katze="stups"    Damit darf gespielt werden.
       data-stups="tippen"   ... und zwar so. Auch "reiben", "schubsen";
                             mehrere durch Leerzeichen getrennt.
       data-katze="punkt"    Innerhalb eines Stups-Ziels: die Stelle, an
                             die getippt wird (das Kästchen selbst).
       data-katze="wand"     Groß genug, um sich dahinter zu verstecken.

   Hier stand einmal `.card, .row, .chip, .min-chip, .check`.

   Herkunft: lifetracker/public/app.js, der `cat`-Controller.
   ===================================================================== */

import { erzeugeBild } from "./bild.js";
import { erzeugeWelt } from "./welt.js";

/* Das Posen-Vokabular des Kerns. Eine Silhouette muss jeden dieser Namen
   kennen — was er für ihr Tier bedeutet, entscheidet sie selbst. Wer einen
   nicht belegt, bekommt die Ruhepose gezeichnet, und zwar wortlos. */
export const POSEN = [
  "sit", "sleep", "loaf", "roll", "purr", "knead", "belly", "tailplay",
  "hop", "pounce", "walk", "chase", "duck", "luft", "kante", "abgang",
  "peek-l", "peek-r"
];

/* Die Klassen, die der Begleiter setzt. Sie sind sein Vertrag mit dem
   Renderer: wer `anzeige/` ersetzt, muss sie bedienen. Die Voreinstellung
   ist die der Vier-Wochen-Kur, damit deren Stylesheet unverändert passt. */
const KLASSEN = {
  wurzel: "cat", knopf: "cat-btn", leinwand: "cat-canvas", blase: "cat-say",
  pose: "is-", stufe: "spiel-", spiegel: "flip", schleife: "has-bow",
  verdeckt: "katz-verdeckt",
  tapp: "katz-tapp", tipp: "katz-tipp", reib: "katz-reib", schubs: "katz-schubs"
};

/* Die Speicherschlüssel. Das Präfix kommt aus der Konfiguration — hier
   stand einmal fest eingebautes `kur.`. Die hinteren Teile bleiben, wie sie
   sind: sie stehen im localStorage laufender Installationen, und wer sie
   umbenennt, wirft deren Streicheleinheiten weg. */
const SCHLUESSEL = {pets: "cat.pets", gehoert: "cat.gehoert"};

export function erzeugeBegleiter(o) {
  o = o || {};
  const global = (typeof globalThis !== "undefined" ? globalThis : {});
  const dokument = o.dokument || global.document;
  const fenster = o.fenster || global;
  const jetzt = o.jetzt || fenster.jetzt || Date.now;
  const speicher = o.speicher || null;
  const praefix = o.praefix === undefined ? "kur." : o.praefix;
  const K = Object.assign({}, KLASSEN, o.klassen);
  const S = Object.assign({}, SCHLUESSEL, o.schluessel);
  const texte = o.texte || {};
  const wirt = o.wirt || {};
  const kontext = o.kontext || (() => null);
  const stufen = o.stufen || [4, 10, 18];
  const schwungVoll = o.schwungVoll || 6;
  const schleifeAb = o.schleifeAb === undefined ? 10 : o.schleifeAb;
  const bundJe = o.bundJe === undefined ? 25 : o.bundJe;
  const pixel = o.pixel || 3;

  const zeit = (fn, ms) => fenster.setTimeout(fn, ms);
  const halt = (id) => fenster.clearTimeout(id);
  const lies = (k) => { try { return speicher && speicher.getItem(praefix + k); } catch (e) { return null; } };
  const schreib = (k, v) => { try { if (speicher) speicher.setItem(praefix + k, v); } catch (e) {} };

  /* ---- Der Körper ------------------------------------------------- */
  const el = dokument.createElement("div");
  el.id = o.id || "begleiter";
  el.hidden = true;
  el.dataset.katzeSelbst = "";            /* für welt.js: das bin ich, kein Gelände */
  el.classList.add(K.wurzel);
  const knopf = dokument.createElement("button");
  knopf.classList.add(K.knopf);
  const leinwand = dokument.createElement("canvas");
  leinwand.classList.add(K.leinwand);
  knopf.appendChild(leinwand);
  const say = dokument.createElement("div");
  say.classList.add(K.blase);
  say.hidden = true;
  el.appendChild(knopf);
  el.appendChild(say);
  (o.wurzel || dokument.body).appendChild(el);

  const B = o.bild || erzeugeBild({silhouette: o.silhouette, css: wirt.css || ((n) => n), fenster});
  const W = o.welt || erzeugeWelt({dokument, fenster, jetzt});

  let aktPose = "sit";
  let uhr0 = 0, letzteZeit = 0;
  const pos = {x: 24, y: 0};
  let timer = null, sayTimer = null, poseTimer = null;
  let pets = 0, lastPoke = jetzt(), lastSay = 0;
  pets = +lies(S.pets) || 0;
  if (schleifeAb && pets >= schleifeAb) el.classList.add(K.schleife);

  function band() {
    // Er wohnt am unteren Rand — hoch genug, dass er nicht auf der
    // Statusleiste sitzt, tief genug, dass er den Inhalt nicht zudeckt.
    const top = Math.max(70, fenster.innerHeight - 132);
    return top + Math.random() * 42;
  }

  /* Gerechnet wird immer in der Grundgröße, wie die Welt sie kennt.
     Gewachsen wird nur im Bild: transform-origin liegt im CSS unten in der
     Mitte, der Fußpunkt bleibt beim Skalieren also stehen. Damit muss weder
     die Welt noch der Abgang über den Rand etwas davon wissen. */
  function stellen(x, y) {
    el.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)" +
                         " scale(" + leben().gr.toFixed(3) + ")";
  }

  /* Eine Fahrt ist die CSS-Überblendung von place(). Sie dauert, pos ist aber
     sofort am Ziel — 1100 ms lang steht der Begleiter also woanders, als jede
     Zahl in dieser Datei behauptet.

     In dieser Lücke darf die Welt nicht übernehmen. Tut sie es, setzt das
     nächste Bild transitionDuration auf 0 und stellt ihn an seine eigene
     Zahl: er verschwindet mitten auf der Seite und kommt am Rand wieder
     herein. Das war der gemeldete Sprung von A nach B, und er traf jedes Mal,
     wenn während eines Abgangs irgendetwas pose("sit") rief.

     Also: während einer Fahrt führt der Begleiter. Erst an deren Ende erfährt
     die Welt, wo er steht, und darf weitermachen. */
  let fahrt = null, fahrtTimer = null;
  const GEFUEHRT = {"peek-l": 1, "peek-r": 1, abgang: 1};
  function weltFuehren() {
    W.manuell(!!GEFUEHRT[aktPose] || !!versteck || !!fahrt);
  }
  function fahrtEnde() {
    fahrt = null;
    halt(fahrtTimer);
    W.setzen(pos.x + W.breite / 2, pos.y + W.hoehe);
    weltFuehren();
  }
  function place(x, y, ms) {
    pos.x = x; pos.y = y;
    ms = ms === undefined ? 900 : ms;
    el.style.transitionDuration = ms + "ms";
    stellen(x, y);
    halt(fahrtTimer);
    if (!ms) { fahrtEnde(); return; }
    fahrt = true;
    weltFuehren();
    fahrtTimer = zeit(fahrtEnde, ms);
  }

  /* Außer Sicht heißt: über den Rand hinaus. Früher gab es dafür eine Klasse
     mit opacity:0 — er löste sich auf der Stelle auf. */
  function draussen() { return pos.x + W.breite < 0 || pos.x > fenster.innerWidth; }

  /* Bei diesen Posen tut er etwas an Ort und Stelle. Die Welt muss dafür
     stillhalten, sonst gewinnt ihre Pose beim Zeichnen und die Ruhepose ist
     nur noch eine Animation auf einem laufenden Tier. Gemessen: von 93
     Bildern mit der Schnurrpose zeigten 21 wirklich das Schnurren, der Rest
     lief, sprang oder duckte sich dabei.

     "sit" gehört nicht dazu — genau damit übergibt er an die Welt.
     anhalten() bricht keinen Sprung ab, siehe welt.js. */
  const HALTEN = {roll: 1, purr: 1, knead: 1, belly: 1, loaf: 1, sleep: 1,
                  tailplay: 1, pounce: 1, duck: 1, chase: 1, hop: 1};

  /* Diese beiden zeigen absichtlich nur einen Teil von ihm — und ergeben nur
     am Bildrand einen Sinn. Sie zeigen aber immerhin ein Tier.

     Eine dritte gab es einmal: nur der wedelnde Schwanz, ohne Körper. Sie war
     darauf angewiesen, dass Timer, Überblendung und Weltposition auf den
     Frame genau zusammenpassen; ging eines daneben, stand ein Schwanz ohne
     Tier mitten auf der Seite. Zweimal nachgebessert, zweimal wiedergekommen.
     Für neun Sekunden Schwanz am Bildrand ist das zu teuer. */
  const RANDPOSEN = {"peek-l": 1, "peek-r": 1};

  function pose(name, ms) {
    const alt = aktPose;
    aktPose = name;
    weltFuehren();
    if (HALTEN[name]) W.anhalten();
    el.classList.remove(K.pose + alt);
    el.classList.add(K.pose + name);
    if (schleifeAb && pets >= schleifeAb) el.classList.add(K.schleife);
    halt(poseTimer);
    halt(abgangTimer);
    if (ms) poseTimer = zeit(() => pose("sit"), ms);
  }

  /* Hinausgehen und erst draußen verschwinden.
     place() schiebt über eine Überblendung — 1100 ms lang ist er also noch zu
     sehen. Die Zielpose wurde trotzdem sofort gesetzt: beim Hinausgehen
     verlor er augenblicklich seinen Körper. Erst laufen, dann die Pose. */
  let abgangTimer = null;
  function abgang(x, y, ms, ziel) {
    const nachLinks = x < pos.x;
    pose("abgang");
    el.classList.toggle(K.spiegel, nachLinks);
    place(x, y, ms);
    abgangTimer = zeit(() => pose(ziel), ms);
  }

  /* ---- Zwei Wächter -----------------------------------------------
     Beide gegen dasselbe: ein Bild, das aussieht, als wäre er versetzt oder
     zerschnitten worden.

     Der erste: ein halbes Tier gehört an den Bildrand. Steht er mitten auf
     der Seite, ist die Randpose falsch — dann übernimmt die Welt.

     Der zweite: verdeckt heißt ganz verdeckt. Er wartet hinter einem Block;
     scrollt die Seite dabei, wandert der Block unter ihm weg und er liegt in
     der Lücke zwischen zweien. Zu sehen war dann eine Scheibe von ihm.
     Ragt er irgendwo hervor, ist das Versteck vorbei. */
  let versteck = null, gewacht = 0;
  function versteckEnde() {
    if (!versteck) return;
    halt(versteck.warten); halt(versteck.scharf); halt(versteck.decken);
    versteck = null;
    dokument.body.classList.remove(K.verdeckt);
    pose("sit");
    W.streunen();
  }
  function wachen() {
    /* Während einer Fahrt ist pos das Ziel, nicht die Stelle, an der er zu
       sehen ist. Darüber lässt sich nicht urteilen — und der Wächter, der
       genau diesen Fall abfangen sollte, war für ihn blind. */
    if (fahrt) return;
    if (RANDPOSEN[aktPose] && pos.x > -12 && pos.x + W.breite < fenster.innerWidth + 12) {
      pose("sit");
      W.streunen();
      return;
    }
    if (!versteck || !versteck.wachsam) return;
    const r = versteck.block.getBoundingClientRect();
    if (pos.x >= r.left - 4 && pos.x + W.breite <= r.right + 4 &&
        pos.y >= r.top - 4 && pos.y + W.hoehe <= r.bottom + 4) return;
    versteckEnde();
  }

  /* ---- Jedes Einzelbild wird gerechnet ---------------------------- */
  function zeichneJetzt(now) {
    if (el.hidden || dokument.hidden) return;
    if (!uhr0) uhr0 = now;
    const dt = letzteZeit ? Math.min((now - letzteZeit) / 1000, 0.1) : 0;
    letzteZeit = now;
    /* Viermal in der Sekunde reicht — jedes Bild wäre ein Layout je Bild. */
    if (now - gewacht > 250) { gewacht = now; wachen(); }

    /* Die Welt sagt, wo er steht und was er dabei tut. Gibt sie keine Pose
       zurück, steht er still und die Szene bestimmt das Bild. */
    let weltPose = null, theta = null, wackel = 0, kantePh = 0;
    const b = W.tick(dt);
    if (b) {
      pos.x = b.fx - W.breite / 2; pos.y = b.fy - W.hoehe;
      el.style.transitionDuration = "0ms";
      stellen(pos.x, pos.y);
      el.classList.toggle(K.spiegel, b.dir < 0);
      weltPose = b.pose;
      theta = b.theta === undefined ? null : b.theta;
      wackel = b.wackel || 0;
      kantePh = b.kante || 0;
    }
    const L = leben();
    B.zeichne(leinwand, {
      pose: weltPose || aktPose,
      spiel: L.stufe,
      schwung: L.schwung,
      schleife: schleifeAb ? pets >= schleifeAb : false,
      blick: W.blick(),
      theta: (weltPose === "walk" || weltPose === "chase") ? theta : null,
      wackel: wackel,
      kante: kantePh,
      pixel: pixel
    }, (now - uhr0) / 1000);
  }
  function schleife(now) {
    fenster.requestAnimationFrame(schleife);
    zeichneJetzt(now || 0);
  }
  fenster.requestAnimationFrame(schleife);

  /* Er schaut dorthin, wo etwas passiert. Beim Zeiger reicht Hinsehen; ein
     Klick oder ein umgelegtes Häkchen ist ihm manchmal einen Weg wert. */
  let letzterBlick = 0;
  dokument.addEventListener("pointermove", (ev) => {
    if (jetzt() - letzterBlick < 120) return;
    letzterBlick = jetzt();
    W.schau(ev.clientX, ev.clientY, false);
  }, {passive: true});
  dokument.addEventListener("pointerdown", (ev) => {
    W.schau(ev.clientX, ev.clientY, Math.random() < 0.3);
    lastPoke = jetzt();
  }, true);

  /* Ändert sich etwas an einem gestempelten Element — Häkchen um, Chip
     gesetzt —, dreht er den Kopf hin und geht manchmal nachsehen. */
  const beobachten = o.beobachten || dokument.body;
  if (fenster.MutationObserver && beobachten) {
    let merker = 0;
    new fenster.MutationObserver((list) => {
      if (el.hidden || jetzt() - merker < 900) return;
      for (const eintrag of list) {
        const ziel = eintrag.target;
        if (!ziel || !ziel.closest) continue;
        const zeile = ziel.closest("[data-katze]");
        if (!zeile) continue;
        const r = zeile.getBoundingClientRect();
        if (r.top < 40 || r.top > fenster.innerHeight - 40) continue;
        merker = jetzt();
        W.schau(r.left + r.width / 2, r.top, Math.random() < 0.35);
        break;
      }
    }).observe(beobachten, {subtree: true, attributes: true,
                            attributeFilter: ["class", "aria-checked"]});
  }

  /* ---- Sprechen ---------------------------------------------------- */
  function bubble(text, ms) {
    if (!text) return;
    say.textContent = text;
    say.hidden = false;
    // Die Blase hängt am Begleiter, darf aber nicht aus dem Bild laufen.
    const mitte = pos.x + W.breite / 2;
    const halb = Math.min(240, fenster.innerWidth * 0.6) / 2;
    const frei = Math.max(halb + 10, Math.min(fenster.innerWidth - halb - 10, mitte));
    say.style.left = (frei - pos.x) + "px";
    if (say.style.setProperty) say.style.setProperty("--arrow", (mitte - frei) + "px");
    say.classList.add("show");
    lastSay = jetzt();
    halt(sayTimer);
    sayTimer = zeit(() => {
      say.classList.remove("show");
      zeit(() => { say.hidden = true; }, 260);
    }, ms || 3400);
  }
  function pick(liste) { return liste[(Math.random() * liste.length) | 0]; }

  /* Was oft gehört wurde, kommt seltener. Der Zähler steht im Speicher,
     überlebt also das Programm. */
  let gehoert = {};
  const zuletztGesagt = [];
  try { gehoert = JSON.parse(lies(S.gehoert) || "{}") || {}; } catch (e) { gehoert = {}; }

  /* Jedes {wort} kommt aus dem Tageskontext. Welche Platzhalter es gibt,
     bestimmt die App — der Kern kennt nur die Regel. `{v}` ist die eine
     Ausnahme: der Vorschlag steht als fertiger Text unter `vtext`. */
  function fuelle(t, c) {
    return String(t).replace(/\{(\w+)\}/g, (ganz, k) => {
      if (k === "v") return c.vtext || "";
      return c[k] === undefined || c[k] === null ? ganz : String(c[k]);
    });
  }

  function waehle(name, c) {
    const topf = texte[name] || [];
    c = c || kontext();
    if (!c) return "";
    const kand = [];
    for (let i = 0; i < topf.length; i++) {
      const e = topf[i];
      if ((e.ab || 1) > c.tag) continue;
      if (e.wenn && !e.wenn(c)) continue;
      kand.push({i, e});
    }
    if (!kand.length) return "";
    const gew = [];
    let summe = 0;
    for (const k of kand) {
      const id = name + ":" + k.i;
      let w = 1 / Math.pow(1 + (gehoert[id] || 0), 1.6);
      if (zuletztGesagt.indexOf(id) >= 0) w *= 0.05;      // gerade erst gesagt
      gew.push(w); summe += w;
    }
    const r = Math.random() * summe;
    let acc = 0, treffer = kand.length - 1;
    for (let j = 0; j < kand.length; j++) { acc += gew[j]; if (r <= acc) { treffer = j; break; } }
    const id = name + ":" + kand[treffer].i;
    gehoert[id] = (gehoert[id] || 0) + 1;
    zuletztGesagt.push(id);
    if (zuletztGesagt.length > 10) zuletztGesagt.shift();
    schreib(S.gehoert, JSON.stringify(gehoert));
    return fuelle(kand[treffer].e.t, c);
  }

  /* Er führt durch den Tag: schlägt genau eine kleine Sache vor, die gerade
     passt, und lässt jede offen. Er zählt nie auf, was fehlt, und bewertet
     keinen Tag. Welche Sache das ist, entscheidet der Wirt — sie steht als
     `v`/`vtext` im Tageskontext. */
  function buddy() {
    const c = kontext();
    if (!c) return "";
    if (c.p === "nacht") return waehle("nacht", c);
    return waehle(c.n === 0 ? "leer" : "satt", c);
  }

  /* ---- Die beiden Regler ------------------------------------------
     Die Stufe ist der lange Bogen: er wächst und bekommt Schmuck. Der
     Schwung ist der Tag — wie viele Kleinigkeiten schon stehen. Wo die
     Stufen liegen, ist Sache der App (`stufen`), ebenso wie viele
     Kleinigkeiten volle Fahrt bedeuten (`schwungVoll`).

     Beides wird höchstens einmal je Sekunde neu bestimmt — gezeichnet wird
     sechzigmal, und der Tageskontext ist nicht umsonst zu haben. */
  const kennzahl = {bis: 0, stufe: 0, schwung: 0, gr: 1};
  function leben() {
    const n = jetzt();
    if (n < kennzahl.bis) return kennzahl;
    kennzahl.bis = n + 1000;
    const c = kontext();
    kennzahl.stufe = stufeAus(c);
    kennzahl.schwung = Math.min(1, (c ? c.n : 0) / schwungVoll);
    kennzahl.gr = 1 + kennzahl.stufe * 0.08;
    W.setSchwung(kennzahl.schwung);
    return kennzahl;
  }
  function stufeAus(c) {
    const tag = Math.max(1, c ? c.tag : 1);
    let s = 0;
    for (const schwelle of stufen) if (tag >= schwelle) s++;
    return s;
  }
  function stufe() { return stufeAus(kontext()); }

  /* Die Stufe hängt als Klasse am Element — daran hängt im Stylesheet, was
     überhaupt zu sehen ist. */
  function stufeZeigen() {
    const s = stufe();
    for (let i = 0; i <= stufen.length; i++) el.classList.toggle(K.stufe + i, i === s);
    return s;
  }

  /* ---- Spielen mit dem, was auf der Seite steht -------------------
     Er fasst nur das Bild an. Kein Haken wird gesetzt, kein Wert verändert,
     kein Klick ausgelöst — was sich bewegt, bewegt sich über eine Animation
     und steht danach wieder, wo es stand. Der Begleiter bekommt dafür auch
     gar kein Werkzeug: er kennt weder Zustand noch Netz. */
  function sichtbar(sel, pruef) {
    const out = [], alle = dokument.querySelectorAll(sel);
    for (let i = 0; i < alle.length; i++) {
      const e = alle[i], r = e.getBoundingClientRect();
      if (r.width < 14 || r.height < 10) continue;
      if (r.top < 84 || r.bottom > fenster.innerHeight - 20) continue;
      if (pruef && !pruef(e, r)) continue;
      out.push(e);
    }
    return out;
  }
  function eins(liste) { return liste.length ? liste[(Math.random() * liste.length) | 0] : null; }

  /* Der Weg dauert unterschiedlich lang — abwarten statt raten. */
  function angekommen(dann, spaetestens) {
    const t0 = jetzt();
    (function warte() {
      if (!W.beschaeftigt() || jetzt() - t0 > (spaetestens || 7000)) return dann();
      zeit(warte, 160);
    })();
  }
  function kurz(e, klasse, ms) {
    if (!e) return;
    e.classList.add(klasse);
    zeit(() => e.classList.remove(klasse), ms);
  }
  function hingehen(ziel) { return ziel ? W.gehZu(ziel) : false; }

  /* Mit der Pfote antippen. Es federt, die Zeile wackelt. */
  function spielTappen() {
    const ziel = eins(sichtbar('[data-stups~="tippen"]'));
    if (!hingehen(ziel)) return false;
    angekommen(() => {
      pose("pounce", 800);
      kurz(ziel, K.tapp, 480);
      kurz(ziel.querySelector('[data-katze~="punkt"]'), K.tipp, 480);
    });
    return true;
  }
  /* Sich an etwas reiben. Es gibt ein wenig nach. */
  function spielReiben() {
    const ziel = eins(sichtbar('[data-stups~="reiben"]',
      (e, r) => r.height > 70 && r.width > 150));
    if (!hingehen(ziel)) return false;
    angekommen(() => {
      pose("knead", 3200);
      kurz(ziel, K.reib, 1500);
      if (Math.random() < 0.4) zeit(() => bubble(waehle("schnurr")), 900);
    });
    return true;
  }
  /* Etwas anschubsen. Es rutscht und kommt zurück. */
  function spielSchubsen() {
    const ziel = eins(sichtbar('[data-stups~="schubsen"]'));
    if (!hingehen(ziel)) return false;
    angekommen(() => {
      pose("duck", 700);
      zeit(() => kurz(ziel, K.schubs, 560), 260);
    });
    return true;
  }

  /* Sich hinter einem Block verstecken.
     Der Block bekommt die Klasse nicht selbst — ein Renderer ersetzt sein
     innerHTML und würde sie mitnehmen, der Begleiter stünde plötzlich wieder
     obenauf. Stattdessen hängt eine Klasse am body: solange sie gilt, liegen
     alle Blöcke vor ihm. Er geht hinter einen hinein, wartet, kommt an der
     Seite wieder hervor — und erst wenn er über keinem mehr steht, wird die
     Klasse zurückgenommen. */
  function hinterBlock() {
    const b = eins(sichtbar('[data-katze~="wand"]', (e, r) => {
      if (r.width < 170 || r.height < 90) return false;
      if (r.left < 100) return false;                   // links muss Platz zum Hervorkommen sein
      return pos.x + W.breite < r.left || pos.x > r.right ||
             pos.y + W.hoehe < r.top || pos.y > r.bottom;   // nicht der, auf dem er steht
    }));
    if (!b) return false;
    const r = b.getBoundingClientRect();
    /* Erst ab dem Ankommen wird gewacht — der Weg dorthin führt ihn ja gerade
       erst dahinter. */
    versteck = {block: b, wachsam: false, warten: null, scharf: null};
    abgang(r.left + r.width / 2 - W.breite / 2, r.top + r.height / 2 - W.hoehe / 2 + 4, 1100, "sit");
    /* Die Klasse legt alle Blöcke vor ihn. Sie stand hier eine Zeile zu früh:
       gesetzt wurde sie im Moment des Entschlusses — wer dabei schon oben
       stand, war auf der Stelle verschwunden, bevor er überhaupt losgelaufen
       war. Sie gilt erst, wenn er auch wirklich dahinter steht. */
    versteck.decken = zeit(() => {
      if (!versteck) return;                            // unterwegs abgebrochen
      dokument.body.classList.add(K.verdeckt);
    }, 1100);
    versteck.scharf = zeit(() => { if (versteck) versteck.wachsam = true; }, 1400);
    versteck.warten = zeit(() => {
      const r2 = b.getBoundingClientRect();
      versteck = null;                                  // ab hier darf er hervorragen
      abgang(r2.left - 86, r2.top + 6, 1100, "sit");    // seitlich hervor
      zeit(() => {
        dokument.body.classList.remove(K.verdeckt);
        pose("sit");
        W.streunen();
        if (Math.random() < 0.5) bubble(waehle("versteck"));
      }, 1200);
    }, 6000 + Math.random() * 9000);
    return true;
  }

  /* ---- Szenen ------------------------------------------------------ */
  function zoomies() {
    pose("sit");
    W.zoomies();
  }

  /* Je mehr heute steht, desto kürzer die Pausen zwischen den Szenen. */
  function next(min, max) {
    halt(timer);
    const k = 1 - leben().schwung * 0.4;
    timer = zeit(scene, (min + Math.random() * (max - min)) * k);
  }

  function scene() {
    const c = kontext();
    const n = c ? c.n : 0;
    const r = Math.random();

    // Nachts wird nicht getobt. Er döst, schlägt ab und zu die Augen auf und
    // fragt, ob es dir gut geht.
    if (c && c.p === "nacht") {
      pose("sleep");
      if (Math.random() < 0.55) {
        zeit(() => {
          pose("hop", 700);
          bubble(waehle("nacht"), 6000);
          zeit(() => pose("sleep"), 1400);
        }, 1200);
      }
      return next(c.tiefe > 0.4 ? 240000 : 420000, 700000);
    }

    // Eigener Wurf, damit die Wahrscheinlichkeiten darunter bleiben, wie sie
    // waren — die Spielszenen kommen oben drauf, nicht statt etwas.
    const s = stufeZeigen();
    if (s >= 1 && Math.random() < 0.10 + s * 0.07) return spielszene(s);

    if (n === 0 && r < 0.4) {                  // müde, wenn nichts los ist
      pose("sleep");
      return next(9000, 16000);
    }
    if (r < 0.16) {                            // ganz weg — wo ist er hin?
      /* Früher blendete er hier auf der Stelle aus und ploppte irgendwo
         wieder auf. Er geht jetzt entweder hinaus oder hinter einen Block —
         aus dem Nichts erscheint und verschwindet er nie. */
      if (Math.random() < 0.5 && hinterBlock()) return next(20000, 30000);
      const rechts = Math.random() < 0.5;
      abgang(rechts ? fenster.innerWidth + 40 : -110, band(), 1100, "sit");
      zeit(() => {
        pose("sit");                           // Welt übernimmt: er läuft herein
        W.streunen();
        if (Math.random() < 0.5) zeit(() => bubble(waehle("versteck")), 1400);
      }, 7000 + Math.random() * 12000);
      return next(20000, 30000);
    }
    if (r < 0.3) {                             // linsen um die Ecke
      const links = Math.random() < 0.5;
      abgang(links ? -34 : fenster.innerWidth - 40, band(), 1100, links ? "peek-l" : "peek-r");
      return next(8000, 15000);
    }
    if (r < 0.52 && n >= 4) {                  // Zoomies, wenn was los ist
      zoomies();
      return next(11000, 18000);
    }
    if (r < 0.62) {
      pose("loaf");
      return next(9000, 16000);
    }
    // Standard: er sucht sich selbst etwas — eine Kante entlang, auf den
    // nächsten Block hinüber oder eine Wand hoch.
    pose("sit");
    W.streunen();

    // Ab und zu ein Wort dazu.
    if (Math.random() < 0.45) zeit(() => bubble(buddy()), 1700);
    next(10000, 20000);
  }

  /* Er taut auf. Die ersten Tage ist er höflich und sitzt viel; dann fällt
     ihm auf, dass da hinten ein Schwanz ist; später fängt er ihn auch, knetet
     und macht Sätze; und irgendwann legt er sich vor dir auf den Rücken.
     Dieselbe Idee wie bei den Sätzen, die auch ein `ab` haben. */
  function spielszene(s) {
    const moeglich = ["schwanz", "tappen", "reiben"];
    if (s >= 2) moeglich.push("satz", "kneten", "schubsen");
    if (s >= 3) moeglich.push("bauch", "schwanz");
    let was = moeglich[(Math.random() * moeglich.length) | 0];

    /* Findet er gerade nichts zum Spielen — alles weggescrollt, die Liste
       leer —, wird es die Szene mit dem eigenen Schwanz. */
    if (was === "tappen" && !spielTappen()) was = "schwanz";
    else if (was === "reiben" && !spielReiben()) was = "schwanz";
    else if (was === "schubsen" && !spielSchubsen()) was = "schwanz";
    if (was === "tappen" || was === "reiben" || was === "schubsen") return next(11000, 19000);

    if (was === "schwanz") {
      // Erst fällt er ihm auf. Ab Stufe zwei erwischt er ihn manchmal.
      pose("tailplay", 2600);
      if (s >= 2 && Math.random() < 0.5) {
        zeit(() => {
          pose("chase", 1700);
          if (Math.random() < 0.6) bubble(waehle("jagd"));
        }, 2200);
        return next(13000, 21000);
      }
      return next(10000, 18000);
    }
    if (was === "satz") { pose("pounce", 780); return next(9000, 16000); }
    if (was === "kneten") { pose("knead", 3200); return next(10000, 17000); }
    pose("belly", 3600);
    if (Math.random() < 0.4) zeit(() => bubble(waehle("schnurr")), 700);
    return next(11000, 19000);
  }

  /* ---- Streicheln --------------------------------------------------- */
  function streicheln() {
    pets++;
    schreib(S.pets, pets);
    if (schleifeAb && pets === schleifeAb) el.classList.add(K.schleife);
    lastPoke = jetzt();
    if (wirt.buzz) wirt.buzz(6);

    const r = Math.random();
    if (r < 0.18) {                            // erschrickt und flitzt weg
      pose("sit");
      W.zoomies();
      zeit(() => bubble(waehle("weg")), 500);
    } else if (r < 0.34) {
      pose("roll", 1400);
      bubble(waehle("roll"));
    } else if (r < 0.5) {
      pose("chase", 1600);
      bubble(waehle("jagd"));
    } else {
      const s = stufe();
      pose(s >= 2 && Math.random() < 0.4 ? "knead" : "purr", 1500);
      bubble(Math.random() < 0.5 ? waehle("schnurr") : buddy());
      if (wirt.burst) wirt.burst(knopf, {anlass: "streicheln", stufe: s});
    }
    /* Zwei Wegmarken. Was dabei gesagt wird, gehört der App — fehlt der
       Topf, passiert nur das Sichtbare. */
    if (schleifeAb && pets === schleifeAb) bubble(waehle("schleife"), 3600);
    if (bundJe && pets && pets % bundJe === 0) {
      bubble(waehle("bund"), 4000);
      if (wirt.rain) wirt.rain();
    }
    next(9000, 16000);
  }

  /* Über die Tastatur geht der Knopf, mit dem Finger wird pixelgenau geprüft
     — sonst deckt das Rechteck zu, was darunter liegt. */
  knopf.addEventListener("click", streicheln);
  dokument.addEventListener("click", (ev) => {
    if (el.hidden || draussen()) return;
    if (!B.treffer(leinwand, ev.clientX, ev.clientY)) return;
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    streicheln();
  }, true);

  /* ---- Reaktion auf ein Häkchen ------------------------------------- */
  function cheer(n, quelle) {
    lastPoke = jetzt();
    const k = Math.min(1, Math.max(0, (n - 1) / 11));
    if (draussen()) return;                        // er ist gerade nicht da
    if (k > 0.75 && Math.random() < 0.7) zoomies();
    else if (quelle && Math.random() < 0.75) komm(quelle);
    else pose("hop", 620);
    if (jetzt() - lastSay < 1500) { /* der Bonus hat gerade schon was gesagt */ }
    else if (n === 1) bubble(waehle("erst"));
    else if (Math.random() < 0.25) bubble(waehle("mehr"));
    next(9000, 16000);
  }

  /* Herkommen und sich freuen. Liegt das erledigte Ziel im Bild, setzt er
     sich kurz obendrauf und geht danach zurück an den Rand — stehen bleiben
     würde den Inhalt zudecken. */
  function komm(ziel) {
    pose("sit");
    const geht = ziel ? W.gehZu(ziel) : false;
    if (!geht) pose("hop", 700);
    zeit(() => bubble(buddy(), 4200), geht ? 900 : 220);
  }

  /* Lange nichts passiert? Dann meldet er sich von selbst — und einmal, wenn
     der Tag in seinen nächsten Abschnitt kippt. */
  let letztePhase = null;
  fenster.setInterval(() => {
    const c = kontext();
    if (!c || dokument.hidden) return;
    if (letztePhase && c.p !== letztePhase) {
      letztePhase = c.p;
      lastPoke = jetzt();
      bubble(buddy(), 5000);
      pose("hop", 600);
      return;
    }
    letztePhase = c.p;
    if (jetzt() - lastPoke < 300000) return;
    lastPoke = jetzt();
    bubble(buddy(), 4600);
    pose("hop", 600);
  }, 30000);

  fenster.addEventListener("resize", () => { W.anhalten(); W.messen(); });

  function start() {
    el.hidden = false;
    stufeZeigen();
    W.messen();
    place(-110, band(), 0);                  // draußen, noch nicht im Bild
    pose("sit");                             // und von dort zu Fuß herein
    W.streunen();
    next(6000, 11000);
  }

  /* `spiele`: die Szenen einzeln aufrufbar. Über die Szenenlotterie sind sie
     nicht zu prüfen — sie hängen an mehreren Math.random() hintereinander. */
  return {
    start, cheer, say: bubble, komm, abgang, wachen, stufe, streicheln,
    spiele: {tappen: spielTappen, reiben: spielReiben,
             schubsen: spielSchubsen, verstecken: hinterBlock},
    poseJetzt: () => aktPose,
    satz: (n) => waehle(n),
    zeichneJetzt,
    element: el, welt: W, bild: B
  };
}

export default erzeugeBegleiter;
