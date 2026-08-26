# SpeechCoach Accessibility

Diese Datei dokumentiert die bereits im Code verankerten Accessibility-Maßnahmen und die manuellen Prüfungen, die vor Produktionsfreigabe noch erforderlich sind.

## Bereits im Code verankert

### Tastatur und Fokus

`src/RootApp.jsx` verwaltet die sieben Vollbildbereiche zentral:

- Konto & Cloud
- Vier-Wochen-Plan
- Fortschritt
- Training Lab
- Audio-Labor Pro
- Team-Coach
- Live-Coach

Beim Öffnen wird der Fokus auf das erste verfügbare Bedienelement der neuen Ansicht gesetzt.

`Escape` schließt die aktive Vollbildansicht.

Die sieben Launcher besitzen stabile `data-focus-key`-Kennungen. Dadurch wird nach dem Schließen nicht versucht, auf eine bereits ungemountete DOM-Referenz zurückzukehren. Stattdessen wird der entsprechende neu gerenderte Launcher gesucht und fokussiert.

Wenn keine passende Fokus-ID vorhanden ist, wird auf den ersten Haupt-Launcher zurückgefallen.

Während eine Vollbildansicht aktiv ist, wird das Scrollen des Hintergrunds über `body.style.overflow = 'hidden'` unterbunden.

### Screenreader-Status

Ein visuell versteckter `aria-live="polite"`-Bereich meldet den Wechsel zwischen Hauptansicht und den sieben Vollbildbereichen.

Die Oberfläche verwendet bei reinen Icon-Aktionen wie Zurück, Schließen und Sprachausgabe beschreibende `aria-label`-Texte an den zentralen Headern.

Das Training Lab ist als modaler Dialog ausgezeichnet und seine Eingabefelder besitzen sichtbare Labels.

### Sichtbarer Fokus

`src/accessibility.css` setzt einen klaren `:focus-visible`-Ring für:

- Buttons
- Links
- Inputs
- Textareas
- Selects
- explizit fokussierbare Elemente

Die Markierung erscheint nur bei Tastatur-/Focus-Visible-Nutzung und verändert den normalen Pointer-Zustand nicht.

### Reduced Motion

SpeechCoach respektiert die Betriebssystem-/Browser-Einstellung `prefers-reduced-motion` auf zwei Ebenen.

1. `MotionConfig reducedMotion="user"` gilt global für Framer Motion.
2. `src/accessibility.css` reduziert CSS-Animationen, Übergänge und Smooth-Scrolling für Nutzer mit aktivierter Reduced-Motion-Präferenz.

Die Launcher-Hover-/Tap-Animationen werden zusätzlich explizit deaktiviert, wenn Framer Motion Reduced Motion meldet. Die Baseline-Mikrofonanimation im Training Lab wird bei Reduced Motion ebenfalls deaktiviert.

### Touch-Ziele

Auf Geräten mit grobem Pointer werden zentrale Icon-Buttons auf mindestens 44 × 44 Pixel angehoben. Der Training-Lab-Schließen-Button ist ebenfalls mindestens 44 × 44 Pixel groß.

## Automatische Repository-Gates

`scripts/smoke-check.mjs` beziehungsweise die Node-Test-Suite müssen dauerhaft schützen:

- `src/accessibility.css`
- globales `MotionConfig reducedMotion="user"`
- Escape-Unterstützung
- stabile Launcher-Fokus-IDs
- `aria-live="polite"`
- sichtbare `:focus-visible`-Styles
- CSS-Fallback für `prefers-reduced-motion`
- mindestens 44 Pixel große zentrale Icon-Touch-Ziele
- Training Lab bleibt als zugänglicher Vollbildbereich verdrahtet

Diese Checks verhindern versehentliches Entfernen der zentralen Accessibility-Grundlage.

## Vor Release manuell prüfen

Automatische Sourcechecks ersetzen keine reale Bedienprüfung.

### Nur Tastatur

Auf Desktop mindestens vollständig ohne Maus durchführen:

1. Hauptseite öffnen.
2. Mit `Tab` alle sieben Launcher erreichen.
3. Jeden Launcher mit `Enter` oder `Space` öffnen.
4. Prüfen, dass der Fokus sichtbar in der neuen Ansicht landet.
5. Alle primären Formulare und Aktionen mit Tab/Shift+Tab bedienen.
6. `Escape` drücken.
7. Prüfen, dass der Fokus auf dem ursprünglichen Launcher landet.
8. Einen Trainingsbereich aus einem anderen Vollbildbereich heraus öffnen und danach wieder schließen.

Im Training Lab zusätzlich:

- Baseline starten/stoppen
- Solo-Session im Select auswählen
- CV-/Stellenanzeigen-Textareas bedienen
- Textdatei-Auswahl per Tastatur erreichen
- Präsentationsnotizen eingeben
- alle drei Zielbuttons der Mini-Drills erreichen

Kein wichtiger Fokus darf unsichtbar werden oder in nicht sichtbare Inhalte springen.

### Screenreader

Mindestens mit einem real verfügbaren Desktop-Screenreader prüfen:

- Wechsel der Hauptansicht wird sinnvoll angekündigt.
- Überschriften ergeben eine verständliche Struktur.
- Icon-Buttons haben verständliche Namen.
- Formfelder können eindeutig erkannt werden.
- Fehlertexte und Statusänderungen sind nachvollziehbar.
- Coach- und Team-Nachrichten werden in sinnvoller Lesereihenfolge erreicht.
- Training-Lab-Baseline und Builder-Felder werden verständlich benannt.

### Reduced Motion

Im Betriebssystem oder Browser `prefers-reduced-motion: reduce` aktivieren und prüfen:

- keine unnötigen Launcher-Bewegungen
- keine pulsierende Baseline-Animation
- keine kritischen Informationen nur durch Animation vermittelt
- Navigation bleibt vollständig funktionsfähig
- Ladeindikatoren und Statuswechsel bleiben verständlich

### Mobile und Touch

Mindestens auf 360 px, 390/430 px und Tablet testen:

- alle sieben Hauptlauncher bleiben erreichbar
- Icon-Aktionen sind ohne präzises Zielen erreichbar
- sichtbarer Fokus verursacht keine unbrauchbaren Layoutsprünge
- Bildschirmtastatur verdeckt wichtige Eingaben und Absendeaktionen nicht dauerhaft
- Scroll-Lock einer Vollbildansicht verhindert kein notwendiges internes Scrollen
- Training-Lab-Builder wechseln auf einspaltiges Layout
- keine horizontale Pflichtnavigation auf 360 px

## Nicht behaupten ohne echten Test

Vor einem manuellen Screenreader-/Hardware-Test darf nicht behauptet werden, dass SpeechCoach vollständig WCAG-konform oder barrierefrei zertifiziert ist.

Die aktuelle Implementierung ist eine technische Accessibility-Härtung mit automatischen Regression-Gates. Die endgültige Freigabe benötigt weiterhin reale Keyboard-, Screenreader-, Reduced-Motion- und Mobile-Tests.
