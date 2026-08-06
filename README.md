# SpeechCoach

SpeechCoach ist ein deutschsprachiges Kommunikations-Gym für freie Rede, Argumentation, verständliches Erklären, Bewerbungsgespräche, schwierige Gespräche und Präsentationen.

## Aktueller Funktionsumfang

- sechs Trainingsbereiche mit kuratierten Aufgaben
- eigenes Thema oder zufälliges Thema
- wählbare Dauer: 30 Sekunden, 1 Minute oder 2 Minuten
- Browser-Spracherkennung mit Live-Transkript
- automatische Beendigung nach Ablauf der Zeit
- Analyse von Sprechtempo, Füllwörtern, Wortanzahl und Wortvielfalt
- konkrete Stärken und nächste Verbesserungsschritte
- Wiederholung desselben Themas
- lokaler Trainingsverlauf im Browser

## Entwicklung

```bash
npm install
npm run dev
```

## Prüfung

```bash
npm run lint
npm run build
```

## Technischer Hinweis

Die aktuelle MVP-Version nutzt die Web Speech Recognition API des Browsers. Für eine produktionsreife Version sind eine eigene Audioaufnahme, zuverlässige Speech-to-Text-Verarbeitung und ein Backend für echte KI-Auswertungen vorgesehen.
