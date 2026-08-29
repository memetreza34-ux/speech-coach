# SpeechCoach Operations Release

Dieses Dokument bündelt Kostenkontrolle, Monitoring, Browser-E2E und technische Betriebsgrenzen für v1.

## 1. Kostenkontrolle

Vor öffentlichem Release festlegen:

- globales Rate-Limit je kostenpflichtigem Endpoint
- maximale Request-Größe
- maximale Transkriptionsdatei
- tägliche interne Warnschwelle
- monatliche interne Warnschwelle
- Verhalten bei Budgetüberschreitung

Startgrenzen aus der aktuellen Architektur:

- `/api/coach`: global ungefähr 20 Requests/Minute/IP
- `/api/team-coach`: global ungefähr 18 Requests/Minute/IP
- `/api/transcribe`: global ungefähr 8 Requests/Minute/IP

Personalisierte Bewerbung-/Präsentationsproben verwenden denselben `/api/coach`-Pfad und zählen deshalb vollständig gegen dessen Kosten- und Missbrauchsgrenzen.

Die exakten Werte nach Preview-Lasttest anpassen.

## 2. Budget-Fail-Safe

Wenn ein Kostenlimit oder externer Anbieter ausfällt:

- keine Endlosschleifen
- keine aggressiven automatischen Retries
- kontrollierter lokaler Coach-Fallback
- personalisierte Probe bleibt durch denselben lokalen Fallback nutzbar
- Präzisionstranskription darf scheitern, lokale Audioanalyse bleibt nutzbar
- Nutzer erhält verständlichen Fehler ohne Secret/Stacktrace

## 3. Observability

Technisch erfassen darf die Betriebsumgebung:

- Deployment-Version
- Endpoint
- Statuscode
- Latenz
- Request-ID
- Fehlerklasse
- Rate-Limit-Ereignis
- Health-Status

Nicht in Logs/Event-Properties:

- vollständige Nutzerantwort
- vollständiges Transkript
- Audio
- CV
- Stellenanzeige
- Präsentationsnotizen
- erzeugte personalisierte Fragen
- Passwörter/Tokens/Secrets

## 4. Health

`/api/health` muss:

- HTTP 200 liefern, wenn die Funktion selbst erreichbar ist
- `status: ok` liefern
- keine Secrets ausgeben
- nur technische Capability-Informationen liefern
- `Cache-Control: no-store` setzen

## 5. Browser-E2E-Matrix

### Desktop

- Chrome aktuell
- Edge aktuell
- Firefox aktuell für alle unterstützten Nicht-Web-Speech-Flows
- Safari aktuell

### Mobile

- Chrome Android
- Safari iOS

### Viewports

- 360 px
- 390 px
- 430 px
- Tablet
- 1366 px Desktop
- großer Desktop

## 6. Pflichtflows je Browser

- Startseite
- Training Lab öffnen/schließen
- Baseline starten oder kontrollierten Unsupported-State sehen
- Inhaltsanalyse öffnen
- personalisierte Bewerbung vorbereiten und Probe starten
- personalisierte Präsentations-Q&A vorbereiten und Probe starten
- Solo-Training
- Fortschritt
- 4-Wochen-Plan
- Konto öffnen
- Tastaturnavigation soweit Plattform relevant

Auf Browsern mit Web Speech Recognition zusätzlich:

- Solo Live-Transkript
- Baseline
- Coach Spracheingabe
- Spracheingabe der personalisierten Probe

Auf Browsern mit MediaRecorder zusätzlich:

- Audio-Labor
- Aufnahme
- Wiedergabe
- lokale Analyse

## 7. Training-Lab-E2E

### Baseline

- Mikrofon erlauben
- Mikrofon verweigern
- vorzeitig stoppen
- automatische 60 Sekunden
- Startprofil gespeichert
- gespeichertes Profil enthält kein Rohtranskript
- gespeichertes Profil enthält keine detaillierte Inhaltsanalyse
- Fortschritt nutzt Baseline, solange echte Skillwerte fehlen
- echte Trainingswerte ersetzen Baseline-Fallbacks
- erneute Baseline überschreibt nur das Baseline-Profil
- Baseline exportieren
- Baseline löschen

### Baseline-Kontotrennung

- Gast-Baseline erstellen
- erstes Konto übernimmt Gast-Baseline kontrolliert
- zweites Konto sieht diese Baseline nicht
- zweites Konto besitzt eigene Baseline
- Wechsel zurück zu Konto 1 stellt dessen Baseline wieder her
- lokales Löschen eines Kontos entfernt nur dessen aktive Baseline

### Inhaltsanalyse 2.0

- keine Solo-Sessions → Empty State
- Solo-Session auswählen
- Präzision/Struktur/Kürze/Belege erscheinen
- Hedging-Tags erscheinen bei passenden Texten
- Wiederholungen bleiben Hinweise
- keine falsche Behauptung von Faktenprüfung
- keine Persönlichkeits-/Emotionserkennung

