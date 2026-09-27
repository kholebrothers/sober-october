/* =====================================================================
   Der Gremlin — die Figur des Begleiters (Schicht 3)

   Die Katze der Vier-Wochen-Kur, umgebaut: dieselbe Mechanik aus kur-core
   (public/begleiter/, unverändert kopiert), eine andere Silhouette. Ein
   Klon bekommt ein anderes Tier, ohne `bild.js` anzufassen — das hier ist
   die Silhouette, gemacht nach test/beispiel/katze.js.

   Was den Gremlin von der Katze unterscheidet:

   - **Fledermausohren**, weit nach außen, die Spitzen über den Kopf hinaus.
   - **Leuchtende Augen** (eigener Ton E) und ein **Grinsen mit Zähnchen**
     (Ton W) statt des Katzenmauls.
   - Ein dünner, stark gekrümmter Schwanz.
   - Statt Halsband ein **Schopf**, ab Stufe 1; ab Stufe 2 glühen die Wangen.

   Farbnamen: --gremlin-o (Kontur), --gremlin-k (Schattenkontur),
   --gremlin-s (Mittelton), --gremlin-f (Haut), --gremlin-e (Augen),
   --gremlin-w (Zähne), --gremlin-b (Wangen, Schleife), --gremlin-c /
   --gremlin-c2 (Schopf). Sie stehen in app.css.
   ===================================================================== */

/* ---- Kopf ------------------------------------------------------- */
const KOPF = ["D.........D", "DgD.....DgD", ".DgDDDDDgD.", "DmgggggggD.", "KmgDgggggDD", "KggDggDggDD", "KggggDgDggD", "KgggggggggD"];
const OHREN = {
  auf:      ["D.........D", "DgD.....DgD", ".DgDDDDDgD."],
  zucken:   [".D........D", "DgD....DggD", ".DgDDDDDgD."],
  gespitzt: ["D.........D", "DDgD...DgDD", ".DgDDDDDgD."],
  angelegt: ["...........", "DD.......DD", "DgDDDDDDDgD"],
  haengend: ["...........", "...........", "DDgDDDDDgDD"]
};
/* Große Augen, die leuchten. Drei Zeilen, die dritte ist die Nase. */
const AUGEN = {
  offen:   ["gEEgEEg", "gEDgEDg", "gggDggg"],
  weit:    ["EEEgEEE", "EDEgEDE", "gggDggg"],
  halb:    ["ggggggg", "gEDgEDg", "gggDggg"],
  zu:      ["ggggggg", "DDggDDg", "gggDggg"],
  schlitz: ["ggggggg", "gDDgDDg", "gggDggg"],
  boese:   ["DEggEDg", "gEDgEDg", "gggDggg"],
  traurig: ["gEDgEDg", "DggggDg", "gggDggg"]
};
/* Das Grinsen. Offen zeigt es Zähnchen; gähnen und fauchen hängen eine
   Zeile unter den Kopf, wie bei der Katze. */
const MAUL = {
  zu:     ["DgggD", ".DDD."],
  offen:  ["DWDWD", ".DDD."],
  gaehn:  ["DWWWD", "DKKKD", ".DDD."],
  fauch:  ["DWDWD", "DKKKD", ".DDD."]
};
const WISCH = ["ggggggg", "ggggggg", "ggggggg", "ggggggg", "ggggggg"];

