# SpeechCoach Production Checklist

Diese Checkliste ist die verbindliche Freigabebedingung vor einem Merge nach `main` und vor einem öffentlichen Produktionsrelease.

Übergeordnete Anleitung: `docs/MASTER_ROADMAP.md`. Ergänzend gelten `docs/PRODUCT_SPEC.md`, `docs/AI_EVALUATION.md`, `docs/LEGAL_DATA_RELEASE.md`, `docs/OPERATIONS_RELEASE.md`, `docs/ACCESSIBILITY.md`, `docs/API_SECURITY.md`, `docs/PITCH_CALIBRATION.md` und `docs/ACCOUNT_RACE_HARDENING.md`.

## 1. Automatische Validierung

Lokal oder in GitHub Actions ausführen:

```bash
npm ci
npm run check
```

`npm run check` muss vollständig grün sein und umfasst:

- Oxlint
- Node-Unit-Tests
- Repository-/Privacy-/Security-/Runtime-Smoke-Checks
- Vite-Produktionsbuild

Keinen Release freigeben, wenn einer dieser Schritte fehlschlägt oder gar nicht ausgeführt wurde.

Zusätzlich:

```bash
npm run check:env
```

mit der echten Production-Konfiguration ausführen.

## 2. Deployment und Security Header

Vor Release prüfen:

- finale HTTPS-Domain festgelegt
- `OPENAI_API_KEY` ausschließlich serverseitig
- optional `OPENAI_MODEL` ausschließlich serverseitig
- keine `VITE_OPENAI_API_KEY`
- `VITE_SUPABASE_URL` korrekt
- nur publishable Supabase-Key im Frontend
- kein `service_role` im Browser
- `SPEECHCOACH_ALLOWED_ORIGINS` nur bei absichtlich zusätzlichen Origins
- Vercel übernimmt `vercel.json`
- `/api/health` liefert HTTP 200
- `/api/coach`, `/api/team-coach`, `/api/transcribe` lehnen GET ab
- `/api/*` wird nicht gecacht
- `/assets/*` wird immutable gecacht

Security Header mindestens:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`
- HSTS auf HTTPS
- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy: same-origin`

CSP prüfen:

- `default-src 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`
- `base-uri 'self'`
- OpenAI nicht als direkter Browser-`connect-src`
- Supabase-Verbindung funktioniert weiterhin
- aktueller gepinnter jsDelivr-Supabase-Import funktioniert auf Preview

### Deployment-Smoke

Preview:

```bash
SPEECHCOACH_TARGET_URL=https://preview.example npm run test:deployment
```

Production:

```bash
SPEECHCOACH_TARGET_URL=https://production.example EXPECT_AI_CONFIGURED=true npm run test:deployment
```

Bei geschütztem Vercel-Preview zusätzlich `VERCEL_AUTOMATION_BYPASS_SECRET` verwenden.

## 3. API-Missbrauchsschutz und Kosten

Die Detaildokumentation liegt unter `docs/API_SECURITY.md` und `docs/OPERATIONS_RELEASE.md`.

Prüfen:

- gemeinsamer Guard `api/_security.js` aktiv
- fremder Origin → 403
- übergroßer Body → 413
- falscher Content-Type → 415
- überschrittenes In-Code-Limit → 429
- `Retry-After` vorhanden
- Fehlerbody und `X-Request-Id` passen zusammen
- globales WAF-/Distributed-Rate-Limit aktiv
- WAF-Regeln limitieren/deny/challenge tatsächlich
- Coach-Limits berücksichtigen auch personalisierte Proben
- tägliche interne Kostenwarnschwelle definiert
- monatliche interne Kostenwarnschwelle definiert
- Verhalten bei Budgetüberschreitung definiert
- keine aggressiven automatischen Retries
- Serverlogs enthalten keine Gesprächsinhalte, Transkripte, Audiodaten, CVs, Stellenanzeigen, Präsentationsnotizen oder Secrets

