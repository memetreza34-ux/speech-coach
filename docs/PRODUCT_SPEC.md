# SpeechCoach Product Specification

Dieses Dokument beschreibt die Produktanforderungen für v1 und v1.1. Es ergänzt `docs/MASTER_ROADMAP.md`.

## Zielgruppe v1

- Azubis
- Schüler
- Studenten
- Berufseinsteiger
- Bewerber
- Berufstätige
- Menschen, die sicherer frei sprechen oder präsentieren wollen

## Kern-Jobs-to-be-done

1. „Ich möchte spontan klarer sprechen.“
2. „Ich möchte mich auf ein Bewerbungsgespräch vorbereiten.“
3. „Ich möchte eine Präsentation üben.“
4. „Ich möchte schwierige Gespräche simulieren.“
5. „Ich möchte wissen, wo meine größten Kommunikationsschwächen liegen.“
6. „Ich möchte einen konkreten Trainingsplan statt allgemeiner Tipps.“

## Feature: Baseline

### Nutzerziel

In höchstens zwei Minuten verstehen, wo der erste Trainingsfokus liegt.

### v1

- 60-Sekunden-Aufgabe
- Browser-Spracherkennung
- Tempo
- Füllwortkontrolle
- Klarheit
- Struktur
- Wirkung
- zwei schwächste Bereiche
- account-getrenntes lokales Startprofil
- Rohtranskript wird nach der Auswertung nicht dauerhaft gespeichert
- Baseline kann separat exportiert und gelöscht werden
- Fortschritt nutzt Baseline nur als Fallback, bis echte Messwerte vorhanden sind

### Akzeptanz

- keine Mikrofonfreigabe → kontrollierter Fehler
- Browser ohne Speech Recognition → kontrollierter Unsupported-State
- vorzeitiges Stoppen möglich
- Unmount stoppt Spracherkennung
- Baseline darf Streak/Trainingsanzahl nicht künstlich erhöhen
- echte Sessions haben Vorrang vor Baseline
- Kontowechsel darf keine Baseline eines anderen Kontos sichtbar machen
- anonyme Baseline darf beim ersten Login kontrolliert vom ersten Konto übernommen werden
- gespeichertes Baseline-Objekt enthält kein Rohtranskript und keine detaillierte Inhaltsanalyse

## Feature: Inhaltsanalyse 2.0

### Nutzerziel

Nicht nur Tempo/Füllwörter sehen, sondern erkennen, ob die Antwort sprachlich präzise und nachvollziehbar aufgebaut ist.

### v1 Metriken

- Präzision
- Hedging/Abschwächungen
- wiederholte Wortgruppen
- Strukturmarker
- Beispiele/Konkretisierung
- nächster Schritt/Call-to-Action
- Conciseness-Indikator

### Grenzen

- keine Faktenprüfung
- keine Wahrheitsbewertung
- keine Persönlichkeitsbewertung
- keine Emotionserkennung
- rhetorische Wiederholung kann sinnvoll sein; deshalb nur Hinweis, kein hartes Urteil

## Feature: Bewerbung personalisieren

### Nutzerziel

Aus eigenen Erfahrungen und einer echten Stellenanzeige relevante Fragen erhalten und diese direkt trainieren.

### v1

- Text/Paste für CV/Erfahrung
- Text/Paste für Stellenanzeige
- kleine Textdateien lokal einlesen
- Schlüsselbegriffe lokal ableiten
- sechs personalisierte Fragen
- gemeinsame und fehlende Schlüsselbegriffe sichtbar machen
- personalisierte Probe mit bis zu fünf Fragen
- Texteingabe und Browser-Spracheingabe in der Probe
- TTS für die aktuelle Frage
- Coach-Feedback und Scores für Klarheit, Struktur und Wirkung
- KI-Modus mit bestehendem Coach-Endpunkt plus lokaler Fallback
- Abschlussauswertung der personalisierten Probe
- Ergebnis wird als Dialogtraining in den normalen Fortschritt übernommen

### Datenschutz

- CV und Stellenanzeige bleiben im Training Lab lokal
- sie werden nicht automatisch in Local-History, Supabase oder Cloud-Sessions geschrieben
- beim bewussten Start der personalisierten Probe werden nur die lokal erzeugte Frage und die Nutzerantwort an die bestehende Coach-Auswertung gesendet
- keine automatische Übertragung des Roh-CV oder der vollständigen Stellenanzeige an OpenAI

### v1.1

- PDF/DOCX sicher extrahieren
- STAR-spezifische Scorecard
- gespeicherte Bewerbungsvorlagen optional
- stärkerer Vergleich zwischen Stellenanforderung und trainierter Antwort ohne Eignungsranking

### Nicht bauen

- Eignungsprozent
- Bewerberranking
- automatische Hiring-Entscheidung

## Feature: Präsentations-Q&A

### Nutzerziel

Vor einer Präsentation die wahrscheinlich schwierigsten Rückfragen trainieren.

### v1

- Notizen/Pitch einfügen
- Kernthemen lokal ableiten
- fünf kritische Fragen
- fünf Punkte Vorab-Checkliste
- personalisierte Q&A-Probe mit Sprache/Text/TTS
- Coach-Feedback und Klarheit-/Struktur-/Wirkungs-Scores
- Ergebnis wird als Dialogtraining gespeichert
- vollständige Präsentationsnotizen werden nicht automatisch an die Coach-API übertragen

### v1.1

- PDF/PPTX-Import
- Folienstruktur
- Q&A pro Folie
- Abdeckung der Folien-Kernaussagen
- Übergangsfeedback

## Feature: 5-Minuten-Drills

### Nutzerziel

Auch mit wenig Zeit eine konkrete Kommunikationstechnik üben.

### Pflichtdrills v1

- Aussage + Begründung + Beispiel
- Füllwort-Stopp
- STAR kompakt
- ohne Fachsprache erklären
- 60-Sekunden-Pitch
- Einwand behandeln

## Feature: Frag deinen Coach

### Status

P1 nach v1-Stabilisierung.

### Zielbild

Nach einer Analyse kann der Nutzer Rückfragen stellen:

- Warum war meine Struktur niedrig?
- Formuliere meine Antwort besser.
- Gib mir ein Gegenbeispiel.
- Welche Stelle soll ich zuerst verbessern?

### Sicherheitsregel

Der Coach darf nur auf vorhandene Sessiondaten und explizit bereitgestellte Inhalte Bezug nehmen und keine neuen persönlichen Tatsachen erfinden.

## Feature: Langzeittrends

### Status

P1.

### Zielbild

- 30 Tage
- 90 Tage
- persönlicher Bestwert
- Trend je Fähigkeit
- Baseline vs. 4-Wochen-Wiederholung
- Trainingskonsistenz

Keine übertriebene Interpretation kleiner Score-Schwankungen.

## Feature: Video

### Status

P2.

### Erlaubte technische Indikatoren

- Kamera-Framing
- Blick zur Kamera als grober technischer Indikator
- sichtbare Bewegung
- Beleuchtung/Position

### Nicht zulässig als Produktziel

- Emotionserkennung
- Nervositätsdiagnose
- Persönlichkeitsanalyse
- Eignungsbewertung aus Gesicht/Körpersprache

## Feature-Freeze v1

Nach Abschluss der P0-Gates werden keine weiteren großen Features vor v1 hinzugefügt. Neue Wünsche gehen in v1.1 oder später.

v1 muss vor allem stabil, verständlich, schnell und vertrauenswürdig sein.