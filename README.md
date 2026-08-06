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

- sechs Gesprächssimulationen
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

### Fortschritt und Trainingssteuerung

- gemeinsames Dashboard für Solo-Training, Audio-Labor und Live-Coach
- Gesamtniveau aus allen abgeschlossenen Übungen
- aktuelle Trainingsserie und persönliches Wochenziel
- Sprechzeit, Übungsanzahl und häufigster Trainingsbereich
- Fähigkeitenprofil für Tempo, Füllwortkontrolle, Klarheit, Struktur, Wirkung, Stimm-Dynamik und Pausengestaltung
- Aktivitätsübersicht für die letzten sieben Tage
- filterbarer Verlauf für Solo-, Audio- und Dialogtrainings
- automatische Erkennung des schwächsten verfügbaren Bereichs
- passende nächste Trainingsempfehlung mit direktem Einstieg

### Konto und Cloud-Synchronisierung

- SpeechCoach bleibt vollständig ohne Konto nutzbar
- Registrierung und Anmeldung mit E-Mail und Passwort
- Anmeldung per Magic Link
- dauerhaft gespeicherte und automatisch erneuerte Sitzung
- persönliche Einstellungen für Anzeigename und Wochenziel
- automatische Synchronisierung nach lokalen Trainingsänderungen
- manuelle Synchronisierung und sichtbarer Sync-Status
- geräteübergreifender Verlauf für Solo, Audio-Kennzahlen und Live-Coach
- optionales Speichern von Transkripten; standardmäßig deaktiviert
- Audiodateien werden niemals in den Cloud-Verlauf hochgeladen
- lokale Fallback-Daten bleiben auch bei fehlender Verbindung verfügbar

## Entwicklung

```bash
npm install
npm run dev
```

Der normale Vite-Entwicklungsserver verwendet für den Live-Coach automatisch den lokalen Ersatzmodus, solange `/api/coach` nicht durch eine Serverless-Umgebung bereitgestellt wird.

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

Das Schema verwendet ausschließlich die Tabellen:

- `public.speechcoach_profiles`
- `public.speechcoach_sessions`

Dadurch kann SpeechCoach konfliktfrei mit anderen Apps im selben Projekt koexistieren. Beide Tabellen haben aktivierte Row Level Security. Authentifizierte Nutzer dürfen nur Zeilen lesen und verändern, deren `user_id` ihrer eigenen `auth.uid()` entspricht. Der anonyme Datenbankzugriff ist vollständig entzogen.

Der Browser-Client lädt die exakt angegebene Version `@supabase/supabase-js@2.111.0` über den von Supabase dokumentierten CDN-Installationsweg. Die Projektwerte können über `.env` ersetzt werden.

### Auth-Konfiguration

Für Registrierung, Magic Links und Bestätigungs-E-Mails sollten im Supabase-Dashboard folgende URLs eingetragen werden:

- lokale Entwicklung: `http://localhost:5173`
- produktive App: die endgültige HTTPS-Domain

Die produktive Domain muss als Site URL beziehungsweise erlaubte Redirect URL in Supabase Auth hinterlegt sein.

## Echten KI-Coach aktivieren

Die Serverfunktion befindet sich unter `api/coach.js` und ist für eine Serverless-Bereitstellung wie Vercel ausgelegt.

1. `.env.example` als Vorlage verwenden.
2. `OPENAI_API_KEY` ausschließlich als serverseitige Umgebungsvariable eintragen.
3. Optional `OPENAI_MODEL` überschreiben. Standard ist `gpt-5`.
4. Das Projekt über eine Plattform bereitstellen, die den Ordner `api/` als Serverfunktion ausführt.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5
```

Der API-Schlüssel darf niemals als `VITE_OPENAI_API_KEY` oder anderweitig im Frontend gespeichert werden. Die Serverfunktion sendet Anfragen mit `store: false` und erzwingt eine strukturierte JSON-Ausgabe für Rückfrage, Mikrofeedback und Bewertung.

## Prüfung

```bash
npm run lint
npm run build
```

Die GitHub-Actions-Prüfung kann zusätzlich manuell über den Workflow `SpeechCoach CI` gestartet werden. Sie ist nicht automatisch aktiv, solange das GitHub-Konto keine Actions-Runner starten kann.

## Datenschutz und technische Grenzen

Die Audioaufnahme des Audio-Labors bleibt im Browser und wird nur für die aktuelle Ergebnissitzung als temporäre Objekt-URL vorgehalten. Lokal und in der Cloud werden ausschließlich die Audio-Kennzahlen gespeichert. Die browserbasierte Lautstärke- und Pausenanalyse ist ein Trainingsindikator und keine medizinische oder logopädische Beurteilung.

Transkripte werden erst dann in neue Cloud-Sitzungen aufgenommen, wenn der Nutzer die entsprechende Kontooption ausdrücklich aktiviert. Bereits ohne Transkript synchronisierte Sitzungen werden nicht nachträglich verändert.

Die optionale Live-Transkription hängt von der Web Speech Recognition API des Browsers ab. Für spätere Ausbaustufen sind zusätzlich vorgesehen:

- zuverlässiger serverseitiger Speech-to-Text-Dienst mit Zeitstempeln
- Tonhöhen- und Intonationsanalyse
- Konto-Wiederherstellung und Passwortänderung innerhalb der App
- adaptive mehrwöchige Trainingspläne
- mehrpersonige Simulationen
