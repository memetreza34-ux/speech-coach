# SpeechCoach

SpeechCoach ist ein deutschsprachiges Kommunikations-Gym für freie Rede, Argumentation, verständliches Erklären, Bewerbungsgespräche, schwierige Gespräche und Präsentationen.

## Aktueller Funktionsumfang

### Solo-Training

- sechs Trainingsbereiche mit 48 kuratierten Aufgaben
- eigenes Thema, Themenvorschlag oder Zufallsthema
- wählbare Dauer: 30 Sekunden, 1 Minute oder 2 Minuten
- Browser-Spracherkennung mit Live-Transkript
- automatische Beendigung nach Ablauf der Zeit
- Analyse von Sprechtempo, Füllwörtern, Wortanzahl und Wortvielfalt
- konkrete Stärken und nächste Verbesserungsschritte
- Wiederholung desselben Themas
- lokaler Trainingsverlauf im Browser

### Audio-Labor Pro

- echte lokale Audiodatei-Aufnahme mit `MediaRecorder`
- wählbare Aufgabe und Aufnahmedauer
- Live-Lautstärkevisualisierung
- automatische Beendigung nach Ablauf der Zeit
- Wiedergabe der eigenen Originalaufnahme
- Lautstärke-Zeitleiste mit direkt anwählbaren Stellen
- automatische Erkennung kurzer, mittlerer und langer Pausen
- Bewertung von Stimmenergie, Stimm-Dynamik, Pausengestaltung und Sprachfluss
- lokale Tonhöhenanalyse mit Median-Grundton, Tonumfang, Intonation und Sprechmelodie
- Monotonie-Risiko und interaktive Pitch-Kurve
- optionales Browser-Transkript mit Tempo und Füllwortanzahl
- optionales Präzisionstranskript mit Wort-Zeitmarken über `/api/transcribe`
- Präzisionstranskription standardmäßig deaktiviert und nur pro Aufnahme nach Opt-in aktiv
- lokale Verarbeitung ohne automatischen Audio-Upload
- Speicherung ausschließlich von Kennzahlen; kein Audioblob und keine Wort-Zeitmarken im Cloud-Verlauf

### Interaktiver Live-Coach

- sechs 1:1-Gesprächssimulationen
- drei Schwierigkeitsstufen: unterstützend, realistisch und herausfordernd
- drei oder fünf Gesprächsrunden
- eigenes oder zufälliges Thema
- Spracheingabe und Texteingabe
- vorgelesene Coach-Antworten über die Browser-Sprachausgabe
- Rückfragen passend zur letzten Antwort
- Mikrofeedback nach jeder Runde
- Bewertung von Klarheit, Struktur und Wirkung
- Gesamtauswertung mit Stärken und Verbesserungen
- lokaler Ersatzmodus, wenn keine KI-Verbindung eingerichtet ist

### Mehrpersonen-Team-Coach

- sechs Gruppensimulationen mit jeweils drei fest definierten Rollen
- kritisches Team-Meeting, mündliche Prüfung, Projekt-Pitch, Konfliktrunde, Kundentermin und Entscheidung unter Zeitdruck
- jede Rolle besitzt eigene Funktion, Haltung und Gesprächston
- vier oder sechs Nutzerantworten pro Simulation
- unterstützende, realistische und herausfordernde Gruppendynamik
- vorgeschlagene, zufällige oder eigene Themen
- Spracheingabe und Texteingabe
- Sprecherwechsel zwischen den simulierten Teilnehmern
- Browser-Sprachausgabe für die jeweils aktive Rolle
- Mikrofeedback nach jeder Nutzerantwort
- Bewertung von Klarheit, Struktur, Wirkung und Gruppenführung
- Abschlussauswertung mit Antwortverlauf
- serverseitig fest definierte Rollen verhindern manipulierte Rollenprompts aus dem Browser
- eigener `/api/team-coach`-Endpunkt mit strukturierter JSON-Ausgabe
- lokaler Mehrpersonen-Ersatzmodus ohne KI-Verbindung
- Team-Coach-Sitzungen werden als Dialogtraining im bestehenden Fortschritt und Cloud-Verlauf gespeichert

