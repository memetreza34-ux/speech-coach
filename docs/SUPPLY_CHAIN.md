# SpeechCoach Supply-Chain-Härtung

Dieses Dokument ist Teil der verbindlichen Release-Anleitung. Ziel ist, externe Build- und Runtime-Abhängigkeiten reproduzierbar, nachvollziehbar und möglichst unveränderlich zu beziehen.

## 1. Aktueller Runtime-Stand

Supabase wird im Browser derzeit noch bewusst über einen exakt versionierten ESM-CDN-Pfad geladen:

```text
https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/+esm
```

Solange dieser Übergangszustand besteht, müssen gleichzeitig alle folgenden Bedingungen gelten:

- Version ist exakt `2.111.0`, kein Range und kein `latest`.
- `getCloudConfiguration()` meldet ebenfalls `sdkVersion: '2.111.0'`.
- CSP erlaubt `https://cdn.jsdelivr.net` nur in `script-src`.
- OpenAI ist kein direkter Browser-`connect-src`.
- keine weiteren ungeplanten Runtime-CDNs werden eingeführt.
- `tests/supply-chain.test.mjs` bleibt grün.

## 2. Zielzustand für Supabase

Nach einem funktionierenden Preview soll der CDN-Import entfernt werden.

Verbindliche Reihenfolge:

1. `@supabase/supabase-js` exakt auf `2.111.0` als normale Runtime-Dependency eintragen.
2. `package-lock.json` mit npm reproduzierbar aktualisieren.
3. `npm ci` mit dem neuen Lockfile erfolgreich ausführen.
4. `supabaseClient.js` auf normalen statischen Package-Import umstellen.
5. jsDelivr aus `Content-Security-Policy` entfernen.
6. `npm run check` vollständig ausführen.
7. Preview deployen.
8. Registrierung, Login, Magic Link, Recovery und Session Refresh testen.
9. Cloud-Sync mit zwei Konten testen.
10. Account-Race-Matrix erneut durchführen.

Keinen Package-only- oder Lockfile-only-Zwischenzustand committen, der `npm ci` inkonsistent macht.

## 3. GitHub Actions

GitHub Actions dürfen nicht über mutable Major-Tags wie `@v4`, `@v7` oder `@main` bezogen werden.

Aktuell verifizierte Pins:

- `actions/checkout` v7.0.1 → `3d3c42e5aac5ba805825da76410c181273ba90b1`
- `actions/setup-node` v7.0.0 → `820762786026740c76f36085b0efc47a31fe5020`

Die Workflows enthalten den Commit-SHA und direkt daneben den menschenlesbaren Versionskommentar.

Bei einem Action-Update:

1. neue offizielle Release-Version prüfen,
2. Tag auf den exakten Commit-SHA auflösen,
3. Release-/Commit-Herkunft verifizieren,
4. SHA und Versionskommentar gemeinsam aktualisieren,
5. `tests/supply-chain.test.mjs` entsprechend aktualisieren,
6. CI/Deployment-Smoke danach real ausführen.

## 4. npm / Lockfile

Vor Release:

- `package-lock.json` muss vorhanden sein.
- `lockfileVersion` bleibt auf dem vom aktuellen npm erzeugten unterstützten Format; aktuell Version 3.
- Root-`dependencies` und `devDependencies` im Lockfile müssen exakt zum `package.json` passen.
- `npm ci` muss ohne Lockfile-Neuschreiben funktionieren.
- keine absichtlichen uncommitteten Lockfile-Änderungen.
- keine Dependency-Specs `latest` oder `*`.
- keine direkten `http:`, `https:`, `git:`, `git+`, `github:`, `file:` oder `link:` Specs im Manifest.
- neue Runtime-Abhängigkeiten nur mit klarer Produktnotwendigkeit.
- keine Secrets oder privaten Registry-Tokens in Repo-Dateien.
- Dependency-Updates dürfen nicht nur wegen einer Versionsnummer erfolgen; Auth, Audio, Build und Browser-Flows müssen danach erneut geprüft werden.

## 5. Automatische Gates

`tests/supply-chain.test.mjs` schützt:

- Root-Konsistenz zwischen `package.json` und `package-lock.json`,
- keine floating/external npm-Specs,
- zwei erlaubte Supabase-Zustände,
- immutable GitHub-Action-Pins.

### Supabase-Übergangszustand

- keine Supabase-npm-Dependency,
- exakt gepinnter jsDelivr-Pfad `2.111.0`,
- passender jsDelivr-CSP-Host.

### Supabase-Zielzustand

- exakt gepinnte npm-Dependency `2.111.0`,
- normaler `@supabase/supabase-js`-Import,
- kein jsDelivr im Client,
- kein jsDelivr in CSP.

Zusätzlich schützt der Test beide GitHub-Workflows gegen mutable `actions/checkout@v*`- und `actions/setup-node@v*`-Referenzen.

## 6. Release-Gate

Supply Chain gilt erst als bestanden, wenn:

- `npm ci` real erfolgreich ausgeführt wurde,
- `npm run check` real erfolgreich ausgeführt wurde,
- Supply-Chain-Tests grün sind,
- `package.json` und Lockfile konsistent sind,
- GitHub Actions auf verifizierte Commit-SHAs gepinnt sind,
- CSP dem tatsächlich genutzten Runtime-Modell entspricht,
- keine ungeplanten externen Runtime-Script-Hosts vorhanden sind,
- der aktuelle Supabase-Modus im Preview real funktioniert.

Bis dahin bleibt der PR Draft.
