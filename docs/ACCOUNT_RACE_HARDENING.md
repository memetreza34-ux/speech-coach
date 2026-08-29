# SpeechCoach Account-/Cloud-Race-Härtung

Dieses Dokument ist ein verbindlicher Teil des Release-Gates. Ziel ist, dass asynchrone Antworten eines alten Kontos niemals den sichtbaren Zustand, lokale Daten oder Sync-Zustand eines neu aktiven Kontos überschreiben.

## Bedrohungsmodell

Besonders kritisch sind schnelle Wechsel während laufender Netzwerkoperationen:

- Konto A lädt sein Profil, während Konto B aktiviert wird.
- Konto A synchronisiert Sessions, während der Browser bereits Konto B zeigt.
- Konto A exportiert Daten, während auf Konto B gewechselt wird.
- Konto A pausiert Sync oder löscht lokale Daten, während Konto B aktiv wird.
- Konto A wird gelöscht, während inzwischen eine andere Sitzung aktiv ist.

Ohne Guards könnten alte Promises nach ihrem `await` noch generische LocalStorage-Keys oder React-State verändern.

## Implementierte Schutzschichten

### 1. Aktiver Local-Owner

`src/cloud/accountRaceGuard.js` definiert den aktuell aktiven lokalen Account als verbindlichen Schreibkontext.

Stale Operationen werden als `AbortError` mit `STALE_ACCOUNT_CONTEXT` beendet.

### 2. Cloud-Sync

`syncTrainingData()` prüft den Account:

1. vor Beginn,
2. nach einem Upload-Await,
3. nach dem Download-Await und unmittelbar vor lokalen Merge-Writes.

Wenn inzwischen ein anderer Owner aktiv ist, werden weder generische Trainings-Histories noch der Sync-State überschrieben.

### 3. Profil-Cache

`loadOrCreateProfile()` und `updateCloudProfile()` schreiben das geladene Profil nur dann in den lokalen Profil-Cache, wenn derselbe Nutzer noch aktiv ist.

### 4. Auth-Hydration

`AuthContext` verwendet eine Hydration-Generation. Eine ältere Hydration darf nach einem neueren Auth-Ereignis keinen User-/Profile-State mehr setzen.

Das sichtbare Profil wird zusätzlich nur bereitgestellt, wenn `profile.userId === user.id` gilt.

### 5. Sync-Promises pro Account

Ein laufender Sync wird zusammen mit seiner `userId` verfolgt. Ein Sync von Konto A darf nicht als Promise für Konto B wiederverwendet werden. Ein älterer Promise darf beim Abschluss außerdem keinen neueren Sync-Handle löschen.

### 6. Destruktive Operationen

Nach asynchronen Schritten wird die Account-Zugehörigkeit erneut geprüft, bevor lokale Daten gelöscht oder globaler Account-State zurückgesetzt wird.

Ein bereits serverseitig gelöschtes, inzwischen aber nicht mehr aktives Konto darf nur seine eigenen gespeicherten Artefakte entfernen; es darf das aktuell aktive Konto nicht abmelden oder dessen generische Stores leeren.

## Automatische Regressionstests

Verbindlich:

- `tests/account-race-guard.test.mjs`
- `tests/cloud-account-race.test.mjs`
- `tests/auth-context-race.test.mjs`

Der Cloud-Race-Test simuliert ausdrücklich einen verzögerten Download von Konto A, wechselt während des `await` auf Konto B und prüft, dass Bs Verlauf und Sync-State unverändert bleiben.

## Manuelle Preview-Tests

Vor Production mit zwei Wegwerf-Konten A und B durchführen.

### A. Wechsel während Profil-Hydration

1. DevTools Netzwerk drosseln.
2. Konto A anmelden.
3. Während Profil-Laden direkt zu Konto B wechseln.
4. Prüfen: Zu keinem Zeitpunkt wird As Profil als Bs Profil angezeigt.
5. Nach Abschluss ist nur Bs Profil sichtbar.

### B. Wechsel während Sync

1. Konto A mit eindeutigem Solo-Training vorbereiten.
2. Sync auslösen.
3. Während des Requests Konto B aktivieren.
4. Prüfen: Bs lokale History enthält keine A-Session.
5. Prüfen: Bs Sync-State wird nicht von As altem Promise überschrieben.

### C. Wechsel während Export

1. Export für Konto A starten.
2. Vor Abschluss zu Konto B wechseln.
3. Die alte Exportoperation muss kontrolliert abbrechen.
4. Es darf kein Export entstehen, der A-Cloud-Daten mit B-Local-Daten mischt.

### D. Wechsel während „lokale Daten löschen“

1. Aktion für Konto A starten.
2. Während des vorausgehenden Cloud-Updates Konto B aktivieren.
3. Prüfen: Bs lokale Trainingsdaten bleiben bestehen.

### E. Wechsel während Account-Löschung

1. Konto A löschen.
2. Falls technisch reproduzierbar, während der Serveroperation Konto B aktivieren.
3. Prüfen: Konto B bleibt angemeldet.
4. Prüfen: Bs Verlauf, Baseline, Plan und Profil bleiben erhalten.

## Release-Bedingung

Production ist blockiert, wenn irgendeine alte Account-Operation nach einem Kontowechsel:

- fremde lokale Histories schreibt,
- ein falsches Profil sichtbar macht,
- den Sync-State des neuen Accounts überschreibt,
- Daten des neuen Accounts löscht,
- oder den neuen Account abmeldet.

Race-Abbrüche dürfen als erwartete Navigation-/Kontextabbrüche behandelt werden und sollen nicht als normale Serverfehler erscheinen.
