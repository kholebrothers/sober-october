# Prototyp: die zurückhaltende Oberfläche

**Wegwerf-Code.** Kein Produktivcode, keine Tests, keine Speicherung: der
Zustand lebt im Speicher, Neuladen fängt von vorn an. Gehört nicht nach `main`.

**Die Frage:** Wie fühlt sich eine App an, deren Oberfläche nur das eigene
Commitment zeigt, während alles andere erst freigeschaltet werden muss?

## Starten

    python3 -m http.server 8000        # im Repo-Wurzelverzeichnis
    open http://localhost:8000/prototyp/zurueckhaltend/

- `?variant=A|B|C`, die schwarze Leiste unten oder `←`/`→` wechseln die Variante.
- `?demo=1` füllt vier Tage vor (Kaffee und Kippe gewählt), damit die Ebenen
  sofort zu sehen sind.
- Leiste: `Tag +1` schiebt den simulierten Tag weiter, `Zustand` zeigt den
  ganzen Zustand als JSON, `↺` fängt von vorn an.

## Was drin ist

Gemeinsam für alle Varianten:

- **Commitment wählen:** 1–3 Verzichte, je Verzicht optional „auch die Momente
  notieren, in denen ich gern würde". Freiwillig, jederzeit änderbar.
- **„habe"-Eintrag** → drei Fragen (aus smokefree), alle überspringbar.
- **„würde gern"-Eintrag** → zuerst *gerade jetzt* oder *vorhin*. „Jetzt" wird
  **begleitet**: ein langsam atmender Kreis, eine Uhr und der Satz „Das darf da
  sein.". Erst danach kommen die Fragen. Beim Rauchen heißt es „will rauchen" bzw.
  „wollte rauchen".
- **„heute ohne"** als Beobachtung. Der Kreis bleibt leer, solange nichts bekannt
  ist.
- **Fünf Ebenen**, zwei Arten, an sie zu kommen:
  - *verdient* (sie gehen durch Benutzen auf): Wie ein Drang verläuft
    (Nervensystem) · Was an der Stelle steht (Routinen) · Etwas anderes an die
    Stelle (neue Verhaltensweisen)
  - *gewählt* (man schaltet sie selbst ein): Dein Oktober (Verlauf) ·
    Gemeinsam (Community, mit dem Hero aus kur-core)

  Alle fünf sind Attrappen: die Texte sind Platzhalter im richtigen Ton, nicht
  fachlich geprüft, und die Community-Zahlen sind erfunden.

Die drei Varianten unterscheiden sich darin, **wie sichtbar das Gesperrte ist**:

| | Tag | Gesperrte Ebenen | Gewählte Ebenen |
|---|---|---|---|
| **A Blatt** | Liste, eine Zeile je Verzicht mit offenem Kreis | sichtbar, gefaltet unten, mit ihrer Bedingung | im selben Menü, „einschalten" |
| **B Knopf** | ein Verzicht auf einmal, Zählknopf (`verbrauchen`) + leiser Würde-gern-Knopf | unsichtbar; eine offene Ebene erscheint als Punkt oben | hinter einem einzigen „+" |
| **C Faden** | Satz des Commitments, Verben, darunter ein Faden mit den eigenen Worten | unsichtbar; eine offene Ebene kommt als Eintrag in den Faden | an festen Tagen einmal angeboten |

## Was sich beim Durchklicken gezeigt hat

Das ist ein erster Eindruck aus dem Durchklicken, kein Urteil. Das Urteil gehört
dem Nutzer.

1. **Zurückhaltung trägt.** Mit nur dem Commitment auf dem Schirm fehlt beim
   Eintragen nichts. Der Tag ist in allen drei Varianten in einem Blick erfasst.
2. **„Gerade jetzt / vorhin" ist die richtige Gabelung.** Nur der Drang im
   Moment verlangt nach Begleitung. Ein nachgetragener Drang braucht sie nicht.
   Die Gabelung kostet einen Tipp.
3. **Ein Drang darf nicht aussehen wie Konsum.** Im ersten Stand bekamen beide
   denselben Tonpunkt am Kreis. Das wurde korrigiert: Ein Drang zeichnet den
   Kreis jetzt gestrichelt. Das Datenmodell braucht dafür zwei getrennte Arten,
   keinen „Konsum mit Flag".
