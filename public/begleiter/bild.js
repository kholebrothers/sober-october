/* =====================================================================
   Das Bild des Begleiters

   Kein Einzelbild wird geladen, jedes wird gerechnet. Der Trick dahinter
   ist eine Regel: aus einer reinen Silhouette ('X' = Fell) entsteht die
   Kontur von allein — ein Pixel Rand, dunkler auf der Schattenseite links
   und unten, ein Streifen Mittelgrau innen an der Kante, sonst Fell.
   Deshalb müssen für eine neue Pose nur Umrisse gezeichnet werden.

   Schwanz und Kopf sind keine festen Bilder: der Schwanz wächst als Kurve
   aus dem Rumpf (Winkel, Krümmung, Verjüngung), der Kopf dreht, indem das
   Gesicht im Schädel wandert. Sonst sieht die Bewegung zerhackt aus.

   Was hier steht, ist die Regel. **Das Tier steht woanders.** Die
   Silhouette wird bei der Konstruktion hineingereicht — Umrisse, Posen,
   Farbnamen, Schmuck. Ein Klon bekommt ein anderes Tier, ohne diese Datei
   anzufassen. Ein Beispiel liegt in `test/beispiel/katze.js`.

       const bild = erzeugeBild({ silhouette, css, fenster });
       bild.zeichne(leinwand, zustand, t);

   Herkunft: lifetracker/public/cat-pixel.js.
   ===================================================================== */

/* ---- Werkzeug ---------------------------------------------------- */

/** Alle Zeilen auf gleiche Länge, Leerzeichen zählen als Loch. */
function norm(rows) {
  let w = 0;
  for (const r of rows) if (r.length > w) w = r.length;
  return rows.map((r) => {
    let z = r.replace(/ /g, ".");
    while (z.length < w) z += ".";
    return z;
  });
}

function leer(w, h) {
  const z = ".".repeat(w), out = [];
  for (let i = 0; i < h; i++) out.push(z);
  return out;
}

/** Aus einem gefärbten Bild wieder die reine Silhouette machen. */
function maske(sp) {
  return sp.map((z) => z.replace(/[^.]/g, "X"));
}

/** Einen Flicken über ein Bild legen. Löcher lassen durch. */
function stempel(basis, flicken, ox, oy) {
  const b = basis.map((z) => z.split(""));
  const h = b.length, w = b[0].length, p = norm(flicken);
  for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
      if (p[y][x] === ".") continue;
      const Y = oy + y, X = ox + x;
      if (Y >= 0 && Y < h && X >= 0 && X < w) b[Y][X] = p[y][x];
    }
  }
  return b.map((z) => z.join(""));
}

/** Aus der Silhouette die Kontur rechnen. Das ist die ganze Regel. */
function kontur(rows) {
  const m = norm(rows), h = m.length, w = m[0].length;
  const fest = (x, y) => x >= 0 && x < w && y >= 0 && y < h && m[y][x] !== ".";
  const out = [];
  for (let y = 0; y < h; y++) {
    let zeile = "";
    for (let x = 0; x < w; x++) {
      if (!fest(x, y)) { zeile += "."; continue; }
      const l = fest(x - 1, y), r = fest(x + 1, y), o = fest(x, y - 1), u = fest(x, y + 1);
      if (!(l && r && o && u)) zeile += (!l || (!u && r)) ? "K" : "D";
      else zeile += (!fest(x - 2, y) || !fest(x, y + 2)) ? "m" : "g";
    }
    out.push(zeile);
  }
  return out;
}

/** Wo liegt echtes Inneres — Fell mit Fell ringsum? */
function innen(sp) {
  const m = norm(sp), h = m.length, w = m[0].length;
  const fest = (x, y) => x >= 0 && x < w && y >= 0 && y < h && m[y][x] !== ".";
  const out = [];
  for (let y = 0; y < h; y++) {
    const zeile = [];
    for (let x = 0; x < w; x++)
      zeile.push(fest(x, y) && fest(x - 1, y) && fest(x + 1, y) && fest(x, y - 1));
    out.push(zeile);
  }
  return out;
}

