# SpeechCoach Deployment Runbook

Stand: 8. August 2026.

Dieses Runbook beschreibt den vorgesehenen Produktionsweg für SpeechCoach mit Vercel, Supabase und den serverseitigen OpenAI-Endpunkten.

## 1. Vercel-Projekt

Repository in Vercel importieren:

- Repository: `memetreza34-ux/speech-coach`
- Framework Preset: Vite
- Production Branch: `main`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: 22

`vercel.json` muss übernommen werden. Darin liegen die globalen Security-Header sowie Cache-Regeln für API- und Build-Assets.

## 2. Production-Environment-Variablen

Serverseitig:

```env
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-5
```

Frontend-safe:

```env
VITE_SUPABASE_URL=https://jmswsgwnvmvsfayeodcd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Optional bei absichtlich zusätzlichen Frontend-Origins:

```env
SPEECHCOACH_ALLOWED_ORIGINS=https://staging.example.com
```

Nicht anlegen:

```env
VITE_OPENAI_API_KEY=
```

Der OpenAI-Key darf ausschließlich serverseitig vorhanden sein.

## 3. Environment vor Release validieren

Für einen lokalen/CI-Check müssen die produktionsrelevanten Werte in der aktuellen Shell vorhanden sein:

```bash
SPEECHCOACH_PRODUCTION_URL=https://speechcoach.example \
OPENAI_API_KEY=... \
VITE_SUPABASE_URL=https://jmswsgwnvmvsfayeodcd.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=... \
npm run check:env
```

Der Validator blockiert unter anderem:

- fehlenden `OPENAI_API_KEY`
- gesetzten `VITE_OPENAI_API_KEY`
- fehlende Supabase-Frontend-Konfiguration
- nicht-HTTPS Production-URL
- nicht-HTTPS zusätzliche Origins
- offensichtlichen `service_role`-Key im Frontend

## 4. Supabase Auth URL Configuration

In Supabase unter Authentication -> URL Configuration:

### Site URL

Die exakte öffentliche Production-URL setzen, zum Beispiel:

```text
https://speechcoach.example
```

Nicht dauerhaft `localhost` als Site URL stehen lassen.

### Redirect URLs

Mindestens die exakte Production-URL erlauben:

```text
https://speechcoach.example/**
```

Lokale Vite-Entwicklung bei Bedarf:

```text
http://localhost:5173/**
```

Für Vercel Preview Deployments kann zusätzlich ein enges Wildcard-Muster verwendet werden:

```text
https://*-<team-or-account-slug>.vercel.app/**
```

Das Muster muss an den tatsächlichen Vercel Team-/Account-Slug angepasst werden. Für Production möglichst exakte Redirects statt breiter Wildcards verwenden.

SpeechCoach verwendet aktuell:

- Registrierung -> `window.location.origin`
- Magic Link -> `window.location.origin`
- Passwort-Recovery -> aktuelle App-URL mit `?recovery=1`

Damit müssen die verwendeten Origins/Redirects in Supabase erlaubt sein.

## 5. Supabase Datenbank und Edge Function

Vor Release prüfen:

- `speechcoach_profiles` vorhanden
- `speechcoach_sessions` vorhanden
- `speechcoach_training_plans` vorhanden
- RLS auf allen drei Tabellen aktiv
- Own-user Policies aktiv
- anonymer Tabellenzugriff entzogen
- Edge Function `delete-speechcoach-account` deployed
- Edge Function besitzt serverseitig die notwendigen Supabase-Admin-Rechte

Keine `service_role`-Credentials in Vite-/Browser-Variablen eintragen.

## 6. Deployment Protection für Preview

Preview-Deployments sollten nicht unnötig öffentlich sein.

Der Remote-Smoke-Test unterstützt geschützte Vercel-Previews über:

```env
VERCEL_AUTOMATION_BYPASS_SECRET=<secret>
```

Der Wert wird ausschließlich als `x-vercel-protection-bypass` Request-Header verwendet und niemals ausgegeben.

Im GitHub-Repository kann derselbe Wert als GitHub Actions Secret `VERCEL_AUTOMATION_BYPASS_SECRET` hinterlegt werden.

Wenn Vercel Trusted Sources/OIDC für die gewählte Konfiguration verfügbar ist, sollte diese kurzlebige Variante gegenüber einem langfristigen Bypass-Secret bevorzugt werden.

## 7. Globales AI-Rate-Limit

`api/_security.js` enthält nur eine zusätzliche per-Instance-Schutzschicht.

Vor öffentlichem Release muss eine global verteilte Begrenzung eingerichtet werden. Für Vercel ist die bevorzugte Variante eine WAF-Rate-Limit-Regel, sofern der verwendete Tarif dies unterstützt.

Startwerte:

| Pfad | globale Startgrenze |
| --- | ---: |
| `/api/coach` | 20 Requests/Minute/IP |
| `/api/team-coach` | 18 Requests/Minute/IP |
| `/api/transcribe` | 8 Requests/Minute/IP |

Die Regel muss tatsächlich Rate Limit/Deny/Challenge ausführen und darf nicht nur loggen.

Wenn im gewählten Vercel-Tarif kein globales Rate-Limiting verfügbar ist, vor Release einen persistenten verteilten Rate-Limiter oder gleichwertigen Reverse-Proxy-Schutz einsetzen.

## 8. Remote Deployment Smoke

Nach jedem Preview-/Production-Deployment:

```bash
SPEECHCOACH_TARGET_URL=https://speechcoach.example \
EXPECT_AI_CONFIGURED=true \
npm run test:deployment
```

Bei geschützter Vercel-Preview:

```bash
SPEECHCOACH_TARGET_URL=https://preview.example.vercel.app \
VERCEL_AUTOMATION_BYPASS_SECRET=... \
EXPECT_AI_CONFIGURED=true \
npm run test:deployment
```

Der Test prüft von außen:

- Startseite HTTP 200
- HTML/React-Root
- Security-Header
- HSTS auf HTTPS
- gebaute JS/CSS-Assets
- Immutable-Asset-Caching
- `/api/health`
- optionale OpenAI-Konfiguration
- GET -> 405 auf allen kostenpflichtigen AI-Endpunkten
- `Allow: POST`
- `X-Request-Id`
- `Cache-Control: no-store`
- fremder Origin -> 403
- falscher Content-Type -> 415
- übergroßer Coach-Body -> 413

Die negativen API-Tests stoppen vor dem OpenAI-Aufruf und erzeugen deshalb keine normale Coach-/Transkriptionsanfrage.

## 9. GitHub Deployment Smoke Workflow

Workflow:

```text
.github/workflows/deployment-smoke.yml
```

Manuell starten und angeben:

- `target_url`
- `expect_ai_configured`

Der Workflow braucht keine npm-Installation und keine Browser-Testbibliothek. Node 22 führt den HTTP-Smoke-Test direkt aus.

Bei geschützter Vercel-Preview optional das Repository Secret setzen:

```text
VERCEL_AUTOMATION_BYPASS_SECRET
```

## 10. Echtes E2E nach erfolgreichem Smoke

Der Remote-Smoke ersetzt nicht die Nutzerflows. Danach die `docs/PRODUCTION_CHECKLIST.md` abarbeiten, insbesondere:

1. Registrierung + E-Mail-Bestätigung
2. Login + Magic Link
3. Passwort-Recovery
4. Solo-Training
5. Live-Coach mit echtem OpenAI-Key
6. Team-Coach mit echtem OpenAI-Key
7. echte WebM/MP4/M4A-Präzisionstranskription
8. Audio-/Pitch-Kalibrierung
9. Zwei-Geräte-Sync
10. Datenexport/Löschung/Kontolöschung
11. Mobile/Desktop/Accessibility
12. WAF-Limit testweise überschreiten und 429 prüfen

## 11. Release-Reihenfolge

1. `npm ci`
2. `npm run check`
3. `npm run check:env`
4. Preview deployen
5. `npm run test:deployment` gegen Preview
6. manuelle E2E-Checkliste
7. globale WAF-/Distributed-Limits aktivieren/testen
8. Production deployen
9. `npm run test:deployment` gegen Production
10. erst danach Draft-PR für Review freigeben beziehungsweise mergen
