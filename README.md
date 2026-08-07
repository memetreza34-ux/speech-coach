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

### Audio-Labor

- echte lokale Audiodatei-Aufnahme mit `MediaRecorder`
- wählbare Aufgabe und Aufnahmedauer
- Live-Lautstärkevisualisierung
- automatische Beendigung nach Ablauf der Zeit
- Wiedergabe der eigenen Originalaufnahme
- Lautstärke-Zeitleiste mit direkt anwählbaren Stellen
- automatische Erkennung kurzer, mittlerer und langer Pausen
- Bewertung von Stimmenergie, Dynamik, Pausengestaltung und Sprachfluss
- Sprechanteil, Pausenanzahl und längste Pause
- optionales Browser-Transkript mit Tempo und Füllwortanzahl
- lokale Verarbeitung ohne automatischen Audio-Upload
- Speicherung der Kennzahlen im Fortschrittsverlauf

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

- gemeinsames Dashboard für Solo-Training, Audio-Labor, Live-Coach und Team-Coach
- Gesamtniveau aus allen abgeschlossenen Übungen
- aktuelle Trainingsserie und persönliches Wochenziel
- Sprechzeit, Übungsanzahl und häufigster Trainingsbereich
- Fähigkeitenprofil für Tempo, Füllwortkontrolle, Klarheit, Struktur, Wirkung, Stimm-Dynamik und Pausengestaltung
- Aktivitätsübersicht für die letzten sieben Tage
- filterbarer Verlauf für Solo-, Audio- und Dialogtrainings
- Team-Coach fließt als Dialogtraining in Klarheit, Struktur und Wirkung ein
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
- Audiodateien werden niemals in den Cloud-Verlauf hochgeladen
- kontogetrennte Browser-Caches verhindern Datenvermischung auf gemeinsam genutzten Geräten

## Entwicklung

```bash
npm install
npm run dev
```

Der normale Vite-Entwicklungsserver verwendet für Live-Coach und Team-Coach automatisch die lokalen Ersatzmodi, solange `/api/coach` und `/api/team-coach` nicht durch eine Serverless-Umgebung bereitgestellt werden.

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

## KI-Coaches aktivieren

Die Serverfunktionen liegen unter:

```text
api/coach.js
api/team-coach.js
```

Beide sind für eine Serverless-Bereitstellung wie Vercel ausgelegt und verwenden denselben ausschließlich serverseitigen OpenAI-Schlüssel.

1. `.env.example` als Vorlage verwenden.
2. `OPENAI_API_KEY` ausschließlich als serverseitige Umgebungsvariable eintragen.
3. Optional `OPENAI_MODEL` überschreiben. Standard ist `gpt-5`.
4. Das Projekt über eine Plattform bereitstellen, die den Ordner `api/` als Serverfunktionen ausführt.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5
```

Der API-Schlüssel darf niemals als `VITE_OPENAI_API_KEY` oder anderweitig im Frontend gespeichert werden. Beide Serverfunktionen senden Anfragen mit `store: false` und erzwingen strukturierte JSON-Ausgaben. Beim Team-Coach akzeptiert der Server nur bekannte Szenario-IDs und verwendet die Rollenbeschreibungen aus seiner eigenen festen Szenariokonfiguration statt aus Browserdaten.

## Prüfung

```bash
npm run lint
npm run build
```

Die GitHub-Actions-Prüfung kann zusätzlich manuell über den Workflow `SpeechCoach CI` gestartet werden. Sie ist nicht automatisch aktiv, solange das GitHub-Konto keine Actions-Runner starten kann.

## Datenschutz und technische Grenzen

Die Audioaufnahme des Audio-Labors bleibt im Browser und wird nur für die aktuelle Ergebnissitzung als temporäre Objekt-URL vorgehalten. Lokal und in der Cloud werden ausschließlich die Audio-Kennzahlen gespeichert. Die browserbasierte Lautstärke- und Pausenanalyse ist ein Trainingsindikator und keine medizinische oder logopädische Beurteilung.

Transkripte werden erst dann in neue Cloud-Sitzungen aufgenommen, wenn der Nutzer die entsprechende Kontooption ausdrücklich aktiviert. Bereits ohne Transkript synchronisierte Sitzungen werden nicht nachträglich verändert.

Der JSON-Export kann Kontometadaten, Profilwerte, lokale Trainings, Cloud-Zeilen sowie die lokale und synchronisierte Planfassung enthalten. Temporäre Audiodateien sind nicht Bestandteil des Exports, da sie nicht dauerhaft gespeichert werden.

Die automatische Planerledigung erkennt eine nach dem Aufgabenstart gespeicherte Trainingseinheit des passenden Modus. Ein nicht abgeschlossenes Training bleibt offen; ein Aufgabenstart verfällt spätestens nach zwölf Stunden.

Die Rollen des Team-Coachs sind fiktive Trainingspersonen. Die Simulation bewertet nur kommunikative Merkmale der Nutzerantwort und darf keine geschützten Eigenschaften oder psychischen Zustände des Nutzers ableiten.

Die optionale Live-Transkription hängt von der Web Speech Recognition API des Browsers ab. Für spätere Ausbaustufen sind zusätzlich vorgesehen:

- zuverlässiger serverseitiger Speech-to-Text-Dienst mit Zeitstempeln
- Tonhöhen- und Intonationsanalyse
