# SpeechCoach Production Checklist

Diese Checkliste ist die Freigabebedingung vor einem Merge nach `main` beziehungsweise vor einem öffentlichen Produktionsrelease.

Übergeordnete Anleitung: `docs/MASTER_ROADMAP.md`. Ergänzend gelten `docs/PRODUCT_SPEC.md`, `docs/AI_EVALUATION.md`, `docs/LEGAL_DATA_RELEASE.md` und `docs/OPERATIONS_RELEASE.md`.

## 1. Automatische Validierung

Lokal oder in GitHub Actions ausführen:

```bash
npm ci
npm run check
```

`npm run check` muss vollständig grün sein und umfasst:

- Oxlint
- Node-Unit-Tests
- Repository-/Privacy-Smoke-Checks
- Vite-Produktionsbuild

Keinen Release freigeben, wenn einer dieser Schritte fehlschlägt.

Zusätzlich enthält `docs/ACCESSIBILITY.md` die verbindliche Keyboard-, Screenreader-, Reduced-Motion- und Mobile-Prüfung. `docs/PITCH_CALIBRATION.md` enthält die reale Kalibrierung der lokalen Tonhöhenanalyse. Automatische Sourcechecks ersetzen diese realen Bedien- und Aufnahmeprüfungen nicht.

## 2. Deployment

- finale HTTPS-Domain festlegen
- `OPENAI_API_KEY` ausschließlich serverseitig konfigurieren
- optional `OPENAI_MODEL` serverseitig setzen
- keine `VITE_OPENAI_API_KEY` anlegen
- `SPEECHCOACH_ALLOWED_ORIGINS` nur setzen, wenn zusätzliche Frontend-Origins absichtlich erlaubt werden sollen
- Vercel muss `vercel.json` übernehmen
- `/api/health` muss HTTP 200 liefern
- `/api/coach`, `/api/team-coach` und `/api/transcribe` dürfen auf GET nicht erfolgreich antworten
- Security-Header im Browser-Netzwerk-Tab prüfen
- statische `/assets/*` müssen langfristig gecacht werden
- `/api/*` darf nicht gecacht werden

### Deployment-Smoke

Vor einer Freigabe müssen beide Remote-Smoke-Stufen erfolgreich sein:

1. Preview-Deployment
2. Production-Deployment

```bash
SPEECHCOACH_TARGET_URL=https://preview.example npm run test:deployment
SPEECHCOACH_TARGET_URL=https://production.example EXPECT_AI_CONFIGURED=true npm run test:deployment
```

Bei geschütztem Vercel-Preview zusätzlich `VERCEL_AUTOMATION_BYPASS_SECRET` verwenden.

### API-Missbrauchsschutz

Die vollständige Betriebsdokumentation liegt unter `docs/API_SECURITY.md` und `docs/OPERATIONS_RELEASE.md`.

Vor öffentlicher Freigabe zusätzlich prüfen:

- gemeinsamer Guard `api/_security.js` ist in Coach, Team-Coach und Transkription aktiv
- fremder Browser-Origin wird mit HTTP 403 abgelehnt
- übergroßer Body wird mit HTTP 413 abgelehnt
- explizit falscher Content-Type wird mit HTTP 415 abgelehnt
- überschrittenes In-Code-Limit liefert HTTP 429 und `Retry-After`
- Fehlerantworten enthalten dieselbe Request-ID wie `X-Request-Id`
- globales WAF-/Distributed-Rate-Limit aktiv
- WAF-Regeln limitieren/deny/challenge tatsächlich und loggen nicht nur
- Serverlogs enthalten keine Gesprächsinhalte, Transkripte, Audiodaten, CVs, Stellenanzeigen, Präsentationsnotizen oder Secrets
- OpenAI-Nutzung/Kosten auf ungewöhnliche Spitzen überwachen

Der In-Code-Limiter arbeitet pro Serverprozess und ersetzt ausdrücklich kein globales WAF-/Distributed-Rate-Limit.

## 3. Supabase Auth

In Supabase Auth die finale Domain als Site URL und Redirect URL konfigurieren.

Mit einem Wegwerf-Testkonto vollständig prüfen:

- Registrierung
- E-Mail-Bestätigung
- Passwort-Login
- Abmeldung
- Magic Link
- Passwort-Reset
- neues Passwort nach Recovery-Link
- E-Mail-Änderung
- erneute Anmeldung nach Browser-Neustart

## 4. Solo-Training

Desktop und Mobilgerät prüfen:

- alle sechs Trainingsbereiche öffnen
- vorgeschlagenes Thema
- Zufallsthema
- eigenes Thema
- 30-, 60- und 120-Sekunden-Modus
- Mikrofon erlauben und ablehnen
- Live-Transkript in unterstütztem Browser
- automatisches Ende
- manuelles Ende
- Analysewerte
- Wiederholung
- Speicherung im Verlauf

## 5. 1:1 Live-Coach

Für mindestens ein Thema jeder Simulation prüfen:

- unterstützend
- realistisch
- herausfordernd
- Texteingabe
- Spracheingabe
- TTS an/aus
- drei Runden
- fünf Runden
- KI-Modus mit echtem Server-Key
- lokaler Fallback ohne KI-Verbindung
- Abschlussauswertung
- Speicherung im Dialogverlauf

Zusätzlich das Evaluationsset aus `docs/AI_EVALUATION.md` durchführen.

## 6. Team-Coach

Alle sechs Gruppensimulationen mindestens einmal starten:

- Team-Meeting
- mündliche Prüfung
- Projekt-Pitch
- Konfliktrunde
- Kundentermin
- Entscheidung unter Zeitdruck

Zusätzlich prüfen:

- drei sichtbare Rollen pro Szenario
- Sprecherwechsel
- vier und sechs Nutzerantworten
- Gruppenführungswert
- KI-Modus
- lokaler Fallback
- Speicherung als Dialogtraining
- Prompt-Injection ersetzt keine kanonische Rolle

## 7. Audio-Labor Pro

Mit verschiedenen Mikrofonen und mindestens zwei unterschiedlichen Stimmen prüfen:

- Aufnahme startet und stoppt zuverlässig
- automatische Zeitbegrenzung
- Originalaufnahme abspielbar
- Lautstärke-Zeitleiste
- Pausenmarker
- Energie
- Stimm-Dynamik
- Sprachfluss
- Pitch-Erkennung
- Grundton
- Tonumfang
- Intonation
- Sprechmelodie
- Monotonie-Risiko
- Klick auf Pitch-Kurve springt an korrekte Audiostelle

### Pitch-Kalibrierung

Die Detailmatrix steht unter `docs/PITCH_CALIBRATION.md`.

Vor Production mindestens prüfen:

- bewusst monotone Aufnahme erzeugt weniger Pitch-Bewegung als expressive Vergleichsaufnahme derselben Person
- kleine Frame-Jitterbewegungen erzeugen keine künstlich hohe Zahl an Richtungswechseln
- einzelne ungefähr 2×-/0,5×-Oktavfehler dominieren Tonumfang oder Melodie nicht
- ruhiger Raum liefert plausibel höheres Messvertrauen als deutlich schlechtere/rauschigere Aufnahme
- geringer und größerer Mikrofonabstand werden verglichen
- Laptop-/Desktop-Mikrofon und Smartphone-Mikrofon werden geprüft
- mindestens eine tiefere und eine höhere Sprechstimme werden geprüft
- bei geringer `analysisConfidence` beeinflussen Pitch-Werte den kombinierten Audio-Score weniger stark
- bei zu wenig stabilen stimmhaften Frames bleibt die übrige lokale Audioanalyse nutzbar
- hörbarer Eindruck und angezeigte Kurve werden manuell miteinander verglichen

### Präzisionstranskription

Mit WebM und – falls vom Zielbrowser erzeugt – MP4/M4A prüfen:

- standardmäßig deaktiviert
- Opt-in gilt nur für aktuelle Aufnahme
- `/api/transcribe` funktioniert mit echtem Server-Key
- Wort-Zeitmarken werden angezeigt
- Klick auf Textgruppe springt an passende Audiostelle
- Fehler der Servertranskription zerstört lokale Analyse nicht
- 429 zeigt kontrollierten Hinweis und Referenz-ID
- >3-MB-Aufnahme wird kontrolliert abgelehnt
- Audiodatei erscheint nicht im Local Storage
- Audiodatei erscheint nicht in Supabase
- Wort-Zeitmarken erscheinen nicht in gespeicherten Sessions

## 8. Training Lab

### Baseline