4. **Eine Null wirkt wie eine Punktzahl.** Der Zählknopf in B zeigt an einem
   unbekannten Tag groß eine „0". Das widerspricht dem Satz „leerer Kreis heißt
   unbekannt". Der Knopf passt zum Zählen von Konsum, als Startseite ist er
   fraglich.
5. **In A liest sich die sichtbare Bedingung wie eine Aufgabe.** „Öffnet sich, wenn
   du an drei Tagen etwas notiert hast" ist genau die Mindestnutzung, die die
   Plattform ausschließt. B und C verstecken das Gesperrte und umgehen es so.
6. **C bringt Wissen in den Zusammenhang.** Die Spur steht direkt unter dem
   Eintrag, der sie geöffnet hat. Das fühlt sich am wenigsten nach Belohnung an.
   Allerdings werden Chip-Antworten („etwas anderes") dort wie eigene Worte
   zitiert. Die Regel „eigene Worte wörtlich" braucht deshalb die Trennung
   zwischen Freitext und Auswahl.

## Offen, für `/grill-with-docs`

- **Verdient oder gewählt?** Ist „freischalten durch Benutzen" überhaupt mit
  „Bereitschaft genügt" vereinbar, oder ist es verdeckte Gamification? Und wäre
  dann alles *gewählt*, nur zu unterschiedlichen Zeitpunkten *angeboten* (wie in
  C)?
- **Soll man das Gesperrte sehen können** (A) oder nicht (B, C)? Wer von einer
  Ebene nichts weiß, kann sie auch nicht wollen.
- **Bedingungen:** Wenn Freischalten bleibt, woran hängt es? An der Zahl der
  Einträge, an Tagen, an einer bestimmten Handlung wie dem ersten Drang? Oder an
  der Zeit, etwa „ab Woche 2"?
- **Begleitung:** Wie lang, was steht darin, und hat sie ein Ende? Die Welle
  ist eine Attrappe. Die Inhalte (Nervensystem, Drang) brauchen eine Quelle und
  eine Prüfung, damit sie nicht in die medizinische Zweckbestimmung kippen (siehe
  mahlzeit/docs/PLATTFORM.md).
- **Community:** Was genau wird geteilt? Nur „hat heute etwas notiert" wie in
  der Vier-Wochen-Kur, oder auch die Verzichte? Ein Link, kein Login, aber wie
  kommt man in eine Gruppe?
- **Zählen:** Braucht „habe" eine Menge (drei Kaffee, fünf Kippen), oder genügt
  das Ereignis? Daran hängt, ob der Zählknopf überhaupt hineingehört.
- **„Wie viel":** Der Nutzer sagte „jeder wählt selbst, was und wie viel er
  trackt". Der Prototyp kennt nur *welche Verzichte* und *mit oder ohne Drang*.
  Ein Maß wie „weniger statt gar nicht" fehlt, ebenso eine Tracking-Tiefe über
  diese beiden Schalter hinaus.
- **Datenmodell:** Die Ereignisse sind hier schon plattformnah (`art: habe |
  drang | ohne`, Antworten getrennt). Ob sie dem Event-Modell aus PLATTFORM.md
  folgen sollen, ist zu entscheiden.

## Herkunft

Kopiert, nicht importiert (Stand der Nachbar-Repos: kur-core `f9e139a`,
smokefree `90321b8`). In den Nachbar-Repos ist nichts verändert.

| Datei in `geliehen/` | Quelle |
|---|---|
| `datum.js` | `kur-core/domaene/datum.js` (tagNummer, verschiebe) |
| `hero.js`, `hero.css` | `kur-core/anzeige/` (eigene vs. kollektive Tage) |
| `knopf.js`, `knopf.css` | `smokefree/knopf/` (Zählknopf, `verbrauchen`) |

Außerdem, abgeschrieben statt kopiert:

- **Die Fragen zum „habe"-Eintrag** stammen aus `smokefree/modul.js`
  (`FRAGEN_ZIGARETTE`), die dort auf `lifetracker` `RUECK` zurückgehen.
- **Palette, offener Kreis und Microcopy** folgen `mahlzeit/docs/GESTALT.md`,
  über `smokefree/index.html`.
- **Die Haltung** („Ereignis, kein Versagen", „leer heißt unbekannt") folgt
  lifetracker, smokefree und `mahlzeit/docs/PLATTFORM.md`.

Neu in diesem Prototyp: die Fragen zum Drang, die Begleitung und die fünf
Ebenen samt Freischaltregeln.