### Bewerbung

- CV und Stellenanzeige einfügen
- Textdatei laden
- >300 KB Datei wird nicht automatisch verarbeitet
- sechs Fragen werden lokal erzeugt
- Roh-CV/Stellenanzeige werden nicht in Dialoghistory geschrieben
- Roh-CV/Stellenanzeige werden nicht automatisch in Supabase geschrieben
- personalisierte Probe starten
- bis zu fünf erzeugte Fragen werden nacheinander gestellt
- Textantwort funktioniert
- Spracheingabe funktioniert oder degradiert kontrolliert
- TTS funktioniert
- Coach-Feedback erscheint pro Antwort
- Klarheit/Struktur/Wirkung werden bewertet
- echter AI-Modus funktioniert
- lokaler Fallback funktioniert
- Ergebnis wird als Dialogtraining gespeichert
- an `/api/coach` werden nur erzeugte Frage/Gesprächskontext und Nutzerantwort übertragen, nicht das Rohdokument
- keine Eignungsprozentzahl oder Bewerberranking

### Präsentation

- Notizen einfügen
- Checkliste erscheint
- fünf kritische Fragen erscheinen
- vollständige Notizen bleiben lokal
- personalisierte Q&A-Probe startet
- fünf Fragen werden nacheinander trainiert
- Text/Sprache/TTS funktionieren
- Coach-Feedback/Scores funktionieren
- AI-Modus und lokaler Fallback funktionieren
- Ergebnis wird als Dialogtraining gespeichert
- an `/api/coach` gehen nur erzeugte Fragen und Nutzerantworten, nicht vollständige Notizen

### Mini-Drills

- alle Drill-Karten sichtbar
- Solo/Coach/Audio-Verlinkungen funktionieren

## 8. Accessibility-E2E

Mindestens:

- Tab-Reihenfolge
- Shift+Tab
- Escape
- Fokus-Rückgabe
- sichtbarer Fokus
- Screenreader-Ankündigung des Overlays
- Labels für Inputs
- personalisierte Probe per Tastatur bedienbar
- personalisierte Probe auf 360 px nutzbar
- Reduced Motion
- 44px Touch-Ziele

## 9. Deployment-E2E

Preview:

1. `npm run check`
2. `npm run check:env`
3. Preview deployen
4. `npm run test:deployment`
5. Browser-Matrix
6. Auth
7. Coach/Team
8. personalisierte Bewerbung-/Präsentationsprobe
9. Transcribe
10. Training Lab
11. Löschung

Production:

1. Production deployen
2. Remote-Smoke
3. Health prüfen
4. echte Domain/Auth-Redirects prüfen
5. WAF-Limit kontrolliert testen
6. personalisierte Probe mit echtem AI-Endpunkt testen
7. Wegwerf-Testkonto komplett durchlaufen

## 10. CSP/Supply Chain

`vercel.json` setzt inzwischen eine konservative Content-Security-Policy mit:

- `default-src 'self'`
- `base-uri 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`
- `form-action 'self'`
- `script-src 'self' https://cdn.jsdelivr.net`
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
- `media-src 'self' blob:`
- `worker-src 'self' blob:`

Zusätzlich sind `Cross-Origin-Opener-Policy: same-origin` und `X-Permitted-Cross-Domain-Policies: none` aktiv.

Der Remote-Deployment-Smoke prüft die wichtigsten CSP-Direktiven. Diese Policy muss auf einem echten Preview gegen Auth, Training Lab, personalisierte Proben, Audio und Coach getestet werden, bevor Production freigegeben wird.

### Noch offen: Runtime-CDN entfernen

Das gepinnte Supabase-SDK wird aktuell noch als externer Runtime-ESM-Import von jsDelivr geladen. Nächster Supply-Chain-Schritt nach funktionierendem Preview:

1. `@supabase/supabase-js` als normale Build-Abhängigkeit bundlen.
2. externen Runtime-CDN-Import entfernen.
3. jsDelivr aus `script-src` entfernen.
4. Preview erneut vollständig testen.
5. CSP danach weiter minimieren.

Die CSP darf nicht blind weiter verschärft werden, solange Auth/Audio/Preview nicht dagegen getestet wurden.

## 11. Release-Entscheidung

Nicht veröffentlichen, wenn:

- CI nicht tatsächlich gelaufen ist
- Production-Build nicht gelaufen ist
- Preview fehlt
- CSP nicht im echten Preview getestet ist
- Browser-E2E offen ist
- personalisierte Probe nicht mit AI und Fallback real getestet ist
- Baseline-Kontotrennung ungeprüft ist
- Rate-Limits fehlen
- Löschflow ungeprüft ist
- Kosten-/Monitoring-Grenzen nicht festgelegt sind
- Legal-Gate offen ist