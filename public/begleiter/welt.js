/* =====================================================================
   Die Welt des Begleiters

   Er springt nicht an Zufallsstellen und blendet sich dorthin — das sah
   nach Teleportieren aus. Er liest die Seite als Landschaft: Oberkanten
   sind Wege, senkrechte Kanten hoher Blöcke sind Kletterwände. Bewegt
   wird Bild für Bild, nicht per CSS-Übergang.

   Der Sprung hat die drei Teile, die ein Tier auch hat: es duckt sich und
   wackelt mit dem Hinterteil, es springt, es fängt sich. Wie lange das
   Sammeln dauert, hängt an der Strecke.

   ## Das Gelände ist eine Konvention, keine Klassenliste

   Hier stand einmal `BLOCK_SEL` — zehn fest verdrahtete Klassennamen einer
   einzigen App. Der Kern darf die Klassennamen einer App nicht kennen.
   Stattdessen stempelt der Renderer:

       data-katze="weg"    Die Oberkante ist ein Weg.
       data-katze="wand"   Dazu: die senkrechten Kanten sind Kletterwände,
                           und dahinter kann sich der Begleiter verstecken.
                           "wand" schließt "weg" ein.

   Mehrere Rollen stehen durch Leerzeichen getrennt nebeneinander
   (`data-katze="wand stups"`). Die Spielziele — "stups" und "punkt" —
   liest nicht diese Datei, sondern `begleiter.js`.

   Ob ein Stempel auch trägt, entscheidet weiterhin die Geometrie: zu
   schmal, zu flach, halb aus dem Bild — dann ist es kein Weg. Der Stempel
   erlaubt, er erzwingt nicht.

   Alle Koordinaten sind Fensterkoordinaten (der Begleiter liegt fixed),
   und gerechnet wird mit dem Fußpunkt: Mitte unten.

   Herkunft: lifetracker/public/cat-welt.js.
   ===================================================================== */

/** Die Rollen eines Elements, aus data-katze gelesen. */
function rollen(el) {
  const d = el.dataset ? el.dataset.katze : null;
  return d ? String(d).trim().split(/\s+/) : [];
}

/**
 * @param {object} [o]
 * @param {object} [o.dokument]  Braucht querySelectorAll.
 * @param {object} [o.fenster]   Braucht innerWidth, innerHeight, scrollY.
 * @param {function} [o.jetzt]   Uhr, voreingestellt Date.now.
 * @param {number} [o.breit]     Größe des Begleiterkastens.
 * @param {number} [o.hoch]
 */