## 4. Supabase Auth

In Supabase Auth finale Site URL und erlaubte Redirect URLs konfigurieren.

Mit Wegwerf-Testkonto vollständig prüfen:

- Registrierung
- E-Mail-Bestätigung
- Passwort-Login
- Abmeldung
- Magic Link
- Passwort-Reset
- Recovery-Link
- neues Passwort
- E-Mail-Änderung
- erneute Anmeldung nach Browser-Neustart
- Session Refresh
- falscher/abgelaufener Link zeigt kontrollierten Fehler

## 5. Solo-Training

Desktop und Mobilgerät prüfen:

- alle sechs Trainingsbereiche
- vorgeschlagenes Thema
- Zufallsthema
- eigenes Thema
- 30 Sekunden
- 60 Sekunden
- 120 Sekunden
- Mikrofon erlauben
- Mikrofon ablehnen
- Live-Transkript in unterstütztem Browser
- automatisches Ende
- manuelles Ende
- Tempo
- Füllwörter
- Wortanzahl
- Wortvielfalt
- Wiederholung
- Speicherung im Verlauf
- keine verspätete Speicherung nach Verlassen der Aufnahme

## 6. Live-Coach und Team-Coach

### 1:1 Live-Coach

Mindestens prüfen:

- alle sechs Simulationstypen
- unterstützend
- realistisch
- herausfordernd
- Texteingabe
- Spracheingabe
- TTS an/aus
- drei Runden
- fünf Runden
- echter AI-Modus
- lokaler Fallback
- Abschlussauswertung
- Speicherung im Dialogverlauf
- Request-Abbruch bei Schließen/ESC/Zurück

Zusätzlich Evaluationsset aus `docs/AI_EVALUATION.md` durchführen.

### Team-Coach

Alle sechs Gruppensimulationen mindestens einmal:

- Team-Meeting
- mündliche Prüfung
- Projekt-Pitch
- Konfliktrunde
- Kundentermin
- Entscheidung unter Zeitdruck

Zusätzlich:

- drei sichtbare kanonische Rollen
- Sprecherwechsel
- vier Antworten
- sechs Antworten
- Gruppenführungswert
- AI-Modus
- lokaler Fallback
- Speicherung als Dialogtraining
- Prompt-Injection ersetzt keine kanonische Rolle
- Request-Abbruch bei Navigation

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
- Pitch-Kurve
- Klick auf Kurve springt an korrekte Audiostelle
- `analysisConfidence` plausibel
- `voicedFrameRatio` plausibel
- einzelne Oktavfehler dominieren die Bewertung nicht

### Präzisionstranskription

Mit WebM und – falls Zielbrowser erzeugt – MP4/M4A prüfen:

- standardmäßig deaktiviert
- Opt-in gilt nur für aktuelle Aufnahme
- `/api/transcribe` funktioniert mit echtem Server-Key
- Wort-Zeitmarken werden angezeigt
- Klick auf Textgruppe springt an passende Stelle
- Fehler der Servertranskription zerstört lokale Analyse nicht
- 429 zeigt kontrollierten Hinweis und Referenz-ID
- >3-MB-Aufnahme wird kontrolliert abgelehnt
- Audiodatei erscheint nicht im Local Storage
- Audiodatei erscheint nicht in Supabase
- Wort-Zeitmarken erscheinen nicht in gespeicherten Sessions

Die reale Kalibrierungsmatrix aus `docs/PITCH_CALIBRATION.md` vollständig durchführen.

## 8. Training Lab

### Baseline

Prüfen:

