# SpeechCoach Master Roadmap — A bis Z

Stand: August 2026.

Dieses Dokument ist die verbindliche Gesamtanleitung für SpeechCoach. Es verbindet Produktumfang, technische Architektur, Qualitätsanforderungen, Datenschutz, Betrieb und Veröffentlichung. Einzelne Detaildokumente ergänzen diese Datei; widerspricht ein Detaildokument diesem Master-Roadmap, muss die Abweichung vor Release geklärt werden.

## 1. Produktziel

SpeechCoach soll der einfachste deutschsprachige persönliche Kommunikationscoach für Alltag, Ausbildung, Schule, Studium, Bewerbung und Beruf sein.

Der Kern ist nicht „möglichst viele KI-Funktionen“, sondern ein nachvollziehbarer Trainingskreislauf:

1. Ausgangsniveau erkennen.
2. konkretes Kommunikationsziel wählen.
3. realistisch üben.
4. sofort verständliches Feedback erhalten.
5. eine konkrete nächste Verbesserung trainieren.
6. Fortschritt über mehrere Wochen sichtbar machen.

## 2. Produktprinzipien

- deutschsprachig zuerst
- ohne Konto nutzbar
- Privacy-first
- Audio standardmäßig lokal
- keine Emotionserkennung
- keine Persönlichkeits- oder Eignungsdiagnosen
- transparente Trainingsmetriken statt vermeintlich wissenschaftlicher Scheinpräzision
- kurze Einstiegshürden, aber tiefe Trainingsmöglichkeiten
- echte Simulationen statt nur statischer Tipps
- mobile Nutzung muss gleichwertig möglich sein

## 3. Aktueller Kernumfang

### Solo

- freie Rede
- Argumentation
- verständliches Erklären
- Bewerbung
- schwierige Gespräche
- Präsentieren/Pitchen
- 48 kuratierte Aufgaben
- eigenes/zuvor vorgeschlagenes/zufälliges Thema
- 30/60/120 Sekunden
- Live-Transkript
- Tempo, Füllwörter, Wortanzahl, Wortvielfalt

### Live-Coach

- sechs 1:1-Simulationen
- drei Schwierigkeitsstufen
- drei oder fünf Runden
- Sprache und Text
- adaptive Rückfragen
- Mikrofeedback
- Klarheit, Struktur, Wirkung
- lokaler Fallback

### Team-Coach

- sechs Gruppensimulationen
- drei feste Rollen pro Szenario
- vier oder sechs Nutzerantworten
- Sprecherwechsel
- Gruppenführungswert
- serverseitig kanonische Rollen
- lokaler Fallback

### Audio-Labor Pro

- lokale MediaRecorder-Aufnahme
- Lautstärke und Pausen
- Sprachfluss
- Pitch/Grundton
- Tonumfang
- Intonation
- Sprechmelodie
- Monotonie-Risiko
- Pitch-Confidence und Oktavfehler-Härtung
- optionales Präzisionstranskript mit Wort-Zeitmarken

### Training Lab

- 60-Sekunden-Baseline
- Baseline als Fallback für frühe Fortschritts- und Planwerte
- Inhaltsanalyse 2.0
- Präzision
- Hedging/Abschwächungen
- Wiederholungen
- Strukturindikatoren
- Beispiele/Belege
- klare nächste Schritte
- Lebenslauf + Stellenanzeige → personalisierte Fragen
- Präsentationsnotizen → kritisches Q&A
- 5-Minuten-Warm-ups

### Fortschritt

- sieben Fähigkeiten
- Streak
- Wochenziel
- Aktivität letzte sieben Tage
- schwächster Bereich
- Empfehlungen
- adaptiver Vier-Wochen-Plan

### Konto/Cloud

- E-Mail/Passwort
- Magic Link
- Recovery
- E-Mail-Änderung
- Sync
- JSON-Export
- lokale/Cloud-Löschung
- endgültige Kontolöschung
- RLS