- Training Lab öffnet aus dem siebten Hauptlauncher
- 60-Sekunden-Aufgabe startet
- Mikrofonfreigabe funktioniert
- verweigerte Freigabe zeigt verständlichen Fehler
- Browser ohne Speech Recognition zeigt kontrollierten Unsupported-State
- vorzeitiges Stoppen funktioniert
- automatische Beendigung funktioniert
- Startprofil zeigt Tempo, Füllwortkontrolle, Klarheit, Struktur und Wirkung
- zwei schwächste Bereiche werden angezeigt
- Baseline wird lokal gespeichert
- Baseline erhöht nicht künstlich Streak oder Session-Zähler
- solange reale Skillwerte fehlen, kann Baseline Fortschritt/Plan initialisieren
- reale Trainingswerte haben Vorrang vor Baseline-Fallbacks

### Inhaltsanalyse 2.0

- ohne Solo-Transkript erscheint Empty State
- vorhandene Solo-Session kann ausgewählt werden
- Präzision erscheint
- Struktur erscheint
- Conciseness/Kürze erscheint
- Beleg-/Beispielindikator erscheint
- Hedging/Abschwächungen werden bei passenden Texten erkannt
- Wiederholungen werden nur als Trainingshinweis dargestellt
- UI behauptet keine Faktenprüfung oder Persönlichkeitsanalyse

### Bewerbung personalisieren

- Erfahrung/CV als Text einfügen
- Stellenanzeige als Text einfügen
- kleine `.txt/.md/.csv`-Datei kann lokal gelesen werden
- sechs Fragen werden erzeugt
- gemeinsame/fehlende Schlüsselbegriffe sind plausibel
- Übergang zum Live-Coach funktioniert
- CV- und Stellenanzeigentext werden nicht automatisch in Supabase/Cloud-Historie gespeichert
- keine Eignungsprozentzahl oder Bewerberranking

### Präsentations-Q&A

- Notizen/Pitch einfügen
- fünf Vorab-Checks erscheinen
- fünf kritische Fragen erscheinen
- Übergang zum Live-Coach funktioniert
- Notizen werden nicht automatisch in Cloud-Historie geschrieben

### 5-Minuten-Drills

- alle sechs Drills sichtbar
- Texte sind auf Smartphone vollständig lesbar
- Solo/Live-Coach/Audio-Labor-Ziele funktionieren

## 9. Fortschritt und Vier-Wochen-Plan

- Solo-, Audio-, Live-Coach- und Team-Coach-Sitzungen erscheinen korrekt
- Baseline-Fallback funktioniert vor den ersten echten Skillmessungen
- reale Sessions ersetzen Baseline-Fallback je Fähigkeit
- Wochenziel korrekt
- Streak korrekt
- sieben Kernfähigkeiten plausibel
- neue Audio-Aufnahmen beeinflussen Stimm-Dynamik
- Plan erzeugt vier Wochen
- Wochenziel wird auf drei bis sieben Einheiten begrenzt
- drei schwächste Fähigkeiten werden priorisiert
- Aufgabenstart öffnet richtigen Trainingsmodus
- abgeschlossene Aufgabe wird automatisch markiert
- manuelles Abhaken und Wiederöffnen funktioniert
- Aufgabenstart eines vorherigen Kontos wird nicht übernommen
- 12-Stunden-Ablauf aktiver Planaufgabe prüfen

## 10. Cloud-Synchronisierung

Mit zwei Browserprofilen oder zwei Geräten prüfen:

- Gerät A trainiert, Gerät B synchronisiert
- Solo-Sitzung
- Audio-Kennzahlen
- Live-Coach
- Team-Coach
- Trainingsplan
- Completion-Merge desselben Plans
- Kontowechsel zeigt keine Daten des vorherigen Kontos
- pausierter Sync lädt oder schreibt keinen Plan
- Transkript-Opt-in respektieren
- Audiodateien niemals synchronisieren
- Training-Lab-CV/Stellenanzeige/Präsentationsnotizen werden in v1 nicht automatisch synchronisiert

## 11. Datenschutz und Löschung

Mit Wegwerf-Testkonto prüfen:

- `docs/LEGAL_DATA_RELEASE.md` abgearbeitet
- JSON-Export enthält erwartete Profil-/Trainings-/Plandaten
- JSON-Export enthält keine Audiodatei
- lokales Löschen entfernt lokale Historie und Plan
- Baseline-Löschverhalten ist definiert und geprüft
- Cloud-Löschen entfernt Cloud-Sitzungen und Cloud-Plan
- Sync wird nach Löschung pausiert
- gelöschte Daten erscheinen nicht sofort erneut
- endgültige Kontolöschung verlangt korrekte E-Mail und `KONTO LÖSCHEN`
- Konto ist danach nicht mehr anmeldbar
- zugehörige SpeechCoach-Zeilen sind durch Cascade entfernt
- öffentliche Legal-/Datenschutzseiten enthalten keine Platzhalter