- Training Lab öffnet aus dem siebten Hauptlauncher
- 60-Sekunden-Baseline startet
- Mikrofonfreigabe funktioniert
- verweigerte Freigabe zeigt verständlichen Fehler
- Browser ohne Speech Recognition zeigt kontrollierten Unsupported-State
- vorzeitiges Stoppen funktioniert
- automatische Beendigung funktioniert
- Startprofil zeigt Tempo, Füllwortkontrolle, Klarheit, Struktur und Wirkung
- zwei schwächste Bereiche werden angezeigt
- Baseline erhöht Streak/Session-Zähler nicht
- Baseline kann Fortschritt/Plan initialisieren
- reale Skillmessungen überschreiben Baseline-Fallback je Fähigkeit
- Baseline kann separat exportiert werden
- Baseline kann separat gelöscht werden
- gespeichertes Baseline-Objekt enthält kein Rohtranskript
- gespeichertes Baseline-Objekt enthält keine detaillierte Inhaltsanalyse

### Baseline-Kontotrennung

Mit zwei Konten und Gastmodus prüfen:

1. als Gast Baseline erstellen
2. erstes Konto anmelden → Gast-Baseline darf kontrolliert übernommen werden
3. abmelden
4. zweites Konto anmelden → Baseline von Konto 1 darf nicht erscheinen
5. zweite Baseline erstellen
6. zurück zu Konto 1 → ursprüngliche Konto-1-Baseline erscheint
7. lokale Daten von Konto 1 löschen → Konto-1-Baseline wird entfernt, Konto-2-Baseline bleibt erhalten

### Inhaltsanalyse 2.0

- ohne Solo-Transkript erscheint Empty State
- vorhandene Solo-Session kann ausgewählt werden
- Präzision erscheint
- Struktur erscheint
- Conciseness/Kürze erscheint
- Beleg-/Beispielindikator erscheint
- Hedging/Abschwächungen werden erkannt
- Wiederholungen werden nur als Trainingshinweis dargestellt
- UI behauptet keine Faktenprüfung
- UI behauptet keine Persönlichkeitsanalyse
- kurze und lange Antworten ergeben plausible Unterschiede

### Bewerbung personalisieren

- Erfahrung/CV als Text einfügen
- Stellenanzeige als Text einfügen
- kleine `.txt/.md/.csv`-Datei lokal lesen
- sechs Fragen erzeugen
- gemeinsame/fehlende Schlüsselbegriffe plausibel
- Button „Personalisierte Probe starten“ öffnet personalisierte Probe
- alle sechs vorbereiteten Bewerbungsfragen werden nacheinander gestellt
- Textantwort funktioniert
- Spracheingabe funktioniert oder zeigt kontrollierten Unsupported-State
- TTS an/aus funktioniert
- Coach-Feedback erscheint nach jeder Antwort
- Klarheit/Struktur/Wirkung werden bewertet
- AI-Modus funktioniert
- lokaler Fallback funktioniert
- Abschlussauswertung erscheint
- Ergebnis wird als Dialogtraining gespeichert
- CV-/Stellenanzeigen-Rohtext wird nicht in Dialoghistory geschrieben
- CV-/Stellenanzeigen-Rohtext wird nicht automatisch in Supabase geschrieben
- an Coach-API gehen nur lokal erzeugte Fragen und Nutzerantworten
- keine Eignungsprozentzahl
- kein Bewerberranking

### Präsentations-Q&A

- Notizen/Pitch einfügen
- fünf Vorab-Checks erscheinen
- fünf kritische Fragen erscheinen
- personalisierte Q&A-Probe startet
- Fragen werden nacheinander gestellt
- Text/Sprache/TTS funktionieren
- Coach-Feedback und Scores funktionieren
- AI-Modus und lokaler Fallback funktionieren
- Abschlussauswertung erscheint
- Ergebnis wird als Dialogtraining gespeichert
- vollständige Präsentationsnotizen werden nicht in Dialoghistory geschrieben
- vollständige Präsentationsnotizen werden nicht automatisch an Coach-API oder Supabase übertragen

### 5-Minuten-Drills

- alle sechs Drills sichtbar
- Texte auf Smartphone vollständig lesbar
- Solo-Ziel funktioniert
- Live-Coach-Ziel funktioniert
- Audio-Labor-Ziel funktioniert