/* ---- Schwanz als Kurve -------------------------------------------- */
/* Winkel, Krümmung, Verjüngung — daraus wächst er Schritt für Schritt aus
   dem Rumpf. Ein fester Schwanz sähe bei jeder Pose gleich aus. */
function schwanzMaske(w, h, t, gradWinkel) {
  const gitter = [];
  for (let y = 0; y < h; y++) gitter.push(new Array(w).fill(false));
  let a = gradWinkel * Math.PI / 180, px = t.ax, py = t.ay;
  const schritte = Math.max(2, Math.round(t.len));
  for (let i = 0; i <= schritte; i++) {
    const r = t.thick * (1 - 0.45 * i / schritte), ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const qx = Math.round(px) + dx, qy = Math.round(py) + dy;
      if (qx >= 0 && qx < w && qy >= 0 && qy < h) gitter[qy][qx] = true;
    }
    a += t.curl * Math.PI / 180;
    px += Math.cos(a) * (t.len / schritte);
    py -= Math.sin(a) * (t.len / schritte);
  }
  return gitter.map((z) => z.map((an) => (an ? "X" : ".")).join(""));
}

/* ---- Beine als Schwingung ----------------------------------------- */
function beinMaske(w, h, theta, b) {
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(new Array(w).fill("."));
  for (let i = 0; i < b.x.length; i++) {
    const ph = theta + b.phase[i];
    const bx = b.x[i] + Math.round(Math.sin(ph) * 1.0);
    const hoch = Math.cos(ph) > 0.45 ? 1 : 0;
    for (let y = b.von; y < b.bis - hoch; y++) for (let dx = 0; dx < 2; dx++)
      if (bx + dx >= 0 && bx + dx < w && y < h) rows[y][bx + dx] = "X";
  }
  return rows.map((z) => z.join(""));
}

/* ===================================================================== */

/**
 * @param {object} o
 * @param {object} o.silhouette  Das Tier. Siehe test/beispiel/katze.js.
 * @param {function} o.css       Wirtsfunktion: CSS-Variable → Farbe.
 * @param {object} [o.fenster]   Braucht nur devicePixelRatio.
 */