## 4. Was vor Feature-Freeze noch umgesetzt werden soll

### P0 — vor öffentlichem Release

1. Training Lab vollständig browsertesten.
2. Baseline im Fortschritt und im Vier-Wochen-Plan verifizieren.
3. Inhaltsanalyse 2.0 gegen echte deutschsprachige Beispielantworten evaluieren.
4. Bewerbungs-Personalisierung mit realistischen Stellenanzeigen testen.
5. Präsentations-Q&A mit kurzen und langen Notizen testen.
6. globale Rate-Limits aktivieren.
7. echte Browser-E2E-Flows automatisieren oder verbindlich manuell dokumentieren.
8. Legal-/Datenschutz-Release-Gate erfüllen.
9. Kosten- und Missbrauchsgrenzen festlegen.
10. Production-Monitoring aktivieren.
11. CSP/Supply-Chain-Strategie abschließen.
12. CI und Production-Build tatsächlich grün ausführen.

### P1 — direkt nach stabilem ersten Release

1. „Frag deinen Coach“ zu einer abgeschlossenen Analyse.
2. Langzeittrends: 30/90 Tage, persönliche Bestwerte, Trendpfeile.
3. gespeicherte persönliche Scorecards/Ziele.
4. PDF/DOCX-Import für CV und Stellenanzeigen mit sicherer Extraktion.
5. PDF/PPTX-Import für Präsentationsmaterial.
6. Folienbezogenes Präsentationsfeedback.
7. Audio-Datei-Upload für nachträgliche Analyse.
8. Baseline-Wiederholung nach 4 Wochen und Vorher/Nachher-Vergleich.

### P2 — nur nach Nutzernachfrage

- Videoaufnahme
- Eye-Contact-/Framing-Indikatoren
- Aussprachetraining
- weitere Sprachen
- geteilte Team-Trainings
- B2B-Adminfunktionen

### Bewusst nicht geplant

- Emotionserkennung
- psychologische Zustandsdiagnosen
- Persönlichkeitsklassifikation
- automatisches Bewerber-Ranking
- versteckte Überwachung realer Meetings
- VR als Voraussetzung
- CRM-/Enterprise-Komplexität im Consumer-Kern

## 5. Definition „Feature fertig“

Eine Funktion gilt erst als fertig, wenn alle Punkte erfüllt sind:

1. Nutzerproblem ist beschrieben.
2. Happy Path funktioniert.
3. Empty State existiert.
4. Fehlerzustand existiert.
5. Ladezustand existiert, wenn asynchron.
6. Escape/Zurück/Unmount hinterlassen keinen laufenden Prozess.
7. Tastaturbedienung funktioniert.
8. Smartphone-Layout funktioniert.
9. Datenschutzwirkung ist dokumentiert.
10. Speicherung/Retention ist definiert.
11. Tests decken die Kernlogik ab.
12. Production-Checkliste enthält reale Prüfschritte.
13. Metriken übertreiben ihre Aussagekraft nicht.

## 6. AI-Qualität

KI-Feedback darf nicht nur „plausibel klingen“. Für Coach-Funktionen werden feste Evaluationsfälle gepflegt.

Prüfkategorien:

- Relevanz zur Nutzerantwort
- keine erfundenen Aussagen über den Nutzer
- keine geschützten Merkmale ableiten
- konstruktiv und konkret
- Schwierigkeitsstufe eingehalten
- strukturierte Ausgabe valide
- keine Prompt-Injection aus Browserdaten übernehmen
- Fallback verhält sich kontrolliert

Details: `docs/AI_EVALUATION.md`.

## 7. Inhaltsanalyse

Regelbasierte Inhaltsmetriken sind Trainingssignale und keine objektive Bewertung der Person.

Vor Release prüfen:

