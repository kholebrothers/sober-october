# Sober October – UX-Bewertung und Designsprache

Stand: 26. September 2026. Grundlage: Quellcode des main-Standes 1c80b0f und Prüfung der bestehenden Interaktionen. Eine heuristische Bewertung, keine Studie mit Teilnehmenden.

## Bewertung

Die Haltung ist klar: freiwillig beobachten, schnell notieren, Details nach eigenem Bedarf. Die warme Flexoki-Palette, lokale Speicherung und optionalen Bausteine passen dazu. Drei Ansichten dürfen bleiben, brauchen aber dieselbe Bediengrammatik.

| Befund | Auswirkung | Umsetzung |
| --- | --- | --- |
| Einstellungen und Zusatzaktionen nur 30–36 px groß | Auf dem Handy leicht zu verfehlen | Mindestens 44 px für Bedienelemente |
| Tracker-Tabs ohne Pfeiltasten und Panel-Zuordnung | Tastaturbedienung unvollständig | Roving tabindex, Pfeile, Home/End, benanntes Panel |
| Vollständiges Neuzeichnen entfernt den Fokus | Wiederholtes Notieren mit Tastatur wird mühsam | Aktion über stabilen Schlüssel wieder fokussieren |
| „Zurück“ verschwindet nach sieben Sekunden | Bedeutung unklar; Korrektur unter Zeitdruck | „Rückgängig“, bleibt bis zur nächsten Meldung oder zum Schließen |
| Haupttaste sieht auch wie eine reine Anzeige aus | Unklar, ob Antippen etwas notiert | Sichtbarer Handlungshinweis und konkreter zugänglicher Name |
| Dialog heißt immer „Eintrag“ | Einstellungen und Reflexion schlecht unterscheidbar | Dialogname aus sichtbarer Überschrift |
| Verschiedene Schriftgrößen, Radien, Abstände | Ansichten wirken wie einzelne Prototypen | Gemeinsame Hierarchie und Komponentenregeln |
| „würde gern“ bei der Auswahl ohne Erklärung | Verwechslung mit einem Ereignis möglich | Kurze Erklärung und trackerbezogene Beschriftung |

## Gestaltung

**Leitbild: ein ruhiges persönliches Notizbuch.** Farbe beschreibt etwas; sie bewertet niemanden. Kein Rot für Konsum, keine zusätzliche Erfolgslogik.

- Hintergrund: warmes Papier; Oberfläche: leicht aufgehellt. Salbei und Flieder variieren nur den Untergrund. Dunkel bleibt warmbraun.
- Text: Systemschrift für Bedienung und Zahlen, Georgia/Serif für Leitgedanken und Fragen. Keine externen Schriftanfragen. Grundschrift 16 px; Eingaben mindestens 16 px gegen iOS-Zoom.
- Hierarchie: Marke und Datum → Leitgedanke → Tracker → aktueller Eintrag → optionale Vertiefung.
- Abstände: 4, 8, 12, 16, 24, 32 px; 24 px Außenrand, bei kleinen Geräten 16 px. Einspaltig, maximal 480 px inklusive Außenrand.
- Formen: Bedienelemente 12 px Radius, größere Karten und Dialoge 20 px. Runde Formen für Status und kleine Symbolaktionen.
- Aktionen: dunkel gefüllter Button schließt einen Schritt ab; Kontur für Alternativen; Textaktionen für Vertiefung. Auswahl ist durch Form/Markierung und Farbe sichtbar.
- Touch: mindestens 44 × 44 px für Symbolaktionen, mindestens 44 px Höhe für Textaktionen. Sichtbare Fokusmarkierung, reduzierte Bewegung respektieren.
- Meldungen: unten, damit Marke und Navigation frei bleiben. Meldungen mit Handlungen bleiben stehen, reine Bestätigungen verschwinden nach fünf Sekunden.
- Tracker: je eine Kachel im Raster; lange Namen brechen um, statt kleiner zu werden.

## Der Monat im Zentrum (27. September 2026)

Nach der Überarbeitung oben fühlte sich die App noch nicht befriedigend an. Der Grund lag nicht in der
Bedienung, sondern in der Gewichtung:

- Die größte Fläche war „Kaffee getrunken“, und sie füllte sich satt in Tonrot. Die stärkste
  Rückmeldung kam also genau beim Konsum.
