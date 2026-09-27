/* =====================================================================
   Die frei lebende Katze — Stufe 4 und 5 der Gremlin-Beziehung

   Die Katze aus kur-core (test/beispiel/katze.js, Stand f9e139a), mit einer
   Änderung: die Augen leuchten gelb wie die des Gremlins (Ton E). Der
   Gremlin ändert sich nicht (SPARK 099) — die Beziehung schon. Wer ihn
   nach Plan füttert und ihn arbeiten lässt, hat am Ende eine frei lebende
   Katze an der Seite, die noch immer ein Gremlin ist.

   Stufe 4 trägt die Farben des Gremlins und seinen Schopf, Stufe 5 die
   warmen Farben der Katze (--katze-*, in app.css).
   ===================================================================== */

/* ---- Kopf ------------------------------------------------------- */
const KOPF = ["..D....D...", ".DgD..DgD..", ".DggDDmggD.", "DmgggggggD.", "KmgDgggggDD", "KggDggDggDD", "KggggDgDggD", "KgggggggggD"];
const OHREN = {
  auf:      ["..D....D...", ".DgD..DgD..", ".DggDDmggD."],
  zucken:   ["..D.....D..", ".DgD..DggD.", ".DggDDmggD."],
  gespitzt: [".D.....D...", "DDgD..DgDD.", ".DggDDmggD."],
  angelegt: ["...........", "...DDDDD...", ".DDgggggDD."],
  haengend: ["...........", "DDD...DDD..", "DggDDmggDD."]
};
const AUGEN = {
  offen:   ["gEggEgg", "gDggDgg", "gggDgDg"],
  weit:    ["gEggEgg", "gEggEgg", "gggDgDg"],
  halb:    ["ggggggg", "gEggEgg", "gggDgDg"],
  zu:      ["ggggggg", "DDggDDg", "gggDgDg"],
  schlitz: ["ggggggg", "gDDgDDg", "gggDgDg"],
  boese:   ["DggggDg", "gDggDgg", "gggDgDg"],
  traurig: ["gEggEgg", "DggggDg", "gggDgDg"]
};
const MAUL = {
  zu:     ["gDgDg", "ggggg"],
  offen:  ["gDgDg", "gDDDg"],
  gaehn:  ["gDgDg", "DKKKD", ".DDD."],
  fauch:  ["gDgDg", "DKDKD", ".DDD."]
};
/* Das Gesicht darf nur auf Fell liegen, nie auf der Kontur — sonst reisst
   beim Drehen der Schaedelrand auf. Und weil Augen selbst Kontur-Zeichen
   sind, muss das alte Gesicht erst weggewischt werden. */
const WISCH = ["ggggggg", "ggggggg", "ggggggg", "ggggggg", "ggggggg"];

/* ---- Rumpf, sitzend --------------------------------------------- */
const SITZ = ["..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", ".......XXXXXXXXX..", "......XXXXXXXXXX..", ".....XXXXXXXXXXX..", "....XXXXXXXXXXXX..", "...XXXXXXXXXXXXX..", "..XXXXXXXXXXXXXX..", "..XXXXXXXXXXXXXX..", "..XXXXXXXXXXXXXX..", "..XXXXXXXXXXXXXXXX", "..XXXXXXXXXXXXXXXX"];

/* Der liegende Schwanz, drei Fassungen. Vorher gab es nur eine, und weil
   "gelegt" auch den gewedelten Schwanz abschaltet, war loaf die einzige
   Ruhepose ohne jede Bewegung — gemessen drei verschiedene Einzelbilder in
   zwoelf Sekunden, gegen 21 bei roll und purr. Jetzt zuckt die Spitze. */