/* ---- Rumpf, sitzend --------------------------------------------- */
/* Schmaler als die Katze, ein kleiner Bauch, dünne Arme. */
const SITZ = ["..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "........XXXXXXX...", ".......XXXXXXXXX..", "......XXXXXXXXXX..", ".....XXXXXXXXXXX..", "....XXXXXXXXXXXX..", "....XXXXXXXXXXXX..", "....XXXXXXXXXXXX..", "....XXXXXXXXXXXX..", "...XXXXXXXXXXXXXX.", "...XX..XXXXX..XXX."];

const LEER14 = [];
for (let i = 0; i < 14; i++) LEER14.push("....................");
const SCHWANZ_GELEGT = [
  LEER14.concat(["................XX..", "...............X..X.", "....XXXXXXXXXXX..X..", "....XXXXXXXXXX......"]),
  LEER14.concat(["..................X.", "................XXX.", ".....XXXXXXXXXXXX...", ".....XXXXXXXXXX....."]),
  LEER14.concat(["...............XX...", "..............X..X..", "...XXXXXXXXXXX..X...", "...XXXXXXXXXXX......"])
];

/* ---- Rumpf, stehend --------------------------------------------- */
const RUMPF = ["......................", "......................", "......................", "......................", "......................", "......................", "......................", "......................", "......................", ".....XXXXXXXX.........", "....XXXXXXXXXX........", "...XXXXXXXXXXXX.......", "...XXXXXXXXXXXX.......", "...XXXXXXXXXXXX.......", "....XXXXXXXXXX........", "......................", "......................", "......................", "......................"];

/* Im Sprung, fertig gefärbt: Ohren nach hinten, Augen weit, Grinsen. */
const LUFT = ["......................", "......................", "......................", "..........D.........D.", "..........DgD.....DgD.", "..........KDgDDDDDgD..", ".........KmgggggggD...", ".........KmgEEgEEgDD..", ".........KggEDgEDgDD..", "....KDDDDKggggDgggD...", "KKKDgggggKgDWDWDgg....", "..KmgggmmmgggmmKD.....", "...KmmmKKKmmmKD.......", "....KKD...KKD.........", "......................", "......................", "......................", "......................", "......................"];

/* ---- An der Wand ------------------------------------------------- */
const KANTE = {
  w: 16, h: 25, x: 12, kopfAn: [2, 0],
  rumpf: ["................", "................", "................", "................", "................", "................", "................", "................", ".....XXXXXX.....", ".....XXXXXX.....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", "....XXXXXXXX....", ".....XXXXXX.....", ".....XXXXXX.....", ".....XX..XX.....", "................", "................", "................", "................"],
  griff: [[9, 17], [9, 16], [10, 15], [11, 15], [11, 16], [10, 17]],
  schwanz: {ax: 6, ay: 20, len: 9, curl: -12, thick: 1.0}
};

/* ---- Schmuck ----------------------------------------------------- */
const ZZZ = ["DDD", "..D", ".D.", "D..", "DDD"];
const SCHLEIFE = ["B.B", ".B.", "B.B"];
/* Der Schopf zwischen den Ohren, drei Zotteln; ab Stufe 3 eine vierte. */
const SCHOPF = ["C.C.C", "cCcCc"];
const SCHOPF_VOLL = ["C.C.C.C", "cCcCcCc"];

function aufsatz(lage) {
  const auf = [];
  const oy = lage.oy, k = lage.kopf;
  if (lage.art === "sitz") {
    if (lage.stufe >= 1) auf.push(lage.stufe >= 3 ? {form: SCHOPF_VOLL, x: 8, y: oy + 1 + k.dy} : {form: SCHOPF, x: 9, y: oy + 1 + k.dy});
    if (lage.schleife)   auf.push({form: SCHLEIFE, x: 5, y: oy + 1 + k.dy});
    if (lage.stufe >= 2) auf.push({form: ["B.....B"], x: 7, y: oy + 7 + k.dy});
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
/* Dasselbe Vokabular wie bei der Katze. Beim Gremlin heißt `purr`
   zufriedenes Knurren, `knead` Hände reiben, `tailplay` die Jagd nach dem
   eigenen Schwanz — und er grinst dabei. */
const POSEN = {
  sit:        {art: "sitz"},
  roll:       {art: "sitz", augen: "schlitz"},
  belly:      {art: "sitz", augen: "schlitz", schwanz: "tief"},
  purr:       {art: "sitz", augen: "schlitz"},
  knead:      {art: "sitz", augen: "boese"},
  loaf:       {art: "sitz", augen: "halb", gelegt: true, atmung: 2},
  sleep:      {art: "sitz", augen: "zu", ohren: "haengend", gelegt: true, zzz: true, atmung: 3},
  tailplay:   {art: "sitz", augen: "weit", ohren: "gespitzt", wedeln: 1.1, weite: 40},
  pounce:     {art: "luft"},
  hop:        {art: "luft"},
  walk:       {art: "lauf"},
  chase:      {art: "lauf", schnell: 2.6},
  luft:       {art: "luft"},
  duck:       {art: "duck"},
  kante:      {art: "kante"},
  abgang:     {art: "lauf"},
  "peek-l":   {art: "sitz", dreh: -2},
  "peek-r":   {art: "sitz", dreh: 2}
};

export const GREMLIN = {
  name: "Gremlin",
  raster: {breit: 24, hoch: 19, links: 1},
  farben: {D: "--gremlin-o", m: "--gremlin-s", g: "--gremlin-f", K: "--gremlin-k", E: "--gremlin-e", W: "--gremlin-w",
           B: "--gremlin-b", C: "--gremlin-c", c: "--gremlin-c2"},
  kopf: {
    form: KOPF, ohren: OHREN, augen: AUGEN, maul: MAUL, wisch: WISCH,
    gesicht: {x0: 1, x1: 8},
    wischAn: [2, 3], augenAn: [2, 4], maulAn: [3, 6]
  },
  sitz: {
    feld: [22, 19], form: SITZ, kopfAn: [6, 0],
    schwanz: {ax: 5, ay: 14, len: 12, curl: -7, thick: 1.1},
    gelegt: SCHWANZ_GELEGT
  },
  lauf: {
    form: RUMPF, kopfAn: [9, 3],
    schwanz: {ax: 4, ay: 11, len: 11, curl: -7, thick: 1.0},
    beine: {x: [4, 7, 10, 13], phase: [0, Math.PI, Math.PI / 2, Math.PI * 1.5],
            von: 15, bis: 18}
  },
  luft: LUFT,
  kante: KANTE,
  schwanzWinkel: {steil: 96, hoch: 112, schraeg: 138, halb: 165, tief: 195},
  posen: POSEN,
  aufsatz: aufsatz
};

export default GREMLIN;