- Das Gelingen hatte keine Handlung. „Ein Tag ohne Eintrag ist frei“ ist als Haltung richtig, heißt
  aber auch: Wenn es gut läuft, passiert nichts. „Ich bin da“ und die Kette gab es nur als
  ausgeschalteten Baustein.

Deshalb:

- **Oben steht immer der Monat**: der Oktober als Kalender, eine große Zahl („12 Tage dabei“) und
  der Knopf „Heute bin ich dabei“. Ein Tippen füllt das Feld des Tages (es springt auf und zieht
  einen Ring), die Zahl hüpft, das Telefon vibriert kurz, wo es das kann. An den Stufen 5, 8, 13, 21,
  34 leuchtet der Monat auf und die Meldung sagt einen Satz. Das ist die befriedigende Handlung.
- „Dabei“ behauptet keine Abstinenz. Es heißt: Ich bin im Commitment. Jede Notiz zählt den Tag
  genauso, auch ein Konsum; dann steht der Knopf auf „Heute zählt · durch deine Notiz“.
- Ein zweites Tippen schaltet nicht still zurück. Zurücknehmen geht über „Rückgängig“ in der Meldung.
- **Notieren ist ruhig**: je Tracker eine Kachel in Flächenfarbe mit einem Streifen in der
  Trackerfarbe, die Zahl in Tinte. Kein Tonrot, das sich füllt. Der Zählknopf aus smokefree ist
  entfallen.
- Vergangene Tage ohne Eintrag sind ein leises graues Feld, künftige ein Ring. Kein Rot, kein Kreuz.
- Kurz vor dem Oktober (bis zwei Wochen) stehen die Tage davor als kleinerer Vorlauf im Kalender;
  man kann also schon jetzt anfangen.
- Der Baustein „Lauf und Kette“ heißt jetzt „Lauf“ und ergänzt den Monat um „Tage am Stück“, den
  längsten Lauf und den Satz zum Tag. Die Kette selbst ist im Kalender aufgegangen.

## Farbe heißt Ebene

Eine Farbe steht in dieser App für eine **Ebene** dessen, was festgehalten ist, nicht für eine Person
und nicht für ein Urteil. Der Monat lässt sich durch jede Ebene lesen; die gewählte färbt den
Kalender, und je voller die Farbe, desto mehr steht an dem Tag:

| Ebene | Flexoki | Woher | Voll heißt |
| --- | --- | --- | --- |
| Dabei | Grün | „Heute bin ich dabei“ oder irgendein Eintrag | da gewesen |
| Körper | Blau | Tages-Check-in: Schlaf, Verdauung, Bewegung, Ernährung (Mittel) | eher am oberen Pol (erholsam, ruhig, viel, nährend) |
| Antrieb | Gelb | Tages-Check-in: Stimmung, Antrieb, Motivation, Lust (Mittel) | eher am oberen Pol (leicht, viel) |
| Selbst | Lila | die Selbst-Markierungen aus lifetracker, höchstens zwei | zwei Markierungen |
| Drang | Cyan | „würde gern“ | drei oder mehr Momente |
| Geschehen | Orange | „habe“ | drei oder mehr Ereignisse |

Der Satz „Was hat dich heute getragen?“ hat Magenta als Randfarbe, ist aber keine Ebene des Kalenders:
er steht im Tagebuch. Rot gibt es nicht. Das Tagebuch („Wie war der Tag?“ unter dem Knopf, auch aus der Meldung nach
„dabei“) bleibt auf dem Gerät; es zählt den Tag wie eine Notiz, an die Gruppe geht nur „dabei“.

In der Gruppe („Gemeinsam“) haben Personen deshalb **keine eigene Farbe**: jede Reise ist eine Reihe
in Moos, denn geteilt wird nur die Ebene „dabei“. Keine Rangliste, die Reihenfolge ist die des
Dazukommens, genannt wird nur, wer heute dabei ist.

Offen: Die Tracker tragen noch ihre eigenen Farben (Kaffee Gelb, Kippe Blau, Video Lila, eigene
Magenta). Sie überschneiden sich mit Stimmung, Getragen und Selbst. Sollen Farben streng nur Ebenen
heißen, würden die Tracker neutral und die Kacheln orange (Geschehen) bzw. cyan (Drang).

## Jeden Tag ein Check-in, und eine Zeile Tagebuch

- **Mindestens ein Check-in am Tag:** „Heute bin ich dabei“, oder irgendein Eintrag. Ist gestern leer
  geblieben, steht unter dem Knopf „Gestern nachtragen“ (aus lifetracker, „Noch kurz aufschreiben“).
  Im Tagebuch lässt sich jeder fehlende Tag antippen und nachtragen.