const LEER14 = ["....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "...................."];
const SCHWANZ_GELEGT = [
  LEER14.concat(["..................XX", "................XXXX", "....XXXXXXXXXXXXXXXX", "....XXXXXXXXXXXXXX.."]),
  LEER14.concat(["..................XX", "....XXX.........XXXX", ".......XXXXXXXXXXXXX", ".......XXXXXXXXXXX.."]),
  LEER14.concat(["..................XX", "................XXXX", "...XXXXXXXXXXXXXXXXX", "...XXXXXXXXXXXXXXX.."])
];

/* ---- Rumpf, stehend --------------------------------------------- */
const RUMPF = ["......................", "......................", "......................", "......................", "......................", "......................", "......................", "......................", "......................", "....XXXXXXXXX.........", "...XXXXXXXXXXX........", "...XXXXXXXXXXXXX......", "..XXXXXXXXXXXXXX......", "..XXXXXXXXXXXXXX......", "...XXXXXXXXXXXX.......", "......................", "......................", "......................", "......................"];

/* Im Sprung. Ein fertiges Bild, keine Silhouette — hier ist nichts zu rechnen. */
const LUFT = ["......................", "......................", "......................", "...........D....D.....", "..........DgD..Dg.....", "..........DggDDmg.....", ".........Dmgggggg.....", ".........KmgDgggg.....", ".........KggDggDg.....", "....KDDDDKggggDgD.....", "KKKDgggggKggggggg.....", "..KmgggmmmgggmmKD.....", "...KmmmKKKmmmKD.......", "....KKD...KKD.........", "......................", "......................", "......................", "......................", "......................"];

/* ---- An der Wand ------------------------------------------------- */
/* Seitenansicht, die Pfoten greifen abwechselnd darueber, der Schwanz
   haengt weg. Fuer die andere Wandseite spiegelt der Wirt die Leinwand. */
const KANTE = {
  w: 16, h: 25, x: 12, kopfAn: [2, 0],
  rumpf: ["................", "................", "................", "................", "................", "................", "................", "................", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", ".....XXXXXX.....", ".....XXXXX......", "................", "................", "................", "................"],
  /* Sechs Griffe, nicht vier: die alte Reihe hatte [10,16] zweimal drin und
     lieferte darum nur drei verschiedene Bilder. */
  griff: [[9, 17], [9, 16], [10, 15], [11, 15], [11, 16], [10, 17]],
  schwanz: {ax: 6, ay: 20, len: 7, curl: 7, thick: 1.5}
};

/* ---- Schmuck ----------------------------------------------------- */
const ZZZ = ["DDD", "..D", ".D.", "D..", "DDD"];
const SCHLEIFE = ["B.B", ".B.", "B.B"];     /* nach zehn Streicheleinheiten */

/* Das Halsband war einmal ein Strich: sieben Pixel in einer Zeile, immer an
   derselben Stelle. Damit lag es quer ueber der Kinnzeile, und wenn die Katze
   beim Atmen den Kopf senkte, verschwand die Bewegung darunter.
   Jetzt liegt es um einen runden Hals: die Kehle haengt tiefer als die Enden,
   und dieser tiefste Punkt wandert mit dem Blick. Linker Rand und Kehle stehen
   im Schatten (Ton c) — dieselbe Regel wie beim Fell, dunkler nach links und
   unten.
   Sieben breit, nicht neun: die Halszeile ist x7..15, und ihre beiden
   Randpixel sind Kontur. Wer die ueberpinselt, schneidet die Silhouette durch. */
function halsband(dreh, anhaenger) {
  const kehle = 3 + (dreh > 1 ? 1 : dreh < -1 ? -1 : 0);
  const rows = [[], [], []];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 7; x++) rows[y].push(".");
  for (let x = 0; x < 7; x++) {
    const tief = x === kehle;
    rows[tief ? 1 : 0][x] = (tief || x === 0) ? "c" : "C";
  }
  if (anhaenger) rows[2][kehle] = "C";
  return rows.map((z) => z.join(""));
}

/* Alles, was über dem Körper liegt. Der Kern malt nur, was hier
   herauskommt — er weiß nichts von Halsband, Wangen oder Schnarchblasen.
   `kopf` ist, wo der Kopf gerade sitzt: die Kur lässt die Katze beim Atmen
   nicken, und Schmuck, der das nicht mitmacht, malt die Bewegung zu. */
function aufsatz(lage) {
  const auf = [];
  const oy = lage.oy, k = lage.kopf;
  if (lage.art === "sitz") {
    if (lage.stufe >= 1) auf.push({form: halsband(k.dreh, lage.stufe >= 3), x: 8, y: oy + 8 + k.dy});
    if (lage.schleife)   auf.push({form: SCHLEIFE, x: 6, y: oy + 1 + k.dy});
    if (lage.stufe >= 2) auf.push({form: ["B..B"], x: 8, y: oy + 7 + k.dy});
  }
  if (lage.zzz) {
    for (let i = 0; i < 2; i++) {
      const ph = (lage.t * 0.35 + i * 0.5) % 1;
      if (ph < 0.06) continue;
      auf.push({form: ZZZ, x: 18 + Math.round(ph * 2), y: Math.round(3 - ph * 3)});
    }
  }
  return auf;
}

/* ---- Posen ------------------------------------------------------- */
/* Welche Art gezeichnet wird und wie sie sich dabei verhält. Die Namen sind
   Vokabular des Kerns — der Begleiter setzt sie, hier steht nur, was sie für
   dieses Tier bedeuten. */
const POSEN = {
  sit:        {art: "sitz"},
  roll:       {art: "sitz", augen: "schlitz"},
  belly:      {art: "sitz", augen: "schlitz", schwanz: "tief"},
  purr:       {art: "sitz", augen: "schlitz"},
  knead:      {art: "sitz", augen: "schlitz"},
  loaf:       {art: "sitz", augen: "schlitz", gelegt: true, atmung: 2},
  sleep:      {art: "sitz", augen: "zu", ohren: "haengend", gelegt: true, zzz: true, atmung: 3},
  tailplay:   {art: "sitz", augen: "weit", ohren: "gespitzt", wedeln: 0.9, weite: 34},
  pounce:     {art: "luft"},
  hop:        {art: "luft"},
  walk:       {art: "lauf"},
  chase:      {art: "lauf", schnell: 2.4},   /* wedeln gilt nur beim Sitzen */
  luft:       {art: "luft"},
  duck:       {art: "duck"},
  kante:      {art: "kante"},
  abgang:     {art: "lauf"},                 /* unterwegs nach draussen */
  "peek-l":   {art: "sitz", dreh: -2},
  "peek-r":   {art: "sitz", dreh: 2}
};

export const KATZE = {
  name: "Katze",
  /* Rasterfeld der Leinwand. */
  raster: {breit: 24, hoch: 19, links: 1},
  /* Zeichen der Silhouette auf CSS-Variablen des Wirts. Auch das ist
     Belegung: ein anderes Tier bringt seine eigenen Farbnamen mit. */
  farben: {D: "--katze-o", m: "--katze-s", g: "--katze-f", K: "--katze-k", E: "--gremlin-e",
           B: "--gremlin-b", C: "--katze-c", c: "--katze-c2"},
  kopf: {
    form: KOPF, ohren: OHREN, augen: AUGEN, maul: MAUL, wisch: WISCH,
    gesicht: {x0: 1, x1: 8},
    wischAn: [2, 3], augenAn: [2, 4], maulAn: [4, 6]
  },
  sitz: {
    feld: [22, 19], form: SITZ, kopfAn: [6, 0],
    schwanz: {ax: 5, ay: 13, len: 11, curl: -3.5, thick: 2.0},
    gelegt: SCHWANZ_GELEGT
  },
  lauf: {
    form: RUMPF, kopfAn: [9, 3],
    schwanz: {ax: 4, ay: 11, len: 10, curl: -4.0, thick: 1.8},
    beine: {x: [3, 6, 10, 13], phase: [0, Math.PI, Math.PI / 2, Math.PI * 1.5],
            von: 15, bis: 18}
  },
  luft: LUFT,
  kante: KANTE,
  schwanzWinkel: {steil: 100, hoch: 116, schraeg: 140, halb: 165, tief: 191},
  posen: POSEN,
  aufsatz: aufsatz
};