### Fortschritt und Trainingssteuerung

- gemeinsames Dashboard für Solo-Training, Audio-Labor Pro, Live-Coach und Team-Coach
- Gesamtniveau aus allen abgeschlossenen Übungen
- aktuelle Trainingsserie und persönliches Wochenziel
- Sprechzeit, Übungsanzahl und häufigster Trainingsbereich
- Fähigkeitenprofil für Tempo, Füllwortkontrolle, Klarheit, Struktur, Wirkung, Stimm-Dynamik und Pausengestaltung
- Aktivitätsübersicht für die letzten sieben Tage
- filterbarer Verlauf für Solo-, Audio- und Dialogtrainings
- Team-Coach fließt als Dialogtraining in Klarheit, Struktur und Wirkung ein; der exakte Team-Gesamtscore inklusive Gruppenführung bleibt zusätzlich in der Sitzung gespeichert
- automatische Erkennung des schwächsten verfügbaren Bereichs
- passende nächste Trainingsempfehlung mit direktem Einstieg

### Adaptiver Vier-Wochen-Plan

- automatische Auswertung aller sieben Kommunikationsfähigkeiten
- stärkere Gewichtung der drei schwächsten gemessenen Bereiche
- vier aufeinander aufbauende Phasen: Fundament, Kontrolle, Druck und Transfer
- drei bis sieben Kerneinheiten pro Woche passend zum persönlichen Wochenziel
- gemischte Solo-, Audio- und Live-Coach-Aufgaben
- klare Tageszuordnung, Dauer, Schwierigkeitsstufe und Trainingsanweisung
- manueller Aufgabenstatus für flexible Nachpflege
- automatische Erledigung, wenn eine aus dem Plan gestartete passende Trainingseinheit abgeschlossen wird
- Schutz vor falscher Zuordnung bei Kontowechseln und abgelaufenen Aufgabenstarts
- Neuberechnung mit den aktuellsten Leistungswerten
- lokale Nutzung ohne Konto
- geräteübergreifende Cloud-Synchronisierung mit Completion-Merge bei Anmeldung

### Konto, Sicherheit und Datenschutz

- SpeechCoach bleibt vollständig ohne Konto nutzbar
- Registrierung und Anmeldung mit E-Mail und Passwort
- Anmeldung per Magic Link
- Passwort-Wiederherstellung über geschützten E-Mail-Link
- Passwortänderung mit aktuellem Passwort
- Änderung der Anmelde-E-Mail mit Supabase-Bestätigungsfluss
- dauerhaft gespeicherte und automatisch erneuerte Sitzung
- persönliche Einstellungen für Anzeigename und Wochenziel
- automatische und manuelle Cloud-Synchronisierung
- geräteübergreifender Verlauf für Solo, Audio-Kennzahlen, Live-Coach, Team-Coach und Trainingsplan
- optionales Speichern von Transkripten; standardmäßig deaktiviert
- vollständiger JSON-Datenexport für Profil, lokale Trainings, Cloud-Datensätze und Trainingsplan
- getrenntes Löschen von Cloud-Verlauf und lokalem Browser-Verlauf einschließlich zugehörigem Plan
- Synchronisierung wird bei Löschvorgängen automatisch pausiert, damit gelöschte Daten nicht sofort erneut geladen oder hochgeladen werden
- endgültige Kontolöschung über eine authentifizierte Supabase Edge Function
- Audiodateien werden niemals in den SpeechCoach-Cloud-Verlauf hochgeladen
- kontogetrennte Browser-Caches verhindern Datenvermischung auf gemeinsam genutzten Geräten

## Entwicklung

```bash
npm install
npm run dev
```

Der normale Vite-Entwicklungsserver verwendet für Live-Coach und Team-Coach automatisch die lokalen Ersatzmodi, solange `/api/coach` und `/api/team-coach` nicht durch eine Serverless-Umgebung bereitgestellt werden. Die optionale Präzisionstranskription benötigt zusätzlich `/api/transcribe`.

