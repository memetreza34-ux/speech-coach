# SpeechCoach Legal & Data Release Gate

Dieses Dokument ist eine technische/produktbezogene Release-Checkliste und keine individuelle Rechtsberatung. Vor einer öffentlichen Veröffentlichung mit echten Betreiberdaten muss die konkrete rechtliche Ausgestaltung geprüft werden.

## 1. Release-Blocker

Nicht öffentlich veröffentlichen, solange mindestens einer dieser Punkte offen ist:

- Betreiber-/Anbieterinformationen fehlen
- Datenschutzerklärung enthält Platzhalter
- eingesetzte Auftragsverarbeiter sind nicht dokumentiert
- Datenflüsse für Supabase/OpenAI/Hosting sind nicht beschrieben
- Lösch- und Auskunftsprozesse sind nicht real getestet
- Tracking/Analytics ist eingebaut, aber nicht transparent dokumentiert
- Cookie-/Consent-Anforderungen sind ungeklärt
- Training-Lab-Datenfluss in UI und Datenschutzerklärung widerspricht dem tatsächlichen Code

## 2. Dateninventar

### Konto

- E-Mail-Adresse
- Auth-Identifikator
- Anzeigename
- Wochenziel

### Dauerhafte Trainingsdaten

- Session-Zeitpunkt
- Trainingsmodus
- Scores/Kennzahlen
- optionales Transkript nur nach Opt-in
- Trainingsplan
- Ergebnis einer personalisierten Bewerbung-/Präsentationsprobe als Dialog-Kennzahlen

### Nur temporär beziehungsweise lokal während der Nutzung

- Audio-Object-URL nur für die aktuelle Audio-Ergebnissitzung
- Baseline-Rohtranskript nur während der Baseline-Auswertung
- Training-Lab-CV-/Erfahrungstext
- Stellenanzeigentext
- Präsentationsnotizen

### Lokal persistiert

- Baseline nur als abgeleitete Startwerte
- Baseline account-getrennt über den aktiven lokalen Besitzer
- lokale Trainingshistorie
- lokaler Trainingsplan

### Nicht dauerhaft speichern

- Audio-Blobs
- Wort-Zeitmarken der Präzisionstranskription
- Baseline-Rohtranskript
- detaillierte Baseline-Inhaltsanalyse
- CV-/Stellenanzeigentexte aus dem Training Lab ohne ausdrückliche spätere Speicherfunktion
- Präsentationsnotizen aus dem Training Lab ohne ausdrückliche spätere Speicherfunktion

## 3. Datenfluss dokumentieren

Vor Release für jeden externen Dienst festhalten:

- Anbieter
- Zweck
- Datenkategorie
- Region/Übermittlung
- Rechtsgrundlage/Vertragsgrundlage
- Aufbewahrung
- Löschmöglichkeit

Mindestens prüfen:

- Hosting/Vercel
- Supabase
- OpenAI API
- E-Mail-/SMTP-Anbieter
- spätere Analytics-/Monitoring-Anbieter

## 4. OpenAI-/Coach-Datenfluss

Standard-Live-Coach und Team-Coach senden die für die aktive Simulation erforderlichen Gesprächsdaten an den serverseitigen Coach-Endpunkt.

Für die personalisierte Training-Lab-Probe gilt zusätzlich:

1. CV/Erfahrung und Stellenanzeige werden lokal im Browser verarbeitet, um Trainingsfragen zu erzeugen.
2. Präsentationsnotizen werden lokal im Browser verarbeitet, um Q&A-Fragen zu erzeugen.
3. Roh-CV, vollständige Stellenanzeige und vollständige Präsentationsnotizen werden nicht automatisch an den Coach-Endpunkt gesendet.
4. Erst wenn der Nutzer bewusst „Personalisierte Probe starten“ auswählt, werden die lokal erzeugte aktuelle Trainingsfrage und die Nutzerantwort an die bestehende Coach-Auswertung gesendet.
5. Die Coach-Auswertung darf nur kommunikative Merkmale wie Klarheit, Struktur und Wirkung bewerten.
6. Das Ergebnis kann als normale Dialog-Kennzahl im Verlauf gespeichert beziehungsweise bei aktivem Sync synchronisiert werden.

Die öffentliche Datenschutzerklärung muss diesen Unterschied zwischen lokalem Dokument-Parsing und bewusst gestarteter Coach-Verarbeitung nachvollziehbar abbilden.

## 5. Datenschutzseiten

Die öffentliche App benötigt leicht erreichbare, echte Seiten/Links für die erforderlichen Anbieter- und Datenschutzinformationen.

Keine generischen KI-Texte ungeprüft veröffentlichen. Ein finales Dokument muss zu den tatsächlich verwendeten Diensten, Datenflüssen und Betreiberdaten passen.

## 6. Training Lab

### Baseline

