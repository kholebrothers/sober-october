/* =====================================================================
   Was der Gremlin sagt — Belegung von sober-october

   Nach Clinton Callahan, SPARK 099 (Possibility Management, CC BY-SA 4.0):
   „Wenn du deinen Gremlin nicht bewusst fütterst, frisst er dich." Der
   Gremlin — König oder Königin deiner Unterwelt — lebt von niedrigem Drama:
   Lästern, Klagen, Adrenalin, Schuld, Selbstvorwurf, Heimlichkeit. Er ist
   weder gut noch böse, er lässt sich nicht ändern und nicht verbannen.
   Man baut eine bewusste Beziehung zu ihm auf: ihn erkennen, ihn erleben,
   seinen Hunger spüren, ihn nach Plan füttern (an seinem Tag, mit Futter,
   das du wählst), ihn arbeiten lassen — danken, „Sitz!".

   Darum sagt er ehrlich, was er will, und macht die Falle sichtbar. Er
   beschämt nie. Mit der Beziehung (c.bez, 1–5) ändert sich sein Ton: erst
   frech und hungrig, zuletzt ein Verbündeter, der trotzdem Gremlin bleibt.

   Dieselben Töpfe wie bei Katze und Schwein (kur-core), dazu eigene:
   `drang`, `geschehen`, `werkzeug`, `sitz` (Drang außerhalb seines Tags,
   ab Stufe 4) und `fuetterung` (sein Tag ist heute).

   `ab` ist der Tag, ab dem ein Satz auftauchen darf; `wenn` bekommt den
   Tageskontext. Platzhalter: {st} Tage am Stück, {tag} Tag, {name},
   {best} bester Lauf, {v} (bleibt leer).

   Die Sätze sind ein Entwurf zum Gegenlesen.
   ===================================================================== */

const morgen = (c) => c.p === "morgen";
const ab = (n) => (c) => c.bez >= n;
const bis = (n) => (c) => c.bez <= n;
const abend = (c) => c.p === "abend";