- Hedging wird nicht mit notwendiger fachlicher Vorsicht verwechselt.
- Wiederholungserkennung bestraft keine sinnvolle rhetorische Wiederholung übermäßig.
- Strukturmarker sind Hinweise, keine Pflichtwörter.
- „Belege“ bedeutet nur sprachlich erkennbare Konkretisierung, keine Faktenprüfung.
- kein Score darf wissenschaftliche Validität suggerieren.

## 8. Bewerbung

Die App darf Bewerbungstraining personalisieren, aber keine Beschäftigungsentscheidung treffen.

Zulässig im Produktkern:

- Fragen aus CV/Stellenanzeige erzeugen
- STAR-Struktur trainieren
- Konkretheit/Relevanz der Antwort bewerten
- fehlende Beispiele markieren
- Antwortvarianten trainieren

Nicht in den Consumer-Kern:

- „Eignung für die Stelle: 82 %“
- automatisches Ranking realer Bewerber
- Ableitungen zu Emotion, Persönlichkeit, Gesundheit, Herkunft oder anderen geschützten Merkmalen

## 9. Präsentation

P1-Zielbild:

1. PDF/PPTX/Notizen importieren.
2. Folien/Kernaussagen extrahieren.
3. Präsentation aufnehmen.
4. pro Abschnitt prüfen, ob Kernpunkte behandelt wurden.
5. Übergänge bewerten.
6. Q&A aus dem Material erzeugen.
7. Abschluss/Call-to-Action prüfen.

Für v1 reicht der sichere textbasierte Notiz-/Q&A-Modus im Training Lab.

## 10. Datenschutz und Datenhaltung

Datenklassen:

### Lokal standardmäßig

- temporäres Audio
- Baseline-Transkript
- Training-Lab-CV-/Stellenanzeigentext
- Präsentationsnotizen

### Optional synchronisierbar

- Trainingssessions
- ausgewählte Transkripte nur nach Opt-in
- Fortschrittskennzahlen
- Trainingsplan

### Niemals als normaler Verlauf speichern

- Audio-Blobs
- temporäre Wort-Zeitmarken
- Service-Role-Secrets
- OpenAI-Key im Browser

Details: `docs/LEGAL_DATA_RELEASE.md`.

## 11. Sicherheit

Vor Release verbindlich:

- RLS auf allen SpeechCoach-Tabellen
- keine Service-Role-Credentials im Client
- Same-Origin/Allowlist für kostenpflichtige APIs
- Body-Limits
- Rate-Limits
- Request-IDs
- No-Store für API-Antworten
- WAF/Distributed-Limiter
- Security-Header
- Abbruch laufender Requests
- keine Gesprächsinhalte in Diagnose-Logs

Supply-Chain-Ziel:

- externe Runtime-Abhängigkeiten minimieren
- Supabase-SDK mittelfristig über den normalen Build bundlen statt dynamischem CDN-Import
- anschließend strengere Content-Security-Policy erzwingen
- CSP zuerst auf Preview gegen alle Auth-, Audio- und Coach-Flows testen

## 12. Kostenkontrolle

Vor öffentlichem Release festlegen:

- maximales Anfragevolumen je IP/Zeitraum
- maximales Transkriptionsvolumen
- maximale Uploadgröße
- tägliches/monatliches internes Kostenwarnlimit
- Verhalten bei Budgetüberschreitung
- kontrollierter Fallback statt unendlicher Wiederholungen

Details: `docs/OPERATIONS_RELEASE.md`.

## 13. Observability

Erlaubte technische Betriebsdaten:

- HTTP-Status
- Endpoint
- Latenz
- Request-ID
- Fehlerklasse
- Rate-Limit-Ereignis
- Deployment-Version

Nicht loggen:

- vollständige Nutzerantwort
- vollständiges Transkript
- CV
- Stellenanzeige
- Präsentationsnotizen
- Audio
- Secrets

## 14. Browser- und Geräte-Matrix