- Rohtranskript wird nach der Auswertung nicht dauerhaft gespeichert
- persistiert werden nur abgeleitete Startwerte
- Nutzer muss erkennen können, dass daraus Startwerte entstehen
- Baseline ist auf gemeinsam genutzten Geräten kontogetrennt
- eine anonyme Baseline darf kontrolliert vom ersten angemeldeten Konto übernommen werden
- Baseline kann separat exportiert werden
- Baseline kann separat gelöscht werden
- lokales Löschen des aktiven Kontos muss dessen Baseline entfernen
- Baseline eines anderen Kontos darf davon nicht betroffen sein

### Bewerbung

- CV-/Erfahrungstext und Stellenanzeige werden im v1-Training-Lab nicht automatisch in Supabase gespeichert
- Rohdokumente werden nicht automatisch an OpenAI übertragen
- bei bewusster personalisierter Probe werden nur erzeugte Frage und Nutzerantwort an die Coach-Auswertung gesendet
- Ergebnis der Probe darf nur kommunikative Trainingsscores enthalten
- keine Eignungsprognose
- kein Bewerberranking
- keine automatische Hiring-Entscheidung
- keine Emotionserkennung
- keine geschützten Eigenschaften ableiten

### Präsentation

- Notizen werden im v1-Training-Lab nicht automatisch in die Cloud geschrieben
- vollständige Notizen werden nicht automatisch an OpenAI übertragen
- bei bewusster Q&A-Probe werden nur erzeugte Frage und Nutzerantwort verarbeitet
- Q&A ist Trainingshilfe, keine Faktenprüfung

## 7. Präzisionstranskription

Vor Aktivierung muss klar erkennbar sein:

- standardmäßig aus
- nur für aktuelle Aufnahme aktiv
- Audio wird für die Verarbeitung übertragen
- SpeechCoach speichert den Audioblob nicht im normalen Verlauf
- Wort-Zeitmarken werden nicht dauerhaft gespeichert

## 8. Betroffenenrechte / Nutzeraktionen

Real testen:

- Datenexport
- Baseline-Export
- Baseline-Löschung
- lokales Löschen
- Cloud-Verlauf löschen
- Konto löschen
- erneute Anmeldung nach Kontolöschung schlägt erwartungsgemäß fehl
- gelöschte Daten erscheinen nicht durch Sync erneut
- Kontowechsel zeigt keine Baseline oder Historie eines anderen Nutzers

## 9. Aufbewahrung

Für jede dauerhaft gespeicherte Datenklasse eine klare Regel definieren.

Empfehlung für v1:

- lokale Historie: technisch begrenzte Anzahl Sessions wie im Produkt implementiert
- accountbezogene Baseline: bis Nutzer sie ersetzt, separat löscht oder lokale Kontodaten löscht
- Cloud-Historie: nutzergeführt bis Nutzer löscht; vor Release prüfen, ob zusätzlich automatische Retention benötigt wird
- technische Logs: so kurz wie betrieblich erforderlich und ohne Gesprächsinhalte
- Request-IDs: nur technische Diagnose

## 10. Analytics

Für v1 bevorzugt datensparsam starten.

Wenn Analytics ergänzt wird:

- keine Transkripte/CV/Notizen als Event-Properties
- keine Audioinhalte
- keine freien Antworten
- keine personalisierten Trainingsfragen mit möglichem Dokumentbezug
- nur Produktmetriken wie Screen, Feature-Nutzung, Erfolg/Fehlerklasse
- Consent-/Rechtsgrundlagenfrage vor Einbau klären

## 11. KI-Grenzen

Nicht als Produktversprechen formulieren:

- medizinische Diagnose
- logopädische Diagnose
- psychologische Diagnose
- Emotionserkennung
- Persönlichkeitserkennung
- objektive Eignungsfeststellung

Zulässig als Trainingsindikator:

- Tempo
- Füllwörter
- Pausen
- Pitch-/Intonationsindikatoren
- Strukturmerkmale
- sprachliche Präzision
- sichtbare Beispiele/Belege
- kommunikative Qualität einer Antwort auf eine Bewerbung-/Präsentationsfrage

## 12. Release-Abnahme

Vor Production schriftlich abhaken:

- echte Betreiberinformationen vorhanden
- Datenschutzseite final
- externe Anbieter korrekt aufgeführt
- Datenflüsse entsprechen dem Code
- personalisierte Probe ist als bewusster Datenfluss beschrieben
- Roh-CV/Stellenanzeige/Präsentationsnotizen bleiben ohne explizite spätere Funktion lokal
- Baseline-Rohtranskript wird nicht persistiert
- Opt-ins entsprechen dem UI
- keine versteckte Speicherung im Training Lab
- Löschung funktioniert
- Export funktioniert
- Kontotrennung funktioniert
- keine Secrets im Client
- keine Platzhaltertexte öffentlich