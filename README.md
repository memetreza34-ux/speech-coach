# Speech Coach

React + Vite App für Sprechtraining mit KI-Feedback.

## KI-Analyse (Gemini)

Der Gemini-Call läuft server-seitig über die Vercel Function [`api/analyze.js`](api/analyze.js) — der API-Key wird nie an den Client ausgeliefert.

- **Lokal:** `.env.example` nach `.env.local` kopieren, `GEMINI_API_KEY` eintragen, dann mit `vercel dev` starten (statt `npm run dev`), damit die `/api`-Route mitläuft. Ohne laufende Function fällt die App automatisch auf eine Dummy-Analyse zurück.
- **Deploy auf Vercel:** `GEMINI_API_KEY` als Environment Variable im Projekt-Dashboard setzen.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
