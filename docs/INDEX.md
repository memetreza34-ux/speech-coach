# SpeechCoach Dokumentationsindex

Diese Datei ist der Einstiegspunkt für die vollständige A-bis-Z-Anleitung.

## Zuerst lesen

1. `MASTER_ROADMAP.md` — Produktziel, Umfang, Prioritäten, Release-Reihenfolge
2. `PRODUCT_SPEC.md` — konkrete Feature-Anforderungen und Akzeptanzkriterien
3. `PRODUCTION_CHECKLIST.md` — verbindliche manuelle Release-Prüfung

## Qualität

- `AI_EVALUATION.md` — Qualität und Sicherheit der KI-Coaches
- `PITCH_CALIBRATION.md` — reale Audio-/Pitch-Kalibrierung
- `ACCESSIBILITY.md` — Keyboard, Screenreader, Mobile, Reduced Motion

## Sicherheit und Betrieb

- `API_SECURITY.md` — API-Schutz, Origin-Prüfung, Limits, Request-IDs
- `OPERATIONS_RELEASE.md` — Kosten, Monitoring, Browser-E2E, CSP/Supply Chain
- `DEPLOYMENT.md` — Vercel/Supabase/OpenAI Deployment und Remote-Smoke

## Recht und Daten

- `LEGAL_DATA_RELEASE.md` — Dateninventar, Speicherung, Löschung und rechtliches Release-Gate

## Reihenfolge bis v1

1. P0-Funktionen stabilisieren.
2. `npm run check` real grün bekommen.
3. Preview deployen.
4. Browser-/Geräte-E2E.
5. AI-Evaluation.
6. Audio-/Pitch-Kalibrierung.
7. Legal-/Data-Gate.
8. Kosten-/Monitoring-/WAF-Gate.
9. Production deployen.
10. finalen Remote-Smoke durchführen.
11. erst dann Draft-PR freigeben/mergen.
