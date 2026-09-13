# Speech Coach

React + Vite App für Sprechtraining mit KI-Feedback.

## Architektur

Die Anwendung besteht aus einem React-Frontend (SPA) und einem Express.js-Backend. 
Die Gemini-KI-Analyse läuft geschützt server-seitig über `server.js` — der API-Key wird nie an den Client ausgeliefert.
Zusätzlich werden Aufrufe über Firebase Auth ID-Tokens authentifiziert und via Rate-Limiting geschützt.

## Lokale Entwicklung

1. `.env.example` nach `.env.local` kopieren.
2. `GEMINI_API_KEY` in `.env.local` eintragen.
3. Server und Frontend starten:
   ```bash
   npm run dev
   ```
   (Dies startet den Express-Server, der Vite als Middleware für das Frontend einbindet.)

## Produktion (Cloud Run / Docker)

```bash
npm run build
npm start
```
Der Express-Server liefert dann das gebaute Frontend aus dem `dist`-Ordner aus und stellt die `/api`-Routen zur Verfügung.
