# SpeechCoach API Security

Diese Datei beschreibt die Schutzschichten für die kostenpflichtigen SpeechCoach-Serverendpunkte.

## Geschützte Endpunkte

- `POST /api/coach`
- `POST /api/team-coach`
- `POST /api/transcribe`

`GET /api/health` führt keine OpenAI-Anfrage aus und ist nicht Teil des kostenpflichtigen AI-Traffics.

## Schutzschicht 1: Anwendungscode

Alle drei AI-Endpunkte laufen zuerst durch `api/_security.js`.

Der Guard übernimmt:

- ausschließlich erlaubte HTTP-Methoden
- Same-Origin-Prüfung für Browser-Requests
- optionale zusätzliche Origin-Allowlist über `SPEECHCOACH_ALLOWED_ORIGINS`
- Request-Body-Größenlimit vor der fachlichen Payload-Prüfung
- Ablehnung eines explizit falschen Content-Type
- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- zufällige `X-Request-Id` pro Anfrage
- best-effort IP-Rate-Limit pro Serverinstanz
- `429 Too Many Requests` mit `Retry-After`

Aktuelle In-Code-Limits pro Minute und Client-Key:

| Endpunkt | Limit | Zweck |
| --- | ---: | --- |
| `/api/coach` | 18 | normale 1:1-Dialogrunden |
| `/api/team-coach` | 15 | größere Mehrpersonen-Antworten |
| `/api/transcribe` | 6 | teurere Audio-Transkription |

Der In-Code-Limiter verwendet Prozessspeicher. In einer horizontal skalierten Serverless-Umgebung ist er deshalb **keine globale Rate-Limit-Garantie**. Er ist eine zusätzliche Schutzschicht und ein kontrollierter Fallback.

## Schutzschicht 2: Produktions-WAF

Vor einem öffentlichen Release muss auf der Hosting-Plattform ein globales Rate-Limit für die kostenpflichtigen Endpunkte eingerichtet werden.

Für Vercel wird die Web Application Firewall verwendet. Ausgangswerte:

| Pfad | vorgeschlagene globale Grenze |
| --- | ---: |
| `/api/coach` | 20 Requests/Minute/IP |
| `/api/team-coach` | 18 Requests/Minute/IP |
| `/api/transcribe` | 8 Requests/Minute/IP |

Diese Werte sind Startwerte. Nach realem Traffic müssen False Positives, Kosten und legitime Trainingsgeschwindigkeit beobachtet und die Regeln angepasst werden.

Die WAF-Regeln sollen die Requests tatsächlich **Rate Limit / Deny** und nicht nur protokollieren.

Wenn die gewählte Hosting-/Tarifkonfiguration kein globales WAF-Rate-Limit unterstützt, ist vor Release ein verteilter Rate-Limiter über einen dafür geeigneten persistenten Dienst beziehungsweise Reverse Proxy erforderlich.

## Origin-Regeln

Normale SpeechCoach-Aufrufe erfolgen same-origin und brauchen keine zusätzliche Konfiguration.

Für absichtlich getrennte Frontends kann serverseitig eine kommaseparierte Allowlist gesetzt werden:

```env
SPEECHCOACH_ALLOWED_ORIGINS=https://speechcoach.example,https://preview.example
```

Die Origin-Prüfung ist **keine Authentifizierung**. Nicht-Browser-Clients können Origin-Header selbst setzen. Der eigentliche Missbrauchsschutz besteht aus WAF/Rate-Limit, Payload-Grenzen und serverseitig verborgenem OpenAI-Key.

## Request IDs und Logging

Jede geschützte API-Anfrage erhält eine zufällige Request-ID:

```text
X-Request-Id: <uuid>
```

Fehlerantworten enthalten dieselbe ID. Serverlogs dürfen diese ID, HTTP-Status und technische Fehlercodes enthalten.

Nicht protokollieren:

- Gesprächsinhalte
- vollständige Transkripte
- Audiodaten oder Base64-Audio
- Passwörter
- Supabase-Tokens
- OpenAI-Schlüssel

## Payload-Grenzen

Neben den Guard-Limits bleiben die fachlichen Grenzen aktiv:

### Live-Coach

- nur bekannte Trainingsmodus-IDs
- Thema maximal 240 Zeichen
- maximal 12 Gesprächsnachrichten
- maximal 12.000 Gesprächszeichen
- maximal 7 Runden

### Team-Coach

- nur sechs kanonische Szenario-IDs
- Thema maximal 240 Zeichen
- maximal 16 Gesprächsnachrichten
- maximal 15.000 Gesprächszeichen
- maximal 8 Runden
- Rollen werden serverseitig aus der kanonischen Szenarioliste bestimmt

### Transkription

- Audio maximal 3 MB vor Base64-Kodierung
- serverseitige Format-Allowlist
- Base64- und dekodierte Größe werden separat geprüft
- Kontext maximal 300 Zeichen
- Wort-Zeitmarken werden auf maximal 4.000 Einträge normalisiert

## Release-Prüfung

Vor Produktionsfreigabe:

1. `npm run check` erfolgreich ausführen.
2. `SPEECHCOACH_ALLOWED_ORIGINS` nur setzen, wenn zusätzliche Origins benötigt werden.
3. WAF-/verteilte Rate-Limits konfigurieren.
4. Mit normalem Traffic sicherstellen, dass Coach-Runden nicht unbeabsichtigt blockiert werden.
5. Testweise das Limit überschreiten und `429` + `Retry-After` bestätigen.
6. Fremden `Origin` gegen einen geschützten Endpunkt senden und `403` bestätigen.
7. Überdimensionierten Request senden und `413` bestätigen.
8. Prüfen, dass Fehlerantwort und Header dieselbe Request-ID enthalten.
9. Serverlogs kontrollieren: keine Gesprächs-, Audio- oder Secret-Daten.
10. OpenAI-Kosten-/Nutzungsmonitoring auf ungewöhnliche Spitzen beobachten.
