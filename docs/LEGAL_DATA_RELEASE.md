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

## 2. Dateninventar

### Konto

- E-Mail-Adresse
- Auth-Identifikator
- Anzeigename
- Wochenziel

### Training

- Session-Zeitpunkt
- Trainingsmodus
- Scores/Kennzahlen
- optionales Transkript nur nach Opt-in
- Trainingsplan

### Lokal standardmäßig

- Audio-Object-URL nur für die aktuelle Audio-Ergebnissitzung
- Baseline-Transkript
- Training-Lab-CV-/Erfahrungstext
- Stellenanzeigentext
- Präsentationsnotizen

### Nicht dauerhaft speichern

- Audio-Blobs
- Wort-Zeitmarken der Präzisionstranskription
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

## 4. Datenschutzseiten

Die öffentliche App benötigt leicht erreichbare, echte Seiten/Links für die erforderlichen Anbieter- und Datenschutzinformationen.

Keine generischen KI-Texte ungeprüft veröffentlichen. Ein finales Dokument muss zu den tatsächlich verwendeten Diensten, Datenflüssen und Betreiberdaten passen.

## 5. Training Lab

### Baseline

- lokal gespeichert
- Nutzer muss erkennen können, dass daraus Startwerte entstehen
- Löschung muss mit lokalen Daten möglich sein

### Bewerbung

- CV-/Erfahrungstext und Stellenanzeige werden im aktuellen v1-Training-Lab nicht automatisch in Supabase gespeichert
- keine Eignungsprognose
- kein Bewerberranking
- keine Emotionserkennung
- keine geschützten Eigenschaften ableiten

### Präsentation

- Notizen werden im aktuellen v1-Training-Lab nicht automatisch in die Cloud geschrieben
- Q&A ist Trainingshilfe, keine Faktenprüfung

## 6. Präzisionstranskription

Vor Aktivierung muss klar erkennbar sein:

- standardmäßig aus
- nur für die aktuelle Aufnahme aktiv
- Audio wird für die Verarbeitung übertragen
- SpeechCoach speichert den Audioblob nicht im normalen Verlauf
- Wort-Zeitmarken werden nicht dauerhaft gespeichert

## 7. Betroffenenrechte / Nutzeraktionen

Real testen:

- Datenexport
- lokales Löschen
- Cloud-Verlauf löschen
- Konto löschen
- erneute Anmeldung nach Löschung schlägt erwartungsgemäß fehl
- gelöschte Daten erscheinen nicht durch Sync erneut

## 8. Aufbewahrung

Für jede dauerhaft gespeicherte Datenklasse eine klare Regel definieren.

Empfehlung für v1:

- lokale Historie: technisch begrenzte Anzahl Sessions wie im Produkt implementiert
- Cloud-Historie: nutzergeführt, bis Nutzer löscht; vor Release prüfen, ob zusätzlich automatische Retention benötigt wird
- technische Logs: so kurz wie betrieblich erforderlich und ohne Gesprächsinhalte
- Request-IDs: nur technische Diagnose

## 9. Analytics

Für v1 bevorzugt datensparsam starten.

Wenn Analytics ergänzt wird:

- keine Transkripte/CV/Notizen als Event-Properties
- keine Audioinhalte
- keine freien Texte
- nur Produktmetriken wie Screen, Feature-Nutzung, Erfolg/Fehlerklasse
- Consent-/Rechtsgrundlagenfrage vor Einbau klären

## 10. KI-Grenzen

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

## 11. Release-Abnahme

Vor Production schriftlich abhaken:

- echte Betreiberinformationen vorhanden
- Datenschutzseite final
- externe Anbieter korrekt aufgeführt
- Datenflüsse entsprechen dem Code
- Opt-ins entsprechen dem UI
- keine versteckte Speicherung im Training Lab
- Löschung funktioniert
- Export funktioniert
- keine Secrets im Client
- keine Platzhaltertexte öffentlich