export const GREMLINSAETZE = {
  /* Der Tag hat noch nichts. Er hofft darauf, dass es so bleibt — und sagt es. */
  leer: [
    {ab: 1, t: "Noch nichts los. Wenn du den Tag vergisst, wär das mein Lieblingsplan.{v}"},
    {ab: 1, t: "Guten Morgen. Ich bin der Teil von dir, der auf Drama hofft. Heute kriege ich keins, oder?{v}", wenn: morgen},
    {ab: 1, t: "Abend. Die Stunde, in der ich Ideen habe. Sag lieber schnell, wie der Tag war.{v}", wenn: abend},
    {ab: 2, t: "Gestern war Pause. Ich hab mich gut gefüttert gefühlt. Heute wieder du?{v}", wenn: (c) => c.gesternLeer},
    {ab: 3, t: "{st} Tage am Stück. Ich werde langsam dünn.{v}", wenn: (c) => c.st >= 2},
    {ab: 1, t: "Ich bin nicht dein Feind. Ich bin nur hungrig. Wenn du mich nicht fütterst, fress ich dich.{v}", wenn: bis(3)},
    {ab: 1, t: "Heute ist Fütterungstag. Du weißt, was ich mag. Du entscheidest, was ich kriege.{v}", wenn: (c) => c.fuetterungstag},
    {ab: 1, t: "Ich sitz. Ich warte auf meinen Tag. Du hast versprochen, dass er kommt.{v}", wenn: (c) => c.bez >= 4 && !c.fuetterungstag},
    {ab: 8, t: "Weißt du, was ich am liebsten esse? Ausreden. Hast du heute welche?{v}"},
    {ab: 13, t: "Dein bester Lauf waren {best} Tage. Ich erinnere mich ungern daran.{v}", wenn: (c) => c.best >= 5}
  ],

  /* Der Tag zählt. Er knurrt — und sucht sich einen besseren Job. */
  satt: [
    {ab: 1, t: "Tag gezählt. Kein Futter für mich. Na gut."},
    {ab: 1, t: "Du warst da. Ich knurr ein bisschen, aber ich hab's gesehen."},
    {ab: 3, t: "Dann zerleg ich eben die alte Gewohnheit. Das ist auch Drama. Nur das bessere."},
    {ab: 5, t: "{st} Tage. Ich hab mir einen neuen Job gesucht: aufpassen, dass du dranbleibst.", wenn: (c) => c.st >= 3},
    {ab: 1, t: "Ich arbeite jetzt für dich. Sag's keinem.", wenn: ab(5)},
    {ab: 1, t: "Gib mir was zum Zerlegen. Eine Ausrede, eine alte Regel. Ich bin schnell.", wenn: ab(5)},
    {ab: 21, t: "Drei Wochen. Ich bin kaum wiederzuerkennen. Du auch nicht."}
  ],

  erst: [
    {ab: 1, t: "Zack. Tag gezählt. Ich hatte andere Pläne."},
    {ab: 1, t: "Das war's schon? Gut. Ich meine: schade."},
    {ab: 4, t: "Schon wieder. {st} Tage. Du machst mich fertig.", wenn: (c) => c.st >= 2}
  ],
  mehr: [
    {ab: 1, t: "Noch mehr? Du nimmst mir die ganze Arbeit weg."},
    {ab: 1, t: "Oha."}
  ],
  neu: [
    {ab: 1, t: "Was Neues? Das kenn ich nicht. Ich hasse das. (Ich mag es.)"}
  ],
  zurueck: [
    {ab: 1, t: "Wieder da. Ich hab gewartet. Ich warte immer."}
  ],

  /* Der Drang ist da. Er nennt ihn beim Namen: das bin ich, nicht du. */
  drang: [
    {ab: 1, t: "Ah, der Drang. Den hab ich bestellt. Du musst ihn nicht abholen."},
    {ab: 1, t: "Ich hab Hunger. Hungrig sein ist erlaubt. Es geht auch vorbei."},
    {ab: 1, t: "Merk dir: Das bin ich, nicht du."},
    {ab: 2, t: "Wir könnten jetzt ein Werkzeug nehmen. Ich hasse Werkzeuge."},
    {ab: 5, t: "Ich steig und ich fall. Zähl mit, wenn du willst."}
  ],

  /* Geschehen. Jetzt hofft er auf Selbstvorwurf — und sagt es laut. */
  geschehen: [
    {ab: 1, t: "Notiert. Jetzt noch ein bisschen Selbstvorwurf? Nein? Schade — das wär mein Lieblingsessen."},
    {ab: 1, t: "Ist passiert. Mach kein Drama draus. Das würde nur mich füttern."},
    {ab: 1, t: "Ein Ereignis, kein Urteil. Ich hätte gern ein Urteil gehabt."},
    {ab: 3, t: "Morgen ist wieder ein Tag. Das ärgert mich jedes Mal."}
  ],

  /* Ein Werkzeug hat gewirkt. Er verliert — und bekommt eine Aufgabe. */
  werkzeug: [
    {ab: 1, t: "Na toll. Ein Werkzeug. Jetzt hab ich nichts zu tun."},
    {ab: 1, t: "Gut. Gib mir die alte Gewohnheit, ich zerleg sie."},
    {ab: 2, t: "Ich hab verloren. Diesmal."}
  ],

  /* Drang außerhalb seines Tags, wenn er schon nach Plan gefüttert wird. */
  sitz: [
    {ab: 1, t: "Ich hab Hunger. Aber heute ist nicht mein Tag. Sitz. Ich weiß."},
    {ab: 1, t: "Du sagst Sitz, ich sitz. Ich weiß, dass mein Tag kommt."},
    {ab: 1, t: "Gut, dass du's merkst. Ich wär sonst einfach losgegangen."}
  ],

  /* Sein Tag ist heute: bewusst füttern. */
  fuetterung: [
    {ab: 1, t: "Endlich. Mein Tag. Was gibt's?"},
    {ab: 1, t: "Nicht hungrig heute? Auch gut. Dann nächste Woche. Nicht vorher."},
    {ab: 1, t: "Danke. Das war genug. Ich weiß, das sag ich nie."}
  ],

  /* Dämonen zum Frühstück (nach Ilan Stephani): der Dämon war schon da. */
  daemon: [
    {ab: 1, t: "Du hast deinen Dämon zum Frühstück gegessen. Mir bleibt nur der Krümel."},
    {ab: 1, t: "Geschüttelt, gebrüllt, gegessen. Was soll ich heute noch aufregen?"},
    {ab: 1, t: "Der Trigger kommt später. Aber er kennt dich jetzt schon.", wenn: (c) => c.bez >= 3}
  ],

  /* Streicheln: knurren, wälzen, dem Schwanz nach, wegflitzen. */
  schnurr: [
    {ab: 1, t: "Knurr. Hinterm Ohr. Ja."},
    {ab: 1, t: "Du streichelst deinen Gremlin. Das ist gar nicht so dumm."},
    {ab: 3, t: "Wer mich streichelt, statt mich zu füttern, ist schlau."}
  ],
  roll: [
    {ab: 1, t: "Ich wälz mich im Unsinn. Nur kurz."},
    {ab: 1, t: "Bauch. Aber nicht weitersagen."}
  ],
  jagd: [
    {ab: 1, t: "Mein Schwanz! Gleich hab ich ihn!"},
    {ab: 2, t: "So fühlt sich Drama an: im Kreis."}
  ],
  weg: [
    {ab: 1, t: "Hihi."},
    {ab: 1, t: "Fang mich doch."}
  ],

  /* Nachts ist er am stärksten. Er sagt es, und schickt dich ins Bett. */
  nacht: [
    {ab: 1, t: "Es ist spät. Nachts bin ich am stärksten. Geh lieber schlafen."},
    {ab: 1, t: "Was hält dich wach? Ich hoffe: nicht ich."},
    {ab: 2, t: "Ehrlich: Ist das gerade gut für dich?", wenn: (c) => c.tiefe > 0.4},
    {ab: 3, t: "Schlaf ist das Beste, was du mir antun kannst."}
  ],
  versteck: [
    {ab: 1, t: "Da bin ich wieder."},
    {ab: 2, t: "Ich war nie weg. Ich bin nie weg."}
  ],
  schleife: [
    {ab: 1, t: "Eine Schleife. Für mich. Ich werde weich. Unerhört."}
  ],
  bund: [
    {ab: 1, t: "Fünfundzwanzigmal gestreichelt. Wir sind jetzt Verbündete."}
  ]
};

export default GREMLINSAETZE;