## 9. Fortschritt und Vier-Wochen-Plan

- Solo-Sessions erscheinen
- Audio-Sessions erscheinen
- Live-Coach-Sessions erscheinen
- Team-Coach-Sessions erscheinen
- personalisierte Bewerbung-/Präsentationsproben erscheinen als Dialogtraining
- Baseline-Fallback funktioniert vor ersten echten Skillmessungen
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
- manuelles Abhaken/Wiederöffnen funktioniert
- Aufgabenstart eines vorherigen Kontos wird nicht übernommen
- 12-Stunden-Ablauf aktiver Planaufgabe funktioniert

## 10. Cloud-Synchronisierung

Mit zwei Browserprofilen oder zwei Geräten prüfen:

- Gerät A trainiert, Gerät B synchronisiert
- Solo
- Audio-Kennzahlen
- Live-Coach
- Team-Coach
- personalisierte Dialogprobe
- Trainingsplan
- Completion-Merge desselben Plans
- Kontowechsel zeigt keine Daten des vorherigen Kontos
- pausierter Sync lädt/schreibt keinen Plan
- Transkript-Opt-in wird respektiert
- Audiodateien werden niemals synchronisiert
- Baseline wird in v1 nicht automatisch als Cloud-Session synchronisiert
- Training-Lab-CV/Stellenanzeige/Präsentationsnotizen werden nicht automatisch synchronisiert

### Account-/Cloud-Race-Matrix

Die vollständige Matrix aus `docs/ACCOUNT_RACE_HARDENING.md` mit zwei Wegwerf-Konten durchführen.

Mindestens prüfen:

- A→B-Wechsel während Profil-Hydration zeigt nie As Profil als Bs Profil
- A→B-Wechsel während laufendem Sync schreibt keine A-Session in Bs sichtbare History
- alter A-Sync überschreibt Bs Sync-State nicht
- direkter A→B-Wechsel entfernt As generischen Profil-/Sync-Cache, cached aber As Training korrekt
- Export von A während Wechsel auf B erzeugt keinen A-Cloud/B-Local-Mischexport
- „lokale Daten löschen“ von A während Wechsel auf B löscht Bs Daten nicht
- Account-Löschung von A während Wechsel auf B meldet B nicht ab und löscht Bs History/Baseline/Plan/Profile nicht
- erwarteter `STALE_ACCOUNT_CONTEXT` wird als kontrollierter Abort behandelt, nicht als normaler Serverfehler

## 11. Datenschutz, Export und Löschung

Mit Wegwerf-Testkonto prüfen:

- `docs/LEGAL_DATA_RELEASE.md` abgearbeitet
- JSON-Export enthält erwartete Profil-/Trainings-/Plandaten
- JSON-Export enthält keine Audiodatei
- Baseline hat eigenen datensparsamen Export
- lokales Löschen entfernt lokale Trainingshistorie und Plan
- lokales Löschen entfernt aktive accountbezogene Baseline
- andere Konten auf demselben Gerät bleiben getrennt
- Cloud-Löschen entfernt Cloud-Sessions und Cloud-Plan
- Sync wird nach Löschung pausiert
- gelöschte Daten erscheinen nicht sofort erneut
- endgültige Kontolöschung verlangt korrekte E-Mail und `KONTO LÖSCHEN`
- Konto danach nicht mehr anmeldbar
- SpeechCoach-Zeilen per Cascade entfernt
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
- Live-Coach während laufender Anfrage schließen
- Team-Coach während laufender Anfrage schließen
- personalisierte Probe während laufender Coach-Auswertung zurück/ESC schließen
- personalisierte Probe danach erneut öffnen und erfolgreich fortsetzen
- Audio-Labor während offener Mikrofonfreigabe verlassen
- Audio-Labor während Pitch-/Präzisionsanalyse verlassen
- Audio-Labor während Aufnahme verlassen
- Training-Lab-Baseline während Aufnahme per Escape schließen
- Seite während laufender AI-Anfrage verlassen/neuladen
- erwartete AbortErrors erzeugen keine weiße Seite
- absichtlich ausgelöster React-Renderfehler zeigt Error Boundary
- Neuladen nach Fehler stellt Anwendung wieder her

