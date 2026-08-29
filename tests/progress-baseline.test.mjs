import test from 'node:test'
import assert from 'node:assert/strict'

import { readProgressData } from '../src/progressUtils.js'

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
    clear() { values.clear() },
  }
}

test('baseline initializes missing skills without counting as a completed session', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-baseline': JSON.stringify({
      overall: 68,
      skills: { pace: 70, fillerControl: 62, clarity: 66, structure: 58, impact: 74 },
    }),
    'speech-coach-history': '[]',
    'speech-coach-dialog-history': '[]',
    'speech-coach-audio-history': '[]',
  })

  try {
    const progress = readProgressData()
    assert.equal(progress.sessions.length, 0)
    assert.equal(progress.streak, 0)
    assert.equal(progress.overall, 68)
    assert.equal(progress.skills.pace, 70)
    assert.equal(progress.skills.structure, 58)
    assert.equal(progress.skills.voiceDynamics, null)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('real measured skills override baseline while unmeasured skills can still use it', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-baseline': JSON.stringify({
      overall: 60,
      skills: { pace: 55, fillerControl: 50, clarity: 64, structure: 57, impact: 61 },
    }),
    'speech-coach-history': JSON.stringify([{
      id: 'solo-one',
      topic: { title: 'Test' },
      mode: { title: 'Freies Sprechen' },
      createdAt: '2026-08-20T10:00:00.000Z',
      durationMs: 60_000,
      analysis: { score: 82, wpm: 130, fillersPerMinute: 1 },
    }]),
    'speech-coach-dialog-history': '[]',
    'speech-coach-audio-history': '[]',
  })

  try {
    const progress = readProgressData()
    assert.equal(progress.sessions.length, 1)
    assert.equal(progress.skills.pace, 100)
    assert.equal(progress.skills.fillerControl, 91)
    assert.equal(progress.skills.clarity, 64)
    assert.equal(progress.skills.structure, 57)
    assert.equal(progress.overall, 82)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})