export function erzeugeWelt(o) {
  o = o || {};
  const welt = (typeof globalThis !== "undefined" ? globalThis : {});
  const dokument = o.dokument || welt.document;
  const fenster = o.fenster || welt;
  const jetzt = o.jetzt || Date.now;
  const BREIT = o.breit || 72, HOCH = o.hoch || 56;
  const RAND = 8;                        /* so nah geht er an eine Kante */
  const innerWidth = () => fenster.innerWidth;
  const innerHeight = () => fenster.innerHeight;

  let kanten = [], waende = [], zuletztGemessen = -1, letzterScroll = -1;

  /* Wie viel heute schon abgehakt ist, 0..1. Setzt der Begleiter. Je mehr
     steht, desto zügiger läuft er und desto kürzer sitzt er herum. */
  let schwung = 0;
  function setSchwung(w) { schwung = Math.max(0, Math.min(1, +w || 0)); }
  function ruheDauer(d) { return d * (1 - schwung * 0.45); }

  /* ---- Die Seite vermessen --------------------------------------- */
  function messen() {
    const k = [], w = [];
    const alle = dokument ? dokument.querySelectorAll("[data-katze]") : [];
    for (let i = 0; i < alle.length; i++) {
      const el = alle[i];
      /* Was zum Begleiter selbst gehört, ist kein Gelände. */
      if (el.closest && el.closest("[data-katze-selbst]")) continue;
      const r = rollen(el);
      const istWand = r.indexOf("wand") >= 0;
      if (!istWand && r.indexOf("weg") < 0) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 60 || b.height < 14) continue;
      if (b.bottom < 0 || b.top > innerHeight()) continue;
      /* Nicht ganz oben und nicht unter dem Rand — sonst steht er im Nichts. */
      if (b.top < 64 || b.top > innerHeight() - 24) continue;
      k.push({x1: b.left, x2: b.right, y: b.top, el: el});
      if (istWand && b.height >= 84 && b.top > 70 && b.bottom < innerHeight() - 10) {
        w.push({x: b.left, y1: b.top, y2: b.bottom, flip: false, el: el});
        w.push({x: b.right, y1: b.top, y2: b.bottom, flip: true, el: el});
      }
    }
    /* Der Fensterboden ist immer da, damit er nie ohne Weg dasteht. */
    k.push({x1: 10, x2: innerWidth() - 10, y: innerHeight() - 76, el: null});
    kanten = k; waende = w;
    zuletztGemessen = jetzt();
    letzterScroll = fenster.scrollY;
    /* Jede Messung baut neue Objekte. Wer noch auf eine alte Kante zeigt —
       der Begleiter selbst und jeder Schritt im Plan — bekommt hier die neue
       zugewiesen. Sonst wäre der Plan nach einer Sekunde wieder weg. */
    Z.kante = neuBinden(Z.kante);
    for (const st of Z.plan) if (st.kante) st.kante = neuBinden(st.kante) || st.kante;
  }
  function neuBinden(alt) {
    if (!alt) return null;
    for (const l of kanten) if (l.el === alt.el) return l;
    return kanteNah((alt.x1 + alt.x2) / 2, alt.y);
  }
  function frisch() {
    if (jetzt() - zuletztGemessen > 1200 || Math.abs(fenster.scrollY - letzterScroll) > 4) messen();
  }

  function aufKante(l, x) { return Math.max(l.x1 + RAND, Math.min(l.x2 - RAND, x)); }
  function mitte(l) { return (l.x1 + l.x2) / 2; }
  function kanteVon(el) {
    for (const l of kanten) if (l.el === el) return l;
    return null;
  }
  /* Anders als kanteNah() liefert sie nichts, wenn an der Stelle nichts ist.
     Wer herunterklettert, soll lieber oben bleiben als ins Leere steigen. */
  function kanteBei(x, y, toleranz) {
    let best = null, s = 1e9;
    for (const l of kanten) {
      const d = Math.abs(l.y - y);
      if (d > toleranz) continue;
      if (x < l.x1 - RAND || x > l.x2 + RAND) continue;
      if (d < s) { s = d; best = l; }
    }
    return best;
  }
  function kanteNah(x, y) {
    let best = null, s = 1e9;
    for (const l of kanten) {
      const d = Math.abs(aufKante(l, x) - x) * 0.6 + Math.abs(l.y - y);
      if (d < s) { s = d; best = l; }
    }
    return best;
  }

  /* ---- Zustand ---------------------------------------------------- */
  const Z = {
    fx: 60, fy: 0, kante: null, kanteEl: null, dir: 1, theta: 0,
    plan: [], t: 0, manuell: false,
    blickX: 0, blickBis: 0
  };

  /* Wie weit er einem Bild folgen darf, ohne dass es nach Versetzen aussieht.
     Hier standen einmal 24 px je Bild — bei 60 Bildern 1441 px in der Sekunde.
     Das war als Scroll-Nachführung gedacht, wurde aber auf jede Höhendifferenz
     angewandt: gemessen ein senkrechter Schuss von y=251 auf y=155 in vier
     Bildern, in Duckpose, lange nachdem das Scrollen aufgehört hatte.

     Das Scrollen ist jetzt anderswo gelöst (scrollMitnehmen), und was hier
     bleibt, sind kleine Korrekturen nach einem Umbau der Seite. Sechs Pixel
     je Bild sind 360 px/s — sichtbar als Bewegung, nicht als Ruck. */
  const FOLGE = 6;
  function folgeY(zy) {
    const d = zy - Z.fy;
    Z.fy += Math.abs(d) <= FOLGE ? d : (d < 0 ? -FOLGE : FOLGE);
  }

  /* So nah kommt er den Fensterrändern beim Mitfahren: oben muss der Kopf
     hineinpassen, unten der Fußpunkt sichtbar bleiben. */
  const MIT_OBEN = 70, MIT_UNTEN = 20;

  /* Scrollt die Seite, wandert die Kante unter ihm weg — um genau die
     Scrollstrecke. Diese Strecke geht deshalb direkt auf seinen Fußpunkt:
     relativ zum Block steht er still, und genau so soll es aussehen.

     Vorher blieb er beim Scrollen liegen und wurde hinterher von folgeY
     eingeholt, mit voller Kappung. Der Rückstand entstand bei jedem Wisch
     neu, weil frisch() erst ab 4 px Scrollweg neu vermisst.

     Ein Satz über mehr als eine Bildschirmhöhe ist kein Scrollen, sondern
     eine Sprungmarke oder ein Tab, der lange geschlafen hat. Da wird nicht
     mitgenommen, sondern nur neu angesetzt. */
  let scrollVorher = null;
  function scrollMitnehmen() {
    const s = fenster.scrollY;
    if (scrollVorher === null) { scrollVorher = s; return; }
    const d = s - scrollVorher;
    scrollVorher = s;
    if (!d || Math.abs(d) > innerHeight()) return;
    /* Mitgenommen wird beides — der Begleiter und der Boden unter ihm. Die
       Seite scrollt starr, alles wandert um dieselbe Strecke; das lässt sich
       rechnen, und messen() wäre ein Layout je Bild.

       Nur den Begleiter zu verschieben genügte nicht: die Kanten blieben bis
       zur nächsten Messung liegen, und folgeY zog ihn im selben Bild wieder
       zurück. Gemessen blieben davon 100 px/s Eigenbewegung.

       Der Fensterboden bleibt, wo er ist: er hängt am Fenster, nicht an der
       Seite. */
    for (const l of kanten) if (l.el) l.y -= d;
    for (const w of waende) { w.y1 -= d; w.y2 -= d; }
    /* Er selbst wandert nur mit, wenn er auf der Seite steht. Auf dem
       Fensterboden bleibt er, wo er ist. Wer das übersieht, schiebt ihn beim
       Scrollen vom Boden und lässt ihn von folgeY zurückrutschen: gemessen
       360 px/s Zappeln gegen die Seite. */
    if (!Z.kante || !Z.kante.el) return;
    /* Und nur so weit, wie er im Bild bleibt. Sein Block darf hinausscrollen
       — er nicht: mitgetragen stand er bei y=-141, also oberhalb des
       Fensters, und tauchte Sekunden später irgendwo wieder auf.

       Am Rand lässt er den Block deshalb los. Nur festhalten wäre falsch:
       dann bliebe er an seiner alten Kante hängen und folgeY zerrte ihn Bild
       für Bild hinterher — gemessen 360 px/s Gleiten in Gehpose. Ohne Kante
       sucht tick() ihm im selben Bild eine neue und schickt ihn sichtbar
       dorthin. */
    const neu = Z.fy - d;
    if (neu < MIT_OBEN || neu > innerHeight() - MIT_UNTEN) {
      Z.kante = null;
      Z.plan = [];
      Z.fy = Math.max(MIT_OBEN, Math.min(innerHeight() - MIT_UNTEN, neu));
      return;
    }
    Z.fy = neu;
  }

  /* ---- Nummern ---------------------------------------------------- */
  function schrittWeite(l) { return Math.max(0, l.x2 - l.x1 - RAND * 2); }

  function nachbarn(maxDx, maxDy) {
    const out = [];
    for (const l of kanten) {
      if (l === Z.kante) continue;
      if (Math.abs(aufKante(l, Z.fx) - Z.fx) > maxDx) continue;
      if (Math.abs(l.y - Z.fy) > maxDy) continue;
      out.push(l);
    }
    return out;
  }

  function streunen() {
    frisch();
    if (!Z.kante) Z.kante = kanteNah(Z.fx, Z.fy);
    if (!Z.kante) return;
    const r = Math.random();

    /* Eine Wand hoch- oder herunterklettern, wenn eine in Reichweite ist.
       In Reichweite heißt: die Wand steht auf seiner eigenen Kante. Sonst
       lief er waagerecht dorthin, auch wenn dazwischen nichts war — gemessen
       ein Marsch von x=141 bis x=400 auf einer Kante, die bei x=200 endete. */
    if (r < 0.16) {
      let wand = null, best = 1e9;
      for (const w of waende) {
        if (w.y2 - w.y1 < 90) continue;
        if (w.x < Z.kante.x1 - RAND || w.x > Z.kante.x2 + RAND) continue;
        const von = Math.abs(w.y1 - Z.fy) < Math.abs(w.y2 - Z.fy) ? w.y1 : w.y2;
        if (Math.abs(von - Z.fy) > 80) continue;
        /* Oben wartet die Kante des Blocks selbst; unten muss eine andere dort
           liegen. Findet sich keine, klettert er nicht. Vorher bekam er in
           beiden Fällen die Oberkante zugewiesen: nach dem Abstieg stand er
           unten im Nichts und wurde im nächsten Bild hinaufgerissen —
           gemessen ein Satz von y=420 auf y=120, in einem einzigen Bild. */
        const hinauf = von === w.y2;
        const landung = hinauf ? kanteVon(w.el) : kanteBei(w.x, w.y2, 26);
        if (!landung) continue;
        const d = Math.abs(w.x - Z.fx);
        if (d < best && d < 340) { best = d; wand = {w: w, ziel: landung}; }
      }
      if (wand) {
        /* Bis an die Wand, nicht nur bis RAND davor: die Wände eines Blocks
           liegen genau auf seinen Rändern, und aufKante() hält dort 8 px
           Abstand — er wäre beim Aufsetzen an der Wand geruckt. */
        Z.plan = [{t: "geh", x: Math.max(Z.kante.x1, Math.min(Z.kante.x2, wand.w.x))},
                  {t: "kante", wand: wand.w, kante: wand.ziel},
                  {t: "ziel", kante: wand.ziel},
                  {t: "ruhe", dauer: ruheDauer(2 + Math.random() * 3)}];
        return;
      }
    }

    /* Auf einen anderen Block springen. */
    if (r < 0.62) {
      const nah = nachbarn(300, 190);
      if (nah.length) {
        planeSprung(nah[(Math.random() * nah.length) | 0]);
        return;
      }
    }

    /* Sonst: ein Stück auf der eigenen Kante entlang und hinsetzen. */
    const w2 = schrittWeite(Z.kante);
    Z.plan = [{t: "geh", x: Z.kante.x1 + RAND + Math.random() * w2},
              {t: "ruhe", dauer: ruheDauer(3 + Math.random() * 6)}];
  }

  /* Erst an die nächstgelegene Stelle laufen, dann sammeln und springen. */
  function planeSprung(ziel, dann) {
    const zx = aufKante(ziel, Z.fx);
    const vonX = Z.kante ? aufKante(Z.kante, zx) : Z.fx;
    /* Hinauf kostet Anlauf, hinunter nicht: vorher duckte er sich vor einem
       Fall genauso lange wie vor einem Satz nach oben. */
    const hoch = Z.fy - ziel.y;
    const strecke = Math.abs(zx - vonX) + (hoch > 0 ? hoch * 1.1 : -hoch * 0.35);
    Z.plan = [{t: "geh", x: vonX},
              {t: "sammeln", dauer: Math.min(1.0, 0.22 + strecke / 620)},
              {t: "sprung", kante: ziel, x: zx}];
    if (dann) Z.plan.push(dann);
  }

  /* Zoomies sind Rennen, kein Teleportieren. Vorher zog er drei beliebige
     Kanten aus dem ganzen Fenster und sprang hin — Sätze über die halbe
     Seite, also genau das, was diese Datei abschaffen sollte. Jetzt: schnelle
     Bahnen von Kantenende zu Kantenende, dazwischen kurze Hüpfer auf
     Nachbarkanten.

     Beide Schrittarten entscheiden erst beim Ausführen, wohin es geht. Ein
     im Voraus ausgerechnetes x wäre nach dem ersten Hüpfer falsch. */
  function zoomies() {
    frisch();
    if (!Z.kante) Z.kante = kanteNah(Z.fx, Z.fy);
    if (!Z.kante) return;
    Z.plan = [];
    for (let i = 0; i < 3; i++) {
      Z.plan.push({t: "rennen", ende: i % 2 ? -1 : 1});
      if (Math.random() < 0.6) Z.plan.push({t: "huepf"});
    }
    Z.plan.push({t: "ruhe", dauer: ruheDauer(2)});
  }

  /* Zu einem Element hinlaufen — und wenn es passt, obendrauf. */
  function gehZu(el) {
    frisch();
    let l = el ? kanteVon(el) : null;
    if (!l && el) {
      const r = el.getBoundingClientRect();
      l = kanteNah(r.left + r.width / 2, r.top);
    }
    if (!l) return false;
    if (l === Z.kante) Z.plan = [{t: "geh", x: aufKante(l, mitte(l))}, {t: "ruhe", dauer: 3}];
    else planeSprung(l, {t: "ruhe", dauer: 3});
    return true;
  }

  /* ---- Schritt für Schritt ---------------------------------------- */
  function tick(dt) {
    Z.t += dt;
    if (Z.manuell) { scrollVorher = fenster.scrollY; return null; }
    scrollMitnehmen();
    frisch();

    if (!Z.kante) { Z.kante = kanteNah(Z.fx, Z.fy); if (!Z.kante) return null; }

    /* Nie versetzt werden, immer selbst hingehen.
       Steht er woanders als seine Kante — weil die Seite neu vermessen wurde,
       weil eine Ruhepose seinen Heimweg weggeräumt hat, weil er eben noch
       draußen war —, dann springt oder geht er hin. Während Sprung und
       Klettern führt der Schritt selbst, da gilt die Wache nicht.
       Ist es dieselbe Kante wie im Bild davor, ist es die Seite, die scrollt:
       dann folgt er ihr (folgeY), statt jedes Mal neu zu springen. */
    const wache = Z.plan[0];
    const zx0 = aufKante(Z.kante, Z.fx);
    /* Auch mitten in einem Gehschritt: steht er in der Höhe ganz woanders als
       seine Kante, gehört dorthin ein Sprung. Vorher galt die Wache nur bei
       leerem Plan oder in Ruhe — während eines "geh" glitt er die Differenz
       mit folgeY ab, senkrecht und in Laufpose. */
    if (!wache || wache.t === "ruhe" || wache.t === "geh") {
      if (Z.kante.el !== Z.kanteEl && Math.abs(Z.kante.y - Z.fy) > 60) {
        Z.kanteEl = Z.kante.el;
        Z.plan.unshift({t: "sammeln", dauer: 0.18, halten: true},
                       {t: "sprung", kante: Z.kante, x: zx0});
        return tick(0);
      }
    }
    /* Die Korrektur zur Seite dagegen nur, wenn nichts läuft: ein "geh" trägt
       sein eigenes Ziel und würde sich hier endlos selbst voranstellen. */
    if (!wache || wache.t === "ruhe") {
      if (Math.abs(zx0 - Z.fx) > FOLGE) {
        Z.kanteEl = Z.kante.el;
        Z.plan.unshift({t: "geh", x: zx0});
        return tick(0);
      }
    }
    Z.kanteEl = Z.kante.el;

    const schritt = Z.plan[0];
    if (!schritt) {
      /* Auf der Kante bleiben, auch wenn die Seite scrollt. */
      folgeY(Z.kante.y);
      Z.fx = Math.max(Z.kante.x1 + RAND, Math.min(Z.kante.x2 - RAND, Z.fx));
      return {pose: null, fx: Z.fx, fy: Z.fy, dir: Z.dir};
    }

    if (schritt.t === "ruhe") {
      folgeY(Z.kante.y);
      if (!schritt.bis) schritt.bis = Z.t + schritt.dauer;
      if (Z.t > schritt.bis) Z.plan.shift();
      return {pose: null, fx: Z.fx, fy: Z.fy, dir: Z.dir};
    }

    if (schritt.t === "ziel") { Z.kante = schritt.kante; Z.plan.shift(); return tick(0); }

    if (schritt.t === "geh") {
      folgeY(Z.kante.y);
      const v = 62 * (1 + schwung * 0.45), d = schritt.x - Z.fx;
      Z.dir = d < 0 ? -1 : 1;
      if (Math.abs(d) < v * dt + 0.5) { Z.fx = schritt.x; Z.plan.shift(); }
      else {
        Z.fx += (d < 0 ? -1 : 1) * v * dt;
        Z.theta += dt * 2 * Math.PI * (v / 24);
      }
      return {pose: "walk", fx: Z.fx, fy: Z.fy, dir: Z.dir, theta: Z.theta};
    }

    if (schritt.t === "rennen") {
      /* Wie "geh", nur schneller und mit der Rennpose. Das Ziel ist das Ende
         der Kante, auf der er gerade steht — jedes Bild neu gelesen, damit
         ein Hüpfer davor nichts verdirbt. */
      folgeY(Z.kante.y);
      const zr = schritt.ende < 0 ? Z.kante.x1 + RAND : Z.kante.x2 - RAND;
      const vr = 186, dr = zr - Z.fx;
      Z.dir = dr < 0 ? -1 : 1;
      if (Math.abs(dr) < vr * dt + 0.5) { Z.fx = zr; Z.plan.shift(); }
      else {
        Z.fx += (dr < 0 ? -1 : 1) * vr * dt;
        Z.theta += dt * 2 * Math.PI * (vr / 34);
      }
      return {pose: "chase", fx: Z.fx, fy: Z.fy, dir: Z.dir, theta: Z.theta};
    }

    if (schritt.t === "huepf") {
      /* Erst jetzt wird ausgesucht, wohin. Ist keine Nachbarkante in der Nähe,
         fällt der Hüpfer ersatzlos aus und er rennt weiter. */
      Z.plan.shift();
      const nahe = nachbarn(260, 150);
      if (nahe.length) {
        const zk = nahe[(Math.random() * nahe.length) | 0];
        Z.plan.unshift({t: "sammeln", dauer: 0.12},
                       {t: "sprung", kante: zk, x: aufKante(zk, Z.fx)});
      }
      return tick(0);
    }

    if (schritt.t === "sammeln") {
      /* Ducken, Hinterteil wackeln, Ziel anvisieren. Wer sich für den Weg
         zurück auf seine Kante sammelt, bleibt dabei stehen — hinbringen soll
         ihn der Sprung, nicht das Ducken davor. */
      if (!schritt.halten) folgeY(Z.kante.y);
      if (!schritt.bis) schritt.bis = Z.t + schritt.dauer;
      const naechst = Z.plan[1];
      if (naechst && naechst.x !== undefined) Z.dir = naechst.x < Z.fx ? -1 : 1;
      if (Z.t > schritt.bis) Z.plan.shift();
      return {pose: "duck", fx: Z.fx, fy: Z.fy, dir: Z.dir,
              wackel: Math.round(Math.sin(Z.t * 34) * 1.4)};
    }

    if (schritt.t === "sprung") {
      if (!schritt.flug) {
        const weit = Math.abs(schritt.x - Z.fx), hoch = Z.fy - schritt.kante.y;
        schritt.flug = {
          x0: Z.fx, y0: Z.fy, x1: schritt.x, y1: schritt.kante.y, k: 0,
          /* Auch der Fall braucht Zeit: ein Satz über eine halbe Seite nach
             unten dauerte 0.28 s — das war ein Strich, kein Sprung.
             Die Obergrenze stand auf 0.85 s. Ein Satz über die volle
             Bildschirmhöhe — der kommt vor, wenn der Block unter ihm
             weggescrollt ist — wurde damit zu 1090 px/s und sah aus wie ein
             Strich. Wer weit springt, darf länger fliegen. */
          dauer: Math.max(0.28, Math.min(1.15, 0.26 + weit / 460
                          + Math.max(0, hoch) / 420 + Math.max(0, -hoch) / 700)),
          bogen: 16 + weit * 0.13 + Math.max(0, hoch) * 0.5
        };
        Z.dir = schritt.flug.x1 < schritt.flug.x0 ? -1 : 1;
      }
      const f = schritt.flug;
      f.k += dt / f.dauer;
      const k = Math.min(1, f.k);
      Z.fx = f.x0 + (f.x1 - f.x0) * k;
      Z.fy = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.bogen;
      if (k >= 1) {
        Z.fy = f.y1; Z.kante = schritt.kante; Z.plan.shift();
        /* Kurz abfedern, statt hart zu stehen. */
        Z.plan.unshift({t: "sammeln", dauer: 0.13});
      }
      return {pose: "luft", fx: Z.fx, fy: Z.fy, dir: Z.dir};
    }

    if (schritt.t === "kante") {
      /* Das Ziel steht nicht als Zahl im Schritt, sondern wird jedes Bild aus
         der Zielkante gelesen: messen() bindet die Kanten beim Scrollen neu,
         eine gemerkte Höhe wäre danach die von vorhin. */
      const zk2 = schritt.kante.y, dk = zk2 - Z.fy;
      /* Hinauf mühsam, hinunter zügig — so klettert ein Tier. */
      const vk = dk < 0 ? 44 : 66;
      Z.fx = schritt.wand.x;
      Z.dir = schritt.wand.flip ? -1 : 1;
      if (Math.abs(dk) < vk * dt + 0.5) { Z.fy = zk2; Z.plan.shift(); }
      else Z.fy += (dk < 0 ? -1 : 1) * vk * dt;
      return {pose: "kante", fx: Z.fx, fy: Z.fy, dir: Z.dir,
              kante: Math.floor(Z.t * 5.4)};
    }

    Z.plan.shift();
    return null;
  }

  /* ---- Außenwelt --------------------------------------------------- */
  function setzen(fx, fy) { Z.fx = fx; Z.fy = fy; Z.plan = []; scrollVorher = fenster.scrollY; }

  /* Übergabe zurück an die Welt. Er darf dabei nirgendwohin versetzt werden:
     bisher zog das erste Bild ihn auf die nächste Blockkante — von draußen
     (gemessen: -33 auf 584) und in der Höhe genauso, weil "geh" und "sammeln"
     fy hart auf die Kante setzen. Wer draußen steht, kommt am Rand herein;
     wer drinnen neben der Kante steht, springt hin. */
  function manuell(an) {
    Z.manuell = !!an;
    if (an) return;
    messen();
    if (Z.plan.length) return;                 // er ist unterwegs, nicht stören
    const l = kanteNah(Z.fx, Z.fy);
    if (!l) return;
    Z.kante = l;
    if (Z.fx < 0 || Z.fx > innerWidth()) {
      const vonLinks = Z.fx < 0;
      Z.fy = l.y;                              // still gerichtet, er ist draußen
      Z.fx = vonLinks ? -BREIT : innerWidth() + BREIT;
      Z.dir = vonLinks ? 1 : -1;
      Z.plan = [{t: "geh", x: aufKante(l, vonLinks ? l.x1 : l.x2)},
                {t: "ruhe", dauer: 1.2}];
      return;
    }
    const zx = aufKante(l, Z.fx);
    if (Math.abs(Z.fy - l.y) > 6) Z.plan = [{t: "sprung", kante: l, x: zx}];
    else if (Math.abs(zx - Z.fx) > 4) Z.plan = [{t: "geh", x: zx}];
  }

  function beschaeftigt() { return Z.plan.length > 0; }
  function position() { return {fx: Z.fx, fy: Z.fy, dir: Z.dir}; }

  /* Der Plan darf nicht mitten im Sprung oder an der Wand weggenommen werden:
     er stünde in der Luft, und das nächste Bild risse ihn auf die Kante —
     genau der Ruck, den diese Datei abschaffen soll. Der laufende Schritt
     kommt zu Ende, samt der "ziel"-Schritte dahinter, die ihm die Kante
     zuweisen, auf der er landet. Der Rest fällt weg. */
  function anhalten() {
    const s = Z.plan[0];
    if (!s || (s.t !== "sprung" && s.t !== "kante")) { Z.plan = []; return; }
    const rest = [s];
    for (let i = 1; i < Z.plan.length && Z.plan[i].t === "ziel"; i++) rest.push(Z.plan[i]);
    Z.plan = rest;
  }

  /* Hinschauen. Wer länger auf sich aufmerksam macht, wird besucht. */
  function schau(x, y, dringend) {
    Z.blickX = x;
    Z.blickBis = jetzt() + 2800;
    if (!dringend || Z.plan.length) return;
    frisch();
    const l = kanteNah(x, y);
    if (!l) return;
    if (l === Z.kante) Z.plan = [{t: "geh", x: aufKante(l, x)}, {t: "ruhe", dauer: 2.5}];
    else planeSprung(l, {t: "ruhe", dauer: 2.5});
  }
  function blick() {
    if (jetzt() > Z.blickBis) return 0;
    const d = Z.blickX - Z.fx;
    const b = Math.max(-2, Math.min(2, Math.round(d / 110)));
    return Z.dir < 0 ? -b : b;
  }

  /* Nur zum Zusehen: die Landschaft und der Plan, wie sie gerade sind. Ohne
     das ist von außen nicht zu erkennen, warum er tut, was er tut. Geschrieben
     wird hier nichts. */
  function landschaft() { return {kanten: kanten, waende: waende}; }
  function zustand() {
    return {fx: Z.fx, fy: Z.fy, dir: Z.dir, manuell: Z.manuell, t: Z.t,
            kante: Z.kante, plan: Z.plan.map((s) =>
              ({t: s.t, x: s.x, dauer: s.dauer, y: s.kante ? s.kante.y : null}))};
  }

  return {
    messen, tick, streunen, zoomies, gehZu, schau, blick, setzen,
    manuell, beschaeftigt, position, anhalten, setSchwung,
    landschaft, zustand, breite: BREIT, hoehe: HOCH
  };
}

export default erzeugeWelt;