## 12. Fehler-, Offline- und Abbruchverhalten

Gezielt testen:

- Offline-Modus
- Supabase nicht erreichbar
- OpenAI nicht erreichbar
- API-Rate-Limit erreicht
- fremder API-Origin
- Mikrofon verweigert
- Browser ohne Speech Recognition
- Browser ohne MediaRecorder
- Präzisionstranskription schlägt fehl
- Live-Coach-Antwort absenden und Ansicht während laufender KI-Anfrage verlassen; keine verspätete Antwort
- Team-Coach-Antwort absenden und Ansicht während laufender KI-Anfrage verlassen; keine verspätete Antwort
- Audio-Labor während offener Mikrofonfreigabe verlassen; späterer Zugriff startet keine Aufnahme
- Audio-Labor während Pitch-/Präzisionsanalyse verlassen; keine nachträgliche Audio-Session
- Audio-Labor während Aufnahme verlassen; Recorder/Recognition/Stream/AudioContext enden
- Training-Lab-Baseline während Aufnahme per Escape schließen; Spracherkennung endet
- nach abgebrochenem Coach-, Team-, Audio- oder Baseline-Vorgang Modus neu öffnen und erfolgreich starten
- Seite während laufender AI-Anfrage verlassen/neuladen; Lifecycle bricht Requests ab
- absichtlich ausgelöster React-Renderfehler zeigt Error Boundary statt weißer Seite
- Neuladen nach Fehler stellt Anwendung wieder her

## 13. Responsive und Accessibility

Die Detailprüfung steht zusätzlich unter `docs/ACCESSIBILITY.md`.

Mindestens prüfen:

- 360 px Smartphone
- 390/430 px Smartphone
- Tablet
- 1366 px Desktop
- großer Desktop
- alle sieben Launcher nur mit Tastatur öffnen
- kein horizontaler Zwangsscroll durch sieben Launcher auf 360 px
- aktive Vollbildansicht mit Escape schließen
- Fokus kehrt auf ursprünglichen Launcher zurück
- sichtbare Fokuszustände auf Buttons, Links und Formularfeldern
- Dialog-/Ansichtswechsel wird vom Screenreader nachvollziehbar angekündigt
- Screenreader-Namen für zentrale Icon-Aktionen
- Training-Lab-Textareas/Select/File-Aktionen erreichbar
- keine abgeschnittenen Hauptaktionen
- `prefers-reduced-motion: reduce` ohne kritische Funktionsverluste
- zentrale Touch-Icon-Aktionen mindestens 44 × 44 px
- ausreichende Textkontraste

## Release-Gate

Der PR darf erst aus Draft genommen beziehungsweise gemergt werden, wenn:

1. `npm run check` tatsächlich erfolgreich durchläuft.
2. `npm run check:env` mit echter Production-Konfiguration erfolgreich durchläuft.
3. Remote-Smoke gegen echtes Preview erfolgreich ist.
4. produktive HTTPS-Domain konfiguriert ist.
5. Auth-End-to-End mit Testkonto funktioniert.
6. beide Coach-Endpunkte mit echtem API-Key getestet sind.
7. `/api/transcribe` mit echter Aufnahme getestet ist.
8. Training Lab inklusive Baseline/Inhaltsanalyse/Bewerbung/Q&A auf Desktop und Smartphone getestet ist.
9. Baseline-Fallback im Fortschritt/Plan real geprüft ist.
10. AI-Evaluation aus `docs/AI_EVALUATION.md` akzeptabel ist.
11. Cloud-Sync auf zwei Geräten geprüft ist.
12. Konto-/Datenlöschung mit Wegwerf-Testkonto geprüft ist.
13. Legal-/Data-Gate aus `docs/LEGAL_DATA_RELEASE.md` abgeschlossen ist.
14. Kosten-/Monitoring-/Browser-Gate aus `docs/OPERATIONS_RELEASE.md` abgeschlossen ist.
15. Keyboard-, Screenreader- und Reduced-Motion-Prüfung aus `docs/ACCESSIBILITY.md` durchgeführt ist.
16. globale WAF-/Distributed-Rate-Limits aktiv und getestet sind.
17. Abbruch-/Race-Condition-Tests auf echter Browser-Hardware erfolgreich sind.
18. reale Pitch-Kalibrierung mit mehreren Stimmen/Mikrofonen durchgeführt und dokumentiert ist.
19. nach Production-Deployment der Remote-Smoke gegen finale URL erfolgreich ist.