export function erzeugeBild(o) {
  const s = o.silhouette;
  const css = o.css;
  const fenster = o.fenster || (typeof globalThis !== "undefined" ? globalThis : {});
  const BREIT = s.raster.breit, HOCH = s.raster.hoch, LINKS = s.raster.links;

  /* ---- Kopf drehen ------------------------------------------------ */
  /* Das Gesicht darf nur auf Fell liegen, nie auf der Kontur — sonst reisst
     beim Drehen der Schädelrand auf. */
  function gesichtStempel(basis, flicken, ox, oy, drin) {
    const b = basis.map((z) => z.split(""));
    const h = b.length, w = b[0].length, p = norm(flicken);
    const g = s.kopf.gesicht;
    for (let y = 0; y < p.length; y++) {
      for (let x = 0; x < p[y].length; x++) {
        if (p[y][x] === ".") continue;
        const Y = oy + y, X = ox + x;
        if (Y < 0 || Y >= h || X < 0 || X >= w) continue;
        /* Unter dem Schädel (aufgerissenes Maul) gilt keine Sperre. */
        if (Y < drin.length && (!drin[Y][X] || X < g.x0 || X > g.x1)) continue;
        b[Y][X] = p[y][x];
      }
    }
    return b.map((z) => z.join(""));
  }

  function bauKopf(ohren, augen, maul, dreh, nick) {
    const K = s.kopf;
    dreh = Math.max(-2, Math.min(2, dreh | 0));
    nick = Math.max(-1, Math.min(1, nick | 0));
    let k = norm(K.form);
    const m = K.maul[maul];
    if (m.length > 2) k = k.concat(leer(k[0].length, m.length - 2));
    k = stempel(k, K.ohren[ohren], Math.round(dreh / 2), 0);
    const drin = innen(k).slice(0, K.form.length);
    if (dreh || nick) k = gesichtStempel(k, K.wisch, K.wischAn[0], K.wischAn[1], drin);
    k = gesichtStempel(k, K.augen[augen], K.augenAn[0] + dreh, K.augenAn[1] + nick, drin);
    k = gesichtStempel(k, m, K.maulAn[0] + Math.round(dreh * 0.5), K.maulAn[1] + nick, drin);
    return k;
  }

  /* ---- Ganze Gestalt ---------------------------------------------- */
  function bauSitz(z) {
    const S = s.sitz;
    const kopf = bauKopf(z.ohren, z.augen, z.maul, z.dreh, z.nick);
    const hx = S.kopfAn[0] + (z.dx | 0), hy = S.kopfAn[1] + (z.dy | 0);
    const m = stempel(leer(S.feld[0], S.feld[1]), S.form, 0, 0);
    const kern = stempel(kontur(stempel(m, maske(kopf), hx, hy)), kopf, hx, hy);
    const unten = z.gelegt
      ? leer(S.feld[0], S.feld[1])
      : kontur(schwanzMaske(S.feld[0], S.feld[1], S.schwanz, z.winkel));
    let bild = stempel(unten, kern, 0, 0);
    if (z.gelegt) bild = stempel(bild, kontur(S.gelegt[(z.zuck | 0) % S.gelegt.length]), 0, 0);
    return bild;
  }

  function bauLauf(z) {
    const L = s.lauf;
    const H = L.form.length, W = norm(L.form)[0].length;
    const kopf = bauKopf("auf", "offen", "zu", z.dreh, 0);
    let m = stempel(leer(W, H), L.form, 0, 0);
    m = stempel(m, beinMaske(W, H, z.theta, L.beine), 0, 0);
    m = stempel(m, maske(kopf), L.kopfAn[0], L.kopfAn[1]);
    const kern = stempel(kontur(m), kopf, L.kopfAn[0], L.kopfAn[1]);
    return stempel(kontur(schwanzMaske(W, H, L.schwanz, z.winkel)), kern, 0, 0);
  }

  /* Vor dem Sprung sammelt er sich: geduckt, und das Hinterteil wackelt. */
  function bauDuck(wa) {
    const L = s.lauf;
    const H = L.form.length, W = norm(L.form)[0].length;
    const kopf = bauKopf("auf", "weit", "zu", 0, 0);
    const tief = leer(W, 2).concat(norm(L.form).slice(0, H - 2));
    let m = stempel(leer(W, H), tief, 0, 0);
    m = stempel(m, beinMaske(W, H, 0, L.beine), 0, 0);
    const hx = L.kopfAn[0] + wa, hy = L.kopfAn[1] + 2;
    m = stempel(m, maske(kopf), hx, hy);
    const kern = stempel(kontur(m), kopf, hx, hy);
    const sw = {ax: L.schwanz.ax, ay: L.schwanz.ay + 2, len: L.schwanz.len,
                curl: L.schwanz.curl, thick: L.schwanz.thick};
    return stempel(kontur(schwanzMaske(W, H, sw, 176 - wa * 6)), kern, 0, 0);
  }

  /* An einer glatten Wand hängen. Für die andere Seite spiegelt der Wirt
     die Leinwand. */
  function bauKante(phase, winkel, augen) {
    const K = s.kante;
    let m = norm(K.rumpf);
    const griffe = K.griff[((phase % K.griff.length) + K.griff.length) % K.griff.length];
    for (const oben of griffe) {
      const pfote = [];
      for (let j = 0; j < oben; j++) pfote.push("");
      const z = ".".repeat(K.x - 1);
      pfote.push(z + "XXX"); pfote.push(z + "XXX");
      m = stempel(m, maske(norm(pfote)), 0, 0);
    }
    const kopf = bauKopf("auf", augen || "offen", "zu", 0, -1);   /* Blick nach oben */
    m = stempel(m, maske(kopf), K.kopfAn[0], K.kopfAn[1]);
    const kern = stempel(kontur(m), kopf, K.kopfAn[0], K.kopfAn[1]);
    return stempel(kontur(schwanzMaske(K.w, K.h, K.schwanz, winkel)), kern, 0, 0);
  }

  /* Gebaute Bilder merken — sonst rechnet der Browser jedes Bild neu. */
  let lager = {}, lagerZahl = 0;
  function gemerkt(schluessel, bauen) {
    if (!(schluessel in lager)) {
      if (lagerZahl > 700) { lager = {}; lagerZahl = 0; }
      lager[schluessel] = bauen();
      lagerZahl++;
    }
    return lager[schluessel];
  }

  /* Wo der Kopf gerade sitzt — bild() rechnet es aus, zeichne() hängt den
     Schmuck daran. */
  let hals = null;

  function bild(zu, t) {
    const p = s.posen[zu.pose] || s.posen.sit;
    const spiel = zu.spiel || 0;
    hals = null;
    const schwung = Math.max(0, Math.min(1, zu.schwung || 0));
    if (p.art === "nichts") return null;
    if (p.art === "luft") return norm(s.luft);
    if (p.art === "duck") {
      const wa = zu.wackel || 0;
      return gemerkt("d|" + wa, () => bauDuck(wa));
    }
    if (p.art === "kante") {
      /* Er blinzelt auch an der Wand — Klettern dauert gemessen gut vier
         Sekunden, das war die längste Bewegung mit dem starrsten Bild. */
      const kp = ((zu.kante || 0) % 6 + 6) % 6;
      const kw = 255 + Math.sin(t * 2.2) * 22;
      const kb = t % (4.6 - schwung * 1.4);
      const ka = kb < 0.15 ? "zu" : kb < 0.28 ? "halb" : "offen";
      return gemerkt(["k", kp, Math.round(kw), ka].join("|"), () => bauKante(kp, kw, ka));
    }
    if (p.art === "lauf") {
      const tempo = p.schnell || 1;
      const th = (zu.theta !== undefined && zu.theta !== null) ? zu.theta : t * 7.4 * tempo;
      const wl = 134 + Math.sin(th * 0.5) * 18;
      const dr = Math.round(Math.sin(th * 0.17) * 1.4);
      return gemerkt(["l", Math.round(th * 12), Math.round(wl), dr].join("|"),
        () => bauLauf({theta: th, winkel: wl, dreh: dr}));
    }

    /* Sitzen: atmen, blinzeln, wedeln.
       Zwei Regler zugleich. Die Stufe ist der lange Bogen, der Schwung ist
       der Tag. Beides zieht in dieselbe Richtung: schneller wedeln, öfter
       blinzeln, tiefer atmen, mehr Ohrenzucken. */
    const takt = p.wedeln || ((spiel >= 3 ? 1.7 : spiel >= 2 ? 2.1 : 2.6) - schwung * 0.7);
    const weite = p.weite || (14 + spiel * 5 + schwung * 9);
    const winkel = s.schwanzWinkel[p.schwanz || "hoch"] + Math.sin(t * 2 * Math.PI / takt) * weite;
    const atmung = p.atmung || 1;
    const dy = Math.round((Math.sin(t * 2 * Math.PI / ((p.atmung ? 5 : 3.2) - schwung * 0.8)) * 0.5 + 0.5) * atmung);
    let augen = p.augen || "offen";
    let ohren = p.ohren || "auf";
    if (augen === "offen" || augen === "weit") {
      const ph = t % ((spiel >= 2 ? 4.2 : 5.4) - schwung * 1.4);
      if (ph < 0.10) augen = "halb";
      else if (ph < 0.22) augen = "zu";
      else if (ph < 0.32) augen = "halb";
    }
    if (ohren === "auf" && (t + 1.7) % (7.5 - schwung * 3) < 0.16) ohren = "zucken";
    /* Der liegende Schwanz kennt kein Wedeln — er zuckt nur ab und zu. */
    let zuck = 0;
    if (p.gelegt) {
      const zp = (t + 0.9) % (5.2 - schwung * 2.2 - spiel * 0.3);
      zuck = zp < 0.34 ? 1 : zp < 0.60 ? 2 : 0;
    }
    const dreh = p.dreh !== undefined ? p.dreh : (zu.blick | 0);
    hals = {dy: dy, dreh: dreh};
    return gemerkt(["z", ohren, augen, p.gelegt ? 1 : 0, Math.round(winkel), dreh, dy, zuck].join("|"),
      () => bauSitz({ohren, augen, maul: "zu", gelegt: p.gelegt,
                     winkel, dreh, nick: 0, dy, zuck}));
  }

  /* ---- Farben ----------------------------------------------------- */
  /* Sie kommen aus den CSS-Variablen des Wirts, nicht aus dieser Datei.
     Welche Variable welchem Zeichen entspricht, sagt die Silhouette. */
  let farben = null;
  function farbenLesen() {
    farben = {};
    for (const k in s.farben) farben[k] = css(s.farben[k]);
  }
  function farbenNeu() { farben = null; }

  /* ---- Zeichnen ---------------------------------------------------- */
  function malen(ctx, sp, ox, oy, px) {
    for (let y = 0; y < sp.length; y++) {
      const zeile = sp[y];
      for (let x = 0; x < zeile.length; x++) {
        const c = farben[zeile[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect((ox + x) * px, (oy + y) * px, px, px);
      }
    }
  }

  /* Zum Streicheln: nur die gemalten Pixel zählen als Treffer, nicht das
     Rechteck drumherum — sonst blockiert der Begleiter, was darunter liegt. */
  let zuletzt = null;
  function treffer(leinwand, cx, cy) {
    if (!zuletzt) return false;
    const r = leinwand.getBoundingClientRect();
    /* Die Pixelgröße aus dem gemessenen Rechteck, nicht aus dem, womit
       gezeichnet wurde: der Begleiter wächst mit der Stufe, und dann sitzt
       eine scale() darauf. */
    const ps = r.width / BREIT;
    const gx = Math.floor((cx - r.left) / ps);
    const gy = Math.floor((cy - r.top) / ps);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const y = gy - zuletzt.oy + dy, x = gx - zuletzt.ox + dx;
      if (y >= 0 && y < zuletzt.sp.length && x >= 0 && x < zuletzt.sp[y].length
          && zuletzt.sp[y][x] !== ".") return true;
    }
    return false;
  }

  function zeichne(leinwand, zu, t) {
    if (!farben) farbenLesen();
    const px = zu.pixel || 3;
    const pp = s.posen[zu.pose] || s.posen.sit;
    const hoch = pp.art === "kante" ? s.kante.h : HOCH;
    const dpr = Math.min(fenster.devicePixelRatio || 1, 2);
    if (leinwand.width !== BREIT * px * dpr || leinwand.height !== hoch * px * dpr) {
      leinwand.width = BREIT * px * dpr;
      leinwand.height = hoch * px * dpr;
      leinwand.style.width = BREIT * px + "px";
      leinwand.style.height = hoch * px + "px";
    }
    const ctx = leinwand.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BREIT * px, hoch * px);

    const sp = bild(zu, t);
    if (!sp) { zuletzt = null; return; }
    const oy = hoch - sp.length;
    zuletzt = {sp: sp, ox: LINKS, oy: oy, px: px};
    malen(ctx, sp, LINKS, oy, px);

    /* Und darüber, was das Tier sonst noch trägt. Der Kern weiß nicht, was
       das ist — er malt, was die Silhouette zurückgibt. Alles davon hängt am
       Kopf, muss also mitgehen, wenn der beim Atmen sinkt. */
    if (!s.aufsatz) return;
    const auf = s.aufsatz({
      art: pp.art, pose: zu.pose, stufe: zu.spiel | 0, schleife: !!zu.schleife,
      zzz: !!pp.zzz, kopf: hals || {dy: 0, dreh: 0}, oy: oy, t: t
    }) || [];
    for (const a of auf) malen(ctx, norm(a.form), LINKS + a.x, a.y, px);
  }

  return {zeichne, treffer, farbenNeu, breite: BREIT, hoehe: HOCH};
}

export default erzeugeBild;
