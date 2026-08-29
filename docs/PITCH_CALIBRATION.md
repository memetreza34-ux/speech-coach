# SpeechCoach Pitch Calibration

Diese Datei beschreibt die technische Kalibrierung der lokalen Tonhöhen-, Intonations- und Sprechmelodieanalyse. Die Kennzahlen sind Trainingsindikatoren und keine medizinische, logopädische oder biometrische Diagnose.

## Ziel

Die Pitch-Auswertung soll echte stimmliche Bewegung erkennen, ohne Mikrofonrauschen, kurze F0-Jitterspitzen oder einzelne Oktavfehler als Sprechmelodie zu belohnen.

## Aktuelle Verarbeitung

`src/pitchAnalysis.js` verwendet weiterhin eine lokale F0-Schätzung aus dem dekodierten Audioblob:

- Mono-Mix
- Downsampling auf ungefähr 8 kHz
- ungefähr 80-ms-Analysefenster
- ungefähr 40-ms-Hop
- Autokorrelation im Bereich 65–420 Hz
- Mindestkorrelation 0,56
- energieabhängige Auswahl stimmhafter Frames

Danach wird die Rohkurve zusätzlich stabilisiert.

### 1. Isolierte Oktavsprünge

Ein einzelner Messpunkt wird nur dann auf die benachbarte Oktave korrigiert, wenn:

- vorheriger und nächster Punkt lokal nah beieinander liegen,
- der aktuelle Punkt deutlich davon abweicht,
- Halbieren oder Verdoppeln des aktuellen Frequenzwerts ihn plausibel in die lokale Kurve zurückführt.

Damit sollen typische einzelne 2×-/0,5×-F0-Fehler reduziert werden, ohne längere echte Tonhöhenwechsel pauschal zu glätten.

### 2. Jitter-Stabilisierung

Die Tonhöhenkurve wird vor Bereichs-, Variations- und Richtungswechselanalyse mit einem kleinen Medianfenster geglättet. Richtungswechsel zählen erst ab einer Mindestbewegung von 0,55 Halbtönen.

Dadurch sollen kleine Frame-zu-Frame-Schwankungen nicht künstlich als lebhafte Sprechmelodie gewertet werden.

### 3. Messvertrauen

Die Auswertung liefert zusätzlich:

- `averageConfidence`: mittlere Autokorrelationsqualität der erkannten Pitch-Frames
- `voicedFrameRatio`: Anteil stabil erkannter Pitch-Frames an allen Analyseframes
- `octaveCorrectionCount`: Zahl korrigierter isolierter Oktavpunkte
- `analysisConfidence`: zusammengefasster Wert 0–100
- `quality`: `high`, `medium` oder `low`

Eine niedrige Pitch-Confidence reduziert den Einfluss der Pitch-Scores auf die kombinierte Audioauswertung. Unsichere Tonhöhendaten sollen dadurch nicht denselben Einfluss wie eine stabile Messung erhalten.

## Automatische Regressionstests

`tests/core.test.mjs` enthält deterministische synthetische Tests für:

1. einzelne Oktavfehler in einer ansonsten stabilen Kurve,
2. flachen Jitter gegenüber echter expressiver Auf-/Abbewegung,
3. hohe gegen niedrige Korrelations-/Voiced-Frame-Qualität,
4. geringeren Einfluss unsicherer Pitch-Werte auf den kombinierten Audio-Score.

Diese Tests prüfen die Mathematik ohne Mikrofon oder Web Audio API.

## Manuelle Kalibrierung vor Release

Automatische Tests ersetzen keine reale Aufnahmeprüfung.

Mindestens folgende Matrix auf einem echten Preview-Deployment durchführen.

### Stimmen

- tiefere Sprechstimme
- höhere Sprechstimme
- ruhige monotone Passage
- bewusst expressive Passage

Keine Person muss dafür identifiziert oder klassifiziert werden. Relevant ist nur, ob die technische Kurve plausibel auf unterschiedliche Frequenzlagen und Bewegungsmuster reagiert.

### Mikrofone

Mindestens:

- Laptop-/Desktop-Mikrofon
- Smartphone-Mikrofon
- Headset oder kabelgebundenes/USB-Mikrofon, falls verfügbar

### Umgebungen

- ruhiger Raum
- normaler Raum mit leichtem Hintergrundgeräusch
- größerer Abstand zum Mikrofon

## Erwartetes Verhalten

### Ruhige monotone Passage

- geringe Pitch-Variation
- wenige Richtungswechsel
- höheres Monotonie-Risiko als bei der expressiven Vergleichsaufnahme
- keine starke Melodiebewertung allein durch Frame-Jitter

### Expressive Passage

- sichtbar größere stabile Pitch-Bewegung
- plausibel mehr Richtungswechsel
- bessere Intonations-/Melodieindikatoren als bei derselben Person mit bewusst flacher Sprechweise

### Rauschen oder schlechte Aufnahme

- Messvertrauen darf sinken
- unsichere Pitch-Werte dürfen den Gesamtscore nicht überproportional verändern
- bei zu wenig stabilen stimmhaften Abschnitten wird Pitch als nicht verfügbar behandelt, während die übrige lokale Audioanalyse weiter funktioniert

### Oktavfehler

In einer ansonsten gleichmäßigen Kurve darf ein einzelner ungefähr verdoppelter oder halbierter F0-Punkt nicht den gesamten Tonumfang beziehungsweise die Sprechmelodie dominieren.

## Grenzen

Pitch-Werte hängen unter anderem von Stimme, Mikrofon, Raum, Abstand, Kompression und Aufnahmeformat ab. Deshalb dürfen konkrete Hz-Werte oder daraus abgeleitete Scores nicht als medizinische Aussage, Identitätsmerkmal oder allgemeingültige Qualitätsnorm interpretiert werden.

Vor Production bleiben reale Kalibrierung mit mehreren Stimmen und Geräten sowie ein Vergleich der Ergebnisse mit dem hörbaren Eindruck verpflichtend.
