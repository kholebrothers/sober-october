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
