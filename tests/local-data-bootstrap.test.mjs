import test from 'node:test'
import assert from 'node:assert/strict'

import { LOCAL_HISTORY_KEYS, normalizeLocalHistoryStores } from '../src/localDataBootstrap.js'

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

test('valid history arrays are preserved', () => {
  const storage = createStorage({
    'speech-coach-history': JSON.stringify([{ id: 'solo-1' }]),
    'speech-coach-dialog-history': '[]',
    'speech-coach-audio-history': JSON.stringify([{ id: 'audio-1' }]),
  })

  const result = normalizeLocalHistoryStores(storage)
  assert.deepEqual(result.repaired, [])
  assert.equal(JSON.parse(storage.getItem('speech-coach-history')).length, 1)
  assert.equal(JSON.parse(storage.getItem('speech-coach-audio-history')).length, 1)
})

test('invalid JSON and non-array history values are repaired', () => {
  const storage = createStorage({
    'speech-coach-history': '{broken',
    'speech-coach-dialog-history': JSON.stringify({ id: 'legacy-object' }),
    'speech-coach-audio-history': 'null',
  })

  const result = normalizeLocalHistoryStores(storage)
  assert.deepEqual(new Set(result.repaired), new Set(LOCAL_HISTORY_KEYS))
  for (const key of LOCAL_HISTORY_KEYS) assert.deepEqual(JSON.parse(storage.getItem(key)), [])
})

test('missing history keys are not created', () => {
  const storage = createStorage()
  const result = normalizeLocalHistoryStores(storage)
  assert.deepEqual(result.repaired, [])
  for (const key of LOCAL_HISTORY_KEYS) assert.equal(storage.getItem(key), null)
})
