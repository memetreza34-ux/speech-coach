# SpeechCoach Production Checklist

Diese Checkliste ist die Freigabebedingung vor einem Merge nach `main` beziehungsweise vor einem öffentlichen Produktionsrelease.

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

## 2. Deployment

- finale HTTPS-Domain festlegen
- `OPENAI_API_KEY` ausschließlich serverseitig konfigurieren
- optional `OPENAI_MODEL` serverseitig setzen
- keine `VITE_OPENAI_API_KEY` anlegen
- Vercel muss `vercel.json` übernehmen
- `/api/health` muss HTTP 200 liefern
- `/api/coach`, `/api/team-coach` und `/api/transcribe` dürfen auf GET nicht erfolgreich antworten
- Security-Header im Browser-Netzwerk-Tab prüfen
- statische `/assets/*` müssen langfristig gecacht werden
- `/api/*` darf nicht gecacht werden

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

### Präzisionstranskription

Mit WebM und – falls vom Zielbrowser erzeugt – MP4/M4A prüfen:

- standardmäßig deaktiviert
- Opt-in gilt nur für die aktuelle Aufnahme
- `/api/transcribe` funktioniert mit echtem Server-Key
- Wort-Zeitmarken werden angezeigt
- Klick auf Textgruppe springt an passende Audiostelle
- Fehler der Servertranskription zerstört lokale Analyse nicht
- >3-MB-Aufnahme wird kontrolliert abgelehnt
- Audiodatei erscheint nicht im Local Storage
- Audiodatei erscheint nicht in Supabase
- Wort-Zeitmarken erscheinen nicht in gespeicherten Sessions

## 8. Fortschritt und Vier-Wochen-Plan

- Solo-, Audio-, Live-Coach- und Team-Coach-Sitzungen erscheinen korrekt
- Wochenziel korrekt
- Streak korrekt
- sieben Kernfähigkeiten plausibel
- neue Audio-Aufnahmen beeinflussen Stimm-Dynamik
- Plan erzeugt vier Wochen
- Wochenziel wird auf drei bis sieben Einheiten begrenzt
- drei schwächste Fähigkeiten werden priorisiert
- Aufgabenstart öffnet den richtigen Trainingsmodus
- abgeschlossene Aufgabe wird automatisch markiert
- manuelles Abhaken und Wiederöffnen funktioniert
- Aufgabenstart eines vorherigen Kontos wird nicht übernommen
- 12-Stunden-Ablauf aktiver Planaufgabe prüfen

## 9. Cloud-Synchronisierung

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

## 10. Datenschutz und Löschung

Mit Wegwerf-Testkonto prüfen:

- JSON-Export enthält erwartete Profil-/Trainings-/Plandaten
- JSON-Export enthält keine Audiodatei
- lokales Löschen entfernt lokale Historie und Plan
- Cloud-Löschen entfernt Cloud-Sitzungen und Cloud-Plan
- Sync wird nach Löschung pausiert
- gelöschte Daten erscheinen nicht sofort erneut
- endgültige Kontolöschung verlangt korrekte E-Mail und `KONTO LÖSCHEN`
- Konto ist danach nicht mehr anmeldbar
- zugehörige SpeechCoach-Zeilen sind durch Cascade entfernt

## 11. Fehler- und Offline-Verhalten

Gezielt testen:

- Offline-Modus
- Supabase nicht erreichbar
- OpenAI nicht erreichbar
- Mikrofon verweigert
- Browser ohne Speech Recognition
- Browser ohne MediaRecorder
- Präzisionstranskription schlägt fehl
- absichtlich ausgelöster React-Renderfehler in einer lokalen Testversion zeigt die Error Boundary statt einer weißen Seite
- Neuladen nach Fehler stellt die Anwendung wieder her

## 12. Responsive und Accessibility

Mindestens prüfen:

- 360 px Smartphone
- 390/430 px Smartphone
- Tablet
- 1366 px Desktop
- großer Desktop
- Tastaturbedienung wichtiger Buttons
- sichtbare Fokuszustände
- Dialoge sinnvoll per Screenreader benannt
- keine abgeschnittenen Hauptaktionen
- `prefers-reduced-motion` ohne kritische Funktionsverluste
- ausreichende Textkontraste

## Release-Gate

Der PR darf erst aus Draft genommen beziehungsweise gemergt werden, wenn:

1. `npm run check` erfolgreich durchläuft.
2. die produktive HTTPS-Domain konfiguriert ist.
3. Auth-End-to-End mit einem Testkonto funktioniert.
4. beide Coach-Endpunkte mit echtem API-Key getestet sind.
5. `/api/transcribe` mit echter Aufnahme getestet ist.
6. Cloud-Sync auf zwei Geräten geprüft ist.
7. Konto- und Datenlöschung mit einem Wegwerf-Testkonto geprüft ist.
8. kritische Mobile- und Desktop-Flows manuell geprüft sind.