- **Im besten Fall eine qualitative Angabe:** Direkt unter dem Knopf steht eine Zeile „Was hat dich
  heute getragen?“, ohne Dialog, gespeichert beim Verlassen. Stimmung und Selbst stehen einen Tipp
  weiter im Bogen.
- **Dein Tagebuch** (Baustein, von selbst an): jeder Tag eine Zeile, neu nach alt, mit den Punkten
  seiner Ebenen und dem Satz. Auch leere Tage stehen da. Zuerst eine Woche, auf Wunsch alles.

## Die Etappe: Fibonacci als Logik, nicht als Wort

Aus lifetracker: Die Kette zeigt den laufenden Lauf, rastet aber auf der Leiter 5, 8, 13, 21, 34 ein.
Man sieht nie „12 von 31“, sondern die nächste erreichbare Stufe: „3 von 5 Tagen“, dann „6 von 8“.
Ein einzelner leerer Tag bricht sie nicht. Ist eine Etappe voll, leuchtet der Monat auf und die
Meldung sagt einen Satz. Für Neue heißt das einfach **Etappe**; „Fibonacci“ steht nur im Tooltip.

## Die Systeme unter den Symptomen

Kaffee, Kippe und Video sind Oberfläche: Symptom oder Lösungsversuch. Schränkt man sie ein, laufen die
Systeme darunter weiter. Der **Tages-Check-in** (Knopf unter der Satzzeile) fragt sie ab, je System
eine Reihe mit fünf Stufen zwischen zwei Polen, ein Tipp pro Reihe:

- **Körper:** Schlaf (unruhig–erholsam), Verdauung (gestört–ruhig), Bewegung (kaum–viel),
  Ernährung (unstet–nährend)
- **Antrieb:** Stimmung (schwer–leicht), Antrieb, Motivation, Lust (je wenig–viel)

Die Pole sind Beschreibungen, keine Noten. Über den Monat zeigt **Verlauf und Zusammenhänge** jedes
System als Reihe und darunter Drang und Geschehen auf denselben Tagen. Sobald auf beiden Seiten
mindestens drei Tage stehen, sagt ein Satz, was zusammenfällt: „Schlaf und Drang. Eher „unruhig“
(5 Tage): 3 Würde-gern-Momente am Tag. Eher „erholsam“ (9 Tage): 0,6.“ Gezählt, nicht gedeutet.

Offen: welche Linsen die Systeme später ordnen sollen (die Nachricht nannte Solms; der zweite Name
war unklar). Heute ordnen sie sich schlicht in Körper und Antrieb.

## Bewusst offen

Ein fehlender Eintrag beweist keine Abstinenz. Die bestehende Logik bezeichnet solche Tage teils als „frei“, während Kreise auch „unbekannt“ bedeuten. Diese fachliche Bedeutung sollte separat entschieden werden; diese Überarbeitung verändert die Zählung nicht.

Der Lauf sowie automatisch geöffnete Wissensebenen können trotz freundlicher Sprache Leistungsdruck erzeugen. Sie bleiben optional. Ob die drei Ansichten tatsächlich gebraucht werden, sollte mit wenigen realen Nutzerinnen und Nutzern erprobt werden.

Persistente Korrektur bezieht sich auf den jeweils letzten Hinweis; ein allgemeines Bearbeiten alter Einträge ist noch kein Bestandteil. Wissenstexte sind laut Quellcode fachlich ungeprüft und wurden hier nicht überarbeitet.

## Verifikation

- 46 vorhandene Node-Tests bestanden; JavaScript-Syntax und `git diff --check` geprüft.
- Chromium: Auswahl → Start → Eintrag → Rückgängig nach mehr als sieben Sekunden → Drang → Details → Einstellungen.
- Pfeiltasten und Home in Tracker-Tabs, Fokus nach Notieren, Dialogbeschriftung und gespeicherte Farbwahl geprüft.
- Alle drei Ansichten bei 320, 390 und 1280 px ohne horizontalen Seitenüberlauf.
- Screenshots von Einstieg, Knopf, Blatt, Faden, Einstellungen, Details sowie Hell/Dunkel visuell geprüft. Keine JavaScript-Laufzeitfehler.
- Noch keine Prüfung auf realem iPhone, mit VoiceOver oder durch Teilnehmende.