## Supabase-Cloud

Das verbundene Entwicklungsprojekt ist bereits als sicherer Fallback im Frontend konfiguriert. Für ein anderes Deployment können URL und veröffentlichbarer Schlüssel über Umgebungsvariablen überschrieben werden:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Nur ein **publishable key** darf im Frontend verwendet werden. Ein `service_role`- oder Secret-Key darf niemals in eine `VITE_*`-Variable gelangen.

Die Datenbankstruktur liegt idempotent unter:

```text
supabase/speechcoach-cloud.sql
```

Das Schema verwendet ausschließlich die SpeechCoach-Tabellen:

- `public.speechcoach_profiles`
- `public.speechcoach_sessions`
- `public.speechcoach_training_plans`

Dadurch kann SpeechCoach konfliktfrei mit anderen Apps im selben Projekt koexistieren. Alle drei Tabellen haben aktivierte Row Level Security. Authentifizierte Nutzer dürfen nur Zeilen lesen und verändern, deren `user_id` ihrer eigenen `auth.uid()` entspricht. Der anonyme Datenbankzugriff ist vollständig entzogen.

Der Trainingsplan verwendet genau eine Cloud-Zeile pro Nutzer. Planstruktur und erledigte Aufgaben werden getrennt gespeichert und beim Gerätewechsel konfliktarm zusammengeführt. Abgeschlossene Aufgaben desselben Plans werden als Vereinigungsmenge gemergt, sodass ein Gerät den Fortschritt eines anderen Geräts nicht versehentlich zurücksetzt.

Der Browser-Client lädt die exakt angegebene Version `@supabase/supabase-js@2.111.0` über einen gepinnten CDN-ESM-Import. Die Projektwerte können über `.env` ersetzt werden.

### Auth-Konfiguration

Für Registrierung, Magic Links, Passwort-Wiederherstellung und Bestätigungs-E-Mails müssen im Supabase-Dashboard passende URLs eingetragen werden:

- lokale Entwicklung: `http://localhost:5173`
- produktive App: die endgültige HTTPS-Domain

Die produktive Domain muss als Site URL beziehungsweise erlaubte Redirect URL in Supabase Auth hinterlegt sein. Für einen produktiven Versand sollte ein eigener SMTP-Anbieter konfiguriert werden.

### Sichere Kontolöschung

Die Funktion liegt unter:

```text
supabase/functions/delete-speechcoach-account/
```

Sie ist im verbundenen Projekt als `delete-speechcoach-account` aktiv und verlangt einen gültigen Benutzer-JWT. Die Funktion prüft zusätzlich die Konto-E-Mail und den exakten Bestätigungstext `KONTO LÖSCHEN`. Erst danach verwendet sie den serverseitigen Service-Role-Kontext, um den Auth-Nutzer endgültig zu löschen. Durch die Foreign Keys mit `ON DELETE CASCADE` werden Profil, Cloud-Trainings und Cloud-Trainingsplan automatisch entfernt.

Der Service-Role-Key ist ausschließlich in der Supabase-Laufzeit verfügbar und wird niemals an den Browser übertragen.

## KI- und Transkriptionsserver aktivieren

Die Serverfunktionen liegen unter:

```text
api/coach.js
api/team-coach.js
api/transcribe.js
api/health.js
```

Die drei kostenpflichtigen AI-Endpunkte verwenden denselben ausschließlich serverseitigen OpenAI-Schlüssel.

