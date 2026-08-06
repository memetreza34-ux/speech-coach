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
- Speicherung der Kennzahlen im lokalen Fortschrittsverlauf

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
- aktuelle Trainingsserie und Wochenziel
- Sprechzeit, Übungsanzahl und häufigster Trainingsbereich
- Fähigkeitenprofil für Tempo, Füllwortkontrolle, Klarheit, Struktur, Wirkung, Stimm-Dynamik und Pausengestaltung
- Aktivitätsübersicht für die letzten sieben Tage
- filterbarer Verlauf für Solo-, Audio- und Dialogtrainings
- automatische Erkennung des schwächsten verfügbaren Bereichs
- passende nächste Trainingsempfehlung mit direktem Einstieg

## Entwicklung

```bash
npm install
npm run dev
```

Der normale Vite-Entwicklungsserver verwendet für den Live-Coach automatisch den lokalen Ersatzmodus, solange `/api/coach` nicht durch eine Serverless-Umgebung bereitgestellt wird.

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

Die Audioaufnahme des Audio-Labors bleibt im Browser und wird nur für die aktuelle Ergebnissitzung als temporäre Objekt-URL vorgehalten. Im lokalen Verlauf werden nur Kennzahlen gespeichert. Die browserbasierte Lautstärke- und Pausenanalyse ist ein Trainingsindikator und keine medizinische oder logopädische Beurteilung.

Die optionale Live-Transkription hängt von der Web Speech Recognition API des Browsers ab. Für eine spätere produktionsreife Version sind zusätzlich vorgesehen:

- zuverlässiger serverseitiger Speech-to-Text-Dienst mit Zeitstempeln
- Tonhöhen- und Intonationsanalyse
- Nutzerkonten und geräteübergreifend synchronisierter Fortschritt
- adaptive mehrwöchige Trainingspläne
- mehrpersonige Simulationen