## 13. Responsive und Accessibility

Die Detailprüfung steht unter `docs/ACCESSIBILITY.md`.

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
- sichtbare Fokuszustände
- Dialog-/Ansichtswechsel wird vom Screenreader angekündigt
- Icon-Aktionen haben verständliche Namen
- Training-Lab-Textareas/Select/File-Aktionen erreichbar
- personalisierte Probe vollständig per Tastatur bedienbar
- personalisierte Probe auf 360 px ohne abgeschnittene Hauptaktion
- `prefers-reduced-motion: reduce` ohne Funktionsverlust
- zentrale Touch-Icon-Aktionen mindestens 44 × 44 px
- ausreichende Textkontraste

## 14. Supply Chain

Vor v1 mindestens verifizieren:

- Supabase-CDN-Version bleibt exakt gepinnt
- CSP erlaubt nur den tatsächlich benötigten externen Script-Host
- keine unerwarteten weiteren Runtime-CDNs
- `package-lock.json` vorhanden und reproduzierbar
- `npm ci` funktioniert

Nach stabiler Preview bevorzugt:

1. `@supabase/supabase-js` als normale Dependency bundlen
2. dynamischen jsDelivr-Import entfernen
3. jsDelivr aus CSP entfernen
4. Auth/Synchronisierung erneut vollständig testen

## Release-Gate

Der PR darf erst aus Draft genommen beziehungsweise gemergt werden, wenn:

1. `npm run check` tatsächlich erfolgreich durchläuft.
2. `npm run check:env` mit echter Production-Konfiguration erfolgreich durchläuft.
3. Remote-Smoke gegen echtes Preview erfolgreich ist.
4. produktive HTTPS-Domain konfiguriert ist.
5. Auth-End-to-End mit Testkonto funktioniert.
6. Live-Coach und Team-Coach mit echtem API-Key getestet sind.
7. `/api/transcribe` mit echter Aufnahme getestet ist.
8. Training Lab inklusive Baseline, Inhaltsanalyse, personalisierter Bewerbung und personalisiertem Präsentations-Q&A auf Desktop und Smartphone getestet ist.
9. Baseline-Kontotrennung und Baseline-Fallback real geprüft sind.
10. AI-Evaluation aus `docs/AI_EVALUATION.md` akzeptabel ist.
11. Cloud-Sync auf zwei Geräten geprüft ist.
12. Konto-/Datenlöschung mit Wegwerf-Testkonto geprüft ist.
13. Legal-/Data-Gate aus `docs/LEGAL_DATA_RELEASE.md` abgeschlossen ist.
14. Kosten-/Monitoring-/Browser-Gate aus `docs/OPERATIONS_RELEASE.md` abgeschlossen ist.
15. Keyboard-, Screenreader- und Reduced-Motion-Prüfung aus `docs/ACCESSIBILITY.md` durchgeführt ist.
16. globale WAF-/Distributed-Rate-Limits aktiv und getestet sind.
17. Account-/Cloud-Race-Matrix aus `docs/ACCOUNT_RACE_HARDENING.md` mit zwei Konten real bestanden ist.
18. allgemeine Abbruch-/Race-Condition-Tests auf echter Browser-Hardware erfolgreich sind.
19. reale Pitch-Kalibrierung mit mehreren Stimmen/Mikrofonen durchgeführt und dokumentiert ist.
20. nach Production-Deployment der Remote-Smoke gegen finale URL erfolgreich ist.

Vor Erfüllung aller 20 Punkte bleibt der PR Draft.