1. `.env.example` als Vorlage verwenden.
2. `OPENAI_API_KEY` ausschließlich als serverseitige Umgebungsvariable eintragen.
3. Optional `OPENAI_MODEL` überschreiben. Standard für die Coach-Endpunkte ist `gpt-5`.
4. Optional `SPEECHCOACH_ALLOWED_ORIGINS` setzen, wenn absichtlich zusätzliche Frontend-Origins erlaubt werden sollen.
5. Das Projekt über eine Plattform bereitstellen, die den Ordner `api/` als Serverfunktionen ausführt.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5
SPEECHCOACH_ALLOWED_ORIGINS=https://speechcoach.example
```

Der API-Schlüssel darf niemals als `VITE_OPENAI_API_KEY` oder anderweitig im Frontend gespeichert werden. Die Coach-Endpunkte senden Anfragen mit `store: false` und erzwingen strukturierte JSON-Ausgaben. Beim Team-Coach akzeptiert der Server nur bekannte Szenario-IDs und verwendet die Rollenbeschreibungen aus seiner eigenen festen Szenariokonfiguration statt aus Browserdaten.

### API-Missbrauchsschutz

`api/_security.js` schützt `/api/coach`, `/api/team-coach` und `/api/transcribe` zentral mit Methodenprüfung, Same-Origin-/Allowlist-Prüfung, Body-Limits, No-Store-Headern, Request-IDs und einem best-effort per-Instance-Rate-Limit. Die Transkription besitzt dabei bewusst das strengste Limit.

Ein serverloser In-Memory-Limiter ist **keine global verteilte Rate-Limit-Garantie**. Vor einem öffentlichen Release muss deshalb zusätzlich ein globales WAF- beziehungsweise Distributed-Rate-Limit auf der Hosting-Plattform aktiviert und getestet werden. Die vollständige Betriebsanleitung und vorgeschlagenen Startwerte stehen unter:

```text
docs/API_SECURITY.md
```

## Prüfung

```bash
npm run check
```

`npm run check` umfasst Lint, Node-Unit-Tests, Repository-/Privacy-Smoke-Checks und den Produktionsbuild. Die vollständige manuelle Freigabematrix liegt unter `docs/PRODUCTION_CHECKLIST.md`.

Die GitHub-Actions-Prüfung kann zusätzlich manuell über den Workflow `SpeechCoach CI` gestartet werden. Sie ist nicht automatisch aktiv, solange das GitHub-Konto keine Actions-Runner starten kann.

## Datenschutz und technische Grenzen

Die Audioaufnahme des Audio-Labors bleibt standardmäßig im Browser und wird nur für die aktuelle Ergebnissitzung als temporäre Objekt-URL vorgehalten. Lokal und in der Cloud werden ausschließlich Audio-Kennzahlen gespeichert. Tonhöhe, Intonation, Lautstärke und Pausen sind Trainingsindikatoren und keine medizinische oder logopädische Beurteilung.

Nur wenn die Präzisionstranskription für die aktuelle Aufnahme ausdrücklich aktiviert wird, wird diese Aufnahme einmalig an den SpeechCoach-Server und den konfigurierten Transkriptionsanbieter übertragen. SpeechCoach schreibt die Audiodatei nicht in Local Storage, Supabase oder den Cloud-Verlauf. Wort-Zeitmarken werden nur für die aktuelle Ergebnisansicht verwendet und nicht synchronisiert.

Transkripte werden erst dann in neue Cloud-Sitzungen aufgenommen, wenn der Nutzer die entsprechende Kontooption ausdrücklich aktiviert. Bereits ohne Transkript synchronisierte Sitzungen werden nicht nachträglich verändert.

Der JSON-Export kann Kontometadaten, Profilwerte, lokale Trainings, Cloud-Zeilen sowie die lokale und synchronisierte Planfassung enthalten. Temporäre Audiodateien sind nicht Bestandteil des Exports, da sie nicht dauerhaft gespeichert werden.

Die automatische Planerledigung erkennt eine nach dem Aufgabenstart gespeicherte Trainingseinheit des passenden Modus. Ein nicht abgeschlossenes Training bleibt offen; ein Aufgabenstart verfällt spätestens nach zwölf Stunden.

Die Rollen des Team-Coachs sind fiktive Trainingspersonen. Die Simulation bewertet nur kommunikative Merkmale der Nutzerantwort und darf keine geschützten Eigenschaften oder psychischen Zustände des Nutzers ableiten.

Die optionale Browser-Live-Transkription hängt von der Web Speech Recognition API des Browsers ab. Die Präzisionstranskription benötigt die Serverless-API und einen konfigurierten Server-Key.
