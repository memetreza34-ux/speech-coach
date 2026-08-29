import test from 'node:test'
import assert from 'node:assert/strict'

import {
  analyseContentQuality,
  buildInterviewQuestions,
  buildPresentationQuestions,
  createBaselineProfile,
  QUICK_DRILLS,
} from '../src/contentAnalysis.js'

test('content analysis rewards concrete structured speech over vague repetition', () => {
  const strong = analyseContentQuality(
    'Meine Hauptaussage ist klar. Zuerst brauchen wir einen einfachen Prozess. Zum Beispiel sparen wir damit 20 Minuten pro Auftrag. Deshalb sollten wir den Ablauf ab Montag testen. Abschließend ist der nächste Schritt eine zweiwöchige Pilotphase.',
    { durationMs: 45_000 },
  )
  const weak = analyseContentQuality(
    'Ich glaube eigentlich irgendwie, dass das vielleicht ganz gut wäre. Ich glaube eigentlich irgendwie, dass das vielleicht ganz gut wäre. Also ich denke, man könnte das vielleicht machen.',
    { durationMs: 45_000 },
  )

  assert.ok(strong.overall > weak.overall)
  assert.ok(strong.structure > weak.structure)
  assert.ok(strong.precision > weak.precision)
  assert.equal(strong.hasExample, true)
  assert.equal(strong.hasCallToAction, true)
  assert.ok(weak.hedgeCount >= 4)
})

test('baseline profile exposes bounded communication skills and weakest areas', () => {
  const profile = createBaselineProfile(
    'Zuerst nenne ich meinen wichtigsten Punkt. Zum Beispiel konnte ich eine Aufgabe schneller lösen, weil ich die Arbeit vorher geplant habe. Deshalb würde ich diese Methode wieder verwenden.',
    60_000,
  )

  assert.equal(typeof profile.overall, 'number')
  assert.equal(profile.weakest.length, 2)
  for (const value of Object.values(profile.skills)) {
    assert.ok(value >= 0 && value <= 100)
  }
})

test('interview builder derives role-specific questions without requiring AI', () => {
  const result = buildInterviewQuestions(
    'Ausbildung Elektroniker Betriebstechnik. Erfahrung mit Wartung, Instandhaltung, Schaltanlagen und Teamarbeit.',
    'Gesucht wird ein Elektroniker für Betriebstechnik mit Erfahrung in Instandhaltung, Automatisierung, Schaltanlagen und Dokumentation.',
  )

  assert.equal(result.questions.length, 6)
  assert.ok(result.jobKeywords.length > 0)
  assert.ok(result.questions.some((question) => question.includes('konkretes Beispiel') || question.includes('Erfahrungen')))
})

test('presentation builder creates challenge questions and a release-ready checklist', () => {
  const result = buildPresentationQuestions('Unsere App reduziert Wartezeiten. Der größte Nutzen ist eine schnellere Bearbeitung und weniger Rückfragen im Support.')

  assert.equal(result.questions.length, 5)
  assert.equal(result.checklist.length, 5)
  assert.ok(result.questions.some((question) => question.includes('Einwand')))
  assert.ok(result.checklist.some((item) => item.includes('nächsten Schritt')))
})

test('quick drill catalog remains compact and useful', () => {
  assert.ok(QUICK_DRILLS.length >= 6)
  assert.ok(QUICK_DRILLS.every((drill) => drill.title && drill.duration && drill.instruction))
})
