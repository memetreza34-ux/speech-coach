import test from 'node:test'
import assert from 'node:assert/strict'

import {
  adoptGuestBaselineForActiveOwner,
  clearBaselineProfile,
  readBaselineProfile,
  saveBaselineProfile,
} from '../src/baselineStore.js'

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
    clear() { values.clear() },
  }
}

const profile = (overall) => ({
  createdAt: '2026-08-26T07:00:00.000Z',
  durationMs: 60_000,
  overall,
  transcript: 'Dieser Rohtext darf nicht persistiert werden.',
  content: { keywords: ['privat'] },
  skills: { pace: overall, fillerControl: 70, clarity: 71, structure: 72, impact: 73 },
  weakest: [{ key: 'fillerControl', value: 70 }, { key: 'clarity', value: 71 }],
})

test('baseline persistence strips raw transcript and content details', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage()
  try {
    const saved = saveBaselineProfile(profile(75))
    const raw = JSON.parse(global.localStorage.getItem('speech-coach-baseline'))
    assert.equal(saved.overall, 75)
    assert.equal('transcript' in raw, false)
    assert.equal('content' in raw, false)
    assert.equal(raw.skills.pace, 75)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('legacy guest baseline is sanitized before it can be shown or exported', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-baseline': JSON.stringify(profile(73)),
  })
  try {
    const loaded = readBaselineProfile()
    const raw = JSON.parse(global.localStorage.getItem('speech-coach-baseline'))
    assert.equal(loaded.overall, 73)
    assert.equal('transcript' in loaded, false)
    assert.equal('content' in loaded, false)
    assert.equal('transcript' in raw, false)
    assert.equal('content' in raw, false)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('signed-in baseline reads are sanitized and unknown skills are removed', () => {
  const previousStorage = global.localStorage
  const unsafe = {
    ...profile(77),
    skills: { ...profile(77).skills, secretMetric: 99 },
    weakest: [{ key: 'secretMetric', value: 99 }, { key: 'clarity', value: 62 }],
  }
  global.localStorage = createStorage({
    'speech-coach-active-local-owner': 'user-a',
    'speech-coach-user-baseline:user-a': JSON.stringify(unsafe),
  })
  try {
    const loaded = readBaselineProfile()
    const raw = JSON.parse(global.localStorage.getItem('speech-coach-user-baseline:user-a'))
    assert.equal('transcript' in loaded, false)
    assert.equal('content' in loaded, false)
    assert.equal('secretMetric' in loaded.skills, false)
    assert.equal('secretMetric' in raw.skills, false)
    assert.deepEqual(loaded.weakest, [{ key: 'clarity', value: 62 }])
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('guest baseline is claimed immediately once an account becomes active', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-baseline': JSON.stringify(profile(64)),
    'speech-coach-active-local-owner': 'user-a',
  })
  try {
    const adopted = adoptGuestBaselineForActiveOwner()
    assert.equal(adopted.overall, 64)
    assert.equal(global.localStorage.getItem('speech-coach-baseline'), null)
    assert.ok(global.localStorage.getItem('speech-coach-user-baseline:user-a'))

    global.localStorage.setItem('speech-coach-active-local-owner', 'user-b')
    assert.equal(adoptGuestBaselineForActiveOwner(), null)
    assert.equal(readBaselineProfile(), null)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('first signed-in owner adopts an anonymous baseline without cross-account leakage', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-baseline': JSON.stringify(profile(61)),
    'speech-coach-active-local-owner': 'user-a',
  })
  try {
    const adopted = readBaselineProfile()
    assert.equal(adopted.overall, 61)
    assert.equal(global.localStorage.getItem('speech-coach-baseline'), null)
    assert.ok(global.localStorage.getItem('speech-coach-user-baseline:user-a'))

    global.localStorage.setItem('speech-coach-active-local-owner', 'user-b')
    assert.equal(readBaselineProfile(), null)
    saveBaselineProfile(profile(82))

    global.localStorage.setItem('speech-coach-active-local-owner', 'user-a')
    assert.equal(readBaselineProfile().overall, 61)
    global.localStorage.setItem('speech-coach-active-local-owner', 'user-b')
    assert.equal(readBaselineProfile().overall, 82)
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})

test('clearing baseline only removes the active account baseline', () => {
  const previousStorage = global.localStorage
  global.localStorage = createStorage({
    'speech-coach-active-local-owner': 'user-a',
    'speech-coach-user-baseline:user-a': JSON.stringify(profile(55)),
    'speech-coach-user-baseline:user-b': JSON.stringify(profile(85)),
  })
  try {
    clearBaselineProfile({ notify: false })
    assert.equal(global.localStorage.getItem('speech-coach-user-baseline:user-a'), null)
    assert.ok(global.localStorage.getItem('speech-coach-user-baseline:user-b'))
  } finally {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
  }
})
