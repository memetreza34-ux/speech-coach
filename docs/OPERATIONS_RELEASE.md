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

Die exakten Werte nach Preview-Lasttest anpassen.

## 2. Budget-Fail-Safe

Wenn ein Kostenlimit oder externer Anbieter ausfällt:

- keine Endlosschleifen
- keine aggressiven automatischen Retries
- kontrollierter lokaler Coach-Fallback
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
- Solo-Training
- Fortschritt
- 4-Wochen-Plan
- Konto öffnen
- Tastaturnavigation soweit Plattform relevant

Auf Browsern mit Web Speech Recognition zusätzlich:

- Solo Live-Transkript
- Baseline
- Coach Spracheingabe

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
- Fortschritt nutzt Baseline, solange echte Skillwerte fehlen
- echte Trainingswerte ersetzen Baseline-Fallbacks
- erneute Baseline überschreibt nur das Baseline-Profil

### Inhaltsanalyse 2.0

- keine Solo-Sessions → Empty State
- Solo-Session auswählen
- Präzision/Struktur/Kürze/Belege erscheinen
- Hedging-Tags erscheinen bei passenden Texten
- keine falsche Behauptung von Faktenprüfung

### Bewerbung

- CV und Stellenanzeige einfügen
- Textdatei laden
- >300 KB Datei wird nicht automatisch verarbeitet
- Fragen werden erzeugt
- Texte werden nicht automatisch in Cloud-Historie geschrieben

### Präsentation

- Notizen einfügen
- Checkliste erscheint
- fünf kritische Fragen erscheinen
- Wechsel zum Live-Coach funktioniert

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
8. Transcribe
9. Training Lab
10. Löschung

Production:

1. Production deployen
2. Remote-Smoke
3. Health prüfen
4. echte Domain/Auth-Redirects prüfen
5. WAF-Limit kontrolliert testen
6. Wegwerf-Testkonto komplett durchlaufen

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

Der Remote-Deployment-Smoke prüft die wichtigsten CSP-Direktiven. Diese Policy muss auf einem echten Preview gegen Auth, Training Lab, Audio und Coach getestet werden, bevor Production freigegeben wird.

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
- Rate-Limits fehlen
- Löschflow ungeprüft ist
- Kosten-/Monitoring-Grenzen nicht festgelegt sind
- Legal-Gate offen ist