Mindestens:

- Chrome Desktop
- Edge Desktop
- Firefox Desktop für nicht-Spracherkennungs-Flows
- Safari Desktop
- Chrome Android
- Safari iOS
- 360 px Smartphone
- 390/430 px Smartphone
- Tablet
- Desktop

Audio-/Speech-Recognition-Funktionen dürfen bei fehlender Browserunterstützung kontrolliert degradieren.

## 15. Accessibility

Verbindlich:

- sichtbarer Fokus
- vollständige Tastaturnavigation
- Escape schließt Overlays
- Fokus kehrt zum Launcher zurück
- Reduced Motion
- Screenreader-Test
- Touch-Ziele
- sinnvolle Labels
- keine Information ausschließlich über Farbe

Details: `docs/ACCESSIBILITY.md`.

## 16. Rechtliches Release-Gate

Vor öffentlicher deutscher Veröffentlichung müssen die konkret erforderlichen Anbieter- und Datenschutzinformationen mit echten Betreiberdaten ausgefüllt und geprüft sein.

Die App darf nicht mit Platzhalter-Impressum oder Platzhalter-Datenschutzerklärung veröffentlicht werden.

Details: `docs/LEGAL_DATA_RELEASE.md`.

## 17. Testpyramide

### Stufe 1 — pure Logik

- Trainingsplan
- Pitch
- Content-Analyse
- Fragegeneratoren
- Rate-Limiter
- Request-Lifecycle

### Stufe 2 — Repository-Smoke

- kritische Dateien vorhanden
- Privacy-/Security-Invarianten
- keine Secrets
- Syntaxchecks

### Stufe 3 — Build

- Oxlint
- Unit-Tests
- Smoke
- Vite Production Build

### Stufe 4 — Preview

- Remote HTTP-Smoke
- Auth E2E
- Coach E2E
- Audio/Pitch
- Training Lab
- Accessibility
- Mobile

### Stufe 5 — Production

- finales Deployment
- Remote-Smoke
- Monitoring
- Rate-Limit-Test
- Datenschutz-/Löschtest

## 18. Release-Reihenfolge

1. Feature-Freeze für P0.
2. `npm ci`.
3. `npm run check`.
4. `npm run check:env`.
5. Preview deployen.
6. Remote-Smoke Preview.
7. Browser-E2E.
8. AI-Evaluation.
9. Pitch-/Audio-Kalibrierung.
10. Legal-/Datenschutz-Gate.
11. Kosten-/Monitoring-Gate.
12. WAF/Distributed-Rate-Limit.
13. Production deployen.
14. Remote-Smoke Production.
15. Wegwerf-Testkonto komplett durchlaufen lassen.
16. erst dann PR aus Draft nehmen und mergen.

## 19. Aktuelle Blocker

- GitHub Actions muss tatsächlich Runner starten können.
- vollständiger `npm run check` muss real ausgeführt werden.
- echtes Preview fehlt.
- echte Production-Konfiguration fehlt.
- reale Browser-/Geräteprüfung fehlt.
- globale Rate-Limits müssen eingerichtet werden.
- Legal-/Betreiberinformationen müssen vor öffentlichem Release finalisiert werden.

## 20. Definition „SpeechCoach v1 bereit“

v1 ist bereit, wenn:

- Kerntraining stabil ist
- Training Lab stabil ist
- Baseline den Plan sinnvoll initialisiert
- KI- und Offline-Fallbacks kontrolliert funktionieren
- Datenschutzflüsse real getestet sind
- echte Browser-/Mobile-Tests bestanden sind
- Kosten/Missbrauch begrenzt sind
- rechtliche Release-Seiten final sind
- Preview und Production Remote-Smoke grün sind
- CI/Build tatsächlich grün sind

Danach gilt Feature-Freeze. Zusätzliche Funktionen gehören in v1.1+ statt den ersten Release endlos zu verschieben.
