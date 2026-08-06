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

## Technischer Stand

Die Solo-Aufnahme verwendet aktuell die Web Speech Recognition API des Browsers. Für eine spätere produktionsreife Version sind zusätzlich vorgesehen:

- echte Audiodatei-Aufnahme mit Zeitstempeln
- zuverlässiger Speech-to-Text-Dienst
- Pausen-, Lautstärke- und Intonationsanalyse
- Nutzerkonten und synchronisierter Fortschritt
- personalisierte Trainingspläne
- mehrpersonige Simulationen
